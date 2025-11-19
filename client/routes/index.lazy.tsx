import { Flex } from "@ss/jsx";
import { createLazyRoute, createLazyFileRoute } from "@tanstack/react-router";
import { hc } from "hono/client";
import { Button } from "~/components/ui/button";
import type { Routes } from "../.hc.type";

const client = hc<Routes>("");

export const Route = createLazyRoute("/")({
  component: () => {
    return (
      <Flex direction="column" gap="4" p="4">
        <h1>hoge</h1>
        <div>fuga</div>
        <form action="api/test" method="post">
          <Button>test</Button>
        </form>
      </Flex>
    );
  },
});
