import { getRouteInfo } from "./osrm.ts";
import { supabase } from "./supabase.ts";
// --- Norun アルゴリズム設定値 (地方自治体・短距離モデル) ---
// 1. スコア設定
const SCORE_THRESHOLD = 0.5; // 合格ライン (50点以上で即決)
const WEIGHT_TIME = 0.7;     // 時間の一致を重視 (70%)
const WEIGHT_ROUTE = 0.3;    // ルート効率は補佐的 (30%)
// 2. 効率性判定のしきい値
const SPECIAL_TIME_LOSS = 5;      // [特例] ロスが5分以内なら倍率は無視してOK (近距離救済)
const MAX_TIME_LOSS_NORMAL = 10;  // [通常] ロスは最大10分まで
const MAX_DETOUR_RATIO = 1.6;     // [通常] 倍率は最大1.6倍まで
// 型定義
type RequestData = {
  departure: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  targetDate: string;   // "2025-01-01"
  departureTime: string; // "09:00"
  tolerance: number;    // 分 (例: 15)
};
type MatchResult = {
  isMatch: boolean;
  partnerReservation?: any;
  score?: number;
  sharedRouteInfo?: any;
  soloRouteInfo?: any;
  message: string;
};
/**
 * Norun仕様に基づいたベストマッチ検索
 * 即時確定型 (Immediate Matching)
 */
