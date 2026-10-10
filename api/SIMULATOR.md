# APIづくりシミュレーター 編集ガイド

## 作業ディレクトリ

```text
C:\Users\owner\Desktop\knowledge-sorrounding-AI\api
```

このディレクトリの教材ページ `index.html` に、Node.js のインストールから、VS Code でのファイル作成、npm、サーバー起動、ブラウザーでの確認、Render での公開までを通して体験する**学習用シミュレーター**が入っています。

> 重要: このシミュレーターは画面上で操作を再現するだけです。実際のNode.jsダウンロード、インストール、ファイル作成、コマンド実行、サーバー起動、ネットワーク通信、アカウント操作は行いません。

## シミュレーターに関係するファイル

| ファイル | 役割 | 編集してよい範囲 |
|---|---|---|
| `index.html` | モーダルの外枠（見出し、章ナビ、説明欄、画面を描く空の `#lab-stage`、出典） | `#api-lab` の `<dialog>` 内と `.api-lab-dock` のみ |
| `guide.js` | 画面の状態、画面のHTML生成、1クリックごとの操作と変化の再生、進行管理 | シミュレーター部分のみ（先頭の依頼文コピーと末尾の `#toTop` は別機能） |
| `style.css` | モーダル、デスクトップ・ブラウザー・インストーラー・VS Code・Render 風UI、アニメーション | `#api-lab`、`.node-download-sim`、`.vscode-sim`、`.lab-*`、`.tk-*`、`.guided`、`.guide-label` のみ |

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

ページ下部の固定ランチャー `.api-lab-dock` と本文中にある、次の属性を持つボタンが入口です。

```html
<button type="button" data-open-lab>
  APIづくりを練習する
</button>
```

JavaScriptでは `data-open-lab` を持つボタンを探し、最初の状態に戻してから `#api-lab` をモーダルとして開いています。

## 全体の流れ（8章・58操作）

| 章 | 見出し | 再現する画面 |
|---|---|---|
| 1 | Node.jsをダウンロードして、インストールする | ブラウザー（nodejs.org/ja/download 風）→ ダウンロード表示 → Node.js Setup → ユーザー アカウント制御 → 進行バー |
| 2 | VS Codeに作業フォルダーを紐づける | タスク バー → VS Code →「フォルダーを開く」→ Windows のフォルダー選択 → 作成者を信頼 |
| 3 | VS Codeでファイルを作る | エクスプローラーで `data.json`・`server.js` を作成 → 入力 → Ctrl+S |
| 4 | ターミナルで npm init と Express のインストール | メニュー「ターミナル」→ `node --version` → `npm init -y` → `npm install express` |
| 5 | そのほかの npm コマンドを試す | `package.json` を開く → `npm list` → `npm run` |
| 6 | ターミナルで API サーバーを起動する | `node server.js` |
| 7 | API が動くことを確認する | ブラウザーで `localhost:3000/api/hello` → VS Code で Ctrl+C → 再読み込みで接続拒否 |
| 8 | GitHubへ保存して、Render で公開する | `.gitignore` → `git init`／`git add .`／`git commit`／`gh repo create` → Render の New Web Service → デプロイログ → 公開URL |

## しくみ

`guide.js` のシミュレーター部分は、次の3層でできています。

1. **状態** — `fresh()` が返すオブジェクト1つ（`st`）が、画面のすべてを表します。
   - `app`: 手前に出すアプリ（`browser` / `installer` / `vscode`）
   - `br`: ブラウザー（タブ、URL、入力中の文字、ダウンロード表示）
   - `ins`: インストーラー（ページ、同意、進行率、UAC）
   - `vs`: VS Code（フォルダー、ファイル一覧、タブ、本文、ターミナル、ダイアログ）
   - `rd`: Render（ページ、フォーム入力、デプロイログ、状態）
2. **描画** — 状態からHTML文字列を作る関数です。`desktop(s)` が全体を作り、`browserWin`、`installerWin`、`vscodeWin`、`renderPage` などが各画面を担当します。
   - `render()` は `#lab-stage` 全体を描き直します。
   - `paint('lab-vs-panel', ...)` は、`regions` に登録した id の部分だけを描き直します。入力中や出力中の細かい変化はこちらを使います。
3. **操作** — `steps` 配列の1要素が、利用者の1クリックです。

```js
{
  ch: 4,                    // 章番号（1〜8）
  act: 'term',              // 押す対象。画面側の data-act と一致させる
  label: 'クリックで…',      // 赤枠に添える白文字の案内
  hint: '…',                // 操作前に上へ出す説明
  explain: '…',             // 操作後に下へ出す説明
  run: async (s, f) => {}   // 状態 s を書き換え、道具 f で変化を再生する
}
```

`run` に渡る道具 `f`:

| 道具 | 役割 |
|---|---|
| `f.wait(ms)` | 待つ（「アニメーションを速くする」で短くなる） |
| `f.type(set, text, ms, chunk, ids)` | 1文字ずつ入力する様子を再生する |
| `f.paint(...ids)` | 指定した部分だけ描き直す |
| `f.render()` | 画面全体を描き直す（アプリの切り替えなど） |
| `f.key('Ctrl + S')` | 押したキーを画面中央に短く表示する |

よく使う操作は部品にしてあります: `command()`（ターミナルで1コマンド）、`newFile()`、`writeCode()`、`save()`、`navigate()`（アドレス バー入力）、`switchApp()`、`insNext()`。

### 進行のルール

