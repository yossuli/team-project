import {} from "hono";

declare module "hono" {
  // @ts-ignore
  interface Env {
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    Variables: {};
    Bindings: {
      DB: D1Database;
    };
  }
}
