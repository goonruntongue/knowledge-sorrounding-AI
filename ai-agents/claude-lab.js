/* Claude Code practice course (Claude desktop app, Code tab). Local teaching simulation: no real folder, network or account actions. */
window.ClaudeLesson = (() => {
  "use strict";
  const lab = document.querySelector("#lab");
  const root = document.querySelector("#simulation");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { icon, claudeMark, escape, caption, tour } = window.LabUI;
  let stage = 0, mode = "plan", menu = "", timer, prompt = "", response = "", running = false, error = "", toolsShown = 0;
  const title = "はじめてのAI制作";
  const sample = "index.htmlのh1を「はじめてのAI制作」に変更してください。ほかの文章やレイアウトは変えず、変更箇所と確認結果を教えてください。";
  const modes = [
    ["plan", "プラン", "調査して方針を提案します。このモードではソースコードを編集しません。"],
    ["edits", "編集を受け入れる", "ファイル編集と一部の基本的なファイル操作を自動承認します。他のコマンドは確認されることがあります。"],
    ["auto", "自動", "バックグラウンドのチェックを通じて操作を進めます。実機では利用条件によって選べないことがあります。"]
  ];
  const messages = [
    "上部中央のタブで Code に切り替えましょう。",
    "フォルダボタンから、練習用の作品を選びましょう。",
    "権限モードを開き、それぞれの説明を読んで設定しましょう。",
    "変更したいファイル・内容・条件を入力し、送信しましょう。",
    "作業内容を確認して、選んだ権限モードに応じた流れを体験しましょう。",
    "変更前後を確認して、ブラウザ表示を開きましょう。",
    "練習完了！別の権限モードでも試せます。"
  ];
  const chosen = () => modes.find(m => m[0] === mode);
  const control = (action, label, guided = false, tip = "") => '<button type="button" class="sim-control' + (guided ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const lab_ = html => '<div class="lab-layer">' + html + "</div>";
  const userMsg = text => '<div class="msg msg-user"><div class="bubble">' + escape(text) + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot">' + claudeMark + '<div class="msg-body">' + html + "</div></div>";
  const statPill = '<em class="stat"><b class="add">+1</b> <b class="del">−1</b></em>';
  const toolRows = () => '<div class="activity">' + ['<div class="tool-row">' + icon("file") + "<span>Read index.html</span></div>", '<div class="tool-row">' + icon("diff") + "<span>Edit index.html</span>" + statPill + "</div>"].slice(0, toolsShown).join("") + "</div>";
  const diffCard = () => '<div class="diff-card"><div class="diff-head">' + icon("file") + "<span>index.html</span>" + statPill + '</div><div class="diff"><del><i>3</i>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins><i>3</i>+ &lt;h1&gt;' + title + "&lt;/h1&gt;</ins></div></div>";
  function stop() { clearTimeout(timer); running = false; }
  function reset() { stop(); stage = 0; mode = "plan"; menu = ""; prompt = ""; response = ""; error = ""; toolsShown = 0; }
  function folderPopover() {
    return '<div class="popover picker" role="menu"><span class="pop-label">プロジェクトフォルダ</span>' +
      ui("select-folder", icon("folder") + "<span><b>my-website</b><small>~/Desktop/my-website</small></span>", { cls: "pop-item", guide: true, tip: "練習用の作品フォルダを選ぶ" }) +
      '<span class="pop-item static">' + icon("folder") + "<span><b>フォルダを参照…</b><small>練習では選べません</small></span></span>" +
      '<div class="pop-tree"><pre>my-website/\n├─ index.html\n└─ css/\n   └─ style.css</pre></div></div>';
  }
  function permissionPopover() {
    return '<div class="popover picker perm" role="menu"><span class="pop-label">権限モード</span>' +
      modes.map(([key, label, detail]) => '<label class="pop-item radio' + (mode === key ? " on" : "") + '"><input type="radio" name="mode" value="' + key + '"' + (mode === key ? " checked" : "") + "><span><b>" + label + "</b><small>" + detail + "</small></span>" + (mode === key ? icon("check", "trail") : "") + "</label>").join("") +
      '<div class="pop-foot">' + ui("permission-done", "この設定で進む", { cls: "primary", guide: true, tip: "3つの説明を読んだら進む" }) + "</div></div>";
  }
  function conversation() {
    if (stage < 3) return '<div class="empty-state">' + claudeMark + '<h1>何をつくりましょうか？</h1><p class="hint-line">タスクを入力して Enter で開始</p></div>' + lab_('<p class="lab-note">練習用の新しいセッションです。赤枠と吹き出しの順に操作してください。</p>');
    if (stage === 3) return '<div class="empty-state small"><h1>何をつくりましょうか？</h1></div>' + lab_('<div class="lab-card"><b>今回の課題</b><p>index.htmlの見出し「Hello!」を「' + title + '」に変更します。</p><small>例を使っても、自分の言葉で書いてもOK。練習ではこの見出し変更を再現します。</small>' + control("sample", "依頼文の例を入力", !prompt.trim(), "例文を入れる（自分で書いてもOK）") + "</div>" + (error ? '<p class="feedback" role="alert">' + error + "</p>" : ""));
    const html = userMsg(prompt);
    if (running) return html + botMsg(toolRows() + '<p class="typing" role="status">' + escape(response) + "</p>");
    if (stage === 4 && mode === "plan") {
      return html + botMsg('<p>index.html を確認しました。変更は1行だけです。プランを提案します。</p><div class="plan-card"><div class="plan-head">' + icon("layout") + 'プラン</div><ol><li>index.html の h1 を確認</li><li>見出しの文字だけ変更</li><li>差分と表示を確認</li></ol><p class="plan-note">まだファイルは変更していません。実行するモードを選んでください。</p><div class="plan-actions">' + ui("execute-edits", "編集を受け入れるで実行", { cls: "primary", guide: true, tip: "プランを確認して実行" }) + ui("execute-auto", "自動で実行", { cls: "secondary" }) + "</div></div>");
    }
    if (stage === 4) return html + botMsg('<div class="approval-card info"><div class="approval-head">' + icon("shield") + "<b>" + chosen()[1] + "で作業</b></div><p>" + (mode === "auto" ? "依頼に沿う編集かをチェックしながら進みます。" : "ファイルの編集を自動承認して進みます。") + '</p><div class="approval-actions">' + ui("continue", "見出しの変更を実行", { cls: "primary", guide: true, tip: "編集を実行" }) + "</div></div>");
    const done = '<div class="activity"><div class="tool-row">' + icon("file") + '<span>Read index.html</span></div><div class="tool-row">' + icon("diff") + "<span>Edit index.html</span>" + statPill + "</div></div>";
    const said = "<p>index.html の見出しを変更しました。ほかの文章やレイアウトは変更していません。</p>";
    if (stage === 5) return html + botMsg(done + said + diffCard() + '<div class="msg-actions">' + ui("preview", icon("monitor") + "ブラウザで表示を確認", { cls: "secondary", guide: true, tip: "差分を読んだら表示を確認" }) + "</div>") + lab_('<p class="lab-note">差分は赤が変更前、緑が変更後です。</p>');
    return html + botMsg(done + said + diffCard()) + lab_('<p class="success">' + icon("check") + " 依頼 → 作業 → 差分 → 表示確認まで完了！</p><p>実機でも変更点を確認して、よければGitに履歴を残しましょう。</p>" + control("reset", "別の権限モードでもう一度"));
  }
  const browserPane = () => '<aside class="browser-pane"><div class="browser-bar"><span class="nav-arrows">&#x2190; &#x2192;</span><span class="url">' + icon("lock") + "localhost:3000/index.html</span>" + icon("refresh") + '</div><div class="browser-page"><h3>' + title + "</h3><p>My first website</p></div></aside>";
  function composer() {
    const hasText = !!prompt.trim();
    const send = running ? ui("stop", icon("stop"), { cls: "send stop", guide: true, tip: "作業中。途中で止めるにはここ" }) : ui("send", icon("up"), { cls: "send", guide: stage === 3 && hasText, disabled: stage !== 3, tip: "内容を読んで送信" });
    const folderBtn = ui("folder", icon("folder") + "<span>" + (stage > 1 ? "my-website" : "フォルダを選択") + "</span>" + icon("chevron", "chev"), { cls: "chip", guide: stage === 1 && !menu, disabled: stage !== 1, pressed: menu === "folder", tip: "作品フォルダを紐づける" });
    const permBtn = ui("permission", icon("shield") + "<span>" + chosen()[1] + "</span>" + icon("chevron", "chev"), { cls: "chip perm", guide: stage === 2 && !menu, disabled: stage !== 2, pressed: menu === "permission", tip: "任せる範囲を設定" });
    const popup = menu === "folder" ? folderPopover() : menu === "permission" ? permissionPopover() : "";
    const area = '<textarea id="request" class="' + (stage === 3 && !hasText ? "guided" : "") + '" data-tip="変更したいファイル・内容・条件を書く" aria-label="AIへの依頼文" placeholder="Claude に任せたいタスクを入力"' + (stage === 3 ? "" : " disabled") + ">" + escape(stage === 3 ? prompt : "") + "</textarea>";
    return '<div class="composer-wrap">' + popup + '<div class="composer claude">' + area + '<div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + '</span><span class="chip">' + icon("home") + "ローカル" + icon("chevron", "chev") + "</span>" + folderBtn + '</div><div class="bar-right">' + permBtn + '<span class="chip">Claude Opus 5.5' + icon("chevron", "chev") + "</span>" + send + "</div></div></div></div>";
  }
  function shell() {
    const tabs = '<div class="claude-tabs" role="tablist"><span class="ctab" aria-selected="' + (stage === 0) + '">' + icon("chat") + 'チャット</span><span class="ctab" aria-selected="false">' + icon("briefcase") + "Cowork</span>" + (stage === 0 ? ui("activate", icon("code") + "Code", { cls: "ctab", guide: true, pressed: false, tip: "Code タブへ切り替え" }) : '<span class="ctab" aria-selected="true">' + icon("code") + "Code</span>") + "</div>";
    const head = '<div class="win-title claude-title"><span class="win-app">' + claudeMark + "<span>Claude</span></span>" + tabs + '<span class="title-right"><span class="avatar sm">S</span>' + caption + "</span></div>";
    const account = '<div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div>';
    if (stage === 0) {
      return '<div class="app-window claude">' + head + '<div class="app-body"><aside class="app-side"><nav class="side-nav"><span class="nav-item static">' + icon("compose") + '<span>新しいチャット</span></span><span class="nav-item static">' + icon("search") + '<span>検索</span></span><span class="nav-item static">' + icon("folder") + '<span>プロジェクト</span></span><p class="nav-section">最近</p><div class="recent"><span>文化祭サイトの構成</span><span>見出し案の相談</span></div></nav>' + account + "</aside>" +
        '<section class="app-main"><div class="mobile-nav">' + ui("activate", icon("code") + "Code タブへ切り替え", { cls: "nav-item", guide: true, tip: "Code タブへ" }) + '</div><div class="thread"><div class="empty-state">' + claudeMark + "<h1>こんにちは、Student</h1></div>" + lab_('<p class="lab-note">Claude デスクトップでは、上部中央のタブでチャット・Cowork・Code を切り替えます。</p>') + '</div><div class="composer-wrap"><div class="composer claude"><textarea disabled placeholder="Claude に話しかけてみましょう"></textarea><div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + '</span></div><div class="bar-right"><span class="chip">Claude Opus 5.5' + icon("chevron", "chev") + '</span><span class="ui-btn send" aria-disabled="true">' + icon("up") + "</span></div></div></div></div></section></div></div>";
    }
    const session = stage >= 4 ? '<span class="session on"><i class="dot ' + (running ? "busy" : "ok") + '"></i><span>' + escape(prompt.slice(0, 16)) + "…</span></span>" : '<span class="session on"><i class="dot"></i><span>新しいセッション</span></span>';
    return '<div class="app-window claude">' + head + '<div class="app-body"><aside class="app-side"><div class="side-head">' + ui("noop", icon("plus") + "新しいセッション", { cls: "new-session", disabled: true }) + '</div><div class="side-filter"><span class="chip">' + icon("layout") + "プロジェクト別" + icon("chevron", "chev") + '</span></div><nav class="side-nav sessions"><p class="nav-section">' + (stage > 1 ? "my-website" : "グループなし") + "</p>" + session + '<span class="session"><i class="dot ok"></i><span>スタイルの調整</span></span></nav>' + account + "</aside>" +
      '<section class="app-main"><header class="app-top"><div class="top-left"><b>' + (stage >= 4 ? escape(prompt.slice(0, 22)) + "…" : "新しいセッション") + '</b></div><div class="top-right">' + (stage >= 5 ? '<span class="ghost stat-pill"><b class="add">+1</b> <b class="del">−1</b></span>' : "") + '<span class="ghost">Normal' + icon("chevron", "chev") + '</span><span class="ghost">' + icon("layout") + "ビュー</span></div></header>" +
      '<div class="work-area' + (stage === 6 ? " split" : "") + '"><div class="thread">' + conversation() + "</div>" + (stage === 6 ? browserPane() : "") + "</div>" + composer() + "</section></div></div>";
  }
  function render() {
    document.querySelector("#progress").textContent = stage < 6 ? "STEP " + (stage + 1) + " / 6" : "COMPLETE";
    document.querySelector("#instruction").textContent = messages[stage];
    root.innerHTML = shell();
    root.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => act(b.dataset.action)));
    root.querySelectorAll('[name="mode"]').forEach(r => r.addEventListener("change", () => { mode = r.value; render(); }));
    const request = root.querySelector("#request");
    if (request && !request.disabled) {
      request.addEventListener("input", e => { prompt = e.target.value; root.querySelector('[data-action="send"]')?.classList.toggle("guided", !!prompt.trim()); request.classList.toggle("guided", !prompt.trim()); root.querySelector('[data-action="sample"]')?.classList.toggle("guided", !prompt.trim()); tour.update(); });
      request.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); act("send"); } });
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
    if (action === "folder") menu = menu === "folder" ? "" : "folder";
    if (action === "select-folder") { stage = 2; menu = ""; }
    if (action === "permission") menu = menu === "permission" ? "" : "permission";
    if (action === "permission-done") { stage = 3; menu = ""; }
    if (action === "sample") prompt = sample;
    if (action === "send") {
      if (!prompt.trim()) { error = "変更したい内容を入力してください。「依頼文の例を入力」も使えます。"; render(); return; }
      error = ""; stage = 4;
    }
    if (action === "execute-edits" || action === "execute-auto") { mode = action === "execute-edits" ? "edits" : "auto"; animate(() => { stage = 5; }); return; }
    if (action === "continue") { animate(() => { stage = 5; }); return; }
    if (action === "stop") { stop(); response = ""; toolsShown = 0; }
    if (action === "preview") stage = 6;
    if (action === "reset") { reset(); render(); return; }
    render();
    requestAnimationFrame(() => {
      const target = menu ? root.querySelector(".popover") : stage >= 4 ? root.querySelector(".thread .msg:last-of-type") : root.querySelector(".guided");
      target?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (action === "sample") root.querySelector("#request")?.focus();
    });
  }
  return { reset, render, stop, closeMenu() { if (!menu) return false; menu = ""; render(); return true; } };
})();
