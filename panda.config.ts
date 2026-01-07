import { defineConfig } from "@pandacss/dev";
import { createPreset } from "@park-ui/panda-preset";
import amber from "@park-ui/panda-preset/colors/amber";
import sand from "@park-ui/panda-preset/colors/sand";

export default defineConfig({
  strictPropertyValues: true,
  preflight: true,
  presets: [
    "@pandacss/dev/presets",
    createPreset({ accentColor: amber, grayColor: sand, radius: "sm" }),
  ],
  include: ["./app/**/*.{js,jsx,ts,tsx}", "./client/**/*.{js,jsx,ts,tsx}"],
  importMap: {
    css: "@ss/css",
    jsx: "@ss/jsx",
    recipes: "@ss/recipes",
    patterns: "@ss/patterns",
  },
  jsxFramework: "react",
  outdir: "./styled-system",

  // 👇 [追加] ここで色を定義しました
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: "#2563EB" }, // メインカラー (テックブルー)
          secondary: { value: "#60A5FA" }, // アクセント (明るい青)
          background: { value: "#F9FAFB" }, // アプリ背景 (薄いグレー)
          surface: { value: "#FFFFFF" }, // カード・ヘッダー背景 (白)
        },
      },
    },
  },

  globalCss: {
    // 👇 [追加] 画面全体の背景色を自動で「薄いグレー」に設定
    body: {
      bg: "background",
      color: "black",
    },
    // ... (以下は元の設定のまま) ...
    "h1, h2, h3, h4, h5, h6": {
      my: {
        base: "3",
        md: "6",
        lg: "8",
      },
    },
    pre: {
      overflowX: "scroll",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "2",
      w: "fit-content",
      "& > div": {
        display: "flex",
        flexDirection: "row",
        gap: "2",
      },
    },
    button: {
      width: "fit-content",
      margin: "auto",
    },
    hr: {
      width: "100%",
      gridColumn: "1/-1",
    },
    "*": {
      wordBreak: "keep-all",
    },
    "d_grid > div": {
      width: "100%",
    },
  },
  patterns: {
    extend: {
      container: {
        defaultValues: {
          display: "flex",
          alignItems: "center",
        },
      },
      grid: {
        defaultValues: {
          alignItems: "center",
          justifyItems: "center",
          columns: 2,
          width: "100%",
        },
        transform(props) {
          const { columns, ...rest } = props;
          return {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, auto)`,
            gap: "2",
            ...rest,
          };
        },
      },
      br: {
        transform() {
          return {
            w: "100%",
          };
        },
        jsxElement: "span",
      },
    },
  },
});
