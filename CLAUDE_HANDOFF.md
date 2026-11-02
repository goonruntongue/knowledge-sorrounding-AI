# Claude Code 引き継ぎメモ（2026-10-11 17:10 時点）

前のスレッドが長くなったため、ここまでの流れと現在の状態をまとめました。新しいスレッドは、まずこのファイルと下の「最初に読むファイル」を読んでから始めてください。

- リポジトリ: `goonruntongue/knowledge-sorrounding-AI`（ローカル: `C:\Users\owner\Desktop\knowledge-sorrounding-AI`）
- 中身: HTML / CSS / 素の JavaScript で作った教材サイト（ポータル ＋ 各ガイドページ）
- このファイルは Git に入れていません（未追跡のまま置いています）

## 最初に読むファイル

| ファイル | 内容 |
|---|---|
| `AGENTS.md` | 教材ページ共通のルール（フォント、ポータルへ戻るボタン、`#toTop`、ランチャー、シミュレーターの注意、出典と確認日） |
| `PORTAL_PUBLISH_RULES.md` | 公開の手順。**GitHub の main と Cloudflare Pages の両方を、必ず同じ版にそろえる** |
| `api/SIMULATOR.md` | API シミュレーターの編集ガイド（構成、状態、手順の足し方、守る仕様） |
| `api/screenshot/render/about-render-usage.txt` | Render のつなぎ方の要点メモ（シミュレーターの説明に反映済み） |

## 現在の状態

- ブランチは `main`。ローカルと `origin/main` は同じ（`6ca9c0f`）。
- 本番（Cloudflare Pages）と GitHub Pages も `6ca9c0f` と同じ内容になっていることを確認済み。
  - 本番: https://knowledge-surrounding-ai.pages.dev/
  - GitHub Pages: https://goonruntongue.github.io/knowledge-sorrounding-AI/
- `api/` 配下に未コミットの変更はない。
- **作業フォルダには Codex の作業中の変更がある**（`server/index.html` の変更、`server/assets/*.png` の削除と追加など）。これは Claude の変更ではないので、触らない・勝手にコミットしない。

直近のコミット（新しい順）:

| コミット | 内容 | 作業者 |
|---|---|---|
| `6ca9c0f` | サーバーページの挿絵とカードの見た目 | Codex |
| `97ba9f1` | API シミュレーターを実物の画面に合わせて作り直し（9章・62操作） | Claude |
| `adf24fc` | API の料金の説明 | Codex |
| `cad41ae` | 「07 / 外部APIを使う」セクション | Codex（push は Claude） |
| `6a8f4a0` | ポータルにダークモードの切り替え | Claude |
| `6fd5b89` | シミュレーターの「ことばメモ」、練習用の注意書き、AI への依頼文の記入欄 | Claude |
| `85b248f` | 公開先の比較表をスマホで横スクロール ＋ ScrollHint | Claude |
| `c6e8b3f` | API シミュレーターを「画面が変わっていく」形に全面作り直し | Claude |

## このスレッドでやったこと（古い順）

1. **ai-agents ページ**: ChatGPT / Codex / Claude Code のシミュレーターを実画面に合わせて作り直し、文字量を減らす挿絵・アイコンを追加、ガイドを切れる自由モードを追加。main へ反映済み。
2. **git-github ページの Lottie 化**: 試したが取りやめ。main は元に戻し、ポータルのオーブの影だけ残した。
3. **API ページのシミュレーター（1回目）**: ローディングバーをやめ、Node.js の入手から Render での公開までを1クリックずつ再生する形に作り直した。
4. **API ページの細かい改善**: 公開先の比較表の横スクロールと ScrollHint、各操作の「ことばメモ」、練習用で本物と見た目が違う旨の注意書き、AI への依頼文を記入式に変更。
5. **ポータル**: ダークモードの切り替えスイッチ（ポータルのページだけ。初期はライト、選択は `localStorage` の `ksa-theme` に記憶）。
6. **API ページのシミュレーター（2回目）**: `api/screenshot/` の実物の画像と Render のメモをもとに、Node.js インストーラー、VS Code の「ようこそ」とフォルダー選択、Render の一連の画面を作り直した。GitHub と Render を別の章に分けて全 9 章・62 操作。

