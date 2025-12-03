"use client";

import { createLazyFileRoute } from "@tanstack/react-router";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Box, Flex, styled } from "styled-system/jsx";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";

// =================================================================
// 1. DestinationPicker (テキスト入力 & 検索ボタン)
// =================================================================

const Label = styled("label", {
  base: {
    display: "block",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
});

const InputContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "white",
    height: "48px",
    transition: "all 0.2s",
    _focusWithin: {
      borderColor: "#333",
      boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
    },
  },
});

const IconButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "100%",
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s",
    fontSize: "18px",
  },
});

interface DestinationPickerProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void; // 検索実行
  onMapClick: () => void; // 地図ボタンクリック
}

export const DestinationPicker = ({
  label = "目的地を選択",
  value,
  onChange,
  onSearch,
  onMapClick,
}: DestinationPickerProps) => {
  return (
    <Box width="100%">
      <Label>{label}</Label>
      <InputContainer>
        {/* 地図アイコンボタン */}
        <IconButton
          type="button"
          onClick={onMapClick}
          style={{ backgroundColor: "#f0f0f0", borderRight: "1px solid #ddd" }}
          title="地図を開く"
        >
          📍
        </IconButton>

        {/* テキスト入力欄 */}
        <input
          type="text"
          placeholder="場所名を入力 (例: 東京駅)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
          style={{
            flex: 1, // 横幅いっぱいに広げる
            border: "none", // 枠線を消す
            padding: "0 12px", // 余白
            fontSize: "16px", // 文字サイズ
            color: "#333", // 文字色 (黒に近いグレー)
            outline: "none", // 青い枠線を出さない
            backgroundColor: "transparent", // 背景透明
            height: "100%", // 高さ100%
            minWidth: 0, // Flexboxでの縮小対策
          }}
        />

        {/* 検索ボタン */}
        <IconButton
          type="button"
          onClick={onSearch}
          style={{ backgroundColor: "#222", color: "white" }}
          title="検索して地図に表示"
        >
          🔍
        </IconButton>
      </InputContainer>
    </Box>
  );
};

// =================================================================
// 2. Leaflet 設定 & モーダル
// =================================================================

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// 地図の中心を移動させるためのコンポーネント
const ChangeView = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
};

const MapClickHandler = ({ onLocationSelect }: any) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const ModalOverlay = styled("div", {
  base: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(3px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
});

const ModalContent = styled("div", {
  base: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: "500px",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.2s ease-out",
  },
});

const MapModal = ({
  isOpen,
  onClose,
  onSelectLocation,
  title,
  initialPosition,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
}: any) => {
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const defaultCenter = { lat: 35.681236, lng: 139.767125 }; // 東京駅

  // モーダルが開いたとき、初期位置があればそこにピンを立てる
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  useEffect(() => {
    if (isOpen) {
      if (initialPosition) {
        setMarkerPosition(initialPosition);
      } else {
        setMarkerPosition(null);
      }
    }
  }, [isOpen, initialPosition]);

  // マーカーがある場合はそこを中心にする、なければ東京駅
  const center = markerPosition || defaultCenter;

  const handleConfirm = async () => {
    if (!markerPosition) {
      return;
    }
    try {
      // 座標から住所名を取得 (逆ジオコーディング)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${markerPosition.lat}&lon=${markerPosition.lng}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      const address = data.display_name || "住所不明";

      onSelectLocation({
        address: address, // 地図でピンを動かしたら住所も更新
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      });
      onClose();
    } catch (error) {
      alert("住所情報の取得に失敗しました");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Flex
          p="4"
          borderBottom="1px solid #eee"
          align="center"
          justify="space-between"
        >
          <Box fontWeight="bold" fontSize="lg" color="#333">
            {title || "場所を選択"}
          </Box>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            onClick={onClose}
            style={{
              fontSize: "20px",
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "#999",
            }}
          >
            ✕
          </button>
        </Flex>

        <Box bg="#f0f0f0" height="320px" width="100%" position="relative">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={center} />
            <MapClickHandler onLocationSelect={setMarkerPosition} />
            {markerPosition && <Marker position={markerPosition} icon={icon} />}
          </MapContainer>

          {!markerPosition && (
            <Box
              position="absolute"
              top="10px"
              left="50%"
              transform="translateX(-50%)"
              bg="rgba(255,255,255,0.9)"
              px="3"
              py="1"
              borderRadius="20px"
              fontSize="12px"
              fontWeight="bold"
              color="#555"
              boxShadow="0 2px 5px rgba(0,0,0,0.1)"
              zIndex={1000}
              pointerEvents="none"
            >
              地図をタップしてピンを刺してください
            </Box>
          )}
        </Box>

        <Flex p="4" justify="flex-end" gap="3" bg="#fafafa">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "white",
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!markerPosition}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: markerPosition ? "#222" : "#ccc",
              color: "white",
              cursor: markerPosition ? "pointer" : "not-allowed",
              fontWeight: "bold",
            }}
          >
            決定
          </button>
        </Flex>
      </ModalContent>
    </ModalOverlay>
  );
};

