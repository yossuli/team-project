import { createClient } from "@supabase/supabase-js";

// ▼ 環境変数 (import.meta.env) を使わず、直接文字列を代入します
const supabaseUrl = "https://reqkvsomydcayzarytua.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcWt2c29teWRjYXl6YXJ5dHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTkwOTIsImV4cCI6MjA4MzE5NTA5Mn0.YPSHghpP_U4etqZ40ANSFJzuABTg189fi-Ndia94y3s";

// クライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
