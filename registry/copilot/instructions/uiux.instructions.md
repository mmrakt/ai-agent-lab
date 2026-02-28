---
applyTo: "apps/web/**/*.{ts,tsx}"
---

# UI/UX 開発ガイドライン

このドキュメントは、BON UI / Tailwind / React の実装規約ではカバーしきれない **UI/UX 固有の観点**（認知負荷、情報設計、状態設計、インタラクション品質）に集中する。

## 実装規約の参照先

- カラー・タイポグラフィ・トークン運用は `bon-ui.instructions.md` に従う。
- レスポンシブ設計・spacing・ユーティリティ運用は `tailwindcss.instructions.md` に従う。
- コンポーネント設計の基本方針（責務分離、命名、構成）は `react.instructions.md` と `fe.instructions.md` に従う。
- ダークモード実装は BON UI テーマ方針（`bon-ui.instructions.md`）に従う。

## デザイン原則

### 一貫性（Consistency）

- 既存の BON UI パターン（色・余白・角丸・状態表現）を優先し、同じ目的の UI は同じ見た目・同じ挙動に揃える。
- 同一画面内でコンポーネント密度（余白、タイポサイズ、行間）を混在させない。
- ナビゲーション、主要 CTA、フォーム配置は画面間で位置と文言の規則を統一する。

### ヒューリスティクス（Nielsen）

- **Visibility of system status**: ローディング・保存中・完了・失敗を常に明示する。
- **Match between system and real world**: 業務ドメインの用語を優先し、技術用語を UI 文言に露出させない。
- **User control and freedom**: 戻る・キャンセル・再試行を提供し、誤操作から回復可能にする。
- **Error prevention**: 事前入力制約、適切な初期値、段階的バリデーションで入力ミスを減らす。
- **Recognition rather than recall**: 選択肢・補助文・前回入力の保持で記憶負荷を下げる。

### ユーザビリティ

- 主要タスク（見積作成）を最短ステップで完了できる情報設計を優先する。
- 重要情報（価格、必須入力、エラー）は視覚優先度を上げ、補足情報は二次階層に配置する。
- すべての状態で「次に何をすべきか」が 1 画面で理解できる構成にする。

## 情報設計（Information Architecture）

- 主目的（見積作成完了）から逆算して、画面上の情報を「意思決定に必要な順」で配置する。
- ラベルは業務用語で統一し、同義語の混在（例: 顧客 / クライアント）を避ける。
- 1 画面内での意思決定は最大 1 つを基本とし、補助タスクは段階的に開示する。
- ステップ型 UI では「現在地・完了済み・次アクション」を常に可視化する。

## 認知負荷の低減

- 一度に入力させる項目数を抑え、関連項目はグルーピングする。
- 再入力を避けるため、既知情報の初期値・選択肢・サジェストを活用する。
- 削除・上書きなど不可逆操作は確認導線を設ける。
- 専門用語には補助説明を付け、文脈なしでの理解を要求しない。

## インタラクションパターン

### フィードバック

- クリック・選択・送信の結果は 100ms〜300ms 以内に視覚フィードバックを返す。
- 成功時は次アクションが明確になるメッセージと状態更新を同時に示す。

✅ 例（送信後に即時フィードバック + 次アクション）

```tsx
<button type="submit" disabled={isSubmitting} className="btn-primary">
	{isSubmitting ? "保存中..." : "保存する"}
</button>

<p role="status" aria-live="polite" className="text-sm text-bon-fg-muted">
	{isSubmitting ? "見積を保存しています..." : submitMessage}
</p>
```

❌ 例（操作結果の通知がなく、ユーザーが状態を判断できない）

```tsx
<button type="submit" className="btn-primary">保存</button>
```

### ローディング

- データ取得中は BON スケルトンまたは `role="status"` のローディング表示を使う。
- 3 秒を超える待ち時間には進捗または待機理由を表示し、離脱を防ぐ。

✅ 例（スケルトン + 読み上げ可能なローディング）

```tsx
<section aria-busy={isLoading} aria-live="polite">
	{isLoading ? (
		<div role="status" className="space-y-3">
			<div className="h-4 w-40 rounded bg-bon-skeleton animate-pulse" />
			<div className="h-10 w-full rounded bg-bon-skeleton animate-pulse" />
			<div className="h-10 w-full rounded bg-bon-skeleton animate-pulse" />
			<span className="sr-only">読み込み中</span>
		</div>
	) : (
		<QuoteForm />
	)}
</section>
```

