---
applyTo: "apps/web/playwright/**"
---

# Playwright テストベストプラクティス

## テスト哲学

- **ユーザーが見える動作をテストする**。実装の詳細（CSS クラス、内部関数名）ではなく、エンドユーザーが行う操作や見る内容にフォーカスする。
- **テストの独立性を保つ**。各テストは独立して実行でき、テスト間の依存を排除する。
- **サードパーティの依存関係をテストしない**。外部サービスへの通信は MSW や Playwright の Network API でモックする。

## プロジェクト構成

```
apps/web/playwright/
├── playwright.config.ts          # Playwright 設定
├── vrt.spec.ts                   # Visual Regression Test（ページ単位）
├── vrt.storybook.spec.ts         # Storybook VRT
└── test-results/                 # テスト結果出力
```

## ロケーターの優先順位

1. **Role-based locators**（最優先）
2. **Test ID** (`data-testid`)
3. **Label**
4. **Text content**

```typescript
// ✅ role + accessible name（最優先）
page.getByRole("button", { name: "次へ" });
page.getByRole("textbox", { name: "会社名" });

// ✅ test-id（role-based が困難な場合）
page.getByTestId("quote-summary-card");

// ❌ CSS セレクター（脆弱）
page.locator(".btn-primary");

// ❌ XPath
page.locator("//button[@class='btn']");
```

### チェインとフィルタリング

```typescript
await page
  .getByRole("listitem")
  .filter({ hasText: "商品A" })
  .getByRole("button", { name: "選択" })
  .click();
```

## アサーション

### Web First Assertions を使用

Playwright の自動待機機能を活用する。手動アサーションは使わない。

```typescript
// ✅ Web First（自動で待機）
await expect(page.getByText("見積番号: Q-001")).toBeVisible();
await expect(page.getByTestId("total")).toHaveText("¥100,000");
await expect(page).toHaveURL(/\/steps\/summary$/);

// ❌ 手動アサーション（待機しない）
expect(await page.getByText("welcome").isVisible()).toBe(true);
```

### ソフトアサーション

複数項目を検証する場合、すべての失敗を一度に確認できる:

```typescript
await expect.soft(page.getByTestId("subtotal")).toHaveText("¥80,000");
await expect.soft(page.getByTestId("tax")).toHaveText("¥8,000");
await expect.soft(page.getByTestId("total")).toHaveText("¥88,000");
```

## API モック

### MSW を使った例

```typescript
import { http, HttpResponse } from "msw";

const handlers = [
  http.get("/api/products", () => {
    return HttpResponse.json([
      { id: "1", name: "商品A", isActive: true },
    ]);
  }),
];
```

### Playwright の route を使った例

```typescript
test("商品一覧が表示される", async ({ page }) => {
  await page.route("**/api/products", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: "1", name: "商品A", isActive: true }]),
    })
  );

  await page.goto("/steps/product");
  await expect(page.getByText("商品A")).toBeVisible();
});
```

## Visual Regression Testing (VRT)

### ページ VRT

```typescript
test("renders without visual regressions", async ({ page }) => {
  await page.goto("/steps/summary");
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveScreenshot({
    fullPage: true,
    maxDiffPixelRatio: 0.001,
  });
```

### Storybook VRT

- `vrt.storybook.spec.ts` で管理。`STORYBOOK_BASE_URL` 環境変数で Storybook サーバーを指定。
- `webServer` ロジックを spec 内に書かない。

### コマンド

```bash
pnpm -F web test:vrt                        # VRT 実行
pnpm -F web test:vrt:storybook              # Storybook VRT
pnpm -F web test:vrt -- --update-snapshots  # スクリーンショット更新
```

## アクセシビリティ（a11y）テスト

### axe-core による自動スキャン

新規ページ・主要 UI 変更時は `@axe-core/playwright` で WCAG 2.1 AA 違反がないか確認する。

```typescript
import AxeBuilder from "@axe-core/playwright";

test("a11y - axe-core スキャン", async ({ page }) => {
  await page.goto("/steps/company");
  await page.waitForLoadState("networkidle");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### ロケーターと a11y の関係

role-based ロケーター（最優先）を使うことで、テストが a11y を自然に保証する:

- `getByRole("button", { name: "次へ" })` → ボタンに accessible name が必要
- `getByRole("textbox", { name: "会社名" })` → フォームに `<label>` または `aria-label` が必要
- `getByRole("heading", { name: "商品選択" })` → 見出し階層が正しいことを保証

### キーボード操作のテスト

```typescript
// Tab でフォーカス移動
await page.keyboard.press("Tab");
// フォーカスが期待要素にあるか確認
await expect(page.getByRole("button", { name: "次へ" })).toBeFocused();

// Escape でモーダルを閉じる
await page.keyboard.press("Escape");
await expect(page.getByRole("dialog")).not.toBeVisible();
```

### フォームエラーの a11y テスト

```typescript
// エラー後、aria-describedby で紐付いたメッセージが表示されること
await page.getByRole("button", { name: "次へ" }).click();
await expect(page.getByRole("alert")).toBeVisible();
```

> 詳細な a11y 検査ワークフローは `.github/agents/a11y.agent.md` を参照。

## テスト作成時のルール

- `toHaveScreenshot()` の前に `page.waitForLoadState("networkidle")` を呼ぶ。
- `page.waitForTimeout` など固定待機は使わない。Web First Assertions の自動待機を使う。
- バックエンド依存画面は MSW または Playwright route でスタブする。
- テスト名は「何をしたら何が起こるか」を明確に記述する。
- 新規ページには axe-core スキャンを追加する（`a11y.spec.ts` に追記）。

## デバッグ

```bash
pnpm -F web test:e2e -- --debug        # デバッグモード
pnpm -F web test:e2e:ui                # UI モード（ステップ実行）
pnpm -F web test:e2e -- --trace on     # トレース付き実行
```

VS Code 拡張機能 "Playwright Test for VS Code" でテスト実行・デバッグ・ロケーター生成が可能。
