// ログアウト。ログイン状態の cookie と、入口を通った記録を消して、入口の画面へ戻る
import { SESSION_COOKIE, clearCookie, safeNext } from '../_lib/auth.js';
import { passThrough } from '../_lib/pages.js';

export async function onRequestGet({ request }) {
  const next = safeNext(new URL(request.url).searchParams.get('next'), '/');
  return passThrough(next, { clear: true }, [clearCookie(SESSION_COOKIE)]);
}
