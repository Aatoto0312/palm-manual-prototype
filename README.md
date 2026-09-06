# Palm Manual v0.4 "Hand Observation"

手の写真を入口に、自分の傾向を8つの軸と組み合わせで読む「人物取扱説明書」のUX検証プロトタイプです。

## v0.4 Architecture

v0.4では、従来の決定的なモックseed依存から、ブラウザ内Canvas画像解析によるピクセル観察ベースのパイプラインへ進化しました。

```text
Input Image
  ↓
HandObservation
  ↓
HandFingerprint
  ↓
continuous PersonCore (0.00〜1.00)
  ↓
display PersonCore (★1〜★5)
  ↓
Interpretation
  ↓
VisualProfile
  ↓
WorldSpec (構図・構造差)
  ↓
Your World
```

※ 本システムは手画像から科学的・医学的に性格を推定したり、本物の手相占いをするサービスではありません。画像から客観的に観察できるエッジ密度、方向性の広がり、領域バランス、左右差などの視覚的特徴を、Palm Manual独自の象徴的ルールでPersonCoreおよび世界表現へ変換しています。

## HandObservation & HandFingerprint (v0.4)

外部AI APIやサーバー通信を使わず、ブラウザ標準の Canvas / ImageData / TypedArray により以下を解析します。

- **撮影品質**: 平均輝度、コントラスト、ラプラシアン分散によるぼやけ推定、撮影アドバイス生成
- **構造特徴**: エッジ密度、方向性の多様性(Shannon Entropy)、水平/垂直/斜めエッジ比率
- **領域密度**: 3x3グリッド分割による中心部/周辺部/上下左右の密度バランス
- **左右差**: 左右の手画像の複雑さ差、密度差、方向性差、コントラスト差
- **HandFingerprint**: 幾何特徴ベクトルとハッシュ値（元画像・Base64・Blob URLは保持・蓄積しません）

## PersonCore (continuous & display)

8つの軸の意味・名称は維持しながら、内部では 0.00〜1.00 の連続値 `rawPersonCore` を保持します。UI表示用に ★1〜★5 の整数 `displayPersonCore` へ量子化しつつ、「同じ★★★★でも内部的には微妙に異なる値」を保持することで、Your World の世界生成へ細やかな個体差を反映させます。

## Your World (構図・構造差)

単に色が変わるだけでなく、PersonCoreおよびVisualProfileに応じて以下の世界の「構図・構造」そのものが可変生成されます。

- **道構図 (`pathStructure`)**: 一本道 (`single`) / 分岐 (`forked`) / 放射状 (`radial`) / 網状 (`network`) / 層状 (`layered`)
- **焦点構図 (`focalStructure`)**: 中央一極 (`singleCenter`) / 二核 (`dualCenter`) / 水平 (`horizon`) / 分散 (`distributed`)
- **垂直構図 (`verticalStructure`)**: 平坦 (`flat`) / 段丘 (`terraced`) / 塔状 (`towered`) / 浮島 (`floating`) / 深層 (`subterranean`)
- **環境構図 (`environmentStructure`)**: 閉鎖庭園 (`enclosed`) / 開放 (`open`) / 複合 (`mixed`)

## PersonCore 8軸

| カテゴリ | 軸 | 意味 |
|---|---|---|
| 方向 | 芯 `core` | 自分の基準を保つ強さ |
| 方向 | 道 `path` | 進み方を組み替える強さ |
| 思考 | 好奇心 `curiosity` | 未知へ手を伸ばす強さ |
| 思考 | つながり `connection` | 人や情報を結びつける強さ |
| 思考 | 深さ `depth` | ひとつを掘り下げる強さ |
| 行動 | 初速 `ignition` | 動き始める速さ |
| 行動 | 粘り `persistence` | 続けて育てる強さ |
| 感覚 | センサー `sensor` | 小さな変化を受け取る強さ |

## 6属性

WIND / PRISM / TIDE / ROOT / FORGE / VEIL （PersonCoreの加重スコアからPrimaryとSecondaryを選定）。

## ファイル構成

```text
palm-manual/
├─ index.html          RESULTを含むSPA画面構造
├─ style.css           明るい図鑑・ステータスカード・撮影ガイドUI
├─ types.js            6属性の表示情報
├─ hand-observation.js Canvasピクセル解析・品質評価・HandFingerprint生成
├─ person-core.js      continuous PersonCore, display PersonCore, 象徴変換ルール
├─ diagnosis.js        公開診断入口と旧パターンのフォールバック資料
├─ world-core.js       VisualProfile、可変構図WorldSpec、画像生成用prompt
├─ result-view.js      表示用ヘルパー（傾向強度ラベル、優先順位付け）
├─ app.js              画面遷移、撮影ガイド、非同期解析、RESULT/WORLD描画
└─ tests/              Node標準テストおよびテストフィクスチャ
```

## プライバシー

- 本名は不要で、ニックネームを使えます。
- 画像解析はブラウザ内で完結し、外部APIやサーバーへ送信しません。
- 写真データ（Base64, Blob URL, ImageData）は永続化せず、Object URLは使用後に適宜解放されます。
- 共有用データや WorldSpec に元画像データは一切含めません。

## 検証

外部テストライブラリは使用しません。

```powershell
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
node --test tests/*.test.js
```
