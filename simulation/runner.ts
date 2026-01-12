import { findBatchMatch } from "../client/utils/batchmatching.ts";
import { findBestMatch } from "../client/utils/matching.ts";
import { supabase } from "../client/utils/supabase.ts";

// 実験設定
const INTERVAL_MS = 5 * 60 * 1000;

export const startBatchSimulation = () => {
  console.log(`🧪 [比較実験] 全員総当たりシミュレーションを開始します...`);

  // 起動時に1回だけ全実行する
  runFullScenario();

  // 定期実行は今回不要なのでコメントアウトしてもOKですが、残しておきます
  // setInterval(runFullScenario, INTERVAL_MS);
};

const runFullScenario = async () => {
  console.log("\n🧪 ========== 全員一斉評価スタート ==========");

  // 1. CSVで入れた実験用ユーザー(candidate_...)を全員取得
  // user_id が 'candidate_' で始まる人を取得
  const { data: allUsers, error } = await supabase
    .from("reservations")
    .select("*")
    // ※ LIKE検索が使えない場合は、CSVのIDを配列で指定する方法もありますが、
    // ここでは全てのレコードを取得してJS側でフィルタリングします
    .order("user_id");

  if (error || !allUsers) {
    console.error("❌ ユーザー取得エラー:", error);
    return;
  }

  // 実験対象者だけに絞る（simulation_user または candidate_ で始まる人）
  const targets = allUsers.filter((u) => u.user_id.startsWith("scenario_"));

  console.log(`📋 実験対象人数: ${targets.length}人`);

  // 2. 全員順番に回す
  for (const searcher of targets) {
    console.log(`\n🔎 [User: ${searcher.user_id}] 実験開始...`);

    const requestData = {
      departure: {
        name: "current",
        lat: searcher.departure_lat,
        lng: searcher.departure_lng,
      },
      destination: {
        name: "dest",
        lat: searcher.destination_lat,
        lng: searcher.destination_lng,
      },
      targetDate: searcher.target_date,
      departureTime: searcher.start_time,
      tolerance: searcher.tolerance,
    };

    try {
      // --- Norun ---
      const startNorun = performance.now();
      const resultNorun = await findBestMatch(requestData, searcher.user_id);
      const endNorun = performance.now();

      // Norun Detour計算 (ダミーデータなので適当な値が入ります)
      let norunDetour = 0;
      if (resultNorun.sharedRouteInfo && resultNorun.soloRouteInfo) {
        norunDetour =
          (resultNorun.sharedRouteInfo.duration -
            resultNorun.soloRouteInfo.duration) /
          60;
      }

      // --- Batch ---
      const startBatch = performance.now();
      const resultBatch = await findBatchMatch(requestData, searcher.user_id);
      const endBatch = performance.now();

      let batchDetour = 0;
      if (resultBatch.sharedRouteInfo && resultBatch.soloRouteInfo) {
        batchDetour =
          (resultBatch.sharedRouteInfo.duration -
            resultBatch.soloRouteInfo.duration) /
          60;
      }

      // --- ログ保存 ---
      await supabase.from("evaluation_logs").insert({
        scenario_name: "Final_Scenario_20Users",
        searcher_user_id: searcher.user_id,

        // Norun
        norun_status: resultNorun.isMatch ? "matched" : "failed",
        norun_score: resultNorun.score || 0,
        norun_calc_time_ms: endNorun - startNorun,
        norun_detour_min: norunDetour,
        norun_wait_time_min: 0, // 即時

        // Batch
        batch_status: resultBatch.status,
        batch_score: resultBatch.score || 0,
        batch_calc_time_ms: endBatch - startBatch,
        batch_detour_min: batchDetour,
        batch_wait_time_min: resultBatch.status === "pooling" ? 60 : 0,
      });

      console.log(
        `   ✅ 完了: Norun=${resultNorun.isMatch ? "O" : "X"}, Batch=${resultBatch.status}`,
      );
    } catch (err) {
      console.error(`   ❌ エラー (${searcher.user_id}):`, err);
    }
  }

  console.log(
    "\n🏁 全員の実験が終了しました！evaluation_logsを確認してください。",
  );
};

startBatchSimulation();
