---
applyTo: "**/*.test.{ts,tsx}"
---

# TDD（テスト駆動開発）ワークフロー

## Red-Green-Refactor サイクル

すべての実装は以下のサイクルで進める:

1. **Red** — 失敗するテストを書く（まだ実装がない状態）
2. **Green** — テストが通る最小限のコードを書く
3. **Refactor** — テストが通ったままコードを改善する

```
┌─────────────────────────────────────┐
│  1. Red:  失敗するテストを書く       │
│              ↓                      │
│  2. Green: 最小限の実装で通す        │
│              ↓                      │
│  3. Refactor: コードを改善          │
│              ↓                      │
│  (次の要件へ → 1 に戻る)            │
└─────────────────────────────────────┘
```

## 手順の詳細

### Step 1: Red（テストを書く）

- 実装したい振る舞いを **1 つだけ** テストケースとして記述する。
- テストを実行し、**意図通りに失敗する** ことを確認する。
- 失敗理由が「実装がない / 期待と異なる」であることを確認する（インポートエラーや構文エラーでの失敗は不可）。

```typescript
// ✅ 振る舞いを 1 つだけテスト
it("calculates tax amount from subtotal and rate", () => {
  expect(computeTaxAmount("10000", 0.1)).toBe("1000");
});

// ❌ 複数の振る舞いを 1 つのテストに詰め込まない
it("calculates tax, total, and line total", () => {
  // ... too many assertions
});
```

### Step 2: Green（最小限の実装）

- テストが通る **最小限** のコードを書く。
- 完璧なコードを目指さない。まず動くことが最優先。
- 他のテストが壊れていないことを確認する。

### Step 3: Refactor（改善）

- 重複の排除、命名の改善、関数の抽出を行う。
- テストが引き続きすべて通ることを確認する。
- プロダクションコードとテストコードの両方をリファクタリングする。

## プロジェクト固有のテスト規約

### テストフレームワーク

| パッケージ | フレームワーク | 実行コマンド |
|---|---|---|
| `@qautogen/api` | Vitest | `pnpm -F api test` |
| `@qautogen/web` | Playwright (E2E/VRT) | `pnpm -F web test:vrt` |

### ファイル配置

テストは対象モジュールと同じディレクトリに `<module>.test.ts` として co-locate する。

```
services/
├── product.service.ts
├── product.service.test.ts
├── quote.service.ts
└── quote.service.test.ts
```

### テストの構造

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ProductService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listProducts", () => {
    it("serialises BigInt ids to strings", async () => {
      // Arrange: テストデータとモックをセットアップ
      // Act: テスト対象を実行
      // Assert: 期待結果を検証
    });
  });
});
```

### モックパターン

#### Repository のモック（Service テスト用）

```typescript
vi.mock("../repositories/product.repository.js", () => ({
  ProductRepository: {
    findMany: vi.fn(),
  },
}));

const { ProductService } = await import("./product.service.js");
const { ProductRepository } = (await import(
  "../repositories/product.repository.js"
)) as unknown as {
  ProductRepository: { findMany: ReturnType<typeof vi.fn> };
};
```

#### Service のモック（Route テスト用）

```typescript
vi.mock("../services/product.service.js", () => ({
  ProductService: { listProducts: vi.fn() },
}));
// db のモックも必要
vi.mock("../lib/db.js", () => ({ db: {} }));

const { app } = await import("../app.js");
```

#### mock-db ヘルパー

`src/__testing__/mock-db.ts` に PrismaClient のモックファクトリがある。Repository テストで使用する。

### Route テストパターン

`app.request()` を使い HTTP レベルでテストする:

```typescript
it("returns 200 with Envelope<Product[]>", async () => {
  ProductService.listProducts.mockResolvedValue([PRODUCT_FIXTURE]);

  const res = await app.request("/products");

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ data: [PRODUCT_FIXTURE] });
});
```

### フィクスチャの作成

- フィクスチャはテストファイル内に定義する。共有する場合は `__testing__/` に配置する。
- Prisma 行のファクトリ関数を作り、`overrides` でフィールドを上書きできるようにする。

```typescript
const NOW = new Date("2026-01-01T00:00:00.000Z");

function makePrismaProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    name: "Test Product",
    description: null,
    isActive: true,
    thumbnailUrl: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}
```

## TDD のベストプラクティス

### テストの粒度

- **1 テスト = 1 振る舞い**。複数のアサーションがあっても、検証している振る舞いは 1 つにする。
- テスト名は「何をしたら何が起こるか」を明確に記述する。

```typescript
// ✅ 明確な振る舞い
it("converts null description to undefined", async () => { ... });
it("throws ValidationError for non-numeric id", () => { ... });

// ❌ 曖昧
it("works correctly", async () => { ... });
it("handles edge cases", () => { ... });
```

### テストレイヤーの選択

| テスト対象 | テストレイヤー | モック範囲 |
|---|---|---|
| ビジネスロジック | Service テスト | Repository をモック |
| HTTP ルーティング | Route テスト | Service + db をモック |
| データアクセス | Repository テスト | db をモック |
| ユーティリティ関数 | 純粋なユニットテスト | モック不要 |
| エラーハンドラ等 | ミドルウェアテスト | 専用テストアプリ作成 |

### テストの独立性

- 各テストは他のテストの実行順序に依存しない。
- `beforeEach` で `vi.clearAllMocks()` を呼び、モック状態をリセットする。
- テスト間でグローバル状態を共有しない。

### 境界値と異常系

- 正常系を書いたら、必ず異常系も書く。
- 境界値（空配列、0、最大値、null 等）をテストする。
- エラーメッセージの内容まで検証する。

```typescript
it("returns empty array when no products exist", async () => {
  ProductRepository.findMany.mockResolvedValue([]);
  const result = await ProductService.listProducts();
  expect(result).toEqual([]);
});

it("throws ValidationError for id=0", () => {
  expect(() => parseId("0", "productId")).toThrow(ValidationError);
});
```

## ワークフローのチェックリスト

1. [ ] テストを先に書いた（Red）
2. [ ] テストが意図通りに失敗することを確認した
3. [ ] 最小限の実装でテストを通した（Green）
4. [ ] すべての既存テストが引き続き通ることを確認した
5. [ ] コードをリファクタリングした（Refactor）
6. [ ] 異常系・境界値のテストを追加した
7. [ ] `pnpm -F api test` が全パスすることを確認した
