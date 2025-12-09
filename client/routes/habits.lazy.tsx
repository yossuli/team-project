import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createLazyFileRoute("/habits")({
  component: HabitsPage,
});

// データ型定義
type Habit = {
  id: number;
  departure: string;
  destination: string;
  startTime: string;
  endTime: string;
};

// モックデータ
const initialHabits: Habit[] = [
  {
    id: 1,
    departure: "自宅",
    destination: "東京駅",
    startTime: "07:30",
    endTime: "08:00",
  },
  {
    id: 2,
    departure: "会社",
    destination: "ジム",
    startTime: "18:00",
    endTime: "18:30",
  },
];

function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBook = (habit: Habit) => {
    if (
      confirm(
        `以下の内容で予約を作成しますか？\n\n場所: ${habit.departure} → ${habit.destination}\n時間: ${habit.startTime} - ${habit.endTime}`,
      )
    ) {
      alert("予約リクエストを送信しました！");
    }
  };

  const deleteHabit = (id: number) => {
    if (confirm("このテンプレートを削除しますか？")) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
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
        pb="24"
      >
        {/* ヘッダー */}
        <Flex alignItems="center" gap="4">
          <Link
            to="/mypage"
            className={css({
              fontSize: "sm",
              color: "primary", // 👈 [変更] リンクを青に
              textDecoration: "underline",
              cursor: "pointer",
            })}
          >
            ← マイページ
          </Link>
          <h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            よく使うルート
          </h1>
        </Flex>

        {/* 習慣リスト */}
        <Flex direction="column" gap="4">
          {habits.length === 0 ? (
            <Box textAlign="center" color="gray.500" py="10">
              登録されたルートはありません。
              <br />
              よく使うルートを登録して、
              <br />
              ワンタップで予約できるようにしましょう。
            </Box>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className={css({
                  border: "1px solid token(colors.gray.200)",
                  borderRadius: "lg",
                  padding: "4",
                  bg: "white",
                  boxShadow: "sm",
                })}
              >
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  gap="4"
                >
                  <Flex direction="column" gap="1" flex={1}>
                    <Box fontSize="2xl" fontWeight="bold" lineHeight="1" mb="1">
                      {habit.startTime}
                      <span
                        className={css({
                          fontSize: "sm",
                          color: "gray.500",
                          ml: "1",
                        })}
                      >
                        - {habit.endTime}
                      </span>
                    </Box>
                    <Box fontWeight="medium" fontSize="md">
                      {habit.departure} → {habit.destination}
                    </Box>
                  </Flex>

                  {/* 予約ボタン */}
                  <button
                    type="button"
                    onClick={() => handleBook(habit)}
                    className={css({
                      bg: "primary", // 👈 [変更] 青ボタン
                      color: "white",
                      fontSize: "sm",
                      fontWeight: "bold",
                      padding: "3 6",
                      borderRadius: "md",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.2s",
                      _hover: { bg: "secondary" }, // 👈 [変更] ホバー色
                    })}
                  >
                    予約する
                  </button>
                </Flex>

                <Flex justifyContent="flex-end" mt="2">
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className={css({
                      fontSize: "xs",
                      color: "gray.400",
                      textDecoration: "underline",
                      cursor: "pointer",
                      bg: "transparent",
                      border: "none",
                      _hover: { color: "red.500" },
                    })}
                  >
                    この設定を削除
                  </button>
                </Flex>
              </div>
            ))
          )}
        </Flex>
      </Flex>

      {/* フローティング追加ボタン */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={css({
          position: "fixed",
          bottom: "6",
          right: "6",
          width: "14",
          height: "14",
          borderRadius: "full",
          bg: "black", // ※ここはアイコン的なので黒のままでもOKですが、青にするなら "primary"
          color: "white",
          fontSize: "3xl",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "lg",
          cursor: "pointer",
          _hover: { bg: "gray.800" },
        })}
      >
        +
      </button>

      {/* 新規追加モーダル */}
      {isModalOpen && (
        <AddHabitModal
          onClose={() => setIsModalOpen(false)}
          onAdd={(newHabit) =>
            setHabits([...habits, { ...newHabit, id: Date.now() }])
          }
        />
      )}
    </>
  );
}

// --- 📝 新規追加モーダルコンポーネント ---
function AddHabitModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (habit: Omit<Habit, "id">) => void;
}) {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departure || !destination) {
      alert("場所を入力してください");
      return;
    }
    onAdd({
      departure,
      destination,
      startTime,
      endTime,
    });
    onClose();
  };

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
          maxHeight: "90vh",
          overflowY: "auto",
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={css({
            fontSize: "lg",
            fontWeight: "bold",
            mb: "4",
            textAlign: "center",
          })}
        >
          よく使うルートを追加
        </h2>

        <form
          onSubmit={handleSubmit}
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "4",
          })}
        >
          <Flex direction="column" gap="2">
            <label className={css({ fontSize: "sm", fontWeight: "bold" })}>
              場所
            </label>
            <input
              placeholder="出発地 (例: 自宅)"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className={css({
                padding: "2",
                borderRadius: "md",
                border: "1px solid token(colors.gray.300)",
              })}
            />
            <input
              placeholder="目的地 (例: 会社)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={css({
                padding: "2",
                borderRadius: "md",
                border: "1px solid token(colors.gray.300)",
              })}
            />
          </Flex>

          <Flex direction="column" gap="2">
            <label className={css({ fontSize: "sm", fontWeight: "bold" })}>
              時間帯
            </label>
            <Flex alignItems="center" gap="2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={css({
                  padding: "2",
                  borderRadius: "md",
                  border: "1px solid token(colors.gray.300)",
                  flex: 1,
                })}
              />
              <span>~</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={css({
                  padding: "2",
                  borderRadius: "md",
                  border: "1px solid token(colors.gray.300)",
                  flex: 1,
                })}
              />
            </Flex>
          </Flex>

          <Flex gap="3" mt="4">
            <button
              type="button"
              onClick={onClose}
              className={css({
                flex: 1,
                padding: "3",
                borderRadius: "md",
                bg: "gray.200",
                fontWeight: "bold",
                cursor: "pointer",
              })}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={css({
                flex: 1,
                padding: "3",
                borderRadius: "md",
                bg: "primary", // 👈 [変更] 保存ボタンも青に
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.2s",
                _hover: { bg: "secondary" }, // 👈 [変更] ホバー色
              })}
            >
              保存
            </button>
          </Flex>
        </form>
      </div>
    </div>
  );
}
