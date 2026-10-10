(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  $('copy-prompt').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('ai-prompt').textContent);
      $('copy-status').textContent = '依頼文をコピーしました。';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('ai-prompt'));
      selection.removeAllRanges();
      selection.addRange(range);
      $('ai-prompt').focus();
      $('copy-status').textContent = '依頼文を選択しました。端末のコピー操作でコピーしてください。';
    }
  });

  // 依頼文の記入欄: 書いた内容を依頼文へ差し込む。空欄の項目は「（おまかせ）」のままにする
  document.querySelectorAll('[data-fill-for]').forEach((input) => {
    const slot = document.querySelector(`#ai-prompt [data-fill="${input.dataset.fillFor}"]`);
    const sync = () => {
      const value = input.value.replace(/\s+/g, ' ').trim();
      slot.textContent = value || '（おまかせ）';
      slot.classList.toggle('is-filled', Boolean(value));
      $('copy-status').textContent = '';
    };
    input.addEventListener('input', sync);
    sync();
  });
  $('prompt-form').addEventListener('submit', (event) => event.preventDefault());

  /* =====================================================================
     APIづくりシミュレーター（学習用の再現）
     実際のダウンロード・インストール・ファイル操作・コマンド実行・通信・アカウント操作は行わない。
     しくみ: state（画面の状態）→ 描画関数 → steps（1クリックぶんの操作と、その変化の再生）。
     編集ガイドは SIMULATOR.md を参照。
     ===================================================================== */
  const dialog = $('api-lab');
  const stage = $('lab-stage');
  const wrap = stage.parentElement;
  const guide = $('lab-guide');
  const keyToast = $('lab-keytoast');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ABORT = Symbol('abort');

  // 再現に使う値（確認日: 2026-10-10）
  const NODE_V = 'v24.21.0';
  const NPM_V = '11.19.0';
  const EXPRESS_V = '5.3.0';
  const MSI = `node-${NODE_V}-x64.msi`;
  const HOME = 'C:\\Users\\you\\Desktop\\sample-api';
  const PROMPT = `PS ${HOME}>`;
  const PUBLIC_HOST = 'sample-api-x7k2.onrender.com';
  const PUBLIC_URL = `https://${PUBLIC_HOST}`;
  const RESPONSE = '{"message":"こんにちは、API！"}';
  const WELCOME = 'ようこそ'; // VS Code の「ようこそ」タブ
  const COMMIT = '3f2a1c9';
  const COMMIT_FULL = `${COMMIT}d5b7e4a0c8f61b2d9e3a7c5f04b6d8e12`;
  // Render のページごとの URL とタブ名（アカウント名・ID は架空）
  const RD_TABS = {
    landing: ['https://render.com', 'Render'],
    signin: ['https://dashboard.render.com/login', 'Render Dashboard'],
    authorize: ['https://github.com/login/oauth/authorize', 'Authorize application'],
    dashboard: ['https://dashboard.render.com', 'Render Dashboard'],
    connect: ['https://dashboard.render.com/web/new', 'New Web Service · Render Dashboard'],
    form: ['https://dashboard.render.com/web/new', 'New Web Service · Render Dashboard'],
    deploy: ['https://dashboard.render.com/web/srv-d3k7p1ab9c0s/deploys/dep-d3k7p2bc1d0s', 'sample-api · Web Service · Render Dashboard']
  };

  const dataJson = '{\n  "message": "こんにちは、API！"\n}';
  const serverCode = `const express = require('express');
const data = require('./data.json');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', (req, res) => {
  res.json(data);
});

app.listen(port, '0.0.0.0', () => {
  console.log('API is listening on port ' + port);
});`;
  const pkgJson = (withDeps) => `{
  "name": "sample-api",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "start": "node server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"${withDeps ? `,
  "dependencies": {
    "express": "^${EXPRESS_V}"
  }` : ''}
}`;

  // 章ナビに出す短い名前（9個が1行に収まる長さにしている）
  const chapters = [
    'Node.js',
    'フォルダー',
    'ファイルを作る',
    'npmで準備',
    'npmコマンド',
    'サーバーを起動',
    '動作を確認',
    'GitHubへ保存',
    'Renderで公開'
  ];
  const chapterTitles = [
    'Node.jsをダウンロードして、インストールする',
    'VS Codeに作業フォルダーを紐づける',
    'VS Codeでファイルを作る',
    'ターミナルで npm init と Express のインストール',
    'そのほかの npm コマンドを試す',
    'ターミナルで API サーバーを起動する',
    'API が動くことを確認する',
    'コードを GitHub へ保存する',
    'Render の Web Service で公開する'
  ];

  /* ---------- 状態 ---------- */
  const fresh = () => ({
    app: 'browser', // 'browser' | 'installer' | 'vscode' | 'none'
    running: { browser: true, installer: false, vscode: false },
    br: {
      tabs: [{ title: 'Node.js — ダウンロード', url: 'https://nodejs.org/ja/download', page: 'node' }],
      active: 0,
      typing: null,
      dl: null,
      dlOpen: false
    },
    ins: { page: 'welcome', accepted: false, pct: 0, status: '', uac: false },
    vs: {
      folder: false, picker: null, trust: false, menu: '',
      files: [], tabs: [WELCOME], active: WELCOME, dirty: {}, text: {},
      newFile: null, typing: '', flash: [], mark: '', term: null, git: false
    },
    // build / start は Render が自動入力する初期値、plan は最初に選ばれている有料プラン
    rd: {
      page: 'landing', menu: false, build: 'yarn install', start: 'node server.js', sel: '', typing: '',
      plan: 'starter', status: '', secs: 0, t0: 0, logs: [], live: false
    }
  });

  let st = fresh();
  let index = 0;
  let busy = false;
  let token = 0;
  let lastApp = '';
  let lastPageKey = '';
  let opener;

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const want = (act) => !busy && index < steps.length && steps[index].act === act;

  /* ---------- アイコン（汎用の線画。各製品のロゴは使わない） ---------- */
  const paths = {
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    fwd: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    reload: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.4"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    files: '<path d="M14 3H7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6Z"/><path d="M14 3v3h3M9 21h9a2 2 0 0 0 2-2V9"/>',
    branch: '<circle cx="7" cy="5" r="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="9" r="2"/><path d="M7 7v10M17 11c0 4-10 2-10 6"/>',
    bug: '<path d="M8 5v14l11-7Z"/>',
    blocks: '<rect x="4" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/><rect x="14.5" y="3.5" width="6" height="6" transform="rotate(12 17.5 6.5)"/>',
    user: '<circle cx="12" cy="9" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    newfile: '<path d="M13 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4"/><path d="M13 3l5 5v3M13 3v5h5M17 14v7M13.5 17.5h7"/>',
    newfolder: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v3"/><path d="M3 7v11a1 1 0 0 0 1 1h8M18 14v7M14.5 17.5h7"/>',
    collapse: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    win: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
    code: '<path d="m15 7 5 5-5 5M9 7l-5 5 5 5"/>',
    hex: '<path d="M12 3 20 7.5v9L12 21l-8-4.500v-9Z"/>',
    shield: '<path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6Z"/>',
    repo: '<path d="M6 3h12a1 1 0 0 1 1 1v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z"/><path d="M5 18a2 2 0 0 1 2-2h12M9 7h6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z"/>',
    monitor: '<rect x="3" y="5" width="18" height="12" rx="1.500"/><path d="M9 21h6M12 17v4"/>',
    doc: '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M9 11h6M9 15h6"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="16.500" cy="16" r="2.500"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 17 5-5 4 4 3-3 4 4"/><circle cx="16" cy="9.500" r="1.200"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3Z"/>',
    pin: '<path d="M9 4h6l-1 6 3 3H7l3-3ZM12 13v7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.400-1 .900-1 1.700M12 17v.400"/>',
    bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6Z"/>',
    list: '<path d="M5 7h14M5 12h14M5 17h9"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.500 2M9 3h6"/>',
    db: '<ellipse cx="12" cy="6.500" rx="7" ry="3"/><path d="M5 6.500v11c0 1.700 3.100 3 7 3s7-1.300 7-3v-11M5 12c0 1.700 3.100 3 7 3s7-1.300 7-3"/>',
    layers: '<path d="m12 4 9 4.500-9 4.500-9-4.500ZM3 13l9 4.500 9-4.500M3 16.500 12 21l9-4.500"/>',
    group: '<circle cx="12" cy="6.500" r="3"/><circle cx="6.500" cy="16.500" r="3"/><circle cx="17.500" cy="16.500" r="3"/>',
    pulse: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4ZM10 20h4"/>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16ZM13 7l4 4"/>',
    check: '<path d="m5 12 4.500 4.500L19 7"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    deploy: '<path d="M5 20V9h5v11M10 20V4h5v16M15 20v-8h4v8M3 20h18"/>',
    commit: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>',
    expand: '<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const ic = (name, cls = '') => `<svg class="lab-ic${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
  const caption = '<span class="lab-caption" aria-hidden="true"><i>─</i><i>☐</i><i>✕</i></span>';

  /* ---------- 簡易シンタックス ハイライト ---------- */
  function highlight(line, json) {
    const re = json
      ? /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b/g
      : /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(const|let|var|function|return|new|if|else)\b|\b(require|console|process)\b|(=>)|\b(\d+)\b|([A-Za-z_$][\w$]*)(?=\()/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(line))) {
      out += esc(line.slice(last, m.index));
      if (json) {
        if (m[1]) out += `<span class="${m[2] ? 'tk-key' : 'tk-str'}">${esc(m[1])}</span>${m[2] ? esc(m[2]) : ''}`;
        else out += `<span class="tk-num">${esc(m[0])}</span>`;
      } else {
        const cls = m[1] ? 'tk-com' : m[2] ? 'tk-str' : m[3] ? 'tk-kw' : m[4] ? 'tk-obj' : m[5] ? 'tk-kw' : m[6] ? 'tk-num' : 'tk-fn';
        out += `<span class="${cls}">${esc(m[0])}</span>`;
      }
      last = m.index + m[0].length;
    }
    return out + esc(line.slice(last));
  }

  /* ---------- 共通部品 ---------- */
  const fileIcon = (name, kind) => kind === 'folder'
    ? '<i class="lab-fi lab-fi--dir" aria-hidden="true">›</i>'
    : name === '.gitignore' ? '<i class="lab-fi lab-fi--git" aria-hidden="true">◆</i>'
    : name.endsWith('.js') ? '<i class="lab-fi lab-fi--js" aria-hidden="true">JS</i>'
    : `<i class="lab-fi lab-fi--json${name.startsWith('package') ? ' lab-fi--npm' : ''}" aria-hidden="true">{}</i>`;

  function taskbar(s) {
    const item = (app, label, icon, act) => `<button type="button" class="lab-task lab-task--${app}${s.app === app ? ' is-active' : ''}${s.running[app] ? ' is-running' : ''}"${act ? ` data-act="${act}"` : ' tabindex="-1"'} aria-label="${label}" title="${label}">${icon}</button>`;
    return `<div class="lab-taskbar"><span class="lab-task lab-task--start" aria-hidden="true">${ic('win')}</span>`
      + item('browser', 'ブラウザー', ic('globe'), 'task-browser')
      + item('vscode', 'VS Code', ic('code'), 'task-vscode')
      + (s.running.installer ? item('installer', 'Node.js Setup', ic('hex'), '') : '')
      + '<span class="lab-task-clock" aria-hidden="true">10:24</span></div>';
  }

  /* ---------- ブラウザー ---------- */
  const favicon = (t) => t.page === 'node' ? '<i class="lab-fav lab-fav--node" aria-hidden="true">⬡</i>'
    : t.page === 'render' && !t.plain ? '<i class="lab-fav lab-fav--render" aria-hidden="true"><b class="lab-rd__mark"></b></i>'
    : `<i class="lab-fav" aria-hidden="true">${ic('globe')}</i>`;

  function tabsHtml(s) {
    const b = s.br;
    return b.tabs.map((t, i) => `<span class="lab-br-tab${i === b.active ? ' is-active' : ''}">${favicon(t)}<span>${esc(t.title)}</span><i aria-hidden="true">×</i></span>`).join('')
      + '<button type="button" class="lab-br-plus" data-act="br-newtab" aria-label="新しいタブ">+</button>';
  }

  function urlHtml(s) {
    const b = s.br;
    const tab = b.tabs[b.active];
    if (b.typing !== null) return `${ic('search')}<span class="lab-br-url">${esc(b.typing)}<i class="lab-caret"></i></span>`;
    if (!tab.url) return `${ic('search')}<span class="lab-br-url is-placeholder">検索または Web アドレスを入力</span>`;
    return `${ic(tab.url.startsWith('https://') ? 'lock' : 'info')}<span class="lab-br-url">${esc(tab.url.replace(/^https:\/\//, ''))}</span>`;
  }

  function dlHtml(s) {
    const d = s.br.dl;
    if (!d || !s.br.dlOpen) return '';
    return `<div class="lab-dl"><p class="lab-dl__head">ダウンロード</p><div class="lab-dl__row"><span class="lab-dl__file" aria-hidden="true">${ic('hex')}</span><div class="lab-dl__info"><b>${MSI}</b>${d.done
      ? '<button type="button" class="lab-dl__open" data-act="open-msi">ファイルを開く</button>'
      : `<span class="lab-dl__bar"><i style="width:${d.pct}%"></i></span><small>ダウンロード中… ${d.pct}%</small>`}</div></div></div>`;
  }

  const nodePage = () => `<div class="node-download-sim">
    <div class="node-download-sim__bar"><strong><span aria-hidden="true">⬡</span> node<span>.js</span></strong><span>学ぶ</span><span>はじめに</span><b>ダウンロード</b><span>ブログ</span><span>ドキュメント</span><span>貢献</span></div>
    <div class="node-download-sim__body">
      <h4>Node.js<sup>®</sup>をダウンロードする</h4>
      <p class="node-download-sim__line"><span>Windows</span> 用のNode.js® <span>${NODE_V} (LTS)</span> を <span>Docker</span> と <span>npm</span> を使ってダウンロードする</p>
      <div class="node-download-sim__code" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="node-download-sim__line"><span>x64</span> アーキテクチャーで動作する <span>Windows</span> 用のビルド済みのNode.js®も利用できます。</p>
      <div class="node-download-sim__buttons"><button type="button" class="node-download-sim__download" data-act="node-download">${ic('download')}Windows インストーラー (.msi)</button><span class="node-download-sim__ghost">${ic('download')}スタンドアローンのバイナリー (.zip)</span></div>
      <a class="node-download-sim__official-link" href="https://nodejs.org/ja/download" target="_blank" rel="noopener noreferrer">実際にインストールするときの公式ダウンロードページ ↗<span>https://nodejs.org/ja/download</span></a>
    </div></div>`;

  const plainPage = (text) => `<div class="lab-plain"><label class="lab-plain__pretty"><input type="checkbox" disabled /> プリティ プリント</label><pre>${esc(text)}</pre></div>`;

  /* ---------- Render（公開先）。アカウント名・リポジトリ名・ID は架空 ---------- */
  const rdMark = '<b class="lab-rd__mark" aria-hidden="true"></b>';
  const clock = (ms) => new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  function rdTop(s, crumbs) {
    const r = s.rd;
    const items = [
      ['layers', 'Static Site'], ['globe', 'Web Service'], ['lock', 'Private Service'], ['gear', 'Workflow'], ['list', 'Background Worker'], ['clock', 'Cron Job'], null,
      ['db', 'Postgres'], ['layers', 'Key Value'], null,
      ['group', 'Project'], ['list', 'Blueprint']
    ];
    const menu = r.menu ? `<div class="lab-rd__menu" role="menu">${items.map((m) => !m ? '<hr />' : m[1] === 'Web Service'
      ? `<button type="button" role="menuitem" data-act="rd-webservice">${ic(m[0])}${m[1]}</button>`
      : `<span role="menuitem">${ic(m[0])}${m[1]}</span>`).join('')}</div>` : '';
    const add = r.page === 'dashboard'
      ? `<button type="button" class="lab-rd__tool lab-rd__new${r.menu ? ' is-open' : ''}" data-act="rd-new">${ic('plus')}New</button>`
      : `<span class="lab-rd__tool lab-rd__new">${ic('plus')}New</span>`;
    return `<div class="lab-rd__top">${rdMark}<span class="lab-rd__ws"><i>Y</i><span>My Workspace</span><em aria-hidden="true">⌃⌄</em></span>
      <span class="lab-rd__crumbs">${crumbs}</span><span class="lab-rd__sp"></span>
      <span class="lab-rd__tool lab-rd__tool--wide">${ic('search')}Search <kbd>⌃K</kbd></span>${add}
      <span class="lab-rd__tool lab-rd__tool--wide">${ic('bolt')}Upgrade</span><span class="lab-rd__tool lab-rd__tool--wide">?</span><span class="lab-rd__tool"><i class="lab-rd__me">Y</i></span>${menu}</div>`;
  }

  const rdSide = (items) => `<nav class="lab-rd__side" aria-hidden="true">${items.map((it) => typeof it === 'string'
    ? `<small>${it}</small>`
    : `<span class="${it[2] ? 'is-on' : ''}">${ic(it[0])}${it[1]}</span>`).join('')}</nav>`;

  function renderPage(s) {
    const r = s.rd;
    if (r.page === 'landing') {
      return `<div class="lab-rd lab-rd--site">
        <div class="lab-rd__sitenav"><b class="lab-rd__brand">${rdMark}Render</b><span>Product</span><span>Developers</span><span>Resources</span><span>Pricing</span><span>Company</span><span class="lab-rd__sp"></span><span>Migrate to Render</span><button type="button" data-act="rd-signin">Sign in</button><span class="lab-rd__cta">Get started</span></div>
        <div class="lab-rd__hero"><div><h4>Your fastest path to production</h4><p>Intuitive infrastructure to scale any app or agent from your first user to your billionth.</p>
          <div class="lab-rd__herobtns"><span class="lab-rd__black">Start for free ›</span><span class="lab-rd__ghostbtn">Talk to sales</span></div></div>
          <div class="lab-rd__heroart" aria-hidden="true"><code>$ git push</code><div><small>PRODUCTION</small><span><i></i><i></i></span><span><i></i><i></i></span></div></div></div></div>`;
    }
    if (r.page === 'signin') {
      return `<div class="lab-rd lab-rd--auth"><b class="lab-rd__brand">${rdMark}Render</b><div class="lab-rd__signin"><h4>Sign In to Render</h4>
        <div class="lab-rd__sso"><button type="button" data-act="rd-github">${ic('branch')}GitHub</button><span>GitLab</span><span>Bitbucket</span><span>Google</span></div>
        <p class="lab-rd__or">or</p>
        <p class="lab-rd__flabel">Email</p><div class="lab-rd__input is-ph">your@email.com</div>
        <p class="lab-rd__flabel">Password</p><div class="lab-rd__input is-ph">correct horse battery staple</div>
        <span class="lab-rd__black">Sign in</span>
        <p class="lab-rd__links"><u>Sign in with SSO</u><br />Need an account? <u>Sign up</u><br />Forgot your password? <u>Reset it</u></p></div></div>`;
    }
    if (r.page === 'authorize') {
      return `<div class="lab-gh"><div class="lab-gh__card"><div class="lab-gh__pair" aria-hidden="true"><i>${ic('branch')}</i><em>⋯</em><i class="is-rd">${rdMark}</i></div>
        <h4>Authorize Render</h4><p class="lab-gh__who"><b>Render</b> by Render would like permission to:</p>
        <ul><li>Verify your GitHub identity (you)</li><li>Know which resources you can access</li><li>Act on your behalf</li></ul>
        <div class="lab-gh__btns"><span>Cancel</span><button type="button" data-act="rd-authorize">Authorize Render</button></div>
        <p class="lab-gh__note">学習用に簡略化した画面です。実際は、どのリポジトリを見せるかを選ぶ画面が続くことがあります。</p></div></div>`;
    }
    if (r.page === 'dashboard') {
      const side = rdSide([['group', 'Projects', true], ['list', 'Blueprints'], ['layers', 'Environment Groups'], 'INTEGRATIONS', ['pulse', 'Observability'], ['commit', 'Webhooks'], ['bell', 'Notifications']]);
      return `<div class="lab-rd">${rdTop(s, `${ic('group')}Projects`)}<div class="lab-rd__cols">${side}<div class="lab-rd__body">
        <h4 class="lab-rd__h">Overview</h4><h5>Projects</h5>
        <div class="lab-rd__promo"><div><b>${ic('group')}Get organized with Projects</b><p>An easier way to organize your resources and collaborate with team members.</p>
          <div class="lab-rd__herobtns"><span class="lab-rd__black">${ic('plus')}Create your first project</span><u>Learn more</u></div></div><div class="lab-rd__promoart" aria-hidden="true"><i></i><i></i><i></i></div></div>
        <h5>Ungrouped Services</h5>
        <div class="lab-rd__tabs"><span class="is-active">Active (0)</span><span>Suspended (0)</span><span>All (0)</span></div>
        <div class="lab-rd__input is-ph">${ic('search')}Search services</div>
        <div class="lab-rd__thead"><span>SERVICE NAME</span><span>STATUS</span><span>RUNTIME</span><span>REGION</span><span>UPDATED</span></div>
      </div></div></div>`;
    }
    const formCrumbs = `${ic('group')}<i>›</i>${ic('globe')}New Web Service`;
    if (r.page === 'connect') {
      const repo = (name, ago, act, locked) => {
        const inner = `${ic('branch')}<span>you /${locked ? ` ${ic('lock')}` : ''} <b>${name}</b></span><small>${ago}</small>`;
        return act ? `<button type="button" class="lab-rd__repo" data-act="${act}">${inner}</button>` : `<span class="lab-rd__repo">${inner}</span>`;
      };
      return `<div class="lab-rd">${rdTop(s, formCrumbs)}<div class="lab-rd__body lab-rd__body--form">
        <h4 class="lab-rd__h">New Web Service</h4>
        <div class="lab-rd__row"><div class="lab-rd__lab"><b>Source Code</b></div><div class="lab-rd__ctl">
          <div class="lab-rd__tabs"><span class="is-active">Git Provider</span><span>Public Git Repository</span><span>Existing Image</span></div>
          <div class="lab-rd__srch"><div class="lab-rd__input is-ph">${ic('search')}Search</div><span class="lab-rd__input lab-rd__cred">Credentials (1) ⌄</span></div>
          <div class="lab-rd__repos">${repo('sample-api', '2m ago', 'rd-repo', true)}${repo('my-website', '12d ago', '', false)}${repo('notes', '1mo ago', '', true)}</div></div></div></div></div>`;
    }
    if (r.page === 'form') {
      const free = r.plan === 'free';
      const price = free ? '<b>$0</b> / month<b>0.1</b> CPU<b>512</b> MB RAM' : '<b>$7</b> / month<b>0.5</b> CPU<b>512</b> MB RAM';
      const row = (label, opt, help, ctl) => `<div class="lab-rd__row"><div class="lab-rd__lab"><b>${label}</b>${opt ? '<em>Optional</em>' : ''}${help ? `<div class="lab-rd__help">${help}</div>` : ''}</div><div class="lab-rd__ctl">${ctl}</div></div>`;
      const cmd = (key, label, act, help) => row(label, false, help, `<button type="button" class="lab-rd__input lab-rd__input--cmd${r.typing === key || r.sel === key ? ' is-focus' : ''}" data-act="${act}"><i>$</i><span class="${r.sel === key ? 'is-selected' : ''}">${esc(r[key])}</span>${r.typing === key ? '<i class="lab-caret"></i>' : ''}</button>`);
      const plan = (id, cost, cpu, ram, note, act) => {
        const on = r.plan === id;
        const inner = `<i class="lab-rd__radio${on ? ' is-on' : ''}"></i><span>${cost}</span><span>${cpu}</span><span>${ram}</span><small>${note}</small>`;
        return act ? `<button type="button" class="lab-rd__plan${on ? ' is-selected' : ''}" data-act="${act}">${inner}</button>` : `<span class="lab-rd__plan${on ? ' is-selected' : ''}">${inner}</span>`;
      };
      return `<div class="lab-rd">${rdTop(s, formCrumbs)}<div class="lab-rd__body lab-rd__body--form">
        <h4 class="lab-rd__h">New Web Service</h4><p class="lab-rd__lead">It looks like you're using <b>Node</b>, so we've autofilled some fields accordingly.</p>
        ${row('Source Code', false, '', `<div class="lab-rd__src">${ic('branch')}<span>you / sample-api</span><small>2m ago</small><em>${ic('pencil')}Edit</em></div>`)}
        ${row('Name', false, 'A unique name for your web service.', '<div class="lab-rd__input">sample-api</div>')}
        ${row('Project', true, 'Add this web service to a project once it\'s created.', `<div class="lab-rd__proj">${ic('group')}<b>Create a new project to add this to?</b><p>You don't have any projects in this workspace. Projects allow you to group resources into environments so you can better manage related resources.</p><span class="lab-rd__ghostbtn">${ic('plus')}Create a project</span></div>`)}
        ${row('Language', false, 'Choose the runtime environment for this service.', '<div class="lab-rd__input lab-rd__input--sel">Node<em>⌄</em></div>')}
        ${row('Branch', false, 'The Git branch to build and deploy.', `<div class="lab-rd__input lab-rd__input--sel">${ic('branch')}main<em>✕</em></div>`)}
        ${row('Region', false, 'Your services in the same region can communicate over a private network.', '<div class="lab-rd__plan is-selected lab-rd__region"><i class="lab-rd__radio is-on"></i><span>Singapore <small>(Southeast Asia)</small></span></div><p class="lab-rd__more">Deploy in a new region ＋</p>')}
        ${row('Root Directory', true, 'If set, Render runs commands from this directory instead of the repository root. Additionally, code changes outside of this directory do not trigger an auto-deploy. Most commonly used with a monorepo.', `<div class="lab-rd__input is-ph">${ic('search')}e.g. src</div>`)}
        ${cmd('build', 'Build Command', 'rd-build', 'Render runs this command to build your app before each deploy.')}
        ${cmd('start', 'Start Command', 'rd-start', 'Render runs this command to start your app with each deploy.')}
        ${row('Compute', false, 'For more power and to get the most out of Render, we recommend using one of our paid compute plans.<br />All paid compute plans support:<ul><li>Zero Downtime</li><li>SSH Access</li><li>Scaling</li><li>One-off jobs</li><li>Support for persistent disks</li></ul>', `<div class="lab-rd__compute"><p class="lab-rd__selected">Selected:<span class="lab-rd__price">${price}</span></p>
          ${free ? `<p class="lab-rd__freenote">${ic('info')}<span>Free instances spin down after periods of inactivity. They do not support SSH access, scaling, one-off jobs, or persistent disks.</span></p>` : ''}
          ${plan('free', '$0 / month', '0.1 CPU', '512 MB RAM', 'Free', 'rd-free')}${plan('starter', '$7 / month', '0.5 CPU', '512 MB RAM', '0.5c-512mb')}${plan('standard', '$25 / month', '1 CPU', '2 GB RAM', '1c-2g')}${plan('pro', '$85 / month', '2 CPU', '4 GB RAM', '2c-4g')}
          <span class="lab-rd__ghostbtn">Show all 15 compute plans</span></div>`)}
        <div class="lab-rd__env"><b>Environment Variables</b><p>Set environment-specific config and secrets (such as API keys), then read those values from your code.</p></div>
        <div class="lab-rd__env lab-rd__adv">› Advanced</div>
      </div><div class="lab-rd__deploybar"><button type="button" class="lab-rd__black" data-act="rd-deploy">Deploy web service</button><span class="lab-rd__ghostbtn">Cancel</span><span class="lab-rd__price">${price}</span></div></div>`;
    }
    const at = new Date(r.t0 || Date.now());
    const zone = -at.getTimezoneOffset() / 60;
    const when = `${at.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${at.toLocaleTimeString('en-US')} GMT${zone < 0 ? '' : '+'}${zone}`;
    const state = r.live ? 'Deploy succeeded <em>| Live</em>' : r.status === 'progress' ? 'In progress…' : 'Building…';
    const tile = (icon, label, value) => `<div class="lab-rd__tile"><i>${icon}</i><div><small>${label}</small><span>${value}</span></div></div>`;
    const logs = r.logs.map((l) => `<div class="${l.cls || ''}"><time>${l.t}</time>${l.tag ? `<em>${l.tag}</em>` : ''}<span>${l.html || '&nbsp;'}</span></div>`).join('');
    const side = rdSide([['back', 'Dashboard'], ['globe', 'sample-api'], ['deploy', 'Deploys', true], ['gear', 'Settings'], 'MONITOR', ['list', 'Events'], ['search', 'Logs'], ['pulse', 'Metrics']]);
    return `<div class="lab-rd">${rdTop(s, `${ic('group')}<i>›</i>${ic('globe')}sample-api<i>›</i>${ic('deploy')}Deploys<i>›</i><span>dep-d3k7p2bc1d0s</span>`)}<div class="lab-rd__cols">${side}<div class="lab-rd__body lab-rd__body--deploy">
      <p class="lab-rd__freenote">${ic('info')}<span>Your free instance will spin down with inactivity, which can delay requests by 50 seconds or more.</span><u>Upgrade now</u></p>
      <div class="lab-rd__dephead"><h4 class="lab-rd__h">初回作成</h4>${r.live ? '' : '<span class="lab-rd__cancel">Cancel ✕</span>'}</div>
      <div class="lab-rd__tiles">${tile(r.live ? ic('check') : '<b class="lab-rd__spin"></b>', 'STATUS', state)}${tile(ic('clock'), 'DURATION', `${r.secs.toFixed(1)}s`)}${tile(ic('calendar'), 'DEPLOYED', when)}${tile(ic('deploy'), 'TRIGGER', 'First Deploy')}${tile(ic('commit'), 'SOURCE', `<u>${COMMIT}</u>`)}</div>
      <div class="lab-rd__logbox"><div class="lab-rd__logbar"><span>All logs ⌄</span><span class="lab-rd__input is-ph">${ic('search')}Search logs</span><span>${ic('bolt')}Live tail ⌄</span><span class="lab-rd__logx">${ic('expand')}</span><span class="lab-rd__logx">⋯</span></div>
        <p class="lab-rd__logdate">${at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p><div class="lab-rd__logs" id="lab-rd-logs">${logs}</div></div>
    </div></div></div>`;
  }

  function pageHtml(s) {
    const tab = s.br.tabs[s.br.active];
    if (tab.page === 'node') return nodePage();
    if (tab.page === 'blank') return `<div class="lab-newtab"><div class="lab-newtab__box">${ic('search')}検索または Web アドレスを入力</div></div>`;
    if (tab.page === 'loading') return '<div class="lab-loading"><i></i><span>読み込み中…</span></div>';
    if (tab.page === 'json') return plainPage(RESPONSE);
    if (tab.page === 'cannot') return plainPage('Cannot GET /');
    if (tab.page === 'refused') {
      return `<div class="lab-neterr"><div class="lab-neterr__icon" aria-hidden="true">${ic('files')}</div><h4>このサイトにアクセスできません</h4><p><b>localhost</b> で接続が拒否されました。</p><p class="lab-neterr__try">次をお試しください</p><ul><li>接続を確認する</li><li>プロキシとファイアウォールを確認する</li></ul><code>ERR_CONNECTION_REFUSED</code><span class="lab-neterr__btn">再読み込み</span></div>`;
    }
    return renderPage(s);
  }

  function browserWin(s) {
    return `<div class="lab-window lab-browser">
      <div class="lab-br-tabs"><div id="lab-br-tabs" class="lab-br-tablist">${tabsHtml(s)}</div>${caption}</div>
      <div class="lab-br-bar"><span class="lab-br-nav" aria-hidden="true">${ic('back')}${ic('fwd')}</span><button type="button" class="lab-br-reload" data-act="br-reload" aria-label="再読み込み">${ic('reload')}</button>
        <button type="button" class="lab-br-address" data-act="br-address" aria-label="アドレス バー" id="lab-br-url">${urlHtml(s)}</button>
        <span class="lab-br-tool${s.br.dl ? ' has-download' : ''}" aria-hidden="true">${ic('download')}</span></div>
      <div id="lab-br-dl" class="lab-br-dl">${dlHtml(s)}</div>
      <div id="lab-br-content" class="lab-br-content">${pageHtml(s)}</div>
    </div>`;
  }

  /* ---------- Node.js セットアップ ウィザード ---------- */
  // ロゴは実物の絵柄ではなく、文字と六角形で組んだ目印
  const nodeLogo = (big) => `<span class="lab-nodelogo${big ? ' lab-nodelogo--big' : ''}" aria-hidden="true"><b>n<i></i>de</b><em>JS</em></span>`;

  function insBody(s) {
    const i = s.ins;
    const head = (title, sub) => `<div class="lab-ins-head"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${nodeLogo()}</div>`;
    const big = (title, lines) => `<div class="lab-ins-big"><div class="lab-ins-side">${nodeLogo(true)}</div><div class="lab-ins-main"><h4>${title}</h4>${lines.map((line) => `<p>${line}</p>`).join('')}</div></div>`;
    const btn = (label, act = '', enabled = true) => `<button type="button" class="lab-ins-btn${act && enabled ? ' is-primary' : ''}"${act && enabled ? ` data-act="${act}"` : ' tabindex="-1"'}${enabled ? '' : ' disabled'}>${label}</button>`;
    const foot = (...buttons) => `<div class="lab-ins-foot${buttons.length > 4 ? ' lab-ins-foot--wide' : ''}">${buttons.join('')}</div>`;
    if (i.page === 'welcome') {
      return big('Welcome to the Node.js Setup Wizard', ['The Setup Wizard will install Node.js on your computer.']) + foot(btn('Back', '', false), btn('Next', 'ins-next'), btn('Cancel'));
    }
    if (i.page === 'license') {
      return `${head('End-User License Agreement', 'Please read the following license agreement carefully')}<div class="lab-ins-content"><div class="lab-ins-license"><b>Node.js is licensed for use as follows:</b><p>Copyright Node.js contributors. All rights reserved.</p><p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,</p></div>
        <button type="button" class="lab-ins-check${i.accepted ? ' is-on' : ''}" data-act="ins-accept" role="checkbox" aria-checked="${i.accepted}"><i aria-hidden="true">${i.accepted ? '✓' : ''}</i>I accept the terms in the License Agreement</button></div>${foot(btn('Print'), btn('Back'), btn('Next', 'ins-next', i.accepted), btn('Cancel'))}`;
    }
    if (i.page === 'dest') {
      return `${head('Destination Folder', 'Choose a custom location or click Next to install.')}<div class="lab-ins-content"><p>Install Node.js to:</p><div class="lab-ins-path">C:\\Program Files\\nodejs\\</div><span class="lab-ins-btn lab-ins-btn--small">Change...</span></div>${foot(btn('Back'), btn('Next', 'ins-next'), btn('Cancel'))}`;
    }
    if (i.page === 'custom') {
      const feats = ['Node.js runtime', 'corepack manager', 'npm package manager', 'Online documentation shortcuts', 'Add to PATH'];
      return `${head('Custom Setup', 'Select the way you want features to be installed.')}<div class="lab-ins-content"><p>Click the icons in the tree below to change the way features will be installed.</p>
        <div class="lab-ins-custom"><ul class="lab-ins-tree">${feats.map((f, n) => `<li class="${n === 0 ? 'is-selected' : ''}${n === feats.length - 1 ? ' has-more' : ''}"><i aria-hidden="true"></i><span>${f}</span></li>`).join('')}</ul>
          <div class="lab-ins-desc"><p>Install the core Node.js runtime (node.exe).</p><p>This feature requires 6454KB on your hard drive.</p></div></div>
        <div class="lab-ins-browse"><button type="button" class="lab-ins-btn" tabindex="-1" disabled>Browse...</button></div></div>${foot(btn('Reset'), btn('Disk Usage'), btn('Back'), btn('Next', 'ins-next'), btn('Cancel'))}`;
    }
    if (i.page === 'tools') {
      return `${head('Tools for Native Modules', 'Optionally install the tools necessary to compile native modules.')}<div class="lab-ins-content"><p>Some npm modules need to be compiled from C/C++ when installing. If you want to be able to install such modules, some tools (Python and Visual Studio Build Tools) need to be installed.</p>
        <span class="lab-ins-check is-static"><i aria-hidden="true"></i><span>Automatically install the necessary tools. Note that this will also install Chocolatey. The script will pop-up in a new window after the installation completes.</span></span>
        <p>Alternatively, follow the instructions at <u>https://github.com/nodejs/node-gyp#on-windows</u> to install the dependencies yourself.</p></div>${foot(btn('Back'), btn('Next', 'ins-next'), btn('Cancel'))}`;
    }
    if (i.page === 'ready') {
      return `${head('Ready to install Node.js', '')}<div class="lab-ins-content"><p>Click Install to begin the installation. Click Back to review or change any of your installation settings. Click Cancel to exit the wizard.</p></div>${foot(btn('Back'), btn(`${ic('shield')}Install`, 'ins-install'), btn('Cancel'))}`;
    }
    if (i.page === 'progress') {
      return `${head('Installing Node.js', '')}<div class="lab-ins-content"><p>Please wait while the Setup Wizard installs Node.js.</p><p class="lab-ins-statusline">Status: <span>${esc(i.status)}</span></p><div class="lab-ins-bar"><i style="width:${i.pct}%"></i></div></div>${foot(btn('Back', '', false), btn('Next', '', false), btn('Cancel'))}`;
    }
    return big('Completed the Node.js Setup Wizard', ['Click the Finish button to exit the Setup Wizard.', 'Node.js has been successfully installed.']) + foot(btn('Back', '', false), btn('Finish', 'ins-finish'), btn('Cancel', '', false));
  }

  function installerWin(s) {
    const uac = s.ins.uac ? `<div class="lab-modal lab-modal--uac"><div class="lab-uac" role="alertdialog" aria-label="ユーザー アカウント制御"><p class="lab-uac__bar">ユーザー アカウント制御</p><h4>このアプリがデバイスに変更を加えることを許可しますか?</h4>
      <div class="lab-uac__app"><span aria-hidden="true">⬡</span><div><b>Node.js</b><small>確認済みの発行元: OpenJS Foundation</small><small>ファイルの入手先: このコンピューター上のハード ドライブ</small></div></div>
      <div class="lab-uac__btns"><button type="button" data-act="uac-yes">はい</button><span>いいえ</span></div></div></div>` : '';
    return `<div class="lab-window lab-installer"><div class="lab-ins-title"><span class="lab-ins-appicon" aria-hidden="true"></span><b>Node.js Setup</b><span class="lab-caption" aria-hidden="true"><i>─</i><i class="is-off">☐</i><i>✕</i></span></div><div id="lab-ins-body" class="lab-ins-body">${insBody(s)}</div></div>${uac}`;
  }

  /* ---------- VS Code ---------- */
  function menuHtml(s) {
    const items = ['ファイル(F)', '編集(E)', '選択(S)', '表示(V)', '移動(G)', '実行(R)', 'ターミナル(T)', 'ヘルプ(H)'];
    const drop = s.vs.menu === 'terminal' ? `<div class="vscode-sim__drop" role="menu"><button type="button" role="menuitem" data-act="vs-new-terminal"><span>新しいターミナル(N)</span><kbd>Ctrl+Shift+\`</kbd></button><span role="menuitem"><span>ターミナルの分割(S)</span><kbd>Ctrl+Shift+5</kbd></span><span role="menuitem"><span>新しいターミナル ウィンドウ(W)</span><kbd>Ctrl+Shift+Alt+\`</kbd></span><hr /><span role="menuitem"><span>タスクの実行(R)...</span></span></div>` : '';
    return items.map((label) => label.startsWith('ターミナル')
      ? `<span class="vscode-sim__menuwrap"><button type="button" class="vscode-sim__menuitem${s.vs.menu === 'terminal' ? ' is-open' : ''}" data-act="vs-menu-terminal">${label}</button>${drop}</span>`
      : `<span class="vscode-sim__menuitem${label.startsWith('ファイル') ? ' is-keep' : ''}">${label}</span>`).join('');
  }

  function sideHtml(s) {
    const v = s.vs;
    const title = '<p class="vscode-sim__side-title">エクスプローラー<span aria-hidden="true">…</span></p>';
    if (!v.folder) {
      return `${title}<p class="vscode-sim__sect">⌄ 開いているエディター</p><p class="vscode-sim__openitem"><span aria-hidden="true">×</span>${ic('code')}ようこそ</p>
        <p class="vscode-sim__sect">⌄ 開いているフォルダーがありません</p>
        <div class="vscode-sim__nofolder"><p>まだフォルダーを開いていません。</p><button type="button" class="vscode-sim__bluebtn" data-act="vs-open-folder">フォルダーを開く</button>
          <p>フォルダーを開くと、現在開いているすべてのエディターが閉じられます。開いたままにするには、代わりに<u>フォルダーを追加します</u> してください。</p>
          <p>リポジトリはローカルで複製できます。</p><span class="vscode-sim__bluebtn">リポジトリの複製</span>
          <p>VS Codeで Git とソース管理を使用する方法の詳細については、<u>ドキュメントを参照</u>。</p></div>
        <span class="lab-sp"></span><p class="vscode-sim__collapsed">› アウトライン</p><p class="vscode-sim__collapsed">› タイムライン</p>`;
    }
    const rows = v.files.map((f) => `<li class="${f.name === v.active ? 'is-selected' : ''}${v.flash.includes(f.name) ? ' is-new' : ''}"><button type="button" data-act="tree-${esc(f.name)}">${fileIcon(f.name, f.kind)}<span>${esc(f.name)}</span></button></li>`).join('');
    const input = v.newFile !== null ? `<li class="is-input"><span>${fileIcon(v.newFile || 'x.json', 'file')}<span class="vscode-sim__nameinput">${esc(v.newFile)}<i class="lab-caret"></i></span></span></li>` : '';
    return `${title}<div class="vscode-sim__tree-head"><b>⌄ SAMPLE-API</b><span class="vscode-sim__tree-actions"><button type="button" data-act="vs-new-file" aria-label="新しいファイル..." title="新しいファイル...">${ic('newfile')}</button><span title="新しいフォルダー...">${ic('newfolder')}</span><span title="最新の情報に更新">${ic('reload')}</span><span title="エクスプローラーのフォルダーを折りたたむ">${ic('collapse')}</span></span></div>
      <ul id="lab-file-tree">${input}${rows}${!rows && !input ? '<li class="is-empty">（まだファイルはありません）</li>' : ''}</ul>
      <p class="vscode-sim__collapsed">› アウトライン</p><p class="vscode-sim__collapsed">› タイムライン</p>`;
  }

  // 「ようこそ」タブの中身。最近開いた項目は、個人の履歴を出さないために空の表示にしている
  const welcomeHtml = () => {
    const start = [['newfile', '新しいファイル...'], ['doc', 'ファイルを開く...'], ['newfolder', 'フォルダーを開く...'], ['branch', 'Git リポジトリのクローン...'], ['code', '次に接続します...'], ['bolt', '新しいワークスペースの生成...']];
    return `<div class="vscode-sim__welcome"><div class="vscode-sim__welcome-inner"><h4>Visual Studio Code</h4><p class="vscode-sim__welcome-sub">進化した編集</p>
      <div class="vscode-sim__welcome-cols"><div><h5>開始</h5><ul>${start.map(([icon, label]) => `<li>${ic(icon)}${label}</li>`).join('')}</ul><h5>最近</h5><p class="vscode-sim__welcome-none">最近使用したフォルダーはありません。</p></div>
        <div><h5>チュートリアル</h5><div class="vscode-sim__walk"><b>VS Code の使用を開始する</b><small>エディターをカスタマイズし、基礎を学び、コーディングを開始する</small><i></i></div><div class="vscode-sim__walk"><b>基礎の学習</b><i></i></div></div></div></div></div>`;
  };

  function editorHtml(s) {
    const v = s.vs;
    if (!v.tabs.length) return '';
    const tabs = v.tabs.map((name) => `<span class="${name === v.active ? 'is-active' : ''}">${name === WELCOME ? ic('code', 'lab-fi--vs') : fileIcon(name, 'file')}<span>${esc(name)}</span><i class="${v.dirty[name] ? 'is-dirty' : ''}" aria-hidden="true">${v.dirty[name] ? '●' : '×'}</i></span>`).join('');
    if (v.active === WELCOME) return `<div class="vscode-sim__tabs">${tabs}</div>${welcomeHtml()}`;
    const text = v.text[v.active] || '';
    const json = !v.active.endsWith('.js') && v.active !== '.gitignore';
    const lines = text.split('\n');
    const code = lines.map((line, n) => `<span class="ln${v.mark && line.includes(v.mark) ? ' is-mark' : ''}">${v.active === '.gitignore' ? esc(line) : highlight(line, json)}${v.typing === v.active && n === lines.length - 1 ? '<i class="lab-caret"></i>' : ''}</span>`).join('');
    const key = want('key-save') ? '<button type="button" class="lab-key" data-act="key-save"><kbd>Ctrl</kbd>+<kbd>S</kbd><small>キー操作の再現</small></button>' : '';
    return `<div class="vscode-sim__tabs">${tabs}</div><div class="vscode-sim__breadcrumb">sample-api › <span id="lab-breadcrumb">${esc(v.active)}</span></div>
      <button type="button" class="vscode-sim__code" data-act="vs-editor" aria-label="${esc(v.active)} の編集画面"><pre id="lab-code">${code}</pre></button>${key}`;
  }

  function panelHtml(s) {
    const t = s.vs.term;
    if (!t) return '';
    const lines = t.lines.map((l) => l.k === 'cmd'
      ? `<div><span class="tp">${esc(PROMPT)}</span> <span class="tc">${esc(l.text)}</span></div>`
      : `<div class="to${l.cls ? ` ${l.cls}` : ''}">${esc(l.text) || '&nbsp;'}</div>`).join('');
    const prompt = t.running
      ? `<div class="to"><i class="lab-caret lab-caret--block"></i></div>${want('key-ctrlc') ? '<button type="button" class="lab-key lab-key--term" data-act="key-ctrlc"><kbd>Ctrl</kbd>+<kbd>C</kbd><small>キー操作の再現</small></button>' : ''}`
      : `<button type="button" class="vscode-sim__prompt" data-act="term"><span class="tp">${esc(PROMPT)}</span> <span class="tc">${esc(t.input)}</span><i class="lab-caret lab-caret--block"></i></button>`;
    return `<div class="vscode-sim__panel-title"><span>問題</span><span>出力</span><span>デバッグ コンソール</span><span class="is-active">ターミナル</span><span>ポート</span><em>pwsh</em></div>
      <div class="vscode-sim__term" id="lab-terminal">${lines}${prompt}</div>`;
  }

  function overlayHtml(s) {
    const v = s.vs;
    if (v.picker) {
      // Windows の「フォルダーを開く」ダイアログ。最初は自分のユーザー フォルダー（you）が開く
      const p = v.picker;
      const home = p.place === 'home';
      const here = home ? 'you' : 'デスクトップ';
      const names = home ? ['.vscode', 'デスクトップ', 'ドキュメント', 'ダウンロード', 'ピクチャ', 'ミュージック', 'ビデオ'] : ['portfolio', '写真', 'レポート'];
      const tile = (name) => `<span class="lab-picker__tile"><i class="lab-folder" aria-hidden="true"></i><span>${name}</span></span>`;
      const fresh = p.name !== null ? `<span class="lab-picker__tile is-selected${p.done ? '' : ' is-editing'}"><i class="lab-folder" aria-hidden="true"></i><span>${esc(p.name)}${p.done ? '' : '<i class="lab-caret"></i>'}</span></span>` : '';
      const places = [['home', 'ホーム'], ['monitor', 'デスクトップ'], ['download', 'ダウンロード'], ['doc', 'ドキュメント'], ['music', 'ミュージック'], ['image', 'ピクチャ'], ['video', 'ビデオ']];
      const nav = places.map(([icon, label], n) => {
        const inner = `${ic(icon, `lab-picker__ni lab-picker__ni--${icon}`)}<span>${label}</span>${n ? ic('pin', 'lab-picker__pin') : ''}`;
        const on = home ? n === 0 : n === 1;
        return `${n === 1 ? '<hr />' : ''}${n === 1 && home
          ? `<button type="button" data-act="pk-desktop">${inner}</button>`
          : `<span class="${on ? 'is-on' : ''}">${inner}</span>`}`;
      }).join('');
      return `<div class="lab-modal"><div class="lab-picker" role="dialog" aria-label="フォルダーを開く">
        <div class="lab-picker__title">${ic('code', 'lab-picker__app')}<span>フォルダーを開く</span><i aria-hidden="true">✕</i></div>
        <div class="lab-picker__bar"><span class="lab-picker__nav" aria-hidden="true">${ic('back')}${ic('fwd')}${ic('chevron')}${ic('up')}</span>
          <span class="lab-picker__addr"><i class="lab-folder lab-folder--mini" aria-hidden="true"></i><em aria-hidden="true">›</em><span>${here}</span>${ic('chevron')}${ic('reload')}</span>
          <span class="lab-picker__search"><span>${here}の検索</span>${ic('search')}</span></div>
        <div class="lab-picker__tools"><span>整理 ▾</span>${!home && p.name === null ? '<button type="button" data-act="pk-new">新しいフォルダー</button>' : '<span>新しいフォルダー</span>'}<span class="lab-sp"></span><span class="lab-picker__view" aria-hidden="true">${ic('list')}▾</span><span class="lab-picker__help" aria-hidden="true">?</span></div>
        <div class="lab-picker__body"><nav aria-label="場所">${nav}</nav>
          <div class="lab-picker__grid">${names.map(tile).join('')}${fresh}</div></div>
        <div class="lab-picker__foot"><label>フォルダー:<span class="lab-picker__field">${p.done ? 'sample-api' : ''}</span></label>
          <div class="lab-picker__btns"><button type="button" class="lab-picker__ok"${p.done ? ' data-act="pk-select"' : ' disabled'}>フォルダーの選択(&amp;S)</button><span class="lab-picker__cancel">キャンセル</span></div></div>
      </div></div>`;
    }
    if (v.trust) {
      return `<div class="lab-modal"><div class="lab-trust" role="dialog" aria-label="フォルダーの信頼の確認">${ic('shield')}<h4>このフォルダー内のファイルの作成者を信頼しますか?</h4><p class="lab-trust__path">${esc(HOME)}</p>
        <p>これらのファイルの作成者を信頼していない場合は、悪意のあるファイルである可能性があるため、制限モードで続行することをお勧めします。</p>
        <div class="lab-trust__btns"><button type="button" data-act="vs-trust">はい、作成者を信頼します<small>フォルダーを信頼してすべての機能を有効にする</small></button><span>いいえ、作成者を信頼しません</span></div></div></div>`;
    }
    return '';
  }

  function statusHtml(s) {
    const v = s.vs;
    const lang = !v.active || v.active === WELCOME ? '' : v.active.endsWith('.js') ? 'JavaScript' : v.active === '.gitignore' ? 'Ignore' : 'JSON';
    return `<span>${v.git ? `${ic('branch')}main` : ''}</span><span>⊗ 0　⚠ 0</span><span class="lab-sp"></span>${lang ? `<span>スペース: 2</span><span>UTF-8</span><span>CRLF</span><span>{ } ${lang}</span>` : ''}`;
  }

  function vscodeWin(s) {
    const v = s.vs;
    const acts = ['files', 'search', 'branch', 'bug', 'blocks'];
    return `<div class="lab-window vscode-sim">
      <div class="vscode-sim__titlebar"><span class="vscode-sim__logo" aria-hidden="true">${ic('code')}</span><div id="lab-vs-menu" class="vscode-sim__menu">${menuHtml(s)}</div>
        <span class="vscode-sim__center" aria-hidden="true"><span class="vscode-sim__arrows">${ic('back')}${ic('fwd')}</span><span class="vscode-sim__title">${ic('search')}<span>${v.folder ? 'sample-api' : '検索'}</span></span></span>${caption}</div>
      <div class="vscode-sim__workspace${v.term ? ' has-panel' : ''}">
        <nav class="vscode-sim__activity" aria-hidden="true">${acts.map((a, n) => `<span class="${n === 0 ? 'is-active' : ''}">${ic(a)}</span>`).join('')}<span class="lab-sp"></span><span>${ic('user')}</span><span>${ic('gear')}</span></nav>
        <aside id="lab-vs-side" class="vscode-sim__explorer" aria-label="エクスプローラー（フォルダーの中身）">${sideHtml(s)}</aside>
        <div id="lab-vs-editor" class="vscode-sim__editor" role="region" aria-label="編集画面">${editorHtml(s)}</div>
        <div id="lab-vs-panel" class="vscode-sim__terminal" role="region" aria-label="ターミナル"${v.term ? '' : ' hidden'}>${panelHtml(s)}</div>
      </div>
      <div id="lab-vs-status" class="vscode-sim__status">${statusHtml(s)}</div>
      <div id="lab-vs-overlay">${overlayHtml(s)}</div>
    </div>`;
  }

  function desktop(s) {
    const win = s.app === 'browser' ? browserWin(s) : s.app === 'installer' ? installerWin(s) : s.app === 'vscode' ? vscodeWin(s) : '';
    return `<div class="lab-desktop"><div class="lab-desk-area">${win}</div>${taskbar(s)}</div>`;
  }

  /* ---------- 描画 ---------- */
  const regions = {
    'lab-br-tabs': tabsHtml,
    'lab-br-url': urlHtml,
    'lab-br-dl': dlHtml,
    'lab-br-content': pageHtml,
    'lab-ins-body': insBody,
    'lab-vs-menu': menuHtml,
    'lab-vs-side': sideHtml,
    'lab-vs-editor': editorHtml,
    'lab-vs-panel': panelHtml,
    'lab-vs-status': statusHtml,
    'lab-vs-overlay': overlayHtml
  };

  function settle() {
    const term = $('lab-terminal');
    if (term) term.scrollTop = term.scrollHeight;
    const logs = $('lab-rd-logs');
    if (logs) logs.scrollTop = logs.scrollHeight;
    const code = stage.querySelector('.vscode-sim__code');
    if (code && st.vs.typing) code.scrollTop = code.scrollHeight;
    // タブが増えて幅に収まらないときも、開いているタブが見える位置へ寄せる
    const tabs = stage.querySelector('.vscode-sim__tabs');
    const on = tabs && tabs.querySelector('.is-active');
    if (on) tabs.scrollLeft += Math.max(0, on.getBoundingClientRect().right - tabs.getBoundingClientRect().right);
  }

  function paint(...ids) {
    ids.forEach((id) => {
      const el = $(id);
      if (el) el.innerHTML = regions[id](st);
    });
    settle();
  }

  function placeGuide(target) {
    const box = wrap.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const gw = guide.offsetWidth;
    const gh = guide.offsetHeight;
    let top = r.bottom - box.top + 12;
    const above = top + gh > box.height - 4;
    if (above) top = Math.max(4, r.top - box.top - gh - 12);
    const left = Math.max(4, Math.min(r.left - box.left + r.width / 2 - gw / 2, box.width - gw - 4));
    guide.style.top = `${top}px`;
    guide.style.left = `${left}px`;
    guide.style.setProperty('--ax', `${Math.max(14, Math.min(r.left - box.left + r.width / 2 - left, gw - 14))}px`);
    guide.classList.toggle('is-above', above);
  }

  function mark(focus = false) {
    stage.querySelectorAll('.guided').forEach((el) => el.classList.remove('guided'));
    const step = steps[index];
    const target = !busy && step ? [...stage.querySelectorAll(`[data-act="${step.act}"]`)].find((el) => el.offsetParent !== null) : null;
    if (!target) {
      guide.hidden = true;
      return;
    }
    target.classList.add('guided');
    if (focus && dialog.open) target.focus({ preventScroll: true });
    // 縦に長いページ（Render の設定フォームなど）では、上下の固定バーに隠れないよう中央へ寄せる
    const page = target.closest('.lab-br-content');
    if (page && !target.closest('.lab-rd__top, .lab-rd__deploybar')) {
      const box = page.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      if (r.top < box.top + 48 || r.bottom > box.bottom - 64) page.scrollTop += r.top - box.top - (box.height - r.height) / 2;
    }
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    guide.textContent = step.label;
    guide.hidden = false;
    placeGuide(target);
  }

  function render(focus = false) {
    const done = index >= steps.length;
    const step = steps[index];
    const opening = lastApp !== st.app;
    lastApp = st.app;
    // 同じページを描き直すときは、ブラウザー内のスクロール位置を引き継ぐ
    const tab = st.br.tabs[st.br.active];
    const pageKey = `${st.app}:${st.br.active}:${tab.page}:${st.rd.page}`;
    const keep = pageKey === lastPageKey && $('lab-br-content') ? $('lab-br-content').scrollTop : 0;
    lastPageKey = pageKey;
    stage.innerHTML = desktop(st);
    if (keep) $('lab-br-content').scrollTop = keep;
    if (opening && !reduced.matches) stage.querySelector('.lab-window')?.classList.add('is-opening');
    settle();
    const ch = done ? chapters.length : step.ch;
    $('lab-chapters').querySelectorAll('button').forEach((button, n) => {
      button.classList.toggle('is-done', done || n + 1 < ch);
      button.classList.toggle('is-current', !done && n + 1 === ch);
      if (!done && n + 1 === ch) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const about = (!done && step.about) || [];
    $('lab-about').hidden = !about.length;
    $('lab-about-list').innerHTML = about.map(([term, text]) => `<div><dt>${esc(term)}</dt><dd>${esc(text)}</dd></div>`).join('');
    if (done) {
      $('lab-progress').textContent = `STEP ${chapters.length} / ${chapters.length} 完了`;
      $('lab-task').textContent = 'ローカルから公開まで、ひととおり体験しました！';
      $('lab-hint').textContent = '上の番号から、練習したいところへ戻れます。実際に作るときは同じ順番で進めますが、本物の画面は見た目や文言がこの練習と違うところがあります。表示をよく読みながら、一つずつ進めましょう。';
    } else {
      const inChapter = steps.filter((x) => x.ch === step.ch);
      $('lab-progress').textContent = `STEP ${step.ch} / ${chapters.length}　操作 ${inChapter.indexOf(step) + 1} / ${inChapter.length}`;
      $('lab-task').textContent = chapterTitles[step.ch - 1];
      $('lab-hint').textContent = step.hint;
    }
    mark(focus);
  }

  /* ---------- アニメーションの道具 ---------- */
  const speed = () => ($('lab-fast').checked ? 0.4 : 1);

  function showKey(label) {
    keyToast.innerHTML = label.split('+').map((k) => `<kbd>${esc(k.trim())}</kbd>`).join('<span>+</span>');
    keyToast.hidden = false;
  }

  function makeFx(id, instant) {
    const wait = (ms) => (instant ? Promise.resolve() : new Promise((resolve, reject) => {
      setTimeout(() => (id === token ? resolve() : reject(ABORT)), ms * speed());
    }));
    const live = (fn) => (...args) => {
      if (instant) return;
      if (id !== token) throw ABORT;
      fn(...args);
    };
    return {
      wait,
      paint: live(paint),
      render: live(() => render()),
      top: live((region) => { const el = $(region); if (el) el.scrollTop = 0; }),
      async type(set, text, ms = 40, chunk = 1, ids = [], from = '') {
        if (instant) {
          set(from + text);
          return;
        }
        for (let i = 0; i < text.length; i += chunk) {
          set(from + text.slice(0, i + chunk));
          paint(...ids);
          await wait(ms);
        }
      },
      async key(label) {
        if (instant) return;
        showKey(label);
        await wait(460);
        keyToast.hidden = true;
      }
    };
  }

  /* ---------- 操作の部品 ---------- */
  function addFile(v, name, kind = 'file') {
    if (v.files.some((f) => f.name === name)) return;
    v.files.push({ name, kind });
    v.files.sort((a, b) => (a.kind === b.kind ? (a.name < b.name ? -1 : 1) : a.kind === 'folder' ? -1 : 1));
  }

  function openTab(v, name) {
    if (!v.tabs.includes(name)) v.tabs.push(name);
    v.active = name;
  }

  async function createFile(s, f, name) {
    const v = s.vs;
    v.newFile = '';
    f.paint('lab-vs-side');
    await f.wait(260);
    await f.type((x) => { v.newFile = x; }, name, 60, 1, ['lab-vs-side']);
    await f.wait(220);
    await f.key('Enter');
    v.newFile = null;
    addFile(v, name);
    v.text[name] = '';
    openTab(v, name);
    v.flash = [name];
    f.paint('lab-vs-side', 'lab-vs-editor', 'lab-vs-status');
    v.flash = [];
  }

  async function typeCode(s, f, name, text) {
    const v = s.vs;
    v.typing = name;
    v.dirty[name] = true;
    await f.type((x) => { v.text[name] = x; }, text, 16, 3, ['lab-vs-editor']);
    v.typing = '';
    f.paint('lab-vs-editor');
  }

  async function saveFile(s, f) {
    const v = s.vs;
    await f.key('Ctrl + S');
    v.dirty[v.active] = false;
    f.paint('lab-vs-editor');
  }

  async function runCommand(s, f, command, output = []) {
    const t = s.vs.term;
    await f.type((x) => { t.input = x; }, command, 34, 1, ['lab-vs-panel']);
    await f.wait(200);
    await f.key('Enter');
    t.lines.push({ k: 'cmd', text: command });
    t.input = '';
    f.paint('lab-vs-panel');
    for (const [text, delay = 90, cls = ''] of output) {
      await f.wait(delay);
      t.lines.push({ k: 'out', text, cls });
      f.paint('lab-vs-panel');
    }
  }

  async function navigate(s, f, typed, result, from = '') {
    const b = s.br;
    const tab = b.tabs[b.active];
    b.typing = from;
    f.paint('lab-br-url');
    await f.wait(200);
    await f.type((x) => { b.typing = x; }, typed, 46, 1, ['lab-br-url'], from);
    await f.wait(220);
    await f.key('Enter');
    b.typing = null;
    tab.url = result.url;
    tab.page = 'loading';
    tab.title = result.url.replace(/^https:\/\//, '');
    f.paint('lab-br-tabs', 'lab-br-url', 'lab-br-content');
    await f.wait(result.wait || 600);
    tab.page = result.page;
    tab.title = result.title;
    f.paint('lab-br-tabs', 'lab-br-url', 'lab-br-content');
  }

  const switchApp = (app) => async (s, f) => {
    s.app = app;
    s.running[app] = true;
    f.render();
    await f.wait(260);
  };

  // Render 内のページ移動。読み込み表示をはさみ、URL とタブ名も切り替える
  const rdNav = async (s, f, page, wait = 520) => {
    const tab = s.br.tabs[s.br.active];
    tab.page = 'loading';
    f.paint('lab-br-content');
    await f.wait(wait);
    s.rd.page = page;
    s.rd.menu = false;
    [tab.url, tab.title] = RD_TABS[page];
    tab.plain = page === 'authorize';
    tab.page = 'render';
    f.paint('lab-br-tabs', 'lab-br-url', 'lab-br-content');
    f.top('lab-br-content');
  };

  // Render の入力欄: 自動入力されている文字を全選択してから、打ち直す
  const rdReplace = (key, text) => async (s, f) => {
    const r = s.rd;
    r.sel = key;
    f.paint('lab-br-content');
    await f.wait(520);
    r.sel = '';
    r.typing = key;
    r[key] = '';
    f.paint('lab-br-content');
    await f.wait(160);
    await f.type((x) => { r[key] = x; }, text, 55, 1, ['lab-br-content']);
    r.typing = '';
    f.paint('lab-br-content');
  };

  const insNext = (page) => async (s, f) => {
    s.ins.page = page;
    f.paint('lab-ins-body');
    await f.wait(160);
  };

  const command = (ch, hint, text, output, explain, after, about) => ({
    ch, hint, about, act: 'term', label: `クリックで「${text}」を入力して実行`, explain,
    run: async (s, f) => {
      await runCommand(s, f, text, output);
      if (after) await after(s, f);
    }
  });

  const newFile = (ch, name, hint, explain, about) => ({
    ch, hint, about, act: 'vs-new-file', label: `クリックで ${name} を作成`, explain,
    run: (s, f) => createFile(s, f, name)
  });

  const writeCode = (ch, name, text, hint, label, explain, about) => ({
    ch, hint, about, act: 'vs-editor', label, explain,
    run: (s, f) => typeCode(s, f, name, text)
  });

  const save = (ch, explain, about) => ({
    ch, hint: 'Ctrl + S で保存します。保存するまでは、ファイルの中身は変わっていません。', about, act: 'key-save', label: 'Ctrl + S で保存', explain,
    run: saveFile
  });

  /* ---------- ステップ定義（1要素 = 1クリックぶん） ----------
     ch: 章(1-8) / hint: 押す前の案内 / act: 押す場所(data-act) / label: 赤枠に添える白文字
     about: ことばメモ。[用語, 説明] の配列（省略可）。これから使う道具やコマンドが何をするものかを添える
     run(s, f): 状態 s を変える。f.wait / f.type / f.paint / f.key が変化を再生する。 / explain: 押した後の説明 */
  const steps = [
    /* 1. Node.js */
    {
      ch: 1, act: 'node-download', label: 'ここを押してダウンロード',
      hint: 'Node.js 公式サイトのダウンロードページです。Windows 用インストーラーのボタンを押して、ダウンロードを始めます。',
      about: [
        ['Node.js', 'JavaScript を、ブラウザーの外（自分の PC やサーバー）で動かすための土台です。これから作る API サーバーは、この上で動きます。'],
        ['LTS', '長期サポート版のことです。安定しているので、迷ったらこの版を選びます。']
      ],
      explain: `インストーラー（${MSI}）が保存されました。まだ保存しただけで、インストールはこれからです。`,
      run: async (s, f) => {
        const b = s.br;
        b.dl = { pct: 0, done: false };
        b.dlOpen = true;
        f.render();
        for (let pct = 6; pct <= 100; pct += 6) {
          await f.wait(70);
          b.dl.pct = Math.min(pct, 100);
          f.paint('lab-br-dl');
        }
        b.dl = { pct: 100, done: true };
        f.paint('lab-br-dl');
      }
    },
    {
      ch: 1, act: 'open-msi', label: 'ファイルを開く',
      hint: 'ブラウザーのダウンロード一覧から、保存されたファイルを開きます。',
      about: [['インストーラー（.msi）', 'ソフトを PC に入れるためのファイルです。開くと、案内に沿って進めるセットアップ画面（ウィザード）が始まります。']],
      explain: 'セットアップ ウィザード（インストールの案内役）が起動しました。画面は英語ですが、基本は Next で進めます。',
      run: async (s, f) => {
        s.br.dlOpen = false;
        await switchApp('installer')(s, f);
      }
    },
    {
      ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'Welcome（ようこそ）画面です。Next を押して次へ進みます。',
      about: [['セットアップ ウィザード', '画面の案内に順番に答えていくと、インストールが終わるしくみです。基本は初期設定のまま Next で進めます。']],
      explain: '使用許諾（ライセンス）の確認画面になりました。', run: insNext('license')
    },
    {
      ch: 1, act: 'ins-accept', label: '同意にチェック', hint: '内容を確認して、「I accept the terms…（同意します）」にチェックを入れます。',
      about: [['ライセンス（使用許諾）', 'ソフトを使うときの約束ごとです。Node.js は無料で使えるオープンソースで、同意すると次へ進めます。']],
      explain: 'チェックを入れると、Next が押せるようになります。',
      run: async (s, f) => { s.ins.accepted = true; f.paint('lab-ins-body'); await f.wait(120); }
    },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: '同意できたので、Next を押して進みます。', explain: 'インストール先の確認です。通常は変更しません。', run: insNext('dest') },
    {
      ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'インストール先（C:\\Program Files\\nodejs\\）はそのままで Next。',
      about: [['インストール先', 'Node.js 本体を置く場所です。変える理由がなければ、初期設定のままにします。']],
      explain: '入れる機能の一覧です。npm（パッケージ管理）と PATH の設定も一緒に入ります。', run: insNext('custom')
    },
    {
      ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: '機能の一覧もそのままで Next。「npm package manager」と「Add to PATH」が含まれていることだけ見ておきましょう。',
      about: [
        ['npm', 'Node.js と一緒に入る、部品（パッケージ）を追加・管理する道具です。あとで Express を入れるときに使います。'],
        ['Add to PATH', 'ターミナルのどのフォルダーからでも、node や npm と打てば動くようにする設定です。']
      ],
      explain: '追加ツールの画面です。今回の API 作りには必要ありません。', run: insNext('tools')
    },
    {
      ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'チェックは入れずに Next。',
      about: [['追加ツール（Native Modules）', 'C++ などで書かれた特殊な部品を組み立てるためのツールです。今回の API では使わないので、入れません。']],
      explain: 'インストールの準備ができました。', run: insNext('ready')
    },
    {
      ch: 1, act: 'ins-install', label: 'Install（インストール）', hint: 'Install を押して、インストールを始めます。',
      explain: 'Windows が「このアプリに変更を許可するか」を確認しています。',
      run: async (s, f) => { s.ins.uac = true; f.render(); await f.wait(200); }
    },
    {
      ch: 1, act: 'uac-yes', label: '発行元を確認して「はい」', hint: '発行元が OpenJS Foundation（Node.js の運営元）であることを確認して、「はい」を押します。',
      about: [['ユーザー アカウント制御', 'PC の設定を変えるソフトを動かす前に、Windows が本人に確認するしくみです。発行元が正しいかを見てから許可します。']],
      explain: 'Node.js と npm がインストールされました。',
      run: async (s, f) => {
        const i = s.ins;
        i.uac = false;
        i.page = 'progress';
        i.pct = 0;
        f.render();
        const phases = ['Validating install', 'Copying new files', 'Copying new files', 'Updating environment strings', 'Creating shortcuts', 'Removing backup files'];
        for (let n = 0; n < phases.length; n += 1) {
          i.status = phases[n];
          for (let k = 0; k < 4; k += 1) {
            i.pct = Math.min(100, Math.round(((n * 4 + k + 1) / (phases.length * 4)) * 100));
            f.paint('lab-ins-body');
            await f.wait(85);
          }
        }
        i.pct = 100;
        i.page = 'done';
        f.paint('lab-ins-body');
      }
    },
    {
      ch: 1, act: 'ins-finish', label: 'Finish（完了）', hint: 'Finish を押して、ウィザードを閉じます。',
      explain: 'インストール完了です。次は VS Code で、API 用の作業フォルダーを開きます。',
      run: async (s, f) => { s.running.installer = false; s.app = 'none'; f.render(); await f.wait(200); }
    },

    /* 2. フォルダーを紐づける */
    {
      ch: 2, act: 'task-vscode', label: 'VS Code を起動', hint: '画面下のタスク バーから、VS Code を起動します。',
      about: [['VS Code', 'コードを書くためのエディターです。ファイルの作成・編集と、コマンドを打つターミナルを、1 つの画面で扱えます。']],
      explain: 'VS Code が開き、「ようこそ」のタブが表示されました。まだフォルダーを開いていないので、左のエクスプローラーにファイルはありません。', run: switchApp('vscode')
    },
    {
      ch: 2, act: 'vs-open-folder', label: 'フォルダーを開く', hint: 'エクスプローラーの「フォルダーを開く」を押します。',
      about: [['フォルダーを開く', 'VS Code に「このフォルダーの中で作業する」と伝える操作です。1 つの API（プロジェクト）ごとに、専用のフォルダーを 1 つ用意します。']],
      explain: 'Windows のフォルダー選択画面が開きました。最初は、自分のユーザー フォルダーの中が表示されています。',
      run: async (s, f) => { s.vs.picker = { place: 'home', name: null, done: false }; f.paint('lab-vs-overlay'); await f.wait(200); }
    },
    {
      ch: 2, act: 'pk-desktop', label: 'デスクトップへ移動', hint: '左の一覧から「デスクトップ」を押して、フォルダーを作る場所へ移動します。',
      about: [['作業フォルダーの場所', 'あとで見つけやすい場所なら、どこでもかまいません。この練習では、デスクトップに作ります。']],
      explain: 'デスクトップの中が表示されました。ここに、API 用のフォルダーを新しく作ります。',
      run: async (s, f) => { s.vs.picker.place = 'desktop'; f.paint('lab-vs-overlay'); await f.wait(200); }
    },
    {
      ch: 2, act: 'pk-new', label: 'クリックで sample-api を作成', hint: '「新しいフォルダー」を押して、sample-api という名前を付けます。',
      about: [['フォルダー名', '半角の英小文字・数字・ハイフンで付けます。日本語や空白を入れると、コマンドや公開先でつまずきやすくなります。']],
      explain: 'デスクトップに sample-api フォルダーができ、選択された状態になりました。',
      run: async (s, f) => {
        const p = s.vs.picker;
        p.name = '';
        f.paint('lab-vs-overlay');
        await f.wait(300);
        await f.type((x) => { p.name = x; }, 'sample-api', 70, 1, ['lab-vs-overlay']);
        await f.wait(200);
        await f.key('Enter');
        p.done = true;
        f.paint('lab-vs-overlay');
      }
    },
    {
      ch: 2, act: 'pk-select', label: 'フォルダーの選択', hint: 'sample-api を選んだまま、「フォルダーの選択」を押します。',
      explain: 'VS Code が、このフォルダーの作成者を信頼するかを確認しています。',
      run: async (s, f) => { s.vs.picker = null; s.vs.trust = true; f.paint('lab-vs-overlay'); await f.wait(200); }
    },
    {
      ch: 2, act: 'vs-trust', label: '自分のフォルダーなので「はい」', hint: '自分で作ったフォルダーなので、「はい、作成者を信頼します」を押します。',
      about: [['作成者を信頼', 'フォルダー内のプログラムを VS Code が動かしてよいかの確認です。出どころの分からないフォルダーでは、信頼せずに中身を確かめます。']],
      explain: 'VS Code と sample-api フォルダーがつながりました。ここで作るファイルは、すべてこのフォルダーに保存されます。',
      run: async (s, f) => { s.vs.trust = false; s.vs.folder = true; f.render(); await f.wait(200); }
    },

    /* 3. ファイルを作る */
    newFile(3, 'data.json', 'エクスプローラーの「新しいファイル...」アイコンを押して、data.json を作ります。', 'data.json ができ、右の編集画面で開きました。中身はまだ空です。',
      [['data.json', 'API が返すデータを入れておくファイルです。プログラムとデータを分けておくと、あとでデータだけを直せます。']]),
    writeCode(3, 'data.json', dataJson, '編集画面をクリックして、API が返すデータ（JSON）を書きます。', 'クリックで JSON を入力', 'JSON を書きました。タブの ● は「まだ保存していない」印です。',
      [['JSON', 'データを「"名前": 値」の組で書く形式です。プログラム同士がデータを受け渡すときの、共通の書き方です。']]),
    save(3, 'data.json を保存しました。● が消えています。',
      [['保存（Ctrl + S）', '編集画面の内容を、ファイルに書き込む操作です。タブの ● は「まだ保存していない変更がある」印です。']]),
    newFile(3, 'server.js', '同じように、サーバーのプログラムを書く server.js を作ります。', 'server.js ができました。ここにサーバーのプログラムを書きます。',
      [['server.js', 'サーバーの動きを書くプログラムです。「どの URL にお願いが来たら、何を返すか」をここに書きます。']]),
    writeCode(3, 'server.js', serverCode, '編集画面をクリックして、サーバーのコードを書きます。', 'クリックでコードを入力', 'お願い（GET /api/hello）を受け取り、data.json の中身を JSON で返すプログラムです。',
      [
        ['require', '別のファイルや部品を読み込む命令です。ここでは Express と data.json を読み込みます。'],
        ['app.get と app.listen', 'app.get は「/api/hello にお願いが来たら data を返す」窓口づくり、app.listen は待ち受けを始める命令です。']
      ]),
    save(3, '2つのファイルがそろいました。ただし express はまだ入っていないので、このままでは動きません。'),

    /* 4. npm init と Express */
    {
      ch: 4, act: 'vs-menu-terminal', label: 'ターミナル メニュー', hint: '上のメニューから「ターミナル」を開きます。',
      about: [
        ['ターミナル', '文字のコマンドで PC に指示を出す画面です。Node.js や npm は、ここにコマンドを打って使います。'],
        ['メニューが見当たらないとき', 'ウィンドウの幅が狭いと、「ターミナル」は右端の「…」の中に入っています。「…」を押すと出てきます。']
      ],
      explain: 'ターミナルに関するメニューが開きました。',
      run: async (s, f) => { s.vs.menu = 'terminal'; f.paint('lab-vs-menu'); await f.wait(120); }
    },
    {
      ch: 4, act: 'vs-new-terminal', label: '新しいターミナル', hint: '「新しいターミナル」を選びます。',
      explain: '画面の下にターミナルが開きました。「PS C:\\…\\sample-api>」は入力待ちの表示で、いま sample-api フォルダーにいることを表します。',
      run: async (s, f) => { s.vs.menu = ''; s.vs.term = { lines: [], input: '', running: false }; f.render(); await f.wait(200); }
    },
    command(4, 'まず、Node.js が使えるかを確認します。ターミナルをクリックすると、コマンドの入力を再現します。', 'node --version', [[NODE_V, 240]],
      `バージョン（${NODE_V}）が表示されれば、Node.js は正しくインストールされています。`, null,
      [['node --version', 'インストールされている Node.js のバージョンを表示するコマンドです。番号が出れば、Node.js を使える状態です。']]),
    command(4, 'npm init -y で、プロジェクトの説明書（package.json）を作ります。', 'npm init -y',
      [[`Wrote to ${HOME}\\package.json:`, 420], ['', 60], ...pkgJson(false).split('\n').map((l) => [l, 26]), ['', 60]],
      'package.json が作られ、エクスプローラーに増えました。server.js があるので、起動用の start（node server.js）も自動で入っています。',
      async (s, f) => {
        const v = s.vs;
        addFile(v, 'package.json');
        v.text['package.json'] = pkgJson(false);
        v.flash = ['package.json'];
        f.paint('lab-vs-side');
        v.flash = [];
      },
      [
        ['npm init', 'このフォルダーを「npm で管理するプロジェクト」にするコマンドです。名前・バージョン・使う部品を記録する説明書（package.json）を作ります。'],
        ['-y', '名前やバージョンなどの質問に、すべて初期値で答える指定です。付けないと、1 問ずつ聞かれます。']
      ]),
    {
      ch: 4, act: 'term', label: 'クリックで「npm install express」を入力して実行',
      hint: 'npm install express で、API を作りやすくする部品（Express）を追加します。',
      about: [
        ['Express', 'Web サーバーや API を、短いコードで書けるようにする部品（フレームワーク）です。「この URL に来たら、これを返す」を数行で書けます。'],
        ['npm install', 'インターネット上の npm の倉庫から部品を取ってきて、このプロジェクトに追加するコマンドです。']
      ],
      explain: 'Express と、Express が必要とする部品が node_modules フォルダーに入りました。package.json の dependencies にも「express を使う」と記録されています。',
      run: async (s, f) => {
        const v = s.vs;
        const t = v.term;
        await runCommand(s, f, 'npm install express');
        const spin = { k: 'out', text: '⠋', cls: 'is-spin' };
        t.lines.push(spin);
        const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
        for (let n = 0; n < 26; n += 1) {
          spin.text = frames[n % frames.length];
          f.paint('lab-vs-panel');
          await f.wait(75);
        }
        t.lines.pop();
        addFile(v, 'node_modules', 'folder');
        addFile(v, 'package-lock.json');
        v.text['package.json'] = pkgJson(true);
        v.flash = ['node_modules', 'package-lock.json'];
        [['', 0], ['added 65 packages, and audited 66 packages in 3s', 0], ['', 0], ['28 packages are looking for funding', 0], ['  run `npm fund` for details', 0], ['', 0], ['found 0 vulnerabilities', 0]]
          .forEach(([text]) => t.lines.push({ k: 'out', text }));
        f.paint('lab-vs-panel', 'lab-vs-side');
        v.flash = [];
      }
    },

    /* 5. そのほかの npm コマンド */
    {
      ch: 5, act: 'tree-package.json', label: 'package.json を開く', hint: 'エクスプローラーで package.json を押して、中身を見てみましょう。',
      about: [
        ['package.json', 'プロジェクトの説明書です。名前、起動方法（scripts）、使っている部品（dependencies）が書かれています。'],
        ['node_modules と package-lock.json', 'node_modules は部品の実物の置き場、package-lock.json は入れた部品の正確なバージョンの記録です。どちらも npm が自動で作ります。']
      ],
      explain: 'dependencies に express、scripts に start（node server.js）が入っています。npm は、この説明書を見て動きます。',
      run: async (s, f) => { const v = s.vs; openTab(v, 'package.json'); v.mark = '"express"'; f.paint('lab-vs-side', 'lab-vs-editor', 'lab-vs-status'); await f.wait(300); }
    },
    command(5, 'npm list で、入っているパッケージを確認します。', 'npm list', [[`sample-api@1.0.0 ${HOME}`, 260], [`└── express@${EXPRESS_V}`, 80], ['', 40]],
      `express@${EXPRESS_V} が入っていることを確認できました。`, null,
      [['npm list', 'このプロジェクトに入っている部品とバージョンを、一覧で表示するコマンドです。入れたはずの部品があるかを確かめられます。']]),
    command(5, 'npm run で、登録されている短縮コマンドの一覧を見ます。', 'npm run',
      [['Lifecycle scripts included in sample-api@1.0.0:', 260], ['  test', 60], ['    echo "Error: no test specified" && exit 1', 40], ['  start', 60], ['    node server.js', 40], ['', 40]],
      'start が登録されています。npm start と打てば node server.js が実行されます。公開先でも、この start を使って起動します。',
      async (s, f) => { s.vs.mark = '"start"'; f.paint('lab-vs-editor'); },
      [['npm run', 'package.json の scripts に登録した短縮コマンドを実行します。名前を付けずに打つと、登録されている一覧が表示されます。']]),

    /* 6. サーバーを起動 */
    command(6, 'node server.js で、サーバーを起動します。', 'node server.js', [['API is listening on port 3000', 520]],
      'サーバーが起動しました。ターミナルは次の入力を受け付けず、お願いを待ち続けています。これが正常な状態です。',
      async (s, f) => { s.vs.term.running = true; s.vs.mark = ''; openTab(s.vs, 'server.js'); f.paint('lab-vs-panel', 'lab-vs-editor', 'lab-vs-side', 'lab-vs-status'); },
      [
        ['node server.js', 'server.js を Node.js で実行するコマンドです。実行すると、お願いを待ち受けるサーバーになります。'],
        ['ポート（3000）', '1 台の PC の中で、どのプログラム宛ての通信かを区別する番号です。']
      ]),

    /* 7. 動作確認 */
    {
      ch: 7, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'サーバーは動かしたまま、タスク バーからブラウザーに切り替えます。',
      about: [['動作の確認', 'API は「URL にお願いを送ると、データが返ってくる」しくみです。ブラウザーのアドレス バーに URL を入れるのが、いちばん手軽な確かめ方です。']],
      explain: 'ブラウザーに切り替えました。VS Code では、サーバーが動き続けています。', run: switchApp('browser')
    },
    {
      ch: 7, act: 'br-newtab', label: '新しいタブ', hint: '「+」で新しいタブを開きます。', explain: '新しいタブが開きました。',
      run: async (s, f) => { const b = s.br; b.tabs.push({ title: '新しいタブ', url: '', page: 'blank' }); b.active = b.tabs.length - 1; f.render(); await f.wait(160); }
    },
    {
      ch: 7, act: 'br-address', label: 'クリックで URL を入力', hint: 'アドレス バーに localhost:3000/api/hello と入力して、Enter を押します。',
      about: [['localhost', '「いま使っているこの PC 自身」を指す名前です。:3000 はポート番号、/api/hello は server.js で作った窓口です。']],
      explain: 'サーバーから JSON が返ってきました。これが、自分の PC の中で動いている API です。ほかの端末からは、まだ開けません。',
      run: (s, f) => navigate(s, f, 'localhost:3000/api/hello', { url: 'localhost:3000/api/hello', page: 'json', title: 'localhost:3000/api/hello' })
    },
    { ch: 7, act: 'task-vscode', label: 'VS Code に戻る', hint: 'VS Code に戻って、サーバーを止めてみます。', explain: 'VS Code に戻りました。ターミナルではサーバーが動いたままです。', run: switchApp('vscode') },
    {
      ch: 7, act: 'key-ctrlc', label: 'Ctrl + C で停止', hint: 'ターミナルで Ctrl + C を押すと、サーバーが止まります。',
      about: [['Ctrl + C', 'ターミナルで動いているプログラムを止めるキー操作です。サーバーは、止めるまで動き続けます。']],
      explain: 'サーバーが止まり、ターミナルに入力待ちの行が戻りました。',
      run: async (s, f) => { const t = s.vs.term; await f.key('Ctrl + C'); t.lines.push({ k: 'out', text: '^C' }); t.running = false; f.paint('lab-vs-panel'); await f.wait(200); }
    },
    { ch: 7, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'もう一度ブラウザーに切り替えます。', explain: 'さきほど JSON が表示されたタブです。', run: switchApp('browser') },
    {
      ch: 7, act: 'br-reload', label: '再読み込み', hint: '同じ URL を再読み込みして、もう一度お願いを送ってみます。',
      explain: '「接続が拒否されました」は、その住所で待ち受けているプログラムがない、という意味です。ファイルがあるだけでは API は動かず、サーバーが動いている間だけ応答できます。',
      run: async (s, f) => {
        const tab = s.br.tabs[s.br.active];
        tab.page = 'loading';
        f.paint('lab-br-content');
        await f.wait(700);
        tab.page = 'refused';
        f.paint('lab-br-content');
      }
    },

    /* 8. GitHub へ保存 */
    {
      ch: 8, act: 'task-vscode', label: 'VS Code に戻る', hint: '公開の準備をします。まず VS Code に戻ります。',
      about: [['公開の流れ', 'コードを GitHub に保存し、公開先（Render）が GitHub からコードを受け取って動かします。まずは GitHub へ保存する準備をします。']],
      explain: 'まず、コードを GitHub に保存します。', run: switchApp('vscode')
    },
    newFile(8, '.gitignore', 'GitHub に送らないものを決める除外リスト（.gitignore）を作ります。', '.gitignore ができました。',
      [['.gitignore', 'Git に「このファイルやフォルダーは記録しない」と伝える除外リストです。ここに書いたものは、GitHub へ送られません。']]),
    writeCode(8, '.gitignore', 'node_modules/', '編集画面をクリックして、除外するフォルダー名（node_modules/）を書きます。', 'クリックで node_modules/ を入力',
      'node_modules を保存の対象から外しました。パスワードなどの秘密を書いたファイルも、同じように .gitignore に入れて守ります。',
      [['node_modules を外す理由', '部品の実物が入っていて、ファイル数がとても多いフォルダーです。package.json があれば npm install で同じものを入れ直せるので、記録しません。']]),
    save(8, '.gitignore を保存しました。'),
    command(8, 'git init で、このフォルダーを Git の管理下に置きます。', 'git init', [['Initialized empty Git repository in C:/Users/you/Desktop/sample-api/.git/', 300]],
      '履歴を記録する準備ができました。左下に、ブランチ名（main）が表示されています。',
      async (s, f) => { s.vs.git = true; f.paint('lab-vs-status'); },
      [
        ['Git', 'ファイルの変更を「履歴」として記録する道具です。いつ・何を変えたかを残し、前の状態に戻せます。'],
        ['git init', 'このフォルダーで Git の記録を始めるコマンドです。記録用の隠しフォルダー（.git）が作られます。']
      ]),
    command(8, 'git add . で、保存したいファイルを選びます。', 'git add .', [], '.gitignore に書いた node_modules を除いて、ファイルが選ばれました。', null,
      [['git add .', '次の履歴に入れるファイルを選ぶコマンドです。「.」は「このフォルダーの中すべて」を表します。']]),
    command(8, 'git commit で、PC の中に履歴として保存します。', 'git commit -m "初回作成"',
      [['[main (root-commit) 3f2a1c9] 初回作成', 320], [' 5 files changed, 874 insertions(+)', 60], [' create mode 100644 .gitignore', 30], [' create mode 100644 data.json', 30], [' create mode 100644 package-lock.json', 30], [' create mode 100644 package.json', 30], [' create mode 100644 server.js', 30]],
      'PC の中に「初回作成」という履歴ができました。まだ GitHub には送られていません。', null,
      [['git commit', '選んだファイルの状態を、1 つの履歴として PC の中に保存します。-m のあとの文字は、何をしたかを残すメモです。']]),
    command(8, 'gh repo create で、GitHub に保管場所を作ってコードを送ります。質問には「既存のローカルリポジトリを push」「Private」「Yes」を選びます。', 'gh repo create',
      [['? What would you like to do? Push an existing local repository to GitHub', 420], ['? Path to local repository .', 220], ['? Repository name sample-api', 220], ['? Visibility Private', 220], ['✓ Created repository you/sample-api on GitHub', 520, 'is-ok'], ['  https://github.com/you/sample-api', 60], ['? Add a remote? Yes', 220], ['✓ Added remote https://github.com/you/sample-api.git', 260, 'is-ok'], ['? Would you like to push commits from the current branch to "origin"? Yes', 260], ['✓ Pushed commits to https://github.com/you/sample-api.git', 520, 'is-ok']],
      'GitHub に sample-api リポジトリができ、コードが送られました。（実際には、先に gh auth login でのログインが必要です）', null,
      [
        ['GitHub', 'Git の履歴をインターネット上に保管できるサービスです。公開先の Render は、ここからコードを受け取ります。'],
        ['gh repo create', 'GitHub 公式のコマンド（GitHub CLI）です。保管場所（リポジトリ）を作って、コードを送るところまで行います。']
      ]),

    /* 9. Render で公開（画面と手順は api/screenshot/render の実物の画面に合わせている） */
    {
      ch: 9, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'ここからは公開先（Render）の画面です。ブラウザーに切り替えます。',
      about: [['Render', 'プログラムを、インターネット上のサーバーで動かしてくれるサービスです。自分の PC を閉じても、API が動き続けるようになります。']],
      explain: '新しいタブで Render を開きます。', run: switchApp('browser')
    },
    {
      ch: 9, act: 'br-newtab', label: '新しいタブ', hint: '「+」で新しいタブを開きます。', explain: '新しいタブが開きました。',
      run: async (s, f) => { const b = s.br; b.tabs.push({ title: '新しいタブ', url: '', page: 'blank' }); b.active = b.tabs.length - 1; f.render(); await f.wait(160); }
    },
    {
      ch: 9, act: 'br-address', label: 'クリックで URL を入力', hint: 'アドレス バーに render.com と入力して、Enter を押します。',
      explain: 'Render の公式サイトが開きました。右上の Sign in からログインします。',
      run: (s, f) => navigate(s, f, 'render.com', { url: RD_TABS.landing[0], page: 'render', title: RD_TABS.landing[1] })
    },
    {
      ch: 9, act: 'rd-signin', label: 'Sign in', hint: '右上の「Sign in」を押します。',
      about: [['Sign in と Get started', 'Sign in は登録済みの人のログイン、Get started は新しくアカウントを作る入口です。この練習では、アカウント作成は済んでいるものとして進めます。']],
      explain: 'ログイン方法を選ぶ画面です。パスワードは入力せず、GitHub のアカウントでログインします。',
      run: (s, f) => rdNav(s, f, 'signin')
    },
    {
      ch: 9, act: 'rd-github', label: 'GitHub でログイン', hint: '「GitHub」を押して、GitHub のアカウントでログインします。',
      about: [['GitHub でログインする理由', 'コードは GitHub に保存してあります。GitHub のアカウントでログインしておくと、Render からそのリポジトリを選べるようになります。']],
      explain: '初回は、GitHub 連携の許可画面が出ます。',
      run: (s, f) => rdNav(s, f, 'authorize', 700)
    },
    {
      ch: 9, act: 'rd-authorize', label: 'Authorize Render', hint: '内容を確認して、「Authorize Render」を押します。',
      about: [['GitHub 連携の許可', '初回だけ表示されます。Render が自分のリポジトリ一覧を読めるようにするための接続です。']],
      explain: 'Render のダッシュボードが開きました。サービスの一覧や作成は、ここから行います。',
      run: (s, f) => rdNav(s, f, 'dashboard', 800)
    },
    {
      ch: 9, act: 'rd-new', label: '+ New', hint: '右上の「+ New」を押して、作るものの種類を選びます。',
      about: [
        ['Project', '複数のサービスをまとめて見やすくする「フォルダー」のようなものです。作るかどうかは自由で、今回の小さな API では作らなくて大丈夫です。'],
        ['Create your first project', 'Project を作るボタンです。今回は押さずに、右上の + New から進みます。']
      ],
      explain: '作れるものの種類が並びました。',
      run: async (s, f) => { s.rd.menu = true; f.paint('lab-br-content'); await f.wait(120); }
    },
    {
      ch: 9, act: 'rd-webservice', label: 'Web Service', hint: '一覧から「Web Service」を選びます。',
      about: [
        ['Web Service', 'Node.js／Express を実際に起動して、Web API を公開する本体です。今回必要なのはこちらです。'],
        ['Project との違い', 'Project はサービスをまとめる入れ物、Web Service は動かす中身です。今回は Web Service だけを作ります。']
      ],
      explain: '次に、どのコードを動かすかを選びます。',
      run: (s, f) => rdNav(s, f, 'connect')
    },
    {
      ch: 9, act: 'rd-repo', label: 'sample-api を選ぶ', hint: 'Git Provider の一覧から、さきほど GitHub に送った sample-api を選びます。',
      about: [['リポジトリを選ぶ', '動かすコードの置き場所を指定します。つないでおくと、GitHub に新しいコードを送るたびに、Render が自動で作り直します。']],
      explain: '設定フォームが開きました。Node.js のプロジェクトだと判断され、いくつかの欄が自動で入力されています。',
      run: (s, f) => rdNav(s, f, 'form')
    },
    {
      ch: 9, act: 'rd-free', label: '左の丸を押して Free を選ぶ', hint: 'Compute 欄のいちばん上、「$0 / month … Free」の行の左にある丸い選択ボタンを押します。',
      about: [
        ['Compute（料金プラン）', 'サーバーの性能と料金です。最初は有料の $7 / month が選ばれているので、無料で試すときは必ず Free に変えます。'],
        ['そのままでよい欄', 'Name・Language・Branch（main）は自動入力のまま、Root Directory は空欄のままにします。Project 欄の「Create a project」は、今回は押しません。']
      ],
      explain: 'Free が選ばれ、左下の表示も $0 / month に変わりました。無料のインスタンスは、しばらくアクセスがないと停止します。',
      run: async (s, f) => { s.rd.plan = 'free'; f.paint('lab-br-content'); await f.wait(160); }
    },
    {
      ch: 9, act: 'rd-build', label: 'クリックで npm install に置き換え', hint: 'Build Command の欄にある yarn install を、npm install に完全に置き換えます。',
      about: [
        ['Build Command', '公開先で、起動の前に実行される準備のコマンドです。package.json に書いた Express を、Render 上へインストールするのが目的です。'],
        ['yarn install を消す理由', 'Render が自動で入れた初期値です。この練習では npm を使っているので、文字を残さず npm install に書き換えます。']
      ],
      explain: 'Build Command が npm install になりました。node_modules は GitHub に送っていないので、Express はここで入ります。',
      run: rdReplace('build', 'npm install')
    },
    {
      ch: 9, act: 'rd-start', label: 'クリックで npm start に置き換え', hint: 'Start Command の欄にある node server.js を、npm start に完全に置き換えます。',
      about: [['Start Command', 'サーバーを起動するコマンドです。npm start は、リポジトリ内の package.json に書いた "start": "node server.js" を実行します。']],
      explain: 'Start Command が npm start になりました。準備（Build）と起動（Start）の両方がそろいました。',
      run: rdReplace('start', 'npm start')
    },
    {
      ch: 9, act: 'rd-deploy', label: 'Deploy web service', hint: '設定を確認して、左下の「Deploy web service」を押します。',
      about: [
        ['押す前に確認する設定', 'Build Command：npm install ／ Start Command：npm start ／ Compute：$0 / month（Free）／ Root Directory：空欄 ／ Branch：main'],
        ['デプロイ', '書いたプログラムを公開先に配置して、動かすことです。コードの取得 → 準備（Build）→ 起動（Start）の順に進みます。']
      ],
      explain: 'Render が GitHub からコードを取得し、npm install と npm start を実行しました。ポートには、server.js の process.env.PORT が受け取った番号（10000）が使われています。',
      run: async (s, f) => {
        const r = s.rd;
        r.t0 = Date.now();
        r.status = 'building';
        r.secs = 0;
        r.logs = [];
        r.live = false;
        await rdNav(s, f, 'deploy', 700);
        // sec はデプロイ開始からの秒数（時刻と DURATION の表示用）。行の間隔は実物のログに近づけている
        const log = async (sec, html, delay = 60, tag = '') => {
          await f.wait(delay);
          r.secs = sec;
          r.logs.push({ t: clock(r.t0 + sec * 1000), html, tag, cls: html.startsWith('<b>') ? 'is-step' : '' });
          f.paint('lab-br-content');
        };
        const step = (text) => `<b>==&gt;</b> ${text}`;
        const tag = '[x7k2p]';
        await log(3, step('Cloning from <u>https://github.com/you/sample-api</u>'), 500);
        await log(10, step(`Checking out commit ${COMMIT_FULL} in branch main`), 700);
        r.status = 'progress';
        await log(11, step(`Using Node.js version ${NODE_V.slice(1)} (default)`), 300);
        await log(11, step('Docs on specifying a Node.js version: <u>https://render.com/docs/node-version</u>'), 120);
        await log(11, step("Running build command 'npm install'..."), 300);
        await log(13, '', 900);
        await log(13, 'added 65 packages, and audited 66 packages in 2s');
        await log(13, '');
        await log(13, '28 packages are looking for funding');
        await log(13, '  run `npm fund` for details');
        await log(13, '');
        await log(13, 'found 0 vulnerabilities');
        await log(14, step('Uploading build...'), 400);
        await log(15, step('Uploaded in 1.4s. Compression took 0.1s'), 500);
        await log(15, step('Build successful 🎉'), 200);
        await log(17, step('Deploying...'), 500);
        await log(17, step('Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance'), 160);
        await log(24, step("Running 'npm start'"), 900, tag);
        await log(26, '', 300, tag);
        await log(26, '&gt; sample-api@1.0.0 start', 60, tag);
        await log(26, '&gt; node server.js', 60, tag);
        await log(26, '', 60, tag);
        await log(26, 'API is listening on port 10000', 400, tag);
        r.status = 'live';
        r.live = true;
        await log(27.5, step('Your service is live 🎉'), 700);
        await log(27.5, step(''));
        await log(27.5, step('///////////////////////////////////////////////////////////'));
        await log(27.5, step(''));
        await log(27.5, step(`Available at your primary URL <button type="button" data-act="rd-url">${PUBLIC_URL}</button>`));
        await log(27.5, step(''));
        await log(27.5, step('///////////////////////////////////////////////////////////'));
      }
    },
    {
      ch: 9, act: 'rd-url', label: '公開 URL を開く', hint: 'ログの最後に表示された公開 URL を押して、開いてみます。',
      about: [['公開 URL', 'インターネット上の、このサーバーの住所です。localhost と違い、ほかの PC やスマホからも開けます。']],
      explain: 'Cannot GET / は故障ではありません。/ には窓口を作っていないためです。作った窓口は /api/hello です。',
      run: async (s, f) => {
        const b = s.br;
        b.tabs.push({ title: PUBLIC_HOST, url: PUBLIC_URL, page: 'loading' });
        b.active = b.tabs.length - 1;
        f.render();
        await f.wait(900);
        const tab = b.tabs[b.active];
        tab.page = 'cannot';
        f.paint('lab-br-content');
      }
    },
    {
      ch: 9, act: 'br-address', label: 'クリックで /api/hello を追加', hint: 'URL の末尾に /api/hello を付けて、Enter を押します。',
      about: [['/api/hello', 'server.js の app.get で作った窓口（エンドポイント）です。URL の末尾に付けると、その窓口にお願いが届きます。']],
      explain: '公開先のサーバーから JSON が返りました。この URL なら、別の端末からも同じ結果を受け取れます。',
      run: (s, f) => navigate(s, f, '/api/hello', { url: `${PUBLIC_URL}/api/hello`, page: 'json', title: `${PUBLIC_HOST}/api/hello`, wait: 800 }, PUBLIC_HOST)
    }
  ];

  const chapterStart = chapters.map((_, n) => steps.findIndex((step) => step.ch === n + 1));

  /* ---------- 進行 ---------- */
  async function runStep() {
    if (busy || index >= steps.length) return;
    const step = steps[index];
    const id = ++token;
    busy = true;
    guide.hidden = true;
    stage.querySelectorAll('.guided').forEach((el) => el.classList.remove('guided'));
    dialog.setAttribute('aria-busy', 'true');
    try {
      await step.run(st, makeFx(id, reduced.matches));
    } catch (error) {
      if (error === ABORT) return;
      throw error;
    }
    if (id !== token) return;
    busy = false;
    dialog.removeAttribute('aria-busy');
    keyToast.hidden = true;
    $('lab-explanation').textContent = step.explain || '';
    index += 1;
    render(true);
    if (index === steps.length) $('reset-lab').focus();
  }

  async function goTo(target) {
    token += 1;
    busy = false;
    dialog.removeAttribute('aria-busy');
    keyToast.hidden = true;
    const next = fresh();
    const instant = makeFx(token, true);
    for (let i = 0; i < target; i += 1) await steps[i].run(next, instant);
    st = next;
    index = target;
    lastApp = '';
    $('lab-explanation').textContent = '';
    render();
  }

  $('lab-chapters').innerHTML = chapters.map((name, n) => `<li><button type="button" data-chapter="${n}"><b>${n + 1}</b><span>${name}</span></button></li>`).join('');
  $('lab-chapters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-chapter]');
    if (button) goTo(chapterStart[Number(button.dataset.chapter)]);
  });

  stage.addEventListener('click', (event) => {
    if (busy || index >= steps.length) return;
    const hit = event.target.closest('[data-act]');
    if (hit && hit.dataset.act === steps[index].act) {
      runStep();
      return;
    }
    if (guide.hidden) return;
    guide.classList.remove('is-nudge');
    void guide.offsetWidth;
    guide.classList.add('is-nudge');
  });

  document.querySelectorAll('[data-open-lab]').forEach((button) => button.addEventListener('click', async () => {
    opener = button;
    await goTo(0);
    dialog.showModal();
    document.body.classList.add('lab-open');
    render();
    $('close-lab').focus();
  }));
  // 閉じたときの後始末。close イベントは画面の描画に合わせて遅れて届くことがあるため、
  // 閉じるボタンと Escape（cancel）の時点でも先に片付ける
  const tidy = () => {
    token += 1;
    busy = false;
    dialog.removeAttribute('aria-busy');
    keyToast.hidden = true;
    document.body.classList.remove('lab-open');
  };
  $('close-lab').addEventListener('click', () => {
    dialog.close();
    tidy();
    opener?.focus();
  });
  dialog.addEventListener('cancel', tidy);
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // 開き直したあとに遅れて届いた分は無視する
    tidy();
    opener?.focus();
  });
  $('reset-lab').addEventListener('click', async () => {
    await goTo(0);
    dialog.querySelector('.lab-content').scrollTop = 0;
    dialog.scrollTop = 0;
  });
  window.addEventListener('resize', () => { if (dialog.open) mark(); });
  // スクロールバーの出入りなどで画面の幅だけが変わったときも、案内ラベルを対象に合わせ直す
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      const target = stage.querySelector('.guided');
      if (dialog.open && target && !guide.hidden) placeGuide(target);
    }).observe(wrap);
  }

  const top = $('toTop');
  const update = () => top.classList.toggle('is-visible', window.scrollY > 360);
  window.addEventListener('scroll', update, { passive: true });
  update();
  top.addEventListener('click', () => window.scrollTo({
    top: 0,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  }));

  // 公開先の比較表: 狭い画面で横スクロールできることを ScrollHint のアイコンで知らせる。
  // 読み込めなかった場合も、表そのものは横スクロールできる。
  const startScrollHint = () => {
    if (!window.ScrollHint) return;
    new window.ScrollHint('.deploy-table-wrap', { i18n: { scrollable: '横にスクロールできます' } });
  };
  if (window.ScrollHint) startScrollHint();
  else document.querySelector('script[data-scroll-hint]')?.addEventListener('load', startScrollHint);
})();
