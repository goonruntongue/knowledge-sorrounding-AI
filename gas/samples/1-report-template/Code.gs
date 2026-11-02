/** @OnlyCurrentDoc */
function onOpen() {
  DocumentApp.getUi().createMenu('差し込み')
    .addItem('入力フォームを開く', 'showSidebar').addToUi();
}
function showSidebar() {
  DocumentApp.getUi().showSidebar(
    HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('文書への差し込み'));
}
function fillTemplate(data) {
  const values = {'名前': String(data.name || '').trim(), '日付': String(data.date || '').trim(), '内容': String(data.content || '').trim()};
  if (Object.values(values).some(value => !value)) throw new Error('すべての欄を入力してください。');
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const body = DocumentApp.getActiveDocument().getActiveTab().asDocumentTab().getBody();
    const changes = [], found = new Set();
    const pattern = '\\{(名前|日付|内容)\\}';
    let match = body.findText(pattern);
    while (match) {
      const text = match.getElement().asText();
      const start = match.getStartOffset(), end = match.getEndOffsetInclusive();
      const key = text.getText().slice(start + 1, end);
      changes.push({text, start, end, value: values[key]});
      found.add(key);
      match = body.findText(pattern, match);
    }
    if (found.size !== 3) throw new Error('本文に {名前}・{日付}・{内容} をそろえてください。差し込み済みなら元の雛形をコピーし直します。');
    changes.reverse().forEach(c => {
      c.text.insertText(c.start, c.value);
      c.text.deleteText(c.start + c.value.length, c.end + c.value.length);
    });
    return '差し込みました。文書を確認してください。';
  } finally { lock.releaseLock(); }
}
