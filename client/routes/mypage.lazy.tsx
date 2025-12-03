"use client";

import { useClerk, useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex, Grid } from "@ss/jsx";
import { createLazyFileRoute, Link } from "@tanstack/react-router"; // 👈 Linkを追加

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
                border: "1px solid token(colors.gray.200)",
              })}
            />
          )}
          {/* 名前を表示したい場合はコメントアウトを解除 */}
          {/* <span className={css({ fontWeight: "bold", fontSize: "lg" })}>
            {user?.fullName || user?.username}
          </span> */}
        </Flex>

        {/* 右側: プロフィール編集ボタン */}
        <button
          type="button"
          onClick={handleEditProfile}
          className={css({
            bg: "black",
            color: "white",
            fontSize: "sm",
            fontWeight: "bold",
            padding: "3 6",
            borderRadius: "md",
            cursor: "pointer",
            transition: "background 0.2s",
            _hover: { bg: "gray.800" },
          })}
        >
          プロフィール編集
        </button>
      </Flex>

      {/* --- 2. メニューボタンエリア --- */}
      <Flex direction="column" gap="4">
        {/* 他のページも作成したら Link で囲んでください */}
        <MenuButton>習慣的な予約情報ページ</MenuButton>
        <MenuButton>登録予約情報一覧</MenuButton>

        <Grid gridTemplateColumns="1fr 1fr" gap="4">
          {/* 👇 [修正] Linkで囲んでマッチング履歴ページへ遷移させる */}
          <Link to="/matching-history" style={{ width: "100%" }}>
            <MenuButton style={{ height: "120px" }}>
              マッチング
              <br />
              履歴ページ
            </MenuButton>
          </Link>

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
        bg: "#f9f9f9",
        color: "black",
        fontWeight: "bold",
        fontSize: "sm",
        borderRadius: "md",
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "1.5",
        transition: "background 0.2s",
        _hover: {
          bg: "gray.200",
        },
      })}
    >
      {children}
    </button>
  );
}