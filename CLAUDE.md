# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Natural Disaster Viewer (NDV) - Extension。緊急地震速報 (EEW)・地震情報・津波情報・気象警報などをリアルタイムで取得し、横長ティッカー (1080x128) と時計 (128x128) の Canvas に描画・音声報知する Chrome 拡張機能 (Manifest V3)。

- 公式サイト: https://ndv.iaigiri.com/ext/
- v0 リポジトリ: https://github.com/looksky495/ndv-ticker-extension-v0

## v0 からの移行作業中

このリポジトリは v0 系（ビルドツールなしの素の JavaScript + jQuery、`scripts/main.js` 約 4,800 行にロジックが集中、`<script>` の読み込み順に依存）を TypeScript + Vite + wasm 構成へ書き直す**移行作業の途上**にある。作業の基本方針:

- `src/popup/main.ts` が v0 の `main.js` に相当する移行元の巨大ファイル。ここからロジックを `services/`・`ui/tickerView/`・`bootstrap/`・`dictionaries/` などへ切り出していく。
- v0 の静的データファイル群（`data-epicenter.js` など）は `src/popup/dictionaries/` の TS モジュールに移行済み。
- データ取得は v0 の生 `setInterval` から、`services/task-runtime.ts` の `createFetchClient`（ホスト単位のレート制限・キュー制御付き）へ移行中。`services/nhk-quake.ts` が実装例（※v0.7 系で地震情報は NHK から JMA bosai の `services/jma/earthquake.ts` へ置き換えたため、現在 main.ts からは未使用）。`services/polling.ts` (PollingService) は AsyncIterable ベースの別案（仮）。
- URL は v0 同様 `src/popup/config/requestURL.ts` の `RequestURL` に集約する。
- v0 で動いていた挙動（表示・音声・多言語）を壊さないことが最優先。仕様が不明な点は v0 リポジトリのソースおよび v0 側の CLAUDE.md / AGENTS.md を参照する。

### 参照専用ディレクトリ（編集しない）

- `dmdata.jp-main/` — DMDATA.JP 公式ドキュメントリポジトリの同梱コピー。電文仕様の参照用。
- `db/` — 実際の JMA 電文 JSON のフィクスチャ集。テストの検証データとして使用。
- `src-backup-*.bak/` — 移行途中のスナップショット。
- `errors.log` — 実行時に収集したエラーログ。

## コマンド

```bash
npm run build        # wasm → tsc → vite build（dist/ に拡張機能一式を出力）
npm run build:ts     # tsc && vite build のみ（Rust 変更がないとき）
npm run build:wasm   # wasm-pack build src/wasm/rust（要 Rust + wasm-pack）
npm run dev          # vite dev サーバー
npm run test:qt-ajv  # JMA JSON 型のスキーマ検証テスト一式
```

単一テストの実行:

```bash
node --test --import tsx tests/qt/validate-vxse51-ajv.test.ts
```

動作確認は `chrome://extensions` でデベロッパーモードを有効にし、`dist/` を「パッケージ化されていない拡張機能」として読み込む。ツールバーアイコンでポップアップウィンドウ (1280x640) が開く。

CI (`.github/workflows/ci.yml`) は main への push / PR で `npm run build` を実行する（テストは現状コメントアウト）。

## アーキテクチャ

- **manifest.json は存在しない。** マニフェストは `vite.config.ts` 内の `defineManifest`（@crxjs/vite-plugin）で定義。ホスト権限・エントリポイントの追加はここを編集する。
- **エントリポイントは 3 つ**（`vite.config.ts` の rollupOptions.input）:
  - `src/background/index.ts` — Service Worker。ポップアップウィンドウの単一管理と、`chrome.runtime.onMessage` 経由のストレージ読み書き中継のみの薄い層。
  - `src/popup/index.html` + `main.ts` — 本体。Canvas 描画・データ取得・音声すべてがここで動く。
  - `src/disp-commands/index.html` — 表示コマンドのドキュメントページ。
