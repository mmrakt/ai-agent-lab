---
description: "変更差分を適切な粒度に分割して git commit する"
agent: "agent"
tools: [execute/runInTerminal, "search/changes", search/codebase]
argument-hint: "差分範囲を指定: session（セッション内のみ・デフォルト）または all（全ての未コミット差分）"
---

# 変更を分割して git commit する

あなたは QAutoGen プロジェクトのコミット担当者です。
変更差分を分析し、論理的な単位に分割して Conventional Commits 形式でコミットしてください。

## 手順

1. 差分範囲に応じて変更を取得する。
   - 引数が `session` または未指定の場合:
     - **`search/changes` ツール（セッション内変更）のみを使用する。**
     - `search/changes` が利用できない場合は、**代替ツールを使用せずに「`changes` ツールが利用できないため処理を中断します。`all` モードで再実行するか、変更ファイルを明示してください。」とユーザーに報告して中断する。**
     - `git status`・`git diff`・`get_changed_files` ツールは絶対に使用しない（セッション外の変更を誤って取り込むリスクがある）。
     - セッション外の変更は存在しないものとして扱う。
   - 引数が `all` の場合: `git status` と `git diff` で全ての未コミット差分を確認する。
2. 変更内容を **論理的な単位** に分割する（何を変えたか・なぜ変えたかが 1 コミットで説明できる粒度）。
3. `pnpm check` を実行して lint・typecheck が通ることを確認する。失敗した場合は修正してから次に進む。
4. 各コミット単位ごとに以下を実行する。
   - `git add <対象ファイル>` で対象ファイルのみをステージングする（`git add .` や `git add -A` は使用しない）。
   - `git commit -m "<type>(scope): <subject>"` でコミットする。
5. 全コミット完了後に `git log --oneline -10` で結果を確認する。

## Conventional Commits 規約

フォーマット: `type(scope): subject`

### type

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | 機能変更を伴わないリファクタリング |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（フォーマット等） |
| `chore` | ビルドプロセス・補助ツールの変更 |
| `ci` | CI 設定の変更 |
| `build` | ビルドシステム・外部依存の変更 |
| `revert` | 過去のコミットの取り消し |

### scope（省略可）

`web`, `api`, `shared`, `wizard`, `admin-products`, `db`, `ci`, `deps` など変更対象のパッケージ・領域を指定する。

### subject

- 英語で記述する。
- 命令形・現在形で書く（例: `add`, `fix`, `update`）。
- 文末にピリオドを付けない。
- 50 文字以内を目安にする。

## ルール

- 1 コミットに複数の責務を混ぜない（例: `feat` と `fix` を同一コミットに含めない）。
- `pnpm check` が失敗する状態でコミットしない。
- **`session` モード時は `search/changes` ツール以外で差分を取得することを禁止する。**
  - 禁止ツール・コマンド: `get_changed_files`・`git status`・`git diff`・`git diff --cached`
  - 理由: これらはセッション外の変更も含むため、意図しないファイルをコミットするリスクがある。
  - `search/changes` が利用できない場合は **代替を探さずユーザーに報告して中断する**。
- **`git add .` や `git add -A` は禁止。必ず対象ファイルを明示的に指定する。**
