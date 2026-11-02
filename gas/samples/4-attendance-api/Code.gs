/**
 * 作例 B: フォームから送った出欠をシートに書き込む API（スプレッドシートのコンテナバインド型）
 *
 * 準備
 * - スプレッドシートに「出欠」シートを作り、1 行目に見出しを書く:
 *     受付日時 | 名前 | 出欠 | ひとこと
 * - 下の SPREADSHEET_ID に、このスプレッドシートの ID を入れる
 * - 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」でデプロイする
 */

const SPREADSHEET_ID = 'ここにスプレッドシートのIDを入れる';
const ANSWERS = ['出席', '欠席', '未定'];

// POST で呼ばれると動く。本文（JSON の文字列）は e.postData.contents に入っている
function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return json({ ok: false, message: '送られてきた内容を読めませんでした。' });
  }

  // 受け取った値は、そのまま信じずに確かめる
  const name = clean(data.name, 40);
  const answer = ANSWERS.includes(data.answer) ? data.answer : '';
  const comment = clean(data.comment, 200);
  if (!name || !answer) {
    return json({ ok: false, message: '名前と出欠を入れてください。' });
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('出欠');
  sheet.appendRow([new Date(), name, answer, comment]);
  return json({ ok: true, message: name + ' さんの「' + answer + '」を受け付けました。' });
}

// 文字列にして長さを切りそろえる。= + - @ で始まる値は数式として扱われないよう ' を付ける
function clean(value, max) {
  const text = String(value || '').trim().slice(0, max);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
