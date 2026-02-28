# GitHub Copilot Instructions (QAutoGen)

## プロジェクト概要

pnpm workspace モノレポ。見積自動生成 Web アプリケーション。

| Package | Path | Description |
|---|---|---|
| `@qautogen/web` | `apps/web` | React 19 + Vite frontend (BON UI) |
| `@qautogen/api` | `apps/api` | Hono + Prisma backend API |
| `@qautogen/shared` | `apps/shared` | Shared configurations (TypeScript, etc.) |

---

## 共通 Tech Stack

- **Monorepo**: pnpm workspace (`pnpm-workspace.yaml`)
- **Type System**: TypeScript (strict mode)
- **Lint/Format**: Biome（ルート `biome.json` を各パッケージが extends）
- **Commits**: Conventional Commits (`type(scope): subject`)

> FE 固有の情報は `.github/instructions/fe.instructions.md` を参照。
> BE 固有の情報は `.github/instructions/be.instructions.md` を参照。

---

## Instructions（ベストプラクティス）

以下の instructions（`.github/instructions/`）が `applyTo` glob パターンにより自動ロードされる:

| Instruction | ファイル | applyTo | 適用対象 |
|---|---|---|---|
| TypeScript | `typescript.instructions.md` | `**/*.{ts,tsx}` | FE / BE 共通 |
| React | `react.instructions.md` | `apps/web/**/*.{ts,tsx}` | FE |
| Hono | `hono.instructions.md` | `apps/api/**/*.ts` | BE |
| Tailwind CSS | `tailwindcss.instructions.md` | `apps/web/**/*.{ts,tsx}` | FE |
| BON UI | `bon-ui.instructions.md` | `apps/web/**/*.{ts,tsx}` | FE |
| UIUX | `uiux.instructions.md` | `apps/web/**/*.{ts,tsx}` | FE |
| Zod | `zod.instructions.md` | `**/*.{ts,tsx}` | FE / BE 共通 |
| TDD | `tdd.instructions.md` | `**/*.test.{ts,tsx}` | テストファイル |
| Playwright | `playwright.instructions.md` | `apps/web/playwright/**` | FE テスト |

---

## Agents（スペシャリストエージェント）

`.github/agents/` にある各エージェントは専門領域の自律的なワークフローを担当する:

| Agent | ファイル | 用途 |
|---|---|---|
| orchestrator | `orchestrator.agent.md` | 開発ワークフロー全体の進行管理 |
| implement | `implement.agent.md` | TDD に基づくコード実装 |
| code-review | `code-review.agent.md` | コード品質・設計・セキュリティのレビュー |
| qa | `qa.agent.md` | 自動テストでカバーできない動作確認 |
| security | `security.agent.md` | 脆弱性検査・ペネトレーションテスト |
| a11y | `a11y.agent.md` | WCAG 2.1 AA アクセシビリティ検査 |
| uiux | `uiux.agent.md` | UI/UX 分析・改善提案・デザインレビュー |
| issue | `issue.agent.md` | GitHub Issue の作成・管理 |

---

## 共通コーディング原則

### 型安全

- `any` は原則禁止。`unknown` + 型ガードまたは `satisfies` を使う。
- `type` エイリアスと判別共用体を優先する。
- API レスポンス型は Zod スキーマから `z.infer` で導出する。

### import / export

- Biome の import 順序ルール（builtin → external → internal → relative）に従う。
- 名前付き export を優先する。
- 型のみの import には `import type` を使う。

### コメント

- 簡潔で目的のあるコメントを書く。自明なコードにコメントは不要。
- コメントは英語で記述する。

### ファイル命名

- TypeScript ファイル: kebab-case（例: `product.service.ts`）
- React コンポーネント: PascalCase ディレクトリ + `index.tsx`（例: `ProductCard/index.tsx`）
- テスト: `<module>.test.ts`（同ディレクトリに co-locate）

---

## 開発コマンド

```bash
# 全パッケージ共通
pnpm check             # Biome lint + TypeScript typecheck（全パッケージ）
pnpm install           # 依存インストール

# 個別パッケージ操作
pnpm -F web dev        # フロントエンド開発サーバー
pnpm -F api dev        # バックエンド開発サーバー
pnpm -F web storybook  # Storybook 起動
pnpm -F web test:vrt   # Playwright VRT 実行
pnpm -F api test       # Vitest 実行
```

---

## Pull Request チェックリスト

1. `pnpm check` が成功すること（Biome lint + TypeScript typecheck）。
2. UI 変更がある場合は Playwright スクリーンショットを更新/記録する。
3. 新規コンポーネントには Storybook story を追加する。
4. 環境変数やスクリプトの変更は README に記載する。

## Conventional Commits

- すべてのコミットは Conventional Commits 形式 (`type(scope): subject`)。

---

## Reference Docs for AI

- `.github/docs/ai-dev-notes.md`: モノレポ構成、フォルダ構成、wizard hooks の責務など、作業前に参照すべき開発メモ。
- `.github/instructions/fe.instructions.md`: フロントエンド固有のガイドライン。
- `.github/instructions/be.instructions.md`: バックエンド固有のガイドライン。
