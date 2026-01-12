
import { describe, it, expect, vi, beforeEach } from "vitest";
import { findBestMatch } from "./matching";

// --- Mocks ---

// Mock OSRM
const mockGetRouteInfo = vi.fn();
vi.mock("./osrm", () => ({
  getRouteInfo: (...args: any[]) => mockGetRouteInfo(...args),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockFrom = vi.fn();

vi.mock("./supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// --- Test Data Helpers ---

const mockRequest: any = {
  departure: { name: "UserHome", lat: 35.0, lng: 139.0 },
  destination: { name: "UserWork", lat: 35.1, lng: 139.1 },
  targetDate: "2025-01-01",
  departureTime: "09:00",
  tolerance: 30, // 30 min tolerance
};

const currentUserId = "user-me";

// Helpers to quickly create candidates
const createCandidate = (
  id: string,
  startTime: string,
  tolerance: number,
  start: { lat: number; lng: number },
  goal: { lat: number; lng: number }
) => ({
  id,
  user: { username: `user-${id}` },
  start_time: startTime,
  tolerance,
  departure_lat: start.lat,
  departure_lng: start.lng,
  destination_lat: goal.lat,
  destination_lng: goal.lng,
});

describe("findBestMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase chain mocks
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq }); // Chained eq
    // Last eq returns neq
    // (In the real code: .eq().eq().neq())
    // We need to implement the chain properly.
    // The code is: .from().select().eq().eq().neq()
    
    // Correct chain:
    const neqReturn = { data: [], error: null };
    mockNeq.mockResolvedValue(neqReturn);
    
    const eqReturn2 = { neq: mockNeq };
    const eqReturn1 = { eq: () => eqReturn2 }; // 2nd eq
    mockSelect.mockReturnValue({ eq: () => eqReturn1 }); // 1st eq
    
    // Wait, the chaining in code is:
    // .select(...)
    // .eq("status", "active")
    // .eq("target_date", request.targetDate)
    // .neq("user_id", currentUserId)
    
    // Let's refine the mock structure to be more robust
    mockFrom.mockImplementation(() => ({
       select: () => ({
         eq: () => ({  // status
           eq: () => ({ // target_date
             neq: mockNeq // user_id -> returns promise result
           })
         })
       })
    }));
  });

  it("should return false if no candidates are found in DB", async () => {
    mockNeq.mockResolvedValue({ data: [], error: null });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
    expect(result.message).toContain("待機中のユーザーがいません");
  });

  it("should skip candidates outside acceptable time range", async () => {
    const candidate = createCandidate(
      "c1",
      "10:00", // 1 hour difference (60 mins) > request tolerance (30 mins)
      15, // candidate tolerance
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );
    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
    expect(result.message).toBe("条件に合う相手がいません");
    // Should verify log or that OSRM was not called
    expect(mockGetRouteInfo).not.toHaveBeenCalled();
  });

  it("should match if candidate passes special time loss check (<= 5 min)", async () => {
    // Both start at 09:00, no time diff
    const candidate = createCandidate(
      "c_special",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );
    
    mockNeq.mockResolvedValue({ data: [candidate], error: null });
    
    // Mock OSRM
    // Solo: 10 mins (600s)
    // Shared: 14 mins (840s) -> Loss 4 mins, Ratio 1.4
    // Loss <= 5 min -> Special Pass
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 600, distance: 1000 }) // Candidate Solo
      .mockResolvedValueOnce({ duration: 840, distance: 1400 }); // Shared

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c_special");
  });

  it("should match if candidate passes normal check (<= 10 min loss AND <= 1.6x ratio)", async () => {
    const candidate = createCandidate(
      "c_normal",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );

    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    // Solo: 20 mins (1200s)
    // Shared: 29 mins (1740s) -> Loss 9 mins, Ratio 1.45
    // Loss <= 10 min AND Ratio <= 1.6 -> Normal Pass
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 1200, distance: 2000 })
      .mockResolvedValueOnce({ duration: 1740, distance: 2900 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c_normal");
  });

  it("should reject if efficient check fails (High Loss)", async () => {
    const candidate = createCandidate(
      "c_fail",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );

    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    // Solo: 10 mins (600s)
    // Shared: 25 mins (1500s) -> Loss 15 mins (Fail), Ratio 2.5 (Fail)
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 1500, distance: 2500 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
  });

  it("should pick the best score candidate", async () => {
    // c1: Perfect time match for user, very efficient route
    const c1 = createCandidate("c1", "09:00", 30, { lat: 35.0, lng: 139.0 }, { lat: 35.1, lng: 139.1 });
    // c2: Slight time diff, less efficient route
    const c2 = createCandidate("c2", "09:15", 30, { lat: 35.0, lng: 139.0 }, { lat: 35.1, lng: 139.1 });

    mockNeq.mockResolvedValue({ data: [c1, c2], error: null });

    // c1 Calculations:
    // Solo: 600s, Shared: 660s (Loss 1min, Ratio 1.1)
    // Time Score: 1.0 (diff 0)
    // Route Score: ~0.83 (Ratio 1.1)
    
    // c2 Calculations:
    // Solo: 600s, Shared: 900s (Loss 5min, Ratio 1.5)
    // Time Score: 0.5 (diff 15min / 30min tolerance)
    // Route Score: ~0.16 (Ratio 1.5)

    mockGetRouteInfo
      // c1 calls
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 660, distance: 1100 })
      // c2 calls
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 900, distance: 1500 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c1");
    // Verify scores logic indirectly
    expect(result.score).toBeGreaterThan(0.8); 
  });
});
