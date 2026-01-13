import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "Gemini APIキーが設定されていません" },
            { status: 500 }
        );
    }

    try {
        const { companyName } = await request.json();

        if (!companyName) {
            return NextResponse.json(
                { error: "企業名が指定されていません" },
                { status: 400 }
            );
        }

        // Gemini AI を初期化
        const genAI = new GoogleGenerativeAI(apiKey);
        // 安定版のモデルを使用
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // プロンプトを作成
        const prompt = `
あなたは有能な証券アナリストです。
以下の日本の上場企業について、公開されている直近の**有価証券報告書**の【注記事項】（賃貸等不動産関係）を確認し、正確な数値を抽出してください。

企業名: ${companyName}

回答形式（JSONのみ）:
{
  "companyName": "正式な企業名",
  "found": true または false,
  "bookValue": 帳簿価額（百万円単位の数値、不明なら null）,
  "marketValue": 時価（百万円単位の数値、不明なら null）,
  "unrealizedGain": 含み損益（百万円単位の数値、不明なら null）,
  "properties": [],
  "fiscalYear": "データの対象年度（例: 2024年3月期）",
  "sourceDocument": "データの出典書類名（例: 第100期 有価証券報告書）",
  "note": "分析コメント。データが見つからない場合はその理由。データが正確に見つかった場合は、その旨と簡単な解説。"
}

重要な注意事項:
1. **絶対にハルシネーション（嘘の数字）を書かないでください。** 正確な数字がわからない場合は、適当な数値を入れずに found: false にしてください。
2. 数値は「百万円単位」で正確に記載してください。
3. 日本製鉄などの製造業で、賃貸等不動産の注記がない（重要性が乏しい）場合は、無理に数字を作らず found: false にしてください。
4. 出典（sourceDocument）は必ず具体的に記載してください。
`;

        // Gemini API を呼び出し（リトライ付き）
        let result;
        let lastError;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            try {
                result = await model.generateContent(prompt);
                break;
            } catch (error: any) {
                console.error(`Attempt ${i + 1} failed:`, error);
                lastError = error;
                // 503エラー（Overloaded）の場合は少し待ってリトライ
                if (error.status === 503 || error.message?.includes("503") || error.message?.includes("overloaded")) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // 1s, 2s...
                    continue;
                }
                // その他のエラーは即時スロー
                throw error;
            }
        }

        if (!result) {
            throw lastError || new Error("Failed to generate content after retries");
        }

        const response = await result.response;
        const text = response.text();

        console.log("Gemini Response:", text);

        // JSONを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json(
                { error: "AIからの応答を解析できませんでした", rawText: text },
                { status: 500 }
            );
        }

        const data = JSON.parse(jsonMatch[0]);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json(
            { error: `Gemini API Error: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
