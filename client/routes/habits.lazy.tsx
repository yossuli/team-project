import { useUser } from "@clerk/clerk-react";
import { css } from "@ss/css";
import { Box, Flex, styled } from "@ss/jsx";
import { createLazyFileRoute } from "@tanstack/react-router";
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
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/habits")({
  component: HabitsPage,
});

// =================================================================
// 📍 1. DestinationPicker (省略 - 以前と同じ)
// =================================================================
// ※ 元のコードのDestinationPickerと同じものをここに置いてください
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
      borderColor: "primary",
      boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.2)",
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

const DestinationPicker = ({
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
            className={css({
              fontSize: "xs",
              color: "green.600",
              fontWeight: "bold",
            })}
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
          placeholder="場所名 (例: 自宅, 東京駅)"
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
          className={css({
            bg: "gray.800",
            color: "white",
            _hover: { bg: "black" },
          })}
        >
          🔍
        </IconButton>
      </InputContainer>
    </Box>
  );
};

// =================================================================
// 🗺️ 2. Leaflet 設定 (省略 - 以前と同じ)
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
            style={{ border: "none", background: "none", fontSize: "20px" }}
          >
            ✕
          </button>
        </Flex>
        <Box bg="#f0f0f0" height="320px" width="100%" position="relative">
          <MapContainer
            center={markerPosition || defaultCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={markerPosition || defaultCenter} />
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
// 3. DepartureTimeSelector (index.lazy.tsxと同じもの)
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
  startTime: string; // "09:00" (DBのstart_time列を使用)
  tolerance: number; // 30 (DBのtolerance列を使用)
};

