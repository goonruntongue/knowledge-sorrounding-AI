# AIエージェント練習室（ai-agents）UI再設計 引き継ぎメモ

作成日: 2026-09-28
対象リポジトリ: `goonruntongue/knowledge-sorrounding-AI`
作業ブランチ: `claude/ai-agent-simulator-ui-redesign-waxx1p`（origin にプッシュ済み・main 未マージ）
最新コミット: `6c1b0bc`

このメモは、クラウド上の Claude Code セッションで行った作業を、ローカルの作業ディレクトリで再開するための要約です。次の担当（人でも AI でも）がこれを読めば、何をどこまでやったか・どう検証したか・残課題は何かが分かるように書いています。

---

## 1. ローカルで再開する手順

```bash
git clone https://github.com/goonruntongue/knowledge-sorrounding-AI.git
cd knowledge-sorrounding-AI
git fetch origin
git checkout claude/ai-agent-simulator-ui-redesign-waxx1p
# 確認: git log --oneline -6 で 6c1b0bc が先頭
```

ローカルで画面を見るには、リポジトリ直下で簡易サーバーを立てて `ai-agents/index.html` を開きます（`file://` でも動きますが、フォントとSVGの読み込みはサーバー経由が確実）。

```bash
python3 -m http.server 8123
# → http://localhost:8123/ai-agents/index.html
```

公開サイト（https://goonruntongue.github.io/knowledge-sorrounding-AI/ai-agents/index.html）は **main から配信**されているため、このブランチの内容は main にマージするまで反映されません。マージ後は AGENTS.md の規約に従い、デプロイ反映を確認したうえで `?v=<コミットID>` を付けたリンクを共有してください。

ブランチ内容のプレビュー（コミット固定・外部サービス）:
`https://rawcdn.githack.com/goonruntongue/knowledge-sorrounding-AI/6c1b0bc/ai-agents/index.html`

---

## 2. 依頼の経緯（時系列）

1. **初回依頼**: 公開中の AI エージェント学習シミュレーターを分析し、見た目を本物の ChatGPT アプリ / Claude Code アプリに近づける。機能（練習の手順・判定）は変えない。見た目のために必要な場合だけプログラムを拡張してよい。
2. **ツアーガイド**: 押す場所の真横に「ここをクリック」の吹き出しを浮かせてほしい。
3. **アイコン**: 自作せず、渡した SVG を使う。→ ユーザーが `ai-agents/ChatGPT-Logo.svg`、`ai-agents/Claude-ai-icon.svg`、`ai-agents/Google-gemini-icon.svg` を main にプッシュ（コミット `25897d9`）。ブランチへマージ済み。
4. **Windows 風**: Mac 風（信号3色）ではなく Windows の見た目に。
5. **実機スクリーンショットに基づく修正**: ChatGPT Work でもプロジェクトフォルダを紐づけられる／Codex 切替時の画面構成／「スキル= /、プラグイン= @」の対応関係を調査して合わせる。

---

## 3. 変更したファイル

すべて `ai-agents/` 配下。ページ本体（解説部分）は最小限の変更に留め、練習室（`<dialog id="lab">`）の描画を全面的に組み替えました。

| ファイル | 役割 | 主な変更 |
|---|---|---|
| `index.html` | 教材ページ | 3枚のカードと Claude 図解のマークを SVG に置換。練習室の説明文、`@` と `/` の対応表、出典を追加。アセットのキャッシュ用クエリを `?v=7` に更新 |
| `chatgpt-lessons.js` | `window.LabUI`（共通アイコン・マーク・ツアー吹き出し）＋ `window.ChatGPTLessons`（使い分け／スキル／プラグインの3コース） | 全面書き直し。状態機械とアクション名は旧版と同じ |
| `simulator.js` | Codex コース／Claude Code コースの描画と、ダイアログ・タブ・#toTop の制御 | 全面書き直し。状態機械とアクション名は旧版と同じ |
| `style.css` | ページ＋練習室のスタイル | 練習室部分を全面書き直し（`/* ===== Practice lab` 以降） |
| `chatgpt-lessons.css` | ページ側（03/04 節）の補助スタイル | 練習室向けの旧ルールを削除し、対応表のスタイルを追加 |
| `img/github.svg`, `img/README.md` | GitHub の公式マーク（Simple Icons, CC0）と出典 | 新規 |

`AGENTS.md`（リポジトリ規約）は変更していません。守るべき規約: Poppins / Noto Sans JP、ポータルへ戻るボタン、#toTop の挙動、sticky ランチャー、練習は学習用の再現である明記、赤枠・白文字のガイド、出典と確認日の記載、公開リンクには更新識別クエリ。

---

## 4. 設計の要点

