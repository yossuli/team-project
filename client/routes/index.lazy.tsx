import { useClerk, useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex, Grid } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";

<<<<<<< HEAD
const client = hc<Routes>("");

export const Route = createLazyRoute("/")({
  component: () => {
    return (
      <Flex direction="column" gap="4" p="4">
        <h1>hoge</h1>
        <div>fuga</div>
        <form action="api/test" method="post">
          <Button>test</Button>
        </form>
      </Flex>
    );
  },
=======
export const Route = createLazyFileRoute("/")({
  component: MyPage,
>>>>>>> cdba9246ced6693d9f23079b9db03ca45165d3a1
});

function MyPage() {
  const { user } = useUser();
  const clerk = useClerk();

  const handleEditProfile = () => {
    clerk.openUserProfile();
  };

  return (
    <Flex
      direction="column"
      gap="6"
      mx="auto"
      py="6"
      // 👇 [修正] ここで画面サイズごとの比率(幅)を操作します
      width="100%" // 基本は親要素いっぱい
      paddingX={{ base: "4", md: "8" }} // スマホは余白狭め、PCは広め
      maxWidth={{
        base: "100%", // スマホ: 画面幅いっぱい (比率100%)
        md: "600px",  // タブレット: 最大600pxくらいが読みやすい
        lg: "800px",  // PC: 最大800px (これ以上広いとボタンが長すぎるため)
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
          <img
            src={user?.imageUrl}
            alt="Profile"
            className={css({
              // 👇 アイコンサイズも少しレスポンシブに調整
              width: { base: "16", md: "20" }, // スマホ: 64px, PC: 80px
              height: { base: "16", md: "20" },
              borderRadius: "full",
              objectFit: "cover",
              border: "1px solid token(colors.gray.200)",
            })}
          />
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
        <MenuButton>習慣的な予約情報ページ</MenuButton>
        <MenuButton>登録予約情報一覧</MenuButton>

        <Grid gridTemplateColumns="1fr 1fr" gap="4">
          <MenuButton style={{ height: "120px" }}>
            マッチング<br />履歴ページ
          </MenuButton>
          <MenuButton style={{ height: "120px" }}>
            ブロック<br />管理ページ
          </MenuButton>
        </Grid>
      </Flex>
    </Flex>
  );
}

// --- 共通のメニューボタン部品 ---
function MenuButton({
  children,
  style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
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