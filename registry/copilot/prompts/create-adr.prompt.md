---
description: "アーキテクチャの意思決定を ADR として文書化し .github/docs/adr/ に配置する"
agent: "agent"
tools: ["execute/runInTerminal", "edit/editFiles"]
---

# ADR (Architecture Decision Record) を作成する

あなたはソフトウェアアーキテクトです。ユーザーの説明を基に、プロジェクトの ADR (Architecture Decision Record) を作成してください。

## プロジェクトコンテキスト

このプロジェクトは **QAutoGen** — pnpm ワークスペースモノレポです。

| パッケージ | パス | 技術スタック |
|---|---|---|
| `@qautogen/web` | `apps/web` | React 19 + Vite + Tailwind CSS v4 (BON UI) |
| `@qautogen/api` | `apps/api` | Hono + Prisma (MySQL) + Zod v4 |
| `@qautogen/shared` | `apps/shared` | 共有 TypeScript プリセット |

## 手順

1. ユーザーが説明する **意思決定の背景・課題** を整理する。
2. 検討した選択肢を列挙し、それぞれの **メリット / デメリット** を簡潔に記述する。
3. 最終的な決定（Decision）と、その **根拠（Rationale）** を明確にする。
4. ADR を以下のテンプレートに従い Markdown で出力する。
5. ファイルを `.github/docs/adr/NNNN-<slug>.md` に配置する。番号は既存の ADR の連番にする（存在しない場合は `0001` から開始）。

## 出力テンプレート

```markdown
# ADR-NNNN: <タイトル>

- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
- **Date**: YYYY-MM-DD
- **Scope**: <影響するパッケージ / 領域（web, api, shared, infra, etc.）>

## Context / 背景

<!-- なぜこの決定が必要になったのか。現在の課題や制約を記述する。 -->

## Decision Drivers / 判断基準

<!-- 意思決定において重要視した観点を箇条書きで。 -->

- ...

## Considered Options / 検討した選択肢

### Option A: <名前>

- **概要**: ...
- **Pros**: ...
- **Cons**: ...

### Option B: <名前>

- **概要**: ...
- **Pros**: ...
- **Cons**: ...

<!-- 必要に応じて Option C 以降を追加 -->

## Decision / 決定

<!-- 選択した Option と、その理由を明確に述べる。 -->

## Consequences / 影響

### Positive

- ...

### Negative

- ...

### Risks

- ...

## References / 参考

- ...
```

## ルール

- **言語**: 日本語をベースとし、技術用語・固有名詞は英語のまま使用。
- **Status** は特に指示がなければ `Proposed` にする。
- **Date** は ADR 作成日（今日の日付）を使う。
- **Scope** はプロジェクトの Conventional Commits scope 指針（`web`, `api`, `shared`, `wizard`, `admin-products`, `db`, `ci`, `deps` 等）に準じる。
- 各セクションは空にせず、最低 1 文以上記述する。
- 既存の ADR ディレクトリ (`.github/docs/adr/`) を確認し、番号が重複しないようにする。
- ファイル名の slug はケバブケース（英語）にする。例: `0001-use-react-query-for-server-state.md`
- 出力後、`.github/docs/adr/README.md` の ADR 一覧テーブルにエントリを追加する。
