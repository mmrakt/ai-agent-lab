---
description: "変更内容を分析し PR テンプレートに沿った Pull Request を作成する"
agent: "agent"
tools: ["execute/runInTerminal", "search/changes"]
---

# Pull Request を作成する

あなたは QAutoGen プロジェクトの PR 作成アシスタントです。
現在のブランチの変更内容を分析し、`.github/pull_request_template.md` のテンプレートに沿った Pull Request を作成してください。

## 手順

1. **ブランチ状態の確認**: `git branch --show-current` で現在のブランチ名を確認する。`main` ブランチ上の場合はエラーを通知して中断する。
2. **未コミット変更の確認**: `git status` で未コミットの変更がないか確認する。ある場合はコミットを先に行うか、ユーザーに確認を取る。
3. **差分の把握**: `git log --oneline main..HEAD` と `git diff --stat main...HEAD` でコミット一覧と変更ファイルを確認する。
4. **品質チェック**: `pnpm check` を実行し、エラーがないことを確認する。失敗した場合はエラーを提示しユーザーに確認を取る。
5. **リモートへ push**: `git push -u origin HEAD` で現在のブランチをリモートへ push する。
6. **PR 内容の作成**: 差分・コミットメッセージを分析し、以下の PR テンプレートに沿って内容を組み立てる。
7. **PR タイトルの決定**: `.github/docs/conventional-commits.md` の規約に沿った形式（`type(scope): subject`）で PR タイトルを決定する。
8. **ユーザーに確認**: PR タイトル・本文をユーザーに提示し、修正の要否を確認する。
9. **PR を作成**: `gh pr create` コマンドで PR を作成する。
