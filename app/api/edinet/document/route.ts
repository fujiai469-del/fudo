import { NextRequest, NextResponse } from "next/server";

// EDINET API V2 エンドポイント
const EDINET_API_BASE = "https://api.edinet-fsa.go.jp/api/v2";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const docId = searchParams.get("docId");

    if (!docId) {
        return NextResponse.json(
            { error: "書類IDが指定されていません" },
            { status: 400 }
        );
    }

    const apiKey = process.env.EDINET_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "EDINET APIキーが設定されていません" },
            { status: 500 }
        );
    }

    try {
        // XBRLデータを取得
        const xbrlData = await fetchXBRLData(apiKey, docId);

        // 賃貸等不動産関連のデータを抽出
        const realEstateData = extractRealEstateData(xbrlData);

        return NextResponse.json(realEstateData);
    } catch (error) {
        console.error("EDINET document fetch error:", error);
        return NextResponse.json(
            { error: "書類の取得に失敗しました" },
            { status: 500 }
        );
    }
}

// XBRLデータを取得
async function fetchXBRLData(apiKey: string, docId: string): Promise<string> {
    // type=1: 提出本文書及び監査報告書 (ZIP形式)
    // type=5: CSV形式のデータ
    const url = `${EDINET_API_BASE}/documents/${docId}?type=5&Subscription-Key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`EDINET API error: ${response.status}`);
    }

    // CSVデータをテキストとして取得
    const text = await response.text();
    return text;
}

// 賃貸等不動産データを抽出（簡易版）
// 実際にはXBRLパースやPDF解析が必要
function extractRealEstateData(xbrlData: string): {
    bookValue: number | null;
    marketValue: number | null;
    unrealizedGain: number | null;
    properties: Array<{
        name: string;
        location: string;
        bookValue: number;
        marketValue: number;
    }>;
    rawDataAvailable: boolean;
    message: string;
} {
    // XBRLデータから賃貸等不動産を検索
    // 実際の実装では、XBRLタグを解析する必要がある
    // jpcrp_cor:RentalRealEstateBookValueSummary
    // jpcrp_cor:RentalRealEstateMarketValueSummary

    // 簡易的な実装：CSVデータに賃貸等不動産が含まれているか確認
    const hasRentalRealEstateData =
        xbrlData.includes("賃貸等不動産") ||
        xbrlData.includes("RentalRealEstate") ||
        xbrlData.includes("投資不動産");

    if (hasRentalRealEstateData) {
        // TODO: 実際のXBRLパースを実装
        // ここでは構造のみを返す
        return {
            bookValue: null,
            marketValue: null,
            unrealizedGain: null,
            properties: [],
            rawDataAvailable: true,
            message: "賃貸等不動産データが見つかりました。詳細な解析にはGemini AIが必要です。",
        };
    }

    return {
        bookValue: null,
        marketValue: null,
        unrealizedGain: null,
        properties: [],
        rawDataAvailable: false,
        message: "この企業の有価証券報告書には賃貸等不動産の記載がない可能性があります。",
    };
}
