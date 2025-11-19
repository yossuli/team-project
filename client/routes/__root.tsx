import { Container } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";
// :下向き指差し: [1] インポートパスを 'MypageHeader' (小文字のy) に修正
import { Header } from "../components/original/Header";
export const Route = createRootRoute({
  component: RootComponent,
});
// :下向き指差し: [2] Biomeのエラーを無視するコメントを追加
// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
function RootComponent() {
  return (
    <>
      <Header />
      <Container flexDirection="column" p="4">
        <Outlet />
      </Container>
    </>
  );
}