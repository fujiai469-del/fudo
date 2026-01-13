# Antigravity - 不動産分析ダッシュボード

企業の賃貸等不動産データを分析し、未来的なインターフェースで可視化するNext.jsダッシュボード。

![Dashboard Preview](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ 特徴

- **🌌 Antigravityテーマ**: 深宇宙背景、グラスモーフィズム、ネオングロー効果
- **🔍 企業検索**: 企業名で賃貸等不動産データを分析
- **📊 メトリックカード**: 帳簿価額、時価、含み損益を可視化
- **🗺️ Google Maps連携**: 物件所在地をダークモードマップで表示
- **🎭 Framer Motion**: フローティングアニメーション

## 🚀 セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_USERNAME/fudo.git
cd fudo
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルをプロジェクトルートに作成：

```env
# Google Maps API Key
# https://console.cloud.google.com/apis/credentials から取得
# "Maps JavaScript API" を有効化してください
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

> **Note**: Google Maps APIキーがなくてもアプリは動作しますが、マップはフォールバック表示になります。

### 4. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📸 スクリーンショット

### 検索画面
深宇宙をイメージしたダークテーマ、ネオングロー効果の検索バー

### ダッシュボード
- 3つのメトリックカード（フローティングアニメーション付き）
- 保有不動産一覧
- Google Maps（ダークモード、ネオンピン）

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| アイコン | Lucide React |
| アニメーション | Framer Motion |
| マップ | @vis.gl/react-google-maps |

## 🎮 デモ

以下の企業名で検索できます：
- `株式会社ナガオカ` - 含み益のある企業
- `サンプル不動産` - 含み損のある企業

## 📝 今後の開発予定

- [ ] EDINET API連携（有価証券報告書の自動取得）
- [ ] Gemini AI連携（賃貸等不動産データの抽出）
- [ ] データベース連携
- [ ] ユーザー認証

## 📄 ライセンス

MIT License
