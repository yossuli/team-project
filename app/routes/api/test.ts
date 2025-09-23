import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";

export const getPrismaClient = async (db: D1Database) => {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
};

import { createRoute } from "honox/factory";
export const POST = createRoute(clerkMiddleware(), async (c) => {
  const prisma = await getPrismaClient(c.env.DB);
  const userId = getAuth(c)?.userId;
  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const users = await prisma.test.create({
    data: {
      title: "hoge",
      message: "fuga",
      createBy: userId,
    },
  });
  return c.json(users);
});