### 4.1 「アプリ層」と「教材層」の分離
- 練習室の中身は `.app-window`（疑似デスクトップウィンドウ）として描画。ChatGPT / Codex はライトテーマ、Claude はダークテーマ（背景 #262624、アクセント #d97757）。
- 教材だけの要素（課題カード、「次の依頼を試す」など実アプリに無い操作）は `.lab-layer`（赤い点線枠）にまとめ、実アプリの要素と見分けられるようにした。
- 次に押す対象には `.guided`（赤い枠線）を付け、`LabUI.tour` がその要素の真下（入らなければ真上）に `.tour-tip`（「ここをクリック / ここに入力」＋一言）を浮かべる。対象の `data-tip` 属性が一言になる。スクロールで対象が隠れると吹き出しも隠れ、リサイズ・スクロールに追従。

### 4.2 状態機械（機能は旧版のまま）
- `simulator.js`: `app`（modes / skills / plugins / codex / claude）、`stage` 0〜6、`mode`（権限）、`menu`（開いているポップオーバー: product / folder / permission）、`prompt`、`running`。アクション名: activate, folder, select-folder, permission, permission-done, sample, send, approve, deny, continue, execute-edits, execute-auto, stop, preview, reset, switch-app（追加: product-menu＝左上メニューを開く、noop）。
- `chatgpt-lessons.js`: `course`、`step`、`screen`（ChatGPT / Codex）、`selected`（Chat / Work / Codex）、`task`、`input`、`mention`、`installed`、`connected`、`menu`、`search`、`skillRoute`。アクション名（`data-learn`）: selector, product-chatgpt, product-codex, mode-Chat, mode-Work, try-mode, next-mode, open-skills, installer, creator, save-skill, open-plugins, search, details, install, connect, authorize, cancel-connect, new-chat, mention, example, send, again。
- 見た目のために追加した振る舞い: 製品切替の2段階メニュー、フォルダ／権限のポップオーバー、`/` `$` `@` の候補ポップアップ、ツール行を段階的に出すストリーミング表示、モバイル用ナビ帯（サイドバー非表示時に切替・サイドバー操作へ到達させる）。

### 4.3 実機 UI の再現内容
**ChatGPT（Chat / Work）**
- 上部中央に Chat | Work のセグメントトグル。サイドバー: 新しいチャット／チャットを検索／ライブラリ／プロジェクト／スキル／プラグイン／最近／アカウント。左上の「ChatGPT ▾」で ChatGPT / Codex を切替。
- 空状態の見出し: Chat「お手伝いできることはありますか？」、Work「何に取り組みましょうか？」。プレースホルダ: Chat「質問してみましょう」、Work「Work モードで作成」。
- 入力欄の下段: 左「+」「承認チップ」、右「🌙 GPT-5.6 Luna 軽 ▾」「マイク」「黒丸ボタン（未入力=音声、入力あり=送信↑）」。
- Work では入力欄の下に灰色トレイ「📁 プロジェクトを選択」「@ プラグイン」「💻」。
- 承認チップは「フルアクセス」のときオレンジ＋警告アイコン（実機準拠）。練習の初期値は「承認を求める」。

**Codex（ChatGPT アプリ内）**
- サイドバー: 新しいチャット／検索 Ctrl+G／プラグイン／オートメーション／ピン留め／プロジェクト／チャット。上部バーにプロジェクト名とブランチ `main`、編集後は `+1 −1` の差分ピル。
- 空状態: 雲型ターミナルの線画＋「何を作成しましょうか？」。入力欄の上に灰色トレイ「📁 プロジェクトを選択」（練習のフォルダ選択はここ）。プレースホルダ「何でもどうぞ」。
- ネットワーク承認カード（`curl https://html.spec.whatwg.org/`、「許可しない／今回のみ許可」）、ツール行（読み取り／編集 index.html）、差分カード、ブラウザペイン。

**Claude Code（Claude デスクトップ Code タブ）**
- タイトルバー中央に「チャット | Cowork | Code」タブ。サイドバー: 「+ 新しいセッション」、プロジェクト別フィルタ、セッション一覧（状態ドット）。
- 空状態: Claude アイコン＋「何をつくりましょうか？」＋「タスクを入力して Enter で開始」。
- 入力欄の下段: 左「+」「🏠 ローカル ▾」「📁 フォルダを選択 ▾」、右「🛡 権限モード ▾（プラン／編集を受け入れる／自動）」「Claude Opus 5.5 ▾」「送信」。
- プランカード（「編集を受け入れるで実行／自動で実行」）、ツール行（Read / Edit index.html）、`+1 -1` ピル、差分カード、ブラウザペイン。

**Windows 風ウィンドウ枠**
- タイトルバー左にアプリアイコン＋名前、右に「─ ☐ ✕」（✕ ホバーで赤）。角丸 8px。フォントは Segoe UI → Yu Gothic UI → Meiryo → Noto Sans JP。ショートカット表記は Ctrl+G。ブラウザペインは ← → の戻る・進む。

