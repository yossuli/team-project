import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { supabase } from "../utils/supabase";

export const DeadlineWatcher = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const checkDeadlines = async () => {
      // 1. アクティブな予約を取得
      const { data: reservations } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active"); // 待機中のものだけ

      if (!reservations || reservations.length === 0) {
        return;
      }

      const now = new Date();

      for (const res of reservations) {
        // 日付と時刻が未設定ならスキップ
        if (!res.target_date || !res.start_time) {
          continue;
        }

        // 予約日時を作成 (ブラウザのローカルタイムとして解釈)
        // 例: "2025-01-01" + "T" + "09:00" + ":00" -> 2025-01-01T09:00:00
        const targetDateTime = new Date(
          `${res.target_date}T${res.start_time}:00`,
        );

        // 締め切り時刻 = 出発の3時間前
        // getTime()はミリ秒なので、3 * 60 * 60 * 1000 を引く
        const deadline = new Date(
          targetDateTime.getTime() - 3 * 60 * 60 * 1000,
        );

        // 「現在時刻」が「締め切り」を過ぎていたらアウト
        if (now >= deadline) {
          // 2. アラートを表示 (どのページにいても出る)
          alert(
            `【マッチング失敗】\n\n` +
              `予約日時: ${res.target_date} ${res.start_time}\n\n` +
              `出発時刻の3時間前になりましたが、マッチング相手が見つかりませんでした。\n` +
              `このリクエストは自動的にキャンセルされます。`,
          );

          // 3. DBのステータスを 'failed' に更新 (これで次からアラートが出なくなる)
          await supabase
            .from("reservations")
            .update({ status: "failed" })
            .eq("id", res.id);

          // マイページなどを開いている場合にリストを更新させるため、リロードしても良いですが、
          // 一旦アラートだけで十分です。
          console.log(`Reservation ${res.id} marked as failed.`);
        }
      }
    };

    // コンポーネント配置時に1回実行
    checkDeadlines();

    // その後は1分ごとに定期チェック
    const intervalId = setInterval(checkDeadlines, 60 * 1000);

    // 画面遷移などでコンポーネントが消えるときにタイマー解除
    return () => clearInterval(intervalId);
  }, [user, isLoaded]);

  // このコンポーネント自体は画面に何も表示しない
  return null;
};
