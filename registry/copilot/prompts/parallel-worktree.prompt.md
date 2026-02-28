---
description: "git worktree を使って複数タスクを並列作業する"
agent: "agent"
tools: ["execute/runInTerminal", "edit/editFiles", "search/codebase", "search/changes"]
---

# Git Worktree 並列作業

あなたは QAutoGen プロジェクトの開発サポーターです。
`git worktree` を活用し、メインの作業ツリーを汚さずに複数タスクを並列で進める手順を実行してください。

## 手順

### Worktree の作成

1. 現在のブランチと作業状態を確認する（`git status`, `git branch`）。
2. 並列作業用の worktree を作成する。配置先は `../<repo-name>-wt-<branch-short-name>/` とする。
   ```bash
   git worktree add ../<repo-name>-wt-<short-name> -b <branch-name>
   ```
3. 作成した worktree ディレクトリへ移動し、依存関係をインストールする。
   ```bash
   cd ../<repo-name>-wt-<short-name>
   pnpm install
   ```
4. 必要に応じて環境変数ファイル（`.env` 等）をメインツリーからコピーする。

### Worktree での作業

5. worktree 内で通常通りブランチ作業を行う（コミット、ビルド、テスト）。
6. コミットメッセージは `.github/docs/conventional-commits.md` の規約に従うこと。

### 作業完了・統合

7. 作業が完了したら worktree のブランチを push する。
   ```bash
   git push origin <branch-name>
   ```
8. メインツリーに戻り、不要になった worktree を削除する。
   ```bash
   cd <メインツリー>
   git worktree remove ../<repo-name>-wt-<short-name>
   ```
9. `git worktree list` で残存する worktree を確認し、不要なものがないことを確かめる。

## ルール

- **worktree の配置先**: メインリポジトリと同階層（親ディレクトリ直下）に配置する。リポジトリ内部には作成しない。
- **ブランチの重複禁止**: 既にチェックアウト中のブランチで worktree を作成できないため、必ず新規ブランチを指定する。
- **pnpm workspace**: 各 worktree は独立した `node_modules` を持つ。worktree 作成後に `pnpm install` を忘れないこと。
- **Docker リソース共有**: DB（MySQL）や MinIO などの Docker コンテナはポートを共有するため、並列 worktree で同時に `docker compose up` しない。必要な場合はポートを変更するか、既存コンテナを共有する。
- **worktree の放置禁止**: マージ済み・不要になった worktree は速やかに `git worktree remove` で削除する。
