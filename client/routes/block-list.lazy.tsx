import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/block-list")({
  component: BlockListPage,
});

// --- 🛠️ モックデータ (詳細情報つき) ---
const initialBlockedUsers = [
  {
    id: "user-001",
    name: "田中 太郎",
    icon: "https://via.placeholder.com/150",
    habitualRoute: "東京駅 ↔ 新宿駅 (平日 9:00)",
    bio: "平日は毎日通勤で利用しています。静かに過ごすのが好きです。",
  },
  {
    id: "user-099",
    name: "迷惑 ユーザー",
    icon: "https://via.placeholder.com/150",
    habitualRoute: "不明",
    bio: "（自己紹介は設定されていません）",
  },
];

function BlockListPage() {
  const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);

  // 選択されたユーザーのデータを管理するstate
  const [selectedUser, setSelectedUser] = useState<
    (typeof initialBlockedUsers)[0] | null
  >(null);

  // ブロック解除ボタンを押した時の処理
  const handleUnblock = (userId: string, userName: string) => {
    if (confirm(`${userName}さんのブロックを解除しますか？`)) {
      // リストから削除する (モック処理)
      setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
      alert("ブロックを解除しました");
    }
  };

  return (
    <>
      <Flex
        direction="column"
        gap="6"
        width="100%"
        maxWidth="600px"
        mx="auto"
        p="4"
      >
        {/* ヘッダー部分 */}
        <Flex alignItems="center" justifyContent="center">
          <h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            ブロック管理
          </h1>
        </Flex>

        {/* ブロックユーザーリスト */}
        <Flex direction="column" gap="4">
          {blockedUsers.length === 0 ? (
            <Box textAlign="center" color="gray.500" py="8">
              ブロックしているユーザーはいません
            </Box>
          ) : (
            blockedUsers.map((user) => (
              <div
                key={user.id}
                className={css({
                  border: "1px solid token(colors.gray.200)",
                  borderRadius: "md",
                  padding: "4",
                  bg: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "sm",
                })}
              >
                {/* ユーザー情報部分 (クリックでモーダル表示) */}
                <Flex
                  alignItems="center"
                  gap="3"
                  onClick={() => setSelectedUser(user)}
                  className={css({
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                    _hover: { opacity: 0.7 },
                  })}
                >
                  <img
                    src={user.icon}
                    alt={user.name}
                    className={css({
                      width: "12",
                      height: "12",
                      borderRadius: "full",
                      objectFit: "cover",
                      bg: "gray.300",
                    })}
                  />
                  <Flex direction="column">
                    <span className={css({ fontWeight: "bold" })}>
                      {user.name}
                    </span>
                  </Flex>
                </Flex>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // 親のクリックイベント(モーダル表示)を止める
                    handleUnblock(user.id, user.name);
                  }}
                  className={css({
                    border: "1px solid token(colors.gray.400)",
                    color: "gray.700",
                    bg: "white",
                    fontSize: "xs",
                    fontWeight: "bold",
                    padding: "2 4",
                    borderRadius: "full",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    _hover: {
                      bg: "gray.100",
                    },
                  })}
                >
                  解除する
                </button>
              </div>
            ))
          )}
        </Flex>
      </Flex>

      {/* 👇 ユーザー詳細モーダル (selectedUserがある時だけ表示) */}
      {selectedUser && (
        <BlockedUserInfoModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}

// --- 👤 ブロックユーザー詳細モーダル ---
function BlockedUserInfoModal({
  user,
  onClose,
}: {
  user: (typeof initialBlockedUsers)[0];
  onClose: () => void;
}) {
  return (
    <div
      className={css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bg: "rgba(0, 0, 0, 0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4",
      })}
      onClick={onClose} // 背景クリックで閉じる
    >
      {/* モーダルの中身 */}
      <div
        className={css({
          bg: "white",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "lg",
          padding: "6",
          position: "relative",
          boxShadow: "lg",
        })}
        onClick={(e) => e.stopPropagation()} // 中身クリックでは閉じない
      >
        <button
          type="button"
          onClick={onClose}
          className={css({
            position: "absolute",
            top: "4",
            right: "4",
            fontSize: "2xl",
            cursor: "pointer",
            color: "gray.500",
            bg: "transparent",
            border: "none",
          })}
        >
          ✕
        </button>

        <Flex direction="column" alignItems="center" gap="4">
          {/* アイコン */}
          <img
            src={user.icon}
            alt={user.name}
            className={css({
              width: "24", // 96px
              height: "24",
              borderRadius: "full",
              objectFit: "cover",
              bg: "gray.300",
              border: "1px solid token(colors.gray.200)",
            })}
          />
          {/* 名前 */}
          <h2 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            {user.name}
          </h2>

          <hr className={css({ width: "100%", borderColor: "gray.200" })} />

          {/* 詳細情報エリア */}
          <Flex direction="column" width="100%" gap="4" textAlign="left">
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                習慣的な利用ルート
              </Box>
              <Box fontWeight="medium">{user.habitualRoute}</Box>
            </div>
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                自己紹介・メモ
              </Box>
              <Box fontSize="sm" color="gray.700" lineHeight="1.6">
                {user.bio}
              </Box>
            </div>
            <div className={css({ fontSize: "xs", color: "red.500", mt: "2" })}>
              ※ ブロック中のため、このユーザーとはマッチングしません。
            </div>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
