---
applyTo: "apps/api/**"
---

# Backend Instructions (@qautogen/api)

> 関連 instructions: `typescript` / `hono` / `zod` / `tdd`（`applyTo` glob により自動ロード）

## Tech Stack

- **Framework**: Hono + @hono/node-server
- **ORM**: Prisma (MySQL / MariaDB) + `@prisma/adapter-mariadb`
- **Validation**: Zod v4 + `@hono/zod-validator`
- **Testing**: Vitest
- **Infra**: Docker Compose (MySQL + MinIO)

## ディレクトリ構成

```
apps/api/src/
├── app.ts               # Hono アプリケーション定義 + AppType エクスポート
├── index.ts             # エントリーポイント (@hono/node-server)
├── env.ts               # 環境変数バリデーション (Zod)
├── generated/prisma/    # Prisma Client 生成物（編集禁止）
├── lib/
│   ├── db.ts            # PrismaClient シングルトン
│   ├── errors.ts        # AppError / NotFoundError / ValidationError
│   └── pdf/             # PDF 生成ユーティリティ
├── middleware/
│   └── error-handler.ts # グローバルエラーハンドラ
├── prisma/
│   ├── schema.prisma    # Prisma スキーマ定義
│   ├── seed.ts          # シードデータ
│   └── migrations/      # マイグレーション
├── repositories/        # データアクセス層 (Prisma クエリ)
├── routes/              # HTTP ルートハンドラ
├── schemas/             # Zod スキーマ + 型定義
├── services/            # ビジネスロジック層
└── __testing__/
    └── mock-db.ts       # Prisma Client モック
```

## Prisma 型変換パターン

Service 層で Prisma の行オブジェクトを API レスポンス型に変換する:

- `BigInt` → `string` (`String(row.id)`)
- `Date` → ISO 文字列 (`row.createdAt.toISOString()`)
- `null` → `undefined` (`row.description ?? undefined`)

```typescript
function toProduct(row: PrismaProduct): Product {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description ?? undefined,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

## Prisma 操作

### DB コマンド

```bash
pnpm -F api db:migrate      # マイグレーション実行
pnpm -F api db:generate     # Prisma Client 生成
pnpm -F api db:seed          # シードデータ投入
pnpm -F api db:studio        # Prisma Studio 起動
```

### PrismaClient シングルトン

- `src/lib/db.ts` で `globalThis` にキャッシュし、HMR 時の再生成を防ぐ。
- `@prisma/adapter-mariadb` を使用。

### スキーマ変更時のワークフロー

1. `src/prisma/schema.prisma` を編集
2. `pnpm -F api db:migrate` でマイグレーション作成
3. `pnpm -F api db:generate` で Client 再生成
4. Service の型変換関数を更新
5. 必要に応じて Schema (Zod) を更新

## Docker 開発環境

```bash
docker compose up -d        # MySQL + MinIO 起動
pnpm -F api dev             # 開発サーバー起動
```

- MySQL: `compose.yml` で定義。初期化 SQL は `docker/mysql/init/` に配置。
- MinIO: オブジェクトストレージ（PDF 保存等）。

## セキュリティ考慮事項

- CORS は `hono/cors` ミドルウェアで制御する。
- ユーザー入力は必ず Zod でバリデーションしてから処理する。
- SQL インジェクション対策: Prisma のパラメータバインディングを使用（生 SQL は原則禁止）。
- エラーレスポンスに内部実装の詳細を含めない。

## Reference Docs

- `.github/docs/backend/api-architecture.md`: API レイヤーベース設計の詳細
- `.github/docs/ai-dev-notes.md`: モノレポ構成・開発メモ
