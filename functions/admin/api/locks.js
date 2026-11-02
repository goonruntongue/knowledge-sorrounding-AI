// ページの鍵の一覧を読む・鍵をかける／外す・管理者にも適用するかを切り替える
import { forget, json, lockSummary, portalPages, setAdminObeysLocks, setPageLock } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  forget('locks');
  const [pages, summary] = await Promise.all([portalPages(env, request), lockSummary(env)]);
  return json({ pages, ...summary });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (body && typeof body.adminObeys === 'boolean') {
    await setAdminObeysLocks(env, body.adminObeys);
    return json({ ok: true });
  }
  const pages = await portalPages(env, request);
  if (!body || typeof body.locked !== 'boolean' || !pages.some((p) => p.key === body.page)) {
    return json({ error: '値が正しくありません' }, 400);
  }
  await setPageLock(env, body.page, body.locked);
  return json({ ok: true });
}