### 4.4 アイコン
- ChatGPT / Codex: `ChatGPT-Logo.svg`（Codex 専用アイコンは未提供のため ChatGPT のロゴを流用。提供されれば `LabUI` の `codexMark` を差し替えるだけ）。
- Claude: `Claude-ai-icon.svg`。Google（Antigravity カード）: `Google-gemini-icon.svg`。
- GitHub: `img/github.svg`（Simple Icons、CC0）。ユーザー提供の GitHub ロゴがあれば差し替える。
- それ以外の線画アイコン（フォルダ、検索、マイクなど）は `chatgpt-lessons.js` 冒頭の `paths` に定義した汎用ラインアイコン。雲型ターミナルの線画（`cloudterm`）は Codex 空状態の挿絵の近似。

### 4.5 `/` と `@` の対応（調査結果・2026-09-28）
| | スキル | プラグイン |
|---|---|---|
| ChatGPT（Chat / Work） | `/` のコマンド一覧に有効なスキルが並ぶ。`@` でも指定可 | `@` で指定（同梱スキルも @ から） |
| Codex アプリ | `/` または `$スキル名` | サイドバーの「プラグイン」から導入 |

出典: learn.chatgpt.com/docs/build-skills、learn.chatgpt.com/docs/reference/slash-commands、help.openai.com/en/articles/20001256-plugins-in-chatgpt-and-codex。
※ クラウド環境からは OpenAI 系ドメインへ直接アクセスできず、検索結果に引用された本文で確認。ローカルで再開したら本文を直接確認するとよい。

シミュレーターでは、スキルコース（Codex 画面）は `/` または `$` で候補が開き `$依頼文整理` が入る。プラグインコース（ChatGPT 画面）は `@` で候補が開き `@GitHub` が入る。

---

## 5. 検証方法

Playwright（Chromium）で全5コースの全ステップをデスクトップ幅 1280px とスマホ幅 390px で自動操作し、スクリーンショットで確認しました。スクリプトは `scratchpad` にあり（このメモと一緒に `shoot.mjs` を添付）。ローカルでは次のように使えます。

```bash
npm i -D playwright && npx playwright install chromium   # 初回のみ
node shoot.mjs ./shots        # ./shots に d-*.png（デスクトップ）と m-*.png（モバイル）
```

`shoot.mjs` はリポジトリ直下を 8123 番で配信し、`#launch` → 各コースの `data-learn` / `data-action` ボタンを順に押します。パスの先頭 `root` と Playwright の import パスをローカル環境に合わせて変更してください。

手動確認の観点:
- 各コースで赤枠と吹き出しが常に「次に押すもの」を指しているか。
- スマホ幅でサイドバーが消えたとき、モバイルナビ帯（`.mobile-nav`）から製品切替・スキル・プラグイン・新しいチャットに到達できるか。
- Escape とヘッダーの × でダイアログが閉じ、閉じたときに実行中のアニメーションが止まるか。
- `prefers-reduced-motion` でアニメーションが止まるか（既存の全体ルールで対応）。

---

## 6. 残課題・次にやりそうなこと

- **main へのマージと公開**: プルリクエストは未作成（ユーザーの指示待ち）。マージ後にデプロイ確認 → `?v=<コミットID>` 付きリンクを共有。
- **Codex 専用アイコン / GitHub ロゴ**: 提供されれば差し替え（`LabUI` の `codexMark`、`brand.github`）。
- **ChatGPT Chat モードの下トレイ**: 実機で Chat でもプロジェクト選択トレイが出るかは未確認（Work のスクリーンショットのみ確認）。現状は Work と Codex だけに表示。
- **モデル名・権限名の追随**: 「GPT-5.6 Luna 軽」「Claude Opus 5.5」「承認を求める／代わりに承認／フルアクセス」「プラン／編集を受け入れる／自動」はページ本文と揃えている。アプリ更新で変わったらページと `modes` 定義（`simulator.js` 冒頭）を同時に更新。
- **他ページとの整合**: ポータル掲載順の前後リンクや #toTop などは既存のまま。ai-agents 以外のページは触っていない。

---

## 7. コミット一覧（このブランチ）

```
6c1b0bc Match ChatGPT Work and Codex composers to the real app and use / for skills
9b1159e Use repository logos for app marks and switch simulator windows to a Windows look
f68b893 Merge remote-tracking branch 'origin/main' (25897d9 svg logo update を取り込み)
0113f9c Add floating tour tips that point at the next control in the simulators
8b73317 Restyle AI agent simulators after current ChatGPT, Codex and Claude Code UIs
```

## 8. 次回の指示例

- 「main にマージして公開リンクを出して」→ PR 作成 → マージ → デプロイ確認 → `?v=` 付きリンク。
- 「Codex のアイコンを追加した。差し替えて」→ `ai-agents/` にファイルを置き、`chatgpt-lessons.js` の `codexMark` を `logo("<ファイル名>", "codex-mark")` に変更。
- 「Chat モードでもプロジェクトトレイを出して」→ `chatgpt-lessons.js` の `composer()` 内 `tray` の条件 `work` を `!codex` に変更。
- 「吹き出しの文言を変えたい」→ 各ボタンの `tip:` / `data-tip` を編集。
