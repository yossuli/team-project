import { generateHcType } from "cmd/generateHcType";
import { type Env, Hono } from "hono";
import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import { renderToString } from "react-dom/server";
import { href } from "./.assets-css";

const base = new Hono<Env>();

base.get("*", async (c, next) => {
  if (c.req.url.includes("/api")) {
    return next();
  }

  return c.html(
    renderToString(
      <html lang="ja">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <link
            rel="stylesheet"
            href="https://cdn.simplecss.org/simple.min.css"
          />
          {import.meta.env.PROD ? (
            <>
              <script type="module" src="/static/client.js" />
              <link rel="stylesheet" href={href} />
            </>
          ) : (
            <script type="module" src="/client/index.tsx" />
          )}
        </head>
        <body>
          <div id="root" />
        </body>
      </html>,
    ),
  );
});

const app = createApp({ app: base });
showRoutes(app);

generateHcType(app, "../client/.hc.type.ts");

export default app;
