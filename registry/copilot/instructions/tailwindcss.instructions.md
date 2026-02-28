---
applyTo: "apps/web/**/*.{ts,tsx}"
---

# Tailwind CSS 開発ベストプラクティス

## BON UI テーマトークンの使用

### トークン優先

ハードコードした色・角丸・シャドウ値ではなく、BON UI テーマトークン（`bon-*`）を使用する。

```tsx
// ✅ BON UI トークンを使用
<div className="bg-bon-dark-blue-500 text-white rounded-bon-12">

// ❌ ハードコード値
<div className="bg-[#1B2A4A] text-white rounded-[12px]">
```

### テーマトークンの参照先

- CSS 変数定義: `apps/web/src/styles/bon-ui-tokens.css`
- Tailwind ユーティリティ化: `apps/web/src/styles/bon-ui-theme.css`
- JSON トークン: `apps/web/design/bon-ui-theme-tokens.json`
- パターンガイド: `.github/docs/frontend/bon-ui-patterns.md`

JS/TS 内でトークン値が必要な場合のみ `@/theme/bon-tokens` から import する。

## カラーの使い分け

| 用途 | クラス |
|---|---|
| ページ背景 | `bg-bon-light-gray-100/200` |
| カードサーフェス | `bg-white`, `bg-white/70`, `bg-bon-light-blue-50` |
| プライマリ CTA | `bg-bon-dark-blue-500 text-white` |
| セカンダリ CTA | `bg-white border-bon-light-gray-300 text-bon-dark-gray-900` |
| ゴーストボタン | `text-bon-dark-blue-600 hover:bg-bon-light-blue-100` |
| 境界線 | `border-bon-light-gray-200`, `border-bon-dark-blue-200` |
| ラベル・メタ | `text-bon-dark-gray-500`, `text-bon-dark-gray-600` |
| 数値・価格 | `text-bon-dark-blue-600 font-bold` |
| エラー | `bg-bon-light-red-200 text-bon-dark-red-600` |
| 成功 | `bg-bon-light-green-200 text-bon-dark-green-600` |
| 警告 | `bg-bon-light-orange-200 text-bon-dark-orange-600` |

## レスポンシブデザイン

### モバイルファースト

```tsx
// ✅ モバイルファーストで記述
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

// ❌ デスクトップファーストは避ける
<div className="grid grid-cols-3 sm:grid-cols-1">
```

### ブレークポイント

| プレフィックス | 画面幅 | 用途 |
|---|---|---|
| (なし) | 0px〜 | モバイル |
| `md:` | 768px〜 | タブレット |
| `lg:` | 1024px〜 | デスクトップ |

## スペーシング規約

- ページ余白: `px-4 py-10`（モバイル）、`max-w-6xl mx-auto`（デスクトップ）
- セクション間隔: `space-y-6`（フォーム）、`gap-6`（グリッド）
- カード内余白: `px-6 pb-6 pt-6`（CardHeader + CardContent）
- ボタン群間隔: `gap-bon-24`（24px）

## コンポーネントごとのパターン

### ボタン

```tsx
// プライマリ
<button className="bg-bon-dark-blue-500 text-white rounded-full h-11 px-6 
  hover:bg-bon-dark-blue-600 
  focus-visible:ring-2 focus-visible:ring-bon-dark-blue-500 focus-visible:ring-offset-2">

// セカンダリ
<button className="bg-white border border-bon-light-gray-300 text-bon-dark-gray-900 
  rounded-full h-11 px-6 hover:bg-bon-light-gray-100">
```

### カード

```tsx
<div className="rounded-3xl border border-bon-light-gray-200 bg-white 
  shadow-[0_20px_45px_rgba(23,36,59,0.08)]">
```

### フォーム要素

```tsx
<input className="rounded-2xl border-bon-light-gray-300 bg-white shadow-inner" />
<label className="text-sm font-medium text-bon-dark-gray-700">Label</label>
```

### スケルトン

```tsx
<div className="animate-pulse bg-bon-light-gray-200 rounded-xl h-20" />
```

## インタラクションステート

| ステート | ルール |
|---|---|
| Hover | `hover:border-bon-dark-blue-200`、`hover:bg-bon-light-blue-100` |
| Focus | `focus-visible:ring-2 focus-visible:ring-bon-dark-blue-500 focus-visible:ring-offset-2` |
| Disabled | `opacity-60 pointer-events-none` |
| Selected | `border-bon-dark-blue-500 bg-white shadow-lg` |
| Active | `active:translate-y-0.5`（オプション） |

## className の記述順序

1. レイアウト（`flex`, `grid`, `block`）
2. サイズ（`w-`, `h-`, `max-w-`）
3. スペーシング（`p-`, `m-`, `gap-`）
4. タイポグラフィ（`text-`, `font-`, `leading-`）
5. 背景・ボーダー（`bg-`, `border-`, `rounded-`）
6. エフェクト（`shadow-`, `opacity-`）
7. インタラクション（`hover:`, `focus:`, `active:`）

## ダークモード

BON UI テーマが自動適用するため、`dark:` 接頭辞は原則不要。

## アンチパターン

- `@apply` の多用は避ける。Tailwind のユーティリティを直接使用する。
- 同じクラスの組み合わせが 3 箇所以上で繰り返される場合は、React コンポーネントとして抽出する（CSS の抽象化ではなく、コンポーネントの抽象化を行う）。
- `!important` は使わない。特異度の問題はクラスの順序やコンポーネント分割で解決する。
