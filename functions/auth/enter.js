// 最初の画面の「ポータルへ」。ブラウザーを閉じるまで、最初の画面を飛ばしてポータルを出す
import { ENTERED_COOKIE, cookie, redirect } from '../_lib/auth.js';

export async function onRequestGet() {
  return redirect('/', [cookie(ENTERED_COOKIE, '1')]);
}
