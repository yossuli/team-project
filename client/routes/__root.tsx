import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Container } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
function RootComponent() {
  return (
    <>
      <Container flexDirection="column">
        <SignedOut>
          <Outlet />
        </SignedOut>
        <SignedIn>
          <Outlet />
        </SignedIn>
      </Container>
    </>
  );
}
