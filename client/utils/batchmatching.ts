import { getRouteInfo } from "./osrm"; // 既存のOSRM関数があればインポート、なければ下のモックを使用
import { supabase } from "./supabase"; // あなたのプロジェクトのパスに合わせてください

// ==========================================
//  1. 設定値 (コンフィグ)
// ==========================================
// Norun(0.5)より厳しい基準。これを超えないと即決しない。
const S_RANK_THRESHOLD = 0.8;
// 妥協ライン。締め切り直前ならこのスコアでも手を打つ。
const B_RANK_THRESHOLD = 0.5;
// 出発の何分前になったら妥協して確定させるか
const DEADLINE_MINUTES = 60;
// バッチ処理の実行間隔 (ミリ秒) -> 5分
const INTERVAL_MS = 5 * 60 * 1000;

// スコアの重み
const WEIGHT_TIME = 0.7;
const WEIGHT_ROUTE = 0.3;

// 物理的な足切りライン
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
};

// ==========================================
//  3. 比較アルゴリズム本体 (判定ロジック)
// ==========================================
export const findBatchMatch = async (
  request: RequestData,
  currentUserId: string,
): Promise<BatchMatchResult> => {
  // 1. 候補者取得 ('active' と 'pooling' の両方を対象にする)
  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*, user:users!user_id(nickname, username)")
    .in("status", ["active", "pooling"])
    .eq("target_date", request.targetDate)
    .neq("user_id", currentUserId);

  if (error || !candidates || candidates.length === 0) {
    return { status: "failed", message: "候補者がいません" };
  }

  let bestCandidate: any = null;
  let bestScore = -1;

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
    // ※ getRouteInfoが未実装の場合は、下のモック関数を使ってください
    const routeInfo = await getRouteInfo(
      request.departure,
      request.destination,
      { lat: candidate.dep_lat, lng: candidate.dep_lng },
      { lat: candidate.dest_lat, lng: candidate.dest_lng },
    );

    if (!routeInfo) {
      continue;
    }

    const isEfficient =
      routeInfo.timeLoss <= ALLOWED_TIME_LOSS_MINUTES ||
      (routeInfo.timeLoss <= MAX_TIME_LOSS_MINUTES &&
        routeInfo.detourRatio <= MAX_DETOUR_RATIO);

    if (!isEfficient) {
      continue;
    }

    // --- スコア計算 ---
    const timeScore =
      maxTolerance === 0 ? 1 : Math.max(0, 1 - timeDiff / maxTolerance);
    // 迂回率1.0(完璧)なら100点、1.6(限界)なら0点とする
    const routeScore = Math.max(0, 1 - (routeInfo.detourRatio - 1) / 0.6);

    const totalScore = timeScore * WEIGHT_TIME + routeScore * WEIGHT_ROUTE;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCandidate = candidate;
    }
  }

  // 3. 判定ロジックの分岐 (Comparison Algorithmの中核)
  if (!bestCandidate) {
    return { status: "failed", message: "条件に合う相手がいません" };
  }

  // --- A. Sランク即決 ---
  if (bestScore >= S_RANK_THRESHOLD) {
    return {
      status: "matched",
      partnerReservation: bestCandidate,
      score: bestScore,
      message: "Sランク即決",
    };
  }

  // --- B. デッドライン妥協 ---
  const now = new Date();
  // 日付またぎ等は簡易化しています。必要に応じて正確なDate生成を行ってください
  const departureDate = new Date(
    `${request.targetDate}T${request.departureTime}`,
  );
  const minutesUntilDeparture =
    (departureDate.getTime() - now.getTime()) / 1000 / 60;

  if (
    minutesUntilDeparture <= DEADLINE_MINUTES &&
    bestScore >= B_RANK_THRESHOLD
  ) {
    return {
      status: "matched",
      partnerReservation: bestCandidate,
      score: bestScore,
      message: "デッドライン妥協",
    };
  }

  // --- C. 保留 (Pooling) ---
  return { status: "pooling", score: bestScore, message: "待機中" };
};

// ==========================================
//  4. 定期実行スケジューラー (setInterval版)
// ==========================================
export const startBatchSimulation = () => {
  console.log(
    `🧪 [比較実験] バッチシミュレーションを開始しました (間隔: ${INTERVAL_MS / 1000}秒)`,
  );

  // 初回即実行したければここで executeBatch() を呼ぶ

  setInterval(async () => {
    await executeBatch();
  }, INTERVAL_MS);
};

// 実際のバッチ処理内容
const executeBatch = async () => {
  console.log("⏰ [Batch] 保留ユーザーの再マッチング処理を実行中...");

  // 1. 保留中のユーザーを取得
  const { data: poolingUsers, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("status", "pooling");

  if (error || !poolingUsers || poolingUsers.length === 0) {
    console.log("   -> 保留中のユーザーはいません。");
    return;
  }

  console.log(`   -> ${poolingUsers.length}人の保留ユーザーを再評価します。`);

  // 二重マッチングを防ぐためのセット
  const matchedIdsInThisLoop = new Set<string>();

  // 2. 一人ずつ再計算
  for (const reservation of poolingUsers) {
    // 既にこのループで誰かとマッチしてしまった場合はスキップ
    if (matchedIdsInThisLoop.has(reservation.id)) {
      continue;
    }

    // リクエスト形式に変換
    const requestData: RequestData = {
      departure: {
        name: "current",
        lat: reservation.dep_lat,
        lng: reservation.dep_lng,
      },
      destination: {
        name: "dest",
        lat: reservation.dest_lat,
        lng: reservation.dest_lng,
      },
      targetDate: reservation.target_date,
      departureTime: reservation.start_time,
      tolerance: reservation.tolerance,
    };

    // ★ここで判定ロジックを再利用
    const result = await findBatchMatch(requestData, reservation.user_id);

    // 3. マッチした場合のみDB更新
    if (result.status === "matched" && result.partnerReservation) {
      const partner = result.partnerReservation;

      // 相手が既にこのループで埋まっていないか確認
      if (matchedIdsInThisLoop.has(partner.id)) {
        console.log(
          `   ⚠️ タッチの差で相手(${partner.id})が埋まっていました。スキップします。`,
        );
        continue;
      }

      console.log(
        `   🎉 [Match] ${reservation.user_id} & ${partner.user_id} (Score: ${result.score?.toFixed(2)}) - ${result.message}`,
      );

      // DB更新: 自分
      await supabase
        .from("reservations")
        .update({ status: "matched", partner_id: partner.user_id })
        .eq("id", reservation.id);

      // DB更新: 相手
      await supabase
        .from("reservations")
        .update({ status: "matched", partner_id: reservation.user_id })
        .eq("id", partner.id);

      // 処理済みリストに追加
      matchedIdsInThisLoop.add(reservation.id);
      matchedIdsInThisLoop.add(partner.id);
    }
    // poolingのままなら何もしない（次のループでまた評価される）
  }

  console.log("✅ [Batch] 処理完了");
};

// ==========================================
//  ヘルパー関数
// ==========================================
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// (もしgetRouteInfoがない場合のダミーモック)
// 実際には osrm.ts のものをインポートしてください
/*
async function getRouteInfo(dep1: any, dest1: any, dep2: any, dest2: any) {
    // 全て合格として返すダミー
    return { timeLoss: 3, detourRatio: 1.2, distance: 5000 };
}
*/
