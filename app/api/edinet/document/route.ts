import { NextRequest, NextResponse } from "next/server";

// EDINET API V2 エンドポイント（認証不要）
const EDINET_API_BASE = "https://disclosure.edinet-fsa.go.jp/api/v2";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const docId = searchParams.get("docId");

    if (!docId) {
        return NextResponse.json(
            { error: "書類IDが指定されていません" },
            { status: 400 }
        );
    }

    try {
        // 財務データ（CSV形式）を取得して解析
        const realEstateData = await extractRealEstateFromCSV(docId);

        return NextResponse.json(realEstateData);
    } catch (error) {
        console.error("EDINET document fetch error:", error);
        return NextResponse.json(
            { error: "書類の取得に失敗しました", details: String(error) },
            { status: 500 }
        );
    }
}

// CSVデータから賃貸等不動産データを抽出
async function extractRealEstateFromCSV(docId: string): Promise<{
    bookValue: number | null;
    marketValue: number | null;
    unrealizedGain: number | null;
    properties: Array<{
        id: string;
        name: string;
        location: string;
        bookValue: number;
        marketValue: number;
    }>;
    rawDataAvailable: boolean;
    message: string;
    companyName?: string;
}> {
    // type=5: CSV形式のデータ
    const url = `${EDINET_API_BASE}/documents/${docId}?type=5`;

    console.log(`Fetching document CSV: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        // CSVがない場合はXBRLを試す
        return await extractFromXBRL(docId);
    }

    const csvText = await response.text();

    // CSVから賃貸等不動産関連のデータを検索
    const lines = csvText.split("\n");

    let bookValue: number | null = null;
    let marketValue: number | null = null;
    let companyName: string | undefined;

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // 会社名を抽出
        if (line.includes("提出者") || line.includes("会社名")) {
            const parts = line.split(",");
            if (parts.length > 1) {
                companyName = parts[1]?.replace(/"/g, "").trim();
            }
        }

        // 賃貸等不動産関連のキーワードを検索
        if (
            line.includes("賃貸等不動産") ||
            line.includes("RentalRealEstate") ||
            line.includes("投資不動産") ||
            lowerLine.includes("rental") && lowerLine.includes("real") && lowerLine.includes("estate")
        ) {
            // 数値を抽出
            const numbers = line.match(/[\d,]+/g);
            if (numbers && numbers.length >= 1) {
                const value = parseInt(numbers[0].replace(/,/g, ""), 10);
                if (!isNaN(value)) {
                    if (line.includes("帳簿") || line.includes("簿価") || lowerLine.includes("book")) {
                        bookValue = value / 1000000; // 円→百万円
                    } else if (line.includes("時価") || line.includes("公正") || lowerLine.includes("fair") || lowerLine.includes("market")) {
                        marketValue = value / 1000000;
                    }
                }
            }
        }
    }

    // 含み損益を計算
    const unrealizedGain =
        bookValue !== null && marketValue !== null
            ? marketValue - bookValue
            : null;

    const hasData = bookValue !== null || marketValue !== null;

    return {
        bookValue,
        marketValue,
        unrealizedGain,
        properties: [], // 物件詳細は別途解析が必要
        rawDataAvailable: hasData,
        companyName,
        message: hasData
            ? "賃貸等不動産データを取得しました"
            : "この企業の有価証券報告書には賃貸等不動産の数値データが見つかりませんでした。注記情報を確認してください。",
    };
}

// XBRLからデータを抽出（フォールバック）
async function extractFromXBRL(docId: string): Promise<{
    bookValue: number | null;
    marketValue: number | null;
    unrealizedGain: number | null;
    properties: Array<{
        id: string;
        name: string;
        location: string;
        bookValue: number;
        marketValue: number;
    }>;
    rawDataAvailable: boolean;
    message: string;
}> {
    // type=1: XBRL形式（ZIP）
    // 簡易実装：ZIPの解凍は複雑なので、ここではCSVのみ対応

    return {
        bookValue: null,
        marketValue: null,
        unrealizedGain: null,
        properties: [],
        rawDataAvailable: false,
        message: "この書類のCSVデータが取得できませんでした。XBRL解析機能は今後実装予定です。",
    };
}
