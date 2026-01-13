import { NextRequest, NextResponse } from "next/server";

// EDINET API V2 エンドポイント（認証不要）
const EDINET_API_BASE = "https://disclosure.edinet-fsa.go.jp/api/v2";

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

    if (!companyName) {
        return NextResponse.json(
            { error: "企業名が指定されていません" },
            { status: 400 }
        );
    }

    try {
        // 複数日を検索して有価証券報告書を探す
        const documents = await searchExtendedPeriod(companyName);

        if (documents.length === 0) {
            return NextResponse.json(
                {
                    error: "該当する有価証券報告書が見つかりません",
                    hint: "企業名を正確に入力してください（例：トヨタ自動車株式会社）"
                },
                { status: 404 }
            );
        }

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("EDINET API error:", error);
        return NextResponse.json(
            { error: "EDINETからのデータ取得に失敗しました", details: String(error) },
            { status: 500 }
        );
    }
}

// 指定日の書類を検索
async function searchDocuments(
    companyName: string,
    date: string
): Promise<EdinetDocument[]> {
    // EDINET API v2 書類一覧API（認証不要）
    const url = `${EDINET_API_BASE}/documents.json?date=${date}&type=2`;

    console.log(`Fetching EDINET: ${url}`);

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        console.error(`EDINET API error: ${response.status} ${response.statusText}`);
        throw new Error(`EDINET API error: ${response.status}`);
    }

    const data: EdinetResponse = await response.json();

    if (!data.results) {
        return [];
    }

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

// 期間を拡大して検索（過去数ヶ月分）
async function searchExtendedPeriod(
    companyName: string
): Promise<EdinetDocument[]> {
    const results: EdinetDocument[] = [];
    const today = new Date();

    // 過去90日間を週単位で検索（有価証券報告書は年1回なので）
    for (let i = 0; i < 90; i += 7) {
        const searchDate = new Date(today);
        searchDate.setDate(searchDate.getDate() - i);

        // 土日をスキップ
        const dayOfWeek = searchDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = searchDate.toISOString().split("T")[0];

        try {
            const docs = await searchDocuments(companyName, dateStr);
            results.push(...docs);

            // 見つかったら早期終了
            if (results.length > 0) break;

            // レート制限対策（100ms待機）
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Error searching date ${dateStr}:`, error);
            // エラーでも続行
        }
    }

    // 重複を除去
    const uniqueResults = results.filter(
        (doc, index, self) => index === self.findIndex((d) => d.docID === doc.docID)
    );

    return uniqueResults;
}
