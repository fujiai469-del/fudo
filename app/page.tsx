"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, TrendingUp, BarChart3, Building2, Info, Sparkles } from "lucide-react";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MetricCard from "./components/MetricCard";
import PropertyList from "./components/PropertyList";
import PropertyMap from "./components/PropertyMap";
import LoadingOverlay from "./components/LoadingOverlay";

// データ型定義
interface Property {
  id: string;
  name: string;
  location: string;
  bookValue: number;
  marketValue: number;
}

interface CompanyData {
  companyName: string;
  bookValue: number;
  marketValue: number;
  unrealizedGain: number;
  properties: Property[];
  source: "gemini" | "mock";
  fiscalYear?: string;
  sourceDocument?: string;
  note?: string;
}

// 物件の緯度経度データ（日本の主要都市）
const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  "東京": { lat: 35.6762, lng: 139.6503 },
  "大阪": { lat: 34.6937, lng: 135.5023 },
  "名古屋": { lat: 35.1815, lng: 136.9066 },
  "福岡": { lat: 33.5902, lng: 130.4017 },
  "札幌": { lat: 43.0618, lng: 141.3545 },
  "横浜": { lat: 35.4437, lng: 139.6380 },
  "神戸": { lat: 34.6901, lng: 135.1956 },
  "京都": { lat: 35.0116, lng: 135.7681 },
  "広島": { lat: 34.3853, lng: 132.4553 },
  "仙台": { lat: 38.2682, lng: 140.8694 },
};

function getCoordinatesFromLocation(location: string): { lat: number; lng: number } {
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (location.includes(city)) {
      return { lat: coords.lat + (Math.random() - 0.5) * 0.1, lng: coords.lng + (Math.random() - 0.5) * 0.1 };
    }
  }
  // デフォルトは東京周辺
  return { lat: 35.6762 + (Math.random() - 0.5) * 0.5, lng: 139.6503 + (Math.random() - 0.5) * 0.5 };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Gemini APIで分析
  const analyzeWithGemini = async (companyName: string): Promise<{ data: CompanyData | null; error: string | null }> => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { data: null, error: result.error || "分析に失敗しました" };
      }

      // Geminiからの応答を処理
      if (!result.found) {
        return { data: null, error: result.note || "この企業の賃貸等不動産データが見つかりませんでした" };
      }

      // 含み損益を計算（nullの場合）
      const bookValue = result.bookValue || 0;
      const marketValue = result.marketValue || 0;
      const unrealizedGain = result.unrealizedGain ?? (marketValue - bookValue);

      return {
        data: {
          companyName: result.companyName,
          bookValue,
          marketValue,
          unrealizedGain,
          properties: result.properties || [],
          source: "gemini",
          fiscalYear: result.fiscalYear,
          note: result.note,
        },
        error: null,
      };
    } catch (error) {
      console.error("Gemini API error:", error);
      return { data: null, error: "Gemini AIへの接続に失敗しました" };
    }
  };

  // 検索実行
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);
    setCompanyData(null);

    // Gemini APIで分析
    const result = await analyzeWithGemini(searchQuery);

    if (result.data) {
      setCompanyData(result.data);
    } else {
      setErrorMessage(result.error);
    }

    setSelectedPropertyId(null);
    setIsLoading(false);
  }, [searchQuery]);

  // マップ用のロケーションデータを生成
  const mapLocations = companyData
    ? companyData.properties.map((prop) => {
      const coords = getCoordinatesFromLocation(prop.location);
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
            <Sparkles className="w-3 h-3 text-[var(--neon-purple)]" />
            <span>
              Gemini AIが企業の賃貸等不動産データを分析します
            </span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            例：トヨタ自動車、三菱地所、住友不動産
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
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--neon-purple)] bg-opacity-20 text-[var(--neon-purple)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI
                </span>
              </div>
              {companyData.fiscalYear && (
                <p className="text-sm text-gray-500 mt-2">{companyData.fiscalYear}</p>
              )}
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

            {/* Note & Source */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 text-center"
            >
              {companyData.note && (
                <p className="text-sm text-gray-400 glass-card inline-block px-6 py-3 mb-2">
                  <Info className="w-4 h-4 inline mr-2" />
                  {companyData.note}
                </p>
              )}
              {companyData.sourceDocument && (
                <p className="text-xs text-gray-500 block">
                  出典: {companyData.sourceDocument}
                </p>
              )}
            </motion.div>

            {/* Properties Section - 物件がある場合のみ表示 */}
            {companyData.properties.length > 0 ? (
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PropertyList
                  properties={companyData.properties}
                  onSelectProperty={(prop) => setSelectedPropertyId(prop.id)}
                />
                <PropertyMap
                  locations={mapLocations}
                  selectedId={selectedPropertyId || undefined}
                  onSelectLocation={(loc) => setSelectedPropertyId(loc.id)}
                />
              </section>
            ) : (
              <div className="text-center py-12 glass-card">
                <p className="text-gray-400">
                  詳細な物件リストデータはこの企業の公開情報に含まれていません。<br />
                  （賃貸等不動産の総額のみが開示されています）
                </p>
              </div>
            )}

            <p className="text-[10px] text-gray-600 text-center mt-8 max-w-2xl mx-auto">
              ※本データの分析には生成AIを使用しています。
              有価証券報告書の記載内容と異なる場合や、ハルシネーション（誤った情報の生成）が含まれる可能性があります。
              正確な情報は各公式サイトのIR資料をご確認ください。
            </p>
          </motion.div>
        )}

        {/* No Results / Error State */}
        {hasSearched && !isLoading && !companyData && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mt-12"
          >
            <div className="glass-card inline-block p-8 max-w-md">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">
                データが見つかりません
              </h3>
              <p className="text-gray-400 text-sm">
                {errorMessage || "入力された企業名に該当するデータがありません。"}
              </p>
              <p className="text-gray-500 text-xs mt-3">
                上場企業の正式名称で検索してください
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
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
              Gemini AIで賃貸等不動産の含み損益を分析します。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini AI
          </span>
          <span className="text-[var(--neon-cyan)]">|</span>
          <span>© 2025 Antigravity Dashboard</span>
        </div>
      </footer>
    </main>
  );
}
