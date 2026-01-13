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
  bookValue: number; // 帳簿価額（百万円）
  marketValue: number; // 時価（百万円）
  unrealizedGain: number; // 含み損益（百万円）
  properties: Property[];
  source: "edinet" | "mock"; // データソース
  docId?: string; // EDINET書類ID
}

interface SearchResult {
  data: CompanyData | null;
  error: string | null;
  edinetAvailable: boolean;
}

// モックデータ（デモ用）
const mockCompanyData: { [key: string]: CompanyData } = {
  "株式会社ナガオカ": {
    companyName: "株式会社ナガオカ",
    bookValue: 2845,
    marketValue: 4210,
    unrealizedGain: 1365,
    source: "mock",
    properties: [
      { id: "1", name: "梅田オフィスビル", location: "大阪府大阪市北区", bookValue: 1200, marketValue: 1850 },
      { id: "2", name: "京都商業施設", location: "京都府京都市", bookValue: 800, marketValue: 1100 },
      { id: "3", name: "神戸倉庫", location: "兵庫県神戸市", bookValue: 450, marketValue: 580 },
      { id: "4", name: "大津レジデンス", location: "滋賀県大津市", bookValue: 395, marketValue: 680 },
    ],
  },
  "サンプル不動産": {
    companyName: "サンプル不動産",
    bookValue: 5200,
    marketValue: 4800,
    unrealizedGain: -400,
    source: "mock",
    properties: [
      { id: "1", name: "新宿オフィスタワー", location: "東京都新宿区", bookValue: 3000, marketValue: 2700 },
      { id: "2", name: "横浜倉庫", location: "神奈川県横浜市", bookValue: 2200, marketValue: 2100 },
    ],
  },
};

// 物件の緯度経度データ（モック）
const propertyLocations: { [key: string]: { lat: number; lng: number }[] } = {
  "株式会社ナガオカ": [
    { lat: 34.7, lng: 135.5 },
    { lat: 35.0, lng: 135.75 },
    { lat: 34.69, lng: 135.2 },
    { lat: 35.0, lng: 135.85 },
  ],
  "サンプル不動産": [
    { lat: 35.69, lng: 139.7 },
    { lat: 35.45, lng: 139.64 },
  ],
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [edinetStatus, setEdinetStatus] = useState<"available" | "unavailable" | "unknown">("unknown");

  // EDINET APIで検索
  const searchWithEdinet = async (companyName: string): Promise<SearchResult> => {
    try {
      const response = await fetch(`/api/edinet/search?companyName=${encodeURIComponent(companyName)}`);
      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data.error || "検索に失敗しました", edinetAvailable: true };
      }

      // 書類が見つかった場合、詳細データを取得
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];

        // 書類の詳細を取得
        const docResponse = await fetch(`/api/edinet/document?docId=${doc.docID}`);
        const docData = await docResponse.json();

        // データがある場合
        if (docData.rawDataAvailable) {
          return {
            data: {
              companyName: doc.filerName,
              bookValue: docData.bookValue || 0,
              marketValue: docData.marketValue || 0,
              unrealizedGain: docData.unrealizedGain || 0,
              properties: docData.properties || [],
              source: "edinet",
              docId: doc.docID,
            },
            error: docData.message,
            edinetAvailable: true,
          };
        }

        return {
          data: null,
          error: `${doc.filerName}の有価証券報告書を発見しましたが、賃貸等不動産データの解析には追加実装が必要です。`,
          edinetAvailable: true,
        };
      }

      return { data: null, error: "該当する有価証券報告書が見つかりませんでした", edinetAvailable: true };
    } catch (error) {
      console.error("EDINET search error:", error);
      return { data: null, error: "EDINET APIへの接続に失敗しました", edinetAvailable: true };
    }
  };

  // 検索実行
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);

    // まずモックデータを確認
    const mockData = mockCompanyData[searchQuery];
    if (mockData) {
      setCompanyData(mockData);
      setEdinetStatus("unknown");
      setSelectedPropertyId(null);
      setIsLoading(false);
      return;
    }

    // モックにない場合はEDINET APIを試行
    const result = await searchWithEdinet(searchQuery);

    setEdinetStatus(result.edinetAvailable ? "available" : "unavailable");

    if (result.data) {
      setCompanyData(result.data);
    } else {
      setCompanyData(null);
      if (result.error) {
        setErrorMessage(result.error);
      }
    }

    setSelectedPropertyId(null);
    setIsLoading(false);
  }, [searchQuery]);

  // マップ用のロケーションデータを生成
  const mapLocations = companyData
    ? companyData.properties.map((prop, index) => {
      const coords = propertyLocations[companyData.companyName]?.[index] || {
        lat: 35.0 + Math.random() * 0.5,
        lng: 135.5 + Math.random() * 0.5,
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
              上場企業名を入力してください（例：トヨタ自動車、ソフトバンク）
            </span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            デモ：「株式会社ナガオカ」「サンプル不動産」
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
                {companyData.source === "edinet" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--neon-cyan)] bg-opacity-20 text-[var(--neon-cyan)]">
                    EDINET
                  </span>
                )}
                {companyData.source === "mock" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--neon-purple)] bg-opacity-20 text-[var(--neon-purple)]">
                    DEMO
                  </span>
                )}
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
            {companyData.properties.length > 0 && (
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
            )}
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
                正式名称で検索してください（例：トヨタ自動車株式会社）
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
              賃貸等不動産の含み損益情報を確認しましょう。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 text-center text-xs text-gray-600">
        <div className="flex items-center justify-center gap-4">
          <span>Powered by EDINET API</span>
          <span className="text-[var(--neon-cyan)]">|</span>
          <span>© 2025 Antigravity Dashboard</span>
        </div>
      </footer>
    </main>
  );
}
