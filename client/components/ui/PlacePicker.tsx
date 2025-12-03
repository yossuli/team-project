"use client";
import { Box, styled } from "styled-system/jsx";

// ラベル
const Label = styled("label", {
  base: {
    display: "block",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
});

// 入力エリア全体のコンテナ
const InputContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ccc",
    borderRadius: "6px",
    overflow: "hidden", // 角丸を内部要素に適用させるため
    cursor: "pointer",
    backgroundColor: "white",
    transition: "all 0.2s",
    _hover: {
      borderColor: "#888",
    },
  },
});

// 右側のテキストエリア
const InputText = styled("input", {
  base: {
    flex: 1,
    border: "none",
    padding: "0 16px",
    fontSize: "16px",
    color: "#333",
    outline: "none",
    cursor: "pointer", // クリックできることを示す
    _placeholder: {
      color: "#aaa",
    },
  },
});

interface DestinationPickerProps {
  label?: string;
  value?: string; // 選択された住所や場所名
  onClick?: () => void; // クリック時の処理 (Google Mapを開くなど)
}

export const DestinationPicker = ({
  label = "目的地を選択", // デフォルト値
  value,
  onClick,
}: DestinationPickerProps) => {
  return (
    <Box width="100%" maxWidth="400px">
      <Label>{label}</Label>

      <InputContainer onClick={onClick}>
        <InputText
          type="text"
          readOnly // 手入力させず、マップから選択させるなら readOnly にする
          placeholder="Input" // 画像に合わせて Input
          value={value || ""}
        />
      </InputContainer>
    </Box>
  );
};
