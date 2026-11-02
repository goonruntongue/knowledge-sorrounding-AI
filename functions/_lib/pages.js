// ログイン機能が返す画面（入口、ログイン、ブロック、管理画面）の HTML
import { esc } from './auth.js';

const BASE_STYLE = `
:root{--ink:#554b67;--muted:#7a7090;--accent:#625b91;--accent-2:#6da990;--line:#e6d8eb;--card:#ffffffd9;--bg:radial-gradient(circle at 90% 5%,#f7d7e8 0 180px,transparent 181px),linear-gradient(135deg,#fff9ed,#effaff 55%,#f7f0ff);--danger:#c24a4a}
@media (prefers-color-scheme:dark){:root{--ink:#ece8f6;--muted:#b6aecb;--accent:#a99ff0;--accent-2:#86d3b2;--line:#3a3760;--card:#1b1d3ad9;--bg:radial-gradient(circle at 90% 5%,#35285f 0 180px,transparent 181px),linear-gradient(135deg,#0c1128,#0f1b36 55%,#1a1433);--danger:#ff8a8a}}
*{box-sizing:border-box}
body{min-height:100vh;margin:0;color:var(--ink);background:var(--bg);font-family:"Noto Sans JP",sans-serif;line-height:1.8}
a{color:var(--accent)}
.gate{position:relative;display:grid;place-items:center;min-height:100vh;padding:24px 16px;overflow:hidden}
/* 地球の画像は、ポータル（index.html の .hero-orb）と同じ大きさ・位置にする */
.gate__frame{position:absolute;top:0;left:50%;z-index:0;width:min(90%,960px);height:0;transform:translateX(-50%);pointer-events:none}
.gate__orb{position:absolute;top:-1.5rem;right:-9rem;width:min(54vw,510px);height:auto;scale:2;opacity:.78;pointer-events:none;filter:saturate(1.8) brightness(1) blur(.2px) drop-shadow(0 12px 24px rgba(72,120,190,.2))}
@media (max-width:640px){.gate__orb{top:-2.5rem;right:-5.5rem;width:340px;opacity:.408}}
.gate__card{position:relative;z-index:1;width:min(100%,460px);padding:36px 28px;border:1px solid var(--line);border-radius:24px;background:var(--card);backdrop-filter:blur(10px);box-shadow:0 20px 50px #4a3f6a1f;text-align:center}
.gate__eyebrow{margin:0;color:var(--accent-2);font:700 .78rem/1.4 Poppins,sans-serif;letter-spacing:.12em}
.gate h1{margin:.4rem 0 .6rem;font:800 clamp(1.6rem,6vw,2.1rem)/1.3 Poppins,"Noto Sans JP",sans-serif;letter-spacing:-.02em}
.gate p{margin:0 0 1.2rem;color:var(--muted);font-size:.95rem}
.gate__actions{display:grid;gap:12px;margin-top:8px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:.7rem 1.2rem;border:1px solid var(--line);border-radius:999px;background:#fff;color:#3d3654;font:700 1rem/1.3 "Noto Sans JP",sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 3px 0 #d9cfe6;transition:transform .15s ease,box-shadow .15s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 5px 0 #d9cfe6}
.btn:active{transform:translateY(2px);box-shadow:0 1px 0 #d9cfe6}
.btn:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.btn--primary{border-color:transparent;background:linear-gradient(135deg,#7f83c5,#625b91);color:#fff;box-shadow:0 3px 0 #48416f}
.btn--primary:hover{box-shadow:0 5px 0 #48416f}
.btn--primary:active{box-shadow:0 1px 0 #48416f}
.g-mark{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#fff;color:#4285f4;font:800 15px/1 Poppins,sans-serif;box-shadow:0 0 0 1px #e1e1e1}
.note{margin-top:1.2rem!important;font-size:.8rem!important}
.remember{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;color:var(--ink);font-size:.92rem;font-weight:700;cursor:pointer}
.remember input{width:18px;height:18px;margin:0;accent-color:#625b91;cursor:pointer}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}
`;

