import { useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/matching-history")({
  component: MatchingHistoryPage,
});

// データ型の定義
type HistoryItem = {
  id: number; // グループIDなどを便宜的に使用
  date: string;
  partner: string;
  partnerId: string; // ブロック用にIDを持たせる
  partnerIcon: string;
  route: string;
  status: string;
  habitualRoute: string;
  bio: string;
  isBlocked: boolean;
};

function MatchingHistoryPage() {
  const { user: currentUser, isLoaded } = useUser();
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<HistoryItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // 画面表示時にSupabaseからデータを取得
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !currentUser) {
        return;
      }

      try {
        // 1. まず、自分が参加しているグループのIDを取得
        const { data: myParticipations, error: myError } = await supabase
          .from("ride_group_participants")
          .select("group_id, reservation:reservations(destination_location)") // 予約情報から目的地などを取得
          .eq("user_id", currentUser.id);

        if (myError) {
          throw myError;
        }

        if (!myParticipations || myParticipations.length === 0) {
          setHistoryList([]);
          return;
        }

        const myGroupIds = myParticipations.map((p) => p.group_id);

        // 2. そのグループに参加している「自分以外」のユーザーを取得
        const { data: partners, error: partnerError } = await supabase
          .from("ride_group_participants")
          .select(`
            group_id,
            user:users (
              id, nickname, icon_image_url, bio, habitual_route
            ),
            group:ride_groups (
              created_at, status
            )
          `)
          .in("group_id", myGroupIds)
          .neq("user_id", currentUser.id); // 自分を除外

        if (partnerError) {
          throw partnerError;
        }

        // 3. データを整形
        if (partners) {
          const formattedData: HistoryItem[] = partners.map((item: any) => {
            // 自分の参加情報からルート名（目的地）を探す（簡易的）
            const myInfo = myParticipations.find(
              (p) => p.group_id === item.group_id,
            );
            const routeName = myInfo?.reservation?.destination_location
              ? `${myInfo.reservation.destination_location} への相乗り`
              : "詳細不明なルート";

            return {
              id: item.group_id, // グループIDをキーにする
              date: item.group.created_at,
              partner: item.user.nickname || "No Name",
              partnerId: item.user.id,
              partnerIcon: item.user.icon_image_url,
              route: routeName,
              status:
                item.group.status === "completed" ? "completed" : "matched",
              habitualRoute: item.user.habitual_route || "未設定",
              bio: item.user.bio || "自己紹介はありません",
              isBlocked: false, // 初期値（あとで判定も可能だが一旦false）
            };
          });
          setHistoryList(formattedData);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isLoaded, currentUser]);

  // ブロック処理
  const handleBlock = async (
    groupId: number,
    partnerId: string,
    partnerName: string,
  ) => {
    if (!currentUser) {
      return;
    }

    if (confirm(`${partnerName}さんをブロックしますか？`)) {
      try {
        // Supabaseのblocksテーブルに追加
        const { error } = await supabase
          .from("blocks")
          .insert([{ blocker_id: currentUser.id, blocked_id: partnerId }]);

        if (error) {
          throw error;
        }

        // 画面上の表示を「ブロック済み」に更新
        setHistoryList((prevList) =>
          prevList.map((item) =>
            item.id === groupId ? { ...item, isBlocked: true } : item,
          ),
        );
        alert("ブロックしました");
      } catch (e: any) {
        console.error("Block error:", e);
        alert("ブロックに失敗しました: " + e.message);
      }
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" p="10">
        読み込み中...
      </Flex>
    );
  }

  // (以下、JSX部分は変更なし。そのままreturnしてください)
  return (
    <>
      <Flex
        direction="column"
        gap="6"
        width="100%"
        maxWidth="600px"
        mx="auto"
        p="4"
      >
        <h1
          className={css({
            fontSize: "xl",
            fontWeight: "bold",
            textAlign: "center",
          })}
        >
          マッチング履歴
        </h1>

        {historyList.length === 0 ? (
          <Box textAlign="center" color="gray.500">
            マッチング履歴はありません
          </Box>
        ) : (
          <Flex direction="column" gap="4">
            {historyList.map((item) => (
              <div
                key={item.id}
                className={css({
                  border: "1px solid token(colors.gray.200)",
                  borderRadius: "md",
                  padding: "4",
                  bg: "white",
                  boxShadow: "sm",
                })}
              >
                <Flex justifyContent="space-between" alignItems="center" mb="3">
                  <span className={css({ fontSize: "sm", color: "gray.500" })}>
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span
                    className={css({
                      fontSize: "xs",
                      padding: "1 2",
                      borderRadius: "full",
                      bg:
                        item.status === "completed" ? "green.100" : "gray.100",
                      color:
                        item.status === "completed" ? "green.800" : "gray.800",
                      fontWeight: "bold",
                    })}
                  >
                    {item.status}
                  </span>
                </Flex>

                <Box fontSize="lg" fontWeight="bold" mb="4">
                  {item.route}
                </Box>

                <hr className={css({ borderColor: "gray.200", mb: "3" })} />

                <Flex alignItems="center" justifyContent="space-between">
                  <Flex
                    alignItems="center"
                    gap="3"
                    onClick={() => setSelectedPartner(item)}
                    className={css({
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      _hover: { opacity: 0.7 },
                    })}
                  >
                    <img
                      src={item.partnerIcon}
                      alt={item.partner}
                      className={css({
                        width: "10",
                        height: "10",
                        borderRadius: "full",
                        objectFit: "cover",
                        bg: "gray.300",
                      })}
                    />
                    <Flex direction="column">
                      <span
                        className={css({ fontSize: "xs", color: "gray.500" })}
                      >
                        相乗り相手
                      </span>
                      <span
                        className={css({ fontWeight: "bold", fontSize: "sm" })}
                      >
                        {item.partner}
                      </span>
                    </Flex>
                  </Flex>

                  {item.isBlocked ? (
                    <button
                      type="button"
                      disabled
                      className={css({
                        border: "1px solid token(colors.gray.300)",
                        color: "gray.500",
                        bg: "gray.100",
                        fontSize: "xs",
                        fontWeight: "bold",
                        padding: "1 3",
                        borderRadius: "sm",
                        cursor: "not-allowed",
                      })}
                    >
                      ブロック中
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlock(item.id, item.partnerId, item.partner);
                      }}
                      className={css({
                        border: "1px solid token(colors.red.500)",
                        color: "red.500",
                        bg: "white",
                        fontSize: "xs",
                        fontWeight: "bold",
                        padding: "1 3",
                        borderRadius: "sm",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        _hover: {
                          bg: "red.50",
                        },
                      })}
                    >
                      ブロック
                    </button>
                  )}
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Flex>

      {selectedPartner && (
        <PartnerInfoModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </>
  );
}

// (以下、PartnerInfoModal は変更なしのため省略)
function PartnerInfoModal({
  partner,
  onClose,
}: {
  partner: HistoryItem;
  onClose: () => void;
}) {
  return (
    <div
      className={css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bg: "rgba(0, 0, 0, 0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4",
      })}
      onClick={onClose}
    >
      <div
        className={css({
          bg: "white",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "lg",
          padding: "6",
          position: "relative",
          boxShadow: "lg",
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={css({
            position: "absolute",
            top: "4",
            right: "4",
            fontSize: "2xl",
            cursor: "pointer",
            color: "gray.500",
            bg: "transparent",
            border: "none",
          })}
        >
          ✕
        </button>

        <Flex direction="column" alignItems="center" gap="4">
          <img
            src={partner.partnerIcon}
            alt={partner.partner}
            className={css({
              width: "24",
              height: "24",
              borderRadius: "full",
              objectFit: "cover",
              bg: "gray.300",
              border: "1px solid token(colors.gray.200)",
            })}
          />
          <h2 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            {partner.partner}
          </h2>

          <hr className={css({ width: "100%", borderColor: "gray.200" })} />

          <Flex direction="column" width="100%" gap="4" textAlign="left">
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                習慣的な利用ルート
              </Box>
              <Box fontWeight="medium">{partner.habitualRoute}</Box>
            </div>
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                自己紹介・メモ
              </Box>
              <Box fontSize="sm" color="gray.700" lineHeight="1.6">
                {partner.bio}
              </Box>
            </div>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
