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
    folderopen: '<path d="M3 18V6a1 1 0 0 1 1-1h5l2 2h7a1 1 0 0 1 1 1v2"/><path d="M3 18l2.6-7.2A1 1 0 0 1 6.5 10H21l-2.7 7.4a1 1 0 0 1-.9.6H3Z"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z"/>',
    puzzle: '<path d="M10 4a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v1a2 2 0 1 1-4 0v-1H7a1 1 0 0 1-1-1v-3H5a2 2 0 1 1 0-4h1V6a1 1 0 0 1 1-1h3Z"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    chevr: '<path d="m9 6 6 6-6 6"/>',
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
    cloudterm: '<path d="M7.5 18.5A4 4 0 0 1 6.9 10.6 5.5 5.5 0 0 1 17.4 9.2 3.9 3.9 0 0 1 17.5 17c-.5 1-1.5 1.5-2.5 1.5H7.5Z"/><path d="m9.5 12 2 1.8-2 1.8M13 15.5h2.5"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    fwd: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.3M12 16.6v.4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    temp: '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.2 2.6"/>',
    newwin: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
    clip: '<path d="M20.5 11.5 12.4 19.6a5 5 0 0 1-7-7l8.3-8.3a3.4 3.4 0 0 1 4.8 4.8L10.2 17.4a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
    shot: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M9 12h6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 20 4"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
    pen: '<path d="M4 20c3-.5 5-2 7-4.5M14.5 4.5l5 5-8.5 8.5-4.5 1 1-4.5Z"/>',
    gauge: '<path d="M4.5 17a8.5 8.5 0 1 1 15 0"/><path d="m12 15 3.5-4.5"/>',
    note: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M8 9h8M8 12.5h5M9 17l-2 3.5"/>',
    plug: '<path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0Z"/><path d="M12 17v4"/>',
    bolt: '<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6Z" fill="currentColor"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3 16a1.5 1.5 0 0 1 2.3-1.9L8 16"/>',
    bot: '<circle cx="12" cy="12" r="9"/><path d="m8.5 10 2.5 2-2.5 2M13 15h3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    enter: '<path d="M20 5v7a3 3 0 0 1-3 3H5M9 11l-4 4 4 4"/>',
    cloud: '<path d="M7.5 18.5A4 4 0 0 1 6.9 10.6 5.5 5.5 0 0 1 17.4 9.2 3.9 3.9 0 0 1 17.5 18.5Z"/>',
    shapes: '<circle cx="8" cy="8" r="4"/><path d="M14 13h6v6h-6ZM16 3l4 7h-8Z"/>',
    ring: '<circle cx="12" cy="12" r="4.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
    pr: '<circle cx="6" cy="5.5" r="2"/><circle cx="6" cy="18.5" r="2"/><circle cx="18" cy="18.5" r="2"/><path d="M6 7.5v9M18 16.5V10a3 3 0 0 0-3-3h-4M13 4.5 10.5 7l2.5 2.5"/>',
    sliders: '<path d="M6 4v16M18 4v16M12 4v16"/><circle cx="6" cy="9" r="2"/><circle cx="12" cy="15" r="2"/><circle cx="18" cy="8" r="2"/>',
    folderplus: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v3"/><path d="M3 7v11a2 2 0 0 0 2 2h7M18 15v6M15 18h6"/>'
  };
  /* App marks: repository SVG logos (ChatGPT-Logo.svg / Claude-ai-icon.svg). GitHub mark: img/github.svg (see img/README.md). */
  const brand = { github: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" };
  const mark = (name, cls = "") => '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="' + brand[name] + '"/></svg>';
  const icon = (name, cls = "") => brand[name] ? mark(name, cls) : '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + "</svg>";
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

  /* ---------- ChatGPT desktop app chrome (Windows, as of 2026-09). Shared by the ChatGPT / Codex lessons. ----------
     Left rail icons: img/rail/*.svg (provided by the repository owner). Everything else is a generic line icon. */
  const gpt = (() => {
    const plugTable = {
      GitHub: ["#fff", "#111", "gh"], Gmail: ["#fff", "#ea4335", "M"], "Google Drive": ["#fff", "#1fa463", "&#9650;"],
      Canva: ["linear-gradient(135deg,#00c4cc,#7d2ae8)", "#fff", "C"], "Adobe Express": ["#111", "#ff5c8a", "A"], Adobe: ["#fff", "#fa0f00", "A"],
      Figma: ["#fff", "#a259ff", "F"], Supabase: ["#fff", "#3ecf8e", "&#9889;&#xFE0E;"], Vercel: ["#fff", "#000", "&#9650;"], Netlify: ["#fff", "#20c6b7", "&#10035;"],
      Cloudflare: ["#f6821f", "#fff", "&#9729;&#xFE0E;"], "Google Calendar": ["#4285f4", "#fff", "31"], "Outlook Email": ["#0a64c8", "#fff", "O"],
      Shopify: ["#95bf47", "#fff", "S"], "Remote Desktop Commander": ["#111", "#fff", "DC"], "Plugin Creator": ["#5b57d9", "#fff", "&#10022;"],
      "Computer Use": ["#fff", "#333", "laptop"], Visualize: ["#fff", "#ef6f9a", "&#10047;"]
    };
    const plugBadge = (name, size = "") => {
      const [bg, fg, glyph] = plugTable[name] || ["#eee", "#333", escape(name[0])];
      const inner = glyph === "gh" ? icon("github") : glyph === "laptop" ? icon("laptop") : glyph;
      return '<span class="pb' + (size ? " " + size : "") + '" style="background:' + bg + ";color:" + fg + '" aria-hidden="true">' + inner + "</span>";
    };
    /* Skills cube from img/rail/skill.svg, inlined so it can take the text colour inside tokens. */
    const cube = '<svg class="ic cube" viewBox="63.2 -0.5 19 19" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" transform="translate(-23.375 -167.812)"><path d="M90.669,172.964l6.656-4.257,4.179,3.019-0.077,9.675-6.811,3.405-4.1-2.476Z"/><path d="M90.669,173.2l3.87,2.477,6.656-3.87"/><path d="M94.617,175.983l-0.077,8.746"/><path d="M90.747,177.608l3.792,2.554,6.811-3.792"/></g></svg>';
    const titlebar = '<div class="gwin-title"><span class="gwin-nav" aria-hidden="true">' + icon("back") + icon("fwd", "dim") + icon("sidebar") + '</span><span class="gwin-menu" aria-hidden="true"><span>ファイル</span><span>編集</span><span>表示</span><span>ヘルプ</span></span>' + caption + "</div>";
    const railItems = [["home", "ホーム"], ["schedule", "スケジュール"], ["library", "ライブラリ"], ["image", "画像"], ["customize", "Customize"]];
    const railImg = (name, on) => '<img src="img/rail/' + name + (on ? "-clicked" : "") + '.svg" alt="" draggable="false">';
    function rail(ui, active, actions = {}) {
      const items = railItems.map(([name, label]) => {
        const a = actions[name], on = name === active;
        if (a) return ui(a.action, railImg(name, on), { cls: "rail-btn" + (on ? " on" : ""), guide: a.guide, tip: a.tip, aria: label });
        return '<span class="rail-btn' + (on ? " on" : "") + '" data-label="' + label + '">' + railImg(name, on) + "</span>";
      }).join("");
      return '<nav class="grail" aria-label="アプリのナビゲーション">' + items + '<span class="rail-btn" data-label="その他">' + icon("dots") + '</span><span class="rail-fill"></span><span class="rail-btn" data-label="ヘルプ">' + icon("help") + '</span><span class="rail-avatar" aria-hidden="true">S</span></nav>';
    }
    /* "ChatGPT ▾" / "Codex ▾" product menu (two-line items, check on the current product). */
    function productSwitch(ui, { product, open = false, toggle = "", chatgpt = "", codex = "", guideToggle = false, guideChatgpt = false, guideCodex = false, tip = "" }) {
      const cur = product === "Codex";
      const item = (name, sub, action, guide, on) => {
        const inner = "<span><b>" + name + "</b><small>" + sub + "</small></span>" + (on ? icon("check", "trail") : "");
        return action ? ui(action, inner, { cls: "pm-item", guide, tip: name + " を選ぶ" }) : '<span class="pm-item static">' + inner + "</span>";
      };
      const label = "<span>" + product + "</span>" + icon("chevron", "chev");
      const btn = toggle ? ui(toggle, label, { cls: "gp-switch", guide: guideToggle && !open, pressed: !!open, tip }) : '<span class="gp-switch static">' + label + "</span>";
      return '<div class="gp-switch-wrap">' + btn + (open ? '<div class="pm-menu" role="menu">' + item("ChatGPT", "作成、学習、探索", chatgpt, guideChatgpt, !cur) + item("Codex", "ビルド、デバッグ、リリース", codex, guideCodex, cur) + "</div>" : "") + "</div>";
    }
    const row = (text, cls = "") => '<span class="gp-row' + (cls ? " " + cls : "") + '"><span>' + escape(text) + "</span></span>";
    const folder = (name, chats, active = false) => '<div class="gp-folder"><span class="gp-row' + (active ? " on" : "") + '">' + icon("folderopen") + "<span>" + escape(name) + "</span></span>" + (chats.length ? chats.map(c => row(c, "sub")).join("") : row("チャットはありません", "sub dim")) + "</div>";
    /* project: { name, chats, active } puts the practice project at the top of プロジェクト. */
    function homePanel({ product, switcher, project = null, newActive = true }) {
      const codex = product === "Codex";
      const list = '<p class="gp-label">ピン留め</p>' + row("文化祭サイトの見出し案") + row("自己紹介ページの文章") + '<p class="gp-label">プロジェクト</p>' +
        (project ? folder(project.name, project.chats || [], project.active) : "") + folder("portfolio", ["画像の並びを整える"]) + folder("文化祭2026", ["企画書のたたき台"]) + folder("課題メモ", []) +
        row("もっと表示する") + '<p class="gp-label">最近の項目</p>' + (codex ? ["READMEを要約", "フォームの入力チェックを追加"] : ["アクセス案内の書き方", "発表スライドの構成"]).map(t => row(t)).join("");
      return '<div class="gp-head">' + switcher + '<span class="gp-tools" aria-hidden="true">' + icon("bell") + icon("search") + '</span></div><span class="gp-row gp-new' + (newActive ? " on" : "") + '">' + icon("compose") + '<span>新しいチャット</span></span><div class="gp-scroll">' + list + "</div>";
    }
    const baseInstalled = ["Canva", "Adobe Express", "Gmail", "Adobe", "Google Calendar", "Netlify", "Supabase", "Vercel", "Cloudflare", "Figma", "Google Drive", "Computer Use", "Visualize"];
    function customizePanel(ui, { active, plugins, skills, github = false }) {
      const nav = (key, img, label, a) => {
        const on = active === key, inner = '<img src="img/rail/' + img + '" alt="" draggable="false"><span>' + label + "</span>";
        return a ? ui(a.action, inner, { cls: "gp-row nav" + (on ? " on" : ""), guide: a.guide, tip: a.tip }) : '<span class="gp-row nav' + (on ? " on" : "") + '">' + inner + "</span>";
      };
      const installed = github ? [...baseInstalled.slice(0, 8), "GitHub", ...baseInstalled.slice(8)] : baseInstalled;
      return '<div class="gp-head"><span class="gp-title">Customize</span><span class="gp-tools" aria-hidden="true">' + icon("search") + '</span></div><div class="gp-scroll">' + nav("plugins", "plugins.svg", "Plugins", plugins) + nav("skills", "skill.svg", "Skills", skills) +
        '<p class="gp-label">Installed</p>' + installed.map(n => '<span class="gp-row">' + plugBadge(n) + "<span>" + n + "</span></span>").join("") + "</div>";
    }
    const pageHead = (title, sub, placeholder, add) => '<div class="cz-head"><div><h2>' + title + "</h2><p>" + sub + '</p></div><div class="cz-tools"><span class="cz-search">' + icon("search") + placeholder + "</span>" + icon("refresh") + icon("gear") + add + "</div></div>";
    /* Customize > Plugins page. github: { installed, action, guide, tip } decides the GitHub row. */
    function pluginsPage(ui, { github = {}, lab = "", extra = "" } = {}) {
      const r = (name, desc, installed, a) => '<div class="pl-row">' + plugBadge(name, "lg") + "<div><b>" + name + "</b><small>" + desc + "</small></div>" +
        (a ? ui(a.action, icon("plus"), { cls: "pl-act", guide: a.guide, tip: a.tip, aria: name + " を追加" }) : '<span class="pl-act" aria-label="' + (installed ? "オプション" : "追加") + '">' + icon(installed ? "dots" : "plus") + "</span>") + "</div>";
      const gh = github.installed ? r("GitHub", "Triage PRs, issues, CI, and publish flows", true) : r("GitHub", "Triage PRs, issues, CI, and publish flows", false, github.action ? github : null);
      return '<div class="cz">' + pageHead("プラグイン", "プラグインを接続すると、ChatGPT がお使いのツールを横断して作業できます", "プラグインを検索", '<span class="cz-add">追加' + icon("chevron", "chev") + "</span>") + lab +
        '<div class="cz-tabs"><span class="on">公開</span><span>個人用</span></div><h3 class="cz-sec">人気' + icon("chevr") + '</h3><div class="pl-grid">' +
        r("Gmail", "Read and manage Gmail", true) + r("Remote Desktop Commander", "Build and automate, anywhere", false) + r("Google Drive", "Drive, Docs, Sheets or Slides", true) + gh + r("Outlook Email", "Triage Outlook inboxes", false) + r("Supabase", "Manage and query databases", true) +
        '</div><h3 class="cz-sec">新着・注目' + icon("chevr") + '</h3><div class="pl-grid">' + r("Adobe", "Design, combine, and edit", true) + r("Canva", "Create, review, edit designs", true) + r("Figma", "Create designs, ship to code", true) + r("Shopify", "Create and manage your store", false) + "</div>" + extra + "</div>";
    }
    /* Customize > Skills page. add: { action, guide, tip } makes the 追加 button live. */
    function skillsPage(ui, { add = null, custom = false, lab = "" } = {}) {
      const list = [...(custom ? [["依頼文整理", "依頼文を目的・対象ファイル・変更内容・条件に整理する"]] : []),
        ["Skill Creator", "Create or update a skill through guided questions"], ["Skill Installer", "Install skills from a curated list or a repository"],
        ["Documents", "Create and edit Word-style documents"], ["Spreadsheets", "Build, clean and analyze spreadsheets"],
        ["Presentations", "Create and edit slide decks"], ["Web Research", "Research a topic and cite the sources"]];
      const addBtn = add ? ui(add.action, "追加", { cls: "cz-add", guide: add.guide, tip: add.tip }) : '<span class="cz-add">追加</span>';
      return '<div class="cz">' + pageHead("スキル", "タスク特化型スキルで ChatGPT を拡張", "スキルを検索する", addBtn) + lab +
        '<div class="cz-tabs"><span class="on">個人</span><span class="on">システム</span><span>my-website</span></div><h3 class="cz-sec line">インストール済み</h3><div class="pl-grid">' +
        list.map(([n, d]) => '<div class="pl-row"><span class="sk-badge"><img src="img/rail/skill-badge.svg" alt="" draggable="false"></span><div><b>' + n + "</b><small>" + d + '</small></div><span class="pl-act" aria-label="インストール済み">' + icon("check") + "</span></div>").join("") +
        '</div><p class="cz-more">Documents、Spreadsheets、他 12 件を表示</p></div>';
    }
    /* Composer. kind: chat (single-line pill until there is text) / work (tray below) / codex (tray above). */
    function composer(o) {
      const kind = o.kind || "chat", chat = kind === "chat";
      const tall = !chat || !!o.value || !!o.token;
      const area = '<textarea id="' + (o.id || "learn-prompt") + '" class="' + (o.areaGuide ? "guided" : "") + '" rows="' + (tall ? 2 : 1) + '" aria-label="' + (o.label || "練習用チャット入力欄") + '" placeholder="' + escape(o.placeholder || "") + '"' + (o.areaTip ? ' data-tip="' + escape(o.areaTip) + '"' : "") + (o.disabled ? " disabled" : "") + (o.readonly ? " readonly" : "") + ">" + escape(o.value || "") + "</textarea>";
      const perm = chat ? "" : (o.perm || '<span class="gc-perm full">' + icon("warn") + "<span>フルアクセス</span></span>");
      const model = o.model || (chat ? '<span class="gc-model">中程度' + icon("chevron", "chev") + "</span>" : '<span class="gc-model">' + icon("bolt") + "GPT-5.6 Terra 軽" + icon("chevron", "chev") + "</span>");
      const box = '<div class="gcomp ' + kind + (tall ? " tall" : "") + '"><div class="gc-input">' + (o.token || "") + area + '</div><div class="gc-left"><span class="gc-ic" aria-hidden="true">' + icon("plus") + "</span>" + perm + '</div><div class="gc-right">' + model + '<span class="gc-ic" aria-hidden="true">' + icon("mic") + "</span>" + (o.send || "") + "</div></div>";
      const above = kind === "codex" ? '<div class="gtray above">' + (o.tray || '<span class="gtray-item">' + icon("folder") + "プロジェクトを選択</span>") + "</div>" : "";
      const below = kind === "work" ? '<div class="gtray below">' + (o.tray || '<span class="gtray-item">' + icon("folder") + '<span>プロジェクトを選択</span></span><span class="gtray-item">' + icon("at") + '<span>プラグイン</span></span><span class="gtray-end">' + icon("laptop") + "</span>") + "</div>" : "";
      return '<div class="gcomp-wrap ' + kind + '">' + (o.popup || "") + above + box + below + "</div>";
    }
    const top = ({ left = "", center = "", right = "" } = {}) => '<header class="gtop"><span class="gtop-l">' + left + "</span>" + (center || "<span></span>") + '<span class="gtop-r" aria-hidden="true">' + right + "</span></header>";
    const seg = selected => '<div class="gseg" aria-label="Chat / Work">' + ["Chat", "Work"].map(m => '<span class="gseg-btn" aria-pressed="' + (selected === m) + '">' + m + "</span>").join("") + "</div>";
    const suggestions = '<div class="g-suggest" aria-hidden="true"><span>' + icon("github") + "名言アプリの表示の誤りを見つけて、動く形に直す</span><span>" + plugBadge("Google Drive") + "文化祭の企画メモを、先生に見せる資料にまとめる</span><span>" + icon("briefcase", "brief") + "毎週月曜、学習の進み具合を振り返るメモを作る</span></div>";
    const frame = ({ rail: railHtml, panel = "", main, mobile = "", cls = "", overlay = "" }) => '<div class="app-window gpt2' + (cls ? " " + cls : "") + '">' + overlay + titlebar + '<div class="gbody' + (panel ? "" : " no-panel") + '">' + railHtml + (panel ? '<aside class="gpanel">' + panel + "</aside>" : "") + '<section class="app-main gmain"><div class="mobile-nav">' + mobile + "</div>" + main + "</section></div></div>";
    return { frame, rail, productSwitch, homePanel, customizePanel, pluginsPage, skillsPage, composer, top, seg, suggestions, plugBadge, cube };
  })();
  return { icon, gptMark, codexMark, claudeMark, escape, traffic, caption, winbar, tour, gpt };
})();

