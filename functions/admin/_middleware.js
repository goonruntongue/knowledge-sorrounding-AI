// 管理画面（/admin/ 以下）は、管理者のアカウントでログインしているときだけ開ける
import { isAdminEmail, isBlocked, isConfigured, json, readSession, redirect, sameOrigin } from '../_lib/auth.js';
import { notAdminPage, notConfiguredPage } from '../_lib/pages.js';

export async function onRequest(context) {
  const { request, env, next, data } = context;
  if (!isConfigured(env)) return notConfiguredPage();
  const url = new URL(request.url);
  const isApi = url.pathname.startsWith('/admin/api/');

  const session = await readSession(request, env);
  if (!session) {
    if (isApi) return json({ error: 'ログインが必要です' }, 401);
    return redirect(`/auth/login?admin=1&next=${encodeURIComponent(url.pathname)}`);
  }
  if (!isAdminEmail(env, session.email) || await isBlocked(env, session.email)) {
    return isApi ? json({ error: '管理者だけが使えます' }, 403) : notAdminPage();
  }
  // 書き換えの操作は、このサイトの画面からの JSON だけを受け付ける
  if (request.method !== 'GET' && (!sameOrigin(request) || !(request.headers.get('Content-Type') || '').includes('application/json'))) {
    return json({ error: 'この操作は受け付けられません' }, 403);
  }
  data.session = session;
  return next();
}
