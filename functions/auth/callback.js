// Google から戻ってきたところ。本人を確かめて、ログイン状態を作る
import {
  OAUTH_COOKIE, SESSION_COOKIE, clearCookie, createSession, decodeJwtPayload, isAdminEmail, isConfigured,
  readCookie, recordLogin, verify,
} from '../_lib/auth.js';
import { blockedPage, messagePage, notAdminPage, notConfiguredPage, passThrough } from '../_lib/pages.js';

const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export async function onRequestGet({ request, env }) {
  if (!isConfigured(env)) return notConfiguredPage();
  const url = new URL(request.url);
  const saved = await verify(env, readCookie(request, OAUTH_COOKIE));
  const clearOauth = clearCookie(OAUTH_COOKIE, '/auth/');

  if (url.searchParams.get('error')) {
    return messagePage('ログインを中止しました', 'Googleでのログインが完了しませんでした。もう一度お試しください。');
  }
  const code = url.searchParams.get('code');
  if (!saved || !code || url.searchParams.get('state') !== saved.state) {
    return messagePage('ログインをやり直してください', 'ログインの確認に使う情報が見つからないか、時間が切れました。最初の画面からもう一度お試しください。');
  }

  // 認可コードを、Google のトークン エンドポイントで ID トークンに引き換える
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) {
    return messagePage('ログインできませんでした', 'Googleとのやり取りに失敗しました。少し待ってからもう一度お試しください。', 502);
  }
  const tokens = await tokenResponse.json();

  // Google から直接受け取った ID トークンなので署名の検証は省けるが、中身の条件は確かめる
  const claims = decodeJwtPayload(tokens.id_token);
  const valid = claims
    && ISSUERS.includes(claims.iss)
    && claims.aud === env.GOOGLE_CLIENT_ID
    && claims.exp * 1000 > Date.now()
    && claims.nonce === saved.nonce
    && claims.email
    && claims.email_verified === true;
  if (!valid) {
    return messagePage('ログインできませんでした', 'アカウントの情報を確かめられませんでした。もう一度お試しください。');
  }

  const profile = { email: String(claims.email).toLowerCase(), sub: String(claims.sub), name: String(claims.name || '') };
  const blocked = await recordLogin(env, profile);
  if (blocked) {
    const page = blockedPage(clearCookie(SESSION_COOKIE));
    page.headers.append('Set-Cookie', clearOauth);
    return page;
  }

  const session = await createSession(env, profile, saved.remember === true);
  if (saved.admin && !isAdminEmail(env, profile.email)) {
    const page = notAdminPage();
    page.headers.append('Set-Cookie', session);
    page.headers.append('Set-Cookie', clearOauth);
    return page;
  }
  return passThrough(saved.next || '/', {}, [session, clearOauth]);
}
