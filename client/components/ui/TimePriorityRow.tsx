"use client";

// 変更点: 'styled' と 'Box' をインポート
import { Box, Flex, styled } from "styled-system/jsx";

// ----------------------------------------------------
// ▼ 変更点 1: Text と Button の代替を定義 ▼
// ----------------------------------------------------

// Text コンポーネントの代替 (PandaCSS で span タグにスタイルを当てる)
const StyledText = styled("span", {
  base: {
    fontSize: "md",
    fontWeight: "medium",
    color: "gray.800",
  },
});

// 優先度ボタン (円形) (PandaCSS で button タグにスタイルを当てる)
const PriorityButton = styled("button", {
  base: {
    cursor: "pointer",
    borderRadius: "full", // 円形
    width: "10", // 40px
    height: "10", // 40px
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "medium",
    fontSize: "sm",
    transition: "all 0.2s",
    border: "1px solid",
  },
  // バリアント（状態）を定義
  variants: {
    variant: {
      solid: {
        // 選択時のスタイル
        bg: "gray.900", // (PandaCSS の設定に依存します)
        color: "white",
        borderColor: "gray.900",
        _hover: {
          bg: "gray.700",
        },
      },
      outline: {
        // 非選択時のスタイル
        bg: "transparent",
        color: "gray.700",
        borderColor: "gray.300",
        _hover: {
          bg: "gray.100",
        },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
  },
});

// ----------------------------------------------------

interface TimePriorityRowProps {
  timeLabel: string;
  currentPriority: number | null;
  onPriorityChange: (priority: number | null) => void;
}

const PRIORITIES = [1, 2, 3, 4, 5];

export const TimePriorityRow = (props: TimePriorityRowProps) => {
  const { timeLabel, currentPriority, onPriorityChange } = props;

  const handleClick = (priority: number) => {
    if (priority === currentPriority) {
      onPriorityChange(null);
    } else {
      onPriorityChange(priority);
    }
  };

  return (
    <Flex
      align="center"
      justify="space-between"
      width="100%"
      paddingY="2.5"
      borderBottom="1px solid"
      borderColor="gray.200"
      _last={{ borderBottom: "none" }}
    >
      {/* 1列目: 時間ラベル (StyledTextを使用) */}
      <Box flexShrink={0} paddingRight="4">
        <StyledText>{timeLabel}</StyledText>
      </Box>

      {/* 2列目: 優先度ボタン (PriorityButtonを使用) */}
      <Flex justify="flex-end" gap="2" flexGrow={1}>
        {PRIORITIES.map((priority) => (
          <PriorityButton
            key={priority}
            variant={currentPriority === priority ? "solid" : "outline"}
            onClick={() => handleClick(priority)}
          >
            {priority}
          </PriorityButton>
        ))}
      </Flex>
    </Flex>
  );
};
