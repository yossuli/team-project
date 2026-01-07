"use client";

import { useClerk, useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Box, Flex, Grid } from "@ss/jsx";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
};

function MyPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  // 👇 待機中の予約リスト
  const [activeReservations, setActiveReservations] = useState<Reservation[]>(
    [],
  );
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);

  const handleEditProfile = () => {
    clerk.openUserProfile();
  };

  // 予約データを取得する関数
  const fetchActiveReservations = async () => {
    if (!user) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active") // 'active' なものだけ取得
        .order("target_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        throw error;
      }
      setActiveReservations(data || []);
    } catch (error) {
      console.error("予約取得エラー:", error);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // 予約を取り消す関数
  const handleCancelReservation = async (id: number) => {
    if (!confirm("このマッチング待ちリクエストを取り消しますか？")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      // 画面からも削除
      setActiveReservations((prev) => prev.filter((r) => r.id !== id));
      alert("リクエストを取り消しました");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("取り消しに失敗しました");
    }
  };

  // 画面ロード時にデータを取得
  useEffect(() => {
    if (isLoaded && user) {
      fetchActiveReservations();
    }
  }, [isLoaded, user]);

  // ユーザー情報の読み込み中は何も表示しない
  if (!isLoaded) {
    return null;
  }

  return (
    <Flex
      direction="column"
      gap="6"
      mx="auto"
      py="6"
      width="100%"
      paddingX={{ base: "4", md: "8" }}
      maxWidth={{
        base: "100%",
        md: "600px",
        lg: "800px",
      }}
    >
      {/* ページタイトル */}
      <h1
        className={css({
          fontSize: "2xl",
          fontWeight: "bold",
          textAlign: "center",
          color: "gray.800",
        })}
      >
        マイページ
      </h1>

      {/* --- 1. プロフィールセクション --- */}
      <Flex alignItems="center" justifyContent="space-between" px="2">
        {/* 左側: アイコン */}
        <Flex alignItems="center" gap="4">
          {user?.imageUrl && (
            <img
              src={user.imageUrl}
              alt="Profile"
              className={css({
                width: { base: "16", md: "20" },
                height: { base: "16", md: "20" },
                borderRadius: "full",
                objectFit: "cover",
                border: "2px solid token(colors.white)",
                boxShadow: "sm",
              })}
            />
          )}
        </Flex>

        {/* 右側: プロフィール編集ボタン */}
        <button
          type="button"
          onClick={handleEditProfile}
          className={css({
            bg: "white",
            border: "1px solid token(colors.gray.300)",
            color: "gray.700",
            fontSize: "sm",
            fontWeight: "bold",
            padding: "2 5",
            borderRadius: "md",
            cursor: "pointer",
            transition: "all 0.2s",
            _hover: {
              bg: "gray.50",
              borderColor: "gray.400",
            },
          })}
        >
          プロフィール編集
        </button>
      </Flex>

      {/* --- 2. 【新規】マッチング待ちリスト --- */}
      <Box>
        <h2
          className={css({
            fontSize: "lg",
            fontWeight: "bold",
            mb: "3",
            color: "gray.700",
          })}
        >
          ⏳ マッチング待機中のリクエスト
        </h2>

        {isLoadingReservations ? (
          <Box color="gray.500" fontSize="sm">
            読み込み中...
          </Box>
        ) : activeReservations.length === 0 ? (
          <Box
            className={css({
              p: "4",
              bg: "gray.50",
              borderRadius: "md",
              color: "gray.500",
              fontSize: "sm",
              textAlign: "center",
              border: "1px dashed token(colors.gray.300)",
            })}
          >
            現在待機中のリクエストはありません
          </Box>
        ) : (
          <Flex direction="column" gap="3">
            {activeReservations.map((res) => (
              <div
                key={res.id}
                className={css({
                  bg: "white",
                  border: "1px solid token(colors.blue.200)", // 青っぽい枠線で「アクティブ感」を出す
                  borderRadius: "lg",
                  padding: "4",
                  boxShadow: "sm",
                  position: "relative",
                  overflow: "hidden",
                })}
              >
                {/* 左側の青いライン装飾 */}
                <div
                  className={css({
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    bg: "blue.500",
                  })}
                />

                <Flex justifyContent="space-between" alignItems="start" gap="4">
                  <Flex direction="column" gap="1" flex="1">
                    <Flex alignItems="center" gap="2" mb="1">
                      <span
                        className={css({
                          bg: "blue.100",
                          color: "blue.700",
                          fontSize: "xs",
                          fontWeight: "bold",
                          px: "2",
                          py: "0.5",
                          borderRadius: "full",
                        })}
                      >
                        募集中
                      </span>
                      <span
                        className={css({
                          fontSize: "sm",
                          fontWeight: "bold",
                          color: "gray.700",
                        })}
                      >
                        {res.target_date} {res.start_time}
                      </span>
                    </Flex>

                    <Box fontSize="md" fontWeight="bold" color="gray.800">
                      {res.departure_location}
                      <span
                        className={css({
                          mx: "2",
                          color: "gray.400",
                          fontSize: "sm",
                        })}
                      >
                        →
                      </span>
                      {res.destination_location}
                    </Box>
                  </Flex>

                  <button
                    type="button"
                    onClick={() => handleCancelReservation(res.id)}
                    className={css({
                      fontSize: "xs",
                      color: "red.500",
                      bg: "white",
                      border: "1px solid token(colors.red.200)",
                      px: "3",
                      py: "1.5",
                      borderRadius: "md",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      _hover: { bg: "red.50" },
                    })}
                  >
                    取り消す
                  </button>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Box>

      <hr className={css({ borderColor: "gray.200" })} />

      {/* --- 3. メニューボタンエリア --- */}
      <Flex direction="column" gap="4">
        {/* 相乗り検索 */}
        <Link
          to="/"
          className={css({
            bg: "primary",
            color: "white",
            fontSize: "md",
            fontWeight: "bold",
            padding: "4",
            borderRadius: "md",
            textAlign: "center",
            textDecoration: "none",
            boxShadow: "md",
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2",
            _hover: { bg: "secondary" },
          })}
        >
          <span>🔍</span> 相乗りを検索する
        </Link>

        {/* 習慣的な予約情報へのリンク */}
        <Link to="/habits" style={{ width: "100%" }}>
          <MenuButton>習慣的な予約情報ページ</MenuButton>
        </Link>

        {/* 登録予約情報一覧 (今回追加したリストと重複するため、ボタンは一旦削除するか、
            「過去の履歴を含む詳細リスト」用として残すならリンク先が必要。
            今回はマイページ上に表示したので、このボタンは実質不要かもしれません) */}
        {/* <MenuButton>登録予約情報一覧</MenuButton> */}

        <Grid gridTemplateColumns="1fr 1fr" gap="4">
          {/* マッチング履歴 */}
          <Link to="/matching-history" style={{ width: "100%" }}>
            <MenuButton style={{ height: "120px" }}>
              マッチング
              <br />
              履歴ページ
            </MenuButton>
          </Link>

          {/* ブロック管理 */}
          <Link to="/block-list" style={{ width: "100%" }}>
            <MenuButton style={{ height: "120px" }}>
              ブロック
              <br />
              管理ページ
            </MenuButton>
          </Link>
        </Grid>
      </Flex>
    </Flex>
  );
}

// --- 共通のメニューボタン部品 ---
function MenuButton({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={css({
        width: "100%",
        padding: "6",
        bg: "white",
        color: "gray.800",
        fontWeight: "bold",
        fontSize: "sm",
        borderRadius: "lg",
        border: "1px solid token(colors.gray.200)",
        boxShadow: "sm",
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "1.5",
        transition: "all 0.2s",
        _hover: {
          borderColor: "primary",
          color: "primary",
          boxShadow: "md",
          transform: "translateY(-1px)",
        },
      })}
    >
      {children}
    </button>
  );
}
