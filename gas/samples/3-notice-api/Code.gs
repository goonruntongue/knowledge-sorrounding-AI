/**
 * 作例 A: お知らせ一覧を JSON で返す API（スプレッドシートのコンテナバインド型）
 *
 * 準備
 * - スプレッドシートに「お知らせ」シートを作り、1 行目に見出しを書く:
 *     日付 | タイトル | 本文 | 公開
 *   「公開」の列はチェックボックスにする（挿入 → チェックボックス）
 * - 下の SPREADSHEET_ID に、このスプレッドシートの ID を入れる
 *   （URL の /d/ と /edit のあいだの文字列）
 * - 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」でデプロイする
 *
 * ウェブアプリとして動くときは getActiveSpreadsheet() が使えないと
 * 公式資料に書かれているので、ID を指定して開く。
 */

const SPREADSHEET_ID = 'ここにスプレッドシートのIDを入れる';

// ブラウザーなどから GET で呼ばれると動く
function doGet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('お知らせ');
  const rows = sheet.getDataRange().getValues().slice(1); // 1 行目の見出しを除く

  const items = rows
    .filter((row) => row[3] === true) // 「公開」にチェックが入った行だけ
    .map((row) => ({
      date: Utilities.formatDate(new Date(row[0]), 'Asia/Tokyo', 'yyyy-MM-dd'),
      title: String(row[1]),
      body: String(row[2]),
    }));

  return ContentService.createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}
