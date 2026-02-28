---
applyTo: "apps/web/**/*.{ts,tsx}"
---

# BON UI デザインシステム

## トークンアーキテクチャ

BON UI は CSS 変数ベースのデザイントークンで構成される。以下のファイルが Single Source of Truth:

| ファイル | 用途 |
|---|---|
| `apps/web/src/styles/bon-ui-tokens.css` | CSS 変数定義（色・角丸・シャドウ等） |
| `apps/web/src/styles/bon-ui-theme.css` | Tailwind v4 へのトークンマッピング |
| `apps/web/design/bon-ui-theme-tokens.json` | AI / スクリプト参照用 JSON |
| `.github/docs/frontend/bon-ui-patterns.md` | デザインパターンの詳細ガイド |

JS/TS 内でトークン値が必要な場合のみ `@/theme/bon-tokens` から import する。

## タイポグラフィ

- **ベースフォント**: `Pretendard`（`apps/web/src/styles/global.css` で適用）。英語は SF Pro フォールバック。
- **見出し**: `text-3xl`〜`text-4xl`（Hero）、`text-2xl`（セクションタイトル）。行間は `leading-tight` / `leading-snug`。
- **本文**: `text-base` を標準。説明文は `text-bon-dark-gray-600` でコントラストを抑える。
- **ラベル / メタ情報**: `text-sm` か `text-xs text-bon-dark-gray-500`。`tracking-wide` で視認性アップ。
- **数値 / 価格**: `text-2xl font-bold text-bon-dark-blue-600`。

## バッジ / ステップインジケーター

- バッジ: `inline-flex items-center rounded-full px-3 py-1` + ステータス色。
- ステップインジケーター: `rounded-2xl border` による 48px 角スクエア + アイコン。幅 48px / `gap-3` を守る。

## ウィザード固有のパターン

- **ステップ見出し**: `StepIndicator` コンポーネントを基準にする。新規ステップ追加時も同じレイアウトを踏襲。
- **選択カード**: 選択中は `border-bon-dark-blue-500 bg-white shadow-lg`、非選択は `border-bon-light-gray-200`。
- **サマリーカード**: `rounded-2xl bg-white/70 p-4` で積み重ね、算出値は `text-bon-dark-gray-900 font-semibold`。
- **数値入力**: `min={1}` + `Math.max(1, numeric)` バリデーション。

## Storybook 連携

- 新規 UI コンポーネントは必ず `.stories.tsx` を同ディレクトリに追加する。
- `title` は `features/<domain>/components/<ComponentName>` の形式。
- BON プリミティブにはリアルなデフォルト値を設定する。
- 決定論的な出力を保つ（`Math.random()` 禁止）。VRT がスナップショットに依存する。
- クリティカルなストーリーは `playwright/vrt.storybook.spec.ts` の `stories` 配列に ID を追加する。

## デザイン原則

- BON UI はマテリアルほどシャドウを多用しない。**色の変化とボーダー強調** でステートを表現する。
- ダークモードは BON UI テーマが自動適用するため、`dark:` 接頭辞は原則不要。
- Loading / Error プレースホルダは BON スケルトン（`animate-pulse bg-bon-light-gray-200`）で統一する。
