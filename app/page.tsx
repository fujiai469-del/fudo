"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, TrendingUp, BarChart3, Building2, Info } from "lucide-react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MetricCard from "./components/MetricCard";
import PropertyList from "./components/PropertyList";
import PropertyMap from "./components/PropertyMap";
import LoadingOverlay from "./components/LoadingOverlay";

// モックデータ型定義
interface Property {
  id: string;
  name: string;
  location: string;
  bookValue: number;
  marketValue: number;
}

interface CompanyData {
  companyName: string;
  bookValue: number; // 帳簿価額（百万円）
  marketValue: number; // 時価（百万円）
  unrealizedGain: number; // 含み損益（百万円）
  properties: Property[];
}

// モックデータ
const mockCompanyData: { [key: string]: CompanyData } = {
  "株式会社ナガオカ": {
    companyName: "株式会社ナガオカ",
    bookValue: 2845,
    marketValue: 4210,
    unrealizedGain: 1365,
    properties: [
      {
        id: "1",
        name: "梅田オフィスビル",
        location: "大阪府大阪市北区",
        bookValue: 1200,
        marketValue: 1850,
      },
      {
        id: "2",
        name: "京都商業施設",
        location: "京都府京都市",
        bookValue: 800,
        marketValue: 1100,
      },
      {
        id: "3",
        name: "神戸倉庫",
        location: "兵庫県神戸市",
        bookValue: 450,
        marketValue: 580,
      },
      {
        id: "4",
        name: "大津レジデンス",
        location: "滋賀県大津市",
        bookValue: 395,
        marketValue: 680,
      },
    ],
  },
  "サンプル不動産": {
    companyName: "サンプル不動産",
    bookValue: 5200,
    marketValue: 4800,
    unrealizedGain: -400,
    properties: [
      {
        id: "1",
        name: "新宿オフィスタワー",
        location: "東京都新宿区",
        bookValue: 3000,
        marketValue: 2700,
      },
      {
        id: "2",
        name: "横浜倉庫",
        location: "神奈川県横浜市",
        bookValue: 2200,
        marketValue: 2100,
      },
    ],
  },
};

// 物件の緯度経度データ（モック）
const propertyLocations: { [key: string]: { lat: number; lng: number }[] } = {
  "株式会社ナガオカ": [
    { lat: 34.7, lng: 135.5 }, // 大阪
    { lat: 35.0, lng: 135.75 }, // 京都
    { lat: 34.69, lng: 135.2 }, // 神戸
    { lat: 35.0, lng: 135.85 }, // 大津
  ],
  "サンプル不動産": [
    { lat: 35.69, lng: 139.7 }, // 新宿
    { lat: 35.45, lng: 139.64 }, // 横浜
  ],
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // 検索実行
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    // API呼び出しをシミュレート（2秒待機）
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // モックデータから検索
    const data = mockCompanyData[searchQuery] || null;
    setCompanyData(data);
    setSelectedPropertyId(null);
    setIsLoading(false);
  }, [searchQuery]);

  // マップ用のロケーションデータを生成
  const mapLocations = companyData
    ? companyData.properties.map((prop, index) => {
      const coords = propertyLocations[companyData.companyName]?.[index] || {
        lat: 35.0,
        lng: 135.5,
      };
      return {
        id: prop.id,
        name: prop.name,
        lat: coords.lat,
        lng: coords.lng,
        value: prop.marketValue,
      };
    })
    : [];

  return (
    <main className="relative min-h-screen p-6 md:p-8 lg:p-12">
      <AnimatePresence>{isLoading && <LoadingOverlay />}</AnimatePresence>

      {/* Header */}
      <Header />

      {/* Search Section */}
      <section className="mt-12 mb-16">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Search hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4"
        >
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Info className="w-3 h-3" />
            <span>
              デモ用に「株式会社ナガオカ」または「サンプル不動産」を入力してください
            </span>
          </p>
        </motion.div>
      </section>

      {/* Dashboard Content */}
      <AnimatePresence mode="wait">
        {companyData && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            {/* Company Name Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-3 glass-card px-8 py-4">
                <Building2 className="w-6 h-6 text-[var(--neon-cyan)]" />
                <span className="text-2xl font-bold text-white">
                  {companyData.companyName}
                </span>
              </div>
            </motion.div>

            {/* Metrics Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <MetricCard
                title="賃貸等不動産 帳簿価額"
                value={companyData.bookValue.toLocaleString()}
                icon={Book}
                glowColor="cyan"
                delay={0}
              />
              <MetricCard
                title="賃貸等不動産 時価"
                value={companyData.marketValue.toLocaleString()}
                icon={TrendingUp}
                glowColor="purple"
                delay={1}
              />
              <MetricCard
                title="想定含み損益"
                value={
                  (companyData.unrealizedGain >= 0 ? "+" : "") +
                  companyData.unrealizedGain.toLocaleString()
                }
                icon={BarChart3}
                glowColor={companyData.unrealizedGain >= 0 ? "lime" : "blue"}
                isPositive={companyData.unrealizedGain >= 0}
                delay={2}
              />
            </section>

            {/* Properties Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property List */}
              <PropertyList
                properties={companyData.properties}
                onSelectProperty={(prop) => setSelectedPropertyId(prop.id)}
              />

              {/* Property Map */}
              <PropertyMap
                locations={mapLocations}
                selectedId={selectedPropertyId || undefined}
                onSelectLocation={(loc) => setSelectedPropertyId(loc.id)}
              />
            </section>
          </motion.div>
        )}

        {/* No Results State */}
        {hasSearched && !isLoading && !companyData && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mt-12"
          >
            <div className="glass-card inline-block p-8">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">
                データが見つかりません
              </h3>
              <p className="text-gray-400 text-sm">
                入力された企業名に該当するデータがありません。
                <br />
                別の企業名をお試しください。
              </p>
            </div>
          </motion.div>
        )}

        {/* Initial State */}
        {!hasSearched && !companyData && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-16"
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-8xl mb-6"
            >
              🏢
            </motion.div>
            <h2 className="text-2xl font-bold gradient-text mb-3">
              企業の不動産データを分析
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              上の検索バーに企業名を入力して、
              <br />
              賃貸等不動産の含み損益情報を確認しましょう。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-4">
          <span>Powered by EDINET & Gemini AI</span>
          <span className="text-[var(--neon-cyan)]">|</span>
          <span>© 2025 Antigravity Dashboard</span>
        </div>
      </footer>
    </main>
  );
}
