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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // プロンプトを作成
        const prompt = `
あなたは日本の上場企業の財務データに詳しい専門家です。
以下の企業について、賃貸等不動産（投資不動産）に関する情報を調べて、JSON形式で回答してください。

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
      "name": "物件名",
      "location": "所在地",
      "bookValue": 帳簿価額（百万円）,
      "marketValue": 時価（百万円）
    }
  ],
  "fiscalYear": "決算期（例: 2024年3月期）",
  "note": "補足情報（賃貸等不動産を保有していない場合はその旨を記載）"
}

注意:
- 実在する上場企業の公開情報に基づいて回答してください
- 賃貸等不動産の注記がない企業の場合は found: false とし、note に理由を記載してください
- 数値は百万円単位で回答してください
- 物件の詳細がわからない場合は properties を空配列にしてください
`;

        // Gemini API を呼び出し
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

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
            { error: "Gemini APIでエラーが発生しました", details: String(error) },
            { status: 500 }
        );
    }
}
