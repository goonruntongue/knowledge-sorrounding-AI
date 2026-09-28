/* Local teaching simulation. No installation, authentication, network or filesystem actions. */
window.LabUI = (() => {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    compose: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-9 9"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
    puzzle: '<path d="M10 4a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v1a2 2 0 1 1-4 0v-1H7a1 1 0 0 1-1-1v-3H5a2 2 0 1 1 0-4h1V6a1 1 0 0 1 1-1h3Z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12Z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-12 2-12 7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 17v5M8 3h8l-1 7 3 3H6l3-3Z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>',
    dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M3 10h6"/>',
    diff: '<path d="M12 3v8M8 7h8M4 17h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    wave: '<path d="M6 10v4M9 7v10M12 4v16M15 7v10M18 10v4"/>',
    warn: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16v.5"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    slash: '<path d="M16 4 8 20"/>',
    cloudterm: '<path d="M7.5 18.5A4 4 0 0 1 6.9 10.6 5.5 5.5 0 0 1 17.4 9.2 3.9 3.9 0 0 1 17.5 17c-.5 1-1.5 1.5-2.5 1.5H7.5Z"/><path d="m9.5 12 2 1.8-2 1.8M13 15.5h2.5"/>'
  };
  const icon = (name, cls = "") => brand[name] ? mark(name, cls) : '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + "</svg>";
  /* App marks: repository SVG logos (ChatGPT-Logo.svg / Claude-ai-icon.svg). GitHub mark: img/github.svg (see img/README.md). */
  const brand = { github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" };
  const mark = (name, cls = "") => '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="' + brand[name] + '"/></svg>';
  const logo = (file, cls) => '<span class="' + cls + '" aria-hidden="true"><img src="' + file + '" alt="" draggable="false"></span>';
  const gptMark = logo("ChatGPT-Logo.svg", "gpt-mark");
  const codexMark = logo("ChatGPT-Logo.svg", "codex-mark");
  const claudeMark = logo("Claude-ai-icon.svg", "claude-mark");
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const caption = '<span class="win-caption" aria-hidden="true"><i>&#x2500;</i><i>&#x2610;</i><i>&#x2715;</i></span>';
  const winbar = (title, iconHtml = "") => '<div class="win-title"><span class="win-app">' + iconHtml + "<span>" + title + '</span></span>' + caption + "</div>";
  const traffic = "";
  /* Floating tour tip: follows the first highlighted (.guided) control and says what to do there. */
  const tour = (() => {
    let root, tip, target, raf;
    const pick = () => {
      const all = [...root.querySelectorAll(".guided")].filter(el => el.offsetParent !== null && !el.disabled);
      return all.find(el => el.dataset.tip) || all[0] || null;
    };
    function place() {
      if (!tip || !target || !target.isConnected) { if (tip) tip.hidden = true; return; }
      const c = root.getBoundingClientRect(), r = target.getBoundingClientRect();
      let el = target.parentElement;
      while (el && el !== root) {
        const st = getComputedStyle(el);
        if (/(auto|scroll)/.test(st.overflowY + st.overflowX)) {
          const b = el.getBoundingClientRect();
          if (r.bottom < b.top + 4 || r.top > b.bottom - 4 || r.right < b.left || r.left > b.right) { tip.hidden = true; return; }
        }
        el = el.parentElement;
      }
      tip.hidden = false;
      const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 10;
      let top = r.bottom - c.top + gap, below = true;
      if (top + th > c.height - 6) { top = r.top - c.top - th - gap; below = false; }
      let left = r.left - c.left + r.width / 2 - tw / 2;
      left = Math.max(8, Math.min(left, c.width - tw - 8));
      const ax = Math.max(14, Math.min(r.left - c.left + r.width / 2 - left, tw - 14));
      tip.style.top = top + "px"; tip.style.left = left + "px"; tip.style.setProperty("--ax", ax + "px");
      tip.classList.toggle("above", !below);
    }
    function update() {
      if (!root) return;
      if (!tip || !tip.isConnected) { tip = document.createElement("div"); tip.className = "tour-tip"; tip.setAttribute("aria-hidden", "true"); root.appendChild(tip); }
      target = pick();
      if (!target) { tip.hidden = true; return; }
      const typing = target.matches("textarea,input");
      tip.innerHTML = "<b>" + (typing ? "ここに入力" : "ここをクリック") + "</b>" + (target.dataset.tip ? "<span>" + escape(target.dataset.tip) + "</span>" : "");
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
      place();
    }
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    return {
      init(r) { root = r; root.addEventListener("scroll", schedule, true); addEventListener("resize", schedule); if (window.ResizeObserver) new ResizeObserver(schedule).observe(root); },
      update() { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }
    };
  })();
  return { icon, gptMark, codexMark, claudeMark, escape, traffic, caption, winbar, tour };
})();

