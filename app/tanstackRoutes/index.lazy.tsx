import { createLazyRoute, createLazyFileRoute } from "@tanstack/react-router";
import { hc } from "hono/client";
import type { Routes } from "../.hc.type";

const client = hc<Routes>("");

export const Route = createLazyRoute("/")({
  component: () => {
    return <>hoge</>;
  },
});
