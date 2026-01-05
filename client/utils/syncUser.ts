import { supabase } from "./supabase";

export const syncUserToSupabase = async (clerkUser: any) => {
  if (!clerkUser) {
    return;
  }

  // Clerkのユーザーオブジェクトから必要な情報を取り出す
  const userId = clerkUser.id;
  const email = clerkUser.primaryEmailAddress?.emailAddress;
  // 名前がない場合はメールの@より前を使うなどの工夫も可能ですが、一旦フルネームor名
  const nickname = clerkUser.fullName || clerkUser.firstName || "No Name";
  const iconImageUrl = clerkUser.imageUrl;

  try {
    // upsert: データがあれば更新、なければ挿入
    const { error } = await supabase.from("users").upsert(
      {
        id: userId,
        email: email,
        nickname: nickname,
        icon_image_url: iconImageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }, // IDが重複したら更新する設定
    );

    if (error) {
      console.error("ユーザー同期エラー:", error.message);
    } else {
      console.log("ユーザー情報をSupabaseに同期しました");
    }
  } catch (err) {
    console.error("予期せぬエラー:", err);
  }
};