function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();

  const fetchHabitsForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedData: Habit[] = data.map((item: any) => ({
          id: item.id,
          departure: item.departure,
          departureLat: item.departure_lat,
          departureLng: item.departure_lng,
          destination: item.destination,
          destinationLat: item.destination_lat,
          destinationLng: item.destination_lng,
          startTime: item.start_time, // DB列名はstart_timeのまま
          tolerance: item.tolerance || 0, // 新しいカラム
        }));
        setHabits(formattedData);
      }
    } catch (error: any) {
      console.error("データ取得エラー:", error.message);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchHabitsForUser(user.id);
    }
  }, [isLoaded, user]);

  const handleBook = (habit: Habit) => {
    if (
      confirm(
        `以下の内容で予約を作成しますか？\n\n場所: ${habit.departure} → ${habit.destination}\n時間: ${habit.startTime} (±${habit.tolerance}分)`,
      )
    ) {
      alert("予約リクエストを送信しました！");
    }
  };

  const deleteHabit = async (id: number) => {
    if (!confirm("このテンプレートを削除しますか？")) {
      return;
    }
    try {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) {
        throw error;
      }
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (error: any) {
      alert("削除に失敗しました");
    }
  };

  const handleAddHabit = async (newHabitData: Omit<Habit, "id">) => {
    if (!user) {
      alert("サインインしてください");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("habits")
        .insert([
          {
            user_id: user.id,
            departure: newHabitData.departure,
            departure_lat: newHabitData.departureLat,
            departure_lng: newHabitData.departureLng,
            destination: newHabitData.destination,
            destination_lat: newHabitData.destinationLat,
            destination_lng: newHabitData.destinationLng,
            start_time: newHabitData.startTime, // 出発時刻
            tolerance: newHabitData.tolerance, // 許容範囲
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setHabits((prev) => [
          ...prev,
          {
            id: data.id,
            departure: data.departure,
            departureLat: data.departure_lat,
            departureLng: data.departure_lng,
            destination: data.destination,
            destinationLat: data.destination_lat,
            destinationLng: data.destination_lng,
            startTime: data.start_time,
            tolerance: data.tolerance,
          },
        ]);
      }
    } catch (error: any) {
      console.error("保存エラー:", error.message);
      alert("保存に失敗しました");
    }
  };

  if (!isLoaded) {
    return (
      <Box textAlign="center" py="10">
        読み込み中...
      </Box>
    );
  }
  if (!isSignedIn || !user) {
    return (
      <Box textAlign="center" py="10">
        サインインが必要です
      </Box>
    );
  }

  return (
    <>
      <Flex
        direction="column"
        gap="6"
        width="100%"
        maxWidth="600px"
        mx="auto"
        p="4"
        pb="24"
      >
        <h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
          よく使うルート
        </h1>
        <Flex direction="column" gap="4">
          {habits.length === 0 ? (
            <Box textAlign="center" color="gray.500" py="10">
              登録されたルートはありません。
            </Box>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className={css({
                  border: "1px solid token(colors.gray.200)",
                  borderRadius: "lg",
                  padding: "4",
                  bg: "white",
                  boxShadow: "sm",
                })}
              >
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  gap="4"
                >
                  <Flex direction="column" gap="1" flex={1}>
                    <Box fontSize="2xl" fontWeight="bold" lineHeight="1" mb="1">
                      {habit.startTime}
                      <span
                        className={css({
                          fontSize: "sm",
                          color: "gray.500",
                          ml: "2",
                        })}
                      >
                        (±{habit.tolerance}分)
                      </span>
                    </Box>
                    <Box fontWeight="medium" fontSize="md">
                      {habit.departure} → {habit.destination}
                    </Box>
                  </Flex>
                  <button
                    type="button"
                    onClick={() => handleBook(habit)}
                    className={css({
                      bg: "primary",
                      color: "white",
                      fontSize: "sm",
                      fontWeight: "bold",
                      padding: "3 6",
                      borderRadius: "md",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    })}
                  >
                    登録
                  </button>
                </Flex>
                <Flex justifyContent="flex-end" mt="2">
                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className={css({
                      fontSize: "xs",
                      color: "gray.400",
                      textDecoration: "underline",
                      cursor: "pointer",
                      bg: "transparent",
                      border: "none",
                    })}
                  >
                    この設定を削除
                  </button>
                </Flex>
              </div>
            ))
          )}
        </Flex>
      </Flex>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={css({
          position: "fixed",
          bottom: "6",
          right: "6",
          width: "14",
          height: "14",
          borderRadius: "full",
          bg: "primary",
          color: "white",
          fontSize: "3xl",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "lg",
          cursor: "pointer",
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
    </>
  );
}

// --- 📝 新規追加モーダル ---
function AddHabitModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (habit: Omit<Habit, "id">) => Promise<void>;
}) {
  const [startTime, setStartTime] = useState("09:00");
  const [tolerance, setTolerance] = useState(30); // 許容範囲
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [targetField, setTargetField] = useState<
    "departure" | "destination" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // (検索・地図ロジック省略 - index.lazy.tsxと同じ)
  // ※ 実際の実装では共通化するか、index.lazy.tsxのロジックをコピーしてください
  // ここでは省略していますが、必ずコピーして実装してください
  const handleSearch = async (field: any, query: any) => {
    /* ... */
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
    setIsMapOpen(false);
  };
  const getCurrentModalCoords = () => {
    return targetField === "departure" ? departureCoords : destinationCoords;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureName || !destinationName) {
      alert("場所を入力してください");
      return;
    }
    try {
      setIsSubmitting(true);
      await onAdd({
        departure: departureName,
        departureLat: departureCoords?.lat,
        departureLng: departureCoords?.lng,
        destination: destinationName,
        destinationLat: destinationCoords?.lat,
        destinationLng: destinationCoords?.lng,
        startTime,
        tolerance,
        endTime: "", // 互換性のため空文字
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={css({
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bg: "rgba(0,0,0,0.5)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4",
        })}
        onClick={onClose}
      >
        <div
          className={css({
            bg: "white",
            width: "100%",
            maxWidth: "400px",
            borderRadius: "lg",
            padding: "6",
            maxHeight: "90vh",
            overflowY: "auto",
          })}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            className={css({
              fontSize: "lg",
              fontWeight: "bold",
              mb: "4",
              textAlign: "center",
            })}
          >
            よく使うルートを追加
          </h2>
          <form
            onSubmit={handleSubmit}
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "4",
            })}
          >
            <Box mb="2">
              <DestinationPicker
                label="出発地"
                value={departureName}
                isLocationSet={!!departureCoords}
                onChange={setDepartureName}
                onMapClick={() => openMap("departure")}
                onSearch={() => {}}
              />
            </Box>
            <Box mb="4">
              <DestinationPicker
                label="目的地"
                value={destinationName}
                isLocationSet={!!destinationCoords}
                onChange={setDestinationName}
                onMapClick={() => openMap("destination")}
                onSearch={() => {}}
              />
            </Box>
            <Box mb="4">
              {/* 👇 新しい時間選択 */}
              <DepartureTimeSelector
                departureTime={startTime}
                tolerance={tolerance}
                onChangeTime={setStartTime}
                onChangeTolerance={setTolerance}
              />
            </Box>
            <Flex gap="3" mt="4">
              <button
                type="button"
                onClick={onClose}
                className={css({
                  flex: 1,
                  padding: "3",
                  borderRadius: "md",
                  bg: "gray.200",
                  fontWeight: "bold",
                })}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={css({
                  flex: 1,
                  padding: "3",
                  borderRadius: "md",
                  bg: "primary",
                  color: "white",
                  fontWeight: "bold",
                })}
              >
                保存
              </button>
            </Flex>
          </form>
        </div>
      </div>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelect}
        title={targetField === "departure" ? "出発地を選択" : "目的地を選択"}
        initialPosition={getCurrentModalCoords()}
      />
    </>
  );
}
