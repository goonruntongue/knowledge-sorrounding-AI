// Google のログイン画面へ送り出す
import { OAUTH_COOKIE, cookie, isConfigured, randomId, redirect, safeNext, sign } from '../_lib/auth.js';
import { notConfiguredPage } from '../_lib/pages.js';

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return notConfiguredPage();
  const url = new URL(request.url);
  const admin = url.searchParams.get('admin') === '1';
  const next = safeNext(url.searchParams.get('next'), admin ? '/admin/' : '/');
  const state = randomId();
  const nonce = randomId();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    prompt: 'select_account',
  });
  // state と nonce を署名付きの cookie に入れておき、戻ってきたときに照らし合わせる
  const token = await sign(env, { state, nonce, next, admin, exp: Date.now() + 10 * 60 * 1000 });
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, [
    cookie(OAUTH_COOKIE, token, { maxAge: 600, path: '/auth/' }),
  ]);
}
