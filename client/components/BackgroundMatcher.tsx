import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { findBestMatch } from "../utils/matching";
import { supabase } from "../utils/supabase";

export const BackgroundMatcher = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const isProcessing = useRef(false); // 重複実行防止

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const checkMatch = async () => {
      if (isProcessing.current) {
        return;
      }
      isProcessing.current = true;

      try {
        // 1. 自分が「待機中(active)」か確認
        const { data: myReservations } = await supabase
          .from("reservations")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active");

        // 待機中の予約がなければ何もしない
        if (!myReservations || myReservations.length === 0) {
          isProcessing.current = false;
          return;
        }

        // 2. 待機中の予約ごとに、相手がいないか再検索
        for (const myRes of myReservations) {
          // マッチングロジックに必要なデータ形式に変換
          const requestData = {
            departure: {
              name: myRes.departure_location,
              lat: myRes.departure_lat,
              lng: myRes.departure_lng,
            },
            destination: {
              name: myRes.destination_location,
              lat: myRes.destination_lat,
              lng: myRes.destination_lng,
            },
            targetDate: myRes.target_date,
            departureTime: myRes.start_time,
            tolerance: myRes.tolerance,
          };

          // 再検索実行！
          // (ここで自分自身を除外する設定にしていても、相手(Active)がいれば見つかります)
          const result = await findBestMatch(requestData, user.id);

          if (result.isMatch) {
            console.log("⚡ バックグラウンドでマッチング成立！");

            // 自分の古い待機データを削除（または無効化）して、提案ページへ
            // ※提案ページで「承認」すると新規データを作るため、今のActiveは消しておくのが安全
            await supabase.from("reservations").delete().eq("id", myRes.id);

            alert(
              "待機中に新しいパートナーが見つかりました！\n詳細確認ページへ移動します。",
            );

            navigate({
              to: "/match-proposal",
              state: {
                proposal: result,
                requestData: requestData,
              },
            });

            // 1つ見つかったらループ終了（画面遷移するため）
            break;
          }
        }
      } catch (e) {
        console.error("Background match error:", e);
      } finally {
        isProcessing.current = false;
      }
    };

    // 5秒ごとにチェック (ポーリング)
    const intervalId = setInterval(checkMatch, 5000);

    // 初回も実行
    checkMatch();

    return () => clearInterval(intervalId);
  }, [user, isLoaded, navigate]);

  return null; // 画面には何も表示しない
};
