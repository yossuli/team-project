"use client";

// 👇 Clerkと同期関数
import { useUser } from "@clerk/clerk-react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { syncUserToSupabase } from "../utils/syncUser";

// 👇 マッチング関連のインポート
import { findBestMatch } from "../utils/matching";
import { supabase } from "../utils/supabase";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Box, Flex, styled } from "styled-system/jsx";

export const Route = createLazyFileRoute("/")({
  component: RegistrationScreen,
});

// =================================================================
// 1. DestinationPicker (変更なし)
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
  isLocationSet: boolean;
  onChange: (val: string) => void;
  onSearch: () => void;
  onMapClick: () => void;
}

export const DestinationPicker = ({
  label = "目的地を選択",
  value,
  isLocationSet,
  onChange,
  onSearch,
  onMapClick,
}: DestinationPickerProps) => {
  return (
    <Box width="100%">
      <Flex justifyContent="space-between" alignItems="center">
        <Label>{label}</Label>
        {isLocationSet && (
          <span
            style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold" }}
          >
            ✅ 位置情報OK
          </span>
        )}
      </Flex>
      <InputContainer
        style={
          isLocationSet
            ? { borderColor: "#16a34a", backgroundColor: "#f0fdf4" }
            : {}
        }
      >
        <IconButton
          type="button"
          onClick={onMapClick}
          style={{ backgroundColor: "#f0f0f0", borderRight: "1px solid #ddd" }}
          title="地図を開く"
        >
          📍
        </IconButton>
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
            flex: 1,
            border: "none",
            padding: "0 12px",
            fontSize: "16px",
            color: "#333",
            outline: "none",
            backgroundColor: "transparent",
            height: "100%",
            minWidth: 0,
          }}
        />
        <IconButton
          type="button"
          onClick={onSearch}
          style={{ backgroundColor: "#222", color: "white" }}
          title="検索して地図に表示"
        >
          🔍
        </IconButton>
      </InputContainer>
      {isLocationSet && (
        <div
          style={{
            fontSize: "11px",
            color: "#666",
            marginTop: "4px",
            textAlign: "right",
          }}
        >
          ※名前を変更しても位置情報は保持されます
        </div>
      )}
    </Box>
  );
};

