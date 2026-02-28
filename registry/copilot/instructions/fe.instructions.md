---
applyTo: "apps/web/**"
---

# Frontend Instructions (@qautogen/web)

> 関連 instructions: `typescript` / `react` / `tailwindcss` / `bon-ui` / `playwright`（`applyTo` glob により自動ロード）

## Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 + BON UI デザイントークン
- **State/Data**: React Query（非同期データ） + ローカル state（ウィザード UX）
- **Component Docs**: Storybook (`pnpm --filter @qautogen/web storybook`)
- **Testing**: Playwright（E2E + Visual Regression）

## ディレクトリ構成

```
apps/web/src/
├── app/              # App, providers, router
├── components/ui/    # BON UI プリミティブコンポーネント
├── constants/        # 定数・一時データ
├── features/
│   ├── admin/        # 管理画面
│   └── wizard/       # 見積ウィザード
│       ├── components/<ComponentName>/index.tsx
│       ├── hooks/
│       ├── routes/
│       ├── types.ts
│       └── utils.ts
├── lib/
│   ├── api/          # HTTP クライアント + リソース別モジュール
│   ├── format.ts     # 表示用フォーマッター
│   ├── pdf/          # PDF 生成
│   └── utils.ts      # 汎用ユーティリティ
├── mocks/            # MSW ハンドラ + モックデータ
├── styles/           # BON UI テーマ CSS
└── theme/            # テーマ JS エクスポート
```

## API クライアント

- HTTP クライアント: `src/lib/api/http.ts`
- リソース別モジュール: `src/lib/api/products.ts`, `src/lib/api/quotes.ts`
- re-export: `src/lib/api/client.ts`
- モック利用時: `VITE_USE_MOCK` 環境変数 + `src/constants/temp/`

## Reference Docs

- `.github/docs/frontend/bon-ui-patterns.md`: BON UI レイアウト・コンポーネント・トークン
- `.github/docs/frontend/bon-ui-theme-usage.md`: BON UI テーマの再利用手順
- `.github/docs/frontend/screen-flow.md`: 画面遷移・UX 要件
- `.github/docs/frontend/playwright-best-practices.md`: Playwright ベストプラクティス
