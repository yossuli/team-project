import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createLazyFileRoute("/block-list")({
  component: BlockListPage,
});

// データ型の定義
type BlockedUser = {
  id: string;
  name: string;
  icon: string;
  blockedDate: string;
  habitualRoute: string;
  bio: string;
};

function BlockListPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 画面表示時にAPIから一覧を取得
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const res = await fetch("/api/block-list");
        if (res.ok) {
          const data = await res.json();
          setBlockedUsers(data);
        }
      } catch (error) {
        console.error("Error fetching blocked users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  // ブロック解除ボタンの処理
  const handleUnblock = async (userId: string, userName: string) => {
    if (confirm(`${userName}さんのブロックを解除しますか？`)) {
      try {
        // APIを叩いて削除
        const res = await fetch(`/api/block-list?targetId=${userId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // 成功したら画面のリストからも消す
          setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
          alert("ブロックを解除しました");
        } else {
          alert("解除に失敗しました");
        }
      } catch (error) {
        console.error("Error unblocking user:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" p="10">
        読み込み中...
      </Flex>
    );
  }

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
                {/* ユーザー情報部分 */}
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
                    <span
                      className={css({ fontSize: "xs", color: "gray.500" })}
                    >
                      ブロック日:{" "}
                      {new Date(user.blockedDate).toLocaleDateString()}
                    </span>
                  </Flex>
                </Flex>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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

      {/* 詳細モーダル */}
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
  user: BlockedUser;
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
      onClick={onClose}
    >
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
        onClick={(e) => e.stopPropagation()}
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
          <img
            src={user.icon}
            alt={user.name}
            className={css({
              width: "24",
              height: "24",
              borderRadius: "full",
              objectFit: "cover",
              bg: "gray.300",
              border: "1px solid token(colors.gray.200)",
            })}
          />
          <h2 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            {user.name}
          </h2>

          <hr className={css({ width: "100%", borderColor: "gray.200" })} />

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
