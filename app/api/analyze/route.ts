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
あなたは日本の上場企業の財務データに詳しい専門家です。
以下の企業について、直近の決算情報（有価証券報告書や決算短信）に基づき、賃貸等不動産（投資不動産）に関する情報を調べて、JSON形式で回答してください。

企業名: ${companyName}

以下の形式で回答してください（JSONのみ、説明文不要）:
{
  "companyName": "正式な企業名",
  "found": true または false,
  "bookValue": 帳簿価額（百万円単位の数値、不明なら null）,
  "marketValue": 時価（百万円単位の数値、不明なら null）,
  "unrealizedGain": 含み損益（百万円単位の数値、不明なら null）,
  "properties": [
    {
      "id": "1",
      "name": "物件名（代表的なもの）",
      "location": "所在地（都道府県・市区町村レベル）",
      "bookValue": 帳簿価額（百万円、不明なら0）,
      "marketValue": 時価（百万円、不明なら0）
    }
  ],
  "fiscalYear": "決算期（例: 2024年3月期）",
  "note": "補足情報（賃貸等不動産を保有していない場合はその旨を記載）"
}

注意:
- 実在する上場企業の公開情報に基づいて回答してください
- 賃貸等不動産の注記がない企業の場合は found: false とし、note に理由を記載してください
- 数値は百万円単位で回答してください
- もし正確な物件個別の金額がわからない場合は、locationは推測せず、propertiesは空配列にしてください
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
