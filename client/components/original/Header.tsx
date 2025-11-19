import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { css } from "@ss/css"; // :左向き指差し: [追加] css は @ss/css からインポート
import { Flex } from "@ss/jsx"; // :左向き指差し: [修正] Flex のみ @ss/jsx からインポート
export const Header = () => {
  const user = useUser();
  return (
    <header
      className={css({
        padding: "4",
        borderBottom: "1px solid token(colors.gray.200)",
      })}
    >
      <Flex justifyContent="flex-end" alignItems="center">
        <div>
          <SignedOut>
            <SignInButton>
              <button
              type="button"
              className={css({
                bg: "blue.500",
                color: "white",
                padding: "3 6",
                fontSize: "md",
                borderRadius: "md",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "background 0.2s",
                _hover: {
                  bg: "blue.600",
                },
                })}>
                  signin
                  </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Flex alignItems="center" gap="3">
              <span className={css({ fontSize: "lg", fontWeight: "bold" })}>
                {user.user?.username}
                </span>
                <UserButton />
                </Flex>
          </SignedIn>
        </div>
      </Flex>
    </header>
  );
};
