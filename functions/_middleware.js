// すべてのリクエストの入口。ログイン機能のオン／オフに合わせて、ポータルを見せるかどうかを決める
import {
  ENTERED_COOKIE, SESSION_COOKIE, clearCookie, getSettings, isAdminEmail, isBlocked, readCookie, readSession,
} from './_lib/auth.js';
import { ADMIN_BAR, blockedPage, loginPage, landingPage } from './_lib/pages.js';

// 公開しないファイル（ログイン機能のソースや設定）
const HIDDEN = ['/functions', '/migrations', '/wrangler.toml', '/.wrangler'];

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
  // ログインの処理そのものは、ここでは止めない
  if (path.startsWith('/auth/')) return next();

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

  // ログインがオフのとき、最初の画面（ポータルへ／管理者ログイン）を出す
  if (!loginRequired && !session && path === '/' && wantsHtml(request) && !readCookie(request, ENTERED_COOKIE)) {
    return landingPage();
  }

  const response = await next();
  const isPortal = path === '/' && (response.headers.get('Content-Type') || '').includes('text/html');
  if (admin && isPortal) {
    const rewritten = new HTMLRewriter()
      .on('body', { element(el) { el.prepend(ADMIN_BAR, { html: true }); } })
      .transform(response);
    const out = new Response(rewritten.body, rewritten);
    out.headers.set('Cache-Control', 'no-store');
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
