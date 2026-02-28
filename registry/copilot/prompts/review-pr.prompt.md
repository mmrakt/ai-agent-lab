---
description: "GitHub PR をコードレビューエージェントの手順に沿ってレビューする"
agent: "code-review"
tools: ["execute/runInTerminal", "search/codebase", "web/githubRepo", "github/pull_request_read", "github/pull_request_review_write"]
---

# PR レビューを実行する

`.github/agents/code-review.agent.md` の **モード A: PR レビュー（GitHub MCP 経由）** に従い、指定された PR をレビューしてください。

## 入力

ユーザーが PR 番号を指定する（例: `#2 をレビューして`）。番号が未指定の場合は確認を取る。

## 実行手順

エージェント定義の「レビュー手順」および「モード A」のフローに **厳密に** 従うこと。要約すると:

1. `pull_request_read (get)` で PR メタデータを取得する。
2. `pull_request_read (get_diff)` と `pull_request_read (get_files)` で差分を取得する。
3. 変更が `apps/api` か `apps/web` かを判別し、該当するリファレンスドキュメントを読み込む。
4. diff だけで判断せず、**ワークスペースの実ファイル**（スキーマ・型定義・呼び出し元）を読んで文脈を把握する。
5. エージェント定義の全レビュー観点（アーキテクチャ〜パフォーマンス）に沿ってチェックする。
6. `pnpm check` を実行し、lint / typecheck 違反がないか確認する。
7. `pull_request_review_write (create)` で pending review を作成する。
8. 各指摘を `add_comment_to_pending_review` でインラインコメントとして追加する（`🔴 C-N` / `🟡 W-N` / `🟢 S-N` 形式）。
9. `pull_request_review_write (submit_pending)` でサマリ本文とともに submit する。event は Critical があれば `REQUEST_CHANGES`、なければ `COMMENT`。

## 注意事項

- コメント形式・サマリフォーマットは `.github/agents/code-review.agent.md` の定義に従うこと。
- 修正案は具体的なコードスニペットを必ず含める。
- YAGNI を意識し、「今」修正すべきか「将来」の課題かを区別する。
- 自分自身の PR の場合は `REQUEST_CHANGES` が使えないため `COMMENT` で submit する。
