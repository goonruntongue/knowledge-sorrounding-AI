/* Claude Code practice course, after the Claude desktop app's Code view (Windows, checked 2026-09-29).
   Local teaching simulation: no real folder, network, repository or account actions. */
window.ClaudeLesson = (() => {
  "use strict";
  const lab = document.querySelector("#lab");
  const root = document.querySelector("#simulation");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { icon, claudeMark, escape, caption, tour } = window.LabUI;
  let free = false, stage, env, folder, menu, picker, pickSel, mode, modeChosen, model, modelChosen, timer, prompt, response, running, error, toolsShown;
  const title = "はじめてのAI制作";
  const folderName = "my-website";
  const sample = "index.htmlのh1を「はじめてのAI制作」に変更してください。ほかの文章やレイアウトは変えず、変更箇所と確認結果を教えてください。";
  /* Permission modes as listed in the composer's モード menu. */
  const modes = [
    ["auto", "自動", "Claudeが権限の決定を処理します"],
    ["manual", "手動", "変更前に常に確認する"],
    ["edits", "編集を受け入れる", "すべてのファイル編集を自動的に承認"],
    ["plan", "プラン", "変更を加える前に計画を作成"],
    ["bypass", "権限をバイパス", "すべての権限を承認"]
  ];
  const models = [["Opus 5.5", "デフォルト"], ["Sonnet 5.5"], ["Fable 5.1", "", true], ["Haiku 4.5"]];
  const moreModels = [["Sonnet 5"], ["Opus 5"], ["Fable 5", "", true], ["Opus 4.8"], ["Opus 4.7"], ["Opus 4.6"], ["Sonnet 4.6"]];
  const messages = [
    "左上の </> を押して、Claude Code（Code）に切り替えましょう。",
    "入力欄の上の「ローカル」を押して、Claude の実行場所を選びましょう。",
    "「フォルダなし」から「フォルダを開く…」を選び、作品フォルダを紐づけましょう。",
    "左下の「自動」で権限モードを、右下の「Opus 5.5」でモデルを選びましょう。",
    "変更したいファイル・内容・条件を入力し、送信しましょう。",
    "作業内容を確認して、選んだ権限モードに応じた流れを体験しましょう。",
    "変更前後を確認して、ブラウザ表示を開きましょう。",
    "練習完了！別の権限モードでも試せます。"
  ];
  const chosen = () => modes.find(m => m[0] === mode);
  const control = (action, label, guided = false, tip = "") => '<button type="button" class="sim-control' + (guided ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "", aria = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (aria ? ' aria-label="' + aria + '" data-label="' + aria + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const lab_ = html => '<div class="lab-layer">' + html + "</div>";
  const userMsg = text => '<div class="msg msg-user"><div class="bubble">' + escape(text) + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot">' + claudeMark + '<div class="msg-body">' + html + "</div></div>";
  const statPill = '<em class="stat"><b class="add">+1</b> <b class="del">−1</b></em>';
  const toolRows = () => '<div class="activity">' + ['<div class="tool-row">' + icon("file") + "<span>Read index.html</span></div>", '<div class="tool-row">' + icon("diff") + "<span>Edit index.html</span>" + statPill + "</div>"].slice(0, toolsShown).join("") + "</div>";
  const diffCard = () => '<div class="diff-card"><div class="diff-head">' + icon("file") + "<span>index.html</span>" + statPill + '</div><div class="diff"><del><i>3</i>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins><i>3</i>+ &lt;h1&gt;' + title + "&lt;/h1&gt;</ins></div></div>";
  /* Claude's pixel mascot beside the composer (simple re-drawing). */
  const mascot = '<svg class="cc-mascot" viewBox="0 0 12 9" aria-hidden="true" shape-rendering="crispEdges"><path fill="#d97757" d="M2 0h8v1h1v3h1v1h-1v1H1V5H0V4h1V1h1ZM2 6h1v3H2ZM4 6h1v3H4ZM7 6h1v3H7ZM9 6h1v3H9Z"/><path fill="#1f1f1e" d="M4 2h1v2H4ZM7 2h1v2H7Z"/></svg>';
  function stop() { clearTimeout(timer); running = false; }
  function reset() {
    stop(); stage = free ? 1 : 0; env = "local"; folder = ""; menu = ""; picker = false; pickSel = ""; mode = "auto"; modeChosen = false; model = "Opus 5.5"; modelChosen = false;
    prompt = ""; response = ""; running = false; error = ""; toolsShown = 0;
  }
  reset();
  /* ---------- menus ---------- */
  function envMenu() {
    const sub = (label, items) => '<span class="cc-item cc-has-sub" tabindex="0"><b>' + label + "</b>" + icon("chevr", "trail") + (items ? '<span class="cc-menu cc-sub">' + items + "</span>" : "") + "</span>";
    return '<div class="cc-menu cc-env" role="menu">' + ui("env-local", "<b>ローカル</b>" + icon("check", "trail check"), { cls: "cc-item", guide: true, tip: "自分のPCで作業する" }) +
      sub("クラウド", '<span class="cc-item"><b>Default</b></span><hr><span class="cc-item"><b>クラウド環境を追加…</b></span>') + sub("リモートコントロール") + sub("WSL") + sub("SSH") + "</div>";
  }
  function folderMenu() {
    return '<div class="cc-menu cc-folders" role="menu"><span class="cc-item"><b>フォルダなし</b>' + icon("check", "trail check") + '</span><hr><span class="cc-label">最近</span>' +
      ["portfolio", "文化祭2026", "課題メモ"].map(n => '<span class="cc-item"><b>' + n + "</b></span>").join("") + "<hr>" +
      ui("open-folder", "<b>フォルダを開く…</b>", { cls: "cc-item", guide: true, tip: "フォルダ選択の画面を開く" }) + "</div>";
  }
  function modeMenu() {
    return '<div class="cc-menu cc-modes" role="menu"><span class="cc-label">モード</span>' +
      modes.map(([key, label, detail], i) => ui("mode-" + key, "<span><b>" + label + "</b><small>" + detail + "</small></span>" + (mode === key ? icon("check", "check") : "") + "<kbd>" + (i + 1) + "</kbd>", { cls: "cc-item two" + (key === "bypass" ? " warn" : ""), guide: !modeChosen && key === "plan", tip: "迷ったらプラン（計画を先に確認）" })).join("") + "</div>";
  }
  function modelMenu() {
    const item = ([name, tag, credit], n) => ui("model-" + name, "<b>" + name + "</b>" + (tag ? '<em class="cc-tag">' + tag + "</em>" : "") + (credit ? '<em class="cc-tag">' + icon("info") + "使用クレジットが必要です</em>" : "") + (model === name ? icon("check", "check") : "") + (n ? "<kbd>" + n + "</kbd>" : ""), { cls: "cc-item", guide: !modelChosen && name === "Opus 5.5", tip: "迷ったらデフォルト" });
    const more = menu === "models-more" ? '<div class="cc-menu cc-more" role="menu">' + moreModels.map(m => item(m, 0)).join("") + "</div>" : "";
    return more + '<div class="cc-menu cc-models" role="menu">' + models.map((m, i) => item(m, i + 1)).join("") + "<hr>" + ui("models-more", "<b>他のモデル</b>" + icon("chevr", "trail"), { cls: "cc-item" + (menu === "models-more" ? " on" : "") }) + "</div>";
  }
  /* ---------- Windows folder picker (re-drawn) ---------- */
  function folderPicker() {
    const names = [folderName, "portfolio", "文化祭2026", "課題メモ", "写真", "レポート", "ゲーム制作", "ダウンロード素材"];
    const tiles = names.map(n => n === folderName
      ? ui("pick-" + n, '<span class="wf-folder"></span><span>' + n + "</span>", { cls: "wf-tile" + (pickSel === n ? " on" : ""), guide: pickSel !== n, tip: "作品フォルダを選ぶ" })
      : '<span class="wf-tile static"><span class="wf-folder"></span><span>' + n + "</span></span>").join("");
    return '<div class="wf-back"><div class="wf-win" role="dialog" aria-modal="true" aria-labelledby="wf-title"><div class="wf-title"><span class="wf-app">' + claudeMark + '<span id="wf-title">ローカルセッション用のフォルダを選択</span></span>' + ui("picker-cancel", icon("close"), { cls: "wf-x", aria: "閉じる" }) + "</div>" +
      '<div class="wf-bar"><span class="wf-nav">' + icon("back") + icon("fwd") + icon("chevron") + icon("up") + '</span><span class="wf-addr">🖥 › デスクトップ</span><span class="wf-search">デスクトップの検索' + icon("search") + "</span></div>" +
      '<div class="wf-tools"><span>整理 ▾</span><span>新しいフォルダー</span></div><div class="wf-body"><nav class="wf-side"><span>🏠 ホーム</span><span class="on">🖥 デスクトップ</span><span>⬇ ダウンロード</span><span>📄 ドキュメント</span><span>🖼 ピクチャ</span></nav><div class="wf-grid">' + tiles + "</div></div>" +
      '<div class="wf-foot"><label>フォルダー: <span class="wf-field">' + (pickSel || "デスクトップ") + "</span></label>" + ui("picker-ok", "フォルダーの選択", { cls: "wf-btn primary", guide: pickSel === folderName, tip: "このフォルダを紐づける" }) + ui("picker-cancel", "キャンセル", { cls: "wf-btn" }) + "</div>" +
      lab_('<p class="lab-note">Windows のフォルダ選択画面の再現です。実際のファイルには触れません。</p>') + "</div></div>";
  }
  /* ---------- conversation ---------- */
  function home() {
    const note = stage === 1 ? "「ローカル」は自分のPCで作業する設定です。「クラウド」を選ぶと、GitHub のリポジトリを選んでクラウド上で作業する流れになります（今回はローカルで練習）。"
      : stage === 2 ? "作業フォルダ（作業ディレクトリ）を選ぶと、Claude はそのフォルダの中で作業します。"
      : stage === 3 ? "権限モードは「どこまで確認なしで任せるか」、モデルは「どの Claude に頼むか」の設定です。" : "練習用の新しいセッションです。赤枠と吹き出しの順に操作してください。";
    let html = '<div class="cc-greet">' + claudeMark + "<h1>おかえりなさい、Studentさん</h1></div>";
    if (stage === 4 || (free && stage >= 1)) html += lab_('<div class="lab-card"><b>今回の課題</b><p>index.htmlの見出し「Hello!」を「' + title + '」に変更します。</p><small>例を使っても、自分の言葉で書いてもOK。練習ではこの見出し変更を再現します。</small>' + control("sample", "依頼文の例を入力", !prompt.trim(), "例文を入れる（自分で書いてもOK）") + "</div>" + (error ? '<p class="feedback" role="alert">' + error + "</p>" : ""));
    else html += lab_('<p class="lab-note">' + note + "</p>");
    return html;
  }
  function conversation() {
    const html = userMsg(prompt);
    if (running) return html + botMsg(toolRows() + '<p class="typing" role="status">' + escape(response) + "</p>");
    if (stage === 5 && mode === "plan") {
      return html + botMsg('<p>index.html を確認しました。変更は1行だけです。プランを提案します。</p><div class="plan-card"><div class="plan-head">' + icon("layout") + 'プラン</div><ol><li>index.html の h1 を確認</li><li>見出しの文字だけ変更</li><li>差分と表示を確認</li></ol><p class="plan-note">まだファイルは変更していません。実行するモードを選んでください。</p><div class="plan-actions">' + ui("execute-edits", "編集を受け入れるで実行", { cls: "primary", guide: true, tip: "プランを確認して実行" }) + ui("execute-auto", "自動で実行", { cls: "secondary" }) + "</div></div>");
    }
    if (stage === 5 && mode === "manual") {
      return html + botMsg('<p>index.html の h1 を1行だけ変更します。</p><div class="approval-card"><div class="approval-head">' + icon("diff") + "<b>Edit index.html を許可しますか？</b></div><code>&lt;h1&gt;Hello!&lt;/h1&gt; → &lt;h1&gt;" + title + '&lt;/h1&gt;</code><p>手動モードでは、変更の前に毎回確認されます。</p><div class="approval-actions">' + ui("deny", "拒否", { cls: "secondary" }) + ui("approve", "許可", { cls: "primary", guide: true, tip: "内容を読んで許可" }) + "</div></div>");
    }
    if (stage === 5) {
      const text = mode === "bypass" ? "すべての操作を確認なしで承認します。信頼できる環境・フォルダでだけ使う設定です。" : mode === "edits" ? "ファイルの編集を自動で承認して進みます。" : "Claude が権限の判断をしながら進みます。";
      return html + botMsg('<div class="approval-card info' + (mode === "bypass" ? " warn" : "") + '"><div class="approval-head">' + icon(mode === "bypass" ? "warn" : "shield") + "<b>" + chosen()[1] + "で作業</b></div><p>" + text + '</p><div class="approval-actions">' + ui("continue", "見出しの変更を実行", { cls: "primary", guide: true, tip: "編集を実行" }) + "</div></div>");
    }
    const done = '<div class="activity"><div class="tool-row">' + icon("file") + '<span>Read index.html</span></div><div class="tool-row">' + icon("diff") + "<span>Edit index.html</span>" + statPill + "</div></div>";
    const said = "<p>index.html の見出しを変更しました。ほかの文章やレイアウトは変更していません。</p>";
    if (stage === 6) return html + botMsg(done + said + diffCard() + '<div class="msg-actions">' + ui("preview", icon("monitor") + "ブラウザで表示を確認", { cls: "secondary", guide: true, tip: "差分を読んだら表示を確認" }) + "</div>") + lab_('<p class="lab-note">差分は赤が変更前、緑が変更後です。</p>');
    return html + botMsg(done + said + diffCard()) + lab_('<p class="success">' + icon("check") + " 実行場所 → フォルダ → 権限とモデル → 依頼 → 差分 → 表示確認まで完了！</p><p>実機でも変更点を確認して、よければGitに履歴を残しましょう。</p>" + control("reset", "別の権限モードでもう一度"));
  }
  const browserPane = () => '<aside class="browser-pane"><div class="browser-bar"><span class="nav-arrows">&#x2190; &#x2192;</span><span class="url">' + icon("lock") + "localhost:3000/index.html</span>" + icon("refresh") + '</div><div class="browser-page"><h3>' + title + "</h3><p>My first website</p></div></aside>";
  /* ---------- composer ---------- */
  function composer() {
    const hasText = !!prompt.trim(), live = stage >= 1, any = free && stage >= 1 && stage < 5;
    const on = n => stage === n || any, typing = stage === 4 || any;
    const envChip = '<span class="cc-anchor">' + ui("env", icon("laptop") + "ローカル", { cls: "cc-chip", guide: stage === 1 && !menu, disabled: !on(1), pressed: menu === "env", tip: "実行場所を選ぶ", aria: "Claudeの実行場所" }) + (menu === "env" ? envMenu() : "") + "</span>";
    const folderChip = '<span class="cc-anchor">' + ui("folder", icon("folder") + (folder || "フォルダなし"), { cls: "cc-chip", guide: stage === 2 && !menu && !picker, disabled: !on(2), pressed: menu === "folder", tip: "作業フォルダを選ぶ", aria: "作業ディレクトリ" }) + (menu === "folder" ? folderMenu() : "") + "</span>" + (folder ? '<span class="cc-chip icon-only" aria-hidden="true">' + icon("folderplus") + "</span>" : "");
    const modeChip = '<span class="cc-anchor">' + ui("mode", chosen()[1], { cls: "cc-mini", guide: stage === 3 && !modeChosen && !menu, disabled: !on(3), pressed: menu === "mode", tip: "権限モードを選ぶ" }) + (menu === "mode" ? modeMenu() : "") + "</span>";
    const modelChip = '<span class="cc-anchor right">' + ui("model", model, { cls: "cc-mini strong", guide: stage === 3 && modeChosen && !modelChosen && !menu, disabled: !on(3), pressed: menu === "model" || menu === "models-more", tip: "モデルを選ぶ" }) + (menu === "model" || menu === "models-more" ? modelMenu() : "") + "</span>";
    const send = running ? ui("stop", icon("stop"), { cls: "cc-send stop", guide: true, tip: "作業中。途中で止めるにはここ", aria: "停止" }) : ui("send", icon("enter"), { cls: "cc-send" + (stage === 4 && hasText ? " ready" : ""), guide: stage === 4 && hasText, disabled: !typing, tip: "内容を読んで送信（Enter）", aria: "送信" });
    const area = '<textarea id="request" rows="1" class="' + (stage === 4 && !hasText ? "guided" : "") + '" data-tip="変更したいファイル・内容・条件を書く" aria-label="AIへの依頼文" placeholder="タスクを説明するか、質問を入力してください"' + (typing ? "" : " disabled") + ">" + escape(typing ? prompt : "") + "</textarea>";
    return '<div class="cc-compose' + (live ? "" : " idle") + '"><div class="cc-chips">' + (live ? envChip + folderChip : "") + mascot + '</div><div class="cc-input">' + area + send + '</div><div class="cc-bar"><span class="cc-bar-l">' + icon("plus") + icon("mic") + icon("chevron", "chev") + (live ? modeChip : '<span class="cc-mini">自動</span>') + '</span><span class="cc-bar-r">' + (live ? modelChip : '<span class="cc-mini strong">Opus 5.5</span>') + '<span class="cc-mini">中</span>' + icon("ring", "ring") + "</span></div></div>";
  }
  /* ---------- shell ---------- */
  function sidebar() {
    const row = (ic, text, cls = "") => '<span class="cc-row' + (cls ? " " + cls : "") + '">' + icon(ic) + "<span>" + escape(text) + "</span></span>";
    const group = (name, sessions, open = true) => '<div class="cc-group"><span class="cc-gname">' + escape(name) + (open ? "" : icon("chevr")) + icon("plus", "add") + "</span>" + sessions.join("") + "</div>";
    const sessionName = stage >= 5 ? prompt.slice(0, 14) + "…" : "";
    const groups = (folder ? group(folder, sessionName ? [row(stage >= 7 ? "pr" : "ring", sessionName, "on" + (stage >= 7 ? " ok" : ""))] : []) : "") +
      group("portfolio", [], false) + group("文化祭2026", [row("ring", "見出し案の相談")]) + group("課題メモ", [row("pr", "スタイルの調整", "ok")]) + group("その他", [], false);
    return '<aside class="cc-side"><label class="cc-search">' + icon("search") + '<span>検索</span></label><span class="cc-row new' + (stage < 5 ? " on" : "") + '">' + icon("plus") + "<span>新規</span></span>" + row("shapes", "Artifacts") + row("briefcase", "カスタマイズ") + row("chevron", "もっと見る") +
      '<div class="cc-groups">' + groups + '</div><div class="cc-account"><span class="cc-avatar">ST</span><span>Student</span><small>· Pro</small>' + icon("chevron", "chev") + icon("sliders", "gear") + "</div></aside>";
  }
  function shell() {
    const codeBtn = stage === 0 ? ui("activate", icon("code"), { cls: "cc-seg", guide: true, pressed: false, tip: "Claude Code（Code）に切り替え", aria: "Code" }) : '<span class="cc-seg" aria-pressed="true">' + icon("code") + "</span>";
    const top = '<div class="cc-top"><div class="cc-top-l"><span class="cc-tools" aria-hidden="true">' + icon("menu") + icon("sidebar") + icon("back") + icon("fwd", "dim") + '</span><span class="cc-segs"><span class="cc-seg" aria-pressed="' + (stage === 0) + '">' + icon("chat") + "</span>" + codeBtn + '</span></div><div class="cc-top-r">' + (stage >= 5 ? '<b class="cc-title">' + escape(prompt.slice(0, 24)) + "…</b>" + (stage >= 6 ? '<span class="ghost stat-pill"><b class="add">+1</b> <b class="del">−1</b></span>' : "") : "<span></span>") + caption + "</div></div>";
    let main;
    if (stage === 0) {
      main = '<div class="cc-home chat">' + '<div class="cc-greet center">' + claudeMark + '<h1>こんばんは、Studentさん</h1></div><div class="cc-chatbox"><textarea disabled placeholder="今日はどのようなお手伝いができますか？"></textarea><div class="cc-bar"><span class="cc-bar-l">' + icon("plus") + '</span><span class="cc-bar-r"><span class="cc-mini strong">Opus 5.5</span></span></div></div>' +
        lab_('<p class="lab-note">いまはチャットの画面です。Claude Code は、左上の </> （Code）に切り替えて使います。</p>') + "</div>";
    } else if (stage <= 4) {
      main = '<div class="cc-home"><div class="cc-column">' + home() + "</div></div>" + composer();
    } else {
      main = '<div class="work-area' + (stage === 7 ? " split" : "") + '"><div class="thread">' + conversation() + "</div>" + (stage === 7 ? browserPane() : "") + "</div>" + composer();
    }
    const mobile = stage === 0 ? '<div class="mobile-nav">' + ui("activate", icon("code") + "Code に切り替え", { cls: "nav-item", guide: true, tip: "Code に切り替え" }) + "</div>" : "";
    return '<div class="app-window claude cc">' + top + '<div class="cc-body">' + sidebar() + '<section class="app-main cc-main">' + mobile + main + "</section></div>" + (picker ? folderPicker() : "") + "</div>";
  }
  function render() {
    document.querySelector("#progress").textContent = stage < 7 ? (free ? "自由モード" : "STEP " + (stage + 1) + " / 7") : "COMPLETE";
    document.querySelector("#instruction").textContent = free && stage >= 1 && stage < 5 ? "好きな順に触ってみましょう。依頼を送るには、先に作業フォルダを選びます。" : messages[stage];
    root.innerHTML = shell();
    root.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => act(b.dataset.action)));
    const thread = root.querySelector(".thread");
    if (thread && thread.querySelector(".msg")) thread.scrollTop = thread.scrollHeight;
    const request = root.querySelector("#request");
    if (request && !request.disabled) {
      request.addEventListener("input", e => {
        prompt = e.target.value;
        root.querySelector('[data-action="send"]')?.classList.toggle("guided", !!prompt.trim());
        root.querySelector('[data-action="send"]')?.classList.toggle("ready", !!prompt.trim());
        request.classList.toggle("guided", !prompt.trim());
        root.querySelector('[data-action="sample"]')?.classList.toggle("guided", !prompt.trim());
        tour.update();
      });
      request.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); act("send"); } });
    }
    tour.update();
  }
  function animate(done) {
    stop(); running = true; response = ""; toolsShown = 0;
    const message = "index.htmlを読み取りました。h1を「はじめてのAI制作」に変更しています…";
    let index = 0;
    const tick = () => {
      if (!lab.open) return;
      index = reduced ? message.length : index + 2;
      toolsShown = index >= message.length ? 2 : index > 12 ? 1 : 0;
      response = message.slice(0, index); render();
      if (index < message.length) timer = setTimeout(tick, 45);
      else { running = false; done(); render(); }
    };
    tick();
  }
  function act(action) {
    if (action === "noop") return;
    if (action === "activate") { stage = 1; menu = ""; }
    if (action === "env") menu = menu === "env" ? "" : "env";
    if (action === "env-local") { env = "local"; menu = ""; if (stage < 2) stage = 2; }
    if (action === "folder") menu = menu === "folder" ? "" : "folder";
    if (action === "open-folder") { menu = ""; picker = true; pickSel = ""; }
    if (action.startsWith("pick-")) pickSel = action.slice(5);
    if (action === "picker-cancel") picker = false;
    if (action === "picker-ok") { if (pickSel) { folder = pickSel; picker = false; if (stage < 3) stage = 3; } }
    if (action === "mode") menu = menu === "mode" ? "" : "mode";
    if (action.startsWith("mode-")) { mode = action.slice(5); modeChosen = true; menu = ""; }
    if (action === "model") menu = menu === "model" || menu === "models-more" ? "" : "model";
    if (action === "models-more") menu = menu === "models-more" ? "model" : "models-more";
    if (action.startsWith("model-")) { model = action.slice(6); modelChosen = true; menu = ""; }
    if (stage === 3 && modeChosen && modelChosen) stage = 4;
    if (action === "sample") prompt = sample;
    if (action === "send") {
      if (!prompt.trim()) { error = "変更したい内容を入力してください。「依頼文の例を入力」も使えます。"; render(); return; }
      if (!folder) { error = "練習では、先に作業フォルダを選んでから依頼しましょう。"; render(); return; }
      error = ""; stage = 5;
    }
    if (action === "execute-edits" || action === "execute-auto") { mode = action === "execute-edits" ? "edits" : "auto"; animate(() => { stage = 6; }); return; }
    if (["continue", "approve", "deny"].includes(action)) { animate(() => { stage = 6; }); return; }
    if (action === "stop") { stop(); response = ""; toolsShown = 0; }
    if (action === "preview") stage = 7;
    if (action === "reset") { reset(); render(); return; }
    render();
    requestAnimationFrame(() => {
      const target = menu ? root.querySelector(".cc-menu") : stage >= 5 ? root.querySelector(".thread .msg:last-of-type") : root.querySelector(".guided");
      target?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (action === "sample") root.querySelector("#request")?.focus();
    });
  }
  return {
    reset, render, stop,
    setFree(v) { free = v; if (free && stage === 0) stage = 1; },
    closeMenu() { if (picker) { picker = false; render(); return true; } if (!menu) return false; menu = ""; render(); return true; }
  };
})();
