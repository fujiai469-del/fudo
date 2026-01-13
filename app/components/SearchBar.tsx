"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    isLoading?: boolean;
}

export default function SearchBar({
    value,
    onChange,
    onSearch,
    isLoading = false,
}: SearchBarProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="relative">
                {/* Glowing background effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-blue)] rounded-full opacity-30 blur-lg" />

                <div className="relative flex items-center gap-4">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--neon-cyan)] opacity-70" />
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="企業名を入力 (例: 株式会社ナガオカ)"
                            className="neon-input pl-14 pr-6"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Analyze button */}
                    <motion.button
                        type="submit"
                        className="neon-button flex items-center gap-2 whitespace-nowrap"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        <span>{isLoading ? "分析中..." : "Analyze"}</span>
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
}
