# AWS Icon Searcher

AWS 公式の **AWS アーキテクチャアイコン** を Raycast から検索して、**PNG**（デフォルト）または **SVG** でコピーできる拡張機能です。

## 特徴

- 🔍 サービス名・リソース名・カテゴリ名で約 870 アイコンをあいまい検索
- 🗂️ グループで絞り込み: Architecture · Service / Resource / Category / Architecture · Group
- 📋 アイコンファイルをクリップボードにコピー — Slack・Figma・Keynote・ドキュメント等にそのまま貼り付け可能
- 🖼️ **デフォルトは PNG**（利用可能な最大解像度。retina `@5x` を含む）
- 🎨 **SVG** と各サイズ（16 / 32 / 48 / 64px …）をアクションパネルから個別に選択可能
- 🌗 リソースアイコンの Light / Dark バリアントに対応

## 前提条件

- [Raycast](https://raycast.com/) 1.26.0 以上
  - 開発モード使用のためサインイン必須
- Node.js 22.14 以上
- npm 7 以上

## インストール（ビルドして Raycast に導入）

### 1. リポジトリを取得

```bash
git clone <このリポジトリの URL>
cd aws-icon
```

### 2. AWS 公式アイコンをダウンロード

1. [AWS アーキテクチャアイコン](https://aws.amazon.com/jp/architecture/icons/) からアイコンパッケージをダウンロード
2. 解凍してできた `Asset-Package_*` という名前のフォルダを、**リポジトリ直下**に配置

> 2026/7/8 時点で配布されている最新の AWS アセットパッケージでのみ動作確認しています。

### 3. 依存関係のインストールとアイコン生成

```bash
npm install
npm run generate-icons
```

`generate-icons` が `Asset-Package_*` を読み取り、`assets/icons/` へアイコンをコピーし、
マニフェスト `src/icons.json` を生成します。

### 4. ビルドして Raycast に追加

```bash
npm run dev
```

Raycast のルート検索に **「Search AWS Icons」** が追加されます。
追加後は、コマンドを停止しても拡張機能は Raycast に残ります。

### 削除方法

Raycast で「Manage Extensions」（拡張機能の管理）を開き、AWS Icons を削除します。

## アクション

| アクション | 説明 |
| --- | --- |
| Copy PNG | 最大サイズの PNG をクリップボードにコピー（デフォルト・⏎） |
| Copy SVG | SVG をクリップボードにコピー |
| Paste PNG | 最前面のアプリに PNG を貼り付け |
| Copy PNG / SVG as Size… | サイズを指定してコピー |
| Copy Icon Name | アイコンの表示名をテキストとしてコピー |
| Show in Finder | 同梱アイコンファイルを Finder で表示 |

## アイコンセットを更新する

新しい AWS アセットパッケージが出たら、上記「インストール」の手順 2〜3 をやり直してください。

なお、今後 AWS 側でパッケージの構成が変更された場合、コードが正しく動作しない可能性があります。

## 注意事項

**本拡張機能は AWS の公式製品ではありません。** アイコンの利用にあたっては、AWS の
  [Architecture Icons の利用条件](https://aws.amazon.com/architecture/icons/)および
  [商標ガイドライン](https://aws.amazon.com/trademark-guidelines/)に従ってください。
