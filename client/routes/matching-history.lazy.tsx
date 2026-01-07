"use client";

import { useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { Link, createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/matching-history")({
  component: MatchingHistoryPage,
});

type HistoryItem = {
  id: number;
  target_date: string;
  start_time: string;
  departure_location: string;
  destination_location: string;
  matched_at: string;
  route_info?: any;
  partner?: {
    nickname: string;
    username?: string;
    icon_image_url: string;
  };
};

// 日時が過去かどうかを判定するヘルパー関数
const isPast = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) {
    return false;
  }
  const target = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  return target < now;
};

function MatchingHistoryPage() {
  const { user, isLoaded } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("reservations")
          .select(`
            *,
            partner:users!partner_id ( nickname, username, icon_image_url ) 
          `)
          .eq("user_id", user.id)
          .eq("status", "matched")
          .order("target_date", { ascending: false });

        if (error) {
          throw error;
        }

        const formattedData = (data || []).map((item: any) => ({
          ...item,
          partner: item.partner,
        }));

        // 👇 ここで「過去の日時」のものだけにフィルタリング
        const pastOnlyData = formattedData.filter((item: HistoryItem) =>
          isPast(item.target_date, item.start_time),
        );

        setHistory(pastOnlyData);
      } catch (e) {
        console.error("履歴取得エラー:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isLoaded, user]);

  const handleItemClick = (item: HistoryItem) => {
    if (!item.route_info) {
      alert("この履歴にはルート詳細データが保存されていません。");
      return;
    }
    navigate({
      to: "/match-details",
      state: { routeInfo: item.route_info },
    });
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <Flex direction="column" p="4" maxWidth="600px" mx="auto" pb="20">
      <h1
        className={css({
          fontSize: "xl",
          fontWeight: "bold",
          mb: "6",
          textAlign: "center",
        })}
      >
        過去のマッチング履歴
      </h1>

      {loading ? (
        <Box textAlign="center" color="gray.500">
          読み込み中...
        </Box>
      ) : history.length === 0 ? (
        <Box textAlign="center" py="10" bg="gray.50" borderRadius="md">
          <p className={css({ color: "gray.500", mb: "4" })}>
            完了した過去の履歴はありません。
          </p>
          <Link
            to="/"
            className={css({
              color: "primary",
              fontWeight: "bold",
              textDecoration: "underline",
            })}
          >
            相乗りを探す
          </Link>
        </Box>
      ) : (
        <Flex direction="column" gap="4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={css({
                border: "1px solid token(colors.gray.200)",
                borderRadius: "lg",
                padding: "4",
                bg: "white",
                boxShadow: "sm",
                cursor: "pointer",
                transition: "all 0.2s",
                _hover: {
                  borderColor: "primary",
                  boxShadow: "md",
                  transform: "translateY(-2px)",
                },
              })}
            >
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb="3"
                pb="2"
                borderBottom="1px solid #eee"
              >
                <Box fontSize="sm" fontWeight="bold" color="gray.600">
                  📅 {item.target_date} {item.start_time}
                </Box>
                <Box
                  fontSize="xs"
                  color="gray.600"
                  bg="gray.200"
                  px="2"
                  py="1"
                  borderRadius="full"
                >
                  完了
                </Box>
              </Flex>

              <Flex alignItems="center" gap="3" mb="3">
                <img
                  src={
                    item.partner?.icon_image_url ||
                    "https://via.placeholder.com/40"
                  }
                  alt="Partner"
                  className={css({
                    width: "10",
                    height: "10",
                    borderRadius: "full",
                    objectFit: "cover",
                    border: "1px solid #ddd",
                    filter: "grayscale(100%)", // 過去のものなので少し色を落とす演出
                  })}
                />
                <Box>
                  <div className={css({ fontSize: "xs", color: "gray.500" })}>
                    相乗りパートナー
                  </div>
                  <div className={css({ fontWeight: "bold", fontSize: "md" })}>
                    {item.partner?.username ||
                      item.partner?.nickname ||
                      "不明なユーザー"}
                  </div>
                </Box>
              </Flex>

              <Box bg="gray.50" p="3" borderRadius="md" fontSize="sm">
                <Flex align="center" gap="2" mb="1">
                  <span
                    className={css({ color: "blue.500", fontWeight: "bold" })}
                  >
                    発
                  </span>
                  {item.departure_location}
                </Flex>
                <Box ml="1.5" borderLeft="2px dotted #ccc" h="16px" my="1" />
                <Flex align="center" gap="2">
                  <span
                    className={css({ color: "red.500", fontWeight: "bold" })}
                  >
                    着
                  </span>
                  {item.destination_location}
                </Flex>
              </Box>

              <Box textAlign="right" mt="2" fontSize="xs" color="gray.400">
                タップして詳細を確認 &gt;
              </Box>
            </div>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