export const findBestMatch = async (
  request: RequestData,
  currentUserId: string,
): Promise<MatchResult> => {
  console.log(":blue_car: --- Norun Matching Logic Start ---", request);
  // ---------------------------------------------------------
  // Step 1: データベースでの絞り込み (Premise Filter)
  // ---------------------------------------------------------
  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("status", "active")            // 待機中の人のみ
    .eq("target_date", request.targetDate) // 日付一致
    .neq("user_id", currentUserId);    // 自分以外
  if (error) {
    console.error(":x: DB Error:", error);
    return { isMatch: false, message: "DBエラー: " + error.message };
  }
  if (!candidates || candidates.length === 0) {
    console.warn(":warning: 候補が見つかりませんでした。");
    return { isMatch: false, message: "待機中のユーザーがいません" };
  }
  console.log(`:clipboard: 候補者数: ${candidates.length}人`);
  let bestCandidate: any = null;
  let bestScore = -1;
  let bestRouteInfo: any = null;
  let bestSoloRouteInfo: any = null;
  // ---------------------------------------------------------
  // Step 2 & 3: 個別候補の判定ループ
  // ---------------------------------------------------------
  for (const candidate of candidates) {
    const candidateName = candidate.user?.username || candidate.user?.nickname || "Unknown";
    console.log(`Checking candidate: ${candidate.id} (${candidateName})`);
    // --- A. 時間の整合性チェック (Time Consistency) ---
    const reqMin = timeToMinutes(request.departureTime);
    const canMin = timeToMinutes(candidate.start_time);
    const timeDiff = Math.abs(reqMin - canMin);
    
    // 許容範囲はお互いの広い方を採用
    const maxTolerance = Math.max(request.tolerance, candidate.tolerance || 0);
    if (timeDiff > maxTolerance) {
      console.log(`  -> :x: 時間範囲外 (差:${timeDiff}分 > 許容:${maxTolerance}分)`);
      continue;
    }
    // --- B. ルート計算 (OSRM API) ---
    // Candidate(Driver) が Request(User) を拾うルートを想定
    // Route: Driver発 -> User発 -> User着 -> Driver着
    const driverStart = { lat: candidate.departure_lat, lng: candidate.departure_lng };
    const driverGoal = { lat: candidate.destination_lat, lng: candidate.destination_lng };
    const userStart = { lat: request.departure.lat, lng: request.departure.lng };
    const userGoal = { lat: request.destination.lat, lng: request.destination.lng };
    // 1. ソロ移動 (基準)
    const driverSoloRoute = await getRouteInfo([driverStart, driverGoal]);
    // 2. 相乗り移動
    const sharedRoute = await getRouteInfo([driverStart, userStart, userGoal, driverGoal]);
    if (!driverSoloRoute || !sharedRoute) {
      console.log("  -> :x: ルート計算失敗");
      continue;
    }
    // --- C. ルート効率性判定 (Efficiency Check) ---
    const soloDuration = driverSoloRoute.duration; // 秒
    const sharedDuration = sharedRoute.duration;   // 秒
    
    // 分単位のロスと倍率
    const timeLossMin = (sharedDuration - soloDuration) / 60;
    const detourRatio = sharedDuration / soloDuration;
    let isEfficient = false;
    // 【仕様書通りのハイブリッド判定】
    // 条件A: 近場の特例 (ロスが5分以内なら、倍率は無視してOK)
    if (timeLossMin <= SPECIAL_TIME_LOSS) {
      isEfficient = true;
      console.log(`  -> :o:️ 特例合格 (Loss: ${timeLossMin.toFixed(1)}分)`);
    } 
    // 条件B: 通常判定 (ロス10分以内 かつ 倍率1.6倍以内)
    else if (timeLossMin <= MAX_TIME_LOSS_NORMAL && detourRatio <= MAX_DETOUR_RATIO) {
      isEfficient = true;
      console.log(`  -> :o:️ 通常合格 (Loss: ${timeLossMin.toFixed(1)}分, Ratio: ${detourRatio.toFixed(2)}x)`);
    }
    if (!isEfficient) {
      console.log(`  -> :x: 効率不足 (Loss: ${timeLossMin.toFixed(1)}分, Ratio: ${detourRatio.toFixed(2)}x)`);
      continue;
    }
    // ---------------------------------------------------------
    // Step 4: スコアリング (Scoring)
    // ---------------------------------------------------------
    
    // 1. 時間スコア (0.0 ~ 1.0)
    // 差が0分なら1.0, 許容限界なら0.0
    const timeScore = maxTolerance === 0 ? 1 : Math.max(0, 1 - (timeDiff / maxTolerance));
    // 2. ルートスコア (0.0 ~ 1.0)
    // 倍率が1.0なら1.0, 限界(MAX_DETOUR_RATIO)なら0.0
    // ※特例合格の場合は倍率が悪いことがあるので、最低点0.1を保証する
    let routeScore = 0;
    if (detourRatio <= 1.0) {
        routeScore = 1.0;
    } else {
        routeScore = Math.max(0.1, (MAX_DETOUR_RATIO - detourRatio) / (MAX_DETOUR_RATIO - 1.0));
    }
    // 3. 総合スコア (加重平均)
    const totalScore = (timeScore * WEIGHT_TIME) + (routeScore * WEIGHT_ROUTE);
    console.log(`  -> :bar_chart: Score: ${totalScore.toFixed(2)} (Time:${timeScore.toFixed(2)}, Route:${routeScore.toFixed(2)})`);
    // ベストスコア更新判定
    if (totalScore >= SCORE_THRESHOLD && totalScore > bestScore) {
      bestScore = totalScore;
      bestCandidate = candidate;
      bestRouteInfo = sharedRoute;
      bestSoloRouteInfo = driverSoloRoute;
    }
  }
  // ---------------------------------------------------------
  // 結果返却
  // ---------------------------------------------------------
  if (bestCandidate) {
    const partnerName = bestCandidate.user?.username || bestCandidate.user?.nickname || "Unknown";
    console.log(`:white_check_mark: マッチング成立! お相手: ${partnerName} (Score: ${bestScore.toFixed(2)})`);
    return {
      isMatch: true,
      partnerReservation: bestCandidate,
      score: bestScore,
      sharedRouteInfo: bestRouteInfo,
      soloRouteInfo: bestSoloRouteInfo,
      message: "マッチング成功",
    };
  } else {
    console.log(":x: 全員チェックしましたが、条件に合う相手がいませんでした。");
    return { isMatch: false, message: "条件に合う相手がいません" };
  }
};
// ヘルパー関数: "HH:MM" -> 分(number)
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}