import { getRouteInfo } from "./osrm.ts";
import { supabase } from "./supabase.ts";

// ==========================================
//  1. 設定値 (コンフィグ)
// ==========================================
const S_RANK_THRESHOLD = 0.8;
const B_RANK_THRESHOLD = 0.5;
const DEADLINE_MINUTES = 60;
const INTERVAL_MS = 5 * 60 * 1000; // 5分

const WEIGHT_TIME = 0.7;
const WEIGHT_ROUTE = 0.3;

const MAX_DETOUR_RATIO = 1.6;
const MAX_TIME_LOSS_MINUTES = 10;
const ALLOWED_TIME_LOSS_MINUTES = 5;

// ==========================================
//  2. 型定義
// ==========================================
type RequestData = {
  departure: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  targetDate: string;
  departureTime: string;
  tolerance: number;
};

type BatchMatchResult = {
  status: "matched" | "pooling" | "failed";
  partnerReservation?: any;
  score?: number;
  message: string;
  // ★追加: ログ保存で「どれくらい遠回りしたか」を記録するために返す
  sharedRouteInfo?: any;
  soloRouteInfo?: any;
};

// ==========================================
//  3. 比較アルゴリズム本体 (判定ロジック)
// ==========================================
export const findBatchMatch = async (
  request: RequestData,
  currentUserId: string,
): Promise<BatchMatchResult> => {
  // 1. 候補者取得
  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*")
    .in("status", ["active", "pooling"])
    .eq("target_date", request.targetDate)
    .neq("user_id", currentUserId);

  if (error || !candidates || candidates.length === 0) {
    return { status: "failed", message: "候補者がいません" };
  }

  let bestCandidate: any = null;
  let bestScore = -1;
  let bestRouteInfo: any = null; // 追加
  let bestSoloRouteInfo: any = null; // 追加

  // 2. スコア計算ループ
  for (const candidate of candidates) {
    // --- 時間整合性 ---
    const reqMin = timeToMinutes(request.departureTime);
    const canMin = timeToMinutes(candidate.start_time);
    const timeDiff = Math.abs(reqMin - canMin);
    const maxTolerance = Math.max(request.tolerance, candidate.tolerance || 0);

    if (timeDiff > maxTolerance) {
      continue;
    }

    // --- ルート効率 (OSRM) ---
    // ★修正: カラム名をDB定義(departure_lat等)に合わせました
    const driverStart = {
      lat: candidate.departure_lat,
      lng: candidate.departure_lng,
    };
    const driverGoal = {
      lat: candidate.destination_lat,
      lng: candidate.destination_lng,
    };

    // 1. ソロ移動
    const soloRoute = await getRouteInfo([driverStart, driverGoal]);
    // 2. 相乗り移動
    const sharedRoute = await getRouteInfo([
      driverStart,
      request.departure,
      request.destination,
      driverGoal,
    ]);

    if (!soloRoute || !sharedRoute) {
      continue;
    }

    const timeLossMin = (sharedRoute.duration - soloRoute.duration) / 60;
    const detourRatio = sharedRoute.duration / soloRoute.duration;

    const isEfficient =
      timeLossMin <= ALLOWED_TIME_LOSS_MINUTES ||
      (timeLossMin <= MAX_TIME_LOSS_MINUTES && detourRatio <= MAX_DETOUR_RATIO);

    if (!isEfficient) {
      continue;
    }

    // --- スコア計算 ---
    const timeScore =
      maxTolerance === 0 ? 1 : Math.max(0, 1 - timeDiff / maxTolerance);

    let routeScore = 0;
    if (detourRatio <= 1.0) {
      routeScore = 1.0;
    } else {
      routeScore = Math.max(
        0.1,
        (MAX_DETOUR_RATIO - detourRatio) / (MAX_DETOUR_RATIO - 1.0),
      );
    }

    const totalScore = timeScore * WEIGHT_TIME + routeScore * WEIGHT_ROUTE;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCandidate = candidate;
      bestRouteInfo = sharedRoute; // 保持
      bestSoloRouteInfo = soloRoute; // 保持
    }
  }

  // 3. 判定ロジックの分岐
  if (!bestCandidate) {
    return { status: "failed", message: "条件に合う相手がいません" };
  }

  // 共通の返却オブジェクト作成関数
  const createResult = (
    status: "matched" | "pooling",
    msg: string,
  ): BatchMatchResult => ({
    status,
    partnerReservation: bestCandidate,
    score: bestScore,
    message: msg,
    sharedRouteInfo: bestRouteInfo,
    soloRouteInfo: bestSoloRouteInfo,
  });

  // --- A. Sランク即決 ---
  if (bestScore >= S_RANK_THRESHOLD) {
    return createResult("matched", "Sランク即決");
  }

  // --- B. デッドライン妥協 ---
  const now = new Date();
  const departureDate = new Date(
    `${request.targetDate}T${request.departureTime}`,
  );
  const minutesUntilDeparture =
    (departureDate.getTime() - now.getTime()) / 1000 / 60;

  if (
    minutesUntilDeparture <= DEADLINE_MINUTES &&
    bestScore >= B_RANK_THRESHOLD
  ) {
    return createResult("matched", "デッドライン妥協");
  }

  // --- C. 保留 (Pooling) ---
  // poolingの時も、暫定1位のスコア情報は返しておくとログが見やすい
  return createResult("pooling", "待機中");
};