window.ChatGPTLessons = (() => {
  const root = document.querySelector("#simulation");
  const { icon, gptMark, codexMark, escape, winbar, tour } = window.LabUI;
  tour.init(root);
  let course, step, screen, selected, task, feedback, input, mention, installed, connected, menu, search, skillRoute;
  const attr = (action, guide) => ' data-learn="' + action + '"' + (guide ? ' data-guided="true"' : "");
  const button = (action, label, guide = false, tip = "") => '<button type="button" class="sim-control' + (guide ? " guided" : "") + '"' + attr(action) + (tip ? ' data-tip="' + escape(tip) + '"' : "") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '"' + attr(action) + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const hint = text => '<div class="coach">' + text + "</div>";
  const lab = html => '<div class="lab-layer">' + html + "</div>";
  const userMsg = text => '<div class="msg msg-user"><div class="bubble">' + escape(text) + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot">' + gptMark + '<div class="msg-body">' + html + "</div></div>";
  const scenarios = [
    { mode: "Chat", request: "文化祭サイトの見出し案を3つ相談したい。", why: "短い相談や案出しから始めたいので、Chatが自然な入口です。",
      result: '<p>文化祭サイトの見出し案を3つ考えました。</p><ol><li><strong>好きが集まる、わたしたちの文化祭</strong></li><li><strong>今日だけのワクワクを、ここに。</strong></li><li><strong>みんなでつくる、特別な一日</strong></li></ol><p>もう少し元気な雰囲気にすることもできます。</p>' },
    { mode: "Work", request: "開催情報を整理し、先生に見せる企画書を仕上げてほしい。", why: "確認して使える成果物まで任せたいので、Workを選びます。",
      result: '<div class="work-plan"><div class="work-plan-head">' + icon("check") + ' 3つのステップが完了</div><ul><li>' + icon("check") + '開催情報を整理</li><li>' + icon("check") + '企画書の構成を作成</li><li>' + icon("check") + '企画書を作成</li></ul></div><p>企画書のドラフトができました。学校名と開催日は先生に確認してください。</p><div class="file-card"><span class="file-badge doc">DOC</span><div><strong>文化祭サイト企画書.docx</strong><small>目的・構成（見どころ / タイムテーブル / アクセス）・次の確認事項</small></div></div>' },
    { mode: "Codex", request: "index.htmlのh1を変え、コードの差分と確認結果を見たい。", why: "ファイルや変更差分を見ながら開発したいので、Codexを選びます。",
      result: '<div class="activity"><div class="tool-row">' + icon("file") + '<span>index.html を読み取り</span></div><div class="tool-row">' + icon("diff") + '<span>index.html を編集</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div></div><p>h1 の文章だけを変更しました。他の要素は変更していません。</p>' + diffCard("index.html", "&lt;h1&gt;Hello!&lt;/h1&gt;", "&lt;h1&gt;みんなの文化祭&lt;/h1&gt;") }
  ];
  function diffCard(file, before, after) {
    return '<div class="diff-card"><div class="diff-head">' + icon("file") + '<span>' + file + '</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div><div class="diff"><del><i>3</i>− ' + before + '</del><ins><i>3</i>+ ' + after + '</ins></div></div>';
  }
  const skillSteps = ["Skillsを開いて、作業手順を追加しましょう。","作成用スキルを選びましょう。","覚えてほしい手順を依頼して送信しましょう。","作成されたスキルの内容と保存先を確認しましょう。","新しいチャットを開きましょう。","/ でスキルを選び、依頼を書いて送信しましょう。","スキルに沿った結果を確認できました。"];
  const pluginSteps = ["Pluginsを開きましょう。","GitHubを検索して詳細を開きましょう。","機能を確認して＋でインストールしましょう。","外部アカウントを接続する流れを体験しましょう。","接続先とアクセス範囲を確認しましょう。","導入後は、新しいチャットを開きましょう。","@でGitHubを選び、依頼を書いて送信しましょう。","プラグインを使った結果を確認できました。"];
  function reset(value) {
    course = value; step = 0; screen = "ChatGPT"; selected = "Chat"; task = 0; feedback = ""; input = ""; mention = false; installed = false; connected = false; menu = false; search = ""; skillRoute = "create";
  }
  /* ---------- app chrome ---------- */
  function sidebar() {
    const codex = screen === "Codex";
    const skillsGuide = course === "skills" && step === 0;
    const pluginsGuide = course === "plugins" && step === 0;
    const brand = '<div class="brand-wrap">' + switcher("brand-btn") + "</div>";
    const tips = { "open-skills": "スキル一覧を開く", "open-plugins": "プラグイン一覧を開く", "new-chat": "新しいチャットを開く" };
    const item = (ic, label, action, guide, extra = "") => (action ? ui(action, icon(ic) + "<span>" + label + "</span>" + extra, { cls: "nav-item", guide, tip: tips[action] }) : '<span class="nav-item static">' + icon(ic) + "<span>" + label + "</span>" + extra + "</span>");
    const newChatGuide = (course === "skills" && step === 4) || (course === "plugins" && step === 5);
    let nav;
    if (codex) {
      nav = item("compose", "新しいチャット", newChatGuide ? "new-chat" : "", newChatGuide) + item("search", "検索", "", false, '<kbd>Ctrl+G</kbd>') +
        item("puzzle", "プラグイン", course === "plugins" ? "open-plugins" : "", pluginsGuide) + item("sparkle", "スキル", course === "skills" ? "open-skills" : "", skillsGuide) + item("clock", "オートメーション", "") +
        '<p class="nav-section">' + icon("pin") + 'ピン留め</p><p class="nav-section">プロジェクト</p>' + item("folder", "my-website", "") +
        '<p class="nav-section">チャット</p><div class="recent">' + (installed && course === "skills" ? '<span>依頼文整理スキルの作成</span>' : "") + (installed && course === "plugins" ? '<span>GitHubプラグインの導入</span>' : "") + '<span>見出しの変更と確認</span><span>スタイルの調整</span></div>';
    } else {
      nav = item("compose", "新しいチャット", newChatGuide ? "new-chat" : "", newChatGuide) + item("search", "チャットを検索", "") + item("image", "ライブラリ", "") +
        '<hr>' + item("folder", "プロジェクト", "") + item("sparkle", "スキル", course === "skills" ? "open-skills" : "", skillsGuide) + item("puzzle", "プラグイン", course === "plugins" ? "open-plugins" : "", pluginsGuide) +
        '<p class="nav-section">最近</p><div class="recent"><span>文化祭サイトの見出し案</span><span>企画書のたたき台</span><span>アクセス案内の書き方</span></div>';
    }
    return '<aside class="app-side">' + brand + '<nav class="side-nav">' + nav + '</nav><div class="account"><span class="avatar">S</span><span><b>Student</b><small>練習用アカウント</small></span></div></aside>';
  }
  function switcher(cls) {
    const codex = screen === "Codex";
    const needCodex = course === "modes" && step === 0 && scenarios[task].mode === "Codex" && !codex;
    const needChat = course === "modes" && step === 0 && scenarios[task].mode !== "Codex" && codex;
    return ui("selector", (codex ? codexMark : gptMark) + "<span>" + screen + "</span>" + icon("chevron", "chev"), { cls, guide: (needCodex || needChat) && !menu, pressed: menu, tip: needCodex ? "メニューを開いて Codex に切り替え" : "メニューを開いて ChatGPT に戻る" }) +
      (menu ? '<div class="popover product-menu" role="menu"><span class="pop-label">アプリを切り替え</span>' +
        ui("product-chatgpt", gptMark + "<span><b>ChatGPT</b><small>Chat / Work</small></span>" + (codex ? "" : icon("check", "trail")), { cls: "pop-item", guide: needChat, tip: "ChatGPT を選ぶ" }) +
        ui("product-codex", codexMark + "<span><b>Codex</b><small>プロジェクト・ファイル・差分</small></span>" + (codex ? icon("check", "trail") : ""), { cls: "pop-item", guide: needCodex, tip: "Codex を選ぶ" }) + "</div>" : "");
  }
  function topbar() {
    if (screen === "Codex") {
      return '<header class="app-top"><div class="top-left">' + icon("folder") + '<b>my-website</b><span class="branch">' + icon("branch") + 'main</span></div><div class="top-right"><span class="ghost">' + icon("diff") + '差分</span><span class="ghost">' + icon("dots") + '</span></div></header>';
    }
    const want = course === "modes" && step === 0 ? scenarios[task].mode : "";
    const toggle = '<div class="seg" role="group" aria-label="Chat / Work">' + ["Chat", "Work"].map(m => ui("mode-" + m, m, { cls: "seg-btn", pressed: selected === m, guide: want === m && selected !== m, tip: m + " に切り替え" })).join("") + "</div>";
    return '<header class="app-top"><div class="top-left"></div>' + toggle + '<div class="top-right"><span class="ghost">' + icon("external") + '共有</span><span class="avatar sm">S</span></div></header>';
  }
  function composer({ placeholder, value = "", disabled = false, send = "send", sendGuide = false, sendTip = "依頼を送信", chip = "", popup = "", readonly = false, areaGuide = false, areaTip = "" } = {}) {
    const codex = screen === "Codex", work = !codex && selected === "Work";
    if (!placeholder) placeholder = codex ? "何でもどうぞ" : work ? "Work モードで作成" : "質問してみましょう";
    const permChip = '<span class="chip perm">' + icon("shield") + "承認を求める</span>";
    const modelChip = '<span class="chip model">' + icon("moon") + "GPT-5.6 Luna 軽" + icon("chevron", "chev") + "</span>";
    const hasText = !!value.trim();
    const sendBtn = ui(send, icon(hasText || sendGuide ? "up" : "wave"), { cls: "send" + (hasText || sendGuide ? "" : " voice"), guide: sendGuide, disabled, tip: sendTip });
    const project = '<span class="tray-item">' + icon("folder") + (codex ? "my-website" : "プロジェクトを選択") + "</span>";
    const tray = codex ? '<div class="tray above">' + project + "</div>" : work ? '<div class="tray below">' + project + '<span class="tray-item">' + icon("at") + 'プラグイン</span><span class="tray-right">' + icon("laptop") + "</span></div>" : "";
    return '<div class="composer-wrap">' + popup + '<div class="composer-stack">' + (codex ? tray : "") + '<div class="composer' + (codex ? " codex" : "") + '">' + (chip ? '<div class="chip-row">' + chip + "</div>" : "") +
      '<textarea id="learn-prompt" class="' + (areaGuide ? "guided" : "") + '" aria-label="練習用チャット入力欄" placeholder="' + placeholder + '"' + (areaTip ? ' data-tip="' + escape(areaTip) + '"' : "") + (disabled ? " disabled" : "") + (readonly ? " readonly" : "") + ">" + escape(value) + "</textarea>" +
      '<div class="composer-bar"><div class="bar-left"><span class="chip round">' + icon("plus") + "</span>" + permChip + '</div><div class="bar-right">' + modelChip + '<span class="chip round plain">' + icon("mic") + "</span>" + sendBtn + "</div></div></div>" + (codex ? "" : tray) + "</div>" +
      (codex ? "" : '<p class="disclaimer">ChatGPT の回答は必ずしも正しいとは限りません。重要な情報は確認するようにしてください。</p>') + "</div>";
  }
  function mentionPopup(name, show) {
    const skills = course === "skills";
    return '<div class="popover mention-results" id="mention-results"' + (show ? "" : " hidden") + '><span class="pop-label">' + (skills ? "スキル" : "プラグイン") + "</span>" +
      ui("mention", (skills ? icon("sparkle") : '<span class="plug-ic sm">' + icon("github") + "</span>") + "<span><b>" + (skills ? "$" : "@") + name + "</b><small>" + (skills ? "スキル · このプロジェクト" : "プラグイン · 接続済み") + "</small></span>", { cls: "pop-item", guide: true, tip: "候補から選んで指定" }) +
      (skills ? '<span class="pop-item static">' + icon("sparkle") + "<span><b>$skill-creator</b><small>スキルを作成する</small></span></span>" : '<span class="pop-item static"><span class="plug-ic sm">' + icon("file") + "</span><span><b>@Docs</b><small>プラグイン</small></span></span>") + "</div>";
  }
  const trigger = value => (course === "skills" ? /[\/$]/.test(value) : value.includes("@"));
  const stripTrigger = value => value.replace(/[@\/$][^\s　]*\s*/, "");
  function greeting() {
    return '<div class="empty-state">' + (screen === "Codex" ? icon("cloudterm", "cloud") : "") + "<h1>" + (screen === "Codex" ? "何を作成しましょうか？" : selected === "Work" ? "何に取り組みましょうか？" : "お手伝いできることはありますか？") + "</h1></div>";
  }
  /* ---------- courses ---------- */
  function modeContent() {
    const s = scenarios[task];
    if (step === 0) {
      return '<div class="thread">' + greeting() + lab('<div class="lab-card"><b>課題 ' + (task + 1) + ' / 3</b><p>' + s.request + '</p><small>この課題で選びやすい入口を試しましょう。WorkとCodexの能力には重なりがあります。</small></div>' + hint("画面の吹き出しに沿って、モードを選んでから送信") + '<p class="lab-now">現在：<strong>' + selected + "</strong></p>") + "</div>" +
        composer({ value: s.request, readonly: true, send: "try-mode", sendGuide: selected === s.mode, sendTip: selected === s.mode ? "このモードで依頼を送信" : "", placeholder: "" });
    }
    return '<div class="thread">' + userMsg(s.request) + botMsg(s.result) + lab('<p class="learn-summary">' + s.why + "</p>" + button("next-mode", task < 2 ? "次の依頼を試す" : "3つの違いを確認", true, task < 2 ? "次の課題へ" : "まとめを見る")) + "</div>" + composer({ disabled: true });
  }
  function modeComplete() {
    return '<div class="thread">' + lab('<div class="lab-card"><b>相談・成果物・開発</b><p>Chat：会話で考える<br>Work：成果物まで任せる<br>Codex：開発の詳細を見ながら進める</p><small>WorkとCodexの能力には重なりがあります。目的と見やすい画面で選びましょう。</small>' + button("again", "もう一度練習") + "</div>") + "</div>" + composer({ disabled: true });
  }
  function skillsContent() {
    const name = skillRoute === "create" ? "$skill-creator" : "$skill-installer";
    if (step === 0) return '<div class="thread">' + greeting() + lab('<p>同じ整理手順を何度も使えるように、Codexへスキルを導入する練習です。</p>' + hint("サイドバーの「スキル」を開く")) + "</div>" + composer({ disabled: true });
    if (step === 1) return '<div class="page"><div class="page-head"><h2>スキル</h2><p>作業手順を再利用できる指示のセットです。チャットでは <code>$スキル名</code> で呼び出します。</p></div><div class="card-grid">' +
      '<article class="app-card"><div class="card-top">' + icon("sparkle") + '<b>skill-installer</b><span class="tag">OpenAI</span></div><p>配布済みのスキルを名前やURLから追加します。</p>' + ui("installer", "チャットで使う", { cls: "primary", guide: true, tip: "配布済みスキルを入れる" }) + '</article>' +
      '<article class="app-card"><div class="card-top">' + icon("sparkle") + '<b>skill-creator</b><span class="tag">OpenAI</span></div><p>手順を説明して、自分用のスキルを作成します。</p>' + ui("creator", "チャットで使う", { cls: "secondary" }) + "</article></div>" + lab(hint("既存を入れるか、自分で作るかを選ぶ")) + "</div>";
    if (step === 2) return '<div class="thread">' + greeting() + lab('<p>' + (skillRoute === "create" ? "「依頼文整理」という教材用スキルを作ります。目的と手順を書きましょう。" : "教材として用意した「依頼文整理」を追加します。実機では、導入したいスキル名や配布元のURLを伝えます。") + "</p>" + button("example", "依頼文の例を入力")) + "</div>" +
      composer({ chip: '<span class="token">' + name + "</span>", placeholder: "覚えてほしい手順を入力", value: input, sendGuide: !!input.trim(), sendTip: "内容を読んで送信", areaGuide: !input.trim(), areaTip: "手順を書く（下の例文ボタンも使えます）" });
    if (step === 3) return '<div class="thread">' + userMsg(name + " " + (input || "依頼文整理スキルを作成")) + botMsg('<div class="activity"><div class="tool-row">' + icon("file") + '<span>' + (skillRoute === "create" ? ".agents/skills/request-organizer/SKILL.md を作成" : "依頼文整理 / SKILL.md を取得（教材配布データ）") + "</span></div></div><p>" + (skillRoute === "create" ? "スキルの作成案です。" : "配布内容を確認してください。") + "保存先：<b>" + (skillRoute === "create" ? "このプロジェクト内" : "自分用のスキル一覧") + '</b></p><div class="code-card"><div class="code-head">' + icon("file") + 'SKILL.md</div><pre>name: request-organizer\ndescription: 依頼文の整理に使う\n\n1. 目的を取り出す\n2. 対象ファイルを明確にする\n3. 変更内容と条件を分ける\n4. 不明点は推測せず質問する</pre></div>') +
      lab('<p>自分が繰り返したい手順になっているか確認します。</p>' + button("save-skill", "内容を確認して" + (skillRoute === "create" ? "保存" : "導入") + "（練習）", true, "SKILL.md を読んだら進む")) + "</div>" + composer({ disabled: true });
    if (step === 4) return '<div class="thread">' + botMsg('<p class="success">' + icon("check") + ' スキルを登録しました（練習）</p><p>スキル一覧：<b>依頼文整理</b> / ' + (skillRoute === "create" ? "このプロジェクト" : "自分用") + "</p>") + lab("<p>次はチャット欄から呼び出して使ってみましょう。</p>" + hint("サイドバーの「新しいチャット」を開く")) + "</div>" + composer({ disabled: true });
    if (step === 5) return '<div class="thread">' + greeting() + lab("<p>課題：「見出しを変えて。色はそのまま」を、スキルで整理します。</p>" + hint(mention ? "依頼を書いて送信" : "入力欄に / を入力し、候補を選ぶ") + button("example", "依頼文の例を入力")) + "</div>" +
      composer({ chip: mention ? '<span class="token">' + icon("sparkle") + "$依頼文整理</span>" : "", placeholder: "/ を入力して候補を選び、依頼を入力", value: input, sendGuide: mention && !!stripTrigger(input).trim(), popup: mentionPopup("依頼文整理", trigger(input) && !mention), areaGuide: !mention ? !trigger(input) : !stripTrigger(input).trim(), areaTip: mention ? "依頼内容を書く" : "/ または $ を入力すると候補が出ます" });
    return '<div class="thread">' + userMsg("$依頼文整理 " + input) + botMsg('<p><b>依頼文整理</b>を使って整理しました。</p><table class="kv"><tr><th>目的</th><td>見出しを変更する</td></tr><tr><th>対象ファイル</th><td>未指定</td></tr><tr><th>変更内容</th><td>新しい見出しの文章は未指定</td></tr><tr><th>条件</th><td>色は変えない</td></tr></table><p>確認したいこと：どのファイルの見出しを、何という文章に変えますか？</p>') +
      lab("<p>スキルの「不明点を推測しない」という手順も反映されています。</p>" + button("again", "もう一度練習")) + "</div>" + composer({ disabled: true });
  }
  function pluginCard(guide) {
    return '<article class="app-card plugin">' + '<div class="card-top"><span class="plug-ic">' + icon("github") + '</span><div><b>GitHub</b><small>By OpenAI</small></div><span class="tag desk">Desktop only</span></div><p>リポジトリ・Issue・PRなどを扱う道具と作業手順のセット。</p>' + ui("details", "詳細を見る", { cls: "secondary", guide, tip: "GitHub の詳細を開く" }) + "</article>";
  }
  function pluginsContent() {
    if (step === 0) return '<div class="thread">' + greeting() + lab("<p>GitHubプラグインを追加し、教材用リポジトリのREADMEを読む流れを体験します。</p>" + hint("サイドバーの「プラグイン」を開く")) + "</div>" + composer({ disabled: true });
    if (step === 1) return '<div class="page"><div class="page-head"><h2>プラグイン</h2><p>スキル・アプリ・テンプレートをまとめて追加します。</p></div><div class="search-row"><label class="search-box" for="plugin-search">' + icon("search") + '<input id="plugin-search" class="' + (search ? "" : "guided") + '" data-tip="GitHub と入力" value="' + escape(search) + '" placeholder="プラグインを検索"></label>' + ui("search", "検索", { cls: "primary", guide: !search, tip: "GitHub と入力して検索" }) + '</div><div class="pill-row"><span class="pill on">すべて</span><span class="pill">開発</span><span class="pill">ドキュメント</span><span class="pill">データ</span></div><div id="search-results" class="card-grid">' +
      (search ? (search.toLowerCase().includes("github") ? pluginCard(true) : '<p class="lab-note">教材では「GitHub」を検索してください。</p>') : '<article class="app-card dim"><div class="card-top"><span class="plug-ic">' + icon("file") + '</span><div><b>Docs</b><small>By OpenAI</small></div></div><p>ドキュメント作成の手順とテンプレート。</p></article><article class="app-card dim"><div class="card-top"><span class="plug-ic">' + icon("globe") + '</span><div><b>Web Research</b><small>By OpenAI</small></div></div><p>調査と出典整理のスキル。</p></article>') + "</div>" + lab(hint("GitHub を検索して詳細を開く")) + "</div>";
    if (step === 2) return '<div class="page"><div class="detail-head"><span class="plug-ic lg">' + icon("github") + '</span><div><h2>GitHub</h2><p>By OpenAI · <span class="tag desk">Desktop only</span></p></div>' + ui("install", icon("plus") + "インストール", { cls: "primary", guide: true, tip: "含まれる機能を確認して追加" }) + '</div><p>リポジトリの情報や開発作業を扱うプラグインです。この課題ではREADMEを読む機能を使います。</p><h3>含まれるもの</h3><div class="pill-row"><span class="pill">' + icon("sparkle") + 'スキル 3</span><span class="pill">' + icon("puzzle") + 'アプリ 1</span><span class="pill">' + icon("file") + 'テンプレート 2</span></div>' + lab(hint("説明と含まれる機能を確認して＋で追加")) + "</div>";
    if (step === 3) return '<div class="page"><div class="detail-head"><span class="plug-ic lg">' + icon("github") + '</span><div><h2>GitHub</h2><p class="success">' + icon("check") + ' インストール済み</p></div>' + ui("connect", "GitHubに接続", { cls: "primary", guide: true, tip: "アカウント接続を始める" }) + '</div><div class="notice">道具は追加されましたが、まだアカウントには接続していません。</div>' + lab(hint("外部アカウントに接続する")) + "</div>";
    if (step === 4) return '<div class="page"><div class="modal-card"><div class="modal-head"><span class="plug-ic">' + icon("github") + '</span><b>GitHub がアクセスを要求しています</b></div><dl class="kv-list"><dt>アカウント</dt><dd>student-demo</dd><dt>対象</dt><dd>school-festival</dd><dt>この練習で使う情報</dt><dd>選んだリポジトリのREADMEを読む</dd></dl><label class="check-row"><input id="scope-check" type="checkbox"> 接続先と表示されたアクセス範囲を確認しました</label><div class="modal-actions">' + ui("cancel-connect", "戻って確認する", { cls: "secondary" }) + ui("authorize", "接続を完了", { cls: "primary", guide: true, tip: "上のチェックを入れてから完了" }) + '</div></div>' + lab('<p class="lab-note">実際の認証画面・要求される権限はサービスにより異なります。このチェック欄は確認手順を学ぶための再現です。</p>') + "</div>";
    if (step === 5) return '<div class="page"><div class="detail-head"><span class="plug-ic lg">' + icon("github") + '</span><div><h2>GitHub</h2><p class="success">' + icon("check") + ' 接続済み · student-demo</p></div></div>' + lab("<p>新しいチャットで、プラグインを指定して頼んでみましょう。</p>" + hint("サイドバーの「新しいチャット」を開く")) + "</div>";
    if (step === 6) return '<div class="thread">' + greeting() + lab("<p>課題：GitHubのschool-festivalリポジトリのREADMEを要約します。</p>" + hint(mention ? "何を調べるか書いて送信" : "入力欄に @ を入力し、GitHubを選ぶ") + button("example", "依頼文の例を入力")) + "</div>" +
      composer({ chip: mention ? '<span class="token">' + icon("github") + "@GitHub</span>" : "", placeholder: "@を入力して候補を選び、依頼を入力", value: input, sendGuide: mention && !!stripTrigger(input).trim(), popup: mentionPopup("GitHub", trigger(input) && !mention), areaGuide: !mention ? !trigger(input) : !stripTrigger(input).trim(), areaTip: mention ? "調べたいことを書く" : "@ を入力すると候補が出ます" });
    return '<div class="thread">' + userMsg("@GitHub " + input) + botMsg('<div class="activity"><div class="tool-row">' + icon("github") + "<span>student-demo/school-festival の README.md を取得</span></div></div><p>文化祭の案内サイトです。<b>index.html</b>がトップページ、<b>css/style.css</b>がデザインを担当します。公開前に開催日時とアクセス情報を確認します。</p><div class=\"source-row\"><span class=\"source\">" + icon("github") + "school-festival / README.md</span></div>") +
      lab("<p>プラグインで情報にアクセスし、その情報に基づいて回答する流れを体験しました。</p>" + button("again", "もう一度練習")) + "</div>" + composer({ disabled: true });
  }
  function render() {
    const complete = course === "modes" ? step === 2 : course === "skills" ? step === 6 : step === 7;
    const instructions = course === "skills" ? skillSteps : pluginSteps;
    document.querySelector("#progress").textContent = complete ? "COMPLETE" : course === "modes" ? "課題 " + (task + 1) + " / 3" : "STEP " + (step + 1) + " / " + (course === "skills" ? 6 : 7);
    document.querySelector("#instruction").textContent = course === "modes" ? (complete ? "使い分けの練習が完了しました。" : step === 0 ? "依頼に合う入口を選んで送信しましょう。" : "結果と、選んだ理由を確認しましょう。") : instructions[step];
    const body = course === "modes" ? (complete ? modeComplete() : modeContent()) : course === "skills" ? skillsContent() : pluginsContent();
    const mobileNav = (course === "modes" && step === 0 ? '<div class="brand-wrap">' + switcher("nav-item") + "</div>" : "") + ((course === "skills" && step === 0) ? ui("open-skills", icon("sparkle") + "スキル", { cls: "nav-item", guide: true, tip: "スキル一覧を開く" }) : (course === "plugins" && step === 0) ? ui("open-plugins", icon("puzzle") + "プラグイン", { cls: "nav-item", guide: true, tip: "プラグイン一覧を開く" }) : ((course === "skills" && step === 4) || (course === "plugins" && step === 5)) ? ui("new-chat", icon("compose") + "新しいチャット", { cls: "nav-item", guide: true, tip: "新しいチャットを開く" }) : "");
    root.innerHTML = '<div class="app-window gpt' + (screen === "Codex" ? " codex" : "") + '">' + winbar(screen === "Codex" ? "Codex" : "ChatGPT", gptMark) + '<div class="app-body">' + sidebar() + '<section class="app-main"><div class="mobile-nav">' + mobileNav + "</div>" + topbar() + body +
      (feedback ? '<p class="feedback" role="alert">' + escape(feedback) + "</p>" : "") + "</section></div></div>";
    root.querySelectorAll("[data-learn]").forEach(el => el.addEventListener("click", () => act(el.dataset.learn)));
    const thread = root.querySelector(".thread");
    if (thread && thread.querySelector(".msg")) thread.scrollTop = thread.scrollHeight;
    const text = root.querySelector("#learn-prompt");
    if (text) {
      text.addEventListener("input", () => { input = text.value; const results = root.querySelector("#mention-results"); if (results) results.hidden = mention || !trigger(input) || (course === "skills" && step === 2); const sendBtn = root.querySelector('[data-learn="send"]'); if (sendBtn && (course !== "skills" || step !== 2)) sendBtn.classList.toggle("guided", mention && !!stripTrigger(input).trim()); if (sendBtn && course === "skills" && step === 2) sendBtn.classList.toggle("guided", !!input.trim()); text.classList.toggle("guided", course === "skills" && step === 2 ? !input.trim() : (!mention ? !trigger(input) : !stripTrigger(input).trim())); tour.update(); });
      text.addEventListener("keydown", event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); act("send"); } });
    }
    root.querySelector("#plugin-search")?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); act("search"); } });
    root.querySelector("#plugin-search")?.addEventListener("input", e => { e.target.classList.toggle("guided", !e.target.value.trim()); tour.update(); });
    tour.update();
  }
  function act(action) {
    feedback = "";
    if (action === "selector") menu = !menu;
    if (action === "product-chatgpt") { screen = "ChatGPT"; selected = "Chat"; menu = false; }
    if (action === "product-codex") { screen = "Codex"; selected = "Codex"; menu = false; }
    if (action.startsWith("mode-")) selected = action.slice(5);
    if (action === "try-mode") {
      if (selected === scenarios[task].mode) step = 1;
      else feedback = "この課題では " + scenarios[task].mode + " を試しましょう。" + scenarios[task].why + " ほかのモードでも対応できることはあります。";
    }
    if (action === "next-mode") { if (task < 2) { task++; step = 0; } else step = 2; }
    if (action === "open-skills" && course === "skills" && step === 0) { step = 1; screen = "Codex"; selected = "Codex"; }
    if (action === "creator") { step = 2; input = ""; }
    if (action === "installer") { skillRoute = "install"; step = 2; input = ""; }
    if (action === "save-skill") { installed = true; step = 4; }
    if (action === "open-plugins" && course === "plugins" && step === 0) step = 1;
    if (action === "search") search = root.querySelector("#plugin-search").value.trim();
    if (action === "details") step = 2;
    if (action === "install") { installed = true; step = 3; }
    if (action === "connect") step = 4;
    if (action === "authorize") {
      if (root.querySelector("#scope-check").checked) { connected = true; step = 5; }
      else feedback = "表示された接続先とアクセス範囲を確認し、チェックしてください。";
    }
    if (action === "cancel-connect") step = 3;
    if (action === "new-chat") { step = course === "skills" ? 5 : 6; input = ""; mention = false; }
    if (action === "mention") { mention = true; input = stripTrigger(input); }
    if (action === "example") {
      input = course === "skills" ? (step === 2 ? (skillRoute === "create" ? "「依頼文整理」をこのプロジェクト用に作って。目的・対象ファイル・変更内容・条件に整理し、不明点は質問して。" : "教材で配布された「依頼文整理」を自分用のスキルとして導入してください。") : "見出しを変えて。色はそのまま。") : "school-festivalのREADMEを要約して。";
      if (!(course === "skills" && step === 2) && !mention) input = (course === "skills" ? "/ " : "@ ") + input;
    }
    if (action === "send") {
      if (!input.trim()) feedback = "依頼内容を入力してください。例文も使えます。";
      else if (course === "skills" && step === 2) { step = 3; }
      else if (!mention) feedback = (course === "skills" ? "/ の候補からスキルを選んでください。" : "@ の候補からプラグインを選んでください。") + "文字を打つだけでなく、選択する操作を体験しましょう。";
      else if (!stripTrigger(input).trim()) feedback = "機能を選んだら、依頼内容も書きましょう。";
      else if (course === "skills" && installed) step = 6;
      else if (course === "plugins" && installed && connected) step = 7;
    }
    if (action === "again") reset(course);
    render();
    if (["example", "mention"].includes(action)) root.querySelector("#learn-prompt")?.focus();
  }
  return { reset, render };
})();
