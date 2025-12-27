import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { createRoute } from "honox/factory";
import { z } from "zod";

const getPrismaClient = async (db: D1Database) => {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
};

// 1. ブロック一覧を取得するAPI
export const GET = createRoute(clerkMiddleware(), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const myUserId = auth.userId;
  const prisma = await getPrismaClient(c.env.DB);

  // 自分がブロックしているユーザーを取得
  const blocks = await prisma.block.findMany({
    where: { blockerId: myUserId },
    include: {
      blocked: true, // ブロックされた相手の情報も一緒に取る
    },
    orderBy: { createdAt: "desc" },
  });

  // フロントエンド用にデータを整形
  const responseData = blocks.map((block) => ({
    id: block.blocked.id,
    name: block.blocked.nickname,
    icon: block.blocked.iconImageUrl || "https://via.placeholder.com/150",
    blockedDate: block.createdAt.toISOString(),
    // ※ 詳細情報はUserモデルにないので一旦仮置き
    habitualRoute: "詳細情報はまだDBにありません",
    bio: "プロフィールの自己紹介はまだDBにありません",
  }));

  return c.json(responseData);
});

// 2. ブロックを解除するAPI
// ( /api/block-list?targetId=xxx にDELETEリクエストを送ると解除)
export const DELETE = createRoute(
  clerkMiddleware(),
  zValidator("query", z.object({ targetId: z.string() })),
  async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    const myUserId = auth.userId;
    const { targetId } = c.req.valid("query");
    const prisma = await getPrismaClient(c.env.DB);

    try {
      await prisma.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId: myUserId,
            blockedId: targetId,
          },
        },
      });
      return c.json({ success: true });
    } catch (e) {
      return c.json({ success: false, message: "Failed to unblock" }, 400);
    }
  },
);
