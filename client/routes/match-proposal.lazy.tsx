"use client";

import { css } from "@ss/css";
import { Box, Flex } from "@ss/jsx";
import {
  createLazyFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import { supabase } from "../utils/supabase";

export const Route = createLazyFileRoute("/match-proposal")({
  component: MatchProposalPage,
});

const FitBounds = ({ layer1, layer2 }: { layer1: any; layer2: any }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) {
      return;
    }
    try {
      const group = L.featureGroup();
      if (layer1) {
        L.geoJSON(layer1).addTo(group);
      }
      if (layer2) {
        L.geoJSON(layer2).addTo(group);
      }
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
      }
    } catch (e) {
      console.error(e);
    }
  }, [layer1, layer2, map]);
  return null;
};

function MatchProposalPage() {
  const navigate = useNavigate();
  // @ts-ignore
  const { state } = useLocation();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!state || !state.proposal) {
      navigate({ to: "/" });
    }
  }, [state, navigate]);

  if (!state || !state.proposal) {
    return null;
  }

  const { proposal, requestData } = state;
  const { partnerReservation, score, sharedRouteInfo, soloRouteInfo } =
    proposal;

  const soloDuration = Math.round(soloRouteInfo.duration / 60);
  const sharedDuration = Math.round(sharedRouteInfo.duration / 60);
  const diffTime = sharedDuration - soloDuration;

  // 申請処理 (自分の承認 -> 相手へ依頼)
  const handleConfirm = async () => {
    if (!user) {
      return;
    }
    setIsProcessing(true);

    console.log("🔥 申請処理開始...");

    const routeInfoToSave = {
      solo: soloRouteInfo,
      shared: sharedRouteInfo,
      diffTime: diffTime,
      soloDuration: soloDuration,
      sharedDuration: sharedDuration,
    };

    try {
      // 1. 相手の状態を更新 (ステータス: 'approval_pending' = 承認待ち)
      const { error: errorPartner } = await supabase
        .from("reservations")
        .update({
          status: "approval_pending", // 👈 相手に行動を促すステータス
          partner_id: user.id,
          route_info: routeInfoToSave,
        })
        .eq("id", partnerReservation.id);

      if (errorPartner) {
        throw new Error("相手データの更新に失敗: " + errorPartner.message);
      }

      // 2. 自分の予約を登録 (ステータス: 'waiting_approval' = 返事待ち)
      const { error: errorSelf } = await supabase.from("reservations").insert([
        {
          user_id: user.id,
          departure_location: requestData.departure.name,
          departure_lat: requestData.departure.lat,
          departure_lng: requestData.departure.lng,
          destination_location: requestData.destination.name,
          destination_lat: requestData.destination.lat,
          destination_lng: requestData.destination.lng,
          target_date: requestData.targetDate,
          start_time: requestData.departureTime,
          tolerance: requestData.tolerance,

          status: "waiting_approval", // 👈 自分は待つステータス
          partner_id: partnerReservation.user_id,
          route_info: routeInfoToSave,
        },
      ]);

      if (errorSelf) {
        throw new Error("自分データの保存に失敗: " + errorSelf.message);
      }

      alert(
        "相手に承認リクエストを送りました！\nマイページで返事を待ちましょう。",
      );
      navigate({ to: "/mypage" });
    } catch (e: any) {
      console.error("❌ エラー発生:", e);
      alert("エラーが発生しました: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 見送り処理
  const handleReject = async () => {
    if (!user) {
      return;
    }
    setIsProcessing(true);
    try {
      await supabase.from("reservations").insert([
        {
          user_id: user.id,
          departure_location: requestData.departure.name,
          departure_lat: requestData.departure.lat,
          departure_lng: requestData.departure.lng,
          destination_location: requestData.destination.name,
          destination_lat: requestData.destination.lat,
          destination_lng: requestData.destination.lng,
          target_date: requestData.targetDate,
          start_time: requestData.departureTime,
          tolerance: requestData.tolerance,
          status: "active",
        },
      ]);

      alert("今回は見送りました。\n待機リストに登録し、他の候補を待ちます。");
      navigate({ to: "/mypage" });
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <Flex direction="column" height="calc(100vh - 60px)">
      <Box flex="6" position="relative" width="100%">
        <MapContainer
          center={[35.6812, 139.7671]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {soloRouteInfo?.geometry && (
            <GeoJSON
              data={soloRouteInfo.geometry}
              style={{
                color: "#3b82f6",
                weight: 5,
                opacity: 0.6,
                dashArray: "10, 10",
              }}
            />
          )}
          {sharedRouteInfo?.geometry && (
            <GeoJSON
              data={sharedRouteInfo.geometry}
              style={{ color: "#ef4444", weight: 6, opacity: 0.9 }}
            />
          )}
          <FitBounds
            layer1={soloRouteInfo?.geometry}
            layer2={sharedRouteInfo?.geometry}
          />
        </MapContainer>
        <Box
          position="absolute"
          top="10px"
          right="10px"
          bg="white"
          p="2"
          borderRadius="md"
          boxShadow="md"
          zIndex={1000}
          fontSize="xs"
        >
          <Flex align="center" gap="2" mb="1">
            <Box w="4" h="1" bg="#3b82f6" borderTop="2px dashed #3b82f6" />{" "}
            1人の場合
          </Flex>
          <Flex align="center" gap="2">
            <Box w="4" h="1" bg="#ef4444" /> 相乗り (今回)
          </Flex>
        </Box>
      </Box>

      <Flex
        flex="4"
        direction="column"
        p="6"
        bg="white"
        boxShadow="0 -4px 20px rgba(0,0,0,0.1)"
        zIndex={10}
      >
        <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
          マッチング提案
        </h1>
        <Flex gap="4" mb="6">
          <Box flex="1" p="4" bg="gray.50" borderRadius="lg" textAlign="center">
            <div className={css({ fontSize: "sm", color: "gray.500" })}>
              1人の場合
            </div>
            <div
              className={css({
                fontSize: "2xl",
                fontWeight: "bold",
                color: "gray.800",
              })}
            >
              {soloDuration}
              <span className={css({ fontSize: "sm" })}>分</span>
            </div>
          </Box>
          <Box
            flex="1"
            p="4"
            bg="red.50"
            border="1px solid token(colors.red.200)"
            borderRadius="lg"
            textAlign="center"
          >
            <div
              className={css({
                fontSize: "sm",
                color: "red.600",
                fontWeight: "bold",
              })}
            >
              相乗りプラン
            </div>
            <div
              className={css({
                fontSize: "2xl",
                fontWeight: "bold",
                color: "red.600",
              })}
            >
              {sharedDuration}
              <span className={css({ fontSize: "sm" })}>分</span>
            </div>
            <div
              className={css({
                fontSize: "sm",
                color: "red.500",
                fontWeight: "bold",
              })}
            >
              ({diffTime > 0 ? "+" : ""}
              {diffTime}分)
            </div>
          </Box>
        </Flex>

        <Box mb="4">
          <p>
            <strong>相手:</strong>{" "}
            {partnerReservation.user?.username ||
              partnerReservation.user?.nickname ||
              "ユーザー"}{" "}
            さん
          </p>
          <p>
            <strong>スコア:</strong> {Math.floor(score * 100)}点 / 100点
          </p>
        </Box>

        <Flex gap="4" mt="auto">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className={css({
              flex: 1,
              py: "3",
              borderRadius: "lg",
              fontWeight: "bold",
              bg: "gray.200",
              color: "gray.700",
              cursor: "pointer",
            })}
          >
            見送る (待機)
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={css({
              flex: 1,
              py: "3",
              borderRadius: "lg",
              fontWeight: "bold",
              bg: "primary",
              color: "white",
              cursor: "pointer",
              _hover: { opacity: 0.9 },
            })}
          >
            承認して申請
          </button>
        </Flex>
      </Flex>
    </Flex>
  );
}
