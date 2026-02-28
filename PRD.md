## 📝 詳細実装仕様書：Private Config Registry

### 1. プロジェクトの概要

GitHub Enterprise (GHE) の Private Pages を利用して、AIエージェント用の設定ファイル（.claude, .cursorrules, .github/workflows 等）を `shadcn/ui` ライクな CLI 体験で配布・導入できる「社内用プライベートレジストリ」を構築したい。

### 2. 技術スタック

* **言語:** TypeScript (Node.js)
* **配信形式:** shadcn Registry JSON Schema (v1)
* **ホスティング:** GitHub Enterprise Private Pages
* **CI/CD:** GitHub Actions

### 1. ディレクトリ構造の厳密な定義

エージェントには以下の構造を前提にコードを書かせてください。

```text
.
├── registry/              # 管理単位（この名前が `shadcn add [name]` の名前になる）
│   ├── ai-coding-set/     # 例：Claude/Cursorの基本セット
│   │   ├── meta.json      # パッケージのメタデータ（説明、依存npm、配置先等）
│   │   ├── .claude.json
│   │   └── CLAUDE.md
│   └── github-workflow/   # 例：社内標準CI設定
│       ├── meta.json
│       └── node-ci.yml
├── scripts/
│   └── build.ts           # ビルドロジック
├── public/r/              # デプロイ用（自動生成）
│   ├── index.json         # 目次
│   ├── ai-coding-set.json # registry/ai-coding-set の内容を1つに固めたもの
│   └── github-workflow.json
└── package.json

```

---

### 2. `meta.json` の導入（柔軟な配置のため）

ファイルごとに配置先（target）を変える必要があるため、各フォルダに `meta.json` を置く仕様にします。

**例：`registry/ai-coding-set/meta.json**`

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

---

### 3. ビルドスクリプト (`build.ts`) のアルゴリズム

エージェントに対し、以下のロジックで実装するよう指示してください。

1. **スキャン:** `registry/` 以下の各ディレクトリをループ。
2. **型定義:** `shadcn` の `RegistryItem` 型（以下）に準拠させる。
* `name`: ディレクトリ名
* `type`: `"registry:file"`
* `files`: `meta.json` で定義された各ファイルを読み込み、`content` フィールドに中身を文字列として注入。


3. **パス変換:**
* `target` が指定されていればそれを使用。
* 無ければプロジェクトルートに配置。


4. **index.json の作成:**
* 全ての `RegistryItem` から `files` の中身（content）を除いた軽量なリストを作成。これが `add` 時の選択リストになる。



---

### 4. GHE Private Pages 対策の「実行用ドキュメント」

GHEのPrivate Pagesは、`curl` や `npx` から叩く際に認証（404エラー）が壁になります。これを突破するための手順を `README.md` に含ませます。

* **方法A（推奨）:** `components.json` の `registries` にトークン付きURLを一時的に入れる（または `~/.netrc` にGHEの認証情報を置く）。
* **方法B（シンプル）:** プロジェクト側で一時的に環境変数を渡す。
```bash
# GHEのPersonal Access Tokenを使用してaddを実行
export GITHUB_TOKEN=your_pat
npx shadcn@latest add https://pages.your-company.com/r/index.json

```



---

### 5. GitHub Actions の詳細

`gh-pages` ブランチへ `public/` のみをデプロイする定義を生成させます。

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install && npm run build # build.tsを実行
      - name: Deploy to Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public

```

---

### コーディングエージェントへの最終指示（コピー用）

> **Instructions for Implementation:**
> 1. Create a TypeScript build script that converts a local directory of config files into a shadcn-compatible registry (JSON format).
> 2. Each subdirectory in `/registry` should be treated as a single "component".
> 3. Use a `meta.json` in each subdirectory to define the destination (`target`) of each file.
> 4. Generate an `index.json` containing all components (metadata only) to enable interactive selection via `npx shadcn add`.
> 5. The script should output all JSON files to `/public/r/`.
> 6. Provide a GitHub Actions YAML to deploy the `/public` folder to GitHub Pages.
> 7. Include a brief documentation on how users can authenticate with GHE Private Pages when running the `add` command.
> 
> 
