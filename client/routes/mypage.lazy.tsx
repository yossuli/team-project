"use client";

import { useClerk, useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex, Grid } from "@ss/jsx";
import { Link, createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/mypage")({
  component: MyPage,
});

function MyPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const handleEditProfile = () => {
    clerk.openUserProfile();
  };

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
          color: "gray.800", // 文字色を少し柔らかい黒に
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
                border: "2px solid token(colors.white)", // 白い枠線をつけて清潔感を出す
                boxShadow: "sm",
              })}
            />
          )}
        </Flex>

        {/* 右側: プロフィール編集ボタン (サブアクションなので白背景に) */}
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

      {/* --- 2. メニューボタンエリア --- */}
      <Flex direction="column" gap="4">
        {/* 👇 [追加] メインアクション: 相乗り検索 (ここを青にする) */}
        <Link
          to="/"
          className={css({
            bg: "primary", // テックブルー
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
            _hover: { bg: "secondary" }, // 明るい青
          })}
        >
          <span>🔍</span> 相乗りを検索する
        </Link>

        {/* 👇 習慣的な予約情報 */}
        <Link to="/habits" style={{ width: "100%" }}>
          <MenuButton>習慣的な予約情報ページ</MenuButton>
        </Link>

        {/* 登録予約情報一覧 */}
        <MenuButton>登録予約情報一覧</MenuButton>

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

// --- 共通のメニューボタン部品 (カードスタイルに変更) ---
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
        bg: "white", // 背景を白に
        color: "gray.800",
        fontWeight: "bold",
        fontSize: "sm",
        borderRadius: "lg", // 角丸を少し大きく
        border: "1px solid token(colors.gray.200)", // 薄い枠線
        boxShadow: "sm", // 軽い影をつけて浮かせる
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "1.5",
        transition: "all 0.2s",
        _hover: {
          borderColor: "primary", // ホバー時に枠線を青に
          color: "primary", // 文字色も青に
          boxShadow: "md",
          transform: "translateY(-1px)", // 少しだけ浮き上がる演出
        },
      })}
    >
      {children}
    </button>
  );
}
