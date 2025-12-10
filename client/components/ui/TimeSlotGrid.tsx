"use client";

import { Box, Flex, styled } from "@ss/jsx";
import { useEffect, useMemo, useState } from "hono/jsx";
import { TimePriorityRow } from "./TimePriorityRow";

const DateText = styled("span", {
  base: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "lg",
    marginBottom: "4",
    display: "block", // span をブロック要素にしてマージンを効かせる
  },
});

// ナビゲーションボタン (「前へ」「現在時刻」など)
const NavButton = styled("button", {
  base: {
    cursor: "pointer",
    paddingX: "3", // 'size=sm' 相当
    paddingY: "1.5", // 'size=sm' 相当
    fontSize: "sm",
    fontWeight: "medium",
    borderRadius: "md", // 'size=sm' 相当
    transition: "all 0.2s",
    // 無効化 (disabled) された時のスタイル
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  variants: {
    variant: {
      ghost: {
        // 「前へ」「次へ」用
        bg: "transparent",
        _hover: {
          bg: "gray.100",
        },
      },
      outline: {
        // 「現在時刻」用
        border: "1px solid",
        borderColor: "gray.300",
        bg: "transparent",
        _hover: {
          bg: "gray.100",
        },
      },
    },
  },
});

interface TimeSlotGridProps {
  baseDate: Date;
  onPrevPage: () => void;
  onNextPage: () => void;
  onResetToNow: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

type PriorityState = Record<string, number | null>;

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const TimeSlotGrid = (props: TimeSlotGridProps) => {
  const {
    baseDate,
    onPrevPage,
    onNextPage,
    onResetToNow,
    isPrevDisabled,
    isNextDisabled,
  } = props;

  const [priorities, setPriorities] = useState<PriorityState>({});

  useEffect(() => {
    setPriorities({});
  }, [baseDate]);

  const timeLabels = useMemo(() => {
    const labels: string[] = [];
    let currentDate = new Date(baseDate); // baseDate のコピーを作成

    for (let i = 0; i < 8; i++) {
      // 8行分
      labels.push(formatTime(currentDate));
      // 15分進める
      currentDate = new Date(currentDate.getTime() + 15 * 60 * 1000);
    }
    return labels;
  }, [baseDate]);

  const handlePriorityChange = (timeLabel: string, priority: number | null) => {
    setPriorities((current) => ({
      ...current,
      [timeLabel]: priority,
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <Box
        border="1px solid"
        borderColor="gray.200"
        bg="white"
        borderRadius="lg"
        paddingY="4"
        paddingX="4"
        marginTop="6"
        marginBottom="8"
        width="100%"
        boxSizing="border-box"
      />
      <Flex
        justify="space-between"
        align="center"
        paddingX="0"
        marginBottom="4"
      >
        <NavButton
          variant="ghost"
          onClick={onPrevPage}
          disabled={isPrevDisabled}
        >
          ← 前へ
        </NavButton>
        <NavButton variant="outline" onClick={onResetToNow}>
          現在時刻
        </NavButton>
        <NavButton
          variant="ghost"
          onClick={onNextPage}
          disabled={isNextDisabled}
        >
          次へ →
        </NavButton>
      </Flex>
      <DateText>{formatDate(baseDate)}</DateText>

      {/* グリッド本体 (TimePriorityRow を使用) */}
      <Flex direction="column" gap="0">
        {timeLabels.map((label) => (
          <TimePriorityRow
            key={label}
            timeLabel={label}
            currentPriority={priorities[label] || null}
            onPriorityChange={(priority) =>
              handlePriorityChange(label, priority)
            }
          />
        ))}
      </Flex>
    </div>
  );
};
