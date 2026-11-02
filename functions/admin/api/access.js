// アカウントごとに、ページへ入れるか（鍵の例外）を決める
import { json, portalPages, setUserAccess } from '../../_lib/auth.js';

const ACCESS = ['allow', 'deny', 'default'];

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const email = body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const pages = await portalPages(env, request);
  if (!email || !ACCESS.includes(body.access) || !pages.some((p) => p.key === body.page)) {
    return json({ error: '値が正しくありません' }, 400);
  }
  await setUserAccess(env, email, body.page, body.access);
  return json({ ok: true });
}
