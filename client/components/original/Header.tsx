import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useClerk,
  useUser,
} from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Flex } from "@ss/jsx";
import { useState } from "react";

export const Header = () => {
  const { user } = useUser();
  const clerk = useClerk(); // ← Clerkインスタンス取得
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                  _hover: { bg: "blue.600" },
                })}
              >
                サインイン
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Flex alignItems="center" gap="3">
              <span className={css({ fontSize: "lg", fontWeight: "bold" })}>
                {user?.username}
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
          {/* ホーム */}
          <li>
            <a
              href="/"
              className={css({
                textDecoration: "none",
                color: "black",
                _hover: { textDecoration: "underline" },
              })}
              onClick={() => setIsMenuOpen(false)}
            >
              ホーム
            </a>
          </li>

          {/* マイページ */}
          <li>
            <a
              href="/mypage"
              className={css({
                textDecoration: "none",
                color: "black",
                _hover: { textDecoration: "underline" },
              })}
              onClick={() => setIsMenuOpen(false)}
            >
              マイページ
            </a>
          </li>

          {/* ログアウト */}
          <li>
            <button
              type="button"
              className={css({
                bg: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: "lg",
                textAlign: "left",
                color: "black",
                _hover: { textDecoration: "underline" },
              })}
              onClick={() => {
                setIsMenuOpen(false);
                clerk.signOut(); // ← Clerkログアウト
              }}
            >
              ログアウト
            </button>
          </li>
        </ul>
      </div>

      {/* 背景オーバーレイ */}
      {isMenuOpen && (
        <div
          role="button" // アクセシビリティ用
          tabIndex={0} // フォーカス可能にする
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
