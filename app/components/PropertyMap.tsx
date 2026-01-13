"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface MapLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    value?: number;
}

interface PropertyMapProps {
    locations: MapLocation[];
    selectedId?: string;
    onSelectLocation?: (location: MapLocation) => void;
}

// Google Maps ダークモードスタイル
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0a0a1a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a1a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00f5ff" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#0f1a0f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#39ff14" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1a1a2e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#2a2a4e" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bf00ff" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1a1a2e" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00f5ff" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#050510" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4169e1" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#050510" }],
    },
];

// カスタムマーカーコンポーネント
function CustomMarker({
    location,
    isSelected,
    onClick,
}: {
    location: MapLocation;
    isSelected: boolean;
    onClick: () => void;
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <AdvancedMarker
            position={{ lat: location.lat, lng: location.lng }}
            onClick={onClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="relative cursor-pointer">
                {/* Glow effect */}
                <motion.div
                    className={`absolute -inset-3 rounded-full ${isSelected ? "bg-[#00f5ff]" : "bg-[#39ff14]"
                        }`}
                    style={{ filter: "blur(8px)" }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.6, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Pin icon */}
                <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="relative z-10"
                >
                    <MapPin
                        className={`w-10 h-10 drop-shadow-lg ${isSelected ? "text-[#00f5ff]" : "text-[#39ff14]"
                            }`}
                        fill="currentColor"
                        style={{
                            filter: isSelected
                                ? "drop-shadow(0 0 10px #00f5ff)"
                                : "drop-shadow(0 0 10px #39ff14)",
                        }}
                    />
                </motion.div>

                {/* Tooltip */}
                {(showTooltip || isSelected) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-[rgba(10,10,20,0.95)] border border-[#00f5ff] rounded-lg whitespace-nowrap z-20"
                        style={{
                            boxShadow: "0 0 10px rgba(0,245,255,0.3)",
                        }}
                    >
                        <div className="text-sm font-semibold text-white">
                            {location.name}
                        </div>
                        {location.value && (
                            <div className="text-xs text-[#39ff14]">
                                {location.value.toLocaleString()} 百万円
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </AdvancedMarker>
    );
}

export default function PropertyMap({
    locations,
    selectedId,
    onSelectLocation,
}: PropertyMapProps) {
    // 関西地方の中心座標
    const kansaiCenter = { lat: 34.8, lng: 135.5 };

    // Google Maps APIキーの確認
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // APIキーがない場合はフォールバックUI
    if (!apiKey) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-card p-6 h-full floating-delay-3 relative overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-lime)] rounded-b-full z-10" />

                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                    <MapPin className="w-5 h-5 text-[var(--neon-cyan)]" />
                    <span className="gradient-text">物件所在地マップ</span>
                </h2>

                <div className="relative w-full h-[350px] rounded-xl overflow-hidden bg-[#0a0a1a] flex items-center justify-center">
                    <div className="text-center p-6">
                        <div className="text-4xl mb-4">🗺️</div>
                        <p className="text-gray-400 text-sm">
                            Google Maps APIキーが設定されていません
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            .env.localに NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください
                        </p>

                        {/* Show locations as list fallback */}
                        <div className="mt-4 space-y-2">
                            {locations.map((loc) => (
                                <div
                                    key={loc.id}
                                    className="text-xs text-[var(--neon-cyan)] flex items-center gap-2"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {loc.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card p-6 h-full floating-delay-3 relative overflow-hidden"
        >
            {/* Top glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-lime)] rounded-b-full z-10" />

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                <MapPin className="w-5 h-5 text-[var(--neon-cyan)]" />
                <span className="gradient-text">物件所在地マップ</span>
            </h2>

            {/* Google Map */}
            <div className="relative w-full h-[350px] rounded-xl overflow-hidden">
                <APIProvider apiKey={apiKey}>
                    <Map
                        defaultCenter={kansaiCenter}
                        defaultZoom={8}
                        mapId="antigravity-dark-map"
                        styles={darkMapStyles}
                        disableDefaultUI={true}
                        zoomControl={true}
                        className="w-full h-full"
                        gestureHandling="cooperative"
                    >
                        {locations.map((location) => (
                            <CustomMarker
                                key={location.id}
                                location={location}
                                isSelected={selectedId === location.id}
                                onClick={() => onSelectLocation?.(location)}
                            />
                        ))}
                    </Map>
                </APIProvider>

                {/* Gradient overlays for depth effect */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[rgba(5,5,16,0.3)] via-transparent to-[rgba(5,5,16,0.2)]" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[rgba(5,5,16,0.2)] via-transparent to-[rgba(5,5,16,0.2)]" />
            </div>

            {/* Map legend */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 text-xs z-20">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full bg-[#39ff14]"
                        style={{ boxShadow: "0 0 8px #39ff14" }}
                    />
                    <span className="text-gray-400">保有物件</span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full bg-[#00f5ff]"
                        style={{ boxShadow: "0 0 8px #00f5ff" }}
                    />
                    <span className="text-gray-400">選択中</span>
                </div>
            </div>
        </motion.div>
    );
}
