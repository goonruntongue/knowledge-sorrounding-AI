// 管理画面のダッシュボード
import { adminPage } from '../_lib/pages.js';

export async function onRequestGet({ data }) {
  return adminPage(data.session.email);
}
