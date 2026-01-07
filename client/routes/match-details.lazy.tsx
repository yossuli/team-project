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
import { useEffect } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";

export const Route = createLazyFileRoute("/match-details")({
  component: MatchDetailsPage,
});

// 地図調整コンポーネント
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

function MatchDetailsPage() {
  const navigate = useNavigate();
  // @ts-ignore
  const { state } = useLocation();

  useEffect(() => {
    if (!state || !state.routeInfo) {
      alert("詳細データが見つかりません");
      navigate({ to: "/matching-history" });
    }
  }, [state, navigate]);

  if (!state || !state.routeInfo) {
    return null;
  }

  const { solo, shared, diffTime, soloDuration, sharedDuration } =
    state.routeInfo;

  return (
    <Flex direction="column" height="calc(100vh - 60px)">
      {/* 地図エリア */}
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
          {solo?.geometry && (
            <GeoJSON
              data={solo.geometry}
              style={{
                color: "#3b82f6",
                weight: 5,
                opacity: 0.6,
                dashArray: "10, 10",
              }}
            />
          )}
          {shared?.geometry && (
            <GeoJSON
              data={shared.geometry}
              style={{ color: "#ef4444", weight: 6, opacity: 0.9 }}
            />
          )}
          <FitBounds layer1={solo?.geometry} layer2={shared?.geometry} />
        </MapContainer>

        {/* 凡例 */}
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
            <Box w="4" h="1" bg="#ef4444" /> 相乗り (確定)
          </Flex>
        </Box>

        {/* 戻るボタン (左上) */}
        <button
          onClick={() => navigate({ to: "/matching-history" })}
          className={css({
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            bg: "white",
            px: "3",
            py: "2",
            borderRadius: "md",
            boxShadow: "md",
            cursor: "pointer",
            fontWeight: "bold",
          })}
        >
          ← 戻る
        </button>
      </Box>

      {/* 詳細情報エリア */}
      <Flex
        flex="4"
        direction="column"
        p="6"
        bg="white"
        boxShadow="0 -4px 20px rgba(0,0,0,0.1)"
        zIndex={10}
      >
        <h1 className={css({ fontSize: "xl", fontWeight: "bold", mb: "4" })}>
          マッチング詳細結果
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
      </Flex>
    </Flex>
  );
}
