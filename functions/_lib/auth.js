// ポータルのログイン機能で共通に使う道具（Cloudflare Pages Functions）
//
// 必要な環境変数（Cloudflare Pages の secret として登録する。リポジトリには書かない）
//   GOOGLE_CLIENT_ID      Google の OAuth クライアント ID
//   GOOGLE_CLIENT_SECRET  Google の OAuth クライアント シークレット
//   SESSION_SECRET        ログイン状態の cookie に署名するための長いランダムな文字列
//   ADMIN_EMAIL           管理者の Google アカウントのメールアドレス
// D1 のバインディング: DB（migrations/0001_auth.sql の表を使う）

export const SESSION_COOKIE = 'ksa_session';
export const OAUTH_COOKIE = 'ksa_oauth';
const REMEMBER_DAYS = 30; // 「ログインしたままにする」を選んだとき
const SESSION_HOURS = 12; // 選ばなかったとき（ブラウザーやアプリを閉じても、長くは残さない）
const CACHE_MS = 30 * 1000;

const encoder = new TextEncoder();

/* ---------- base64url と署名 ---------- */
function toBase64Url(bytes) {
  let text = '';
  bytes.forEach((b) => { text += String.fromCharCode(b); });
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const text = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}

const keyCache = new Map();
async function hmacKey(secret) {
  if (!keyCache.has(secret)) {
    keyCache.set(secret, crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
  }
  return keyCache.get(secret);
}

export async function sign(env, data) {
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  const body = toBase64Url(encoder.encode(JSON.stringify(data)));
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(mac))}`;
}

export async function verify(env, token) {
  if (!token || !env.SESSION_SECRET) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), fromBase64Url(mac), encoder.encode(body));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return data;
  } catch (error) {
    return null;
  }
}

export function randomId(bytes = 24) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function decodeJwtPayload(jwt) {
  const part = String(jwt || '').split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(part)));
  } catch (error) {
    return null;
  }
}

/* ---------- cookie ---------- */
export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index > -1 && part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return '';
}

export function cookie(name, value, { maxAge, path = '/' } = {}) {
  let text = `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax`;
  if (maxAge !== undefined) text += `; Max-Age=${maxAge}`;
  return text;
}

export function clearCookie(name, path = '/') {
  return cookie(name, '', { maxAge: 0, path });
}

/* ---------- ログイン状態 ---------- */
export async function createSession(env, user, remember = false) {
  const seconds = remember ? REMEMBER_DAYS * 24 * 60 * 60 : SESSION_HOURS * 60 * 60;
  const token = await sign(env, { email: user.email, name: user.name, remember: Boolean(remember), exp: Date.now() + seconds * 1000 });
  // 選ばなかったときは、ブラウザーを閉じたら消える cookie にする
  return cookie(SESSION_COOKIE, token, remember ? { maxAge: seconds } : {});
}

export async function readSession(request, env) {
  return verify(env, readCookie(request, SESSION_COOKIE));
}

export function isAdminEmail(env, email) {
  const admin = String(env.ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(admin) && String(email || '').toLowerCase() === admin;
}

export function isConfigured(env) {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.SESSION_SECRET && env.ADMIN_EMAIL && env.DB);
}

/* ---------- D1 ---------- */
// 同じ実行環境の中で 30 秒だけ覚えておき、ページの画像やCSSごとに D1 を読まないようにする
const memo = new Map();
function remember(key, load) {
  const hit = memo.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = load();
  memo.set(key, { value, until: Date.now() + CACHE_MS });
  value.catch(() => memo.delete(key));
  return value;
}
export function forget(key) {
  if (key) memo.delete(key); else memo.clear();
}

export function getSettings(env) {
  if (!env.DB) return Promise.resolve({ loginRequired: false });
  return remember('settings', async () => {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'login_required'").first();
    return { loginRequired: row ? row.value === '1' : false };
  });
}

export async function setLoginRequired(env, on) {
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('login_required', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(on ? '1' : '0').run();
  forget('settings');
}

export function isBlocked(env, email) {
  if (!env.DB || !email) return Promise.resolve(false);
  return remember(`blocked:${email}`, async () => {
    const row = await env.DB.prepare('SELECT blocked FROM users WHERE email = ?1').bind(email).first();
    return Boolean(row && row.blocked);
  });
}

export async function recordLogin(env, profile) {
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO users (email, sub, name, first_login, last_login, login_count, blocked)
     VALUES (?1, ?2, ?3, ?4, ?4, 1, 0)
     ON CONFLICT(email) DO UPDATE SET sub = excluded.sub, name = excluded.name,
       last_login = excluded.last_login, login_count = users.login_count + 1
     RETURNING blocked`
  ).bind(profile.email, profile.sub, profile.name, now).first();
  forget(`blocked:${profile.email}`);
  return Boolean(row && row.blocked);
}

export async function listUsers(env) {
  const { results } = await env.DB.prepare('SELECT email, name, first_login, last_login, login_count, blocked FROM users ORDER BY last_login DESC').all();
  return results;
}

export async function setBlocked(env, email, blocked) {
  await env.DB.prepare('UPDATE users SET blocked = ?2 WHERE email = ?1').bind(email, blocked ? 1 : 0).run();
  forget(`blocked:${email}`);
}

/* ---------- そのほか ---------- */
export function safeNext(value, fallback = '/') {
  const text = String(value || '');
  return text.startsWith('/') && !text.startsWith('//') && !text.startsWith('/\\') ? text : fallback;
}

export function redirect(location, headers = []) {
  const response = new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });
  headers.forEach((value) => response.headers.append('Set-Cookie', value));
  return response;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin === new URL(request.url).origin;
}

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
