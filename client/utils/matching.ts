import { getRouteInfo } from "./osrm";
import { supabase } from "./supabase";

// 型定義
type RequestData = {
  departure: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  targetDate: string; // "2025-01-01"
  departureTime: string; // "09:00"
  tolerance: number; // 分
};

type MatchResult = {
  isMatch: boolean;
  partnerReservation?: any;
  score?: number;
  sharedRouteInfo?: any;
  soloRouteInfo?: any;
  message: string;
};

export const findBestMatch = async (
  request: RequestData,
  currentUserId: string,
): Promise<MatchResult> => {
  console.log("🔍 --- マッチング開始 ---", request);

  // 1. 【足切りフィルタリング】
  // nickname に加えて username も取得
  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*, user:users!user_id(nickname, username, icon_image_url)")
    .eq("status", "active")
    .eq("target_date", request.targetDate);

  // エラーチェック
  if (error) {
    console.error("❌ DBエラー:", error);
    return { isMatch: false, message: "DBエラー発生: " + error.message };
  }

  // 候補が0人の場合
  if (!candidates || candidates.length === 0) {
    console.warn("⚠️ 候補が見つかりませんでした。誰も待機していません。");
    return { isMatch: false, message: "待機中のユーザーがいません" };
  }

  console.log(`📋 候補者数: ${candidates.length}人`);

  let bestCandidate: any = null;
  let bestScore = -100; // マイナスからスタート
  let bestRouteInfo: any = null;
  let bestSoloRouteInfo: any = null;

  for (const candidate of candidates) {
    console.log(
      `Checking candidate: ${candidate.id} (${candidate.user?.username || candidate.user?.nickname})`,
    );

    // --- IDチェック (自分自身を除外) ---
    // 👇 ここを有効化しました
    if (candidate.user_id === currentUserId) {
      console.log("  -> Skip: 自分自身です");
      continue;
    }

    // --- A. 時刻のズレチェック ---
    const reqMin = timeToMinutes(request.departureTime);
    const canMin = timeToMinutes(candidate.start_time);
    const timeDiff = Math.abs(reqMin - canMin);
    const maxTolerance = Math.max(request.tolerance, candidate.tolerance || 0);

    if (timeDiff > maxTolerance) {
      console.log(
        `  -> Skip: 時間がズレすぎています (Diff: ${timeDiff}m, Max: ${maxTolerance}m)`,
      );
      continue;
    }

    // --- B. ルート計算 (OSRM API) ---
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

    const driverSoloRoute = await getRouteInfo([driverStart, driverGoal]);
    const sharedRoute = await getRouteInfo([
      driverStart,
      userStart,
      userGoal,
      driverGoal,
    ]);

    if (!driverSoloRoute || !sharedRoute) {
      console.log("  -> Skip: ルート計算に失敗しました");
      continue;
    }

    // --- C. スコア計算 ---
    const timeScore =
      maxTolerance === 0 ? 1 : Math.max(0, 1 - timeDiff / maxTolerance);
    const detourScore = driverSoloRoute.duration / sharedRoute.duration;
    const totalScore = timeScore * 0.4 + detourScore * 0.6;

    console.log(`  -> Score: ${totalScore.toFixed(2)}`);

    // 暫定1位を更新
    if (totalScore > bestScore && totalScore > -1) {
      bestScore = totalScore;
      bestCandidate = candidate;
      bestRouteInfo = sharedRoute;
      bestSoloRouteInfo = driverSoloRoute;
    }
  }

  // 結果を返す
  if (bestCandidate) {
    const partnerName =
      bestCandidate.user?.username || bestCandidate.user?.nickname || "Unknown";
    console.log("✅ マッチング成功！相手:", partnerName);
    return {
      isMatch: true,
      partnerReservation: bestCandidate,
      score: bestScore,
      sharedRouteInfo: bestRouteInfo,
      soloRouteInfo: bestSoloRouteInfo,
      message: `マッチング成功！`,
    };
  } else {
    console.log(
      "❌ 全員の判定が終わりましたが、条件に合う人がいませんでした。",
    );
    return { isMatch: false, message: "条件不一致" };
  }
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr) {
    return 0;
  }
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
