(() => {
  "use strict";
  const lab = document.querySelector("#lab");
  const simulation = document.querySelector("#simulation");
  const progress = document.querySelector("#progress");
  const instruction = document.querySelector("#instruction");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { icon, gptMark, codexMark, claudeMark, escape, caption, winbar, tour } = window.LabUI;
  let app = "modes", stage = 0, mode = "ask", menu = "", timer, returnFocus;
  let prompt = "", response = "", running = false, error = "", toolsShown = 0;
  const title = "はじめてのAI制作";
  const sample = "index.htmlのh1を「はじめてのAI制作」に変更してください。ほかの文章やレイアウトは変えず、変更箇所と確認結果を教えてください。";
  const modes = {
    codex: [
      ["ask", "承認を求める", "作業領域内の編集は進められます。外部アクセスなど、境界を越える操作では自分で承認します。"],
      ["auto", "代わりに承認", "対象の承認依頼をレビュー用エージェントが判断します。すべてを無条件に許可する設定ではありません。"],
      ["full", "フルアクセス", "ファイルとネットワークへのアクセス範囲を広く解除します。今回は選択の意味を練習するだけで、実際の権限は変わりません。"]
    ],
    claude: [
      ["plan", "プラン", "調査して方針を提案します。このモードではソースコードを編集しません。"],
      ["edits", "編集を受け入れる", "ファイル編集と一部の基本的なファイル操作を自動承認します。他のコマンドは確認されることがあります。"],
      ["auto", "自動", "バックグラウンドのチェックを通じて操作を進めます。実機では利用条件によって選べないことがあります。"]
    ]
  };
  const chosen = () => modes[app].find(m => m[0] === mode);
  const control = (action, label, enabled, guided = false, tip = "") => '<button type="button" class="sim-control' + (guided ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (enabled ? "" : " disabled") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const coach = text => '<div class="coach">' + text + "</div>";
  const lab_ = html => '<div class="lab-layer">' + html + "</div>";
  const messages = [
    "開発用のモードに切り替えましょう。",
    "フォルダボタンから、練習用の作品を選びましょう。",
    "権限を開き、それぞれの説明を読んで設定しましょう。",
    "変更したいファイル・内容・条件を入力し、送信しましょう。",
    "作業内容を確認して、選んだ権限に応じた流れを体験しましょう。",
    "変更前後を確認して、ブラウザ表示を開きましょう。",
    "練習完了！別の権限や、もう一方のアプリも試せます。"
  ];
  const mark = () => (app === "claude" ? claudeMark : gptMark);
  const userMsg = text => '<div class="msg msg-user"><div class="bubble">' + escape(text) + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot">' + mark() + '<div class="msg-body">' + html + "</div></div>";
  const toolRows = () => {
    const rows = [
      '<div class="tool-row">' + icon("file") + "<span>" + (app === "claude" ? "Read" : "読み取り") + " index.html</span></div>",
      '<div class="tool-row">' + icon("diff") + "<span>" + (app === "claude" ? "Edit" : "編集") + ' index.html</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div>'
    ];
    return '<div class="activity">' + rows.slice(0, toolsShown).join("") + "</div>";
  };
  const diffCard = () => '<div class="diff-card"><div class="diff-head">' + icon("file") + '<span>index.html</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div><div class="diff"><del><i>3</i>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins><i>3</i>+ &lt;h1&gt;' + title + "&lt;/h1&gt;</ins></div></div>";
  function cancelRun() { clearTimeout(timer); running = false; }
  function reset(nextApp = app) {
    cancelRun(); app = nextApp; stage = 0; mode = app === "codex" ? "ask" : "plan";
    if (["modes", "skills", "plugins"].includes(app)) window.ChatGPTLessons.reset(app);
    menu = ""; prompt = ""; response = ""; error = ""; toolsShown = 0; render();
  }
  /* ---------- popovers ---------- */
  function folderPopover() {
    return '<div class="popover picker" role="menu"><span class="pop-label">' + (app === "claude" ? "プロジェクトフォルダ" : "プロジェクトを開く") + '</span>' +
      ui("select-folder", icon("folder") + "<span><b>my-website</b><small>~/Desktop/my-website</small></span>", { cls: "pop-item", guide: true, tip: "練習用の作品フォルダを選ぶ" }) +
      '<span class="pop-item static">' + icon("folder") + "<span><b>フォルダを参照…</b><small>練習では選べません</small></span></span>" +
      '<div class="pop-tree"><pre>my-website/\n├─ index.html\n└─ css/\n   └─ style.css</pre></div></div>';
  }
  function permissionPopover() {
    return '<div class="popover picker perm" role="menu"><span class="pop-label">' + (app === "claude" ? "権限モード" : "承認") + "</span>" +
      modes[app].map(([key, label, detail]) => '<label class="pop-item radio' + (mode === key ? " on" : "") + '"><input type="radio" name="mode" value="' + key + '"' + (mode === key ? " checked" : "") + '><span><b>' + label + "</b><small>" + detail + "</small></span>" + (mode === key ? icon("check", "trail") : "") + "</label>").join("") +
      '<div class="pop-foot">' + ui("permission-done", "この設定で進む", { cls: "primary", guide: true, tip: "3つの説明を読んだら進む" }) + "</div></div>";
  }
  /* ---------- conversation ---------- */
  function conversation() {
    if (stage < 3) {
      const text = app === "claude" ? "何をつくりましょうか？" : "何を作成しましょうか？";
      return '<div class="empty-state">' + (app === "claude" ? claudeMark : icon("cloudterm", "cloud")) + "<h1>" + text + "</h1>" + (app === "claude" ? '<p class="hint-line">タスクを入力して Enter で開始</p>' : "") + "</div>" + lab_('<p class="lab-note">練習用の新しいタスクです。下の赤枠を順番に操作してください。</p>');
    }
    if (stage === 3) return '<div class="empty-state small"><h1>' + (app === "claude" ? "何をつくりましょうか？" : "何を作成しましょうか？") + "</h1></div>" + lab_('<div class="lab-card"><b>今回の課題</b><p>index.htmlの見出し「Hello!」を「' + title + '」に変更します。</p><small>例を使っても、自分の言葉で書いてもOK。練習ではこの見出し変更を再現します。</small>' + control("sample", "依頼文の例を入力", true, !prompt.trim(), "例文を入れる（自分で書いてもOK）") + "</div>" + (error ? '<p class="feedback" role="alert">' + error + "</p>" : ""));
    let html = userMsg(prompt);
    if (running) return html + botMsg(toolRows() + '<p class="typing" role="status">' + escape(response) + "</p>");
    if (stage === 4 && app === "claude" && mode === "plan") {
      return html + botMsg('<p>index.html を確認しました。変更は1行だけです。プランを提案します。</p><div class="plan-card"><div class="plan-head">' + icon("layout") + "プラン</div><ol><li>index.html の h1 を確認</li><li>見出しの文字だけ変更</li><li>差分と表示を確認</li></ol><p class=\"plan-note\">まだファイルは変更していません。実行するモードを選んでください。</p><div class=\"plan-actions\">" + ui("execute-edits", "編集を受け入れるで実行", { cls: "primary", guide: true, tip: "プランを確認して実行" }) + ui("execute-auto", "自動で実行", { cls: "secondary" }) + "</div></div>");
    }
    if (stage === 4) {
      if (app === "codex") {
        if (mode === "ask") return html + botMsg('<p>作業フォルダ内の h1 編集に毎回承認は必要ありません。ここでは追加で「HTML仕様の公式サイトを参照する」場面を練習します。</p><div class="approval-card"><div class="approval-head">' + icon("globe") + "<b>ネットワークアクセスの承認</b></div><code>curl https://html.spec.whatwg.org/</code><p>Codex が作業領域の外（インターネット）にアクセスしようとしています。</p><div class=\"approval-actions\">" + ui("deny", "許可しない", { cls: "secondary" }) + ui("approve", "今回のみ許可", { cls: "primary", guide: true, tip: "内容を読んで許可" }) + "</div></div>");
        return html + botMsg('<div class="approval-card info"><div class="approval-head">' + icon("shield") + "<b>" + chosen()[1] + "</b></div><p>" + (mode === "auto" ? "レビュー用エージェントが、依頼に沿う参照かを確認して承認する流れです。" : "この設定では、ネットワークアクセスの承認待ちをせず進みます。") + "</p><div class=\"approval-actions\">" + ui("continue", "この設定での実行を体験", { cls: "primary", guide: true, tip: "この権限での流れを見る" }) + "</div></div>");
      }
      return html + botMsg('<div class="approval-card info"><div class="approval-head">' + icon("shield") + "<b>" + chosen()[1] + "で作業</b></div><p>" + (mode === "auto" ? "依頼に沿う編集かをチェックしながら進みます。" : "ファイルの編集を自動承認して進みます。") + "</p><div class=\"approval-actions\">" + ui("continue", "見出しの変更を実行", { cls: "primary", guide: true, tip: "編集を実行" }) + "</div></div>");
    }
    const done = '<div class="activity"><div class="tool-row">' + icon("file") + "<span>" + (app === "claude" ? "Read" : "読み取り") + ' index.html</span></div><div class="tool-row">' + icon("diff") + "<span>" + (app === "claude" ? "Edit" : "編集") + ' index.html</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div></div>';
    if (stage === 5) return html + botMsg(done + "<p>index.html の見出しを変更しました。ほかの文章やレイアウトは変更していません。</p>" + diffCard() + '<div class="msg-actions">' + ui("preview", icon("monitor") + "ブラウザで表示を確認", { cls: "secondary", guide: true, tip: "差分を読んだら表示を確認" }) + "</div>") + lab_('<p class="lab-note">差分は赤が変更前、緑が変更後です。</p>');
    return html + botMsg(done + "<p>index.html の見出しを変更しました。ほかの文章やレイアウトは変更していません。</p>" + diffCard()) +
      lab_('<p class="success">' + icon("check") + " 依頼 → 作業 → 差分 → 表示確認まで完了！</p><p>実機でも変更点を確認して、よければGitに履歴を残しましょう。</p>" + control("reset", "別の権限でもう一度", true) + control("switch-app", app === "codex" ? "Claude Codeも試す" : "Codexも試す", true));
  }
  function browserPane() {
    return '<aside class="browser-pane"><div class="browser-bar"><span class="nav-arrows">&#x2190; &#x2192;</span><span class="url">' + icon("lock") + "localhost:3000/index.html</span>" + icon("refresh") + '</div><div class="browser-page"><h3>' + title + "</h3><p>My first website</p></div></aside>";
  }
  /* ---------- shells ---------- */
  function composer() {
    const claude = app === "claude";
    const folderLabel = stage > 1 ? "my-website" : (claude ? "フォルダを選択" : "プロジェクトを選択");
    const hasText = !!prompt.trim();
    const sendSlot = running ? ui("stop", icon("stop"), { cls: "send stop", guide: true, tip: "作業中。途中で止めるにはここ" }) : ui("send", icon(claude || hasText ? "up" : "wave"), { cls: "send" + (claude || hasText ? "" : " voice"), guide: stage === 3 && hasText, disabled: stage !== 3, tip: "内容を読んで送信" });
    const folderBtn = ui("folder", icon("folder") + "<span>" + folderLabel + "</span>" + (claude ? icon("chevron", "chev") : ""), { cls: claude ? "chip" : "tray-item", guide: stage === 1 && !menu, disabled: stage !== 1, pressed: menu === "folder", tip: "作品フォルダを紐づける" });
    const full = !claude && mode === "full";
    const permBtn = ui("permission", icon(full ? "warn" : "shield") + "<span>" + chosen()[1] + "</span>" + (claude ? icon("chevron", "chev") : ""), { cls: "chip perm" + (full ? " full" : ""), guide: stage === 2 && !menu, disabled: stage !== 2, pressed: menu === "permission", tip: "任せる範囲を設定" });
    const envChip = '<span class="chip">' + icon("home") + "ローカル" + icon("chevron", "chev") + "</span>";
    const modelChip = claude ? '<span class="chip">Claude Opus 5.5' + icon("chevron", "chev") + "</span>" : '<span class="chip model">' + icon("moon") + "GPT-5.6 Luna 軽" + icon("chevron", "chev") + "</span>";
    const popup = menu === "folder" ? folderPopover() : menu === "permission" ? permissionPopover() : "";
    const placeholder = claude ? "Claude に任せたいタスクを入力" : "何でもどうぞ";
    const area = '<textarea id="request" class="' + (stage === 3 && !hasText ? "guided" : "") + '" data-tip="変更したいファイル・内容・条件を書く" aria-label="AIへの依頼文" placeholder="' + placeholder + '"' + (stage === 3 ? "" : " disabled") + ">" + escape(prompt) + "</textarea>";
    if (claude) {
      return '<div class="composer-wrap">' + popup + '<div class="composer claude">' + area + '<div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + "</span>" + envChip + folderBtn + '</div><div class="bar-right">' + permBtn + modelChip + sendSlot + "</div></div></div></div>";
    }
    return '<div class="composer-wrap">' + popup + '<div class="composer-stack"><div class="tray above">' + folderBtn + '</div><div class="composer codex">' + area + '<div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + "</span>" + permBtn + '</div><div class="bar-right">' + modelChip + '<span class="chip round plain">' + icon("mic") + "</span>" + sendSlot + '</div></div></div></div><p class="disclaimer">Codex は間違えることがあります。変更内容を確認してください。</p></div>';
  }
  function codexShell() {
    if (stage === 0) {
      const menuOpen = menu === "product";
      return '<div class="app-window gpt">' + winbar("ChatGPT", gptMark) + '<div class="app-body"><aside class="app-side"><div class="brand-wrap">' +
        ui("product-menu", gptMark + "<span>ChatGPT</span>" + icon("chevron", "chev"), { cls: "brand-btn", guide: !menuOpen, pressed: menuOpen, tip: "アプリの切り替えメニューを開く" }) +
        (menuOpen ? '<div class="popover product-menu" role="menu"><span class="pop-label">アプリを切り替え</span><span class="pop-item static">' + gptMark + "<span><b>ChatGPT</b><small>Chat / Work</small></span>" + icon("check", "trail") + "</span>" + ui("activate", codexMark + "<span><b>Codex</b><small>プロジェクト・ファイル・差分</small></span>", { cls: "pop-item", guide: true, tip: "Codex を選ぶ" }) + "</div>" : "") +
        '</div><nav class="side-nav"><span class="nav-item static">' + icon("compose") + "<span>新しいチャット</span></span><span class=\"nav-item static\">" + icon("search") + "<span>チャットを検索</span></span><span class=\"nav-item static\">" + icon("image") + "<span>ライブラリ</span></span><hr><span class=\"nav-item static\">" + icon("folder") + "<span>プロジェクト</span></span><span class=\"nav-item static\">" + icon("sparkle") + "<span>スキル</span></span><span class=\"nav-item static\">" + icon("puzzle") + '<span>プラグイン</span></span><p class="nav-section">最近</p><div class="recent"><span>文化祭サイトの見出し案</span><span>企画書のたたき台</span></div></nav><div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div></aside>' +
        '<section class="app-main"><div class="mobile-nav">' + ui("activate", codexMark + "Codex に切り替え", { cls: "nav-item", guide: true, tip: "開発用の Codex へ" }) + '</div><header class="app-top"><div class="top-left"></div><div class="seg"><span class="seg-btn" aria-pressed="true">Chat</span><span class="seg-btn" aria-pressed="false">Work</span></div><div class="top-right"><span class="avatar sm">S</span></div></header>' +
        '<div class="thread"><div class="empty-state"><h1>お手伝いできることはありますか？</h1></div>' + lab_('<p class="lab-note">Codex は ChatGPT アプリの中の開発用モードです。左上のメニューから切り替えます。</p>') + '</div><div class="composer-wrap"><div class="composer"><textarea disabled placeholder="質問してみましょう"></textarea><div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + '</span><span class="chip perm">' + icon("shield") + '承認を求める</span></div><div class="bar-right"><span class="chip model">' + icon("moon") + "GPT-5.6 Luna 軽" + icon("chevron", "chev") + '</span><span class="chip round plain">' + icon("mic") + '</span><span class="ui-btn send voice">' + icon("wave") + "</span></div></div></div></div></section></div></div>";
    }
    return '<div class="app-window gpt codex">' + winbar("Codex", codexMark) + '<div class="app-body"><aside class="app-side"><div class="brand-wrap"><span class="brand-btn static">' + codexMark + "<span>Codex</span>" + icon("chevron", "chev") + '</span></div><nav class="side-nav"><span class="nav-item static">' + icon("compose") + "<span>新しいチャット</span></span><span class=\"nav-item static\">" + icon("search") + "<span>検索</span><kbd>Ctrl+G</kbd></span><span class=\"nav-item static\">" + icon("puzzle") + "<span>プラグイン</span></span><span class=\"nav-item static\">" + icon("clock") + '<span>オートメーション</span></span><p class="nav-section">' + icon("pin") + 'ピン留め</p><p class="nav-section">プロジェクト</p>' + (stage > 1 ? '<span class="nav-item static on">' + icon("folder") + "<span>my-website</span></span>" : '<span class="nav-item static dim"><span>まだありません</span></span>') + '<p class="nav-section">チャット</p><div class="recent">' + (stage >= 4 ? "<span>" + escape(prompt.slice(0, 18)) + "…</span>" : "") + "<span>スタイルの調整</span></div></nav>" +
      '<div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div></aside><section class="app-main"><header class="app-top"><div class="top-left">' + (stage > 1 ? icon("folder") + "<b>my-website</b><span class=\"branch\">" + icon("branch") + "main</span>" : "<b>新しいチャット</b>") + '</div><div class="top-right">' + (stage >= 5 ? '<span class="ghost stat-pill"><b class="add">+1</b> <b class="del">−1</b></span>' : "") + '<span class="ghost">' + icon("dots") + '</span></div></header><div class="work-area' + (stage === 6 ? " split" : "") + '"><div class="thread">' + conversation() + "</div>" + (stage === 6 ? browserPane() : "") + "</div>" + composer() + "</section></div></div>";
  }
  function claudeShell() {
    const tabs = '<div class="claude-tabs" role="tablist"><span class="ctab" aria-selected="' + (stage === 0) + '">' + icon("chat") + "チャット</span><span class=\"ctab\" aria-selected=\"false\">" + icon("briefcase") + "Cowork</span>" + (stage === 0 ? ui("activate", icon("code") + "Code", { cls: "ctab", guide: true, pressed: false, tip: "Code タブへ切り替え" }) : '<span class="ctab" aria-selected="true">' + icon("code") + "Code</span>") + "</div>";
    const head = '<div class="win-title claude-title"><span class="win-app">' + claudeMark + "<span>Claude</span></span>" + tabs + '<span class="title-right"><span class="avatar sm">S</span>' + caption + "</span></div>";
    if (stage === 0) {
      return '<div class="app-window claude">' + head + '<div class="app-body"><aside class="app-side"><nav class="side-nav"><span class="nav-item static">' + icon("compose") + "<span>新しいチャット</span></span><span class=\"nav-item static\">" + icon("search") + "<span>検索</span></span><span class=\"nav-item static\">" + icon("folder") + '<span>プロジェクト</span></span><p class="nav-section">最近</p><div class="recent"><span>文化祭サイトの構成</span><span>見出し案の相談</span></div></nav><div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div></aside>' +
        '<section class="app-main"><div class="mobile-nav">' + ui("activate", icon("code") + "Code タブへ切り替え", { cls: "nav-item", guide: true, tip: "Code タブへ" }) + '</div><div class="thread"><div class="empty-state">' + claudeMark + "<h1>こんにちは、Student</h1></div>" + lab_('<p class="lab-note">Claude デスクトップでは、上部中央のタブでチャット・Cowork・Code を切り替えます。</p>') + '</div><div class="composer-wrap"><div class="composer claude"><textarea disabled placeholder="Claude に話しかけてみましょう"></textarea><div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + '</span></div><div class="bar-right"><span class="chip">Claude Opus 5.5' + icon("chevron", "chev") + '</span><span class="ui-btn send" aria-disabled="true">' + icon("up") + "</span></div></div></div></div></section></div></div>";
    }
    const sessionRow = stage >= 4 ? '<span class="session on"><i class="dot ' + (running ? "busy" : "ok") + '"></i><span>' + escape(prompt.slice(0, 16)) + "…</span></span>" : '<span class="session on"><i class="dot"></i><span>新しいセッション</span></span>';
    return '<div class="app-window claude">' + head + '<div class="app-body"><aside class="app-side"><div class="side-head">' + ui("noop", icon("plus") + "新しいセッション", { cls: "new-session", disabled: true }) + '</div><div class="side-filter"><span class="chip">' + icon("layout") + "プロジェクト別" + icon("chevron", "chev") + '</span></div><nav class="side-nav sessions"><p class="nav-section">' + (stage > 1 ? "my-website" : "グループなし") + "</p>" + sessionRow + '<span class="session"><i class="dot ok"></i><span>スタイルの調整</span></span></nav><div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div></aside>' +
      '<section class="app-main"><header class="app-top"><div class="top-left"><b>' + (stage >= 4 ? escape(prompt.slice(0, 22)) + "…" : "新しいセッション") + '</b></div><div class="top-right">' + (stage >= 5 ? '<span class="ghost stat-pill"><b class="add">+1</b> <b class="del">−1</b></span>' : "") + '<span class="ghost">Normal' + icon("chevron", "chev") + '</span><span class="ghost">' + icon("layout") + "ビュー</span></div></header>" +
      '<div class="work-area' + (stage === 6 ? " split" : "") + '"><div class="thread">' + conversation() + "</div>" + (stage === 6 ? browserPane() : "") + "</div>" + composer() + "</section></div></div>";
  }
  function render() {
    document.querySelectorAll("[data-app]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.app === app)));
    if (["modes", "skills", "plugins"].includes(app)) { window.ChatGPTLessons.render(); return; }
    progress.textContent = stage < 6 ? "STEP " + (stage + 1) + " / 6" : "COMPLETE";
    instruction.textContent = messages[stage];
    simulation.innerHTML = app === "codex" ? codexShell() : claudeShell();
    simulation.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => act(b.dataset.action)));
    simulation.querySelectorAll('[name="mode"]').forEach(r => r.addEventListener("change", () => { mode = r.value; render(); }));
    const request = simulation.querySelector("#request");
    if (request) {
      request.addEventListener("input", e => { prompt = e.target.value; const s = simulation.querySelector('[data-action="send"]'); if (s) s.classList.toggle("guided", stage === 3 && !!prompt.trim()); request.classList.toggle("guided", stage === 3 && !prompt.trim()); simulation.querySelector('[data-action="sample"]')?.classList.toggle("guided", !prompt.trim()); tour.update(); });
      request.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); act("send"); } });
    }
    tour.update();
  }
  function animate(done) {
    cancelRun(); running = true; response = ""; toolsShown = 0;
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
    if (action === "product-menu") menu = menu === "product" ? "" : "product";
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
    if (action === "execute-edits" || action === "execute-auto") {
      mode = action === "execute-edits" ? "edits" : "auto"; animate(() => { stage = 5; }); return;
    }
    if (["approve", "deny", "continue"].includes(action)) { animate(() => { stage = 5; }); return; }
    if (action === "stop") { cancelRun(); response = ""; toolsShown = 0; }
    if (action === "preview") stage = 6;
    if (action === "reset") { reset(); return; }
    if (action === "switch-app") { reset(app === "codex" ? "claude" : "codex"); return; }
    render();
    requestAnimationFrame(() => {
      const target = menu ? simulation.querySelector(".popover") : stage >= 4 ? simulation.querySelector(".thread .msg:last-of-type") : simulation.querySelector(".guided");
      target?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (action === "sample") simulation.querySelector("#request")?.focus();
    });
  }
  document.querySelector("#launch").addEventListener("click", () => {
    returnFocus = document.activeElement; reset(); lab.showModal(); document.body.classList.add("lab-open");
  });
  document.querySelector("#close").addEventListener("click", () => lab.close());
  lab.addEventListener("close", () => { cancelRun(); document.body.classList.remove("lab-open"); returnFocus?.focus(); });
  document.querySelector("#restart").addEventListener("click", () => reset());
  document.querySelectorAll("[data-app]").forEach(b => b.addEventListener("click", () => reset(b.dataset.app)));
  const top = document.querySelector("#toTop");
  const updateTop = () => { const visible = scrollY > 360; top.classList.toggle("is-visible", visible); top.tabIndex = visible ? 0 : -1; };
  addEventListener("scroll", updateTop, { passive: true }); updateTop();
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
})();
