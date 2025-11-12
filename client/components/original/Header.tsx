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
                type="button" // :左向き指差し: [追加] Biomeエラーを修正
                className={css({
                  bg: "blue.500",
                  color: "white",
                  padding: "2 4",
                  borderRadius: "md",
                  cursor: "pointer",
                  fontWeight: "bold",
                  _hover: {
                    bg: "blue.600",
                  },
                })}
              >
                signin
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Flex alignItems="center" gap="3">
              {user.user?.username}
              <UserButton />
            </Flex>
          </SignedIn>
        </div>
      </Flex>
    </header>
  );
};