window.ChatGPTLessons = (() => {
  const root = document.querySelector("#simulation");
  const { icon, escape, tour, gpt } = window.LabUI;
  tour.init(root);
  let course, step, screen, selected, task, feedback, input, mention, installed, menu;
  const attr = action => ' data-learn="' + action + '"';
  const button = (action, label, guide = false, tip = "") => '<button type="button" class="sim-control' + (guide ? " guided" : "") + '"' + attr(action) + (tip ? ' data-tip="' + escape(tip) + '"' : "") + ">" + label + "</button>";
  const ui = (action, label, { guide = false, cls = "", disabled = false, pressed, tip = "", aria = "" } = {}) =>
    '<button type="button" class="ui-btn ' + cls + (guide ? " guided" : "") + '"' + attr(action) + (tip ? ' data-tip="' + escape(tip) + '"' : "") + (aria ? ' aria-label="' + aria + '" data-label="' + aria + '"' : "") + (disabled ? " disabled" : "") + (pressed !== undefined ? ' aria-pressed="' + pressed + '"' : "") + ">" + label + "</button>";
  const hint = text => '<div class="coach">' + text + "</div>";
  const lab = html => '<div class="lab-layer">' + html + "</div>";
  const userMsg = html => '<div class="msg msg-user"><div class="bubble">' + html + "</div></div>";
  const botMsg = html => '<div class="msg msg-bot"><div class="msg-body">' + html + "</div></div>";
  const creatorToken = '<span class="gtoken">' + gpt.cube + "Skill Creator</span>";
  const skillToken = '<span class="gtoken">' + gpt.cube + "依頼文整理</span>";
  const githubToken = '<span class="gtoken">' + icon("github") + "GitHub</span>";
  function diffCard(file, before, after) {
    return '<div class="diff-card"><div class="diff-head">' + icon("file") + '<span>' + file + '</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div><div class="diff"><del><i>3</i>− ' + before + '</del><ins><i>3</i>+ ' + after + '</ins></div></div>';
  }
  const scenarios = [
    { mode: "Chat", request: "文化祭サイトの見出し案を3つ相談したい。", why: "短い相談や案出しから始めたいので、Chatが自然な入口です。",
      result: '<p>文化祭サイトの見出し案を3つ考えました。</p><ol><li><strong>好きが集まる、わたしたちの文化祭</strong></li><li><strong>今日だけのワクワクを、ここに。</strong></li><li><strong>みんなでつくる、特別な一日</strong></li></ol><p>もう少し元気な雰囲気にすることもできます。</p>' },
    { mode: "Work", request: "開催情報を整理し、先生に見せる企画書を仕上げてほしい。", why: "確認して使える成果物まで任せたいので、Workを選びます。",
      result: '<div class="work-plan"><div class="work-plan-head">' + icon("check") + ' 3つのステップが完了</div><ul><li>' + icon("check") + '開催情報を整理</li><li>' + icon("check") + '企画書の構成を作成</li><li>' + icon("check") + '企画書を作成</li></ul></div><p>企画書のドラフトができました。学校名と開催日は先生に確認してください。</p><div class="file-card"><span class="file-badge doc">DOC</span><div><strong>文化祭サイト企画書.docx</strong><small>目的・構成（見どころ / タイムテーブル / アクセス）・次の確認事項</small></div></div>' },
    { mode: "Codex", request: "index.htmlのh1を変え、コードの差分と確認結果を見たい。", why: "ファイルや変更差分を見ながら開発したいので、Codexを選びます。",
      result: '<div class="activity"><div class="tool-row">' + icon("file") + '<span>index.html を読み取り</span></div><div class="tool-row">' + icon("diff") + '<span>index.html を編集</span><em class="stat"><b class="add">+1</b> <b class="del">−1</b></em></div></div><p>h1 の文章だけを変更しました。他の要素は変更していません。</p>' + diffCard("index.html", "&lt;h1&gt;Hello!&lt;/h1&gt;", "&lt;h1&gt;みんなの文化祭&lt;/h1&gt;") }
  ];
  const skillSteps = ["左端のアイコン列から Customize を開きましょう。", "左の一覧で Skills をクリックしましょう。", "右上の「追加」をクリックしましょう。", "Skill Creator に、作りたいスキルを説明して送信しましょう。", "作成されたスキルの内容と保存先を確認しましょう。", "左上の「ChatGPT ▾」から Codex に切り替えましょう。", "/ でスキルを選び、依頼を書いて送信しましょう。", "スキルに沿った結果を確認できました。"];
  const pluginSteps = ["左端のアイコン列から Customize を開きましょう。", "左の一覧で Plugins をクリックしましょう。", "GitHub の＋から追加しましょう。", "接続先とアクセス範囲を確認しましょう。", "追加できました。左端のホームに戻りましょう。", "左上の「ChatGPT ▾」から Codex に切り替えましょう。", "@ で GitHub を選び、依頼を書いて送信しましょう。", "プラグインを使った結果を確認できました。"];
  function reset(value) {
    course = value; step = 0; screen = "ChatGPT"; selected = "Chat"; task = 0; feedback = ""; input = ""; mention = false; installed = false; menu = false;
  }
  const kind = () => screen === "Codex" ? "codex" : selected === "Work" ? "work" : "chat";
  const placeholders = { chat: "ChatGPT に聞く", work: "Work モードで作成", codex: "何でもどうぞ" };
  const headings = { chat: "今日は何が気になりますか？", work: "何に取り組みましょうか？", codex: "何を作成しましょうか？" };
  const trigger = value => (course === "skills" ? /[\/$]/.test(value) : value.includes("@"));
  const stripTrigger = value => value.replace(/[@\/$][^\s　]*\s*/, "");
  const inCustomize = () => (course === "skills" && (step === 1 || step === 2)) || (course === "plugins" && step >= 1 && step <= 4);
  const wantMode = () => (course === "modes" && step === 0 ? scenarios[task].mode : "");
  /* ---------- chrome ---------- */
  function sendBtn(action, { text = false, guide = false, disabled = false, tip = "依頼を送信" } = {}) {
    const up = text || guide;
    return ui(action, icon(up ? "up" : "wave"), { cls: "gc-send" + (up ? "" : " voice"), guide, disabled, tip, aria: up ? "送信" : "音声モード" });
  }
  function comp(o = {}) {
    const k = kind();
    return gpt.composer(Object.assign({ kind: k }, o, { placeholder: o.placeholder !== undefined ? o.placeholder : placeholders[k], send: o.send || sendBtn("noop", { disabled: true }) }));
  }
  function top() {
    if (screen === "Codex") return gpt.top({ right: icon("newwin") });
    const want = wantMode();
    const center = course === "modes" && step === 0
      ? '<div class="gseg" role="group" aria-label="Chat / Work">' + ["Chat", "Work"].map(m => ui("mode-" + m, m, { cls: "gseg-btn", pressed: selected === m, guide: want === m && selected !== m, tip: m + " に切り替え" })).join("") + "</div>"
      : gpt.seg(selected);
    return gpt.top({ center, right: selected === "Work" ? icon("newwin") : icon("temp") + icon("newwin") });
  }
  function switcher() {
    const codex = screen === "Codex", want = wantMode();
    const needCodex = (want === "Codex" && !codex) || (course !== "modes" && step === 5);
    const needChat = !!want && want !== "Codex" && codex;
    const live = (course === "modes" && step === 0) || needCodex;
    return gpt.productSwitch(ui, { product: screen, open: menu && live, toggle: live ? "selector" : "", chatgpt: live ? "product-chatgpt" : "", codex: live ? "product-codex" : "", guideToggle: needCodex || needChat, guideChatgpt: needChat, guideCodex: needCodex, tip: needCodex ? "メニューを開いて Codex に切り替え" : "メニューを開いて ChatGPT に戻る" });
  }
  function panel() {
    if (inCustomize()) {
      return gpt.customizePanel(ui, {
        active: course === "skills" && step === 2 ? "skills" : "plugins",
        plugins: course === "plugins" && step === 1 ? { action: "open-plugins", guide: true, tip: "プラグインの一覧を開く" } : null,
        skills: course === "skills" && step === 1 ? { action: "open-skills", guide: true, tip: "スキルの一覧を開く" } : null,
        github: installed
      });
    }
    const extra = step === 7 ? [course === "skills" ? "見出しの依頼を整理" : "README の要約"] : course === "skills" && step >= 4 ? ["スキルを作成"] : [];
    return gpt.homePanel({ product: screen, switcher: switcher(), project: extra.length ? { name: "my-website", chats: extra } : null, newActive: !extra.length });
  }
  function rail() {
    const actions = {};
    if (course !== "modes" && step === 0) actions.customize = { action: "open-customize", guide: true, tip: "Customize を開く" };
    if (course === "plugins" && step === 4) actions.home = { action: "go-home", guide: true, tip: "ホームに戻る" };
    return gpt.rail(ui, inCustomize() ? "customize" : "home", actions);
  }
  /* The side panel is hidden on narrow screens; repeat the panel-level control that the step needs. */
  function mobileNav() {
    let html = (course === "modes" && step === 0) || (course !== "modes" && step === 5) ? switcher() : "";
    if (course === "skills" && step === 1) html += ui("open-skills", '<img src="img/rail/skill.svg" alt="">Skills', { cls: "nav-item", guide: true, tip: "スキルの一覧を開く" });
    if (course === "plugins" && step === 1) html += ui("open-plugins", '<img src="img/rail/plugins.svg" alt="">Plugins', { cls: "nav-item", guide: true, tip: "プラグインの一覧を開く" });
    return html;
  }
  function home(extra = "", o = {}, heading = "") {
    const k = kind();
    if (k === "codex") return top() + '<div class="thread"><div class="empty-state">' + icon("cloudterm", "cloud") + "<h1>" + headings.codex + "</h1></div>" + extra + "</div>" + comp(o);
    return top() + '<div class="ghome"><h1 class="g-h1">' + (heading || headings[k]) + "</h1>" + comp(o) + (o.noSuggest ? "" : gpt.suggestions) + extra + "</div>";
  }
  const convo = (thread, o = { disabled: true }) => top() + '<div class="thread">' + thread + "</div>" + comp(o);
  /* ---------- popups ---------- */
  function slashPopup(show) {
    const cmds = [["plug", "MCP", "MCP サーバーのステータスを表示します", 1], ["target", "ゴール", "ゴールを設定して、達成まで取り組む"], ["pen", "スケッチ", "スケッチを描く"], ["gauge", "ステータス", "チャット ID、コンテキスト使用量、レート制限を表示"], ["note", "フィードバック", "このチャットについてフィードバックを送信します"], ["bulb", "プランモード", "プランモードをオンにする"], ["folder", "プロジェクトで作成", "新しいチャット用のプロジェクトを選択", 1]];
    return '<div class="gpop" id="mention-results"' + (show ? "" : " hidden") + ">" + cmds.map(([ic, n, d, more], i) => '<span class="gpop-row' + (i === 0 ? " hi" : "") + '">' + icon(ic) + "<b>" + n + "</b><small>" + d + "</small>" + (more ? icon("chevr", "trail") : "") + "</span>").join("") +
      '<span class="gpop-label">スキル</span>' + ui("mention", gpt.cube + "<b>依頼文整理</b><small>依頼文を目的・対象・変更内容・条件に整理</small>", { cls: "gpop-row", guide: true, tip: "作ったスキルを選ぶ" }) + '<span class="gpop-row">' + gpt.cube + "<b>Skill Creator</b><small>スキルを作成・更新する</small></span></div>";
  }
  function atPopup(show) {
    const add = [["clip", "ファイルとフォルダー", "", 0, 1], ["shot", "アプリショットを添付", "", 1], ["folder", "プロジェクトで作成", "新しいチャット用のプロジェクトを選択"], ["target", "ゴール", "ゴールを設定して、達成まで取り組む"], ["bulb", "プランモード", "プランモードをオンにする"], ["pen", "スケッチ", "スケッチを描く"]];
    const plugs = [["Plugin Creator", "Create and edit plugins"], ["Canva", "Create, review, edit designs"], ["Adobe Express", "Design posts, flyers, and more"]];
    return '<div class="gpop" id="mention-results"' + (show ? "" : " hidden") + '><span class="gpop-label">追加</span>' + add.map(([ic, n, d, dim, hi]) => '<span class="gpop-row' + (dim ? " dim" : "") + (hi ? " hi" : "") + '">' + icon(ic) + "<b>" + n + "</b>" + (d ? "<small>" + d + "</small>" : "") + "</span>").join("") +
      '<span class="gpop-label">プラグイン</span>' + plugs.map(([n, d]) => '<span class="gpop-row">' + gpt.plugBadge(n) + "<b>" + n + "</b><small>" + d + "</small></span>").join("") +
      ui("mention", gpt.plugBadge("GitHub") + "<b>GitHub</b><small>Triage PRs, issues, CI, and publish flows</small>", { cls: "gpop-row", guide: true, tip: "GitHub を選ぶ" }) + "</div>";
  }
  function useComposer(token, popup, placeholder, tipBefore) {
    const ready = mention && !!stripTrigger(input).trim();
    return { token: mention ? token : "", placeholder, value: input, send: sendBtn("send", { text: !!input.trim(), guide: ready, tip: "内容を読んで送信" }), popup, areaGuide: !mention ? !trigger(input) : !ready, areaTip: mention ? "依頼内容を書く" : tipBefore };
  }
  /* ---------- courses ---------- */
  function modeContent() {
    const s = scenarios[task];
    if (step === 0) {
      return home(lab('<div class="lab-card"><b>課題 ' + (task + 1) + " / 3</b><p>" + s.request + '</p><small>この課題で選びやすい入口を試しましょう。WorkとCodexの能力には重なりがあります。</small></div>' + hint("吹き出しに沿って、モードを選んでから送信") + '<p class="lab-now">現在：<strong>' + (screen === "Codex" ? "Codex" : selected) + "</strong></p>"),
        { value: s.request, readonly: true, noSuggest: true, send: sendBtn("try-mode", { text: true, guide: selected === s.mode, tip: "このモードで依頼を送信" }) });
    }
    return convo(userMsg(escape(s.request)) + botMsg(s.result) + lab('<p class="learn-summary">' + s.why + "</p>" + button("next-mode", task < 2 ? "次の依頼を試す" : "3つの違いを確認", true, task < 2 ? "次の課題へ" : "まとめを見る")));
  }
  function modeComplete() {
    return convo(lab('<div class="lab-card"><b>相談・成果物・開発</b><p>Chat：会話で考える<br>Work：成果物まで任せる<br>Codex：開発の詳細を見ながら進める</p><small>WorkとCodexの能力には重なりがあります。目的と見やすい画面で選びましょう。</small>' + button("again", "もう一度練習") + "</div>"));
  }
  function skillThread(saved) {
    let html = userMsg(creatorToken + " " + escape(input)) + botMsg('<div class="activity"><div class="tool-row">' + icon("file") + '<span>request-organizer/SKILL.md を作成</span></div></div><p>スキルの下書きを作りました。保存先：<b>個人のスキル</b></p><div class="code-card"><div class="code-head">' + icon("file") + "SKILL.md</div><pre>---\nname: 依頼文整理\ndescription: 依頼文を目的・対象ファイル・変更内容・条件に整理する\n---\n\n1. 目的を取り出す\n2. 対象ファイルを明確にする\n3. 変更内容と条件を分ける\n4. 不明点は推測せず質問する</pre></div>");
    if (saved) html += botMsg('<p class="success">' + icon("check") + " スキル「依頼文整理」を保存しました（練習）</p><p>Customize の Skills に表示され、チャット欄の / から呼び出せます。</p>");
    return html;
  }
  function skillsContent() {
    if (step === 0) return home(lab("<p>よく使う作業手順を「スキル」として登録し、チャットから呼び出す流れを練習します。</p>" + hint("左端のアイコン列から Customize を開く")), { disabled: true });
    if (step === 1) return gpt.pluginsPage(ui, { lab: lab(hint("左の一覧で Skills をクリック")) });
    if (step === 2) return gpt.skillsPage(ui, { add: { action: "add-skill", guide: true, tip: "スキルを追加する" }, lab: lab(hint("右上の「追加」をクリック")) });
    if (step === 3) return home(lab("<p>「追加」を押すと、Skill Creator が呼び出された新しいチャットが開きます。作りたいスキルの内容を書いて送信しましょう。</p>" + button("example", "依頼文の例を入力")),
      { token: creatorToken, value: input, noSuggest: true, send: sendBtn("send", { text: !!input.trim(), guide: !!input.trim(), tip: "内容を読んで送信" }), areaGuide: !input.trim(), areaTip: "作りたいスキルの説明を書く" }, "どこから始めましょうか？");
    if (step === 4) return convo(skillThread(false) + lab("<p>自分が繰り返したい手順になっているか確認します。</p>" + button("save-skill", "内容を確認して保存（練習）", true, "SKILL.md を読んだら保存")));
    if (step === 5) return convo(skillThread(true) + lab("<p>作ったスキルを、開発用の Codex から呼び出してみましょう。</p>" + hint("左上の「ChatGPT ▾」から Codex に切り替え")));
    if (step === 6) return home(lab("<p>課題：「見出しを変えて。色はそのまま」を、作ったスキルで整理します。</p>" + hint(mention ? "依頼を書いて送信" : "入力欄に / を入力し、スキルを選ぶ") + button("example", "依頼文の例を入力")),
      useComposer(skillToken, slashPopup(trigger(input) && !mention), "/ を入力してスキルを選ぶ", "/ を入力するとコマンドとスキルの一覧が開きます"));
    return convo(userMsg(skillToken + " " + escape(input)) + botMsg('<p><b>依頼文整理</b>を使って整理しました。</p><table class="kv"><tr><th>目的</th><td>見出しを変更する</td></tr><tr><th>対象ファイル</th><td>未指定</td></tr><tr><th>変更内容</th><td>新しい見出しの文章は未指定</td></tr><tr><th>条件</th><td>色は変えない</td></tr></table><p>確認したいこと：どのファイルの見出しを、何という文章に変えますか？</p>') +
      lab("<p>スキルの「不明点を推測しない」という手順も反映されています。</p>" + button("again", "もう一度練習")));
  }
  function pluginsContent() {
    if (step === 0) return home(lab("<p>GitHubプラグインを追加し、教材用リポジトリのREADMEを読む流れを体験します。</p>" + hint("左端のアイコン列から Customize を開く")), { disabled: true });
    if (step === 1) return gpt.pluginsPage(ui, { lab: lab(hint("左の一覧で Plugins をクリック")) });
    if (step === 2) return gpt.pluginsPage(ui, { github: { action: "install", guide: true, tip: "＋から GitHub を追加" }, lab: lab(hint("「人気」の GitHub の＋をクリック")) });
    if (step === 3) return gpt.pluginsPage(ui, { extra: '<div class="cz-modal"><div class="modal-card" role="dialog" aria-label="GitHub の追加と接続"><div class="modal-head">' + gpt.plugBadge("GitHub", "md") + '<b>GitHub を追加して接続</b></div><p class="modal-desc">Triage PRs, issues, CI, and publish flows</p><dl class="kv-list"><dt>追加されるもの</dt><dd>スキル・GitHub 用のツール</dd><dt>アカウント</dt><dd>student-demo</dd><dt>この練習で使う範囲</dt><dd>school-festival の README を読む</dd></dl><label class="check-row"><input id="scope-check" type="checkbox"> 接続先と表示されたアクセス範囲を確認しました</label><div class="modal-actions">' + ui("cancel-connect", "キャンセル", { cls: "secondary" }) + ui("authorize", "接続して追加", { cls: "primary", guide: true, tip: "上のチェックを入れてから" }) + '</div><p class="lab-note">実際の認証画面・要求される権限はサービスにより異なります。この画面は確認手順を学ぶための再現です。</p></div></div>' });
    if (step === 4) return gpt.pluginsPage(ui, { github: { installed: true }, lab: '<p class="cz-toast">' + icon("check") + " GitHub を追加しました（練習）</p>" + lab(hint("左端のホームに戻る")) });
    if (step === 5) return home(lab("<p>GitHub が使えるようになりました。開発用の Codex で呼び出してみます。</p>" + hint("左上の「ChatGPT ▾」から Codex に切り替え")), { disabled: true });
    if (step === 6) return home(lab("<p>課題：GitHubのschool-festivalリポジトリのREADMEを要約します。</p>" + hint(mention ? "何を調べるか書いて送信" : "入力欄に @ を入力し、GitHubを選ぶ") + button("example", "依頼文の例を入力")),
      useComposer(githubToken, atPopup(trigger(input) && !mention), "@ を入力してプラグインを選ぶ", "@ を入力すると候補が出ます"));
    return convo(userMsg(githubToken + " " + escape(input)) + botMsg('<div class="activity"><div class="tool-row">' + icon("github") + "<span>student-demo/school-festival の README.md を取得</span></div></div><p>文化祭の案内サイトです。<b>index.html</b>がトップページ、<b>css/style.css</b>がデザインを担当します。公開前に開催日時とアクセス情報を確認します。</p><div class=\"source-row\"><span class=\"source\">" + icon("github") + "school-festival / README.md</span></div>") +
      lab("<p>プラグインで情報にアクセスし、その情報に基づいて回答する流れを体験しました。</p>" + button("again", "もう一度練習")));
  }
  function render() {
    const complete = course === "modes" ? step === 2 : step === 7;
    document.querySelector("#progress").textContent = complete ? "COMPLETE" : course === "modes" ? "課題 " + (task + 1) + " / 3" : "STEP " + (step + 1) + " / 7";
    document.querySelector("#instruction").textContent = course === "modes" ? (complete ? "使い分けの練習が完了しました。" : step === 0 ? "依頼に合う入口を選んで送信しましょう。" : "結果と、選んだ理由を確認しましょう。") : (course === "skills" ? skillSteps : pluginSteps)[step];
    const body = course === "modes" ? (complete ? modeComplete() : modeContent()) : course === "skills" ? skillsContent() : pluginsContent();
    root.innerHTML = gpt.frame({ rail: rail(), panel: panel(), main: body + (feedback ? '<p class="feedback" role="alert">' + escape(feedback) + "</p>" : ""), mobile: mobileNav(), cls: screen === "Codex" ? "codex" : "" });
    root.querySelectorAll("[data-learn]").forEach(el => el.addEventListener("click", () => act(el.dataset.learn)));
    const thread = root.querySelector(".thread");
    if (thread && thread.querySelector(".msg")) thread.scrollTop = thread.scrollHeight;
    const results = root.querySelector("#mention-results");
    if (results && !results.hidden) results.scrollTop = results.scrollHeight;
    const text = root.querySelector("#learn-prompt");
    if (text && !text.readOnly && !text.disabled) {
      text.addEventListener("input", () => {
        input = text.value;
        const pop = root.querySelector("#mention-results");
        if (pop) { const show = !mention && trigger(input); pop.hidden = !show; if (show) pop.scrollTop = pop.scrollHeight; }
        const creating = course === "skills" && step === 3;
        const ready = creating ? !!input.trim() : mention && !!stripTrigger(input).trim();
        const send = root.querySelector('[data-learn="send"]');
        if (send) { send.classList.toggle("guided", ready); send.classList.toggle("voice", !input.trim()); send.innerHTML = icon(input.trim() ? "up" : "wave"); }
        text.classList.toggle("guided", creating ? !input.trim() : !mention ? !trigger(input) : !ready);
        tour.update();
      });
      text.addEventListener("keydown", event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); act("send"); } });
    }
    tour.update();
  }
  function act(action) {
    if (action === "noop") return;
    feedback = "";
    if (action === "selector") menu = !menu;
    if (action === "product-chatgpt") { if (screen !== "ChatGPT") { screen = "ChatGPT"; selected = "Chat"; } menu = false; }
    if (action === "product-codex") { screen = "Codex"; selected = "Codex"; menu = false; if (course !== "modes" && step === 5) { step = 6; input = ""; mention = false; } }
    if (action.startsWith("mode-")) selected = action.slice(5);
    if (action === "try-mode") {
      if (selected === scenarios[task].mode) step = 1;
      else feedback = "この課題では " + scenarios[task].mode + " を試しましょう。" + scenarios[task].why + " ほかのモードでも対応できることはあります。";
    }
    if (action === "next-mode") { if (task < 2) { task++; step = 0; } else step = 2; }
    if (action === "open-customize" && step === 0) step = 1;
    if (action === "open-skills" && course === "skills" && step === 1) step = 2;
    if (action === "add-skill") { step = 3; screen = "ChatGPT"; selected = "Chat"; input = "help me create a skill"; }
    if (action === "save-skill") step = 5;
    if (action === "open-plugins" && course === "plugins" && step === 1) step = 2;
    if (action === "install") step = 3;
    if (action === "cancel-connect") step = 2;
    if (action === "authorize") {
      if (root.querySelector("#scope-check").checked) { installed = true; step = 4; }
      else feedback = "表示された接続先とアクセス範囲を確認し、チェックしてください。";
    }
    if (action === "go-home") { step = 5; screen = "ChatGPT"; selected = "Chat"; }
    if (action === "mention") { mention = true; input = stripTrigger(input); }
    if (action === "example") {
      if (course === "skills" && step === 3) input = "「依頼文整理」というスキルを作って。依頼文を 目的・対象ファイル・変更内容・条件 に整理し、不明点は推測せず質問する手順にして。";
      else input = (mention ? "" : course === "skills" ? "/ " : "@ ") + (course === "skills" ? "見出しを変えて。色はそのまま。" : "school-festivalのREADMEを要約して。");
    }
    if (action === "send") {
      if (!input.trim()) feedback = "依頼内容を入力してください。例文も使えます。";
      else if (course === "skills" && step === 3) step = 4;
      else if (!mention) feedback = (course === "skills" ? "/ の一覧からスキルを選んでください。" : "@ の候補からプラグインを選んでください。") + "文字を打つだけでなく、選択する操作を体験しましょう。";
      else if (!stripTrigger(input).trim()) feedback = "機能を選んだら、依頼内容も書きましょう。";
      else step = 7;
    }
    if (action === "again") reset(course);
    render();
    if (["example", "mention"].includes(action)) root.querySelector("#learn-prompt")?.focus();
  }
  return { reset, render };
})();