// =================================================================
// 3. TimeRangeSelector
// =================================================================
const Select = styled("select", {
  base: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    cursor: "pointer",
    appearance: "none",
    backgroundImage:
      'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
  },
});
const TimeLabel = styled("label", {
  base: {
    display: "block",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
});
const TimeRangeSelector = ({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: any) => {
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        );
      }
    }
    return options;
  }, []);
  return (
    <Flex gap="4" width="100%">
      <Box flex="1">
        <TimeLabel>開始時刻</TimeLabel>
        <Select
          value={startTime}
          onChange={(e) => onChangeStart(e.target.value)}
        >
          {timeOptions.map((t) => (
            <option key={`s-${t}`} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Box>
      <Box display="flex" alignItems="center" paddingTop="24px" color="#999">
        ～
      </Box>
      <Box flex="1">
        <TimeLabel>終了時刻</TimeLabel>
        <Select value={endTime} onChange={(e) => onChangeEnd(e.target.value)}>
          {timeOptions.map((t) => (
            <option key={`e-${t}`} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  );
};

// =================================================================
// 4. メイン画面 (検索＆登録ロジック)
// =================================================================
function RegistrationScreen() {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [targetField, setTargetField] = useState<
    "departure" | "destination" | null
  >(null);

  // 出発地・目的地データ
  const [departureName, setDepartureName] = useState("");
  const [departureCoords, setDepartureCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // マップを開く
  const openMap = (field: "departure" | "destination") => {
    setTargetField(field);
    setIsMapOpen(true);
  };

  // -----------------------------------------------------------
  // ▼ 重要: 入力文字から場所を検索する処理
  // -----------------------------------------------------------
  const handleSearch = async (
    field: "departure" | "destination",
    query: string,
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  ) => {
    if (!query) {
      return;
    }
    try {
      // Nominatim API で検索
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = Number.parseFloat(result.lat);
        const lng = Number.parseFloat(result.lon);

        // 座標をセット
        if (field === "departure") {
          // ※ 入力した文字「東京駅」などをそのまま保持したい場合は name は更新しない
          //    もし正式名称「東京駅, 千代田区...」に書き換えたい場合はここで更新する
          //    今回は「入力した文字」を優先しつつ、座標だけ裏でセットする
          setDepartureCoords({ lat, lng });
        } else {
          setDestinationCoords({ lat, lng });
        }

        // 検索が成功したら、地図を開いてその場所を表示する (UX向上)
        setTargetField(field);
        setIsMapOpen(true);
      } else {
        alert(
          "場所が見つかりませんでした。「東京都 新宿区」のように入力してみてください。",
        );
      }
    } catch (error) {
      alert("検索中にエラーが発生しました。");
    }
  };

  // 地図上で場所を決定したときの処理
  const handleLocationSelect = (data: any) => {
    if (targetField === "departure") {
      setDepartureName(data.address); // ピンの位置の住所名で上書き
      setDepartureCoords({ lat: data.lat, lng: data.lng });
    } else if (targetField === "destination") {
      setDestinationName(data.address);
      setDestinationCoords({ lat: data.lat, lng: data.lng });
    }
    setTargetField(null);
  };

  // モーダルを開くときに渡す初期位置
  const getCurrentModalCoords = () => {
    if (targetField === "departure") {
      return departureCoords;
    }
    if (targetField === "destination") {
      return destinationCoords;
    }
    return null;
  };

  return (
    <Flex
      direction="column"
      align="center"
      pt="8"
      width="100%"
      maxWidth="400px"
      mx="auto"
      px="4"
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        移動情報を登録する
      </h1>

      <Box mb="5">
        <DestinationPicker
          label="出発地"
          value={departureName}
          onChange={setDepartureName}
          onMapClick={() => openMap("departure")}
          onSearch={() => handleSearch("departure", departureName)}
        />
      </Box>

      <Box mb="8">
        <DestinationPicker
          label="目的地"
          value={destinationName}
          onChange={setDestinationName}
          onMapClick={() => openMap("destination")}
          onSearch={() => handleSearch("destination", destinationName)}
        />
      </Box>

      <Box mb="8">
        <TimeRangeSelector
          startTime={startTime}
          endTime={endTime}
          onChangeStart={setStartTime}
          onChangeEnd={setEndTime}
        />
      </Box>

      <button
        type="button"
        style={{
          width: "100%",
          padding: "16px",
          background: "#222",
          color: "white",
          borderRadius: "12px",
          border: "none",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "transform 0.1s",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        登録
      </button>

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelect}
        title={targetField === "departure" ? "出発地を選択" : "目的地を選択"}
        initialPosition={getCurrentModalCoords()}
      />
    </Flex>
  );
}

export const Route = createLazyFileRoute("/")({
  component: RegistrationScreen,
});
