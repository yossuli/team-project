import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex } from "@ss/jsx";
import { useState } from "react";

export const Header = () => {
  const user = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // サイドメニューの状態

  return (
    <header
      className={css({
        padding: "4",
        borderBottom: "1px solid token(colors.gray.200)",
        position: "relative",
      })}
    >
      <Flex justifyContent="space-between" alignItems="center">
        {/* 左側: ハンバーガーメニュー */}
        <button
          type="button"
          aria-label="Menu"
          className={css({
            bg: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "2xl",
            margin: 0,
          })}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        {/* 右側: ユーザー情報 */}
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
                })}
              >
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

      {/* サイドメニュー */}
      <div
        className={css({
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "250px",
          bg: "white",
          shadow: "lg",
          transform: isMenuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          zIndex: 50,
          padding: "4",
        })}
      >
        <button
          type="button"
          aria-label="Close"
          className={css({
            mb: "4",
            bg: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "2xl",
          })}
          onClick={() => setIsMenuOpen(false)}
        >
          ✕
        </button>
        <ul
          className={css({
            listStyle: "none",
            padding: 0,
            margin: 0,
            fontSize: "lg",
            gap: "3",
            display: "flex",
            flexDirection: "column",
          })}
        >
          <li>ホーム</li>
          <li>マイページ</li>
          <li>設定</li>
          <li>ログアウト</li>
        </ul>
      </div>

      {/* 背景のオーバーレイ */}
      {isMenuOpen && (
        <div
          className={css({
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bg: "black",
            opacity: 0.5,
            zIndex: 40,
          })}
          onClick={() => setIsMenuOpen(false)}
          onKeyUp={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsMenuOpen(false);
            }
          }}
        />
      )}
    </header>
  );
};