❌ 例（空白のままで待機理由が伝わらない）

```tsx
{isLoading ? <div /> : <QuoteForm />}
```

### エラー状態

- エラー文は原因・影響・復旧手段（再試行/入力修正）を短く明示する。
- 致命的エラーはページ上部または対象セクション直近に表示し、見落としを防ぐ。

✅ 例（原因 + 復旧手段 + 再試行）

```tsx
{error ? (
	<div role="alert" className="rounded-md border border-bon-danger p-4">
		<p className="font-medium">見積の保存に失敗しました。</p>
		<p className="mt-1 text-sm text-bon-fg-muted">
			入力内容を確認し、時間をおいて再試行してください。
		</p>
		<button type="button" onClick={retry} className="mt-3 btn-secondary">
			再試行
		</button>
	</div>
) : null}
```

❌ 例（原因・復旧手段がない曖昧な表示）

```tsx
{error ? <p>エラーが発生しました</p> : null}
```

### 空状態

- 空データ時は「なぜ空なのか」「次に何をすればよいか」をセットで提示する。
- 初回利用者向けには最小限のガイド（例: 新規作成 CTA）を配置する。

✅ 例（理由 + 次アクション）

```tsx
{quotes.length === 0 ? (
	<section className="rounded-lg border border-bon-border p-6 text-center">
		<h2 className="text-base font-semibold">まだ見積はありません</h2>
		<p className="mt-2 text-sm text-bon-fg-muted">
			最初の見積を作成すると、ここに一覧表示されます。
		</p>
		<button type="button" onClick={onCreateQuote} className="mt-4 btn-primary">
			見積を新規作成
		</button>
	</section>
) : (
	<QuoteList quotes={quotes} />
)}
```

❌ 例（空白のみで意図が不明）

```tsx
{quotes.length === 0 ? null : <QuoteList quotes={quotes} />}
```

## フォームデザイン

- ラベルは常時表示し、`placeholder` をラベルの代替にしない。
- 必須/任意を明示し、入力形式・制約は事前に説明する。
- バリデーションは入力中（軽量）と送信時（厳密）の二段階で実施する。
- エラーはフィールド近傍に表示し、必要に応じてエラーサマリーとフォーカス移動を行う。
- 連続入力での認知負荷を下げるため、関連項目をグルーピングする。

✅ 例（ラベル常時表示 + 補助文 + エラー関連付け）

```tsx
<div className="space-y-2">
	<label htmlFor="companyName" className="text-sm font-medium">
		会社名 <span aria-hidden="true">*</span>
	</label>
	<input
		id="companyName"
		name="companyName"
		required
		aria-describedby="companyName-help companyName-error"
		className="input"
	/>
	<p id="companyName-help" className="text-xs text-bon-fg-muted">
		登記上の正式名称を入力してください。
	</p>
	{errors.companyName ? (
		<p id="companyName-error" role="alert" className="text-xs text-bon-danger">
			会社名は必須です。
		</p>
	) : null}
</div>
```

❌ 例（placeholder のみでラベルを代替）

```tsx
<input name="companyName" placeholder="会社名を入力" className="input" />
```

## アクセシビリティ連携

- 実装時は `.github/agents/a11y.agent.md` の検査観点と整合させる。
- semantic HTML、キーボード操作、フォーカス表示、`aria-*` ラベルを標準要件とする。
- コントラスト、読み上げ順序、フォームエラー通知は UI/UX 品質要件として扱う。

## リファレンス

| ドキュメント | 用途 |
|---|---|
| `.github/instructions/bon-ui.instructions.md` | BON UI トークン・コンポーネント運用 |
| `.github/instructions/tailwindcss.instructions.md` | レイアウト/spacing/レスポンシブ実装規約 |
| `.github/instructions/react.instructions.md` | React コンポーネント設計規約 |
| `.github/instructions/fe.instructions.md` | Web 全体構成・実装方針 |
| `.github/instructions/playwright.instructions.md` | UI テスト実装規約 |
| `.github/agents/a11y.agent.md` | a11y 検査観点（UI/UX 品質連携） |
