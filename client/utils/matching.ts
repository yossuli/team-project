import { getRouteInfo } from "./osrm";
import { supabase } from "./supabase";

// 型定義
type Coordinate = { lat: number; lng: number };

type RequestData = {
  departure: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  departureTime: string; // "09:00"
  tolerance: number; // 分 (例: 30)
};

type MatchResult = {
  isMatch: boolean;
  partnerReservation?: any; // マッチした相手の予約データ
  score?: number; // 満足度スコア
  sharedRouteInfo?: any; // 相乗り時のルート情報
  message: string;
};

/**
 * メインのマッチング関数
 */
export const findBestMatch = async (
  request: RequestData,
  currentUserId: string,
): Promise<MatchResult> => {
  console.log("🔍 マッチング開始...", request);

  // 1. 【粗いフィルタリング】
  // まずはDBから「ステータスがactive」かつ「自分以外」の予約を取得
  // ※ 本来はここで「時刻」や「大まかな距離」でDB側フィルタリングをかけるべきですが、
  //    まずは全件取得してJS側でフィルタリングします（データ量が少ない想定）
  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*, user:users(nickname, icon_image_url)")
    .eq("status", "active")
    .neq("user_id", currentUserId);

  if (error || !candidates || candidates.length === 0) {
    return {
      isMatch: false,
      message: "候補となる予約が見つかりませんでした (DB空)",
    };
  }

  // 候補をループして、詳細なスコア計算を行う
  let bestCandidate: any = null;
  let bestScore = -1;
  let bestRouteInfo: any = null;

  // API制限を防ぐため、座標距離で近い上位N件だけに絞る処理を入れると良い
  // 今回は簡易的に全件チェックします

  for (const candidate of candidates) {
    // --- A. 時刻のズレチェック ---
    // (簡易実装: 文字列 "09:00" を分に変換して比較)
    const reqMin = timeToMinutes(request.departureTime);
    const canMin = timeToMinutes(candidate.start_time);
    const timeDiff = Math.abs(reqMin - canMin);

    // 互いの許容範囲を超えていたら除外
    // (candidate.tolerance はDBにカラム追加済みと想定)
    const maxTolerance = Math.max(request.tolerance, candidate.tolerance || 0);
    if (timeDiff > maxTolerance) {
      continue; // 時間が合わないのでスキップ
    }

    // --- B. ルート計算 (OSRM API) ---
    // シナリオ: 「既存のドライバー(Candidate)が、新規ユーザー(Request)を拾って送る」
    // ルート: DriverStart -> UserStart -> UserGoal -> DriverGoal
    // ※ 実際は順序を入れ替えて最適化しますが、一旦この順序で計算します

    const driverStart = {
      lat: candidate.departure_lat,
      lng: candidate.departure_lng,
    };
    const driverGoal = {
      lat: candidate.destination_lat,
      lng: candidate.destination_lng,
    };
    const userStart = {
      lat: request.departure.lat,
      lng: request.departure.lng,
    };
    const userGoal = {
      lat: request.destination.lat,
      lng: request.destination.lng,
    };

    // 1. ドライバーの直行ルート (Solo)
    const driverSoloRoute = await getRouteInfo([driverStart, driverGoal]);
    // 2. 相乗りルート (Shared)
    const sharedRoute = await getRouteInfo([
      driverStart,
      userStart,
      userGoal,
      driverGoal,
    ]);

    if (!driverSoloRoute || !sharedRoute) {
      continue; // 計算失敗
    }

    // --- C. スコア計算 (ここを後で調整！) ---

    // (1) 時間スコア: ズレが小さいほど高得点 (最大1.0)
    // 許容範囲ギリギリだと0点、ズレなしなら1点
    const timeScore =
      maxTolerance === 0 ? 1 : Math.max(0, 1 - timeDiff / maxTolerance);

    // (2) 回り道スコア: 本来の時間 / 相乗り時間 (最大1.0)
    // 時間が2倍かかったら 0.5点
    const detourScore = driverSoloRoute.duration / sharedRoute.duration;

    // (3) 総合スコア (重み付け平均)
    // 例: 時間ズレよりも、回り道の方を重視する場合
    const totalScore = timeScore * 0.4 + detourScore * 0.6;

    console.log(`👤 候補: ${candidate.user?.nickname || "不明"}`, {
      timeDiff,
      timeScore,
      detourScore,
      totalScore,
    });

    // 暫定1位を更新
    // ※ ここに「足切りライン」を設けても良い (例: totalScore > 0.6 以上じゃないとマッチしない)
    if (totalScore > bestScore && totalScore > 0.4) {
      bestScore = totalScore;
      bestCandidate = candidate;
      bestRouteInfo = sharedRoute; // 地図表示用に取っておく
    }
  }

  // 結果を返す
  if (bestCandidate) {
    return {
      isMatch: true,
      partnerReservation: bestCandidate,
      score: bestScore,
      sharedRouteInfo: bestRouteInfo,
      message: `マッチング成功！ (スコア: ${bestScore.toFixed(2)})`,
    };
  } else {
    return { isMatch: false, message: "条件に合う相手が見つかりませんでした" };
  }
};

// ヘルパー: "HH:MM" を 分(number) に変換
function timeToMinutes(timeStr: string): number {
  if (!timeStr) {
    return 0;
  }
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
