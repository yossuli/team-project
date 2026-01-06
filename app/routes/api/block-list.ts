import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client"; // 👈 シンプルなPrismaClient
import { createRoute } from "honox/factory";
import { z } from "zod";

// 👇 ローカルDB用にシンプルにインスタンス化
const prisma = new PrismaClient();

// 1. ブロック一覧を取得するAPI
export const GET = createRoute(clerkMiddleware(), async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const myUserId = auth.userId;

  // prismaインスタンスを直接使用
  const blocks = await prisma.block.findMany({
    where: { blockerId: myUserId },
    include: {
      blocked: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const responseData = blocks.map((block) => ({
    id: block.blocked.id,
    name: block.blocked.nickname,
    icon: block.blocked.iconImageUrl || "https://via.placeholder.com/150",
    blockedDate: block.createdAt.toISOString(),
    habitualRoute: "詳細情報はまだDBにありません",
    bio: "プロフィールの自己紹介はまだDBにありません",
  }));

  return c.json(responseData);
});

// 2. ブロックを解除するAPI
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