// ==========================================
//  4. 定期実行スケジューラー
// ==========================================
export const startBatchSimulation = () => {
  console.log(
    `🧪 [比較実験] バッチシミュレーションを開始しました (間隔: ${INTERVAL_MS / 1000}秒)`,
  );
  setInterval(async () => {
    await executeBatch();
  }, INTERVAL_MS);
};

// 実際のバッチ処理内容
const executeBatch = async () => {
  console.log("⏰ [Batch] 保留ユーザーの再マッチング処理を実行中...");

  const { data: poolingUsers, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("status", "pooling");

  if (error || !poolingUsers || poolingUsers.length === 0) {
    console.log("   -> 保留中のユーザーはいません。");
    return;
  }

  console.log(`   -> ${poolingUsers.length}人の保留ユーザーを再評価します。`);
  const matchedIdsInThisLoop = new Set<string>();

  for (const reservation of poolingUsers) {
    if (matchedIdsInThisLoop.has(reservation.id)) {
      continue;
    }

    // ★修正: カラム名をDB定義に合わせました
    const requestData: RequestData = {
      departure: {
        name: "current",
        lat: reservation.departure_lat,
        lng: reservation.departure_lng,
      },
      destination: {
        name: "dest",
        lat: reservation.destination_lat,
        lng: reservation.destination_lng,
      },
      targetDate: reservation.target_date,
      departureTime: reservation.start_time,
      tolerance: reservation.tolerance,
    };

    const result = await findBatchMatch(requestData, reservation.user_id);

    if (result.status === "matched" && result.partnerReservation) {
      const partner = result.partnerReservation;

      if (matchedIdsInThisLoop.has(partner.id)) {
        console.log(
          `   ⚠️ タッチの差で相手(${partner.id})が埋まっていました。スキップします。`,
        );
        continue;
      }

      console.log(
        `   🎉 [Match] ${reservation.user_id} & ${partner.user_id} (Score: ${result.score?.toFixed(2)}) - ${result.message}`,
      );

      // DB更新
      await supabase
        .from("reservations")
        .update({ status: "matched", partner_id: partner.user_id })
        .eq("id", reservation.id);
      await supabase
        .from("reservations")
        .update({ status: "matched", partner_id: reservation.user_id })
        .eq("id", partner.id);

      // ★ここ重要: evaluation_logs にも結果を書き込むと完璧です（今回は省略していますが、runner.ts側で検知できます）

      matchedIdsInThisLoop.add(reservation.id);
      matchedIdsInThisLoop.add(partner.id);
    }
  }
  console.log("✅ [Batch] 処理完了");
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr) {
    return 0;
  }
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
