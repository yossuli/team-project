import { Flex } from "@ss/jsx";
import { createLazyRoute, createLazyFileRoute } from "@tanstack/react-router";
import { hc } from "hono/client";
import type { Routes } from "../.hc.type";

const client = hc<Routes>("");

export const Route = createLazyRoute("/")({
  component: () => {
    return (
      <Flex direction="column">
        <h1>hoge</h1>
        <div>fuga</div>
      </Flex>
    );
  },
});
