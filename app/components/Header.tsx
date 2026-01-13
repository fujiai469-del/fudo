"use client";

import { motion } from "framer-motion";

export default function Header() {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative py-8 text-center"
        >
            {/* Decorative line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-[var(--neon-cyan)] to-transparent" />

            {/* Logo / Title */}
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <h1 className="text-5xl font-black tracking-wider mb-2">
                    <span className="gradient-text">ANTIGRAVITY</span>
                </h1>
                <div className="text-sm text-gray-400 tracking-[0.3em] uppercase">
                    Real Estate Analytics Dashboard
                </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-4 text-gray-500 text-sm max-w-xl mx-auto"
            >
                企業の賃貸等不動産データを分析し、
                <span className="text-[var(--neon-cyan)]">含み損益</span>を可視化する
                次世代ダッシュボード
            </motion.p>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[200px] h-[2px] overflow-hidden">
                <motion.div
                    className="w-full h-full bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-cyan)]"
                    animate={{
                        x: ["-100%", "100%"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>
        </motion.header>
    );
}
