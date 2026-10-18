// すべてのリクエストの入口。ログイン機能のオン／オフに合わせて、ポータルを見せるかどうかを決める
import { SESSION_COOKIE, clearCookie, getSettings, isAdminEmail, isBlocked, readSession } from './_lib/auth.js';
import { ADMIN_BAR, GATE_SCRIPT, blockedPage, loginPage } from './_lib/pages.js';

// 公開しないファイル（ログイン機能のソースや設定）
const HIDDEN = ['/functions', '/migrations', '/wrangler.toml', '/.wrangler'];
// 入口やログインの画面が使う画像とアイコン。ログイン前でも読めるようにする
const PUBLIC = new Set([
  '/Sphere_rotating.webp', '/Sphere_rotating.gif', '/pwa-icon-web-knowledge-navy-512.png',
  '/pwa-icon-web-knowledge-navy-192.png', '/manifest.webmanifest',
]);

function wantsHtml(request) {
  return request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (HIDDEN.some((p) => path === p || path.startsWith(`${p}/`))) {
    return new Response('Not Found', { status: 404 });
  }
  // ログインの処理そのものと、入口の画面が使う画像は、ここでは止めない
  if (path.startsWith('/auth/') || PUBLIC.has(path)) return next();

  const session = await readSession(request, env);
  const blocked = session ? await isBlocked(env, session.email) : false;
  const admin = Boolean(session) && !blocked && isAdminEmail(env, session.email);

  if (path === '/admin' || path.startsWith('/admin/')) {
    // 管理画面の中で、管理者かどうかを確かめる（functions/admin/）
    return next();
  }

  if (blocked) return blockedPage(clearCookie(SESSION_COOKIE));

  const { loginRequired } = await getSettings(env);
  if (loginRequired && !session) {
    if (wantsHtml(request)) return loginPage(path + url.search);
    return new Response('ログインが必要です', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }

  const response = await next();
  const isHtml = (response.headers.get('Content-Type') || '').includes('text/html');
  if (isHtml) {
    // 起動して最初に開いたときは、どのページからでも入口の画面（/auth/start）を通す
    // 「ログインしたままにする」でログインした人には入れない
    let rewriter = new HTMLRewriter();
    if (!(session && session.remember)) {
      rewriter = rewriter.on('head', { element(el) { el.prepend(GATE_SCRIPT, { html: true }); } });
    }
    if (admin && path === '/') {
      rewriter = rewriter.on('body', { element(el) { el.prepend(ADMIN_BAR, { html: true }); } });
    }
    const rewritten = rewriter.transform(response);
    const out = new Response(rewritten.body, rewritten);
    out.headers.set('Cache-Control', 'private, no-store');
    return out;
  }
  if (loginRequired || session) {
    // ログインが必要なページは、ブラウザーや途中の経路に残さない
    const out = new Response(response.body, response);
    out.headers.set('Cache-Control', 'private, no-store');
    return out;
  }
  return response;
}
