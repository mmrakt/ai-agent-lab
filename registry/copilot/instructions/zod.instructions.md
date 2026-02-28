---
applyTo: "**/*.{ts,tsx}"
---

# Zod 開発ベストプラクティス

## 基本原則

- スキーマ定義を Single Source of Truth とし、`z.infer<typeof schema>` で型を導出する。手動の型定義とスキーマを二重管理しない。
- スキーマ名は `<リソース名>Schema`（camelCase）で命名する。型名は PascalCase。

```typescript
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
});

export type Product = z.infer<typeof productSchema>;
```

## スキーマ定義のパターン

### オブジェクトスキーマ

```typescript
// 必須フィールドとオプショナルフィールドの明確な区別
const userSchema = z.object({
  name: z.string().min(1),          // 必須 + バリデーション
  email: z.string().email(),         // 必須 + フォーマットチェック
  phone: z.string().optional(),      // オプショナル
  address: z.string().nullable(),    // null 許容
});
```

### 列挙型（Enum）

```typescript
// z.enum で文字列リテラル型を表現
export const billingCycleSchema = z.enum([
  "monthly",
  "yearly",
  "one_time",
  "custom",
]);

export type BillingCycle = z.infer<typeof billingCycleSchema>;
```

### 配列

```typescript
// 最低 1 件を要求
const itemsSchema = z.array(quoteItemSchema).min(1);

// 変換付き
const tagsSchema = z.array(z.string().trim().toLowerCase());
```

### ネストと合成

```typescript
// 既存スキーマの拡張
const detailedPlanSchema = planSchema.extend({
  features: z.array(planFeatureSchema),
});

// 既存スキーマのサブセット
const planSummarySchema = planSchema.pick({
  id: true,
  title: true,
  priceAmount: true,
});

// 既存スキーマの一部除外
const createSchema = planSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

## transform の活用

### クエリパラメータの変換

```typescript
// 文字列の "true"/"false" を boolean に変換
const filterSchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === "true"),
});
```

### 数値型への変換

```typescript
const paginationSchema = z.object({
  page: z.string().default("1").pipe(z.coerce.number().int().positive()),
  limit: z.string().default("20").pipe(z.coerce.number().int().max(100)),
});
```

### pipe パターン

`z.coerce` と `pipe` を組み合わせて、複数段階のバリデーションを行う。

```typescript
const portSchema = z
  .string()
  .optional()
  .default("3000")
  .pipe(z.coerce.number().int().min(1).max(65535));
```

## API レスポンスのエンベロープ

```typescript
// 汎用エンベロープスキーマ
export function envelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({ data: dataSchema });
}

export type Envelope<T> = { data: T };
```

## バリデーションの実行

### Hono との統合

```typescript
import { zValidator } from "@hono/zod-validator";

// ルートハンドラでバリデーション
app.post(
  "/quotes",
  zValidator("json", quoteCreatePayloadSchema),
  async (c) => {
    const payload = c.req.valid("json"); // 型安全
  },
);

app.get(
  "/products",
  zValidator("query", productListQuerySchema),
  async (c) => {
    const { isActive } = c.req.valid("query"); // 変換済み
  },
);
```

### 環境変数のバリデーション

```typescript
const envSchema = z.object({
  PORT: z.string().optional().default("3000").pipe(z.coerce.number()),
  NODE_ENV: z.enum(["local", "development", "production", "test"]).default("local"),
  DB_HOST: z.string().optional().default("localhost"),
  DB_USER: z.string().min(1, "DB_USER is required"),
});

export function parseEnv(input = process.env) {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }
  return result.data;
}
```

## エラーハンドリング

- `safeParse` を使い、エラーを構造的に処理する。`parse` は例外を投げるため、入力が信頼できる場合のみ使用する。
- エラーメッセージのカスタマイズには `z.string().min(1, "必須項目です")` のようにメッセージを渡す。

```typescript
const result = schema.safeParse(input);
if (!result.success) {
  const formatted = result.error.format();
  // formatted._errors, formatted.fieldName._errors で
  // フィールドごとのエラーにアクセス可能
}
```

## ファイル配置

- API スキーマ: `apps/api/src/schemas/<resource>.ts`
- 共通エンベロープ: `apps/api/src/schemas/envelope.ts`
- 環境変数: `apps/api/src/env.ts`
- クライアント側バリデーション: `apps/web/src/lib/` 内の該当ファイル

## アンチパターン

- `z.any()` の使用は避ける。型安全が失われる。
- スキーマと手動型定義を二重管理しない。`z.infer` で統一する。
- 複雑な `refine` / `superRefine` を多用する場合は、ロジックを Service 層に移動することを検討する。
- `transform` 内で副作用（API 呼び出し等）を行わない。
