"use client";

import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
// アイコンが必要なら import { MapPin } from 'lucide-react'; など
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { Box, Flex, styled } from "styled-system/jsx";
import "leaflet/dist/leaflet.css"; // 地図のスタイル
import L from "leaflet";
import { DestinationPicker } from "~/components/ui/PlacePicker";

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
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
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
    maxWidth: "600px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
});

const MapModal = ({ isOpen, onClose, onSelectLocation }: any) => {
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const defaultCenter = { lat: 35.681236, lng: 139.767125 }; // 東京駅

  const handleConfirm = async () => {
    if (!markerPosition) {
      return;
    }
    try {
      // Nominatim API (無料住所検索)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${markerPosition.lat}&lon=${markerPosition.lng}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      const address = data.display_name || "住所不明";

      onSelectLocation({
        address: address,
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("住所の取得に失敗しました");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <Box
          p="4"
          borderBottom="1px solid #eee"
          fontWeight="bold"
          fontSize="lg"
        >
          場所を選択してください
        </Box>
        <Box bg="#f0f0f0" height="400px" width="100%">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={setMarkerPosition} />
            {markerPosition && <Marker position={markerPosition} icon={icon} />}
          </MapContainer>
        </Box>
        <Flex p="4" justify="flex-end" gap="2" borderTop="1px solid #eee">
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#eee",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!markerPosition}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: markerPosition ? "#222" : "#ccc",
              color: "white",
              cursor: markerPosition ? "pointer" : "not-allowed",
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
// 1. 部品：時間範囲セレクター (TimeRangeSelector)
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

const Select = styled("select", {
  base: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    cursor: "pointer",
    appearance: "none", // ブラウザ標準の矢印を消す（必要なら）
    _focus: {
      outline: "none",
      borderColor: "#333",
      boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
    },
  },
});

const TimeRangeSelector = ({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: any) => {
  // 15分刻みの時刻リストを生成 (00:00 ~ 23:45)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, "0");
        const mm = m.toString().padStart(2, "0");
        options.push(`${hh}:${mm}`);
      }
    }
    return options;
  }, []);

  return (
    <Flex gap="4" width="100%">
      <Box flex="1">
        <Label>開始時刻</Label>
        <Box position="relative">
          <Select
            value={startTime}
            onChange={(e) => onChangeStart(e.target.value)}
          >
            {timeOptions.map((time) => (
              <option key={`start-${time}`} value={time}>
                {time}
              </option>
            ))}
          </Select>
          {/* 矢印アイコンをCSSで描画しても良いが、ここではシンプルにSelect任せ */}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" paddingTop="24px">
        ～
      </Box>

      <Box flex="1">
        <Label>終了時刻</Label>
        <Box position="relative">
          <Select value={endTime} onChange={(e) => onChangeEnd(e.target.value)}>
            {timeOptions.map((time) => (
              <option key={`end-${time}`} value={time}>
                {time}
              </option>
            ))}
          </Select>
        </Box>
      </Box>
    </Flex>
  );
};

// =================================================================
// 2. 画面全体 (RegistrationScreen)
// =================================================================

// ヘルパー: Dateオブジェクトから "HH:mm" 文字列を取得
const formatTime = (d: Date) => {
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

// ヘルパー: 15分単位に切り上げたDateを取得
const getRoundedDate = (d: Date) => {
  const newDate = new Date(d);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  const m = newDate.getMinutes();
  const rem = m % 15;
  if (rem !== 0) {
    newDate.setMinutes(m + (15 - rem));
  }
  return newDate;
};

// ヘルパー: 分を加算する
const addMinutes = (d: Date, minutes: number) => {
  return new Date(d.getTime() + minutes * 60000);
};

// =================================================================
// メイン画面 (RegistrationScreen)
// =================================================================

function RegistrationScreen() {
  // 状態管理: 文字列 "HH:mm" で管理すると扱いやすい
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");

  // 地図モーダルの開閉状態
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 「今どちらを入力しているか」を管理 ('departure' | 'destination' | null)
  const [targetField, setTargetField] = useState<string | null>(null);

  // --- 出発地のデータ ---
  const [departureName, setDepartureName] = useState("");
  const [departureCoords, setDepartureCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // --- 目的地のデータ ---
  const [destinationName, setDestinationName] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 地図を開く処理
  const openMap = (field: "departure" | "destination") => {
    setTargetField(field);
    setIsMapOpen(true);
  };

  // 地図で場所が決まったときの処理
  const handleLocationSelect = (data: any) => {
    if (targetField === "departure") {
      setDepartureName(data.address);
      setDepartureCoords({ lat: data.lat, lng: data.lng });
    } else if (targetField === "destination") {
      setDestinationName(data.address);
      setDestinationCoords({ lat: data.lat, lng: data.lng });
    }
    // 状態をリセット
    setTargetField(null);
  };

  // 初期化ロジック (マウント時に現在時刻に合わせてセット)
  useEffect(() => {
    const now = new Date();
    const start = getRoundedDate(now); // 現在時刻を15分切り上げ
    const end = addMinutes(start, 60); // 終了は1時間後をデフォルトに

    setStartTime(formatTime(start));
    setEndTime(formatTime(end));
  }, []);

  // 登録ボタンを押したときの処理
  const handleRegister = () => {
    if (!departureName || !destinationName) {
      alert("出発地と目的地を選択してください");
      return;
    }

    alert(
      `出発地: ${departureName}\n目的地: ${destinationName}\n時間: ${startTime} ～ ${endTime}\n\n登録完了！`,
    );
  };

  return (
    <Flex
      direction="column"
      align="center"
      pt="8"
      width="100%"
      maxWidth="400px"
      mx="auto"
    >
      <Box
        bg="white"
        p="6"
        borderRadius="16px"
        width="100%"
        boxShadow="0 4px 12px rgba(0,0,0,0.1)"
      >
        {/* マイページヘッダーのプレースホルダー */}
        <Box
          border="1px dashed #ccc"
          borderRadius="99px"
          p="2"
          mb="6"
          textAlign="center"
          color="#aaa"
          fontSize="12px"
        >
          [マイページヘッダー]
        </Box>

        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          移動情報を登録する
        </h1>

        {/* --- 出発地選択 --- */}
        <Box mb="4">
          <DestinationPicker
            label="出発地を選択"
            value={departureName}
            onClick={() => openMap("departure")}
          />
        </Box>

        {/* --- 目的地選択 --- */}
        <Box mb="6">
          <DestinationPicker
            label="目的地を選択"
            value={destinationName}
            onClick={() => openMap("destination")}
          />
        </Box>

        {/* 時間範囲選択コンポーネント */}
        <Box mb="8">
          <TimeRangeSelector
            startTime={startTime}
            endTime={endTime}
            onChangeStart={setStartTime}
            onChangeEnd={setEndTime}
          />
        </Box>

        {/* 登録ボタン */}
        <button
          type="button"
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "14px",
            background: "#222",
            color: "white",
            borderRadius: "6px",
            border: "none",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          登録
        </button>
      </Box>
      {/* 地図モーダル (1つを使い回す) */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelect}
        title={targetField === "departure" ? "出発地を選択" : "目的地を選択"}
      />
    </Flex>
  );
}

// =================================================================
// 3. ルート定義
// =================================================================

// ※ファイル名に合わせてパスを変更してください ('/registration' または '/register')
export const Route = createLazyFileRoute("/")({
  component: RegistrationScreen,
});
