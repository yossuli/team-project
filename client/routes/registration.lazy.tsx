import { Flex } from "@ss/jsx";
import { createLazyRoute, createLazyFileRoute } from "@tanstack/react-router";
import { hc } from "hono/client";
import { Button } from "~/components/ui/button";
import type { Routes } from "../.hc.type";

const client = hc<Routes>("");

export const Route = createLazyRoute("/registration")({
  component: () => {
    
    return (
      <Flex direction="column" gap="4" p="4">
        <h1>移動情報を登録する</h1>
        <div style={{
          width: "100px",
          height: "100px",
          backgroundColor: "#F00"
        }}></div>
        <div style={{
          width: "100px",
          height: "100px",
          backgroundColor: "#F00"
        }}></div>
        <div style={{
          width: "100px",
          height: "100px",
          backgroundColor: "#F00"
        }}></div>
      </Flex>
    );
  },
});
