/**
 * Google カレンダーとスプレッドシートをつなぐ（スプレッドシートのコンテナバインド型）
 *
 * 準備
 * - スプレッドシートに「読み込み」「書き出し」の 2 つのシートを作る
 * - 「書き出し」シートの 1 行目に見出しを書く:
 *     タイトル | 開始 | 終了 | 場所 | 予定ID
 *   2 行目から、書き出したい予定を入れる（開始・終了は日時の形式で）
 * - まず「カレンダー一覧を書き出す」を実行し、使うカレンダーの ID を下の定数に入れる
 */

// 予定を読み込むカレンダーと、書き出すカレンダーの ID
const IMPORT_CALENDAR_ID = 'ここに読み込むカレンダーのIDを入れる';
const EXPORT_CALENDAR_ID = 'ここに書き出すカレンダーのIDを入れる';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('カレンダー連携')
    .addItem('カレンダー一覧を書き出す', 'listCalendars')
    .addSeparator()
    .addItem('予定を読み込む（今日から30日分）', 'importEvents')
    .addItem('予定をカレンダーへ書き出す', 'exportEvents')
    .addToUi();
}

// 自分が見られるカレンダーの名前と ID を「カレンダー一覧」シートに並べる
function listCalendars() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName('カレンダー一覧') || book.insertSheet('カレンダー一覧');
  const rows = CalendarApp.getAllCalendars().map((cal) => [
    cal.getName(),
    cal.getId(),
    cal.isOwnedByMe() ? '自分' : 'ほかの人',
  ]);
  sheet.clearContents();
  sheet.appendRow(['名前', 'カレンダーID', '持ち主']);
  if (rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

// カレンダー → スプレッドシート
function importEvents() {
  const calendar = CalendarApp.getCalendarById(IMPORT_CALENDAR_ID);
  if (!calendar) throw new Error('読み込むカレンダーが見つかりません。ID を確かめてください。');

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const rows = calendar.getEvents(start, end).map((ev) => [
    ev.getTitle(),
    ev.getStartTime(),
    ev.getEndTime(),
    ev.getLocation(),
    ev.isAllDayEvent() ? '終日' : '',
  ]);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('読み込み');
  sheet.clearContents();
  sheet.appendRow(['タイトル', '開始', '終了', '場所', '終日']);
  if (rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

// スプレッドシート → カレンダー
function exportEvents() {
  const calendar = CalendarApp.getCalendarById(EXPORT_CALENDAR_ID);
  if (!calendar) throw new Error('書き出すカレンダーが見つかりません。ID を確かめてください。');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('書き出し');
  const values = sheet.getDataRange().getValues(); // 1 行目は見出し

  for (let i = 1; i < values.length; i++) {
    const [title, start, end, location, eventId] = values[i];
    // 空の行と、もう書き出した行（予定IDが入っている行）は飛ばす。二重登録を防ぐため
    if (!title || eventId) continue;
    const ev = calendar.createEvent(title, start, end, { location: location });
    sheet.getRange(i + 1, 5).setValue(ev.getId());
  }
}
