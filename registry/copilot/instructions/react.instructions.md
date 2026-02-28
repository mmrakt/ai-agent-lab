---
applyTo: "apps/web/**/*.{ts,tsx}"
---

# React 開発ベストプラクティス

## コンポーネント設計

### 関数コンポーネントのみ使用

クラスコンポーネントは使わない。すべて関数コンポーネント + Hooks で記述する。

### Props の型定義

- Props 型はコンポーネントファイル内で `type` として定義する。
- children を受け取る場合は `React.ReactNode` を使う。
- イベントハンドラの型は `React.MouseEventHandler<HTMLButtonElement>` のように具体的に定義する。

```typescript
type ProductCardProps = {
  product: Product;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function ProductCard({ product, isSelected, onSelect }: ProductCardProps) {
  // ...
}
```

### コンポーネントの分割方針

- 1 コンポーネント = 1 責務。200 行を超えたら分割を検討する。
- ロジックの抽出にはカスタム Hook を使う。Hook は同じ feature ディレクトリの `hooks/` に配置する。
- UI の詳細はサブコンポーネントとして `components/` に分割する。

## Hooks のベストプラクティス

### useState

- 独立した値には個別の `useState` を使う。関連する複数の値は `useReducer` を検討する。
- 状態の初期値が重い計算を伴う場合はイニシャライザ関数を使う: `useState(() => computeExpensiveDefault())`。

### useMemo / useCallback

- レンダリングコストの高い計算にのみ `useMemo` を使う。プリミティブ値の単純な導出には不要。
- 子コンポーネントに渡す関数で、その子が `React.memo` 化されている場合に `useCallback` を使う。
- 計測せずに最適化しない。React DevTools Profiler で実測してから判断する。

### useEffect

- データフェッチには React Query（`useQuery` / `useMutation`）を使い、`useEffect` でのフェッチは避ける。
- クリーンアップが必要な副作用（イベントリスナー、タイマー等）にのみ `useEffect` を使う。
- 依存配列は正確に記述する。ESLint の `react-hooks/exhaustive-deps` ルールに従う。

## React Query パターン

### データフェッチ

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["products", { isActive: true }],
  queryFn: () => api.products.list({ isActive: true }),
});
```

### ミューテーション

```typescript
const { mutate, isPending } = useMutation({
  mutationFn: (payload: QuoteCreatePayload) => api.quotes.create(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["quotes"] });
  },
});
```

### Query Key の設計

- リソース名をプレフィックスに、フィルタをオブジェクトとして含める: `["products", { isActive }]`
- 関連リソースのキーは階層的に: `["products", productId, "plans"]`

## 状態管理の方針

| 状態の種類 | 管理方法 |
|---|---|
| サーバーデータ | React Query |
| フォーム入力 | ローカル state (`useState` / `useReducer`) |
| ウィザード進行状態 | ローカル state + コンテキスト |
| UI 状態（モーダル開閉等） | ローカル state |
| アプリ全体の設定 | React Context |

## エラーハンドリング

- API エラーは React Query の `error` state で処理する。
- ユーザー向けエラーメッセージはトースト or インラインで表示する。
- Error Boundary はページ・セクション単位で配置し、クラッシュがアプリ全体に波及しないようにする。

## パフォーマンス

- リストレンダリングには安定した `key` を使う（インデックスは不可、ID を使う）。
- 大量のリストには仮想化（`react-window` 等）を検討する。
- 画像には `loading="lazy"` を付与する。

## アクセシビリティ

- ボタンには `<button>` を、リンクには `<a>` を使う。`<div onClick>` は禁止。
- フォーム要素には `<label>` を関連付ける。
- インタラクティブ要素には `aria-label` / `aria-labelledby` を付与する。
- キーボード操作（Tab, Enter, Escape）を考慮する。
- フォーカスリングは常に表示する（BON UI は focus-visible を標準搭載済み）。

## ファイル構成規約

```
src/features/<feature>/
├── components/
│   └── <ComponentName>/
│       ├── index.tsx
│       └── <ComponentName>.stories.tsx
├── hooks/
│   └── use<HookName>.ts
├── utils.ts
└── types.ts
```

- コンポーネントはディレクトリ + `index.tsx` で管理する。
- Storybook は同ディレクトリに co-locate する。
