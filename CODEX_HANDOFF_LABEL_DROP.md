# Codex への引き継ぎ：Label Drop とポータルの現状（2026-10-03）

> 書いた人: Claude Code（`C:\Users\owner\Desktop\Apps\IA-DX` で Label Drop を開発している AI）
> 読む人: このフォルダ（`C:\Users\owner\Desktop\knowledge-sorrounding-AI`）で作業する Codex
> 目的: 2026-10-01〜03 に Claude 側で行ったことを伝え、このフォルダを最新の状態にそろえてもらうこと。
> あわせて読む: 同じフォルダの `PORTAL_PUBLISH_RULES.md`（公開の手順）と `LABEL_DROP_EDITING_RULES.md`（Label Drop を直接直さない決まり）。

---

## 1. 用語

- **「ポータル」＝このフォルダ**（`C:\Users\owner\Desktop\knowledge-sorrounding-AI`、GitHub: `goonruntongue/knowledge-sorrounding-AI`）。
- **Label Drop**＝IA（情報アーキテクチャ）のグルーピングとラベリングを練習する 3D ゲーム。ポータルでは `about-ia/app/dist/` に置いてある。
- **原本（唯一の正）**＝`C:\Users\owner\Desktop\Apps\IA-DX`（GitHub: `goonruntongue/label-drop`）。Label Drop はここでしか直さない。

## 2. いまの公開状態

| 公開先 | 中身 | URL |
|---|---|---|
| ポータル（Cloudflare Pages、**今後の本番**） | `origin/main` の `db9d94b` | https://knowledge-surrounding-ai.pages.dev/ （Label Drop: `/about-ia/app/dist/`） |
| ポータル（GitHub Pages、並行して公開中） | 同じ `db9d94b` | https://goonruntongue.github.io/knowledge-sorrounding-AI/ |
| Label Drop の開発版（GitHub Pages） | label-drop の `main` | https://goonruntongue.github.io/label-drop/app/ |

- `db9d94b` は label-drop `59e3d6d` のビルド。**静的な版（AI なし）、お題43問**。
- Cloudflare Pages のプロジェクト名は `knowledge-surrounding-ai`（綴りは surrounding。リポジトリ名の sorrounding とは違う）。

## 3. 2026-10-01〜03 に決まったこと（Label Drop）

1. **ポータルの公開先に Cloudflare Pages を追加**（10-02）。「ポータルに反映して」では、GitHub の `main` と Cloudflare Pages の**両方を同じコミット**にそろえる。手順は `PORTAL_PUBLISH_RULES.md`。
2. **アプリの改善**（10-02）：設定パネル（文字サイズ・モーション・色覚サポート）、スマホのヘッダー2行化、ピンチ拡大の禁止、音が最初のタッチから鳴るように修正、ブロックがお題カードの下に隠れないように配置を改善、レベルアップ演出を長く、お題カードのボタンを「くわしく」「－」に分けた、など。
3. **AI 作問を試して、やめた**（10-02〜03）。
   - Cloudflare Workers AI でお題を自動生成する仕組みを作ったが、実際に遊ぶと、テンプレより分け方があいまいだった。
   - Claude が監修した13問だけを残し、**アプリに内蔵した**（label-drop の `app/src/data/topics-curated.ts`）。
   - **今後、お題は Claude が会話の中で作り、アプリに内蔵する。Workers AI は使わない**（label-drop の `docs/SPEC.md` 決定事項 #25）。
   - アプリは**静的に動く**。AI 関連の機能は、ビルドで `VITE_AI=on` を付けたときだけ有効（既定は無効）。
4. **Cloudflare の Worker と D1 は残している**（将来の教室モード用）。
   - Worker `label-drop-api`（https://label-drop-api.goonruntongue.workers.dev ）、D1 `label-drop`。
   - 定期実行（Cron）は停止済み。今のアプリはこの API を呼ばない。
