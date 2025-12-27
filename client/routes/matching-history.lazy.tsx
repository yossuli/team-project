import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createLazyFileRoute("/matching-history")({
  component: MatchingHistoryPage,
});

// データ型の定義 (APIのレスポンスに合わせる)
type HistoryItem = {
  id: number;
  date: string;
  partner: string;
  partnerIcon: string;
  route: string;
  status: string;
  habitualRoute: string;
  bio: string;
  isBlocked: boolean;
};

function MatchingHistoryPage() {
  // モックデータの代わりに、空の配列で初期化
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<HistoryItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true); // ローディング状態

  // 👇 画面が表示されたらAPIからデータを取得する
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history"); // APIを叩く
        if (res.ok) {
          const data = await res.json();
          setHistoryList(data); // データをセット
        } else {
          console.error("Failed to fetch history");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleBlock = (id: number, partnerName: string) => {
    if (confirm(`${partnerName}さんをブロックしますか？`)) {
      // (TODO: ここで本来はブロックAPIを叩く)
      setHistoryList((prevList) =>
        prevList.map((item) =>
          item.id === id ? { ...item, isBlocked: true } : item,
        ),
      );
    }
  };

  // ローディング中の表示
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
        <h1
          className={css({
            fontSize: "xl",
            fontWeight: "bold",
            textAlign: "center",
          })}
        >
          マッチング履歴
        </h1>

        {/* データがない場合の表示 */}
        {historyList.length === 0 ? (
          <Box textAlign="center" color="gray.500">
            マッチング履歴はありません
          </Box>
        ) : (
          /* 履歴リスト */
          <Flex direction="column" gap="4">
            {historyList.map((item) => (
              <div
                key={item.id}
                className={css({
                  border: "1px solid token(colors.gray.200)",
                  borderRadius: "md",
                  padding: "4",
                  bg: "white",
                  boxShadow: "sm",
                })}
              >
                {/* 上段：日付とステータス */}
                <Flex justifyContent="space-between" alignItems="center" mb="3">
                  <span className={css({ fontSize: "sm", color: "gray.500" })}>
                    {/* 日付のフォーマット (簡易) */}
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span
                    className={css({
                      fontSize: "xs",
                      padding: "1 2",
                      borderRadius: "full",
                      bg:
                        item.status === "completed" ? "green.100" : "gray.100",
                      color:
                        item.status === "completed" ? "green.800" : "gray.800",
                      fontWeight: "bold",
                    })}
                  >
                    {item.status}
                  </span>
                </Flex>

                {/* 中段：ルート情報 */}
                <Box fontSize="lg" fontWeight="bold" mb="4">
                  {item.route}
                </Box>

                <hr className={css({ borderColor: "gray.200", mb: "3" })} />

                {/* 下段：相手の情報とブロックボタン */}
                <Flex alignItems="center" justifyContent="space-between">
                  <Flex
                    alignItems="center"
                    gap="3"
                    onClick={() => setSelectedPartner(item)}
                    className={css({
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      _hover: { opacity: 0.7 },
                    })}
                  >
                    <img
                      src={item.partnerIcon}
                      alt={item.partner}
                      className={css({
                        width: "10",
                        height: "10",
                        borderRadius: "full",
                        objectFit: "cover",
                        bg: "gray.300",
                      })}
                    />
                    <Flex direction="column">
                      <span
                        className={css({ fontSize: "xs", color: "gray.500" })}
                      >
                        相乗り相手
                      </span>
                      <span
                        className={css({ fontWeight: "bold", fontSize: "sm" })}
                      >
                        {item.partner}
                      </span>
                    </Flex>
                  </Flex>

                  {/* ブロックボタン */}
                  {item.isBlocked ? (
                    <button
                      type="button"
                      disabled
                      className={css({
                        border: "1px solid token(colors.gray.300)",
                        color: "gray.500",
                        bg: "gray.100",
                        fontSize: "xs",
                        fontWeight: "bold",
                        padding: "1 3",
                        borderRadius: "sm",
                        cursor: "not-allowed",
                      })}
                    >
                      ブロック中
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlock(item.id, item.partner);
                      }}
                      className={css({
                        border: "1px solid token(colors.red.500)",
                        color: "red.500",
                        bg: "white",
                        fontSize: "xs",
                        fontWeight: "bold",
                        padding: "1 3",
                        borderRadius: "sm",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        _hover: {
                          bg: "red.50",
                        },
                      })}
                    >
                      ブロック
                    </button>
                  )}
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Flex>

      {/* 相手情報モーダル */}
      {selectedPartner && (
        <PartnerInfoModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </>
  );
}

// --- 👤 相手情報詳細モーダル ---
function PartnerInfoModal({
  partner,
  onClose,
}: {
  partner: HistoryItem; // 型をHistoryItemに変更
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
            src={partner.partnerIcon}
            alt={partner.partner}
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
            {partner.partner}
          </h2>

          <hr className={css({ width: "100%", borderColor: "gray.200" })} />

          <Flex direction="column" width="100%" gap="4" textAlign="left">
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                習慣的な利用ルート
              </Box>
              <Box fontWeight="medium">{partner.habitualRoute}</Box>
            </div>
            <div>
              <Box fontSize="sm" color="gray.500" mb="1">
                自己紹介・メモ
              </Box>
              <Box fontSize="sm" color="gray.700" lineHeight="1.6">
                {partner.bio}
              </Box>
            </div>
          </Flex>
        </Flex>
      </div>
    </div>
  );
}
