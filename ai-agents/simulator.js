/* Codex practice course. Local teaching simulation: no real project, folder, network or account actions. */
(() => {
  "use strict";
  const lab = document.querySelector("#lab");
  const simulation = document.querySelector("#simulation");
  const progress = document.querySelector("#progress");
  const instruction = document.querySelector("#instruction");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { icon, escape, tour, gpt } = window.LabUI;
  let app = "modes", stage = 0, mode = "ask", menu = "", modal = "", timer, returnFocus;
  let projName = "", folderAdded = false, permChosen = false, modelChosen = false, model = "default", modalError = "";
  let prompt = "", response = "", running = false, error = "", toolsShown = 0;
  const title = "はじめてのAI制作";
  const folderName = "my-website";
  const sample = "index.htmlのh1を「はじめてのAI制作」に変更してください。ほかの文章やレイアウトは変えず、変更箇所と確認結果を教えてください。";
  /* Approval modes as labelled in the Codex composer (checked 2026-09-29). */
  const modes = [
    ["ask", "承認を求める", "外部ファイルの編集やインターネットの利用について、常に確認を求めます", "hand"],
    ["auto", "代わりに承認", "安全でない可能性があると検出された操作についてのみ確認を求めます", "bot"],
    ["full", "フルアクセス", "インターネットとコンピュータ上のすべてのファイルに無制限でアクセスします", "warn"]
  ];
  const models = [["default", "デフォルト", "おすすめのモデルセット"], ["GPT-6 Astra"], ["GPT-6 Sol"], ["GPT-6 Luna"], ["GPT-5.6 Sol"], ["GPT-5.6 Terra"], ["GPT-5.6 Luna"], ["GPT-5.5"]];
  const chosen = () => modes.find(m => m[0] === mode);
  const modelLabel = () => (model === "default" ? "GPT-5.6 Terra" : model) + " 軽";
  const control = (action, label, enabled, guided = false, tip = "") => '<button type="button" class="sim-control' + (guided ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (enabled ? "" : " disabled") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "", aria = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '" data-action="' + action + '"' + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (aria ? ' aria-label="' + aria + '" data-label="' + aria + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const lab_ = html => '<div class="lab-layer">' + html + "</div>";
  const messages = [
    "左上の「ChatGPT ▾」から Codex に切り替えましょう。",
    "「プロジェクトを選択」から新しいプロジェクトを作り、作品フォルダを紐づけましょう。",
    "承認方法（任せる範囲）とモデルを選びましょう。",
    "変更したいファイル・内容・条件を入力し、送信しましょう。",
    "作業内容を確認して、選んだ承認方法に応じた流れを体験しましょう。",
    "変更前後を確認して、ブラウザ表示を開きましょう。",
    "練習完了！別の承認方法でも試せます。"
  ];
  const userMsg = text => '<div class="msg msg-user"><div class="bubble">' + escape(text) + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot"><div class="msg-body">' + html + "</div></div>";
  const statPill = '<em class="stat"><b class="add">+1</b> <b class="del">−1</b></em>';
  const toolRows = () => {
    const rows = ['<div class="tool-row">' + icon("file") + "<span>読み取り index.html</span></div>", '<div class="tool-row">' + icon("diff") + "<span>編集 index.html</span>" + statPill + "</div>"];
    return '<div class="activity">' + rows.slice(0, toolsShown).join("") + "</div>";
  };
  const diffCard = () => '<div class="diff-card"><div class="diff-head">' + icon("file") + "<span>index.html</span>" + statPill + '</div><div class="diff"><del><i>3</i>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins><i>3</i>+ &lt;h1&gt;' + title + "&lt;/h1&gt;</ins></div></div>";
  function cancelRun() { clearTimeout(timer); running = false; }
  function reset(nextApp = app) {
    cancelRun(); app = nextApp; stage = 0; mode = "ask"; menu = ""; modal = "";
    projName = ""; folderAdded = false; permChosen = false; modelChosen = false; model = "default"; modalError = "";
    if (["modes", "skills", "plugins"].includes(app)) window.ChatGPTLessons.reset(app);
    if (app === "claude") window.ClaudeLesson.reset();
    prompt = ""; response = ""; error = ""; toolsShown = 0; render();
  }
  /* ---------- popovers above the composer ---------- */
  function projectPopover() {
    return '<div class="popover gproj" role="menu"><label class="gproj-search">' + icon("search") + '<input type="text" placeholder="プロジェクトを検索" aria-label="プロジェクトを検索" readonly></label><div class="gproj-list">' +
      ["portfolio", "文化祭2026", "課題メモ"].map((n, i) => '<span class="gpop-row' + (i === 0 ? " hi" : "") + (i === 2 ? " dim" : "") + '">' + icon("folder") + "<span>" + n + "</span></span>").join("") +
      '</div><div class="gproj-foot">' + ui("new-project", icon("plus") + "<span>新しいプロジェクト</span>", { cls: "gpop-row", guide: true, tip: "新しいプロジェクトを作る" }) + "</div></div>";
  }
  function permPopover() {
    return '<div class="popover gperm" role="menu"><div class="gperm-head"><span>ChatGPT のアクションの承認方法</span><u>詳細はこちら</u></div>' +
      modes.map(([key, label, detail, ic]) => ui("mode-" + key, icon(ic) + "<span><b>" + label + "</b><small>" + detail + "</small></span>" + (mode === key ? icon("check", "trail") : ""), { cls: "gperm-item" + (key === "full" ? " full" : "") + (mode === key ? " on" : ""), guide: !permChosen && key === "ask", tip: "説明を読んで選ぶ" })).join("") +
      '<span class="gperm-item static">' + icon("gear") + "<span><b>カスタム（config.toml）</b><small>config.toml で定義された権限を使用します</small></span></span></div>";
  }
  function modelPopover() {
    return '<div class="popover gmodel" role="menu">' + ui("model-list", icon("bolt", "blue") + "<b>" + modelLabel() + "</b>" + icon("chevr"), { cls: "gmodel-name", guide: true, tip: "モデル名を押すと一覧が開く" }) +
      '<div class="gmodel-slider" aria-hidden="true"><i class="knob"></i><i></i><i></i><i></i><i></i></div></div>';
  }
  function modelsPopover() {
    return '<div class="popover gmodels" role="menu"><span class="pop-label">モデルを選択</span>' +
      models.map(([key, label, sub]) => ui("model-" + key, "<span><b>" + (label || key) + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span>" + (model === key ? icon("check", "trail") : ""), { cls: "gmodels-item", guide: key === "default", tip: "迷ったらデフォルト（おすすめ）" })).join("") + "</div>";
  }
  /* ---------- dialogs ---------- */
  function createDialog() {
    const src = folderAdded
      ? '<div class="gm-folder">' + icon("folder") + "<span>" + folderName + "</span>" + ui("remove-folder", icon("close"), { cls: "gm-x", aria: "フォルダーを外す" }) + '</div><span class="gm-folder add">' + icon("folderplus") + "<span>フォルダーを追加</span></span>"
      : '<p class="gm-src-empty"><b>このコンピューター</b>のフォルダーを追加' + icon("chevron", "chev") + "</p>" + ui("add-folder", icon("folderplus") + "追加", { cls: "gm-add", guide: !!projName.trim(), tip: "作品フォルダを紐づける" });
    return '<div class="gm-back"><div class="gm-card" role="dialog" aria-modal="true" aria-labelledby="gm-title"><div class="gm-head"><h3 id="gm-title">プロジェクトを作成</h3>' + ui("close-modal", icon("close"), { cls: "gm-x", aria: "閉じる" }) + "</div>" +
      '<label class="gm-name">' + icon("folder") + '<input id="proj-name" type="text" placeholder="プロジェクト名" autocomplete="off" value="' + escape(projName) + '" class="' + (projName.trim() ? "" : "guided") + '" data-tip="プロジェクト名を入力（例：my-website）"></label>' +
      '<div class="gm-src-head"><b>ソースフォルダー</b>' + (folderAdded ? "<span>" + icon("laptop") + "このコンピューター</span>" : "") + '</div><div class="gm-src' + (folderAdded ? " filled" : "") + '">' + src + "</div>" +
      (modalError ? '<p class="feedback gm-error" role="alert">' + modalError + "</p>" : "") +
      '<div class="gm-foot">' + ui("close-modal", "キャンセル", { cls: "gm-text" }) + ui("create-project", "プロジェクトを作成", { cls: "gm-primary", guide: !!projName.trim() && folderAdded, tip: "内容を確認して作成" }) + "</div>" +
      lab_('<p class="lab-note">実機では「追加」でフォルダ選択の画面が開きます。練習では作品フォルダ <b>' + folderName + "</b> が選ばれます。</p>" + (projName.trim() ? "" : control("name-example", "例：my-website を入力", true))) + "</div></div>";
  }
  function trustDialog() {
    return '<div class="gm-back top"><div class="gm-card trust" role="alertdialog" aria-modal="true" aria-labelledby="gm-trust"><div class="gm-head center"><h3 id="gm-trust">このフォルダーを信頼しますか？</h3>' + ui("trust-cancel", icon("close"), { cls: "gm-x", aria: "閉じる" }) + "</div>" +
      '<p class="gm-path">C:\\Users\\student\\Desktop\\' + folderName + '</p><p class="gm-body">ChatGPT は、一覧にあるフォルダ内のファイルを読み取り、編集、実行できます。フォルダの設定によっては、モデルからのリクエストがなくてもコードが自動的に実行されることもあります。一覧にあるすべてのフォルダを信頼できる場合にのみ続けてください。</p>' +
      ui("trust", "フォルダーを信頼する", { cls: "gm-primary wide", guide: true, tip: "自分の作品フォルダなら信頼する" }) + ui("trust-cancel", "キャンセル", { cls: "gm-outline wide" }) + "</div></div>";
  }
  /* ---------- conversation ---------- */
  function heading() {
    return stage < 2 ? "何を作成しましょうか？" : '<span class="proj-u">' + escape(projName) + "</span>では何に取り組みますか？";
  }
  function conversation() {
    if (stage < 3) {
      const note = stage < 2 ? "練習用の新しいチャットです。赤枠と吹き出しの順に操作してください。" : "プロジェクトができました。次は、入力欄の下で承認方法とモデルを選びます。";
      return '<div class="empty-state">' + icon("cloudterm", "cloud") + "<h1>" + heading() + "</h1></div>" + lab_('<p class="lab-note">' + note + "</p>");
    }
    if (stage === 3) return '<div class="empty-state">' + icon("cloudterm", "cloud") + "<h1>" + heading() + "</h1></div>" + lab_('<div class="lab-card"><b>今回の課題</b><p>index.htmlの見出し「Hello!」を「' + title + '」に変更します。</p><small>例を使っても、自分の言葉で書いてもOK。練習ではこの見出し変更を再現します。</small>' + control("sample", "依頼文の例を入力", true, !prompt.trim(), "例文を入れる（自分で書いてもOK）") + "</div>" + (error ? '<p class="feedback" role="alert">' + error + "</p>" : ""));
    const html = userMsg(prompt);
    if (running) return html + botMsg(toolRows() + '<p class="typing" role="status">' + escape(response) + "</p>");
    if (stage === 4) {
      if (mode === "ask") return html + botMsg('<p>作業フォルダ内の h1 編集に毎回承認は必要ありません。ここでは追加で「HTML仕様の公式サイトを参照する」場面を練習します。</p><div class="approval-card"><div class="approval-head">' + icon("globe") + "<b>ネットワークアクセスの承認</b></div><code>curl https://html.spec.whatwg.org/</code><p>Codex が作業領域の外（インターネット）にアクセスしようとしています。</p><div class=\"approval-actions\">" + ui("deny", "許可しない", { cls: "secondary" }) + ui("approve", "今回のみ許可", { cls: "primary", guide: true, tip: "内容を読んで許可" }) + "</div></div>");
      return html + botMsg('<div class="approval-card info"><div class="approval-head">' + icon(chosen()[3]) + "<b>" + chosen()[1] + "</b></div><p>" + (mode === "auto" ? "安全でない可能性があると検出された操作だけ、確認を求められます。今回の参照は依頼に沿うため、そのまま進む流れです。" : "この設定では、ネットワークアクセスの承認待ちをせず進みます。") + "</p><div class=\"approval-actions\">" + ui("continue", "この設定での実行を体験", { cls: "primary", guide: true, tip: "この承認方法での流れを見る" }) + "</div></div>");
    }
    const done = '<div class="activity"><div class="tool-row">' + icon("file") + '<span>読み取り index.html</span></div><div class="tool-row">' + icon("diff") + "<span>編集 index.html</span>" + statPill + "</div></div>";
    const said = "<p>index.html の見出しを変更しました。ほかの文章やレイアウトは変更していません。</p>";
    if (stage === 5) return html + botMsg(done + said + diffCard() + '<div class="msg-actions">' + ui("preview", icon("monitor") + "ブラウザで表示を確認", { cls: "secondary", guide: true, tip: "差分を読んだら表示を確認" }) + "</div>") + lab_('<p class="lab-note">差分は赤が変更前、緑が変更後です。</p>');
    return html + botMsg(done + said + diffCard()) + lab_('<p class="success">' + icon("check") + " プロジェクト作成 → 依頼 → 作業 → 差分 → 表示確認まで完了！</p><p>実機でも変更点を確認して、よければGitに履歴を残しましょう。</p>" + control("reset", "別の承認方法でもう一度", true));
  }
  function browserPane() {
    return '<aside class="browser-pane"><div class="browser-bar"><span class="nav-arrows">&#x2190; &#x2192;</span><span class="url">' + icon("lock") + "localhost:3000/index.html</span>" + icon("refresh") + '</div><div class="browser-page"><h3>' + title + "</h3><p>My first website</p></div></aside>";
  }
  /* ---------- composer & shell ---------- */
  function composer() {
    const hasText = !!prompt.trim();
    const send = running ? ui("stop", icon("stop"), { cls: "gc-send", guide: true, tip: "作業中。途中で止めるにはここ", aria: "停止" }) : ui("send", icon(hasText ? "up" : "wave"), { cls: "gc-send" + (hasText ? "" : " voice"), guide: stage === 3 && hasText, disabled: stage !== 3, tip: "内容を読んで送信", aria: "送信" });
    const tray = ui("project", icon("folder") + "<span>" + (stage < 2 ? "プロジェクトを選択" : escape(projName)) + "</span>", { cls: "gtray-item" + (menu === "project" ? " open" : ""), guide: stage === 1 && !menu && !modal, disabled: stage !== 1, pressed: menu === "project", tip: "プロジェクトを選ぶ・作る", aria: "チャットを行うプロジェクトを選択 Ctrl+Alt+Shift+O" });
    const c = chosen();
    const perm = ui("permission", icon(c[3]) + "<span>" + c[1] + "</span>", { cls: "gc-perm" + (mode === "full" ? " full" : ""), guide: stage === 2 && !permChosen && !menu, disabled: stage !== 2, pressed: menu === "permission", tip: "ChatGPT に任せる範囲を選ぶ" });
    const modelOpen = menu === "model" || menu === "models";
    const modelBtn = ui("model", modelOpen && menu === "model" ? "<span>モデルを選択</span>" + icon("chevron", "chev") : icon("bolt") + "<span>" + modelLabel() + "</span>" + icon("chevron", "chev"), { cls: "gc-model gc-model-btn", guide: stage === 2 && permChosen && !modelChosen && !menu, disabled: stage !== 2, pressed: modelOpen, tip: "使うモデルを選ぶ", aria: "モデルを選択 Ctrl+Shift+M" });
    const popup = menu === "project" ? projectPopover() : menu === "permission" ? permPopover() : menu === "model" ? modelPopover() : menu === "models" ? modelsPopover() : "";
    return gpt.composer({ kind: "codex", id: "request", label: "AIへの依頼文", placeholder: "何でもどうぞ", value: stage === 3 ? prompt : "", disabled: stage !== 3, areaGuide: stage === 3 && !hasText, areaTip: "変更したいファイル・内容・条件を書く", perm, model: modelBtn, tray, popup, send });
  }
  function codexShell() {
    if (stage === 0) {
      const sw = gpt.productSwitch(ui, { product: "ChatGPT", open: menu === "product", toggle: "product-menu", codex: "activate", guideToggle: true, guideCodex: true, tip: "アプリの切り替えメニューを開く" });
      const main = gpt.top({ center: gpt.seg("Chat"), right: icon("temp") + icon("newwin") }) + '<div class="ghome"><h1 class="g-h1">今日は何が気になりますか？</h1>' +
        gpt.composer({ kind: "chat", id: "idle-prompt", placeholder: "ChatGPT に聞く", disabled: true, send: ui("noop", icon("wave"), { cls: "gc-send voice", disabled: true, aria: "音声モード" }) }) + gpt.suggestions +
        lab_('<p class="lab-note">Codex は ChatGPT アプリの中の開発用モードです。左上の「ChatGPT ▾」から切り替えます。</p>') + "</div>";
      return gpt.frame({ rail: gpt.rail(ui, "home"), panel: gpt.homePanel({ product: "ChatGPT", switcher: sw }), main, mobile: sw });
    }
    const project = stage >= 2 ? { name: projName, chats: stage >= 4 ? [prompt.slice(0, 16) + "…"] : [], active: true } : null;
    const panel = gpt.homePanel({ product: "Codex", switcher: gpt.productSwitch(ui, { product: "Codex" }), project, newActive: stage < 2 });
    const right = (stage >= 5 ? '<span class="ghost stat-pill"><b class="add">+1</b> <b class="del">−1</b></span>' : "") + icon("newwin");
    const main = gpt.top({ right }) + '<div class="work-area' + (stage === 6 ? " split" : "") + '"><div class="thread">' + conversation() + "</div>" + (stage === 6 ? browserPane() : "") + "</div>" + composer();
    const overlay = modal ? createDialog() + (modal === "trust" ? trustDialog() : "") : "";
    return gpt.frame({ rail: gpt.rail(ui, "home"), panel, main, cls: "codex", overlay });
  }
  function render() {
    document.querySelectorAll("[data-app]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.app === app)));
    if (["modes", "skills", "plugins"].includes(app)) { window.ChatGPTLessons.render(); return; }
    if (app === "claude") { window.ClaudeLesson.render(); return; }
    progress.textContent = stage < 6 ? "STEP " + (stage + 1) + " / 6" : "COMPLETE";
    instruction.textContent = messages[stage];
    simulation.innerHTML = codexShell();
    simulation.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => act(b.dataset.action)));
    const name = simulation.querySelector("#proj-name");
    if (name) {
      name.addEventListener("input", () => {
        projName = name.value; modalError = "";
        name.classList.toggle("guided", !projName.trim());
        simulation.querySelector('[data-action="add-folder"]')?.classList.toggle("guided", !!projName.trim());
        simulation.querySelector('[data-action="create-project"]')?.classList.toggle("guided", !!projName.trim() && folderAdded);
        tour.update();
      });
      name.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); act(folderAdded ? "create-project" : "add-folder"); } });
    }
    const request = simulation.querySelector("#request");
    if (request && !request.disabled) {
      request.addEventListener("input", e => {
        prompt = e.target.value;
        const s = simulation.querySelector('[data-action="send"]');
        if (s) { s.classList.toggle("guided", !!prompt.trim()); s.classList.toggle("voice", !prompt.trim()); s.innerHTML = icon(prompt.trim() ? "up" : "wave"); }
        request.classList.toggle("guided", !prompt.trim());
        simulation.querySelector('[data-action="sample"]')?.classList.toggle("guided", !prompt.trim());
        tour.update();
      });
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
    if (action === "project") menu = menu === "project" ? "" : "project";
    if (action === "new-project") { menu = ""; modal = "create"; modalError = ""; }
    if (action === "close-modal") { modal = ""; modalError = ""; }
    if (action === "name-example") projName = folderName;
    if (action === "add-folder") {
      const v = simulation.querySelector("#proj-name")?.value; if (v !== undefined) projName = v;
      folderAdded = true; modalError = "";
    }
    if (action === "remove-folder") folderAdded = false;
    if (action === "create-project") {
      const v = simulation.querySelector("#proj-name")?.value; if (v !== undefined) projName = v;
      if (!projName.trim()) modalError = "プロジェクト名を入力してください。";
      else if (!folderAdded) modalError = "「追加」から作品フォルダを紐づけてください。";
      else { modalError = ""; modal = "trust"; }
    }
    if (action === "trust-cancel") modal = "create";
    if (action === "trust") { modal = ""; projName = projName.trim(); stage = 2; }
    if (action === "permission") menu = menu === "permission" ? "" : "permission";
    if (action.startsWith("mode-")) { mode = action.slice(5); permChosen = true; menu = ""; }
    if (action === "model") menu = menu === "model" || menu === "models" ? "" : "model";
    if (action === "model-list") menu = "models";
    if (action.startsWith("model-") && action !== "model-list") { model = action.slice(6); modelChosen = true; menu = ""; }
    if (stage === 2 && permChosen && modelChosen) stage = 3;
    if (action === "sample") prompt = sample;
    if (action === "send") {
      if (!prompt.trim()) { error = "変更したい内容を入力してください。「依頼文の例を入力」も使えます。"; render(); return; }
      error = ""; stage = 4;
    }
    if (["approve", "deny", "continue"].includes(action)) { animate(() => { stage = 5; }); return; }
    if (action === "stop") { cancelRun(); response = ""; toolsShown = 0; }
    if (action === "preview") stage = 6;
    if (action === "reset") { reset(); return; }
    render();
    requestAnimationFrame(() => {
      if (modal) { const f = simulation.querySelector(modal === "trust" ? '[data-action="trust"]' : "#proj-name"); if (f && action !== "add-folder") f.focus(); return; }
      const target = menu ? simulation.querySelector(".popover") : stage >= 4 ? simulation.querySelector(".thread .msg:last-of-type") : simulation.querySelector(".guided");
      target?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (action === "sample") simulation.querySelector("#request")?.focus();
    });
  }
  /* Two launchers: ChatGPT / Codex and Claude / Claude Code open the same dialog with only their own courses. */
  const suites = { chatgpt: { title: "ChatGPT / Codex", first: "modes" }, claude: { title: "Claude / Claude Code", first: "claude" } };
  document.querySelectorAll("[data-launch]").forEach(button => button.addEventListener("click", () => {
    const suite = button.dataset.launch;
    lab.dataset.suite = suite;
    document.querySelector("#lab-suite").textContent = suites[suite].title;
    document.querySelectorAll(".lab-tabs [data-app]").forEach(b => { b.hidden = b.dataset.suite !== suite; });
    returnFocus = document.activeElement; reset(suites[suite].first); lab.showModal(); document.body.classList.add("lab-open");
  }));
  document.querySelector("#close").addEventListener("click", () => lab.close());
  lab.addEventListener("cancel", e => { if (app === "claude" && window.ClaudeLesson.closeMenu()) { e.preventDefault(); return; } if (app === "codex" && (modal || menu)) { e.preventDefault(); if (modal === "trust") modal = "create"; else if (modal) modal = ""; else menu = ""; render(); } });
  lab.addEventListener("close", () => { if (lab.open) return; cancelRun(); window.ClaudeLesson.stop(); document.body.classList.remove("lab-open"); returnFocus?.focus(); });
  document.querySelector("#restart").addEventListener("click", () => reset());
  document.querySelectorAll("[data-app]").forEach(b => b.addEventListener("click", () => reset(b.dataset.app)));
  const top = document.querySelector("#toTop");
  const updateTop = () => { const visible = scrollY > 360; top.classList.toggle("is-visible", visible); top.tabIndex = visible ? 0 : -1; };
  addEventListener("scroll", updateTop, { passive: true }); updateTop();
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }));
})();
