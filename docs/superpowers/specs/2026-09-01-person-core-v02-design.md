# Palm Manual v0.2 PersonCore Design

## Goal

固定20パターンを主診断にせず、8軸のPersonCoreと2軸の組み合わせから取扱説明書を生成する。既存の入力・写真・分析・再診断フローと、外部依存なしの静的配信を維持する。

## Architecture

- `types.js`: 6属性の表示メタデータを保持する。
- `person-core.js`: 入力seed、8軸生成、組み合わせ解釈、属性スコア、結果文章を純粋関数として提供する。
- `diagnosis.js`: 旧20パターンをフォールバック資料として残し、公開済みの `PalmDiagnosis.diagnose(input)` をPersonCore生成へ接続する。
- `app.js`: DOM参照、画面遷移、結果描画だけを担当する。
- `index.html` / `style.css`: 結果の情報順と明るい図鑑・ステータスカードUIを担当する。

## Data Flow

1. ニックネーム、左右画像のファイル名とバイトサイズを正規化して結合する。
2. FNV-1aで32bit seedを作る。seed生成とPersonCore生成は別関数にする。
3. seedから決定的な疑似乱数列を作り、8軸を独立に1〜5へ割り当てる。平均値への補正はせず、★1や★5が複数出る結果を許容する。
4. 指定8組の軸を low(1–2) / mid(3) / high(4–5) に分類し、組ごとの構造化解釈を返す。
5. PersonCoreの加重和から6属性を採点し、決定的な順位で異なるPrimary / Secondaryを選ぶ。
6. 上位属性と組み合わせ解釈から、固有タイトル、一言説明、詳細8項目を生成する。

## Result Contract

`buildResultData(input)` は `seed`, `name`, `personCore`, `coreAxes`, `categories`, `combinations`, `typeScores`, `primary`, `secondary`, `title`, `summary`, `deepKeys`, `deep`, `howToRead` を返す。組み合わせ要素は `id`, `axes`, `levels`, `headline`, `text`, `tags` を持ち、将来AIへそのまま渡せる形にする。

## UI and Copy

結果順は Primary × Secondary、固有タイトル、一言説明、カテゴリ別8軸、組み合わせ解釈、詳細取扱説明書、「どう読んだ？」とする。星は能力ではなく傾向の強さであると明記し、常に `★` と `☆` の合計5個を表示する。文章は短い結論を先に置き、その後に理由や使い方を述べる。

## Privacy and Accuracy

元画像はプレビュー以外に渡さず、結果DOMと共有領域へ追加しない。v0.2は画像内容を解析せず、写真メタデータ由来のモックseedであることを明記する。生命線・頭脳線・指などの観察結果や科学的な性格判定を示唆しない。

## Testing

Node標準の `node:test` と `assert` のみを使う。8軸、値域、決定性、入力差、尖った分布の許容、8組の解釈、属性順位、結果構造を自動検証する。DOM固有部分はHTML/CSS/JSの静的検査と手動UX確認項目で検証する。