// =================================================================
// 2. Leaflet 設定 & モーダル (変更なし)
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
}: any) => {
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const defaultCenter = { lat: 35.681236, lng: 139.767125 };

  useEffect(() => {
    if (isOpen) {
      if (initialPosition) {
        setMarkerPosition(initialPosition);
      } else {
        setMarkerPosition(null);
      }
    }
  }, [isOpen, initialPosition]);

  const center = markerPosition || defaultCenter;

  const handleConfirm = async () => {
    if (!markerPosition) {
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${markerPosition.lat}&lon=${markerPosition.lng}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      let smartName = "";
      const addr = data.address || {};

      if (addr.station) {
        smartName = addr.station;
        if (!smartName.endsWith("駅")) {
          smartName += "駅";
        }
      } else if (addr.railway) {
        smartName = addr.railway;
        if (!smartName.endsWith("駅")) {
          smartName += "駅";
        }
      } else if (addr.amenity) {
        smartName = addr.amenity;
      } else if (addr.building) {
        smartName = addr.building;
      }

      if (!smartName) {
        const fullAddress = data.display_name || "住所不明";
        smartName = fullAddress.split(",")[0].trim();
      }

      onSelectLocation({
        address: smartName,
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
// 3. DepartureTimeSelector (変更なし)
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

interface DepartureTimeSelectorProps {
  departureTime: string;
  tolerance: number;
  onChangeTime: (val: string) => void;
  onChangeTolerance: (val: number) => void;
}

const DepartureTimeSelector = ({
  departureTime,
  tolerance,
  onChangeTime,
  onChangeTolerance,
}: DepartureTimeSelectorProps) => {
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

  const toleranceOptions = [0, 15, 30, 45, 60, 90, 120];

  return (
    <Flex gap="4" width="100%">
      {/* 出発時刻 */}
      <Box flex="1">
        <TimeLabel>出発希望時刻</TimeLabel>
        <Select
          value={departureTime}
          onChange={(e) => onChangeTime(e.target.value)}
        >
          {timeOptions.map((t) => (
            <option key={`t-${t}`} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Box>

      {/* 許容範囲 */}
      <Box flex="1">
        <TimeLabel>許容範囲 (前後)</TimeLabel>
        <Select
          value={tolerance}
          onChange={(e) => onChangeTolerance(Number(e.target.value))}
        >
          {toleranceOptions.map((m) => (
            <option key={`tol-${m}`} value={m}>
              {m === 0 ? "指定時刻のみ" : `± ${m} 分`}
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  );
};

// =================================================================
// 4. メイン画面 (検索＆登録ロジック) - ページ遷移追加版
// =================================================================
function RegistrationScreen() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate(); // 👈 ナビゲーション機能

  useEffect(() => {
    if (isLoaded && user) {
      syncUserToSupabase(user);
    }
  }, [isLoaded, user]);

  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [departureTime, setDepartureTime] = useState("09:00");
  const [tolerance, setTolerance] = useState(30);

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [targetField, setTargetField] = useState<
    "departure" | "destination" | null
  >(null);

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

  const openMap = (field: "departure" | "destination") => {
    setTargetField(field);
    setIsMapOpen(true);
  };

  const handleSearch = async (
    field: "departure" | "destination",
    query: string,
  ) => {
    if (!query) {
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const lat = Number.parseFloat(result.lat);
        const lng = Number.parseFloat(result.lon);

        if (field === "departure") {
          setDepartureCoords({ lat, lng });
        } else {
          setDestinationCoords({ lat, lng });
        }
        setTargetField(field);
        setIsMapOpen(true);
      } else {
        alert("場所が見つかりませんでした。");
      }
    } catch (error) {
      alert("検索エラー");
    }
  };

  const handleLocationSelect = (data: any) => {
    if (targetField === "departure") {
      setDepartureName(data.address);
      setDepartureCoords({ lat: data.lat, lng: data.lng });
    } else if (targetField === "destination") {
      setDestinationName(data.address);
      setDestinationCoords({ lat: data.lat, lng: data.lng });
    }
    setTargetField(null);
  };

  const getCurrentModalCoords = () => {
    if (targetField === "departure") {
      return departureCoords;
    }
    if (targetField === "destination") {
      return destinationCoords;
    }
    return null;
  };

  // 👇 登録＆マッチング実行ボタン (ページ遷移追加)
  const handleRegister = async () => {
    if (!departureName || !destinationName) {
      alert("出発地と目的地を入力してください");
      return;
    }
    if (!departureCoords || !destinationCoords) {
      alert(
        "位置情報が設定されていません。\n地図ボタン「📍」または検索ボタン「🔍」で場所を確定させてください。",
      );
      return;
    }

    if (!user) {
      alert("サインインしてください");
      return;
    }

    // 1. マッチング用のリクエストデータを作成
    const requestData = {
      departure: { name: departureName, ...departureCoords },
      destination: { name: destinationName, ...destinationCoords },
      targetDate,
      departureTime,
      tolerance,
    };

    console.log("マッチング開始...", requestData);

    try {
      // 2. マッチングアルゴリズムを実行
      const result = await findBestMatch(requestData, user.id);

      if (result.isMatch) {
        // --- パターンB: マッチング成立 ---
        const partnerName =
          result.partnerReservation.user?.nickname || "ユーザー";
        if (
          confirm(
            `✨ マッチング候補が見つかりました！\n\n` +
              `日付: ${result.partnerReservation.target_date}\n` +
              `相手: ${partnerName} さん\n` +
              `相乗りスコア: ${Math.floor((result.score || 0) * 100)}点\n` +
              `------------------\n` +
              `この人と相乗りしますか？`,
          )
        ) {
          // OKなら成立
          alert("マッチング成立！(モック)");
          // 👇 履歴ページへ移動 (成立時は履歴へ)
          navigate({ to: "/matching-history" });
        } else {
          // 拒否なら新規予約として登録
          await saveNewReservation(requestData, user.id);
          // 👇 マイページへ移動
          navigate({ to: "/mypage" });
        }
      } else {
        // --- パターンA: マッチングなし ---
        console.log("マッチングなし:", result.message);
        await saveNewReservation(requestData, user.id);

        // 👇 マイページへ移動 (待機状態を確認させる)
        navigate({ to: "/mypage" });
      }
    } catch (e) {
      console.error("Error:", e);
      alert("エラーが発生しました");
    }
  };

  // 予約を新規登録するヘルパー関数
  const saveNewReservation = async (req: any, userId: string) => {
    try {
      const { error } = await supabase.from("reservations").insert([
        {
          user_id: userId,
          departure_location: req.departure.name,
          departure_lat: req.departure.lat,
          departure_lng: req.departure.lng,
          destination_location: req.destination.name,
          destination_lat: req.destination.lat,
          destination_lng: req.destination.lng,
          target_date: req.targetDate,
          start_time: req.departureTime,
          tolerance: req.tolerance,
          status: "active",
        },
      ]);
      if (error) {
        throw error;
      }
      alert(
        "条件に合う相手がいなかったため、\n新規の予約として登録しました。\n(マイページで待機リストを確認できます)",
      );
    } catch (e: any) {
      alert("保存に失敗しました: " + e.message);
    }
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify="space-evenly"
      height="calc(100dvh - 74px)"
      width="100%"
      maxWidth="400px"
      mx="auto"
      px="4"
      pb="4"
      overflow="hidden"
    >
      <Box width="100%">
        <h1
          style={{
            textAlign: "center",
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          移動情報を登録する
        </h1>

        <Box mb="4">
          <DestinationPicker
            label="出発地"
            value={departureName}
            isLocationSet={!!departureCoords}
            onChange={setDepartureName}
            onMapClick={() => openMap("departure")}
            onSearch={() => handleSearch("departure", departureName)}
          />
        </Box>

        <Box mb="4">
          <DestinationPicker
            label="目的地"
            value={destinationName}
            isLocationSet={!!destinationCoords}
            onChange={setDestinationName}
            onMapClick={() => openMap("destination")}
            onSearch={() => handleSearch("destination", destinationName)}
          />
        </Box>

        <Box mb="2">
          <TimeLabel>日付</TimeLabel>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              backgroundColor: "white",
              outline: "none",
            }}
          />
        </Box>

        <Box>
          <DepartureTimeSelector
            departureTime={departureTime}
            tolerance={tolerance}
            onChangeTime={setDepartureTime}
            onChangeTolerance={setTolerance}
          />
        </Box>
      </Box>

      <button
        type="button"
        onClick={handleRegister}
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
