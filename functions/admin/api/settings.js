// ログイン機能のオン／オフを読む・変える
import { forget, getSettings, json, setLoginRequired } from '../../_lib/auth.js';

export async function onRequestGet({ env }) {
  forget('settings');
  return json(await getSettings(env));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.loginRequired !== 'boolean') return json({ error: '値が正しくありません' }, 400);
  await setLoginRequired(env, body.loginRequired);
  return json(await getSettings(env));
}
