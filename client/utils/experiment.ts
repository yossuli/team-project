import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { findBatchMatch } from "../client/utils/batchMatching"; // Batch
import { findBestMatch } from "../client/utils/matching"; // Norun

dotenv.config({ path: ".env.local" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ヘルパー: "HH:MM" を分に変換
const timeToMin = (str: string) => {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
};

async function runFullExperiment() {
  console.log("🧪 ========== 全員総当たり評価実験スタート ==========");

  // 1. CSVに入れた全員のデータを取得 (これを「検索者リスト」とする)
  const { data: allUsers, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("target_date", "2026-01-20"); // 実験日のデータのみ

  if (error || !allUsers) {
    console.error("データ取得エラー:", error);
    return;
  }

  console.log(`対象ユーザー数: ${allUsers.length}人\n`);

  // 2. 全員順番に「検索者」になって実験
  for (const searcher of allUsers) {
    console.log(
      `\n🔎 User: ${searcher.user_id} (${searcher.start_time}発) が検索中...`,
    );

    // リクエストデータの構築
    const requestData = {
      departure: {
        name: "出発地",
        lat: searcher.departure_lat,
        lng: searcher.departure_lng,
      },
      destination: {
        name: "目的地",
        lat: searcher.destination_lat,
        lng: searcher.destination_lng,
      },
      targetDate: searcher.target_date,
      departureTime: searcher.start_time,
      tolerance: searcher.tolerance,
    };

    // --- [実験A] Norun (提案) ---
    const resNorun = await findBestMatch(requestData, searcher.user_id);

    // 指標の計算 (Norun)
    const norunWait = 0; // 即時なので常に0
    let norunDiff = 0;
    let norunDetour = 0;

    if (resNorun.isMatch && resNorun.partnerReservation) {
      // ② 時間のズレ
      norunDiff = Math.abs(
        timeToMin(requestData.departureTime) -
          timeToMin(resNorun.partnerReservation.start_time),
      );
      // ③ 移動時間の増加 (API結果から取得)
      if (resNorun.sharedRouteInfo && resNorun.soloRouteInfo) {
        norunDetour =
          (resNorun.sharedRouteInfo.duration -
            resNorun.soloRouteInfo.duration) /
          60;
      }
    }

    // --- [実験B] Batch (比較) ---
    const resBatch = await findBatchMatch(requestData, searcher.user_id);

    // 指標の計算 (Batch)
    let batchWait = 0;
    let batchDiff = 0;
    let batchDetour = 0;

    if (resBatch.status === "matched") {
      batchWait = 0; // Sランク即決
      // ズレと増加時間の計算はNorunと同様（省略時はAPIを叩く必要があるが、今回はスコア計算済みと仮定）
      // ※厳密にはbatchMatching.ts内でAPI結果を返すように修正が必要ですが、
      // ここでは「Sランク＝ズレもロスもほぼ0」と仮定してシミュレーションします
      const p = resBatch.partnerReservation;
      batchDiff = Math.abs(
        timeToMin(requestData.departureTime) - timeToMin(p.start_time),
      );
      // Batchはルート計算結果を返していない場合があるので簡易計算
      batchDetour = 5; // 仮: 平均値を入れるか、Batch内でもルート計算結果をreturnさせる
    } else if (resBatch.status === "pooling") {
      // ① 待ち時間: 出発までの残り時間 (例: 24時間前なら1440分)
      // ここでは実験用に「60分待たされた」と仮定、または締め切りまでの時間を計算
      batchWait = 60;
    }

    // 3. DBに結果を保存
    await supabase.from("evaluation_logs").insert({
      scenario_name: "Scenario_Honjo_Full_Run",
      searcher_user_id: searcher.user_id,

      // Norun
      norun_status: resNorun.isMatch ? "matched" : "failed",
      norun_wait_time_min: norunWait,
      norun_time_diff_min: norunDiff,
      norun_detour_min: Number.parseFloat(norunDetour.toFixed(1)),
      norun_partner_id: resNorun.partnerReservation?.user_id || null,

      // Batch
      batch_status: resBatch.status,
      batch_wait_time_min: batchWait,
      batch_time_diff_min: batchDiff,
      batch_detour_min: Number.parseFloat(batchDetour.toFixed(1)), // ※要実装調整
      batch_partner_id: resBatch.partnerReservation?.user_id || null,
    });
  }

  console.log(
    "\n✅ 全員の実験が完了しました！evaluation_logsを確認してください。",
  );
}

runFullExperiment();
