import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { createRoute } from "honox/factory";

// DB接続のヘルパー関数 (test.tsと同様)
const getPrismaClient = async (db: D1Database) => {
  const adapter = new PrismaD1(db);
  return new PrismaClient({ adapter });
};

export const GET = createRoute(clerkMiddleware(), async (c) => {
  // 1. ログイン中のユーザーIDを取得
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const myUserId = auth.userId;

  const prisma = await getPrismaClient(c.env.DB);

  // 2. 自分が参加しているライドグループを取得
  // (RideGroupParticipantテーブルを検索)
  const myParticipations = await prisma.rideGroupParticipant.findMany({
    where: { userId: myUserId },
    include: {
      group: {
        include: {
          // グループに参加している「他の人」の情報も一緒に取る
          participants: {
            include: {
              user: true, // ユーザーのアイコンや名前を取得するため
            },
          },
          // 最初の予約情報（ルート情報など）
          initialReservation: true,
        },
      },
    },
    orderBy: { createdAt: "desc" }, // 新しい順
  });

  // 3. フロントエンドで使いやすい形にデータを整形
  const historyData = myParticipations.map((participation) => {
    const group = participation.group;

    // 自分以外の参加者を探す（＝相乗り相手）
    // (現在は1対1想定で、最初に見つかった他人を相手とします)
    const partnerParticipant = group.participants.find(
      (p) => p.userId !== myUserId,
    );
    const partner = partnerParticipant?.user;

    return {
      id: group.id,
      date: group.createdAt.toISOString(), // 本来は出発日時が良いですが一旦作成日
      partner: partner?.nickname || "退会済みユーザー",
      partnerIcon: partner?.iconImageUrl || "https://via.placeholder.com/150",
      // ルート情報は initialReservation から取る (簡易版)
      route: `${group.initialReservation.departureLocation} → ${group.initialReservation.destinationLocation}`,
      status: group.status, // "completed" など
      // 詳細情報 (DBのカラムに合わせて調整が必要ですが、一旦仮置き)
      habitualRoute: "詳細情報はまだDBにありません",
      bio: "プロフィールの自己紹介はまだDBにありません",
      isBlocked: false, // ブロック状態のチェックは別途必要ですが一旦false
    };
  });

  return c.json(historyData);
});
