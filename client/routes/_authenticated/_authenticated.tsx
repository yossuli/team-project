import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

// TanStack Router V1 (ファイルベース・ルーティング)
// /_authenticated/_authenticated というパスを自動で認識します
export const Route = createFileRoute('/_authenticated/_authenticated')({
  //
  // --- 👇 ここが「門番」のロジックです ---
  //
  component: () => (
    <>
      {/* ログイン済みなら、子ページ (Outlet) を表示 */}
      <SignedIn>
        <Outlet />
      </SignedIn>
      
      {/* ログインしていなければ /sign-in にリダイレクト */}
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
})