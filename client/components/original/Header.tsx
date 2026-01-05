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
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export const Header = () => {
  const { user } = useUser();
  const clerk = useClerk();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className={css({
        padding: "4",
        borderBottom: "1px solid token(colors.gray.200)",
        position: "relative",
        bg: "white", // 背景色を明示的に白に
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
            padding: "1",
            color: "gray.700", // アイコンも少し濃いグレーに
          })}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        {/* 中央: アプリ名 (Norun) */}
        <Link
          to="/"
          className={css({ textDecoration: "none", color: "inherit" })}
        >
          <span
            className={css({
              fontSize: "2xl",
              fontWeight: "extrabold", // より太くしてロゴ感を出す
              // 👇 [変更] 青色(primary) から 濃いグレー(gray.900) に変更
              color: "gray.900",
              fontFamily: "sans-serif",
              letterSpacing: "-0.02em", // 少し文字を詰めてモダンに
            })}
          >
            Norun
          </span>
        </Link>

        {/* 右側: ユーザー情報 */}
        <div>
          <SignedOut>
            <SignInButton>
              <button
                type="button"
                className={css({
                  bg: "primary", // ボタンは青のまま（アクセント）
                  color: "white",
                  padding: "2 4",
                  fontSize: "sm",
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
              <span
                className={css({
                  fontSize: "md",
                  fontWeight: "bold",
                  display: { base: "none", md: "block" },
                })}
              >
                {user?.username}
              </span>
              <UserButton />
            </Flex>
          </SignedIn>
        </div>
      </Flex>

      {/* --- サイドメニュー (スライドイン) --- */}
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
            mb: "6",
            bg: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "2xl",
            display: "block",
            marginLeft: "auto",
            color: "gray.700",
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
            gap: "6",
            display: "flex",
            flexDirection: "column",
          })}
        >
          {/* ホーム */}
          <li>
            <Link
              to="/"
              className={css({
                textDecoration: "none",
                color: "gray.800",
                fontWeight: "medium",
                display: "block",
                _hover: { color: "primary" },
              })}
              onClick={() => setIsMenuOpen(false)}
            >
              ホーム
            </Link>
          </li>

          {/* マイページ */}
          <li>
            <Link
              to="/mypage"
              className={css({
                textDecoration: "none",
                color: "gray.800",
                fontWeight: "medium",
                display: "block",
                _hover: { color: "primary" },
              })}
              onClick={() => setIsMenuOpen(false)}
            >
              マイページ
            </Link>
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
                color: "red.500",
                fontWeight: "medium",
                width: "100%",
                _hover: { opacity: 0.7 },
              })}
              onClick={() => {
                setIsMenuOpen(false);
                clerk.signOut();
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
          role="button"
          tabIndex={0}
          className={css({
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bg: "rgba(0, 0, 0, 0.5)",
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
