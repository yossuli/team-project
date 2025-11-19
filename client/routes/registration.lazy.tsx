"use client";

import { Box, Flex, styled } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
import { hc } from "hono/client";
import { useEffect, useMemo, useState } from "hono/jsx";
import type { Routes } from "~/.hc.type";
import { TimeSlotGrid } from "~/components/ui/TimeSlotGrid";
import { Button } from "~/components/ui/button";

const client = hc<Routes>("");

const addHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

// ----------------------------------------------------
// ▼ 変更点 1: 15分切り上げヘルパー関数を定義 ▼
// ----------------------------------------------------
const getRoundedDate = (date: Date): Date => {
  const newDate = new Date(date);
  // 秒とミリ秒をリセット
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  // 15分単位に切り上げる
  const minutes = newDate.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    const minutesToAdd = 15 - remainder;
    newDate.setMinutes(newDate.getMinutes() + minutesToAdd);
  }
  return newDate;
};

// ... (StyledCard, StyledHeading, StyledText の定義は変更なし) ...

// Card (白枠のコンテナ)
const StyledCard = styled(Box, {
  base: {
    backgroundColor: "white",
    borderRadius: "lg",
    padding: "6",
    width: "100%",
    boxShadow: "lg",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
  },
});
// メインタイトル (h1)
const StyledHeading = styled("h1", {
  base: {
    fontSize: "2xl",
    fontWeight: "semibold",
    color: "black",
    marginBottom: "4",
    textAlign: "center",
  },
});
// 説明文 (p)
const StyledText = styled("p", {
  base: {
    fontSize: "sm",
    color: "gray.600",
    textAlign: "center",
    lineHeight: "normal",
  },
});

// (リンターエラー回避用のヘルパー)
const getNextDate = (current: Date | null, maxStartDate: Date | null): Date => {
  if (!current) {
    return getRoundedDate(new Date());
  }
  if (!maxStartDate) {
    return addHours(current, 2);
  }
  const newDate = addHours(current, 2);
  return newDate.getTime() > maxStartDate.getTime() ? maxStartDate : newDate;
};

const getPrevDate = (current: Date | null, now: Date | null): Date => {
  if (!current) {
    return getRoundedDate(new Date());
  }
  if (!now) {
    return addHours(current, -2);
  }
  const newDate = addHours(current, -2);
  return newDate.getTime() < now.getTime() ? now : newDate;
};

function RegistrationScreen() {
  // ----------------------------------------------------
  // ▼ 変更点 1: 最初から時刻を入れておく (nullにしない) ▼
  // ----------------------------------------------------
  // こうすることで「読み込み中」の判定をスキップできます
  const [baseDate, setBaseDate] = useState(() => getRoundedDate(new Date()));
  const [now, setNow] = useState(() => getRoundedDate(new Date()));

  // maxStartDate も最初から計算しておく
  const [maxStartDate, setMaxStartDate] = useState(() => {
    const d = getRoundedDate(new Date());
    return addHours(d, 4);
  });

  // ----------------------------------------------------
  // ▼ 変更点 2: useEffect は「念のため」の更新だけにする ▼
  // ----------------------------------------------------
  useEffect(() => {
    // ブラウザで表示された瞬間に、もう一度最新の時刻に合わせ直す
    // (サーバーとクライアントの時刻ズレを直すため)
    const currentDate = getRoundedDate(new Date());
    const limitDate = addHours(currentDate, 4);

    setBaseDate(currentDate);
    setNow(currentDate);
    setMaxStartDate(limitDate);
  }, []);

  // ----------------------------------------------------
  // ▼ 変更点 3: nullチェックを簡略化 ▼
  // ----------------------------------------------------
  const { isPrevDisabled, isNextDisabled } = useMemo(() => {
    // baseDateなどが万が一 null でもエラーにならないようガード
    if (!baseDate || !now || !maxStartDate) {
      return { isPrevDisabled: true, isNextDisabled: true };
    }
    const prev = baseDate.getTime() <= now.getTime();
    const next = baseDate.getTime() >= maxStartDate.getTime();
    return { isPrevDisabled: prev, isNextDisabled: next };
  }, [baseDate, now, maxStartDate]);

  const handlePrevPage = () => {
    setBaseDate((current) => getPrevDate(current, now));
  };

  const handleNextPage = () => {
    setBaseDate((current) => getNextDate(current, maxStartDate));
  };

  const handleResetToNow = () => {
    const currentDate = getRoundedDate(new Date());
    setBaseDate(currentDate);
    setNow(currentDate);
    setMaxStartDate(addHours(currentDate, 4));
  };

  // ----------------------------------------------------
  // ▼ 変更点 4: 「読み込み中...」の return ブロックを削除 ▼
  // ----------------------------------------------------
  // ここにあった if (!baseDate) { return ... } を削除しました。
  // これにより、強制的に下の描画処理が実行されます。

  return (
    <Flex
      direction="column"
      align="center"
      paddingTop="8"
      width="100%"
      maxWidth="400px"
      marginX="auto"
    >
      <StyledCard>
        <StyledHeading>移動情報を登録する</StyledHeading>
        <StyledText>
          地図を用意し、その上に検索バーをつける
          <br />
          地図上で出発地と目的地を指定する
        </StyledText>

        {/* baseDate があれば表示、なければ現在時刻で無理やり表示 */}
        {baseDate && (
          <TimeSlotGrid
            baseDate={baseDate}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onResetToNow={handleResetToNow}
            isPrevDisabled={isPrevDisabled}
            isNextDisabled={isNextDisabled}
          />
        )}

        <Button size="lg" width="auto" paddingX="8">
          登録
        </Button>
      </StyledCard>
    </Flex>
  );
}

// ----------------------------------------------------
// ▼ 変更点 8: createLazyFileRoute を使用 ▼
// ----------------------------------------------------
export const Route = createLazyFileRoute("/registration")({
  component: RegistrationScreen,
});
