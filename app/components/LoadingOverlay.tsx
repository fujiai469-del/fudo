"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingOverlay() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(5,5,16,0.9)] backdrop-blur-md"
        >
            <div className="text-center">
                {/* Animated rings */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                    {/* Outer ring */}
                    <motion.div
                        className="absolute inset-0 border-2 border-[var(--neon-cyan)] rounded-full"
                        style={{ borderTopColor: "transparent" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Middle ring */}
                    <motion.div
                        className="absolute inset-3 border-2 border-[var(--neon-purple)] rounded-full"
                        style={{ borderRightColor: "transparent" }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Inner ring */}
                    <motion.div
                        className="absolute inset-6 border-2 border-[var(--neon-blue)] rounded-full"
                        style={{ borderBottomColor: "transparent" }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Center glow */}
                    <motion.div
                        className="absolute inset-10 rounded-full bg-gradient-to-br from-[var(--neon-cyan)] to-[var(--neon-purple)]"
                        animate={{
                            scale: [0.8, 1, 0.8],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Loading text */}
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className="text-xl font-bold gradient-text mb-2">
                        分析中...
                    </div>
                    <div className="text-sm text-gray-500">
                        EDINET から決算データを取得しています
                    </div>
                </motion.div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-4">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
