
import { describe, it, expect, vi, beforeEach } from "vitest";
import { findBestMatch } from "./matching";

//実行コマンド
// npx vitest run 
// client/utils/matching.test.ts

// OSRM
const mockGetRouteInfo = vi.fn();
vi.mock("./osrm", () => ({
  getRouteInfo: (...args: any[]) => mockGetRouteInfo(...args),
}));

// Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockNeq = vi.fn();
const mockFrom = vi.fn();

vi.mock("./supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

// --- テストデータのヘルパー ---

const mockRequest: any = {
  departure: { name: "UserHome", lat: 35.0, lng: 139.0 },
  destination: { name: "UserWork", lat: 35.1, lng: 139.1 },
  targetDate: "2025-01-01",
  departureTime: "09:00",
  tolerance: 30, // 許容範囲 30分
};

const currentUserId = "user-me";

// 候補者データを簡単に作成するためのヘルパー関数
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
    
    // Supabaseのメソッドチェーンのモック設定
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq });
    
    // 実際のコード: .from(...).select(...).eq(...).eq(...).neq(...)
    mockFrom.mockImplementation(() => ({
       select: () => ({
         eq: () => ({  // status
           eq: () => ({ // target_date
             neq: mockNeq // user_id -> Promiseの結果を返す
           })
         })
       })
    }));
  });

  it("DBに候補者が見つからない場合、falseを返すべき", async () => {
    mockNeq.mockResolvedValue({ data: [], error: null });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
    expect(result.message).toContain("待機中のユーザーがいません");
  });

  it("許容時間範囲外の候補者をスキップすべき", async () => {
    const candidate = createCandidate(
      "c1",
      "10:00", // 1時間の差 (60分) > リクエストの許容範囲 (30分)
      15, // 候補者の許容範囲
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );
    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
    expect(result.message).toBe("条件に合う相手がいません");
    // ログの検証、またはOSRMが呼び出されていないことを確認すべき
    expect(mockGetRouteInfo).not.toHaveBeenCalled();
  });

  it("特例のロス時間チェック (<= 5分) を通過する場合、マッチすべき", async () => {
    // 両方09:00開始、時間差なし
    const candidate = createCandidate(
      "c_special",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );
    
    mockNeq.mockResolvedValue({ data: [candidate], error: null });
    
    // OSRMのモック
    // 単独: 10分 (600秒)
    // 相乗り: 14分 (840秒) -> ロス4分, 倍率1.4
    // ロス <= 5分 -> 特例合格
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 600, distance: 1000 }) // Candidate Solo
      .mockResolvedValueOnce({ duration: 840, distance: 1400 }); // Shared

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c_special");
  });

  it("通常チェック (ロス <= 10分 かつ 倍率 <= 1.6倍) を通過する場合、マッチすべき", async () => {
    const candidate = createCandidate(
      "c_normal",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );

    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    // 単独: 20分 (1200秒)
    // 相乗り: 29分 (1740秒) -> ロス9分, 倍率1.45
    // ロス <= 10分 かつ 倍率 <= 1.6 -> 通常合格
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 1200, distance: 2000 })
      .mockResolvedValueOnce({ duration: 1740, distance: 2900 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c_normal");
  });

  it("効率性チェックに失敗する場合 (ロスが大きい)、拒否すべき", async () => {
    const candidate = createCandidate(
      "c_fail",
      "09:00",
      30,
      { lat: 35.0, lng: 139.0 },
      { lat: 35.1, lng: 139.1 }
    );

    mockNeq.mockResolvedValue({ data: [candidate], error: null });

    // 単独: 10分 (600秒)
    // 相乗り: 25分 (1500秒) -> ロス15分 (不合格), 倍率2.5 (不合格)
    mockGetRouteInfo
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 1500, distance: 2500 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(false);
  });

  it("最もスコアの高い候補者を選択すべき", async () => {
    // c1: 時間が完全に一致し、ルートも非常に効率的
    const c1 = createCandidate("c1", "09:00", 30, { lat: 35.0, lng: 139.0 }, { lat: 35.1, lng: 139.1 });
    // c2: わずかに時間差があり、ルート効率が低い
    const c2 = createCandidate("c2", "09:15", 30, { lat: 35.0, lng: 139.0 }, { lat: 35.1, lng: 139.1 });

    mockNeq.mockResolvedValue({ data: [c1, c2], error: null });

    // c1の計算:
    // 単独: 600秒, 相乗り: 660秒 (ロス1分, 倍率1.1)
    // 時間スコア: 1.0 (差0)
    // ルートスコア: ~0.83 (倍率1.1)
    
    // c2の計算:
    // 単独: 600秒, 相乗り: 900秒 (ロス5分, 倍率1.5)
    // 時間スコア: 0.5 (差15分 / 許容30分)
    // ルートスコア: ~0.16 (倍率1.5)

    mockGetRouteInfo
      // c1の呼び出し
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 660, distance: 1100 })
      // c2の呼び出し
      .mockResolvedValueOnce({ duration: 600, distance: 1000 })
      .mockResolvedValueOnce({ duration: 900, distance: 1500 });

    const result = await findBestMatch(mockRequest, currentUserId);

    expect(result.isMatch).toBe(true);
    expect(result.partnerReservation.id).toBe("c1");
    // スコアロジックを間接的に検証
    expect(result.score).toBeGreaterThan(0.8); 
  });
});
