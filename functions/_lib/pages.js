// ログイン機能が返す画面（入口、ログイン、ブロック、管理画面）の HTML
import { esc } from './auth.js';

const BASE_STYLE = `
:root{--ink:#554b67;--muted:#7a7090;--accent:#625b91;--accent-2:#6da990;--line:#e6d8eb;--card:#ffffffd9;--bg:radial-gradient(circle at 90% 5%,#f7d7e8 0 180px,transparent 181px),linear-gradient(135deg,#fff9ed,#effaff 55%,#f7f0ff);--danger:#c24a4a}
@media (prefers-color-scheme:dark){:root{--ink:#ece8f6;--muted:#b6aecb;--accent:#a99ff0;--accent-2:#86d3b2;--line:#3a3760;--card:#1b1d3ad9;--bg:radial-gradient(circle at 90% 5%,#35285f 0 180px,transparent 181px),linear-gradient(135deg,#0c1128,#0f1b36 55%,#1a1433);--danger:#ff8a8a}}
*{box-sizing:border-box}
body{min-height:100vh;margin:0;color:var(--ink);background:var(--bg);font-family:"Noto Sans JP",sans-serif;line-height:1.8}
a{color:var(--accent)}
.gate{position:relative;display:grid;place-items:center;min-height:100vh;padding:24px 16px;overflow:hidden}
.gate__orb{position:absolute;top:-6%;right:-14%;width:min(70vw,620px);height:auto;opacity:.7;pointer-events:none;filter:saturate(1.6) drop-shadow(0 12px 24px rgba(72,120,190,.2))}
.gate__card{position:relative;width:min(100%,460px);padding:36px 28px;border:1px solid var(--line);border-radius:24px;background:var(--card);backdrop-filter:blur(10px);box-shadow:0 20px 50px #4a3f6a1f;text-align:center}
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
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | Knowledge Surrounding AI</title><link rel="icon" href="/pwa-icon-web-knowledge-navy-512.png" type="image/png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet"><style>${BASE_STYLE}${extraStyle}</style></head><body>${body}</body></html>`;
}

function html(markup, status = 200, headers = {}) {
  return new Response(markup, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

const ORB = '<picture><source srcset="/Sphere_rotating.webp" type="image/webp"><img class="gate__orb" src="/Sphere_rotating.gif" width="800" height="450" alt="" aria-hidden="true"></picture>';

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
export const GATE_SCRIPT = `<script>try{if(!sessionStorage.getItem('${GATE_KEY}')){location.replace('/auth/start?next='+encodeURIComponent(location.pathname+location.search+location.hash))}}catch(e){}</script>`;

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
.switch[aria-checked="true"]::after{transform:translateX(26px)}
.switch:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.switch:disabled{opacity:.6;cursor:wait}
.status{min-height:1.5em;margin-top:8px!important;font-size:.85rem!important}
.table-wrap{overflow-x:auto;margin-top:14px}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
th{color:var(--muted);font-size:.78rem}
td.name{white-space:normal;min-width:8em}
.tag{display:inline-block;padding:1px 10px;border-radius:999px;background:#e2f4ea;color:#2f7a55;font-size:.78rem;font-weight:700}
.tag--blocked{background:#fbe3e3;color:var(--danger)}
.tag--admin{background:#e7e4fb;color:#4c449a}
.small-btn{padding:4px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;color:#3d3654;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.small-btn:hover{background:#f4f0fb}
.small-btn--danger{border-color:#f0c4c4;color:#b23b3b}
.empty{padding:16px 0;color:var(--muted)}
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
    <h2>ログインしたアカウント</h2>
    <p>一度でもログインしたアカウントの一覧です。最初は全員が利用できます。ブロックすると、そのアカウントではポータルを開けなくなります（反映まで最大30秒ほどかかります）。</p>
    <div class="table-wrap"><table><thead><tr><th>メールアドレス</th><th>名前</th><th>最後のログイン</th><th>回数</th><th>状態</th><th></th></tr></thead><tbody id="users"><tr><td colspan="6" class="empty">読み込み中…</td></tr></tbody></table></div>
    <p class="status" id="users-status" role="status"></p>
  </section>
</main>
<script>
(function () {
  var sw = document.getElementById('login-switch');
  var label = document.getElementById('login-label');
  var sStatus = document.getElementById('settings-status');
  var tbody = document.getElementById('users');
  var uStatus = document.getElementById('users-status');
  var me = ${JSON.stringify(String(adminEmail).toLowerCase())};
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(iso) { if (!iso) return ''; var d = new Date(iso); return d.toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }); }
  function api(path, body) {
    return fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.error || '失敗しました'); return d; }); });
  }
  function showSwitch(on) {
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    label.textContent = on ? 'オン（Googleログインが必要）' : 'オフ（ログインなしで開ける）';
  }
  api('/admin/api/settings').then(function (d) { showSwitch(d.loginRequired); sw.disabled = false; })
    .catch(function (e) { label.textContent = '読み込めませんでした'; sStatus.textContent = e.message; });
  sw.addEventListener('click', function () {
    var next = sw.getAttribute('aria-checked') !== 'true';
    sw.disabled = true; sStatus.textContent = '保存しています…';
    api('/admin/api/settings', { loginRequired: next })
      .then(function (d) { showSwitch(d.loginRequired); sStatus.textContent = '保存しました。反映まで最大30秒ほどかかります。'; })
      .catch(function (e) { sStatus.textContent = e.message; })
      .then(function () { sw.disabled = false; });
  });
  function load() {
    api('/admin/api/users').then(function (d) {
      if (!d.users.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">まだ誰もログインしていません。</td></tr>'; return; }
      tbody.innerHTML = d.users.map(function (u) {
        var self = u.email.toLowerCase() === me;
        var state = self ? '<span class="tag tag--admin">管理者</span>' : u.blocked ? '<span class="tag tag--blocked">ブロック中</span>' : '<span class="tag">利用できる</span>';
        var action = self ? '' : '<button type="button" class="small-btn' + (u.blocked ? '' : ' small-btn--danger') + '" data-email="' + esc(u.email) + '" data-block="' + (u.blocked ? '0' : '1') + '">' + (u.blocked ? 'ブロックを解除' : 'ブロックする') + '</button>';
        return '<tr><td>' + esc(u.email) + '</td><td class="name">' + esc(u.name) + '</td><td>' + esc(when(u.last_login)) + '</td><td>' + esc(u.login_count) + '</td><td>' + state + '</td><td>' + action + '</td></tr>';
      }).join('');
    }).catch(function (e) { tbody.innerHTML = '<tr><td colspan="6" class="empty">読み込めませんでした</td></tr>'; uStatus.textContent = e.message; });
  }
  tbody.addEventListener('click', function (event) {
    var b = event.target.closest('button[data-email]');
    if (!b) return;
    var block = b.dataset.block === '1';
    if (block && !confirm(b.dataset.email + ' をブロックしますか？')) return;
    b.disabled = true;
    api('/admin/api/users', { email: b.dataset.email, blocked: block })
      .then(function () { uStatus.textContent = block ? 'ブロックしました。' : 'ブロックを解除しました。'; load(); })
      .catch(function (e) { uStatus.textContent = e.message; b.disabled = false; });
  });
  load();
})();
</script>`;
  return html(shell('管理画面', body, ADMIN_STYLE));
}
