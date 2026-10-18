// ログインしたアカウントの一覧と、ブロック／ブロックの解除
import { isAdminEmail, json, listUsers, setBlocked } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  return json({ users: await listUsers(env) });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  const email = body && typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || typeof body.blocked !== 'boolean') return json({ error: '値が正しくありません' }, 400);
  if (isAdminEmail(env, email)) return json({ error: '管理者自身はブロックできません' }, 400);
  await setBlocked(env, email, body.blocked);
  return json({ ok: true });
}
