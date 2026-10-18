/**
 * 報告書のひな形を挿入する（Google ドキュメントのコンテナバインド型）
 *
 * 使い方
 * 1. Google ドキュメントを開き、「拡張機能」→「Apps Script」を選ぶ
 * 2. このファイルの中身をエディタに貼り付けて保存する
 * 3. ドキュメントを開き直すと、メニューに「報告書」が増える
 * 4. 「報告書」→「報告書のひな形を挿入」を選ぶ（初回だけ承認の画面が出る）
 */

// ドキュメントを開いたときに自動で動く（シンプルトリガー）
function onOpen() {
  DocumentApp.getUi()
    .createMenu('報告書')
    .addItem('報告書のひな形を挿入', 'insertReportTemplate')
    .addToUi();
}

// メニューから呼ばれる。文書の末尾にひな形を書き足す
function insertReportTemplate() {
  const body = DocumentApp.getActiveDocument().getBody();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年M月d日');

  body.appendParagraph('報告書').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendTable([
    ['作成日', today],
    ['報告者', ''],
    ['件名', ''],
  ]);

  const sections = ['1. 概要', '2. 経過', '3. 結果', '4. 今後の対応'];
  sections.forEach((title) => {
    body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('');
  });
}
