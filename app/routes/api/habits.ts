import { getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();
const prisma = new PrismaClient();

// バリデーションスキーマ
const createHabitSchema = z.object({
  departure: z.string(),
  departureLat: z.number(),
  departureLng: z.number(),
  destination: z.string(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  startTime: z.string(),
  endTime: z.string(),
});

// POST /api/habits
// HonoXのファイルベースルーティングでは、ファイル名がパスの一部になり、
// ここでの "/" は "/api/habits/" を指します。
app.post("/", zValidator("json", createHabitSchema), async (c) => {
  const auth = getAuth(c);

  // ログインしていない場合はエラー
  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const {
    departure,
    departureLat,
    departureLng,
    destination,
    destinationLat,
    destinationLng,
    startTime,
    endTime,
  } = c.req.valid("json");

  try {
    // 1. ユーザー確認 (Upsert)
    await prisma.user.upsert({
      where: { id: auth.userId },
      update: {},
      create: {
        id: auth.userId,
        email: "temp@example.com",
        nickname: "User",
      },
    });

    // 2. 習慣データを保存
    const newHabit = await prisma.habit.create({
      data: {
        userId: auth.userId,
        habitName: `${departure}→${destination}`,
        departureLocation: departure,
        departureLatitude: departureLat,
        departureLongitude: departureLng,
        destinationLocation: destination,
        destinationLatitude: destinationLat,
        destinationLongitude: destinationLng,
        // 毎日(0-6)の設定として保存
        desiredTimes: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
            startTime: startTime,
            endTime: endTime,
          })),
        },
      },
    });

    return c.json(newHabit, 201);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to create habit" }, 500);
  }
});

export default app;