- `src/shared/storage.ts` — `chrome.storage.sync` の型付きアクセス層（`AppConfig`）。background と popup の双方から使う。ストレージは **`chrome.storage.sync` のみ**を使用する。
- `src/popup/bootstrap/` — Canvas・wasm・フォント・音声合成 (VOICEVOX 音声のキュー再生) の初期化。`prototype-extension.ts` は副作用 import。
- `src/popup/services/jma/` — JMA データの `DataOperator`（earthquake / tsunami / typhoon / warning）。津波は同一 EventID の予報 (VTSE41) と観測 (VTSE51) を統合する特殊処理がある。
- `src/popup/ui/tickerView/` — 情報種別ごとの Canvas 描画（eew / quake / tsunami / news / normal）。`ui/trafficTracker.ts` が各ソースの取得時刻を管理・表示する。
- `src/wasm/rust/` — 地図ズーム計算などの `eewcalc` クレート。wasm-pack が `pkg/` に出力し、`bootstrap/init-wasm.ts` が読み込む。
- `src/types/jma-json/qt/` — JMA bosai JSON（VXSE51/52/53/61/62, VTSE41/51 など）の手書き型定義。`tests/qt/` はこの型から ts-json-schema-generator で JSON Schema を生成し、`db/` の実データに対して Ajv で検証する。型定義を変えたらこのテストで裏を取る。

## 規約・注意点

- TypeScript は strict。`moduleResolution: nodenext` + `allowImportingTsExtensions` のため、**import には `.ts` 拡張子を明記**する。`erasableSyntaxOnly` 有効（enum 等は使わない）。
- コメント・UI 文言は日本語。既存のスタイルに合わせる。
- リリース前の確認事項が `src/popup/main.ts` 冒頭のコメントに列挙されている（バージョン更新・`SpeechVersionData` など）。バージョン表記は `main.ts` の `AppVersionCode` / `AppVersionView` と `vite.config.ts` の manifest version に分散しているので更新時は揃えること。
- 会話は日本語で、建設的な議論を意識すること。

### コーディングスタイル

- 可読性を最優先する。人が読むことを考慮した命名・コメント・構造にする。
- インデントはスペース 2 つ、文字列はダブルクォート。
- 1 文 1 行。`var` は使わず `let` / `const`。関数はなるべくアロー関数。
- スペースの入れ方: `() => {`、`if (condition) {` のようにキーワード・矢印・ブロック開始の前後に半角スペースを入れる。
- 制御構文は原則ブロック `{}` を使う（内容が 1 文のときのみ省略可）。`switch` はなるべく使わず `if` にする。
- `if (!x) return;` の早期リターンスタイルを使う。
- 変数名は用途が分かる名前にする（ループ変数を除く）。イベントハンドラの引数名は `e` ではなく `event`。
- 文字列へのキャストは `String()` ではなく `x + ""` を使う（パイプライン演算子がない中で後置で読めるようにするため）。数値へのキャストは `x - 0` が TypeScript では型エラーになるため `Number()` を使う。配列末尾は `.at(-1)`。
- DOM 操作: なるべく `innerHTML` ではなく `insertAdjacentHTML` を使う。後から JS で操作する要素は `createElement` で作る。イベントは `addEventListener` で登録する。
- 関数には目的と引数の説明を、別のエージェントが読んでも理解できるようにコメントで書く。`.d.ts` には丁寧にコメントをつける。
- モジュールの切り出しは、単体のライブラリを作っている意識で行う（`services/task-runtime.ts` などが手本）。

### エラー処理方針

- フェイルセーフ優先。コンソールにメッセージを出すだけの try-catch はむしろ書かない。エラーは握りつぶさず伝播させ、popup では `main.ts` の `errorCollector`（window の `error` / `unhandledrejection` を収集）に流れるようにする。
- ユーザーに知らせる必要があるエラーには適切なメッセージを表示する。
