"use client";

import { createLazyFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { Box, Flex, styled } from "styled-system/jsx";

export const Route = createLazyFileRoute("/detail")({
  component: ReservationDetailScreen,
});

// -----------------------------------------------------------------
// スタイル定義
// -----------------------------------------------------------------

// アイコン画像 (丸形)
const UserAvatar = styled("img", {
  base: {
    borderRadius: "9999px",
    objectFit: "cover",
    border: "1px solid #eee",
  },
  variants: {
    size: {
      sm: { width: "32px", height: "32px" },
      md: { width: "48px", height: "48px" },
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

// 情報表示用の枠 (入力欄のような見た目)
const InfoBox = styled("div", {
  base: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    fontSize: "14px",
    color: "#333",
    marginBottom: "8px", // 下のマージン
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // 中身を両端に
  },
});

// 詳細ボタン (白背景・黒枠)
const DetailButton = styled("button", {
  base: {
    padding: "8px 24px",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor: "white",
    border: "1px solid #333",
    borderRadius: "4px",
    cursor: "pointer",
    color: "#333",
    transition: "background 0.2s",
    _hover: { backgroundColor: "#f9f9f9" },
  },
});

// マッチリクエストボタン (黒背景・白文字)
const RequestButton = styled("button", {
  base: {
    padding: "12px 32px",
    fontSize: "14px",
    fontWeight: "bold",
    backgroundColor: "black",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.1s",
    _active: { transform: "scale(0.98)" },
  },
});

// -----------------------------------------------------------------
// メイン画面
// -----------------------------------------------------------------
function ReservationDetailScreen() {
  return (
    <Box
      maxWidth="400px"
      mx="auto"
      minHeight="100vh"
      bg="white"
      pb="12" // 下部に余白
    >
      {/* 2. タイトル */}
      <Box textAlign="center" mt="2" mb="6">
        <h1 className={css({ fontSize: "20px", fontWeight: "bold" })}>
          予約情報
        </h1>
      </Box>

      {/* メインコンテンツエリア (左右余白あり) */}
      <Box px="6">
        {/* 3. 地図 (仮) */}
        <Box
          bg="#d9d9d9" // グレー背景
          width="100%"
          aspectRatio="1 / 0.9" // 正方形に近い比率
          mb="6"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="#333"
          fontSize="14px"
        >
          地図（仮）
        </Box>

        {/* 4. 情報リスト */}
        <Flex direction="column" gap="1">
          <InfoBox>出発地</InfoBox>
          <InfoBox>目的地</InfoBox>
          <InfoBox>目的地</InfoBox> {/* 画像通り2つ並べる */}
          <InfoBox>
            <span>出発希望時間帯</span>
            <span>希望度</span>
          </InfoBox>
        </Flex>

        {/* 5. ユーザー情報エリア */}
        <Flex align="center" mt="8" mb="8" gap="3">
          {/* 左側のアイコン */}
          <UserAvatar
            src="" // 別のダミー画像
            alt="Profile"
            size="md"
          />

          {/* 名前プレースホルダー (グレーの長方形) */}
          <Box bg="#eee" width="80px" height="16px" borderRadius="4px" />

          {/* 右端に詳細ボタン */}
          <Box ml="auto">
            <DetailButton>詳細</DetailButton>
          </Box>
        </Flex>

        {/* 6. マッチをリクエストボタン */}
        <Box textAlign="center" mt="8">
          <RequestButton>マッチをリクエスト</RequestButton>
        </Box>
      </Box>
    </Box>
  );
}
