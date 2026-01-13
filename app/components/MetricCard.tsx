"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string;
    unit?: string;
    icon: LucideIcon;
    glowColor: "cyan" | "purple" | "blue" | "lime";
    isPositive?: boolean | null;
    delay?: number;
}

const glowClasses = {
    cyan: "neon-glow-cyan",
    purple: "neon-glow-purple",
    blue: "neon-glow-blue",
    lime: "neon-glow-lime",
};

const iconColors = {
    cyan: "text-[var(--neon-cyan)]",
    purple: "text-[var(--neon-purple)]",
    blue: "text-[var(--neon-blue)]",
    lime: "text-[var(--neon-lime)]",
};

const borderGradients = {
    cyan: "from-[var(--neon-cyan)] to-[var(--neon-blue)]",
    purple: "from-[var(--neon-purple)] to-[var(--neon-pink)]",
    blue: "from-[var(--neon-blue)] to-[var(--neon-cyan)]",
    lime: "from-[var(--neon-lime)] to-[var(--neon-cyan)]",
};

export default function MetricCard({
    title,
    value,
    unit = "百万円",
    icon: Icon,
    glowColor,
    isPositive = null,
    delay = 0,
}: MetricCardProps) {
    const floatClass =
        delay === 0
            ? "floating"
            : delay === 1
                ? "floating-delay-1"
                : delay === 2
                    ? "floating-delay-2"
                    : "floating-delay-3";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: delay * 0.15 }}
            className={`glass-card p-6 ${floatClass}`}
        >
            {/* Top glow accent */}
            <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r ${borderGradients[glowColor]} rounded-b-full`}
            />

            <div className="flex items-start justify-between mb-4">
                <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${borderGradients[glowColor]} bg-opacity-20`}
                    style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` }}
                >
                    <Icon className={`w-6 h-6 ${iconColors[glowColor]}`} />
                </div>
            </div>

            <h3 className="text-sm text-gray-400 mb-2 font-medium">{title}</h3>

            <div className="flex items-baseline gap-2">
                <span
                    className={`text-3xl font-bold font-mono ${isPositive === null
                            ? "text-white"
                            : isPositive
                                ? "text-[var(--neon-lime)]"
                                : "text-red-500"
                        }`}
                >
                    {value}
                </span>
                <span className="text-sm text-gray-500">{unit}</span>
            </div>

            {isPositive !== null && (
                <div
                    className={`mt-2 text-xs font-medium ${isPositive ? "text-[var(--neon-lime)]" : "text-red-400"
                        }`}
                >
                    {isPositive ? "▲ 含み益あり" : "▼ 含み損あり"}
                </div>
            )}
        </motion.div>
    );
}
