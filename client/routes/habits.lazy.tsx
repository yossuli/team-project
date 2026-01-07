"use client";

import { useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Box, Flex, styled } from "@ss/jsx";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { findBestMatch } from "../utils/matching";
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/habits")({
  component: HabitsPage,
});

// =================================================================
// 📍 1. UIコンポーネント (DestinationPicker等) - 省略せずに記述
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
    fontSize: "18px",
  },
});

const DestinationPicker = ({
  label = "目的地を選択",
  value,
  isLocationSet,
  onChange,
  onSearch,
  onMapClick,
}: any) => {
  return (
    <Box width="100%">
      <Flex justifyContent="space-between" alignItems="center">
        <Label>{label}</Label>
        {isLocationSet && (
          <span
            style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold" }}
          >
            ✅ OK
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
          placeholder="場所名"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            padding: "0 12px",
            fontSize: "16px",
            outline: "none",
            backgroundColor: "transparent",
            height: "100%",
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
// 🗺️ 2. Leaflet 設定 & モーダル
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
    display: "flex",
    flexDirection: "column",
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
  useEffect(() => {
    if (isOpen) {
      setMarkerPosition(initialPosition || null);
    }
  }, [isOpen, initialPosition]);

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
    } catch {
      alert("住所取得エラー");
    }
  };

  if (!isOpen) {
    return null;
  }
  return (
    <ModalOverlay>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <Flex p="4" borderBottom="1px solid #eee" justify="space-between">
          <Box fontWeight="bold">{title}</Box>
          <button onClick={onClose}>✕</button>
        </Flex>
        <Box bg="#f0f0f0" height="300px" width="100%">
          <MapContainer
            center={markerPosition || { lat: 35.6812, lng: 139.7671 }}
            zoom={13}
            style={{ height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView
              center={markerPosition || { lat: 35.6812, lng: 139.7671 }}
            />
            <MapClickHandler onLocationSelect={setMarkerPosition} />
            {markerPosition && <Marker position={markerPosition} icon={icon} />}
          </MapContainer>
        </Box>
        <Flex p="4" justify="flex-end" gap="3">
          <button onClick={onClose}>キャンセル</button>
          <button onClick={handleConfirm} disabled={!markerPosition}>
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
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "white",
  },
});
const DepartureTimeSelector = ({
  departureTime,
  tolerance,
  onChangeTime,
  onChangeTolerance,
}: any) => {
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeOptions.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      );
    }
  }

  return (
    <Flex gap="4">
      <Box flex="1">
        <Label>出発時刻</Label>
        <Select
          value={departureTime}
          onChange={(e: any) => onChangeTime(e.target.value)}
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Box>
      <Box flex="1">
        <Label>許容範囲</Label>
        <Select
          value={tolerance}
          onChange={(e: any) => onChangeTolerance(Number(e.target.value))}
        >
          {[0, 15, 30, 45, 60, 90].map((m) => (
            <option key={m} value={m}>
              ±{m}分
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  );
};

// =================================================================
// 🚀 4. メイン画面
// =================================================================

type Habit = {
  id: number;
  departure: string;
  departureLat?: number;
  departureLng?: number;
  destination: string;
  destinationLat?: number;
  destinationLng?: number;
  startTime: string;
  tolerance: number;
};

function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabitToBook, setSelectedHabitToBook] = useState<Habit | null>(
    null,
  );
  const { user, isLoaded } = useUser();

  const fetchHabits = async () => {
    if (!user) {
      return;
    }
    const { data } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id);
    if (data) {
      setHabits(
        data.map((d: any) => ({
          id: d.id,
          departure: d.departure,
          departureLat: d.departure_lat,
          departureLng: d.departure_lng,
          destination: d.destination,
          destinationLat: d.destination_lat,
          destinationLng: d.destination_lng,
          startTime: d.start_time,
          tolerance: d.tolerance,
        })),
      );
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchHabits();
    }
  }, [isLoaded, user]);

  const deleteHabit = async (id: number) => {
    if (!confirm("削除しますか？")) {
      return;
    }
    await supabase.from("habits").delete().eq("id", id);
    fetchHabits();
  };

  const handleAddHabit = async (habit: any) => {
    if (!user) {
      return;
    }
    await supabase.from("habits").insert([
      {
        user_id: user.id,
        departure: habit.departure,
        departure_lat: habit.departureLat,
        departure_lng: habit.departureLng,
        destination: habit.destination,
        destination_lat: habit.destinationLat,
        destination_lng: habit.destinationLng,
        start_time: habit.startTime,
        tolerance: habit.tolerance,
      },
    ]);
    fetchHabits();
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Flex direction="column" gap="4" p="4" pb="20" maxWidth="600px" mx="auto">
        <h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
          よく使うルート
        </h1>
        {habits.map((h) => (
          <div
            key={h.id}
            className={css({
              border: "1px solid #ccc",
              p: "4",
              borderRadius: "lg",
              bg: "white",
            })}
          >
            <Flex justify="space-between" align="center">
              <Box>
                <div className={css({ fontSize: "lg", fontWeight: "bold" })}>
                  {h.startTime}{" "}
                  <span
                    className={css({ fontSize: "sm", fontWeight: "normal" })}
                  >
                    ±{h.tolerance}分
                  </span>
                </div>
                <div>
                  {h.departure} → {h.destination}
                </div>
              </Box>
              <button
                onClick={() => setSelectedHabitToBook(h)}
                className={css({
                  bg: "primary",
                  color: "white",
                  px: "4",
                  py: "2",
                  borderRadius: "md",
                })}
              >
                登録
              </button>
            </Flex>
            <button
              onClick={() => deleteHabit(h.id)}
              className={css({
                fontSize: "xs",
                color: "gray.500",
                marginTop: "5px",
                textDecoration: "underline",
              })}
            >
              削除
            </button>
          </div>
        ))}
      </Flex>

      <button
        onClick={() => setIsModalOpen(true)}
        className={css({
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          bg: "primary",
          color: "white",
          borderRadius: "full",
          fontSize: "24px",
        })}
      >
        +
      </button>

      {isModalOpen && (
        <AddHabitModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddHabit}
        />
      )}
      {selectedHabitToBook && user && (
        <BookingConfirmModal
          habit={selectedHabitToBook}
          onClose={() => setSelectedHabitToBook(null)}
          userId={user.id}
        />
      )}
    </>
  );
}

