"use client";

import { useClerk, useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex, Grid, Box } from "@ss/jsx";
import { Link, createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/mypage")({
  component: MyPage,
});

// 予約データの型定義
type Reservation = {
  id: number;
  target_date: string;
  start_time: string;
  departure_location: string;
  destination_location: string;
  status: string;
  partner_id?: string;
  route_info?: any;
  partner?: {
    username: string;
    nickname: string;
    icon_image_url: string;
  };
};

// 日時が過去かどうかを判定するヘルパー関数
const isPast = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return false;
  const target = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  return target < now;
};

function MyPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const navigate = useNavigate();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 通知用モーダル管理
  const [notificationItem, setNotificationItem] = useState<Reservation | null>(null);
  const notifiedIds = useRef<Set<number>>(new Set());

  // --- データの分類 ---
  // 1. 承認待ち（誰かから申請が来た！）
  const pendingApprovals = reservations.filter(r => r.status === "approval_pending");
  // 2. 返答待ち（自分が申請して返事待ち）
  const waitingResponse = reservations.filter(r => r.status === "waiting_approval");
  // 3. 待機中（自分が1人目で待っている）
  const activeList = reservations.filter(r => r.status === "active");

  // 4. マッチング確定済み（未来のみ表示、過去は別ページへ）
  const allMatched = reservations.filter(r => r.status === "matched");
  const upcomingMatches = allMatched.filter(r => !isPast(r.target_date, r.start_time));

  const handleEditProfile = () => {
    clerk.openUserProfile();
  };

  const fetchReservations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`*, partner:users!partner_id(username, nickname, icon_image_url)`)
        .eq("user_id", user.id)
        .order("target_date", { ascending: true });

      if (error) throw error;
      // @ts-ignore
      const resList = data || [];
      setReservations(resList);

      // --- 通知チェック ---
      // 「承認待ち」があり、かつ「まだ通知していないID」ならモーダルを出す
      resList.forEach((r: Reservation) => {
        if (r.status === "approval_pending" && !notifiedIds.current.has(r.id)) {
          setNotificationItem(r);
          notifiedIds.current.add(r.id); // 通知済みとして記録
        }
      });

    } catch (error) {
      console.error("予約取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchReservations();
      // ポーリングで状態変化を監視
      const interval = setInterval(fetchReservations, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, user]);

  // --- アクション ---
  const handleCancel = async (res: Reservation) => {
    if (!confirm("本当にキャンセルしますか？")) return;
    try {
      // 相手のリセット
      if (res.partner_id) {
        await supabase
          .from("reservations")
          .update({ status: "active", partner_id: null, route_info: null })
          .eq("user_id", res.partner_id)
          .eq("status", res.status === "approval_pending" ? "waiting_approval" : "approval_pending");
      }
      // 自分のリセット/削除
      if (res.status === "active") {
        await supabase.from("reservations").delete().eq("id", res.id);
      } else {
        await supabase
          .from("reservations")
          .update({ status: "active", partner_id: null, route_info: null })
          .eq("id", res.id);
      }
      alert("キャンセルしました。");
      fetchReservations();
    } catch (e) { console.error(e); }
  };

  const handleApprove = async (res: Reservation) => {
    if (!res.partner_id) return;
    if(!confirm(`${res.partner?.username || "相手"}さんとのマッチングを確定しますか？`)) return;
    try {
      // 双方を matched に更新
      await supabase.from("reservations").update({ status: "matched", matched_at: new Date().toISOString() }).eq("user_id", res.partner_id).eq("status", "waiting_approval");
      await supabase.from("reservations").update({ status: "matched", matched_at: new Date().toISOString() }).eq("id", res.id);
      
      alert("🎉 マッチングが成立しました！\n確定リストに移動します。");
      setNotificationItem(null); // モーダルが出ていれば閉じる
      fetchReservations();
    } catch (e) { console.error(e); }
  };

  const goToDetails = (res: Reservation) => {
    if (res.route_info) {
      navigate({ to: "/match-details", state: { routeInfo: res.route_info } });
    } else {
      alert("詳細データがありません");
    }
  };

  if (!isLoaded) return null;

  return (
    <Flex direction="column" gap="6" mx="auto" py="6" width="100%" px="4" maxWidth="600px">
      <h1 className={css({ fontSize: "2xl", fontWeight: "bold", textAlign: "center" })}>マイページ</h1>

      {/* プロフィール */}
      <Flex alignItems="center" justifyContent="space-between" px="2">
        <Flex alignItems="center" gap="4">
          {user?.imageUrl && (
            <img src={user.imageUrl} className={css({ width: "16", height: "16", borderRadius: "full" })} alt="prof" />
          )}
          <Box fontWeight="bold">{user?.username || user?.fullName}</Box>
        </Flex>
        <button onClick={handleEditProfile} className={css({ fontSize:"sm", border:"1px solid #ccc", bg:"white", px:"3", py:"1", borderRadius:"md" })}>編集</button>
      </Flex>

      {/* --- ① 承認待ちリクエスト (ここに通知が来ます) --- */}
      {pendingApprovals.length > 0 && (
        <Box>
          <h2 className={css({ fontSize: "lg", fontWeight: "bold", mb: "3", color: "red.600" })}>🔔 承認待ち (申請が来ています！)</h2>
          <Flex direction="column" gap="3">
            {pendingApprovals.map(res => (
              <div key={res.id} className={css({ bg: "red.50", border: "2px solid token(colors.red.200)", borderRadius: "lg", p: "4" })}>
                <Flex align="center" gap="3" mb="3">
                   <img src={res.partner?.icon_image_url} className={css({width:"10", height:"10", borderRadius:"full"})} />
                   <Box>
                     <div className={css({fontWeight:"bold"})}>{res.partner?.username || "相手"} さん</div>
                     <div className={css({fontSize:"sm", color:"red.600"})}>マッチング承認依頼が届いています！</div>
                   </Box>
                </Flex>
                <div className={css({fontSize:"sm", mb:"4"})}>{res.target_date} {res.start_time} - {res.departure_location} → {res.destination_location}</div>
                <Flex gap="2">
                  <button onClick={() => goToDetails(res)} className={css({flex:1, bg:"white", border:"1px solid #ccc", py:"2", borderRadius:"md"})}>詳細</button>
                  <button onClick={() => handleApprove(res)} className={css({flex:1, bg:"primary", color:"white", py:"2", borderRadius:"md", fontWeight:"bold"})}>OK (承認)</button>
                  <button onClick={() => handleCancel(res)} className={css({flex:1, bg:"gray.200", py:"2", borderRadius:"md", color:"red.600"})}>拒否</button>
                </Flex>
              </div>
            ))}
          </Flex>
        </Box>
      )}

      {/* --- ② マッチング確定済み --- */}
      <Box>
        <h2 className={css({ fontSize: "lg", fontWeight: "bold", mb: "3", color: "green.700" })}>🎉 マッチング確定済み</h2>
        {upcomingMatches.length === 0 ? (
           <Box color="gray.500" fontSize="sm" mb="4">予定されている確定予約はありません</Box>
        ) : (
          <Flex direction="column" gap="3">
            {upcomingMatches.map(res => (
              <div key={res.id} className={css({ bg: "white", border: "2px solid token(colors.green.400)", borderRadius: "lg", p: "4", position:"relative" })}>
                <div className={css({position:"absolute", top:"-10px", right:"10px", bg:"green.500", color:"white", px:"2", fontSize:"xs", borderRadius:"full"})}>成立済み</div>
                <Flex align="center" gap="3" mb="2">
                   <img src={res.partner?.icon_image_url} className={css({width:"10", height:"10", borderRadius:"full"})} />
                   <Box fontWeight="bold">{res.partner?.username || "相手"} さん</Box>
                </Flex>
                <div className={css({fontSize:"sm", mb:"2"})}>📅 {res.target_date} {res.start_time} <br/> 📍 {res.departure_location} → {res.destination_location}</div>
                <button onClick={() => goToDetails(res)} className={css({width:"100%", bg:"green.50", color:"green.800", py:"2", borderRadius:"md", fontWeight:"bold"})}>詳細・ルートを確認</button>
              </div>
            ))}
          </Flex>
        )}
      </Box>

      {/* --- ③ 返答待ち (自分が申請) --- */}
      <Box>
        <h2 className={css({ fontSize: "lg", fontWeight: "bold", mb: "3", color: "gray.600" })}>📨 返答待ち</h2>
        {waitingResponse.length === 0 ? (
           <Box color="gray.500" fontSize="sm" mb="4">申請中のリクエストはありません</Box>
        ) : (
          waitingResponse.map(res => (
             <div key={res.id} className={css({ bg: "gray.50", border: "1px dashed gray", borderRadius: "lg", p: "4", mb:"2" })}>
                <div className={css({fontSize:"sm", mb:"1"})}>⏳ <strong>{res.partner?.username}</strong> さんの承認待ち</div>
                <div className={css({fontSize:"xs", color:"gray.500"})}>{res.target_date} {res.start_time}</div>
                <button onClick={() => handleCancel(res)} className={css({mt:"2", fontSize:"xs", color:"red.500", textDecoration:"underline"})}>リクエストを取り消す</button>
             </div>
          ))
        )}
      </Box>

      {/* --- ④ 待機中 (自分が1人目) --- */}
      <Box mb="6">
        <h2 className={css({ fontSize: "lg", fontWeight: "bold", mb: "3", color: "gray.600" })}>⏳ 待機中</h2>
        {activeList.length === 0 ? (
          <Box p="4" bg="gray.50" borderRadius="md" color="gray.500" fontSize="sm" textAlign="center" border="1px dashed token(colors.gray.300)">
            現在待機中のリクエストはありません
          </Box>
        ) : (
          <Flex direction="column" gap="3">
            {activeList.map(res => (
              <div key={res.id} className={css({ bg: "white", border: "1px solid token(colors.blue.200)", borderRadius: "lg", p: "4", borderLeft:"4px solid token(colors.blue.500)" })}>
                <Flex justify="space-between">
                  <Box fontWeight="bold" fontSize="md">{res.departure_location} → {res.destination_location}</Box>
                  <button onClick={() => handleCancel(res)} className={css({fontSize:"xs", color:"red.500", border:"1px solid red", px:"2", borderRadius:"md"})}>取り消す</button>
                </Flex>
                <div className={css({fontSize:"sm", color:"gray.600", mt:"1"})}>{res.target_date} {res.start_time}</div>
              </div>
            ))}
          </Flex>
        )}
      </Box>

      {/* --- フッターボタン (過去履歴・習慣ルート) --- */}
      <Grid gridTemplateColumns="1fr 1fr" gap="4" mt="auto" mb="10">
         <Link to="/matching-history" className={css({ bg:"white", border:"1px solid #ccc", p:"4", borderRadius:"md", textAlign:"center", fontSize:"sm", fontWeight:"bold", boxShadow:"sm", _hover: { bg: "gray.50" } })}>
            📜 過去の履歴一覧
         </Link>
         <Link to="/habits" className={css({ bg:"white", border:"1px solid #ccc", p:"4", borderRadius:"md", textAlign:"center", fontSize:"sm", fontWeight:"bold", boxShadow:"sm", _hover: { bg: "gray.50" } })}>
            🛣️ 習慣ルート
         </Link>
      </Grid>

      {/* --- 🔔 申請通知モーダル --- */}
      {notificationItem && (
        <div className={css({position:"fixed", inset:0, bg:"rgba(0,0,0,0.6)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", p:"4"})} onClick={() => setNotificationItem(null)}>
            <div className={css({bg:"white", borderRadius:"xl", p:"6", width:"100%", maxWidth:"350px", animation: "slideUp 0.3s"})} onClick={e => e.stopPropagation()}>
                <div className={css({textAlign:"center", fontSize:"3xl", mb:"2"})}>📣</div>
                <h3 className={css({textAlign:"center", fontWeight:"bold", fontSize:"lg", mb:"2"})}>申請が届きました！</h3>
                <p className={css({textAlign:"center", color:"gray.600", fontSize:"sm", mb:"6"})}>
                    <strong>{notificationItem.partner?.username || "相手"}</strong> さんから<br/>
                    相乗りのリクエストが来ています。
                </p>
                <div className={css({bg:"gray.50", p:"3", borderRadius:"md", mb:"6", fontSize:"sm"})}>
                    {notificationItem.target_date} {notificationItem.start_time}<br/>
                    {notificationItem.departure_location} → {notificationItem.destination_location}
                </div>
                <Flex gap="3">
                    <button onClick={() => setNotificationItem(null)} className={css({flex:1, bg:"gray.200", p:"3", borderRadius:"md", fontWeight:"bold"})}>閉じる</button>
                    <button onClick={() => { setNotificationItem(null); goToDetails(notificationItem); }} className={css({flex:1, bg:"primary", color:"white", p:"3", borderRadius:"md", fontWeight:"bold"})}>確認する</button>
                </Flex>
            </div>
        </div>
      )}
    </Flex>
  );
}