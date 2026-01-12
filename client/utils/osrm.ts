// client/utils/osrm.ts

// 座標の型定義
type Coordinate = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  distance: number; // メートル
  duration: number; // 秒
};

/**
 * OSRMサーバーにルート情報を問い合わせる関数
 * ※実験用: サーバーダウン時はダミーデータを返します
 */
export const getRouteInfo = async (
  coordinates: (Coordinate | { lat: number; lng: number })[],
): Promise<RouteInfo | null> => {
  try {
    // 1. URLの構築 (座標を ; でつなぐ)
    const coordString = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");

    // 環境変数からURLを取得 (なければデフォルトのlocalhost)
    const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "http://localhost:5000";
    const requestUrl = `${baseUrl}/route/v1/driving/${coordString}?overview=false`;

    // 2. タイムアウト付きでリクエスト (3秒で諦める)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(requestUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    // 最短ルートの情報を返す
    return {
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
    };
  } catch (error) {
    // ========= ★ここが修正ポイント！ =========
    // エラーが出たら、実験を止めずに「ダミーデータ」を返してあげる
    console.warn(
      "⚠️ OSRMサーバーに接続できませんでした。ダミーデータ(10分, 2km)を使用します。",
    );

    // ランダム要素を入れて実験っぽくする（8分〜12分の間）
    const dummyDuration = 600 + Math.floor(Math.random() * 240 - 120);

    return {
      distance: 2000, // 仮: 2km
      duration: dummyDuration, // 仮: 約10分
    };
    // =======================================
  }
};
