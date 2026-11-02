// 入口の画面。アプリやタブを開いて最初のページで、各ページの先頭のスクリプトがここへ送ってくる
import { SESSION_COOKIE, clearCookie, getSettings, isBlocked, readSession, safeNext } from '../_lib/auth.js';
import { blockedPage, landingPage, loginPage, passThrough } from '../_lib/pages.js';

export async function onRequestGet({ request, env }) {
  const next = safeNext(new URL(request.url).searchParams.get('next'), '/');
  const session = await readSession(request, env);
  const [blocked, { loginRequired }] = await Promise.all([
    session ? isBlocked(env, session.email) : false,
    getSettings(env),
  ]);
  if (blocked) return blockedPage(clearCookie(SESSION_COOKIE));

  // 「ログインしたままにする」でログインした人は、入口を飛ばしてそのまま進む
  if (session && session.remember) return passThrough(next);

  // ログインがオンなら Googleログイン、オフなら「ポータルへ／管理者ログイン」
  return loginRequired ? loginPage(next) : landingPage(next);
}
