// OSRM (Open Source Routing Machine) の無料APIを使用
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

type RouteResult = {
  duration: number; // 所要時間 (秒)
  distance: number; // 距離 (メートル)
  geometry: any; // 地図描画用のルート形状データ (GeoJSON)
};

/**
 * 2点間、または複数地点間のルート情報を取得する関数
 * @param coordinates [経度, 緯度] の配列。例: [[139.7, 35.6], [139.8, 35.7]]
 */
export const getRouteInfo = async (
  coordinates: { lat: number; lng: number }[],
): Promise<RouteResult | null> => {
  if (coordinates.length < 2) {
    return null;
  }

  // OSRMは "経度,緯度" の順序で、セミコロン区切りでURLを作る
  const locString = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");

  // APIリクエストURL作成 (overview=full: 正確な形状を取得)
  const url = `${OSRM_BASE_URL}/${locString}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("OSRM API Error");
    }

    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        duration: route.duration, // 秒
        distance: route.distance, // メートル
        geometry: route.geometry, // 地図表示用の線データ
      };
    }
  } catch (error) {
    console.error("Route calculation failed:", error);
  }
  return null;
};
