import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Container, Flex } from "@ss/jsx";
import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
function RootComponent() {
  const user = useUser();
  return (
    <>
      <Container flexDirection="column">
        <SignedOut>
          <SignInButton>signin</SignInButton>
        </SignedOut>
        <SignedIn>
          <Flex>
            {user.user?.username}
            <UserButton />
          </Flex>
          <Outlet />
        </SignedIn>
      </Container>
    </>
  );
}