- 画面内の `data-act` を持つ要素のうち、`steps[index].act` と一致するものに `.guided`（赤枠）が付き、`#lab-guide`（白文字の案内）がその近くに出ます。
- 一致する要素を押すと `runStep()` が `run` を再生し、終わったら次の操作へ進みます。違う場所を押すと、案内が小さく揺れるだけで進みません。
- 章ナビ（`#lab-chapters`）と「最初から練習する」は `goTo(番号)` を呼びます。`goTo` は最初の状態から `steps` をアニメーションなしで流し直して、その時点の状態を作ります。**そのため `run` は、状態 `s` だけを書き換える作りにしてください**（DOMを直接さわると、章ジャンプで状態が合わなくなります）。
- 再生中に閉じる・章を移ると、`token` が変わり、動いていた再生は止まります。

### 操作を追加・変更するとき

1. 画面に新しい押し先が必要なら、描画関数のHTMLに `data-act="名前"` を付ける。
2. `steps` の該当する章に、同じ `act` の要素を追加する。
3. 新しい状態が必要なら `fresh()` に初期値を足し、描画関数で使う。
4. 部分描画したい場所は、id を付けて `regions` に登録する。

章を増減した場合は `chapters`（短い名前）と `chapterTitles`（見出し）も合わせます。

## 画面構成（index.html）

- `#lab-chapters` — 章ナビ。`guide.js` がボタンを差し込む
- `#lab-progress` — `STEP 章 / 8　操作 n / m`
- `#lab-task` — 章の見出し
- `#lab-hint` — これから行う操作の説明
- `#lab-stage` — パソコン画面の再現。中身はすべて `guide.js` が描く
- `#lab-guide` — 赤枠に添える白文字の案内
- `#lab-keytoast` — 押したキーの表示
- `#lab-explanation` — 直前の操作で何が変わったかの説明
- `#reset-lab` — 最初に戻る
- `#lab-fast` — アニメーションを速くする
- `#close-lab` — モーダルを閉じる。`<dialog>` の標準操作により Escape でも閉じられる
- `.lab-sources` — 再現した画面の出典と確認日

以前あった `#node-download-sim`、`#node-download-action`、`#lab-action`、`#lab-loader`、`stages` 配列、`advanceWithLoading()` は廃止しました。

## 再現に使っている値

`guide.js` の先頭に定数としてまとめています。更新するときは公式資料で確認し、`index.html` の `.lab-sources` の確認日も直してください。

| 定数 | 内容 | 確認日 |
|---|---|---|
| `NODE_V` / `NPM_V` | Node.js LTS と同梱 npm のバージョン | 2026-10-10 |
| `EXPRESS_V` | Express のバージョンと `npm install express` の出力 | 2026-10-10 |
| VS Code の日本語表記 | 日本語言語パックの文言 | 2026-10-10 |
| Render の項目名 | New > Web Service、Build Command、Start Command、Create Web Service | 2026-10-10 |

次の点は公式の文言どおりではなく、説明用に簡略化した再現です。

- Node.js Setup の各ページの文面と、ユーザー アカウント制御の見た目
- Render のダッシュボード、設定フォーム、デプロイログの見た目と行数
- `npm init -y` が出力する `package.json` の細部（npm のバージョンで変わります）
- 公開URL `sample-api-x7k2.onrender.com`、ユーザー名 `you` は架空の値

各製品のロゴは使わず、汎用の線画アイコンで表しています。

## アニメーション

主なCSSクラス・キーフレーム:

- `.guided` / `@keyframes lab-guided` — 次に押す場所の赤枠
- `.guide-label.is-nudge` / `@keyframes lab-nudge` — 違う場所を押したときの案内の揺れ
- `.lab-window.is-opening` / `@keyframes lab-win-in` — アプリが開くとき
- `.lab-caret` / `@keyframes lab-blink` — 入力位置のカーソル
- `.is-new` / `@keyframes lab-file-new` — エクスプローラーに増えたファイルの強調
- `@keyframes lab-spin`、`@keyframes lab-pop` — 読み込み、キー表示

`prefers-reduced-motion: reduce` の利用者には、CSSのアニメーションを止め、`run` の再生も待ち時間なしで結果だけを表示します。この配慮は削除しないでください。

## 守るべき仕様

- 実際のインストール、ファイル操作、コマンド実行、アカウント作成、ネットワーク要求を追加しない
- 学習用の再現画面である旨を維持する
- 進行先は赤枠と白文字の案内で分かるようにする
- 閉じるボタンと Escape でモーダルを閉じられる状態を維持する
- モバイル幅でも横にはみ出さないようにする
- 固定ランチャーは `sticky`、`bottom: 0` を維持する
- `guide.js` の構文確認を通す
- 画面内で `<section>` や `<pre>` など本文と同じタグを使うと、ページ共通のCSS（余白や折り返し）が効きます。使うときは見た目を確認する

## 変更後の確認

PowerShellで実行します。

```powershell
Set-Location 'C:\Users\owner\Desktop\knowledge-sorrounding-AI'
node --check api/guide.js
git diff --check -- api/index.html api/style.css api/guide.js api/SIMULATOR.md
```

ブラウザでは次を確認します。

1. ランチャーからモーダルが開き、STEP 1 の Node.js ダウンロード画面と公式リンクが出る
2. 赤枠を押すたびに、入力・出力・ファイルの増加などが画面内で順に変わる
3. 赤枠以外を押しても進まない
4. 最後（STEP 8 完了）まで進める
5. 章ナビの 1〜8 で、各章の最初の状態に移れる
6. 「最初から練習する」と「閉じる」、Escape が使える
7. 狭いスマホ幅でも横にはみ出さず、案内が画面内に収まる
