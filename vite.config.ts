import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import honox, { devServerDefaultOptions } from "honox/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [viteReact(), TanStackRouterVite({}), tsconfigPaths()],
      build: {
        rollupOptions: {
          input: ["./app/client.tsx"],
          output: {
            entryFileNames: "static/client.js",
          },
          external: ["cloudflare:workers"],
        },
      },
    };
  }
  return {
    ssr: {
      external: [
        "react",
        "react-dom",
        "@hono/clerk-auth",
        "@prisma/client",
        "@prisma/adapter-d1",
        "cloudflare:workers",
      ],
    },
    plugins: [
      honox({
        devServer: {
          adapter,
          entry: "app/index.tsx",
          exclude: [
            ...devServerDefaultOptions.exclude,
            /^\/app\/.+\.tsx?/,
            /^\/favicon.ico/,
            /^\/static\/.+/,
            /^\/app\/styled-system\/.+\.mjs?/,
          ],
        },
      }),
      pages({
        entry: ["app/index.tsx"],
      }),
      tsconfigPaths(),
    ],
    test: {
      include: ["./app/{utils/**/*.ts,**/*.test.ts,types/**/*.ts}"],
    },
    alias: {},
    build: {
      rollupOptions: {
        external: ["cloudflare:workers"],
      },
    },
  };
});
