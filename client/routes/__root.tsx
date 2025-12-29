import { Container } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";
// 👇 [1] Clerkの認証制御コンポーネントをインポート
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

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