5. **将来の構想：教室モード**（講師がチームを作り、生徒がログインしてチームで同じお題を解き、リアルタイムに相談・提出・結果発表する）。仕様の下書きは label-drop の `docs/CLASSROOM_SPEC.md`。管理者なしで進める「セルフモード」も含む。

## 4. Cloudflare で守ること（ユーザーの決定）

- アカウントは **Workers / Pages とも無料プランのまま**。アップグレード、有料のアドオン、カードの登録はしない。従量課金が自動で起きることはしない。
- このフォルダの作業で触ってよい Cloudflare のものは、Pages プロジェクト `knowledge-surrounding-ai` だけ。`label-drop-api`、D1 `label-drop`、ほかのプロジェクトには触らない。

## 5. このフォルダの状態（2026-10-03 時点）と、そろえ方

- 手元は `git-github-lottie-illustrations` ブランチ。**このブランチに独自のコミットはなく、`origin/main` より11コミット遅れているだけ**（遅れているのは、Claude が `main` に直接 push した `about-ia/app/dist` の更新だけ）。手元の `main` は `origin/main` より38コミット遅れている。
- 手元で変更中の追跡ファイルはない（Git 管理外のファイルは多数ある。下を参照）。

**最新にそろえる手順**（必ずユーザーに確認してから行う）:

```bash
cd C:/Users/owner/Desktop/knowledge-sorrounding-AI
git fetch origin
git status                                   # 変更中の追跡ファイルがないことを確認
git merge --ff-only origin/main              # 作業中のブランチを main に追いつかせる（独自のコミットがないので早送りで済む）
git branch -f main origin/main               # 手元の main も最新に（main を開いていないとき）
```

- 早送りできない（`--ff-only` が失敗する）場合は、何かが変わっているので、止めてユーザーに相談する。
- `about-ia/app/dist/` は、IA-DX のビルドで丸ごと上書きされる場所。ここで直さない。

**Git 管理外のもの**（このまま置いておいてよい）:

| もの | 説明 |
|---|---|
| `about-ia/app/src/`、`public/`、`icons/`、`scripts/`、`index.html`、`package*.json`、`tsconfig.json`、`vite.config.ts` | IA-DX のソースの**参照用の写し**。Claude が反映のたびに IA-DX と同じ内容にしている。ここで直さない |
| `LABEL_DROP_EDITING_RULES.md`、`PORTAL_PUBLISH_RULES.md`、この文書 | AI 向けのルールと引き継ぎ |
| `.wrangler/`（`cache/`、`tmp/`） | Claude が Cloudflare Pages へ公開したときに wrangler が作った作業用フォルダ。消してもよい。Git に入れない（`.gitignore` に `.wrangler/` を足すかは、ユーザーに確認してから） |

## 6. Codex がこのあとすること

1. この文書、`PORTAL_PUBLISH_RULES.md`、`LABEL_DROP_EDITING_RULES.md` を読む。
2. ユーザーの了解を得て、5 の手順でこのフォルダを最新にそろえる。
3. 以後、ユーザーに「ポータルに反映して」と言われたら、`PORTAL_PUBLISH_RULES.md` の手順で、**GitHub の `main` と Cloudflare Pages の両方**を同じコミットにそろえる。反映先のブランチは毎回ユーザーに確認する（これまでは毎回「main に直接」）。
4. Label Drop の中身（お題・画面・動き）を変えたいと言われたら、ここでは直さず、**IA-DX（Claude 側）で直すようユーザーに伝える**。

## 7. 参考（IA-DX 側の文書）

- `C:\Users\owner\Desktop\Apps\IA-DX\docs\HANDOFF.md`（Claude 側の引き継ぎ）
- `C:\Users\owner\Desktop\Apps\IA-DX\docs\PORTAL_DEPLOY.md`（ポータルへの反映手順）
- `C:\Users\owner\Desktop\Apps\IA-DX\docs\SPEC.md`（仕様と決定事項 #1〜#25）
- `C:\Users\owner\Desktop\Apps\IA-DX\docs\CLASSROOM_SPEC.md`（教室モードの構想）
