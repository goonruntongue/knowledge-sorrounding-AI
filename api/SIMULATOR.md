# APIづくりシミュレーター 編集ガイド

## 作業ディレクトリ

```text
C:\Users\owner\Desktop\knowledge-sorrounding-AI\api
```

このディレクトリの教材ページ `index.html` に、Node.jsでJSONを返すAPIを作る流れの**学習用シミュレーター**が入っています。

> 重要: このシミュレーターは画面上で操作を再現するだけです。実際のNode.jsダウンロード、インストール、ファイル作成、コマンド実行、サーバー起動、ネットワーク通信は行いません。

## シミュレーターに関係するファイル

| ファイル | 役割 | 編集してよい範囲 |
|---|---|---|
| `index.html` | モーダルのHTML、Node.jsダウンロード画面風の初回画面、VS Code風画面 | `#api-lab` の `<dialog>` 内と `.api-lab-dock` のみ |
| `guide.js` | 開始・終了、ステップ遷移、ローディングバー、画面に出す擬似コード・ターミナル文 | シミュレーター部分のみ |
| `style.css` | モーダル、Node.jsダウンロード画面風UI、VS Code風UI、アニメーション | `.node-download-sim`、`.vscode-sim`、`.lab-*`、`.guided`、`.guide-label` のみ |

## 触らない範囲

次の機能・要素はシミュレーターと別の教材機能です。シミュレーター改変では変更しないでください。

- `fortune-*` — おたよりAPI体験
- 本文セクション（`#what`、`#experience`、`#json`、`#server`、`#build`、`#ai`）
- ヘッダー、フッター、ポータルへのリンク、前後ページリンク
- `#toTop` — ページ先頭へ戻るボタン
- ページ全体のフォント・色・レイアウト

## 起動方法

このページは静的HTMLです。`file://` で開いても確認できますが、HTTPで確認する場合はPowerShellで次を実行します。

```powershell
Set-Location 'C:\Users\owner\Desktop\knowledge-sorrounding-AI'
python -m http.server 4173 --directory api
```

ブラウザで次を開きます。

```text
http://127.0.0.1:4173/index.html
```

終了するには、PowerShellで `Ctrl + C` を押します。

## 画面を開く入口

ページ下部の固定ランチャー `.api-lab-dock` にある、次のボタンが入口です。

```html
<button type="button" data-open-lab>
  APIづくりを練習する
</button>
```

JavaScriptでは `data-open-lab` を持つボタンを探し、`#api-lab` をモーダルとして開いています。

## 画面構成

`#api-lab` の中には次の二つの画面があります。

1. `#node-download-sim`
   - 1 / 9 専用のNode.jsダウンロードページ風画面
   - `#node-download-action` を押すと、ローディング表示を経て2 / 9へ進む
   - 公式URL `https://nodejs.org/ja/download` は利用者が実際にインストールするときのリンク。自動で開かない

2. `.vscode-sim`
   - 2 / 9以降のVS Code風画面
   - エクスプローラー: `#lab-file-tree`
   - 編集ペイン: `#lab-tab`、`#lab-breadcrumb`、`#lab-code`
   - ターミナル: `#lab-terminal`
   - 進行ボタン: `#lab-action`

共通要素:

- `#lab-progress` — `現在のステップ / 全ステップ`
- `#lab-task` — そのステップの見出し
- `#lab-explanation` — 直前の操作が何を変えたかの説明
- `#lab-loader` — 遷移中に表示するローディングオーバーレイ
- `#reset-lab` — 最初に戻る
- `#close-lab` — モーダルを閉じる。`<dialog>` の標準操作により Escape でも閉じられる

## ステップの定義と変更方法

ステップ名、進行ボタンの文言、操作後の説明は `guide.js` の `stages` 配列で管理しています。

```js
const stages = [
  ['見出し', 'ボタンの文言', '操作後に表示する説明'],
  // ...
];
```

ステップを追加・削除した場合は、必ず次も合わせて見直してください。

- `setPanel(stage)` の条件分岐
- ファイルツリー、コード、ターミナルに表示する内容
- `render()` の完了時表示
- 1 / 9 はNode.jsダウンロード画面、2 / 9以降はVS Code風画面という切替

## 遷移とアニメーション

ボタンを押して即座に画面を切り替えないため、すべての進行操作は `advanceWithLoading()` を通ります。

1. `#lab-loader` を表示
2. 0% から100%までバーを進める
3. 操作内容に応じた短い進捗メッセージを表示
4. 次のステップを描画
5. VS Code風画面に `.is-updating` を付け、更新アニメーションを再生

初回の `#node-download-action` は `advanceWithLoading(true)` を呼び、ダウンロード・セットアップ用の文言を出します。それ以外は `#lab-action` が `advanceWithLoading()` を呼びます。

アニメーション関連の主なCSSクラス・キーフレーム:

- `.lab-loader` / `.lab-loader__track` / `.lab-loader__mark`
- `.vscode-sim.is-updating`
- `@keyframes lab-loader-pop`
- `@keyframes lab-mark-spin`
- `@keyframes lab-panel-enter`
- `@keyframes lab-panel-glow`

`prefers-reduced-motion: reduce` の利用者にはアニメーションを止めています。この配慮は削除しないでください。

## 守るべき仕様

- 実際のインストール、ファイル操作、コマンド実行、アカウント作成、ネットワーク要求を追加しない
- 学習用の再現画面である旨を維持する
- 進行先は赤枠と白文字の案内で分かるようにする
- 閉じるボタンと Escape でモーダルを閉じられる状態を維持する
- モバイル幅でも横にはみ出さないようにする
- 固定ランチャーは `sticky`、`bottom: 0` を維持する
- `guide.js` の構文確認を通す

## 変更後の確認

PowerShellで実行します。

```powershell
Set-Location 'C:\Users\owner\Desktop\knowledge-sorrounding-AI'
node --check api/guide.js
git diff --check -- api/index.html api/style.css api/guide.js api/SIMULATOR.md
```

ブラウザでは次を確認します。

1. ランチャーからモーダルが開く
2. 1 / 9にNode.jsダウンロード画面風のUIと公式リンクが出る
3. ダウンロードボタンを押すとローディングバーが出る
4. 2 / 9以降、各ボタンでローディングを経由して画面内容が変わる
5. 最終ステップまで進める
6. 「最初から練習する」と「閉じる」、Escape が使える
7. 狭いスマホ幅でもモーダルとボタンを操作できる

