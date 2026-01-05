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

export const Route = createLazyFileRoute("/habits")({
  component: HabitsPage,
});

// =================================================================
// 📍 1. DestinationPicker (テキスト入力 & 検索ボタン)
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
  isLocationSet: boolean; // 座標がセットされているか
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
        {/* 👇 座標セット済みならチェックマークを表示 */}
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
            color: "#333",
            outline: "none",
            backgroundColor: "transparent",
            height: "100%",
            minWidth: 0,
          }}
        />

        {/* 検索ボタン */}
        <IconButton
          type="button"
          onClick={onSearch}
          className={css({
            bg: "gray.800",
            color: "white",
            _hover: { bg: "black" },
          })}
          title="検索して地図に表示"
        >
          🔍
        </IconButton>
      </InputContainer>
      {/* 補足メッセージ: 座標取得済みなら名前変更OKと伝える */}
      {isLocationSet && (
        <div
          className={css({
            fontSize: "xs",
            color: "gray.500",
            mt: "1",
            textAlign: "right",
          })}
        >
          ※名前を「自宅」などに変更しても位置情報は保持されます
        </div>
      )}
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
  const defaultCenter = { lat: 35.681236, lng: 139.767125 }; // 東京駅

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
            className={css({
              padding: "10px 20px",
              borderRadius: "8px",
              bg: "white",
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#666",
            })}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!markerPosition}
            className={css({
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              bg: markerPosition ? "primary" : "gray.300",
              color: "white",
              cursor: markerPosition ? "pointer" : "not-allowed",
              fontWeight: "bold",
            })}
          >
            決定
          </button>
        </Flex>
      </ModalContent>
    </ModalOverlay>
  );
};

// =================================================================
// 🕒 3. TimeRangeSelector (時刻選択)
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
// 🚀 4. メイン画面 (HabitsPage & AddHabitModal)
// =================================================================

// データ型定義
type Habit = {
  id: number;
  departure: string;
  departureLat?: number;
  departureLng?: number;
  destination: string;
  destinationLat?: number;
  destinationLng?: number;
  startTime: string;
  endTime: string;
};

// 初期データは空にする
const initialHabits: Habit[] = [];

function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBook = (habit: Habit) => {
    if (
      confirm(
        `以下の内容で予約を作成しますか？\n\n場所: ${habit.departure} → ${habit.destination}\n時間: ${habit.startTime} - ${habit.endTime}`,
      )
    ) {
      alert("予約リクエストを送信しました！");
    }
  };

  const deleteHabit = (id: number) => {
    if (confirm("このテンプレートを削除しますか？")) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
    }
  };

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
        {/* ヘッダー */}
        <Flex alignItems="center" gap="4">
          <h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
            よく使うルート
          </h1>
        </Flex>

        {/* 習慣リスト */}
        <Flex direction="column" gap="4">
          {habits.length === 0 ? (
            <Box textAlign="center" color="gray.500" py="10">
              登録されたルートはありません。
              <br />
              よく使うルートを登録して、
              <br />
              ワンタップで予約できるようにしましょう。
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
                          ml: "1",
                        })}
                      >
                        - {habit.endTime}
                      </span>
                    </Box>
                    <Box fontWeight="medium" fontSize="md">
                      {habit.departure} → {habit.destination}
                    </Box>
                  </Flex>

                  {/* 予約ボタン */}
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
                      transition: "background 0.2s",
                      _hover: { bg: "secondary" },
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
                      _hover: { color: "red.500" },
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

      {/* フローティング追加ボタン */}
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
          _hover: { bg: "secondary" },
        })}
      >
        +
      </button>

      {/* 新規追加モーダル */}
      {isModalOpen && (
        <AddHabitModal
          onClose={() => setIsModalOpen(false)}
          onAdd={(newHabit) =>
            setHabits([...habits, { ...newHabit, id: Date.now() }])
          }
        />
      )}
    </>
  );
}

// --- 📝 新規追加モーダル (地図検索対応) ---
function AddHabitModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (habit: Omit<Habit, "id">) => void;
}) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
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

  // マップを開く
  const openMap = (field: "departure" | "destination") => {
    setTargetField(field);
    setIsMapOpen(true);
  };

  // 入力文字から検索 (Nominatim API)
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
        alert(
          "場所が見つかりませんでした。「東京都 新宿区」のように入力してみてください。",
        );
      }
    } catch (error) {
      alert("検索中にエラーが発生しました。");
    }
  };

  // 地図上で場所決定
  const handleLocationSelect = (data: any) => {
    if (targetField === "departure") {
      setDepartureName(data.address);
      setDepartureCoords({ lat: data.lat, lng: data.lng });
    } else if (targetField === "destination") {
      setDestinationName(data.address);
      setDestinationCoords({ lat: data.lat, lng: data.lng });
    }
    setTargetField(null);
    setIsMapOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 👇 [修正] ここで座標チェックを行う
    if (!departureCoords || !destinationCoords) {
      alert(
        "出発地または目的地の位置情報が設定されていません。\n「🔍」ボタンを押して検索するか、「📍」ボタンで地図から場所を選択してください。",
      );
      return;
    }

    if (!departureName || !destinationName) {
      alert("出発地と目的地を入力してください");
      return;
    }

    onAdd({
      departure: departureName,
      departureLat: departureCoords?.lat,
      departureLng: departureCoords?.lng,
      destination: destinationName,
      destinationLat: destinationCoords?.lat,
      destinationLng: destinationCoords?.lng,
      startTime,
      endTime,
    });
    onClose();
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

  return (
    <>
      <div
        className={css({
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bg: "rgba(0, 0, 0, 0.5)",
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
                isLocationSet={!!departureCoords} // 座標があるか渡す
                onChange={setDepartureName}
                onMapClick={() => openMap("departure")}
                onSearch={() => handleSearch("departure", departureName)}
              />
            </Box>

            <Box mb="4">
              <DestinationPicker
                label="目的地"
                value={destinationName}
                isLocationSet={!!destinationCoords} // 座標があるか渡す
                onChange={setDestinationName}
                onMapClick={() => openMap("destination")}
                onSearch={() => handleSearch("destination", destinationName)}
              />
            </Box>

            <Box mb="4">
              <TimeRangeSelector
                startTime={startTime}
                endTime={endTime}
                onChangeStart={setStartTime}
                onChangeEnd={setEndTime}
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
                  cursor: "pointer",
                })}
              >
                キャンセル
              </button>
              <button
                type="submit"
                // 座標がない場合はグレーアウトさせることもできますが、
                // あえて押させてエラーメッセージを出す方が親切な場合もあります。
                // 今回は通常のスタイルですが、押すとエラーが出ます。
                className={css({
                  flex: 1,
                  padding: "3",
                  borderRadius: "md",
                  bg: "primary",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  _hover: { bg: "secondary" },
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
