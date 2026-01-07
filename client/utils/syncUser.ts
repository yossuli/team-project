import { supabase } from "./supabase";

export const syncUserToSupabase = async (clerkUser: any) => {
  if (!clerkUser) {
    return;
  }

  // Clerkから情報を取得
  const id = clerkUser.id;
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  const iconImageUrl = clerkUser.imageUrl;

  // 👇 usernameを取得 (設定されていない場合はnull)
  const username = clerkUser.username;

  // 既存のニックネームロジック (usernameがなければフルネーム、なければメアド前部など)
  const nickname =
    username || clerkUser.fullName || email?.split("@")[0] || "No Name";

  try {
    const { error } = await supabase.from("users").upsert({
      id,
      email,
      nickname, // 従来のニックネーム (バックアップ用)
      username, // 👈 【追加】Clerkのユーザー名
      icon_image_url: iconImageUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase user sync error:", error);
    } else {
      console.log("User synced:", username || nickname);
    }
  } catch (e) {
    console.error("Sync failed:", e);
  }
};
