# ポータルの公開ルール（「ポータルに反映して」の手順）

> 決めた日: 2026-10-02（ユーザーの決定）
> 対象: このフォルダ `C:\Users\owner\Desktop\knowledge-sorrounding-AI`（GitHub: `goonruntongue/knowledge-sorrounding-AI`）を扱う AI（Codex / Claude Code）
> Claude Code 側（`C:\Users\owner\Desktop\Apps\IA-DX`）も同じ手順で動く。
> 最新の状況（2026-10-03 時点）は `CODEX_HANDOFF_LABEL_DROP.md` を参照。

## 1. 公開先（2か所。いつも両方を同じ版にそろえる）

| 公開先 | 中身 | URL |
|---|---|---|
| GitHub（`origin/main`）＝ GitHub Pages | リポジトリの `main` そのもの | https://goonruntongue.github.io/knowledge-sorrounding-AI/ |
| **Cloudflare Pages**（プロジェクト `knowledge-surrounding-ai`） | `origin/main` と**同じコミット**から、公開しないファイルを除いたもの | https://knowledge-surrounding-ai.pages.dev/ |

- 今後の本番は Cloudflare。GitHub Pages は、止めるとユーザーが決めるまで並行して残す。
- Cloudflare への反映は**手動**（GitHub 連携の自動デプロイは使わない）。「ポータルに反映して」のたびに、下の手順で両方を更新する。

## 2. 「ポータルに反映して」と言われたら

1. **反映先のブランチを、毎回ユーザーに確認する**（これまでは毎回「main に直接」）。
   - 手元のフォルダは別のブランチ（例: `git-github-lottie-illustrations`）で作業中のことがある。**ユーザーが開いているブランチや、コミットしていない変更には触らない。**
   - `origin/main` から一時的な worktree を作り、そこで変更を入れてコミットする。
2. **GitHub に push する**（確認したブランチへ。通常は `main`）。
3. **同じコミットを Cloudflare Pages に上げる**。手元の作業中のファイルではなく、push 済みのコミットから作る:

   ```bash
   cd C:/Users/owner/Desktop/knowledge-sorrounding-AI
   git fetch origin
   SHA=$(git rev-parse origin/main)
   OUT=<一時フォルダ>/portal-publish            # 空の一時フォルダ
   mkdir -p "$OUT"
   git archive "$SHA" | tar -x -C "$OUT"       # push 済みの main だけを取り出す
   # 公開しないもの（AI 向けのルールや設定）を除く
   rm -f  "$OUT/AGENTS.md"
   rm -rf "$OUT/.codex"
   npx wrangler pages deploy "$OUT" \
     --project-name knowledge-surrounding-ai \
     --branch main \
     --commit-hash "$SHA" \
     --commit-message "Deploy $(git log -1 --format=%s "$SHA")"
   ```

4. **確認する**: 次の URL が 200 で開き、新しい版になっていること。
   - https://knowledge-surrounding-ai.pages.dev/
   - https://knowledge-surrounding-ai.pages.dev/about-ia/
   - https://knowledge-surrounding-ai.pages.dev/about-ia/app/dist/（Label Drop）
   - 反映直後は古い版が見えることがある（ブラウザや Service Worker のキャッシュ）。開き直して確認する。
5. ユーザーに、GitHub のコミット ID と Cloudflare のデプロイ URL を報告する。

## 3. Cloudflare で守ること（課金を起こさない）

- アカウント（goonruntongue@gmail.com）は **Workers / Pages とも無料プランのまま**。アップグレード、有料のアドオン、カードの登録はしない。
- 無料枠を超えたときに**課金ではなくエラーになる**ものだけを使う。
- 作業してよい Cloudflare のプロジェクトは `knowledge-surrounding-ai` だけ。**同じアカウントにある他の Pages / Worker / D1 には触らない**（作成・上書き・削除しない）。
- 新しいプロジェクトを作るときは、事前にユーザーに確認する。`*.pages.dev` の名前が他の人に取られていて、後ろに文字が付きそうなときは、作らずに止めてユーザーに知らせる。

## 4. Label Drop（`about-ia/app/`）について

- Label Drop のソースの原本は `C:\Users\owner\Desktop\Apps\IA-DX`（GitHub: `goonruntongue/label-drop`）。**このフォルダで Label Drop を直接直さない。**
- 詳しくは同じフォルダの `LABEL_DROP_EDITING_RULES.md` を読む。
- Claude Code が Label Drop を反映したときも、`about-ia/app/dist` を `main` に push したあと、上の手順 3〜4 で Cloudflare にも上げる。

## 5. やってはいけないこと

- コミットしていない手元のファイルを、Cloudflare に直接上げる（GitHub と中身がずれる）。
- GitHub だけ、または Cloudflare だけを更新して終える（必ず両方）。
- `AGENTS.md`、`.codex/` を Cloudflare に上げる。
- ポータル LP（`about-ia/index.html` など）を、Label Drop のビルドで上書きする。
