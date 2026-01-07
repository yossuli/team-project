// 👇 [1] Clerkの認証制御コンポーネントをインポート
import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Container } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";

// 👇 [2] 追加: 監視用コンポーネントをインポート
import { DeadlineWatcher } from "../components/DeadlineWatcher";
import { Header } from "../components/original/Header";

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
          {/* 👇 [3] 追加: ここに置くことで、ログイン中のみ常に監視が走ります */}
          <DeadlineWatcher />
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
