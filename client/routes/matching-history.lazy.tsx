import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/matching-history")({
  component: MatchingHistoryPage,
});

// --- 🛠️ モックデータ ---
// isBlocked フラグを追加して状態を管理できるようにします
const initialHistoryData = [
  {
    id: 1,
    date: "2023/11/01 18:00",
    partner: "田中 太郎",
    partnerIcon: "https://via.placeholder.com/150",
    route: "東京駅 → 新宿駅",
    status: "完了",
    habitualRoute: "東京駅 ↔ 新宿駅 (平日 9:00)",
    bio: "平日は毎日通勤で利用しています。静かに過ごすのが好きです。",
    isBlocked: false, // ブロック状態
  },
  {
    id: 2,
    date: "2023/10/28 12:30",
    partner: "鈴木 花子",
    partnerIcon: "https://via.placeholder.com/150",
    route: "渋谷駅 → 横浜駅",
    status: "完了",
    habitualRoute: "渋谷駅 ↔ 横浜駅 (週末)",
    bio: "週末によく買い物に行きます。おしゃべり好きです。",
    isBlocked: false,
  },
  {
    id: 3,
    date: "2023/10/20 09:00",
    partner: "佐藤 次郎",
    partnerIcon: "https://via.placeholder.com/150",
    route: "大宮駅 → 上野駅",
    status: "キャンセル",
    habitualRoute: "大宮駅 ↔ 上野駅 (不定期)",
    bio: "出張で利用することが多いです。",
    isBlocked: false,
  },
];

function MatchingHistoryPage() {
  // 履歴データ自体をstateで管理して、ブロック状態を更新できるようにする
  const [historyList, setHistoryList] = useState(initialHistoryData);

  // 選択された相手のデータ（モーダル用）
  const [selectedPartner, setSelectedPartner] = useState<
    (typeof initialHistoryData)[0] | null
  >(null);

  // ブロックボタンを押した時の処理
  const handleBlock = (id: number, partnerName: string) => {
    if (confirm(`${partnerName}さんをブロックしますか？`)) {
      // 該当するIDのデータの isBlocked を true に書き換える
      setHistoryList((prevList) =>
        prevList.map((item) =>
          item.id === id ? { ...item, isBlocked: true } : item,
        ),
      );
      // ※ページ遷移はせず、その場で更新されます
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
        <h1
          className={css({
            fontSize: "xl",
            fontWeight: "bold",
            textAlign: "center",
          })}
        >
          マッチング履歴
        </h1>

        {/* 履歴リスト */}
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
                  {item.date}
                </span>
                <span
                  className={css({
                    fontSize: "xs",
                    padding: "1 2",
                    borderRadius: "full",
                    bg: item.status === "完了" ? "green.100" : "red.100",
                    color: item.status === "完了" ? "green.800" : "red.800",
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
                {/* 相手のアイコン・名前部分 */}
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

                {/* ブロックボタン (状態によって切り替え) */}
                {item.isBlocked ? (
                  // ブロック中の表示
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
                  // 通常のブロックボタン
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
  partner: (typeof initialHistoryData)[0];
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
