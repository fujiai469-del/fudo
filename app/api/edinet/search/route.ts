import { NextRequest, NextResponse } from "next/server";

// EDINET API V2 エンドポイント
const EDINET_API_BASE = "https://api.edinet-fsa.go.jp/api/v2";

interface EdinetDocument {
    docID: string;
    edinetCode: string;
    secCode: string | null;
    JCN: string | null;
    filerName: string;
    fundCode: string | null;
    ordinanceCode: string;
    formCode: string;
    docTypeCode: string;
    periodStart: string | null;
    periodEnd: string | null;
    submitDateTime: string;
    docDescription: string;
    issuerEdinetCode: string | null;
    subjectEdinetCode: string | null;
    subsidiaryEdinetCode: string | null;
    currentReportReason: string | null;
    parentDocID: string | null;
    opeDateTime: string | null;
    withdrawalStatus: string;
    docInfoEditStatus: string;
    disclosureStatus: string;
    xbrlFlag: string;
    pdfFlag: string;
    attachDocFlag: string;
    englishDocFlag: string;
    csvFlag: string;
    legalStatus: string;
}

interface EdinetResponse {
    metadata: {
        title: string;
        parameter: {
            date: string;
            type: string;
        };
        resultset: {
            count: number;
        };
        processDateTime: string;
        status: string;
        message: string;
    };
    results: EdinetDocument[];
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const companyName = searchParams.get("companyName");
    const date = searchParams.get("date"); // YYYY-MM-DD形式

    if (!companyName) {
        return NextResponse.json(
            { error: "企業名が指定されていません" },
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
        // 指定日または直近の書類を検索
        const searchDate = date || getRecentBusinessDay();

        // 複数日を検索して有価証券報告書を探す
        const documents = await searchDocuments(apiKey, companyName, searchDate);

        if (documents.length === 0) {
            // 日付を遡って検索
            const extendedDocuments = await searchExtendedPeriod(apiKey, companyName);

            if (extendedDocuments.length === 0) {
                return NextResponse.json(
                    {
                        error: "該当する有価証券報告書が見つかりません",
                        hint: "企業名を正確に入力してください（例：トヨタ自動車株式会社）"
                    },
                    { status: 404 }
                );
            }

            return NextResponse.json({ documents: extendedDocuments });
        }

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("EDINET API error:", error);
        return NextResponse.json(
            { error: "EDINETからのデータ取得に失敗しました" },
            { status: 500 }
        );
    }
}

// 直近の営業日を取得
function getRecentBusinessDay(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // 土日の場合は金曜日に戻す
    if (dayOfWeek === 0) {
        today.setDate(today.getDate() - 2);
    } else if (dayOfWeek === 6) {
        today.setDate(today.getDate() - 1);
    }

    return today.toISOString().split("T")[0];
}

// 指定日の書類を検索
async function searchDocuments(
    apiKey: string,
    companyName: string,
    date: string
): Promise<EdinetDocument[]> {
    const url = `${EDINET_API_BASE}/documents.json?date=${date}&type=2&Subscription-Key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`EDINET API error: ${response.status}`);
    }

    const data: EdinetResponse = await response.json();

    // 有価証券報告書（ordinanceCode: 010, formCode: 030000）をフィルタ
    // かつ企業名で部分一致検索
    return data.results.filter((doc) => {
        const isAnnualReport =
            doc.ordinanceCode === "010" &&
            doc.formCode === "030000";
        const matchesCompany = doc.filerName.includes(companyName);

        return isAnnualReport && matchesCompany;
    });
}

// 期間を拡大して検索（過去1年分）
async function searchExtendedPeriod(
    apiKey: string,
    companyName: string
): Promise<EdinetDocument[]> {
    const results: EdinetDocument[] = [];
    const today = new Date();

    // 過去90日間を検索（有価証券報告書は年1回なので十分）
    for (let i = 0; i < 90; i += 7) {
        const searchDate = new Date(today);
        searchDate.setDate(searchDate.getDate() - i);

        // 土日をスキップ
        const dayOfWeek = searchDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = searchDate.toISOString().split("T")[0];

        try {
            const docs = await searchDocuments(apiKey, companyName, dateStr);
            results.push(...docs);

            // 見つかったら早期終了
            if (results.length > 0) break;

            // レート制限対策
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error searching date ${dateStr}:`, error);
        }
    }

    return results;
}
