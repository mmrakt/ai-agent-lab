# Private Config Registry

AIエージェント用の設定ファイル（`.claude.json`, `CLAUDE.md`, `.github/copilot-instructions.md` 等）を CLI 体験で社内配布するためのプライベートレジストリです。

## 🏗 構成

```text
.
├── registry/              # 各設定パッケージ
│   ├── claude/            # Claude Code の設定ファイル
│   │   ├── meta.json
│   │   ├── .claude.json
│   │   └── CLAUDE.md
│   └── copilot/           # GitHub Copilot の設定ファイル
│       ├── meta.json
│       └── .github/
│           ├── copilot-instructions.md
│           ├── instructions/
│           ├── agents/
│           ├── prompts/
│           └── ...
├── scripts/
│   └── build.ts           # ビルドスクリプト
├── public/r/              # デプロイ用（自動生成）
│   ├── index.json
│   ├── claude.json
│   └── copilot.json
└── package.json
```

## 🚀 使い方

### レジストリからプロジェクトに設定を追加する

```bash
# Claude Code の設定を追加
npx shadcn@latest add https://pages.your-company.com/r/claude.json

# GitHub Copilot の設定を追加
npx shadcn@latest add https://pages.your-company.com/r/copilot.json
```

### GHE Private Pages での認証

GHE の Private Pages は認証が必要です。以下のいずれかの方法で認証してください。

#### 方法A（推奨）: `~/.netrc` にGHE認証情報を設定

```text
machine pages.your-company.com
login your-username
password your-personal-access-token
```

#### 方法B: 環境変数で PAT を渡す

```bash
export GITHUB_TOKEN=your_pat
npx shadcn@latest add https://pages.your-company.com/r/claude.json
```

#### 方法C: `components.json` の registries にトークン付き URL を設定

```json
{
  "registries": {
    "private": {
      "url": "https://pages.your-company.com/r",
      "headers": {
        "Authorization": "token YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

## 🛠 開発

### セットアップ

```bash
pnpm install
```

### ビルド

```bash
pnpm run build
```

`public/r/` 以下に Registry JSON Schema 準拠の JSON ファイルが生成されます。

### 新しい設定パッケージを追加する

1. `registry/` 以下に新しいディレクトリを作成
2. `meta.json` を作成して、ファイルの説明と配置先を定義
3. 配布したいファイルを同じディレクトリに配置
4. `pnpm run build` でビルド

#### `meta.json` の例

```json
{
  "description": "Standard AI coding rules for the team",
  "dependencies": [],
  "files": [
    { "name": ".claude.json", "target": ".claude.json" },
    { "name": "CLAUDE.md", "target": "CLAUDE.md" }
  ]
}
```

- **`name`**: ディレクトリ内のファイル名
- **`target`**: プロジェクトルートからの配置先パス

## 📦 デプロイ

`main` ブランチへの push 時に GitHub Actions が自動で `public/` を GitHub Pages にデプロイします。

手動デプロイも可能です（Actions の workflow_dispatch）。

## ⚙️ 技術スタック

- **TypeScript** (Node.js)
- **Registry JSON Schema v1** 準拠
- **GitHub Enterprise Private Pages** でホスティング
- **GitHub Actions** で CI/CD
