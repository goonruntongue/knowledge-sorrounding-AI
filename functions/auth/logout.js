// ログアウト。ログイン状態の cookie を消して、最初の画面へ戻る
import { ENTERED_COOKIE, SESSION_COOKIE, clearCookie, redirect, safeNext } from '../_lib/auth.js';

export async function onRequestGet({ request }) {
  const next = safeNext(new URL(request.url).searchParams.get('next'), '/');
  return redirect(next, [clearCookie(SESSION_COOKIE), clearCookie(ENTERED_COOKIE)]);
}
