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

  const dataJson = '{\n  "message": "こんにちは、API！"\n}';
  const serverCode = `const express = require('express');
const data = require('./data.json');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', (req, res) => {
  res.json(data);
});

app.listen(port, '0.0.0.0', () => {
  console.log('http://localhost:' + port + '/api/hello');
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

  const chapters = [
    'Node.jsを入れる',
    'フォルダーを開く',
    'ファイルを作る',
    'npmで準備する',
    'npmコマンド',
    'サーバーを起動',
    '動作を確認',
    '公開する'
  ];
  const chapterTitles = [
    'Node.jsをダウンロードして、インストールする',
    'VS Codeに作業フォルダーを紐づける',
    'VS Codeでファイルを作る',
    'ターミナルで npm init と Express のインストール',
    'そのほかの npm コマンドを試す',
    'ターミナルで API サーバーを起動する',
    'API が動くことを確認する',
    'GitHubへ保存して、Render で公開する'
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
      files: [], tabs: [], active: '', dirty: {}, text: {},
      newFile: null, typing: '', flash: [], mark: '', term: null, git: false
    },
    rd: { page: 'dashboard', menu: false, build: null, start: null, plan: '', status: '', logs: [], live: false }
  });

  let st = fresh();
  let index = 0;
  let busy = false;
  let token = 0;
  let lastApp = '';
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
    repo: '<path d="M6 3h12a1 1 0 0 1 1 1v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1Z"/><path d="M5 18a2 2 0 0 1 2-2h12M9 7h6"/>'
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
  const favicon = (page) => page === 'node' ? '<i class="lab-fav lab-fav--node" aria-hidden="true">⬡</i>'
    : page === 'render' ? '<i class="lab-fav lab-fav--render" aria-hidden="true">R</i>'
    : `<i class="lab-fav" aria-hidden="true">${ic('globe')}</i>`;

  function tabsHtml(s) {
    const b = s.br;
    return b.tabs.map((t, i) => `<span class="lab-br-tab${i === b.active ? ' is-active' : ''}">${favicon(t.page)}<span>${esc(t.title)}</span><i aria-hidden="true">×</i></span>`).join('')
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

  function renderPage(s) {
    const r = s.rd;
    const top = `<div class="lab-rd__top"><b class="lab-rd__logo">Render</b><span class="lab-rd__ws">My Workspace</span><span class="lab-rd__sp"></span>${r.page === 'dashboard'
      ? '<button type="button" class="lab-rd__new" data-act="rd-new">+ New</button>'
      : '<span class="lab-rd__new is-static">+ New</span>'}<span class="lab-rd__me" aria-hidden="true">Y</span></div>`;
    if (r.page === 'dashboard') {
      const types = ['Static Site', 'Web Service', 'Private Service', 'Background Worker', 'Cron Job', 'Postgres', 'Key Value'];
      const menu = r.menu ? `<div class="lab-rd__menu" role="menu">${types.map((t) => t === 'Web Service'
        ? `<button type="button" role="menuitem" data-act="rd-webservice">${t}</button>`
        : `<span role="menuitem">${t}</span>`).join('')}</div>` : '';
      return `<div class="lab-rd">${top}${menu}<div class="lab-rd__body"><h4>Overview</h4><div class="lab-rd__skeleton" aria-hidden="true"><i></i><i></i><i></i></div></div></div>`;
    }
    if (r.page === 'connect') {
      return `<div class="lab-rd">${top}<div class="lab-rd__body"><h4>New Web Service</h4><p class="lab-rd__label">Source Code</p>
        <div class="lab-rd__tabs"><span class="is-active">Git Provider</span><span>Public Git Repository</span><span>Existing Image</span></div>
        <div class="lab-rd__repos"><button type="button" class="lab-rd__repo" data-act="rd-repo">${ic('repo')}<span>you / <b>sample-api</b></span><small>1m ago</small></button>
        <span class="lab-rd__repo is-dim">${ic('repo')}<span>you / <b>my-website</b></span><small>12d ago</small></span></div></div></div>`;
    }
    if (r.page === 'form') {
      const field = (label, value) => `<div class="lab-rd__field"><span>${label}</span><div class="lab-rd__input">${value}</div></div>`;
      const cmd = (label, act, value, note) => `<div class="lab-rd__field"><span>${label}</span><button type="button" class="lab-rd__input lab-rd__input--cmd" data-act="${act}"><i>$</i>${value === null ? '' : `${esc(value)}${value !== (act === 'rd-build' ? 'npm install' : 'npm start') ? '<i class="lab-caret"></i>' : ''}`}</button><small>${note}</small></div>`;
      return `<div class="lab-rd">${top}<div class="lab-rd__body lab-rd__body--form"><h4>New Web Service</h4>
        <div class="lab-rd__src">${ic('repo')}<span>you / <b>sample-api</b></span></div>
        ${field('Name', 'sample-api')}${field('Language', 'Node ▾')}${field('Branch', 'main ▾')}${field('Region', 'Oregon (US West) ▾')}
        ${cmd('Build Command', 'rd-build', r.build, '公開先で最初に実行される準備のコマンド')}
        ${cmd('Start Command', 'rd-start', r.start, 'サーバーを起動するコマンド')}
        <div class="lab-rd__field"><span>Instance Type</span><div class="lab-rd__plans"><button type="button" class="lab-rd__plan${r.plan === 'free' ? ' is-selected' : ''}" data-act="rd-free"><b>Free</b><small>$0 / month</small></button><span class="lab-rd__plan is-dim"><b>Starter</b><small>有料</small></span><span class="lab-rd__plan is-dim"><b>Standard</b><small>有料</small></span></div></div>
        <button type="button" class="lab-rd__create" data-act="rd-create">Create Web Service</button></div></div>`;
    }
    const label = { building: 'Building', deploying: 'Deploying', live: 'Live' }[r.status] || '';
    return `<div class="lab-rd">${top}<div class="lab-rd__body lab-rd__body--deploy">
      <div class="lab-rd__svc"><div><small>WEB SERVICE</small><h4>sample-api <span class="lab-rd__pill">Node</span><span class="lab-rd__pill">Free</span></h4>
      <p>${ic('repo')}you / sample-api ・ main</p>${r.live
        ? `<button type="button" class="lab-rd__url" data-act="rd-url">${PUBLIC_URL} ↗</button>`
        : `<span class="lab-rd__url is-pending">${PUBLIC_URL}</span>`}</div>
      <span class="lab-rd__status is-${r.status}">${label}</span></div>
      <div class="lab-rd__logs" id="lab-rd-logs">${r.logs.map((l) => `<div${l.startsWith('==>') ? ' class="is-step"' : ''}>${esc(l)}</div>`).join('')}</div></div></div>`;
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
  function insBody(s) {
    const i = s.ins;
    const head = (title, sub) => `<div class="lab-ins-head"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div><span class="lab-ins-logo" aria-hidden="true">⬡</span></div>`;
    const big = (title, text) => `<div class="lab-ins-big"><div class="lab-ins-side" aria-hidden="true"><span>⬡</span><b>node</b></div><div class="lab-ins-main"><h4>${title}</h4><p>${text}</p></div></div>`;
    const btn = (label, act, enabled = true) => `<button type="button" class="lab-ins-btn${act && enabled ? ' is-primary' : ''}"${act && enabled ? ` data-act="${act}"` : ' tabindex="-1"'}${enabled ? '' : ' disabled'}>${label}</button>`;
    const foot = (next) => `<div class="lab-ins-foot">${btn('Back', '', i.page !== 'welcome' && i.page !== 'done' && i.page !== 'progress')}${next}${btn('Cancel', '', i.page !== 'done')}</div>`;
    if (i.page === 'welcome') {
      return big('Welcome to the Node.js Setup Wizard', 'The Setup Wizard will install Node.js on your computer. Click Next to continue or Cancel to exit the Setup Wizard.') + foot(btn('Next', 'ins-next'));
    }
    if (i.page === 'license') {
      return `${head('End-User License Agreement', 'Please read the following license agreement carefully')}<div class="lab-ins-content"><div class="lab-ins-license">Node.js is licensed for use as follows:<br /><br />Copyright Node.js contributors. All rights reserved.<br /><br />Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction…</div>
        <button type="button" class="lab-ins-check${i.accepted ? ' is-on' : ''}" data-act="ins-accept" role="checkbox" aria-checked="${i.accepted}"><i aria-hidden="true">${i.accepted ? '✓' : ''}</i>I accept the terms in the License Agreement</button></div>${foot(btn('Next', 'ins-next', i.accepted))}`;
    }
    if (i.page === 'dest') {
      return `${head('Destination Folder', 'Choose a custom location or click Next to install.')}<div class="lab-ins-content"><p>Install Node.js to:</p><div class="lab-ins-path">C:\\Program Files\\nodejs\\</div><span class="lab-ins-btn lab-ins-btn--small">Change...</span></div>${foot(btn('Next', 'ins-next'))}`;
    }
    if (i.page === 'custom') {
      const feats = ['Node.js runtime', 'corepack manager', 'npm package manager', 'Online documentation shortcuts', 'Add to PATH'];
      return `${head('Custom Setup', 'Select the way you want features to be installed.')}<div class="lab-ins-content"><p>Click the icons in the tree below to change the way features will be installed.</p><ul class="lab-ins-tree">${feats.map((f) => `<li><i aria-hidden="true">▣</i>${f}</li>`).join('')}</ul></div>${foot(btn('Next', 'ins-next'))}`;
    }
    if (i.page === 'tools') {
      return `${head('Tools for Native Modules', 'Optionally install the tools necessary to compile native modules.')}<div class="lab-ins-content"><p>Some npm modules need to be compiled from C/C++ when installing. If you want to be able to install such modules, some tools (Python and Visual Studio Build Tools) need to be installed.</p><span class="lab-ins-check is-static"><i aria-hidden="true"></i>Automatically install the necessary tools.</span></div>${foot(btn('Next', 'ins-next'))}`;
    }
    if (i.page === 'ready') {
      return `${head('Ready to install Node.js', '')}<div class="lab-ins-content"><p>Click Install to begin the installation. Click Back to review or change any of your installation settings. Click Cancel to exit the wizard.</p></div>${foot(btn(`${ic('shield')}Install`, 'ins-install'))}`;
    }
    if (i.page === 'progress') {
      return `${head('Installing Node.js', '')}<div class="lab-ins-content"><p>Please wait while the Setup Wizard installs Node.js.</p><p class="lab-ins-statusline">Status: <span>${esc(i.status)}</span></p><div class="lab-ins-bar"><i style="width:${i.pct}%"></i></div></div>${foot(btn('Next', '', false))}`;
    }
    return big('Completed the Node.js Setup Wizard', 'Click the Finish button to exit the Setup Wizard.') + foot(btn('Finish', 'ins-finish'));
  }

  function installerWin(s) {
    const uac = s.ins.uac ? `<div class="lab-modal lab-modal--uac"><div class="lab-uac" role="alertdialog" aria-label="ユーザー アカウント制御"><p class="lab-uac__bar">ユーザー アカウント制御</p><h4>このアプリがデバイスに変更を加えることを許可しますか?</h4>
      <div class="lab-uac__app"><span aria-hidden="true">⬡</span><div><b>Node.js</b><small>確認済みの発行元: OpenJS Foundation</small><small>ファイルの入手先: このコンピューター上のハード ドライブ</small></div></div>
      <div class="lab-uac__btns"><button type="button" data-act="uac-yes">はい</button><span>いいえ</span></div></div></div>` : '';
    return `<div class="lab-window lab-installer"><div class="lab-ins-title"><span aria-hidden="true">⬡</span><b>Node.js Setup</b>${caption}</div><div id="lab-ins-body" class="lab-ins-body">${insBody(s)}</div></div>${uac}`;
  }

  /* ---------- VS Code ---------- */
  function menuHtml(s) {
    const items = ['ファイル', '編集', '選択', '表示', '移動', '実行', 'ターミナル', 'ヘルプ'];
    const drop = s.vs.menu === 'terminal' ? `<div class="vscode-sim__drop" role="menu"><button type="button" role="menuitem" data-act="vs-new-terminal"><span>新しいターミナル</span><kbd>Ctrl+Shift+\`</kbd></button><span role="menuitem"><span>ターミナルの分割</span><kbd>Ctrl+Shift+5</kbd></span><span role="menuitem"><span>新しいターミナル ウィンドウ</span><kbd>Ctrl+Shift+Alt+\`</kbd></span><hr /><span role="menuitem"><span>タスクの実行...</span></span></div>` : '';
    return items.map((label) => label === 'ターミナル'
      ? `<span class="vscode-sim__menuwrap"><button type="button" class="vscode-sim__menuitem${s.vs.menu === 'terminal' ? ' is-open' : ''}" data-act="vs-menu-terminal">${label}</button>${drop}</span>`
      : `<span class="vscode-sim__menuitem${label === 'ファイル' ? ' is-keep' : ''}">${label}</span>`).join('');
  }

  function sideHtml(s) {
    const v = s.vs;
    const title = '<p class="vscode-sim__side-title">エクスプローラー<span aria-hidden="true">…</span></p>';
    if (!v.folder) {
      return `${title}<div class="vscode-sim__nofolder"><b>⌄ フォルダーを開いていません</b><p>まだフォルダーを開いていません。</p><button type="button" class="vscode-sim__bluebtn" data-act="vs-open-folder">フォルダーを開く</button></div>`;
    }
    const rows = v.files.map((f) => `<li class="${f.name === v.active ? 'is-selected' : ''}${v.flash.includes(f.name) ? ' is-new' : ''}"><button type="button" data-act="tree-${esc(f.name)}">${fileIcon(f.name, f.kind)}<span>${esc(f.name)}</span></button></li>`).join('');
    const input = v.newFile !== null ? `<li class="is-input"><span>${fileIcon(v.newFile || 'x.json', 'file')}<span class="vscode-sim__nameinput">${esc(v.newFile)}<i class="lab-caret"></i></span></span></li>` : '';
    return `${title}<div class="vscode-sim__tree-head"><b>⌄ SAMPLE-API</b><span class="vscode-sim__tree-actions"><button type="button" data-act="vs-new-file" aria-label="新しいファイル..." title="新しいファイル...">${ic('newfile')}</button><span title="新しいフォルダー...">${ic('newfolder')}</span><span title="最新の情報に更新">${ic('reload')}</span><span title="エクスプローラーのフォルダーを折りたたむ">${ic('collapse')}</span></span></div>
      <ul id="lab-file-tree">${input}${rows}${!rows && !input ? '<li class="is-empty">（まだファイルはありません）</li>' : ''}</ul>
      <p class="vscode-sim__collapsed">› アウトライン</p><p class="vscode-sim__collapsed">› タイムライン</p>`;
  }

  function editorHtml(s) {
    const v = s.vs;
    if (!v.tabs.length) {
      return `<div class="vscode-sim__watermark"><span aria-hidden="true">${ic('code')}</span><dl><div><dt>すべてのコマンドの表示</dt><dd><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd></dd></div><div><dt>ファイルに移動する</dt><dd><kbd>Ctrl</kbd>+<kbd>P</kbd></dd></div><div><dt>ターミナルの切り替え</dt><dd><kbd>Ctrl</kbd>+<kbd>\`</kbd></dd></div></dl></div>`;
    }
    const tabs = v.tabs.map((name) => `<span class="${name === v.active ? 'is-active' : ''}">${fileIcon(name, 'file')}<span>${esc(name)}</span><i class="${v.dirty[name] ? 'is-dirty' : ''}" aria-hidden="true">${v.dirty[name] ? '●' : '×'}</i></span>`).join('');
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
      const p = v.picker;
      const tile = (name, cls = '') => `<span class="lab-picker__tile${cls}"><i class="lab-folder" aria-hidden="true"></i><span>${name}</span></span>`;
      const fresh = p.name !== null ? `<span class="lab-picker__tile is-selected${p.done ? '' : ' is-editing'}"><i class="lab-folder" aria-hidden="true"></i><span>${esc(p.name)}${p.done ? '' : '<i class="lab-caret"></i>'}</span></span>` : '';
      return `<div class="lab-modal"><div class="lab-picker" role="dialog" aria-label="フォルダーを開く">
        <div class="lab-picker__title"><span>フォルダーを開く</span><i aria-hidden="true">✕</i></div>
        <div class="lab-picker__bar"><span class="lab-picker__nav" aria-hidden="true">${ic('back')}${ic('fwd')}</span><span class="lab-picker__addr">PC › デスクトップ</span><span class="lab-picker__search">デスクトップの検索</span></div>
        <div class="lab-picker__tools"><span>整理 ▾</span><button type="button" data-act="pk-new">新しいフォルダー</button></div>
        <div class="lab-picker__body"><nav aria-hidden="true"><span>ホーム</span><span class="is-on">デスクトップ</span><span>ダウンロード</span><span>ドキュメント</span><span>ピクチャ</span></nav>
          <div class="lab-picker__grid">${tile('portfolio')}${tile('写真')}${tile('レポート')}${fresh}</div></div>
        <div class="lab-picker__foot"><label>フォルダー: <span>${p.done ? 'sample-api' : ''}</span></label><button type="button" class="lab-picker__ok"${p.done ? ' data-act="pk-select"' : ' disabled'}>フォルダーの選択</button><span class="lab-picker__cancel">キャンセル</span></div>
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
    const lang = !v.active ? '' : v.active.endsWith('.js') ? 'JavaScript' : v.active === '.gitignore' ? 'Ignore' : 'JSON';
    return `<span>${v.git ? `${ic('branch')}main` : ''}</span><span>⊗ 0　⚠ 0</span><span class="lab-sp"></span>${lang ? `<span>スペース: 2</span><span>UTF-8</span><span>CRLF</span><span>{ } ${lang}</span>` : ''}`;
  }

  function vscodeWin(s) {
    const v = s.vs;
    const acts = ['files', 'search', 'branch', 'bug', 'blocks'];
    return `<div class="lab-window vscode-sim">
      <div class="vscode-sim__titlebar"><span class="vscode-sim__logo" aria-hidden="true">${ic('code')}</span><div id="lab-vs-menu" class="vscode-sim__menu">${menuHtml(s)}</div><span class="vscode-sim__title">${v.folder ? 'sample-api' : 'Visual Studio Code'}</span>${caption}</div>
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
    stage.innerHTML = desktop(st);
    if (opening && !reduced.matches) stage.querySelector('.lab-window')?.classList.add('is-opening');
    settle();
    const ch = done ? chapters.length : step.ch;
    $('lab-chapters').querySelectorAll('button').forEach((button, n) => {
      button.classList.toggle('is-done', done || n + 1 < ch);
      button.classList.toggle('is-current', !done && n + 1 === ch);
      if (!done && n + 1 === ch) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (done) {
      $('lab-progress').textContent = `STEP ${chapters.length} / ${chapters.length} 完了`;
      $('lab-task').textContent = 'ローカルから公開まで、ひととおり体験しました！';
      $('lab-hint').textContent = '上の番号から、練習したいところへ戻れます。実際に作るときは、同じ順番で一つずつ進めましょう。';
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

  const insNext = (page) => async (s, f) => {
    s.ins.page = page;
    f.paint('lab-ins-body');
    await f.wait(160);
  };

  const command = (ch, hint, text, output, explain, after) => ({
    ch, hint, act: 'term', label: `クリックで「${text}」を入力して実行`, explain,
    run: async (s, f) => {
      await runCommand(s, f, text, output);
      if (after) await after(s, f);
    }
  });

  const newFile = (ch, name, hint, explain) => ({
    ch, hint, act: 'vs-new-file', label: `クリックで ${name} を作成`, explain,
    run: (s, f) => createFile(s, f, name)
  });

  const writeCode = (ch, name, text, hint, label, explain) => ({
    ch, hint, act: 'vs-editor', label, explain,
    run: (s, f) => typeCode(s, f, name, text)
  });

  const save = (ch, explain) => ({
    ch, hint: 'Ctrl + S で保存します。保存するまでは、ファイルの中身は変わっていません。', act: 'key-save', label: 'Ctrl + S で保存', explain,
    run: saveFile
  });

  /* ---------- ステップ定義（1要素 = 1クリックぶん） ----------
     ch: 章(1-8) / hint: 押す前の案内 / act: 押す場所(data-act) / label: 赤枠に添える白文字
     run(s, f): 状態 s を変える。f.wait / f.type / f.paint / f.key が変化を再生する。 / explain: 押した後の説明 */
  const steps = [
    /* 1. Node.js */
    {
      ch: 1, act: 'node-download', label: 'ここを押してダウンロード',
      hint: 'Node.js 公式サイトのダウンロードページです。Windows 用インストーラーのボタンを押して、ダウンロードを始めます。',
      explain: `インストーラー（${MSI}）が保存されました。まだインストールはされていません。`,
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
      explain: 'セットアップ ウィザード（インストールの案内役）が起動しました。画面は英語ですが、基本は Next で進めます。',
      run: async (s, f) => {
        s.br.dlOpen = false;
        await switchApp('installer')(s, f);
      }
    },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'Welcome 画面です。Next を押して次へ進みます。', explain: '使用許諾（ライセンス）の確認画面になりました。', run: insNext('license') },
    {
      ch: 1, act: 'ins-accept', label: '同意にチェック', hint: '内容を確認して、「I accept the terms…（同意します）」にチェックを入れます。',
      explain: 'チェックを入れると、Next が押せるようになります。',
      run: async (s, f) => { s.ins.accepted = true; f.paint('lab-ins-body'); await f.wait(120); }
    },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'Next を押して進みます。', explain: 'インストール先の確認です。通常は変更しません。', run: insNext('dest') },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'インストール先（C:\\Program Files\\nodejs\\）はそのままで Next。', explain: '入れる機能の一覧です。npm（パッケージ管理）と PATH の設定も一緒に入ります。', run: insNext('custom') },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: '機能の一覧もそのままで Next。「npm package manager」と「Add to PATH」が含まれていることだけ見ておきましょう。', explain: '追加ツールの画面です。今回の API 作りには必要ありません。', run: insNext('tools') },
    { ch: 1, act: 'ins-next', label: 'Next（次へ）', hint: 'チェックは入れずに Next。', explain: 'インストールの準備ができました。', run: insNext('ready') },
    {
      ch: 1, act: 'ins-install', label: 'Install（インストール）', hint: 'Install を押して、インストールを始めます。',
      explain: 'Windows が「このアプリに変更を許可するか」を確認しています。',
      run: async (s, f) => { s.ins.uac = true; f.render(); await f.wait(200); }
    },
    {
      ch: 1, act: 'uac-yes', label: '発行元を確認して「はい」', hint: '発行元が OpenJS Foundation（Node.js の運営元）であることを確認して、「はい」を押します。',
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
    { ch: 2, act: 'task-vscode', label: 'VS Code を起動', hint: '画面下のタスク バーから、VS Code を起動します。', explain: 'VS Code が開きました。まだフォルダーを開いていないので、左のエクスプローラーは空です。', run: switchApp('vscode') },
    {
      ch: 2, act: 'vs-open-folder', label: 'フォルダーを開く', hint: 'エクスプローラーの「フォルダーを開く」を押します。',
      explain: 'Windows のフォルダー選択画面が開きました。API 用のフォルダーを、デスクトップに新しく作ります。',
      run: async (s, f) => { s.vs.picker = { name: null, done: false }; f.paint('lab-vs-overlay'); await f.wait(200); }
    },
    {
      ch: 2, act: 'pk-new', label: 'クリックで sample-api を作成', hint: '「新しいフォルダー」を押して、sample-api という名前を付けます。',
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
      explain: 'VS Code と sample-api フォルダーがつながりました。ここで作るファイルは、すべてこのフォルダーに保存されます。',
      run: async (s, f) => { s.vs.trust = false; s.vs.folder = true; f.render(); await f.wait(200); }
    },

    /* 3. ファイルを作る */
    newFile(3, 'data.json', 'エクスプローラーの「新しいファイル...」アイコンを押して、data.json を作ります。', 'data.json ができ、右の編集画面で開きました。中身はまだ空です。'),
    writeCode(3, 'data.json', dataJson, '編集画面をクリックして、API が返すデータ（JSON）を書きます。', 'クリックで JSON を入力', 'JSON を書きました。タブの ● は「まだ保存していない」印です。'),
    save(3, 'data.json を保存しました。● が消えています。'),
    newFile(3, 'server.js', '同じように、サーバーのプログラムを書く server.js を作ります。', 'server.js ができました。ここにサーバーのプログラムを書きます。'),
    writeCode(3, 'server.js', serverCode, '編集画面をクリックして、サーバーのコードを書きます。', 'クリックでコードを入力', 'お願い（GET /api/hello）を受け取り、data.json の中身を JSON で返すプログラムです。'),
    save(3, '2つのファイルがそろいました。ただし express はまだ入っていないので、このままでは動きません。'),

    /* 4. npm init と Express */
    {
      ch: 4, act: 'vs-menu-terminal', label: 'ターミナル メニュー', hint: '上のメニューから「ターミナル」を開きます。', explain: 'ターミナルに関するメニューが開きました。',
      run: async (s, f) => { s.vs.menu = 'terminal'; f.paint('lab-vs-menu'); await f.wait(120); }
    },
    {
      ch: 4, act: 'vs-new-terminal', label: '新しいターミナル', hint: '「新しいターミナル」を選びます。',
      explain: '画面の下にターミナルが開きました。場所（PS のあとの文字）は sample-api フォルダーになっています。',
      run: async (s, f) => { s.vs.menu = ''; s.vs.term = { lines: [], input: '', running: false }; f.render(); await f.wait(200); }
    },
    command(4, 'まず、Node.js が使えるかを確認します。ターミナルをクリックすると、コマンドの入力を再現します。', 'node --version', [[NODE_V, 240]],
      `バージョン（${NODE_V}）が表示されれば、Node.js は正しくインストールされています。`),
    command(4, 'npm init -y で、プロジェクトの説明書（package.json）を作ります。', 'npm init -y',
      [[`Wrote to ${HOME}\\package.json:`, 420], ['', 60], ...pkgJson(false).split('\n').map((l) => [l, 26]), ['', 60]],
      'package.json が作られ、エクスプローラーに増えました。server.js があるので、起動用の start も自動で入っています。',
      async (s, f) => {
        const v = s.vs;
        addFile(v, 'package.json');
        v.text['package.json'] = pkgJson(false);
        v.flash = ['package.json'];
        f.paint('lab-vs-side');
        v.flash = [];
      }),
    {
      ch: 4, act: 'term', label: 'クリックで「npm install express」を入力して実行',
      hint: 'npm install express で、API を作りやすくする道具（Express）を追加します。',
      explain: 'Express が node_modules フォルダーに入り、package.json の dependencies に記録されました。',
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
      explain: 'dependencies に express、scripts に start（node server.js）が入っています。npm は、この説明書を見て動きます。',
      run: async (s, f) => { const v = s.vs; openTab(v, 'package.json'); v.mark = '"express"'; f.paint('lab-vs-side', 'lab-vs-editor', 'lab-vs-status'); await f.wait(300); }
    },
    command(5, 'npm list で、入っているパッケージを確認します。', 'npm list', [[`sample-api@1.0.0 ${HOME}`, 260], [`└── express@${EXPRESS_V}`, 80], ['', 40]],
      'npm list は、このプロジェクトに入っているパッケージの確認です。'),
    command(5, 'npm run で、登録されている短縮コマンドの一覧を見ます。', 'npm run',
      [['Lifecycle scripts included in sample-api@1.0.0:', 260], ['  test', 60], ['    echo "Error: no test specified" && exit 1', 40], ['  start', 60], ['    node server.js', 40], ['', 40]],
      'start が登録されています。npm start と打てば node server.js が実行されます。公開先でもこの start を使います。',
      async (s, f) => { s.vs.mark = '"start"'; f.paint('lab-vs-editor'); }),

    /* 6. サーバーを起動 */
    command(6, 'node server.js で、サーバーを起動します。', 'node server.js', [['http://localhost:3000/api/hello', 520, 'is-link']],
      'サーバーが起動しました。ターミナルは次の入力を受け付けず、お願いを待ち続けています。これが正常な状態です。',
      async (s, f) => { s.vs.term.running = true; s.vs.mark = ''; openTab(s.vs, 'server.js'); f.paint('lab-vs-panel', 'lab-vs-editor', 'lab-vs-side', 'lab-vs-status'); }),

    /* 7. 動作確認 */
    { ch: 7, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'サーバーは動かしたまま、タスク バーからブラウザーに切り替えます。', explain: 'ブラウザーに切り替えました。VS Code では、サーバーが動き続けています。', run: switchApp('browser') },
    {
      ch: 7, act: 'br-newtab', label: '新しいタブ', hint: '「+」で新しいタブを開きます。', explain: '新しいタブが開きました。',
      run: async (s, f) => { const b = s.br; b.tabs.push({ title: '新しいタブ', url: '', page: 'blank' }); b.active = b.tabs.length - 1; f.render(); await f.wait(160); }
    },
    {
      ch: 7, act: 'br-address', label: 'クリックで URL を入力', hint: 'アドレス バーに localhost:3000/api/hello と入力して、Enter を押します。',
      explain: 'サーバーから JSON が返ってきました。これが、自分の PC の中で動いている API です。',
      run: (s, f) => navigate(s, f, 'localhost:3000/api/hello', { url: 'localhost:3000/api/hello', page: 'json', title: 'localhost:3000/api/hello' })
    },
    { ch: 7, act: 'task-vscode', label: 'VS Code に戻る', hint: 'VS Code に戻って、サーバーを止めてみます。', explain: 'VS Code に戻りました。ターミナルではサーバーが動いたままです。', run: switchApp('vscode') },
    {
      ch: 7, act: 'key-ctrlc', label: 'Ctrl + C で停止', hint: 'ターミナルで Ctrl + C を押すと、サーバーが止まります。',
      explain: 'サーバーが止まり、ターミナルに入力待ちの行が戻りました。',
      run: async (s, f) => { const t = s.vs.term; await f.key('Ctrl + C'); t.lines.push({ k: 'out', text: '^C' }); t.running = false; f.paint('lab-vs-panel'); await f.wait(200); }
    },
    { ch: 7, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'もう一度ブラウザーに切り替えます。', explain: 'さきほど JSON が表示されたタブです。', run: switchApp('browser') },
    {
      ch: 7, act: 'br-reload', label: '再読み込み', hint: '同じ URL を再読み込みしてみます。',
      explain: 'サーバーを止めると、同じ URL でも応答は返りません。ファイルがあるだけでは API は動かない、ということです。',
      run: async (s, f) => {
        const tab = s.br.tabs[s.br.active];
        tab.page = 'loading';
        f.paint('lab-br-content');
        await f.wait(700);
        tab.page = 'refused';
        f.paint('lab-br-content');
      }
    },

    /* 8. GitHub へ保存して Render で公開 */
    { ch: 8, act: 'task-vscode', label: 'VS Code に戻る', hint: '公開の準備をします。まず VS Code に戻ります。', explain: 'まず、コードを GitHub に保存します。', run: switchApp('vscode') },
    newFile(8, '.gitignore', 'node_modules は GitHub に送らないので、除外リスト（.gitignore）を作ります。', '.gitignore ができました。'),
    writeCode(8, '.gitignore', 'node_modules/', '編集画面をクリックして、除外するフォルダー名を書きます。', 'クリックで node_modules/ を入力', 'node_modules は npm install で作り直せるので、保存の対象から外します。'),
    save(8, '.gitignore を保存しました。'),
    command(8, 'git init で、このフォルダーを Git の管理下に置きます。', 'git init', [['Initialized empty Git repository in C:/Users/you/Desktop/sample-api/.git/', 300]],
      '履歴を記録する準備ができました。左下に、ブランチ名（main）が表示されています。',
      async (s, f) => { s.vs.git = true; f.paint('lab-vs-status'); }),
    command(8, 'git add . で、保存したいファイルを選びます。', 'git add .', [], '.gitignore に書いた node_modules を除いて、ファイルが選ばれました。'),
    command(8, 'git commit で、PC の中に履歴として保存します。', 'git commit -m "初回作成"',
      [['[main (root-commit) 3f2a1c9] 初回作成', 320], [' 5 files changed, 874 insertions(+)', 60], [' create mode 100644 .gitignore', 30], [' create mode 100644 data.json', 30], [' create mode 100644 package-lock.json', 30], [' create mode 100644 package.json', 30], [' create mode 100644 server.js', 30]],
      'PC の中に「初回作成」という履歴ができました。'),
    command(8, 'gh repo create で、GitHub に保管場所を作ってコードを送ります。質問には「既存のローカルリポジトリを push」「Private」「Yes」を選びます。', 'gh repo create',
      [['? What would you like to do? Push an existing local repository to GitHub', 420], ['? Path to local repository .', 220], ['? Repository name sample-api', 220], ['? Visibility Private', 220], ['✓ Created repository you/sample-api on GitHub', 520, 'is-ok'], ['  https://github.com/you/sample-api', 60], ['? Add a remote? Yes', 220], ['✓ Added remote https://github.com/you/sample-api.git', 260, 'is-ok'], ['? Would you like to push commits from the current branch to "origin"? Yes', 260], ['✓ Pushed commits to https://github.com/you/sample-api.git', 520, 'is-ok']],
      'GitHub に sample-api リポジトリができ、コードが送られました。（実際には、先に gh auth login でのログインが必要です）'),
    { ch: 8, act: 'task-browser', label: 'ブラウザーに切り替え', hint: 'ここからは公開先（Render）の画面です。ブラウザーに切り替えます。', explain: '新しいタブで Render を開きます。', run: switchApp('browser') },
    {
      ch: 8, act: 'br-newtab', label: '新しいタブ', hint: '「+」で新しいタブを開きます。', explain: '新しいタブが開きました。',
      run: async (s, f) => { const b = s.br; b.tabs.push({ title: '新しいタブ', url: '', page: 'blank' }); b.active = b.tabs.length - 1; f.render(); await f.wait(160); }
    },
    {
      ch: 8, act: 'br-address', label: 'クリックで URL を入力', hint: 'アドレス バーに dashboard.render.com と入力して、Enter を押します。',
      explain: 'Render のダッシュボードです。この練習では、アカウント作成と GitHub との連携が済んだ状態から始めます。',
      run: (s, f) => navigate(s, f, 'dashboard.render.com', { url: 'https://dashboard.render.com', page: 'render', title: 'Render Dashboard' })
    },
    {
      ch: 8, act: 'rd-new', label: '+ New', hint: '右上の「+ New」を押して、作るものの種類を選びます。', explain: '作れるサービスの種類が並びました。',
      run: async (s, f) => { s.rd.menu = true; f.paint('lab-br-content'); await f.wait(120); }
    },
    {
      ch: 8, act: 'rd-webservice', label: 'Web Service', hint: '「Web Service」を選びます。', explain: 'Web Service は、Node.js のようなサーバーを動かし続けるための種類です。',
      run: async (s, f) => { s.rd.menu = false; s.rd.page = 'connect'; f.paint('lab-br-content'); await f.wait(160); }
    },
    {
      ch: 8, act: 'rd-repo', label: 'sample-api を選ぶ', hint: 'Git Provider の一覧から、さきほど送った sample-api を選びます。', explain: 'GitHub の sample-api とつながりました。設定フォームが開いています。',
      run: async (s, f) => { s.rd.page = 'form'; f.paint('lab-br-content'); await f.wait(160); }
    },
    {
      ch: 8, act: 'rd-build', label: 'クリックで npm install を入力', hint: 'Build Command に npm install を入れます。', explain: 'Build Command は、公開先で最初に実行される準備のコマンドです。Express などがここで入ります。',
      run: async (s, f) => { const r = s.rd; r.build = ''; f.paint('lab-br-content'); await f.type((x) => { r.build = x; }, 'npm install', 50, 1, ['lab-br-content']); }
    },
    {
      ch: 8, act: 'rd-start', label: 'クリックで npm start を入力', hint: 'Start Command に npm start を入れます。', explain: 'Start Command は、サーバーを起動するコマンドです。package.json の start（node server.js）が使われます。',
      run: async (s, f) => { const r = s.rd; r.start = ''; f.paint('lab-br-content'); await f.type((x) => { r.start = x; }, 'npm start', 50, 1, ['lab-br-content']); }
    },
    {
      ch: 8, act: 'rd-free', label: 'Free を選ぶ', hint: 'Instance Type は Free（無料）を選びます。', explain: '無料の Web Service は、15分アクセスがないと停止し、次のアクセスでは起動待ちが発生します。',
      run: async (s, f) => { s.rd.plan = 'free'; f.paint('lab-br-content'); await f.wait(120); }
    },
    {
      ch: 8, act: 'rd-create', label: 'Create Web Service', hint: '設定を確認して、「Create Web Service」を押します。',
      explain: 'Render が GitHub からコードを取得し、npm install と npm start を実行しました。ポートは Render が渡す PORT（10000）が使われています。',
      run: async (s, f) => {
        const r = s.rd;
        r.page = 'deploy';
        r.status = 'building';
        r.logs = [];
        f.paint('lab-br-content');
        const log = async (text, delay = 220) => { await f.wait(delay); r.logs.push(text); f.paint('lab-br-content'); };
        await log('==> Cloning from https://github.com/you/sample-api', 400);
        await log('==> Checking out commit 3f2a1c9 in branch main', 380);
        await log("==> Running build command 'npm install'...", 420);
        await log('added 65 packages, and audited 66 packages in 2s', 900);
        await log('found 0 vulnerabilities', 160);
        await log('==> Uploading build...', 420);
        await log('==> Build successful 🎉', 620);
        r.status = 'deploying';
        await log('==> Deploying...', 300);
        await log("==> Running 'npm start'", 700);
        await log('> sample-api@1.0.0 start', 240);
        await log('> node server.js', 120);
        await log('http://localhost:10000/api/hello', 520);
        await log('==> Your service is live 🎉', 700);
        r.status = 'live';
        r.live = true;
        await log(`==> Available at your primary URL ${PUBLIC_URL}`, 200);
      }
    },
    {
      ch: 8, act: 'rd-url', label: '公開 URL を開く', hint: '表示された公開 URL を押して、開いてみます。',
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
      ch: 8, act: 'br-address', label: 'クリックで /api/hello を追加', hint: 'URL の末尾に /api/hello を付けて、Enter を押します。',
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
  $('close-lab').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    token += 1;
    busy = false;
    keyToast.hidden = true;
    document.body.classList.remove('lab-open');
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
})();
