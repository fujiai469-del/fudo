"use client";

import { motion } from "framer-motion";
import { MapPin, Building2 } from "lucide-react";

interface Property {
    id: string;
    name: string;
    location: string;
    bookValue: number;
    marketValue: number;
}

interface PropertyListProps {
    properties: Property[];
    onSelectProperty?: (property: Property) => void;
}

export default function PropertyList({
    properties,
    onSelectProperty,
}: PropertyListProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card p-6 h-full floating-delay-2"
        >
            {/* Top glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-cyan)] rounded-b-full" />

            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--neon-purple)]" />
                <span className="gradient-text">保有不動産一覧</span>
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {properties.map((property, index) => {
                    const unrealizedGain = property.marketValue - property.bookValue;
                    const isPositive = unrealizedGain >= 0;

                    return (
                        <motion.div
                            key={property.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            onClick={() => onSelectProperty?.(property)}
                            className="p-4 rounded-xl bg-gradient-to-r from-[rgba(15,15,35,0.8)] to-[rgba(25,25,50,0.6)] border border-[rgba(255,255,255,0.05)] cursor-pointer transition-all duration-300 hover:border-[var(--neon-cyan)] hover:border-opacity-50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">
                                        {property.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{property.location}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div
                                        className={`text-sm font-mono font-bold ${isPositive
                                                ? "text-[var(--neon-lime)]"
                                                : "text-red-400"
                                            }`}
                                    >
                                        {isPositive ? "+" : ""}
                                        {unrealizedGain.toLocaleString()}
                                        <span className="text-xs text-gray-500 ml-1">百万円</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="px-2 py-1 rounded-md bg-[rgba(0,245,255,0.1)] text-[var(--neon-cyan)]">
                                    帳簿: {property.bookValue.toLocaleString()}
                                </div>
                                <div className="px-2 py-1 rounded-md bg-[rgba(191,0,255,0.1)] text-[var(--neon-purple)]">
                                    時価: {property.marketValue.toLocaleString()}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
