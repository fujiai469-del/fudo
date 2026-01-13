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

        // プロンプトを作成（IFRS対応を追加）
        const prompt = `
あなたは有能な証券アナリストです。
以下の日本の上場企業について、公開されている直近の**有価証券報告書**を確認し、正確な数値を抽出してください。

確認項目:
1. 日本基準の場合: 【注記事項】の「賃貸等不動産関係」
2. IFRS（国際会計基準）の場合: 【注記事項】の「投資不動産」

企業名: ${companyName}

回答形式（JSONのみ）:
{
  "companyName": "正式な企業名",
  "found": true または false,
  "bookValue": 帳簿価額（百万円単位の数値、不明なら null）,
  "marketValue": 時価（百万円単位の数値、不明なら null、IFRSで公正価値記載の場合はそれを時価とする）,
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

        // モデルリスト（優先度順）
        // ユーザー要望によりバージョンアップ: 2.0-flash -> flash-latest (1.5系)
        const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest"];

        let result;
        let lastError;

        // モデルフォールバックループ
        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // リトライロジック（各モデル内で最大2回）
                for (let i = 0; i < 2; i++) {
                    try {
                        result = await model.generateContent(prompt);
                        break; // 成功したらリトライループを抜ける
                    } catch (error: any) {
                        console.error(`${modelName} attempt ${i + 1} failed:`, error.message);
                        // 503 (Overloaded) or 429 (Quota)
                        if (error.status === 503 || error.status === 429 || error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("quota")) {
                            // 429/Quotaのエラーなら、このモデルは諦めて次のモデルへ（ただし2.0-flashの場合のみ。latestは粘る価値ありだが今回は即次へ）
                            if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("limit")) {
                                throw error; // 次のモデルへ行くためにスロー
                            }
                            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
                            continue;
                        }
                        throw error;
                    }
                }

                if (result) break; // 成功したらモデルループを抜ける

            } catch (error) {
                lastError = error;
                console.warn(`Model ${modelName} failed, trying next...`);
                continue;
            }
        }

        if (!result) {
            throw lastError || new Error("All models failed to generate content");
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
