// 👇 Clerkの認証制御コンポーネント
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Container } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";

import { Header } from "../components/original/Header";

import { BackgroundMatcher } from "../components/BackgroundMatcher";
// 👇 【重要】監視用のコンポーネントをインポート
import { DeadlineWatcher } from "../components/DeadlineWatcher";

export const Route = createRootRoute({
  component: RootComponent,
});

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
function RootComponent() {
  return (
    <>
      <Header />
      <Container flexDirection="column" p="4">
        {/* --- 🔒 認証による表示の切り替え --- */}

        {/* 1. ログインしている時だけ、ページの中身(Outlet)を表示 */}
        <SignedIn>
          {/* 👇 ここに監視コンポーネントを置くことで、ログイン中はずっと裏で動きます */}
          <DeadlineWatcher /> {/* 締め切り時間の監視 */}
          <BackgroundMatcher /> {/* 待機中の再マッチング(同時押し対策) */}
          <Outlet />
        </SignedIn>

        {/* 2. ログインしていない時は、サインイン画面へ強制リダイレクト */}
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </Container>
    </>
  );
}