## API シミュレーターの要点

詳しくは `api/SIMULATOR.md`。ここでは引き継ぎに必要な点だけ。

- ファイルは `api/index.html`（`#api-lab` の外枠）、`api/guide.js`（状態・描画・手順）、`api/style.css`。
- しくみは「状態オブジェクト → HTML を作る関数 → `steps` 配列（1要素 = 1クリック）」。章ジャンプは最初の状態から `steps` を流し直して作るので、`run` は状態だけを書き換える。
- 説明文は3か所: `hint`（これから何をするか）、`about`（ことばメモ）、`explain`（何が変わったか）。
- Render の章は実物どおり、`yarn install`・`node server.js`・有料の `$7 / month` が最初から入っている。Free、`npm install`、`npm start` に直す操作になっている。
- 読み込み番号は `style.css?v=sim-v9` / `guide.js?v=sim-v9`。CSS や JS を変えたら番号を上げる。
- 実物どおりではない部分: GitHub 連携の許可画面（画像がなく簡略化）、ユーザー アカウント制御、名前・URL・ID（すべて架空）、ロゴ（文字と図形の目印）。

## 守ること

- **コミットしないもの**: `api/screenshot/`、`ai-agents/for-simulator/`（どちらも個人の情報が写った画像）、`ai-agents/PRD.md`、`ai-agents/ai-agents-simulator-handoff.md`、`.claude/`、`.wrangler/`、未追跡の `ssh/` と `server/` の素材。`git add -A` は使わず、ファイルを名指しで追加する。
- **Codex と同じ作業フォルダを使っている**。Codex の未コミットの変更が混ざることがあるので、コミット前に `git status` と `git diff` で自分の変更だけか確認する。Codex の「push した」が実際には届いていないこともあったので、`git fetch` と `git ls-remote` で確かめる。
- **コミットと push は、ユーザーに言われたときだけ**。公開済みの履歴は書き換えない（取り消しは revert で行う）。
- **公開は両方**: main へ push したら、同じコミットを `git archive` で取り出して `AGENTS.md` と `.codex/` を除き、`npx wrangler pages deploy` で Cloudflare に上げる。そのあと両方の内容がコミットと一致するか確認する。
- シミュレーターは学習用の再現で、実際のインストール・ファイル操作・コマンド実行・通信・アカウント操作はしない。名前や履歴は架空にする。
- コミットメッセージの末尾は `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## 確認のやり方（この環境の癖）

- アプリ内のブラウザペインは、画面が描画されていないことがある。その状態では PC 幅のスクリーンショットが縮小されて読めず、`<dialog>` の `close` イベントも届かない。**動作の確認は JavaScript の実行で、見た目の確認は headless の Edge で**行うのが確実だった。
- 見た目の確認は、一時的なドライバーページ（`api/_drive.html`）を作り、iframe でページを開いて赤枠を n 回クリックしてから撮影する。**コミット前に必ず削除する。**
- 静的サーバーは `.claude/launch.json` の `static`（`python -m http.server 8123`）。`preview_start` で起動する。
- Bash のヒアドキュメントに日本語や長い CSS を入れると壊れる。ファイルは Write で書き、スクリプトからは UTF-8 で読む。
- 変更後は `node --check api/guide.js` と `git diff --check -- api/` を通す。

撮影コマンドの形（Edge の場所とプロファイル用フォルダーは環境に合わせる）:

```bash
msedge.exe --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --user-data-dir="<一時フォルダー>" --window-size=1280,900 --virtual-time-budget=150000 \
  --screenshot="<出力先>.png" "http://localhost:8123/api/_drive.html?n=<クリック数>"
```

- スマホ幅は `&w=390&h=820` を付けて `--window-size=400,860`。
- 動きを減らす設定の確認は `--force-prefers-reduced-motion` を足す。
- 同時に複数起動すると失敗するので、1つずつ順番に実行する。

## 残っていること

- いま依頼されている作業はない。
- Codex が `server/` を作業中。終わったら、ユーザーの指示で push と Cloudflare への反映を確認する流れになる見込み。
- 実物の画像があれば精度を上げられる所: GitHub 連携の許可画面、Windows のユーザー アカウント制御、Render でサービスが1つもないときのダッシュボード。
