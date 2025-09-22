import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  strictPropertyValues: true,
  include: ["./app/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  globalCss: {
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
  outdir: "./app/styled-system",
  importMap: {
    css: "@ss/css",
    jsx: "@ss/jsx",
    patterns: "@ss/patterns",
  },
  jsxFramework: "react",
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
