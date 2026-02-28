---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript 開発ベストプラクティス

## 型安全の原則

- `any` は原則禁止。やむを得ない場合は `unknown` + 型ガードを使う。
- `as` によるキャストは最小限に。代わりに `satisfies` 演算子や型ガード関数を使う。
- `type` エイリアスと判別共用体（discriminated union）を積極的に使う。`interface` はクラスの実装契約やライブラリの拡張が必要な場合のみ使う。

```typescript
// ✅ 判別共用体
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ✅ satisfies で型チェックしつつリテラル型を保持
const config = {
  port: 3000,
  host: "localhost",
} satisfies ServerConfig;
```

## 型定義の配置

- コンポーネントの Props / 内部型はコンポーネントファイル内に定義する。
- 2 箇所以上で再利用される型は `src/lib/types.ts` や `schemas/` に抽出する。
- API レスポンス型は Zod スキーマから `z.infer<>` で導出し、手動の型定義と乖離させない。

## null / undefined の扱い

- `null` と `undefined` を混在させない。API 境界では `null`、アプリ内部では `undefined` を使い分ける。
- Optional chaining (`?.`) と Nullish coalescing (`??`) を活用する。論理 OR (`||`) は `0` や `""` を falsy と扱うため使わない。

```typescript
// ✅
const name = user?.name ?? "Unknown";

// ❌ 空文字列が無視される
const name = user?.name || "Unknown";
```

## エラーハンドリング

- `throw` する値は必ず `Error` のサブクラスにする。文字列を throw しない。
- `try-catch` のスコープは最小限に。処理の流入経路ごとに AppError 等のドメインエラーへ変換する。

## import / export

- Biome の import 順序ルール（builtin → external → internal → relative）に従う。`pnpm check` で自動検出される。
- 名前付き export を優先する。デフォルト export はフレームワークが要求する場合（React lazy, Storybook meta 等）のみ使用する。
- 型のみの import には `import type` を使う。

```typescript
import type { Product } from "../schemas/index.js";
```

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| 変数・関数 | camelCase | `listProducts`, `parseId` |
| 型・インターフェース | PascalCase | `Product`, `QuoteCreatePayload` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| ファイル名 | kebab-case | `product.service.ts` |
| React コンポーネント | PascalCase (ファイル・ディレクトリ共) | `ProductCard/index.tsx` |

## ユーティリティ型の活用

- `Readonly<T>` で意図しない変更を防ぐ。特に関数パラメータに有効。
- `Pick<T, K>` / `Omit<T, K>` で既存型のサブセットを作る。
- `Record<K, V>` でインデックスシグネチャを表現する。
- `NonNullable<T>` で null / undefined を除去する。

## Strict Mode 設定

プロジェクトは `"strict": true` を採用。以下が有効であることに留意する:

- `strictNullChecks`: null / undefined のチェック必須
- `noUncheckedIndexedAccess`: 配列やオブジェクトのインデックスアクセスが `T | undefined` になる
- `exactOptionalPropertyTypes`: `undefined` と「プロパティなし」を区別する
