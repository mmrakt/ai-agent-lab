---
applyTo: "apps/api/**/*.ts"
---

# Hono 開発ベストプラクティス

## アプリケーション構成

### ルーティングの書き方

- `new Hono()` でルーターを作成し、メソッドチェーンでルートを登録する。
- 機能ごとにルーターファイルを分割し、`app.route("/", featureRoutes)` で合成する。
- 戻り値の型は `AppType = typeof app` としてエクスポートし、クライアントの型安全を確保する。

```typescript
// routes/products.ts
export const productRoutes = new Hono()
  .get("/products", async (c) => {
    const products = await ProductService.listProducts();
    return c.json({ data: products } satisfies Envelope<Product[]>);
  });

// app.ts
const app = new Hono()
  .use("*", cors())
  .onError(errorHandler)
  .route("/", productRoutes)
  .route("/", quoteRoutes);

export type AppType = typeof app;
```

### レスポンス形式

- すべてのエンドポイントは `Envelope<T>` 型（`{ data: T }`）でレスポンスを返す。
- `satisfies Envelope<T>` で型安全を保証する。
- エラーレスポンスは `{ error: { code: string; message: string } }` 形式で統一する。

## ミドルウェア

### 組み込みミドルウェア

```typescript
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

app.use("*", cors());
app.use("*", logger());       // 開発環境のみ
app.use("*", prettyJSON());   // 開発環境のみ
```

### エラーハンドリングミドルウェア

- `app.onError()` でグローバルエラーハンドラを登録する。
- `AppError` サブクラスを使い、HTTP ステータスコードとエラーコードをマッピングする。
- 予期しないエラーは 500 として返し、詳細をログに出力する。

```typescript
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message } },
      err.status as ContentfulStatusCode,
    );
  }
  console.error("Unhandled error:", err);
  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    500,
  );
};
```

## バリデーション

- リクエストボディ / クエリパラメータのバリデーションには `@hono/zod-validator` を使う。
- `zValidator("json", schema)` / `zValidator("query", schema)` でルートハンドラに直接組み込む。
- バリデーションエラーは自動的に 400 レスポンスになる。

```typescript
import { zValidator } from "@hono/zod-validator";

app.post(
  "/quotes",
  zValidator("json", quoteCreatePayloadSchema),
  async (c) => {
    const payload = c.req.valid("json");
    // payload は型安全
  },
);
```

## レイヤーアーキテクチャ

本プロジェクトでは以下のレイヤー分離を採用する:

```
Route → Service → Repository → Prisma (DB)
```

| レイヤー | 責務 | ファイル命名 |
|---|---|---|
| **Route** | HTTP 関心事（リクエスト解析・レスポンス構築） | `routes/<resource>.ts` |
| **Service** | ビジネスロジック・Prisma 行 → API 型への変換 | `services/<resource>.service.ts` |
| **Repository** | データアクセス（Prisma クエリ） | `repositories/<resource>.repository.ts` |
| **Schema** | Zod スキーマ + 型エクスポート | `schemas/<resource>.ts` |

### 規約

- Route はリクエストの解析と Service の呼び出しのみ行う。ビジネスロジックを書かない。
- Service は Prisma の行オブジェクトを API レスポンス型に変換する（`BigInt → string`, `Date → ISO string` 等）。
- Repository は Prisma クエリのみを扱い、ビジネスロジックを持たない。
- 各レイヤーは直接 import で呼び出す（DI コンテナは現時点では不使用）。

## パスパラメータの処理

- パスパラメータは `c.req.param("id")` で取得する。
- BigInt ID のバリデーションはヘルパー関数で行い、不正な場合は `ValidationError` を投げる。

```typescript
function parseId(raw: string, label: string): string {
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new ValidationError(`Invalid ${label}: ${raw}`);
  }
  return raw;
}
```

## テスト

- ルートのテストは `app.request()` を使い、実際の HTTP リクエストをシミュレートする。
- Service / Repository のテストでは Prisma Client をモックする（`mock-db.ts`）。
- テストフレームワークは Vitest。`vitest.config.ts` でグローバル設定済み。

```typescript
import { app } from "../app.js";

test("GET /products returns product list", async () => {
  const res = await app.request("/products");
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data).toBeInstanceOf(Array);
});
```

## 環境変数

- 環境変数は `src/env.ts` の Zod スキーマで起動時にバリデーションする。
- バリデーション失敗時は即座にプロセスを停止する（fail fast）。
- `DATABASE_URL` は個別の DB_* 変数から自動構築される。

## ヘルスチェック

- `/health` エンドポイントを用意し、`{ status: "ok" }` を返す。
- ロードバランサーや Container Orchestrator からの死活監視に使用する。
