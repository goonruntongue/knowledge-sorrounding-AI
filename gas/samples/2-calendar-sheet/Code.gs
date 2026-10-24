/**
 * スプレッドシートに紐づけるカレンダー連携。
 * Code.gs と HTML ファイル CalendarSettings を保存してシートを開き直す。
 * Google側で使うアカウントを選び、「カレンダー連携」→「カレンダーを選ぶ」。
 * IDの手入力は不要。選択内容はこのスクリプトの利用者ごとに保存する。
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('カレンダー連携')
    .addItem('カレンダーを選ぶ', 'showCalendarSettings')
    .addSeparator()
    .addItem('予定を読み込む（今日から30日分）', 'importEvents')
    .addItem('予定をカレンダーへ書き出す', 'exportEvents')
    .addToUi();
}

function showCalendarSettings() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('CalendarSettings').setTitle('カレンダーの選択')
  );
}

// 現在の実行アカウントが所有・登録しているカレンダーを取得する。
function getCalendarSettings() {
  const props = PropertiesService.getUserProperties();
  return {
    calendars: CalendarApp.getAllCalendars().map(cal => ({
      id: cal.getId(), name: cal.getName(), owned: cal.isOwnedByMe()
    })),
    importId: props.getProperty('importCalendarId') || '',
    exportId: props.getProperty('exportCalendarId') || ''
  };
}

function saveCalendarSettings(importId, exportId) {
  const ids = CalendarApp.getAllCalendars().map(cal => cal.getId());
  if (!ids.includes(importId) || !ids.includes(exportId)) {
    throw new Error('両方のカレンダーを一覧から選んでください。');
  }
  PropertiesService.getUserProperties().setProperties({
    importCalendarId: importId, exportCalendarId: exportId
  });
  return '保存しました。メニューから読み込み・書き出しを実行できます。';
}

function selectedCalendar_(key) {
  const id = PropertiesService.getUserProperties().getProperty(key);
  if (!id) throw new Error('先に「カレンダー連携」→「カレンダーを選ぶ」で保存してください。');
  const calendar = CalendarApp.getCalendarById(id);
  if (!calendar) throw new Error('選択したカレンダーにアクセスできません。選び直してください。');
  return calendar;
}

// カレンダー → 「読み込み」シート。今日の0時から30日分。
function importEvents() {
  const calendar = selectedCalendar_('importCalendarId');
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  const rows = calendar.getEvents(start, end).map(ev => [
    ev.getTitle(), ev.getStartTime(), ev.getEndTime(), ev.getLocation(),
    ev.isAllDayEvent() ? '終日' : ''
  ]);
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName('読み込み') || book.insertSheet('読み込み');
  sheet.clearContents();
  sheet.appendRow(['タイトル', '開始', '終了', '場所', '終日']);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
    sheet.getRange(2, 2, rows.length, 2).setNumberFormat('yyyy/mm/dd hh:mm');
  }
  book.setActiveSheet(sheet);
  book.toast(rows.length + '件を読み込みました。', 'カレンダー連携');
}

function isDate_(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

// 「書き出し」シート → カレンダー。予定IDがある行は再登録しない。
// 列：タイトル | 開始 | 終了 | 場所 | 予定ID | 終日
// 「終日」の列に「終日」と書いた行は終日の予定にする。終了日を入れると、その日までの連日の予定になる。
function exportEvents() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) throw new Error('処理中です。少し待ってから実行してください。');
  try {
    const calendar = selectedCalendar_('exportCalendarId');
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName('書き出し');
    if (!sheet) throw new Error('「書き出し」シートを作り、予定を入力してください。');
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const [title, start, end, , eventId, allDay] = values[i];
      if (!title || eventId) continue;
      if (String(allDay).trim() === '終日') {
        if (!isDate_(start) || (end !== '' && (!isDate_(end) || end < start))) {
          throw new Error((i + 1) + '行目の開始を日付で入力し、終了日を入れるときは開始日以降にしてください。');
        }
      } else if (!isDate_(start) || !isDate_(end) || end <= start) {
        throw new Error((i + 1) + '行目の開始・終了を日時で入力し、終了を開始より後にしてください。');
      }
    }
    let count = 0;
    for (let i = 1; i < values.length; i++) {
      const [title, start, end, location, eventId, allDay] = values[i];
      if (!title || eventId) continue;
      const options = { location: String(location || '') };
      let ev;
      try {
        if (String(allDay).trim() === '終日') {
          // カレンダーの終日予定は「最終日の翌日」で終わるため、1日足して渡す
          const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const lastDay = isDate_(end) ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : startDay;
          const endDay = new Date(lastDay);
          endDay.setDate(endDay.getDate() + 1);
          ev = calendar.createAllDayEvent(String(title), startDay, endDay, options);
        } else {
          ev = calendar.createEvent(String(title), start, end, options);
        }
      } catch (error) {
        throw new Error((i + 1) + '行目を書き出せませんでした。書き込み権限を確認してください。詳細: ' + error.message);
      }
      sheet.getRange(i + 1, 5).setValue(ev.getId());
      SpreadsheetApp.flush();
      count++;
    }
    book.toast(count + '件を書き出しました。予定IDがある行はスキップします。', 'カレンダー連携');
  } finally {
    lock.releaseLock();
  }
}