function AddHabitModal({ onClose, onAdd }: any) {
  const [dName, setDName] = useState("");
  const [dCoords, setDCoords] = useState<any>(null);
  const [aName, setAName] = useState("");
  const [aCoords, setACoords] = useState<any>(null);
  const [time, setTime] = useState("09:00");
  const [tol, setTol] = useState(30);
  const [mapField, setMapField] = useState<string | null>(null);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!dCoords || !aCoords) {
      return alert("場所を選択してください");
    }
    onAdd({
      departure: dName,
      departureLat: dCoords.lat,
      departureLng: dCoords.lng,
      destination: aName,
      destinationLat: aCoords.lat,
      destinationLng: aCoords.lng,
      startTime: time,
      tolerance: tol,
    });
    onClose();
  };

  return (
    <div
      className={css({
        position: "fixed",
        inset: 0,
        bg: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      })}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className={css({
          bg: "white",
          p: "6",
          borderRadius: "lg",
          width: "90%",
          maxWidth: "400px",
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={css({ fontWeight: "bold", mb: "4" })}>ルート追加</h2>
        <Box mb="4">
          <DestinationPicker
            label="出発地"
            value={dName}
            isLocationSet={!!dCoords}
            onChange={setDName}
            onMapClick={() => setMapField("dep")}
            onSearch={() => {}}
          />
        </Box>
        <Box mb="4">
          <DestinationPicker
            label="目的地"
            value={aName}
            isLocationSet={!!aCoords}
            onChange={setAName}
            onMapClick={() => setMapField("arr")}
            onSearch={() => {}}
          />
        </Box>
        <Box mb="4">
          <DepartureTimeSelector
            departureTime={time}
            tolerance={tol}
            onChangeTime={setTime}
            onChangeTolerance={setTol}
          />
        </Box>
        <Flex gap="3">
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "10px", background: "#eee" }}
          >
            キャンセル
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: "10px",
              background: "#222",
              color: "white",
            }}
          >
            保存
          </button>
        </Flex>
      </form>
      <MapModal
        isOpen={!!mapField}
        onClose={() => setMapField(null)}
        onSelectLocation={(l: any) => {
          if (mapField === "dep") {
            setDName(l.address);
            setDCoords(l);
          } else {
            setAName(l.address);
            setACoords(l);
          }
          setMapField(null);
        }}
        title="場所を選択"
      />
    </div>
  );
}

// 👇 予約確認＆マッチング実行
function BookingConfirmModal({ habit, onClose, userId }: any) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBook = async () => {
    setLoading(true);
    const req = {
      departure: {
        name: habit.departure,
        lat: habit.departureLat,
        lng: habit.departureLng,
      },
      destination: {
        name: habit.destination,
        lat: habit.destinationLat,
        lng: habit.destinationLng,
      },
      targetDate: date,
      departureTime: habit.startTime,
      tolerance: habit.tolerance,
    };

    // マッチング実行
    const res = await findBestMatch(req, userId);

    if (res.isMatch) {
      // マッチングしたら提案ページへ
      navigate({
        to: "/match-proposal",
        state: { proposal: res, requestData: req },
      });
    } else {
      // なければ待機登録
      await supabase.from("reservations").insert([
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
      alert("待機リストに登録しました");
      navigate({ to: "/mypage" });
    }
    onClose();
  };

  return (
    <div
      className={css({
        position: "fixed",
        inset: 0,
        bg: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      })}
      onClick={onClose}
    >
      <div
        className={css({
          bg: "white",
          p: "6",
          borderRadius: "lg",
          width: "300px",
        })}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={css({ fontWeight: "bold", mb: "4" })}>予約日を選択</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={css({
            width: "100%",
            p: "2",
            border: "1px solid #ccc",
            mb: "4",
          })}
        />
        <button
          onClick={handleBook}
          disabled={loading}
          className={css({
            width: "100%",
            bg: "primary",
            color: "white",
            p: "3",
            borderRadius: "md",
          })}
        >
          {loading ? "処理中..." : "検索・登録"}
        </button>
      </div>
    </div>
  );
}
