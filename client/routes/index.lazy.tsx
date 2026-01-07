"use client";

import { useUser } from "@clerk/clerk-react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import L from "leaflet";
import { findBestMatch } from "../utils/matching";
import { supabase } from "../utils/supabase";
import { syncUserToSupabase } from "../utils/syncUser";
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
// 1. DestinationPicker
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
        >
          📍
        </IconButton>
        <input
          type="text"
          placeholder="場所名を入力"
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
      setMarkerPosition(initialPosition || null);
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
      onSelectLocation({
        address: data.display_name?.split(",")[0] || "住所不明",
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      });
      onClose();
    } catch (error) {
      alert("住所取得失敗");
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
          <Box fontWeight="bold" fontSize="lg">
            {title || "場所を選択"}
          </Box>
          <button
            onClick={onClose}
            style={{ fontSize: "20px", background: "none", border: "none" }}
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
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={center} />
            <MapClickHandler onLocationSelect={setMarkerPosition} />
            {markerPosition && <Marker position={markerPosition} icon={icon} />}
          </MapContainer>
        </Box>
        <Flex p="4" justify="flex-end" gap="3" bg="#fafafa">
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "white",
              border: "1px solid #ddd",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!markerPosition}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: markerPosition ? "#222" : "#ccc",
              color: "white",
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
// 3. DepartureTimeSelector
// =================================================================
const Select = styled("select", {
  base: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "white",
    appearance: "none",
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
const DepartureTimeSelector = ({
  departureTime,
  tolerance,
  onChangeTime,
  onChangeTolerance,
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
        <TimeLabel>出発希望時刻</TimeLabel>
        <Select
          value={departureTime}
          onChange={(e: any) => onChangeTime(e.target.value)}
        >
          {timeOptions.map((t) => (
            <option key={`t-${t}`} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Box>
      <Box flex="1">
        <TimeLabel>許容範囲 (前後)</TimeLabel>
        <Select
          value={tolerance}
          onChange={(e: any) => onChangeTolerance(Number(e.target.value))}
        >
          {[0, 15, 30, 45, 60, 90, 120].map((m) => (
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
// 4. メイン画面 (ページ遷移対応版)
// =================================================================
function RegistrationScreen() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

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
  const handleSearch = async (field: any, query: any) => {
    if (!query) {
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (field === "departure") {
          setDepartureCoords({
            lat: Number.parseFloat(lat),
            lng: Number.parseFloat(lon),
          });
        } else {
          setDestinationCoords({
            lat: Number.parseFloat(lat),
            lng: Number.parseFloat(lon),
          });
        }
        setTargetField(field);
        setIsMapOpen(true);
      } else {
        alert("場所が見つかりませんでした。");
      }
    } catch {
      alert("検索エラー");
    }
  };
  const handleLocationSelect = (data: any) => {
    if (targetField === "departure") {
      setDepartureName(data.address);
      setDepartureCoords({ lat: data.lat, lng: data.lng });
    } else {
      setDestinationName(data.address);
      setDestinationCoords({ lat: data.lat, lng: data.lng });
    }
    setTargetField(null);
  };
  const getCurrentModalCoords = () => {
    return targetField === "departure" ? departureCoords : destinationCoords;
  };

  // 👇 登録＆マッチング実行ボタン
  const handleRegister = async () => {
    if (!departureName || !destinationName) {
      return alert("場所を入力してください");
    }
    if (!departureCoords || !destinationCoords) {
      return alert("位置情報を設定してください");
    }
    if (!user) {
      return alert("サインインしてください");
    }

    const requestData = {
      departure: { name: departureName, ...departureCoords },
      destination: { name: destinationName, ...destinationCoords },
      targetDate,
      departureTime,
      tolerance,
    };

    console.log("マッチング開始...", requestData);

    try {
      const result = await findBestMatch(requestData, user.id);

      if (result.isMatch) {
        // ✅ Pattern B: マッチング成立
        // 提案ページへデータを渡して移動
        navigate({
          to: "/match-proposal",
          state: {
            proposal: result,
            requestData: requestData,
          },
        });
      } else {
        // Pattern A: マッチングなし
        console.log("マッチングなし:", result.message);
        await saveNewReservation(requestData, user.id);
        navigate({ to: "/mypage" });
      }
    } catch (e) {
      console.error("Error:", e);
      alert("エラーが発生しました");
    }
  };

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