function shell(title, body, extraStyle = '') {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#071a43"><title>${esc(title)} | Knowledge Surrounding AI</title><link rel="icon" href="/pwa-icon-web-knowledge-navy-512.png" type="image/png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'"><style>${BASE_STYLE}${extraStyle}</style></head><body>${body}</body></html>`;
}

function html(markup, status = 200, headers = {}) {
  return new Response(markup, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

const ORB = '<div class="gate__frame" aria-hidden="true"><picture><source srcset="/Sphere_rotating.webp" type="image/webp"><img class="gate__orb" src="/Sphere_rotating.gif" width="800" height="450" alt=""></picture></div>';

function gate(eyebrow, title, text, actions, note = '') {
  return `<main class="gate">${ORB}<div class="gate__card"><p class="gate__eyebrow">${eyebrow}</p><h1>${title}</h1><p>${text}</p><div class="gate__actions">${actions}</div>${note ? `<p class="note">${note}</p>` : ''}</div></main>`;
}

const googleButton = (href, label, primary = true) => `<a class="btn${primary ? ' btn--primary' : ''}" href="${esc(href)}" data-login><span class="g-mark" aria-hidden="true">G</span>${label}</a>`;

// 「ログインしたままにする」。チェックを入れてログインすると、次からは入口の画面を飛ばす
const REMEMBER_BOX = '<label class="remember"><input type="checkbox" id="remember"> ログインしたままにする</label>';
const REMEMBER_SCRIPT = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a[data-login]');var c=document.getElementById('remember');if(!a||!c||!c.checked)return;e.preventDefault();location.href=a.href+(a.href.indexOf('?')>-1?'&':'?')+'remember=1'});</script>`;

// 起動ごとに入口を通ったかの記録。sessionStorage はアプリやタブを閉じると消える
export const GATE_KEY = 'ksa-gate';

// 各ページの <head> の先頭に入れる。この起動でまだ入口を通っていなければ、入口の画面へ送る
export const GATE_SCRIPT = `<meta name="color-scheme" content="light dark"><script>try{if(!sessionStorage.getItem('${GATE_KEY}')){location.replace('/auth/start?next='+encodeURIComponent(location.pathname+location.search+location.hash))}}catch(e){}</script>`;

// 入口を通った記録を残してから、行き先へ進むボタン
const passButton = (next, label, primary = true) => `<button type="button" class="btn${primary ? ' btn--primary' : ''}" data-pass="${esc(next)}">${label}</button>`;
const PASS_SCRIPT = `<script>document.addEventListener('click',function(e){var b=e.target.closest('[data-pass]');if(!b)return;try{sessionStorage.setItem('${GATE_KEY}','1')}catch(x){}location.replace(b.getAttribute('data-pass'))});</script>`;

// 入口を通った記録を残して、行き先へ移るだけのページ（ログイン直後・ログアウト直後に使う）
export function passThrough(next, { clear = false } = {}, headers = []) {
  const action = clear ? `sessionStorage.removeItem('${GATE_KEY}')` : `sessionStorage.setItem('${GATE_KEY}','1')`;
  const response = html(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>移動しています</title><script>try{${action}}catch(e){}location.replace(${JSON.stringify(next)})</script></head><body><p><a href="${esc(next)}">移動しています…</a></p></body></html>`);
  headers.forEach((value) => response.headers.append('Set-Cookie', value));
  return response;
}

// ログインがオフのときの入口
export function landingPage(next) {
  const label = next === '/' ? 'ポータルへ' : 'このページへ進む';
  return html(shell('ようこそ', gate(
    'KNOWLEDGE SURROUNDING AI',
    'Web技術の<br>周辺知識',
    'AIと一緒にWebをつくるための、まわりの知識を学ぶポータルです。',
    `${passButton(next, label)}<a class="btn" href="/auth/login?admin=1" data-login>管理者ログイン</a>${REMEMBER_BOX}`
  ) + PASS_SCRIPT + REMEMBER_SCRIPT));
}

// ログインがオンのときの入口
export function loginPage(next) {
  return html(shell('ログイン', gate(
    'KNOWLEDGE SURROUNDING AI',
    'ログインして<br>ポータルへ',
    'このポータルを見るには、Googleアカウントでのログインが必要です。',
    googleButton(`/auth/login?next=${encodeURIComponent(next)}`, 'Googleでログイン') + REMEMBER_BOX,
    'ログインすると、メールアドレスと名前が管理者に記録されます。「ログインしたままにする」に✓を入れると、次からはこの画面を飛ばして開きます（30日間）。'
  ) + REMEMBER_SCRIPT), 401);
}

// 鍵のかかったページを開こうとしたとき
export function lockedPage(path, session) {
  const chains = '<img class="locked-art" src="/assets/lock-padlock.webp" width="720" height="258" alt="">';
  const actions = session
    ? `${passButton('/', 'ポータルへ')}<a class="btn" href="/auth/logout?next=${encodeURIComponent(path)}">別のアカウントでログイン</a>`
    : `${googleButton(`/auth/login?next=${encodeURIComponent(path)}`, '許可されたアカウントでログイン')}${passButton('/', 'ポータルへ', false)}${REMEMBER_BOX}`;
  const note = session
    ? `${esc(session.email)} には、このページの許可がありません。管理者に知らせてください。`
    : '管理者が許可したアカウントだけが開けます。';
  return html(shell('鍵がかかっています', gate(
    'LOCKED',
    `${chains}このページには<br>鍵がかかっています`,
    'このガイドは、いまは開けません。',
    actions,
    note
  ) + PASS_SCRIPT + REMEMBER_SCRIPT, '.locked-art{display:block;width:min(100%,260px);height:auto;margin:-8px auto 6px;filter:drop-shadow(0 8px 12px rgba(20,16,40,.3))}'), 403);
}

export function blockedPage(clearCookie) {
  return html(shell('利用できません', gate(
    'ACCESS BLOCKED',
    'このアカウントは<br>利用できません',
    '管理者により、このアカウントでの利用が止められています。',
    '<a class="btn" href="/auth/logout">別のアカウントでログインする</a>'
  )), 403, clearCookie ? { 'Set-Cookie': clearCookie } : {});
}

export function notAdminPage() {
  return html(shell('管理者ではありません', gate(
    'ADMIN ONLY',
    '管理者ではありません',
    'このアカウントには管理画面を開く権限がありません。',
    `${passButton('/', 'ポータルへ')}<a class="btn" href="/auth/logout?next=/auth/login%3Fadmin%3D1">別のアカウントでログインする</a>` + PASS_SCRIPT
  )), 403);
}

export function messagePage(title, text, status = 400) {
  return html(shell(title, gate('KNOWLEDGE SURROUNDING AI', esc(title), esc(text), '<a class="btn btn--primary" href="/">最初の画面へ</a>')), status);
}

export function notConfiguredPage() {
  return messagePage('ログインの準備ができていません', 'Googleログインの設定がまだ終わっていません。管理者に知らせてください。', 503);
}

// ポータルの上に出す管理者用の帯（HTMLRewriter で body の先頭に差し込む）
export const ADMIN_BAR = `<div style="position:sticky;top:0;z-index:1000;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;padding:8px 12px;background:#2f2a4a;color:#fff;font:700 14px/1.5 'Noto Sans JP',sans-serif"><span style="opacity:.8">管理者としてログイン中</span><a href="/admin/" style="padding:4px 14px;border-radius:999px;background:#fff;color:#2f2a4a;text-decoration:none">管理画面へ</a><a href="/auth/logout" style="color:#d9d3f2">ログアウト</a></div>`;

const ADMIN_STYLE = `
.admin{width:min(1000px,calc(100% - 32px));margin:0 auto;padding:28px 0 60px}
.admin__head{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:20px}
.admin__head h1{margin:0 auto 0 0;font:800 1.6rem/1.3 Poppins,"Noto Sans JP",sans-serif}
.admin__me{color:var(--muted);font-size:.85rem}
.panel{margin-bottom:20px;padding:22px 24px;border:1px solid var(--line);border-radius:20px;background:var(--card);backdrop-filter:blur(10px)}
.panel h2{margin:0 0 .4rem;font-size:1.1rem}
.panel p{margin:0;color:var(--muted);font-size:.9rem}
.toggle{display:flex;align-items:center;gap:14px;margin-top:14px;font-weight:700}
.switch{position:relative;width:58px;height:32px;flex:none;border:0;border-radius:999px;background:#c9c2d8;cursor:pointer;transition:background .2s}
.switch::after{position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0003;content:"";transition:transform .2s}
.switch[aria-checked="true"]{background:#5aa883}
.switch--lock[aria-checked="true"]{background:#c9a227}
.switch[aria-checked="true"]::after{transform:translateX(26px)}
.switch:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.switch:disabled{opacity:.6;cursor:wait}
.status{min-height:1.5em;margin-top:8px!important;font-size:.85rem!important}
.table-wrap{overflow-x:auto;margin-top:14px;container-type:inline-size}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{color:var(--muted);font-size:.78rem}
td.name{white-space:normal;min-width:8em}
.tag{display:inline-block;padding:1px 10px;border-radius:999px;background:#e2f4ea;color:#2f7a55;font-size:.78rem;font-weight:700}
.tag--blocked{background:#fbe3e3;color:var(--danger)}
.tag--admin{background:#e7e4fb;color:#4c449a}
.tag--lock{background:#f8edc8;color:#7a5c00}
.small-btn{padding:4px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;color:#3d3654;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.small-btn:hover{background:#f4f0fb}
.small-btn--danger{border-color:#f0c4c4;color:#b23b3b}
.empty{padding:16px 0;color:var(--muted)}
.pages{display:grid;gap:8px;margin-top:14px}
.page-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:#ffffff8c}
.page-row__title{flex:1;min-width:0;font-weight:700}
.page-row__title small{display:block;color:var(--muted);font-weight:500}
.page-row__state{font-size:.8rem;font-weight:700;color:var(--muted)}
.access-row td{padding:0 8px 14px;white-space:normal;border-bottom:1px solid var(--line)}
/* アカウントが増えても探しやすいように、検索・絞り込み・件数を一覧の上に置く */
.users-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px}
.users-search{flex:1 1 220px;min-width:0;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:#3d3654;font:inherit;font-size:.88rem}
.users-search:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.users-filter{display:flex;flex-wrap:wrap;gap:6px}
.users-filter .small-btn[aria-pressed="true"]{border-color:#7a6fc4;background:#e7e4fb;color:#4c449a}
.users-count{width:100%;color:var(--muted);font-size:.8rem}
.more-btn{display:block;margin:12px auto 0}
td.more{display:none}
/* スマホの幅では、1アカウント1行（メール・状態・詳細）の一覧にして、横スクロールも縦の長さも出さない。
   名前・最後のログイン・回数・ボタンは「詳細」を押したときだけ下に開く */
@media (max-width:720px){
  .users-table,.users-table tbody,.users-table tr,.users-table td{display:block;width:100%}
  .users-table thead{display:none}
  .users-table .user-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:9px 2px;border-bottom:1px solid var(--line)}
  .users-table .user-row td{width:auto;min-width:0;padding:0;border:0;white-space:normal}
  .users-table .user-row td.email{flex:1 1 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
  .users-table .user-row td.state{order:1;flex:none;white-space:nowrap}
  .users-table .user-row td.more{display:block;order:2;flex:none}
  .users-table .user-row td.meta,.users-table .user-row td.actions{display:none;order:3}
  .users-table .user-row.is-open td.email{flex-basis:100%;white-space:normal;overflow-wrap:anywhere}
  .users-table .user-row.is-open td.state{flex:1 1 auto}
  .users-table .user-row.is-open td.meta{display:block;color:var(--muted);font-size:.78rem}
  .users-table .user-row.is-open td.name{flex:1 1 100%;color:var(--ink);font-size:.85rem}
  .users-table .user-row.is-open td.name:empty{display:none}
  .users-table .user-row td.count::after{content:"回ログイン"}
  .users-table .user-row.is-open td.actions{display:flex;flex:1 1 100%;flex-wrap:wrap;gap:6px;order:4}
  .users-table .access-row td{padding:8px 0 4px;border:0}
  .users-table .access-grid{position:static;width:auto}
  .users-table .empty{display:block}
}
/* 表が横に長くても、ページ設定の枠は見えている幅に収める（左に固定し、幅は表の外枠に合わせる） */
.access-grid{position:sticky;left:0;box-sizing:border-box;width:calc(100cqw - 16px);display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:8px;padding:12px;border-radius:14px;background:#f6f2fb}
.access-grid label{display:grid;gap:4px;min-width:0;font-size:.82rem;font-weight:700}
.access-grid select{width:100%;min-width:0;max-width:100%}
.access-grid select{padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:#fff;font:inherit;font-weight:500}
.access-grid select.is-allow{border:2px solid #5aa883;background:#eef9f3;color:#1f5a3d;font-weight:700}
.access-grid select.is-deny{border:2px solid #c9a227;background:#fdf6df;color:#6b4f00;font-weight:700}
.access-grid option{background:#fff;color:#3d3654}
@media (prefers-color-scheme:dark){
  :root{color-scheme:dark}
  .page-row{background:#ffffff0d}.access-grid{background:#ffffff0d}
  .small-btn,.access-grid select,.users-search{background:#2a2c4d;color:var(--ink)}
  .users-filter .small-btn[aria-pressed="true"]{border-color:#9d93e6;background:#3b3770;color:#fff}
  .access-grid select.is-allow{background:#1d3a2e;color:#c4f2da}
  .access-grid select.is-deny{background:#3b3115;color:#ffe6a1}
  .access-grid option{background:#2a2c4d;color:#ece8f6}}
@media (prefers-reduced-motion:reduce){.switch,.switch::after{transition:none}}
`;

export function adminPage(adminEmail) {
  const body = `<main class="admin">
  <div class="admin__head"><h1>管理画面</h1><span class="admin__me">${esc(adminEmail)}</span><a class="btn" href="/">ポータルへ</a><a class="btn" href="/auth/logout">ログアウト</a></div>
  <section class="panel">
    <h2>ログイン機能</h2>
    <p>オンにすると、ポータルと各ページを開く前に Googleログインが必要になります。オフのときは、最初の画面に「ポータルへ」と「管理者ログイン」が並び、誰でもすぐにポータルを開けます。</p>
    <div class="toggle"><button type="button" class="switch" id="login-switch" role="switch" aria-checked="false" aria-labelledby="login-label" disabled></button><span id="login-label">読み込み中…</span></div>
    <p class="status" id="settings-status" role="status"></p>
  </section>
  <section class="panel">
    <h2>ページの鍵</h2>
    <p>鍵をかけたページは、ポータルのカードに鎖がかかり、押しても開けなくなります。アカウントごとの例外は、下の一覧の「ページ設定」で決めます。反映まで最大30秒ほどかかります。</p>
    <div class="toggle"><button type="button" class="switch switch--lock" id="obey-switch" role="switch" aria-checked="false" aria-labelledby="obey-label" disabled></button><span id="obey-label">読み込み中…</span></div>
    <div class="pages" id="pages"><p class="empty">読み込み中…</p></div>
    <p class="status" id="locks-status" role="status"></p>
  </section>
  <section class="panel">
    <h2>ログインしたアカウント</h2>
    <p>一度でもログインしたアカウントの一覧です。最初は全員が利用できます。ブロックすると、そのアカウントではポータルを開けなくなります。「ページ設定」では、鍵のかかったページをそのアカウントだけ開けるようにしたり、逆にそのアカウントだけ入れなくしたりできます。</p>
    <div class="users-tools">
      <input type="search" class="users-search" id="users-search" placeholder="メールアドレスか名前で探す" aria-label="メールアドレスか名前で探す" autocomplete="off">
      <div class="users-filter" id="users-filter" role="group" aria-label="絞り込み"><button type="button" class="small-btn" data-filter="all" aria-pressed="true">すべて</button><button type="button" class="small-btn" data-filter="blocked" aria-pressed="false">ブロック中</button><button type="button" class="small-btn" data-filter="except" aria-pressed="false">例外あり</button></div>
      <span class="users-count" id="users-count" aria-live="polite"></span>
    </div>
    <div class="table-wrap"><table class="users-table"><thead><tr><th>メールアドレス</th><th>名前</th><th>最後のログイン</th><th>回数</th><th>状態</th><th></th></tr></thead><tbody id="users"><tr><td colspan="6" class="empty">読み込み中…</td></tr></tbody></table></div>
    <button type="button" class="small-btn more-btn" id="users-more" hidden></button>
    <p class="status" id="users-status" role="status"></p>
  </section>
</main>
<script>
(function () {
  var me = ${JSON.stringify(String(adminEmail).toLowerCase())};
  var $ = function (id) { return document.getElementById(id); };
  var pages = [], locked = {}, access = {}, users = [], openEmail = '';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(iso) { if (!iso) return ''; return new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }); }
  function api(path, body) {
    return fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || '失敗しました'); return d; }); });
  }

  /* ログイン機能 */
  var sw = $('login-switch');
  function showLogin(on) { sw.setAttribute('aria-checked', on ? 'true' : 'false'); $('login-label').textContent = on ? 'オン（Googleログインが必要）' : 'オフ（ログインなしで開ける）'; }
  api('/admin/api/settings').then(function (d) { showLogin(d.loginRequired); sw.disabled = false; })
    .catch(function (e) { $('login-label').textContent = '読み込めませんでした'; $('settings-status').textContent = e.message; });
  sw.addEventListener('click', function () {
    var next = sw.getAttribute('aria-checked') !== 'true';
    sw.disabled = true; $('settings-status').textContent = '保存しています…';
    api('/admin/api/settings', { loginRequired: next })
      .then(function (d) { showLogin(d.loginRequired); $('settings-status').textContent = '保存しました。反映まで最大30秒ほどかかります。'; })
      .catch(function (e) { $('settings-status').textContent = e.message; })
      .then(function () { sw.disabled = false; });
  });

  /* ページの鍵 */
  var obey = $('obey-switch');
  function showObey(on) { obey.setAttribute('aria-checked', on ? 'true' : 'false'); $('obey-label').textContent = on ? '管理者にも鍵を適用する（デバッグ中）' : '管理者は鍵に関係なく入れる'; }
  function renderPages() {
    $('pages').innerHTML = pages.map(function (p) {
      var on = !!locked[p.key];
      return '<div class="page-row"><span class="page-row__title">' + esc(p.title) + '<small>/' + esc(p.key) + '/</small></span>'
        + '<span class="page-row__state">' + (on ? '鍵あり' : '鍵なし') + '</span>'
        + '<button type="button" class="switch switch--lock" role="switch" aria-checked="' + on + '" aria-label="' + esc(p.title) + 'に鍵をかける" data-page="' + esc(p.key) + '"></button></div>';
    }).join('') || '<p class="empty">ポータルのカードが見つかりません。</p>';
  }
  function loadLocks() {
    return api('/admin/api/locks').then(function (d) {
      pages = d.pages; locked = {}; access = {};
      d.locked.forEach(function (k) { locked[k] = true; });
      d.access.forEach(function (a) { (access[a.email] = access[a.email] || {})[a.page] = a.access; });
      showObey(d.adminObeys); obey.disabled = false; renderPages();
    }).catch(function (e) { $('pages').innerHTML = '<p class="empty">読み込めませんでした</p>'; $('locks-status').textContent = e.message; });
  }
  $('pages').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-page]'); if (!b) return;
    var next = b.getAttribute('aria-checked') !== 'true';
    b.disabled = true;
    api('/admin/api/locks', { page: b.dataset.page, locked: next })
      .then(function () { locked[b.dataset.page] = next; renderPages(); renderUsers(); $('locks-status').textContent = (next ? '鍵をかけました。' : '鍵を外しました。') + '反映まで最大30秒ほどかかります。'; })
      .catch(function (e) { $('locks-status').textContent = e.message; b.disabled = false; });
  });
  obey.addEventListener('click', function () {
    var next = obey.getAttribute('aria-checked') !== 'true';
    obey.disabled = true;
    api('/admin/api/locks', { adminObeys: next })
      .then(function () { showObey(next); $('locks-status').textContent = next ? '管理者にも鍵を適用します。管理画面には、いつでも入れます。' : '管理者は鍵に関係なく入れるようにしました。'; })
      .catch(function (e) { $('locks-status').textContent = e.message; })
      .then(function () { obey.disabled = false; });
  });

  /* アカウント */
  function accessCell(u) {
    var mine = access[u.email] || {};
    return '<tr class="access-row"><td colspan="6"><div class="access-grid">' + pages.map(function (p) {
      var v = mine[p.key] || 'default';
      return '<label>' + esc(p.title) + '<select data-email="' + esc(u.email) + '" data-page="' + esc(p.key) + '" class="' + (v === 'default' ? '' : 'is-' + v) + '">'
        + '<option value="default"' + (v === 'default' ? ' selected' : '') + '>ページの鍵の設定に従う（いまは' + (locked[p.key] ? '鍵あり' : '鍵なし') + '）</option>'
        + '<option value="allow"' + (v === 'allow' ? ' selected' : '') + '>この人だけ入れる</option>'
        + '<option value="deny"' + (v === 'deny' ? ' selected' : '') + '>この人だけ入れない</option></select></label>';
    }).join('') + '</div></td></tr>';
  }
  /* 一度に並べるのは最近ログインした順に PAGE 件まで。残りは「もっと表示する」で足す */
  var PAGE = 20, shown = PAGE, query = '', filter = 'all', detail = {};
  function matches(u) {
    if (filter === 'blocked' && !u.blocked) return false;
    if (filter === 'except' && !Object.keys(access[u.email] || {}).length) return false;
    return !query || (u.email + ' ' + (u.name || '')).toLowerCase().indexOf(query) !== -1;
  }
  function renderUsers() {
    var more = $('users-more');
    if (!users.length) { $('users').innerHTML = '<tr><td colspan="6" class="empty">まだ誰もログインしていません。</td></tr>'; $('users-count').textContent = ''; more.hidden = true; return; }
    var hits = users.filter(function (u) { return matches(u) || u.email === openEmail; });
    var list = hits.slice(0, shown);
    $('users-count').textContent = (hits.length === users.length ? '全' + users.length + '件' : '全' + users.length + '件中 ' + hits.length + '件が当てはまります') + (list.length < hits.length ? '（' + list.length + '件を表示中）' : '');
    more.hidden = list.length >= hits.length;
    more.textContent = 'もっと表示する（残り ' + (hits.length - list.length) + '件）';
    if (!list.length) { $('users').innerHTML = '<tr><td colspan="6" class="empty">当てはまるアカウントはありません。</td></tr>'; return; }
    $('users').innerHTML = list.map(function (u) {
      var self = u.email.toLowerCase() === me;
      var count = Object.keys(access[u.email] || {}).length;
      var state = self ? '<span class="tag tag--admin">管理者</span>' : u.blocked ? '<span class="tag tag--blocked">ブロック中</span>' : '<span class="tag">利用できる</span>';
      if (count) state += ' <span class="tag tag--lock">例外 ' + count + '</span>';
      var block = self ? '' : '<button type="button" class="small-btn' + (u.blocked ? '' : ' small-btn--danger') + '" data-email="' + esc(u.email) + '" data-block="' + (u.blocked ? '0' : '1') + '">' + (u.blocked ? 'ブロックを解除' : 'ブロックする') + '</button> ';
      var pageBtn = '<button type="button" class="small-btn" data-pages="' + esc(u.email) + '" aria-expanded="' + (openEmail === u.email) + '">ページ設定</button>';
      var open = !!detail[u.email];
      var row = '<tr class="user-row' + (open ? ' is-open' : '') + '"><td class="email" title="' + esc(u.email) + '">' + esc(u.email) + '</td><td class="meta name">' + esc(u.name) + '</td><td class="meta">' + esc(when(u.last_login)) + '</td><td class="meta count">' + esc(u.login_count) + '</td><td class="state">' + state + '</td><td class="actions">' + block + pageBtn + '</td>'
        + '<td class="more"><button type="button" class="small-btn" data-detail="' + esc(u.email) + '" aria-expanded="' + open + '" aria-label="' + esc(u.email) + ' の詳細">' + (open ? '閉じる' : '詳細') + '</button></td></tr>';
      return row + (openEmail === u.email ? accessCell(u) : '');
    }).join('');
  }
  function loadUsers() {
    return api('/admin/api/users').then(function (d) { users = d.users; renderUsers(); })
      .catch(function (e) { $('users').innerHTML = '<tr><td colspan="6" class="empty">読み込めませんでした</td></tr>'; $('users-status').textContent = e.message; });
  }
  $('users-search').addEventListener('input', function (e) { query = e.target.value.trim().toLowerCase(); shown = PAGE; renderUsers(); });
  $('users-filter').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-filter]'); if (!b) return;
    filter = b.dataset.filter; shown = PAGE;
    Array.prototype.forEach.call(this.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    renderUsers();
  });
  $('users-more').addEventListener('click', function () { shown += PAGE; renderUsers(); });
  $('users').addEventListener('click', function (event) {
    var d = event.target.closest('button[data-detail]');
    if (d) { if (detail[d.dataset.detail]) delete detail[d.dataset.detail]; else detail[d.dataset.detail] = true; renderUsers(); return; }
    var p = event.target.closest('button[data-pages]');
    if (p) { openEmail = openEmail === p.dataset.pages ? '' : p.dataset.pages; renderUsers(); return; }
    var b = event.target.closest('button[data-block]');
    if (!b) return;
    var block = b.dataset.block === '1';
    if (block && !confirm(b.dataset.email + ' をブロックしますか？')) return;
    b.disabled = true;
    api('/admin/api/users', { email: b.dataset.email, blocked: block })
      .then(function () { $('users-status').textContent = block ? 'ブロックしました。' : 'ブロックを解除しました。'; loadUsers(); })
      .catch(function (e) { $('users-status').textContent = e.message; b.disabled = false; });
  });
  $('users').addEventListener('change', function (event) {
    var s = event.target.closest('select[data-page]'); if (!s) return;
    s.disabled = true;
    api('/admin/api/access', { email: s.dataset.email, page: s.dataset.page, access: s.value })
      .then(function () {
        var mine = access[s.dataset.email] = access[s.dataset.email] || {};
        if (s.value === 'default') delete mine[s.dataset.page]; else mine[s.dataset.page] = s.value;
        renderUsers(); $('users-status').textContent = '保存しました。反映まで最大30秒ほどかかります。';
      })
      .catch(function (e) { $('users-status').textContent = e.message; s.disabled = false; });
  });

  loadLocks().then(loadUsers);
})();
</script>`;
  return html(shell('管理画面', body, ADMIN_STYLE));
}
