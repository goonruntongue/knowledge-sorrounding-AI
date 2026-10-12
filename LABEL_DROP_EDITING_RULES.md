# Label Drop（about-ia/app）の改変ルール

> 決めた日: 2026-10-01
> 対象: このリポジトリ（knowledge-sorrounding-AI）で作業する AI（Codex など）と人
> **`about-ia/app/` に手を入れる前に、必ずこの文書を読んでください。**
> 最新の状況（2026-10-03 時点）は `CODEX_HANDOFF_LABEL_DROP.md` を参照。

## 1. 結論

**Label Drop のソースの原本（唯一の正）は、このリポジトリではありません。**

| 項目 | 場所 |
|---|---|
| ソースの原本（ここで直す） | `C:\Users\owner\Desktop\Apps\IA-DX`（GitHub: `goonruntongue/label-drop`） |
| 公開先（ビルド結果を置くだけ） | このリポジトリの `about-ia/app/dist/` |

- `about-ia/app/dist/` は、IA-DX でビルドした結果で**丸ごと上書き**されます。
- `about-ia/app/src/` などのソースは、IA-DX の写しを参照用に置いているだけです。Git には入れていません。

## 2. やってはいけないこと

- `about-ia/app/dist/` の中のファイル（`assets/*.js`、`index.html`、`precache.json`、`sw.js` など）を**直接書き換える**
- `about-ia/app/src/` を直して、ここでビルドして `dist` を出す

どちらも、次に IA-DX から上書きしたときに**変更が消えます**。

> 実際にあったこと（2026-10-01）
> ここで直接、ヘッダーの変更が 4 回行われました（`69791cf`、`8a9a49f`、`85f7d37`、`65ebd83`）。
> このときは、上書きの前に気づいて IA-DX へ手で取り込んだので消えずに済みました。
> 気づかなければ、タイトルのリンク先と「← 前に戻る」の出し分けが消えていました。

## 3. アプリを直したいとき

1. **IA-DX（`C:\Users\owner\Desktop\Apps\IA-DX\app`）で直す。**
2. IA-DX で確認する。
   ```bash
   npm --prefix app run typecheck
   npm --prefix app run build
   ```
3. IA-DX を `goonruntongue/label-drop` の `main` に push する（開発版の GitHub Pages に自動で出る）。
4. ポータルへの反映は、ユーザーが「ポータルに反映して」と言ったときに行う。
   手順は IA-DX の `docs/PORTAL_DEPLOY.md` のとおり。

IA-DX を開けない環境で作業している場合は、**ここで直さずに、直したい内容をユーザーに伝えてください。**

## 4. どうしても、ここで直接直してしまったとき

急ぎで直した場合も、必ず次の 3 つを行ってください。

1. コミットメッセージに、何を直したかを具体的に書く（例:「Label Drop: ヘッダーの戻るボタンの遷移先を変更」）。
2. 直したソース（`about-ia/app/src/` 側）も、`dist` と同じ内容にしておく。
3. **ユーザーに「ポータル側で Label Drop を直接直した」と必ず伝える。**
   ユーザーがそれを IA-DX に取り込んでから、次の反映を行います。

`dist` の中の JS を手で書き換えることは避けてください。ソースに残らないため、IA-DX へ取り込めません。

## 5. ここで自由に変えてよいもの（Label Drop の外）

次はポータル専用のファイルです。IA-DX からは上書きしません。

- `about-ia/index.html`（IA ワンシートの LP）
- `about-ia/manifest.webmanifest`、`about-ia/sw.js`（LP 用の PWA）
- `about-ia/assets/` の LP 用の画像とアイコン（`ia-app-icon.png`、`ia-pwa-192.png`、`ia-pwa-512.png` など）

LP からアプリへのリンク（`app/dist/`）を変える場合は、その旨をユーザーに伝えてください。アプリの「← 前に戻る」は、LP（`/about-ia/` か `/about-ia/index.html`）から開かれたかどうかで表示を切り替えています。

## 6. 参考

- IA-DX の `CLAUDE.md`、`docs/PORTAL_DEPLOY.md`（反映の手順と、上書きしてよい場所・いけない場所）
- IA-DX の `docs/SPEC.md`（アプリの仕様と決定事項）
