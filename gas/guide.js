/* GASでGoogleサービスをつなぐ — ページの小さな機能と、学習用の練習画面
 * 練習画面は画面上で操作を再現するだけです。Googleのアカウントやサービス、通信には一切つながりません。 */
(function () {
  'use strict';

  new ScrollHint('.gas-type-comparison', { i18n: { scrollable: '横にスクロールできます' } });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- コードのコピー ---------- */
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const source = document.getElementById(button.dataset.copy);
      if (!source) return;
      try {
        await navigator.clipboard.writeText(source.innerText);
        button.textContent = 'コピーしました';
      } catch (error) {
        button.textContent = 'コピーできませんでした';
      }
      setTimeout(() => { button.textContent = 'コピー'; }, 1600);
    });
  });

  /* ---------- ページの先頭へ ---------- */
  const toTop = document.getElementById('toTop');
  if (toTop) {
    const update = () => toTop.classList.toggle('is-visible', window.scrollY > 360);
    window.addEventListener('scroll', update, { passive: true });
    update();
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------- 練習画面 ---------- */
  const dialog = document.getElementById('gas-lab');
  if (!dialog) return;
  const stage = document.getElementById('lab-stage');
  const guide = document.getElementById('lab-guide');
  const chapterList = document.getElementById('lab-chapters');
  const progressEl = document.getElementById('lab-progress');
  const taskEl = document.getElementById('lab-task');
  const hintEl = document.getElementById('lab-hint');
  const explainEl = document.getElementById('lab-explanation');

  const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const ACCOUNT = { name: 'you', mail: 'you@example.com' };
  const DOC_NAME = '案内文の雛形（作業用コピー）';
  const SHEET_NAME = '勉強会のお知らせ';
  const DOC_PROJECT = '文書への差し込み';
  const SHEET_PROJECT = 'お知らせAPI';
  const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx-sample-0000/exec';

  const REPORT_CODE = document.getElementById('code-report').textContent;

  const API_CODE = `const SPREADSHEET_ID = '1AbC…（このシートのID）';

function doGet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName('お知らせ');
  const rows = sheet.getDataRange().getValues().slice(1);
  const items = rows.filter((r) => r[3] === true)
    .map((r) => ({ date: r[0], title: r[1], body: r[2] }));
  return ContentService
    .createTextOutput(JSON.stringify({ items: items }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const chapters = ['スクリプトを書く', 'メニューを使う', 'ウェブアプリにする', 'HTMLとつなぐ'];
  const chapterTitles = [
    'ドキュメントからApps Scriptを開き、コードを書いて保存する',
    'メニューから右のフォームを開き、文書に差し込む',
    'スプレッドシートのGASを、ウェブアプリとしてデプロイする',
    'ウェブアプリのURLをHTMLに貼り、お知らせを表示する',
  ];

  function fresh() {
    return {
      scene: 'doc', // doc（1〜2章）または sheet（3〜4章）
      app: 'browser', // browser または notepad
      active: 'file', // file / script / page
      fileMenu: null, // 'ext' / 'report'
      scriptOpen: false,
      code: '',
      typing: false,
      saved: false,
      reloaded: false,
      authorized: false,
      template: false,
      sidebar: false,
      formValues: {name: '山田 太郎', date: '2026-10-24', content: '先日はありがとうございました。'},
      edMenu: false,
      modal: null, // authreq / account / unverified / consent / deploy / approve / deployed
      unverifiedOpen: false,
      deployType: null,
      accessOpen: false,
      access: '自分のみ',
      copied: false,
      urlFilled: false,
      pageOpen: false,
      pageLoaded: false,
      done: false,
    };
  }

  // 承認の流れ（どちらのシナリオでも同じ）
  const consentSteps = (ch, project, next) => [
    {
      ch, act: 'account', label: 'クリックで自分のアカウントを選ぶ',
      hint: 'どのGoogleアカウントで承認するかを選びます。スクリプトを作った自分のアカウントを選びます。',
      explain: 'Googleで確認されていないアプリだという警告が出ました。自分で書いたスクリプトは審査を受けていないので、この画面が出ます。',
      run: (s) => { s.modal = 'unverified'; s.unverifiedOpen = false; },
    },
    {
      ch, act: 'advanced', label: 'クリックで「詳細」を開く',
      hint: '警告の下にある「詳細」を開くと、先へ進むリンクが出ます。',
      explain: `「${project}（安全ではないページ）に移動」というリンクが出ました。自分で書いたスクリプトなので、先へ進みます。`,
      run: (s) => { s.unverifiedOpen = true; },
    },
    {
      ch, act: 'goto', label: 'クリックで先へ進む',
      hint: '自分で書いた、または中身を理解したスクリプトのときだけ、先へ進みます。',
      explain: 'スクリプトに許可する権限の一覧が出ました。何ができるようになるのかを読んでから許可します。',
      run: (s) => { s.modal = 'consent'; },
    },
    {
      ch, act: 'allow', label: 'クリックで許可する',
      hint: '権限の一覧を読み、問題がなければ許可します。',
      explain: next,
      run: (s) => { s.modal = null; s.authorized = true; if (s.scene === 'sheet') s.modal = 'deployed'; },
    },
  ];

  const steps = [
    // ---- 1章 ----
    {
      ch: 1, act: 'menu-ext', label: 'クリックで「拡張機能」を開く',
      hint: `Googleドキュメント「${DOC_NAME}」を開いています。上のメニューの「拡張機能」から、このドキュメント専用のスクリプトを作ります。`,
      explain: '「拡張機能」のメニューが開きました。「Apps Script」から作ると、このドキュメントにくっついたコンテナバインド型になります。',
      run: (s) => { s.fileMenu = 'ext'; },
    },
    {
      ch: 1, act: 'apps-script', label: 'クリックで「Apps Script」を選ぶ',
      hint: '「Apps Script」を選ぶと、新しいタブでスクリプトのエディタが開きます。',
      explain: 'エディタが開きました。最初は空の関数 myFunction だけが入っています。',
      run: (s) => { s.fileMenu = null; s.scriptOpen = true; s.active = 'script'; s.code = 'function myFunction() {\n  \n}'; },
    },
    {
      ch: 1, act: 'code', label: 'クリックでコードを書く',
      hint: 'エディタの中身を、メニューを足すコードに書き換えます。',
      explain: 'onOpen はドキュメントを開いたときに自動で動く関数、showSidebar はメニューからフォームを開く関数です。この練習では Sidebar.html も用意済みとして進めます。',
      run: async (s, f) => { await f.type(REPORT_CODE); },
    },
    {
      ch: 1, act: 'save', label: 'クリックで保存する',
      hint: '書いたコードを保存します。保存しないと、ドキュメントに反映されません。',
      explain: '保存できました。次は、ドキュメントを開き直してメニューを出します。',
      run: (s) => { s.saved = true; },
    },
    // ---- 2章 ----
    {
      ch: 2, act: 'tab-file', label: 'クリックでドキュメントのタブに戻る',
      hint: 'ドキュメントのタブに戻ります。まだメニューは増えていません。',
      explain: 'onOpen は「開いたとき」に動くので、今のままではメニューは出ません。ページを再読み込みします。',
      run: (s) => { s.active = 'file'; },
    },
    {
      ch: 2, act: 'reload', label: 'クリックで再読み込み',
      hint: 'ブラウザーの再読み込みで、ドキュメントを開き直します。',
      explain: 'メニューの右端に「差し込み」が増えました。onOpen が動いて、メニューを足したからです。',
      run: async (s, f) => { s.reloaded = false; f.render(); await f.wait(500); s.reloaded = true; },
    },
    {
      ch: 2, act: 'menu-report', label: 'クリックで「差し込み」を開く',
      hint: '増えた「差し込み」のメニューを開きます。',
      explain: 'addItem で決めた「入力フォームを開く」が出ています。',
      run: (s) => { s.fileMenu = 'report'; },
    },
    {
      ch: 2, act: 'insert', label: 'クリックで入力フォームを開く',
      hint: '項目を選ぶと、showSidebar が動きます。',
      explain: '初めてなので「承認が必要です」と出ました。ドキュメントを書き換えるには、あなたの許可が要ります。',
      run: (s) => { s.fileMenu = null; s.modal = 'authreq'; },
    },
    {
      ch: 2, act: 'auth-continue', label: 'クリックで「続行」',
      hint: 'スクリプトに権限を与えるための確認を始めます。',
      explain: 'Googleアカウントを選ぶ画面が出ました。',
      run: (s) => { s.modal = 'account'; },
    },
    ...consentSteps(2, DOC_PROJECT, '承認が終わりました。承認の前の操作は取り消されているので、もう一度メニューから選びます。'),
    {
      ch: 2, act: 'menu-report', label: 'もう一度「差し込み」を開く',
      hint: '承認が済んだので、もう一度メニューを開きます。',
      explain: '同じ項目を選びます。',
      run: (s) => { s.fileMenu = 'report'; },
    },
    {
      ch: 2, act: 'insert', label: 'クリックで入力フォームを開く',
      hint: '今度は承認が済んでいるので、すぐに動きます。',
      explain: '右側にフォームが開きました。ここから本文の目印を埋めます。',
      run: (s) => { s.fileMenu = null; s.sidebar = true; },
    },
    {
      ch: 2, act: 'apply-form', label: '入力して「文書に差し込む」を押す',
      hint: '右の入力欄は書き換えられます。名前・日付・内容をすべて入力して差し込みます。',
      explain: '本文の目印が入力値に変わりました。次の文書は元の雛形をコピーして作ります。実際のGoogleドキュメントには作用しません。',
      run: (s) => {
        const fields = stage.querySelectorAll('[data-form-field]');
        fields.forEach(field => { s.formValues[field.dataset.formField] = field.value; });
        s.template = true;
      },
    },
    {
      ch: 2, act: 'confirm-doc', label: '文書を確認して次の章へ',
      hint: '左の本文に入力した内容が入りました。様は目印の外なので、そのまま残ります。',
      explain: '差し込みの練習が完了しました。次はスプレッドシートを使います。',
      run: () => {},
    },
    // ---- 3章 ----
    {
      ch: 3, act: 'menu-ext', label: 'クリックで「拡張機能」を開く',
      hint: `今度はスプレッドシート「${SHEET_NAME}」です。お知らせのシートを、URLで呼べるAPIにします。`,
      explain: 'スプレッドシートでも、同じ「拡張機能」→「Apps Script」から作ります。',
      run: (s) => { s.fileMenu = 'ext'; },
    },
    {
      ch: 3, act: 'apps-script', label: 'クリックで「Apps Script」を選ぶ',
      hint: 'このスプレッドシートにくっついたスクリプトを作ります。',
      explain: 'エディタが開きました。',
      run: (s) => { s.fileMenu = null; s.scriptOpen = true; s.active = 'script'; s.code = 'function myFunction() {\n  \n}'; s.saved = false; },
    },
    {
      ch: 3, act: 'code', label: 'クリックでコードを書く',
      hint: 'GETで呼ばれたときに動く doGet を書きます。',
      explain: 'doGet は、公開したURLが呼ばれると動きます。公開にチェックが入った行だけをJSONにして返します。',
      run: async (s, f) => { await f.type(API_CODE); },
    },
    {
      ch: 3, act: 'save', label: 'クリックで保存する',
      hint: 'デプロイの前に保存します。',
      explain: '保存できました。次はウェブアプリとして公開（デプロイ）します。',
      run: (s) => { s.saved = true; },
    },
    {
      ch: 3, act: 'deploy', label: 'クリックで「デプロイ」',
      hint: 'エディタ右上の「デプロイ」を押します。',
      explain: 'デプロイのメニューが開きました。初めて公開するので「新しいデプロイ」を選びます。',
      run: (s) => { s.edMenu = true; },
    },
    {
      ch: 3, act: 'new-deploy', label: 'クリックで「新しいデプロイ」',
      hint: '新しく公開の設定を作ります。',
      explain: '設定の画面が出ました。まず、どの種類で公開するかを選びます。',
      run: (s) => { s.edMenu = false; s.modal = 'deploy'; s.deployType = null; },
    },
    {
      ch: 3, act: 'gear', label: 'クリックで種類を選ぶ',
      hint: '「種類の選択」の横の歯車を押します。',
      explain: '公開の種類が並びました。',
      run: (s) => { s.deployType = 'choose'; },
    },
    {
      ch: 3, act: 'webapp', label: 'クリックで「ウェブアプリ」',
      hint: 'URLで呼べるようにするので「ウェブアプリ」を選びます。',
      explain: 'ウェブアプリの設定が出ました。「次のユーザーとして実行」は「自分」、アクセスできるユーザーは最初「自分のみ」です。',
      run: (s) => { s.deployType = 'webapp'; },
    },
    {
      ch: 3, act: 'access', label: 'クリックで選択肢を開く',
      hint: '「自分のみ」のままでは、ほかの人の画面から呼べません。',
      explain: '選択肢が開きました。',
      run: (s) => { s.accessOpen = true; },
    },
    {
      ch: 3, act: 'anyone', label: 'クリックで「全員」',
      hint: 'ログインしていない人の画面からも呼べるよう「全員」にします。',
      explain: '「全員」にしました。URLを知っていれば誰でも呼べるので、返すデータに個人情報を入れないようにします。',
      run: (s) => { s.accessOpen = false; s.access = '全員'; },
    },
    {
      ch: 3, act: 'do-deploy', label: 'クリックで「デプロイ」',
      hint: '設定ができたので公開します。',
      explain: '初めてなので、アクセスの承認を求められました。',
      run: (s) => { s.modal = 'approve'; },
    },
    {
      ch: 3, act: 'authorize', label: 'クリックで「アクセスを承認」',
      hint: 'スクリプトがスプレッドシートを読むための許可を与えます。',
      explain: 'アカウントを選ぶ画面が出ました。流れは2章と同じです。',
      run: (s) => { s.modal = 'account'; },
    },
    ...consentSteps(3, SHEET_PROJECT, 'デプロイが終わり、/exec で終わるウェブアプリのURLが表示されました。'),
    // ---- 4章 ----
    {
      ch: 4, act: 'copy', label: 'クリックでURLをコピー',
      hint: 'このURLが、HTMLの画面から呼ぶAPIの住所です。',
      explain: 'URLをコピーしました。',
      run: (s) => { s.copied = true; },
    },
    {
      ch: 4, act: 'deployed-ok', label: 'クリックで「完了」',
      hint: 'デプロイの画面を閉じ、画面側のHTMLを開きます。',
      explain: 'テキストエディタで、作例Aの index.html を開きました。API_URL がまだ空です。',
      run: (s) => { s.modal = null; s.app = 'notepad'; },
    },
    {
      ch: 4, act: 'url-line', label: 'クリックでURLを貼り付ける',
      hint: 'API_URL の行に、コピーしたURLを貼り付けます。',
      explain: 'API_URL に、ウェブアプリのURLが入りました。',
      run: (s) => { s.urlFilled = true; },
    },
    {
      ch: 4, act: 'save-open', label: 'クリックで保存してブラウザーで開く',
      hint: '保存して、ブラウザーで開きます。',
      explain: '画面の fetch がGASのURLを呼び、返ってきたJSONから一覧を作りました。チェックを入れていない下書きは出ていません。',
      run: async (s, f) => {
        s.app = 'browser'; s.pageOpen = true; s.active = 'page'; s.pageLoaded = false;
        f.render(); await f.wait(900); s.pageLoaded = true; s.done = true;
      },
    },
  ];

  /* ---------- 描画 ---------- */
  function fileTabLabel(s) { return s.scene === 'doc' ? DOC_NAME : SHEET_NAME; }

  function tabs(s) {
    const list = [`<span class="sim-tab ${s.active === 'file' ? 'is-active' : ''}" data-act="tab-file"><i class="${s.scene === 'sheet' ? 'is-sheet' : ''}"></i>${esc(fileTabLabel(s))}</span>`];
    if (s.scriptOpen) list.push(`<span class="sim-tab ${s.active === 'script' ? 'is-active' : ''}"><i class="is-script"></i>${esc(s.scene === 'doc' ? DOC_PROJECT : SHEET_PROJECT)}</span>`);
    if (s.pageOpen) list.push(`<span class="sim-tab ${s.active === 'page' ? 'is-active' : ''}"><i class="is-page"></i>お知らせ</span>`);
    return `<div class="sim-tabs">${list.join('')}</div>`;
  }

  function address(s) {
    let url = s.scene === 'doc' ? 'docs.google.com/document/d/1xYz…/edit' : 'docs.google.com/spreadsheets/d/1AbC…/edit';
    if (s.active === 'script') url = 'script.google.com/home/projects/1Pq…/edit';
    if (s.active === 'page') url = 'file:///C:/Users/you/Desktop/notice/index.html';
    return `<div class="sim-addr"><button type="button" tabindex="-1" aria-hidden="true">←</button><button type="button" data-act="reload" aria-label="再読み込み">⟳</button><span>${esc(url)}</span></div>`;
  }

  function fileMenuBar(s) {
    const items = ['ファイル', '編集', '表示', '挿入', '表示形式', 'ツール'].map((t) => `<span>${t}</span>`).join('');
    const extDrop = s.fileMenu === 'ext'
      ? '<div class="sim-dropdown"><span class="is-muted">アドオン</span><hr /><button type="button" data-act="apps-script">Apps Script</button></div>'
      : '';
    const ext = `<span class="sim-menu-wrap"><span class="sim-menu-item ${s.fileMenu === 'ext' ? 'is-open' : ''}" data-act="menu-ext">拡張機能</span>${extDrop}</span>`;
    const help = '<span>ヘルプ</span>';
    const hasReport = s.scene === 'doc' && s.reloaded && s.active === 'file';
    const reportDrop = s.fileMenu === 'report'
      ? '<div class="sim-dropdown is-right"><button type="button" data-act="insert">入力フォームを開く</button></div>'
      : '';
    const report = hasReport
      ? `<span class="sim-menu-wrap"><span class="sim-menu-item is-added ${s.fileMenu === 'report' ? 'is-open' : ''}" data-act="menu-report">差し込み</span>${reportDrop}</span>`
      : '';
    return `<div class="sim-menubar">${items}${ext}${help}${report}</div>`;
  }

  function docView(s) {
    const v = s.formValues;
    const page = s.template
      ? `<p>${esc(v.name)}様</p><p>${esc(v.date)}</p><p style="white-space:pre-wrap">${esc(v.content)}</p>`
      : '<p>{名前}様</p><p>{日付}</p><p>{内容}</p>';
    const panel = s.sidebar ? `<aside class="sim-doc-panel"><strong>文書への差し込み</strong>
      <label>名前<input data-form-field="name" value="${esc(v.name)}" required></label>
      <label>日付<input data-form-field="date" type="date" value="${esc(v.date)}" required></label>
      <label>内容<textarea data-form-field="content" required>${esc(v.content)}</textarea></label>
      ${s.template ? '<p role="status">差し込みました。</p><button type="button" data-act="confirm-doc">確認して次の章へ</button>' : '<button type="button" data-act="apply-form">文書に差し込む</button>'}</aside>` : '';
    return `<div class="sim-app-head"><span class="sim-app-icon"></span><span class="sim-app-title">${esc(DOC_NAME)}</span></div>${fileMenuBar(s)}<div class="sim-doc-workspace"><div class="sim-docpage">${page}</div>${panel}</div>`;
  }

  function sheetView(s) {
    const rows = [
      ['日付', 'タイトル', '本文', '公開'],
      ['2026/10/14', '秋の勉強会のお知らせ', '10月25日に開きます。', '☑'],
      ['2026/10/16', '資料を公開しました', '第3回のスライドです。', '☑'],
      ['2026/10/17', '（下書き）次回の日程', '調整中', '☐'],
    ];
    const body = rows.map((r, i) => `<tr><th>${i + 1}</th>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="sim-app-head"><span class="sim-app-icon is-sheet"></span><span class="sim-app-title">${esc(SHEET_NAME)}</span></div>${fileMenuBar(s)}
      <div class="sim-sheet"><table><thead><tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="sim-sheet-tabs"><span>お知らせ</span></div>`;
  }

  function editorView(s) {
    const name = s.scene === 'doc' ? DOC_PROJECT : SHEET_PROJECT;
    const deployBtn = s.scene === 'sheet' ? '<button type="button" class="is-primary" data-act="deploy">デプロイ ▾</button>' : '';
    const menu = s.edMenu ? '<div class="sim-ed-menu"><button type="button" data-act="new-deploy">新しいデプロイ</button><span class="is-muted">デプロイをテスト</span><span class="is-muted">デプロイを管理</span></div>' : '';
    const caret = s.typing ? '<span class="caret"></span>' : '';
    return `<div class="sim-editor">
      <div class="sim-ed-side"><p>ファイル</p><span>コード.gs</span>${s.scene === 'doc' ? '<span>Sidebar.html</span>' : ''}</div>
      <div class="sim-ed-main">
        <div class="sim-ed-bar"><span class="sim-ed-name">${esc(name)}</span><button type="button" data-act="save" aria-label="プロジェクトを保存">💾 保存</button><button type="button" tabindex="-1">▷ 実行</button>${deployBtn}</div>
        <div class="sim-ed-wrap"><pre class="sim-ed-code" data-act="code" id="sim-code">${esc(s.code)}${caret}</pre>${menu}</div>
        <div class="sim-ed-status">${s.saved ? 'プロジェクトを保存しました。' : ''}</div>
      </div></div>`;
  }

  function pageView(s) {
    if (!s.pageLoaded) return '<div class="sim-page"><h5>お知らせ</h5><p class="sim-loading">読み込んでいます…</p></div>';
    return `<div class="sim-page"><h5>お知らせ</h5><ul>
      <li><time>2026-10-14</time><b>秋の勉強会のお知らせ</b><br />10月25日に開きます。</li>
      <li><time>2026-10-16</time><b>資料を公開しました</b><br />第3回のスライドです。</li></ul></div>`;
  }

  function modalView(s) {
    const project = s.scene === 'doc' ? DOC_PROJECT : SHEET_PROJECT;
    const scope = s.scene === 'doc'
      ? '<li>Google ドキュメントのドキュメントの表示、編集、作成、削除</li>'
      : '<li>Google スプレッドシートのすべてのスプレッドシートの参照、編集、作成、削除</li>';
    switch (s.modal) {
      case 'authreq':
        return `<div class="sim-modal"><h4>承認が必要です</h4><p>このプロジェクトで作成されたスクリプトが、あなたのデータへのアクセスを求めています。</p><div class="sim-actions"><button type="button" tabindex="-1">キャンセル</button><button type="button" class="is-primary" data-act="auth-continue">続行</button></div></div>`;
      case 'account':
        return `<div class="sim-modal"><p class="sim-google">Google</p><h4>アカウントの選択</h4><p>「${esc(project)}」に移動</p><button type="button" class="sim-account" data-act="account"><i>Y</i><span>${ACCOUNT.name}<small>${ACCOUNT.mail}</small></span></button></div>`;
      case 'unverified': {
        const more = s.unverifiedOpen
          ? `<p>このアプリはGoogleで確認されていません。開発者を信頼できる場合のみ続行してください。</p><button type="button" class="sim-linkbtn" data-act="goto">${esc(project)}（安全ではないページ）に移動</button>`
          : '<button type="button" class="sim-linkbtn" data-act="advanced">詳細</button>';
        return `<div class="sim-modal"><p class="sim-google">Google</p><h4 class="sim-warn">このアプリは Google で確認されていません</h4><p>このアプリは、Google アカウントの機密情報へのアクセスをリクエストしています。</p>${more}<div class="sim-actions"><button type="button" class="is-primary" tabindex="-1">安全なページに戻る</button></div></div>`;
      }
      case 'consent':
        return `<div class="sim-modal"><p class="sim-google">Google</p><h4>「${esc(project)}」が Google アカウントへのアクセスを求めています</h4><p>${ACCOUNT.mail}</p><p>許可すると、このスクリプトは次のことができるようになります。</p><ul class="sim-scopes">${scope}</ul><div class="sim-actions"><button type="button" tabindex="-1">キャンセル</button><button type="button" class="is-primary" data-act="allow">許可</button></div></div>`;
      case 'deploy': {
        let typeArea = '';
        if (s.deployType === 'choose') {
          typeArea = '<div class="sim-options"><button type="button" data-act="webapp">ウェブアプリ</button><button type="button" tabindex="-1">API 実行可能ファイル</button><button type="button" tabindex="-1">アドオン</button><button type="button" tabindex="-1">ライブラリ</button></div>';
        }
        let form = '';
        if (s.deployType === 'webapp') {
          const opts = s.accessOpen
            ? '<div class="sim-options"><button type="button" tabindex="-1">自分のみ</button><button type="button" tabindex="-1">Google アカウントを持つ全員</button><button type="button" data-act="anyone">全員</button></div>'
            : '';
          form = `<div class="sim-form"><label>説明<span>お知らせAPI</span></label><p><b>ウェブアプリ</b></p><label>次のユーザーとして実行<span>自分（${ACCOUNT.mail}）</span></label><label>アクセスできるユーザー<button type="button" class="sim-select" data-act="access">${esc(s.access)}</button>${opts}</label></div>`;
        }
        const label = s.deployType === 'webapp' ? 'ウェブアプリ' : '種類の選択';
        const canDeploy = s.deployType === 'webapp';
        return `<div class="sim-modal"><h4>新しいデプロイ</h4><div class="sim-type"><span>${label}</span><button type="button" class="sim-gear" data-act="gear" aria-label="デプロイの種類を選ぶ">⚙</button></div>${typeArea}${form}<div class="sim-actions"><button type="button" tabindex="-1">キャンセル</button><button type="button" class="is-primary" ${canDeploy ? 'data-act="do-deploy"' : 'tabindex="-1"'}>デプロイ</button></div></div>`;
      }
      case 'approve':
        return `<div class="sim-modal"><h4>新しいデプロイ</h4><p>ウェブアプリでは、データへのアクセスを承認する必要があります。</p><div class="sim-actions"><button type="button" class="is-primary" data-act="authorize">アクセスを承認</button></div></div>`;
      case 'deployed':
        return `<div class="sim-modal"><h4>新しいデプロイを作成しました</h4><p>バージョン 1</p><p>ウェブアプリ<br /><span class="sim-url">${WEBAPP_URL}</span><button type="button" data-act="copy">${s.copied ? '<span class="sim-copied">コピーしました ✓</span>' : 'コピー'}</button></p><div class="sim-actions"><button type="button" class="is-primary" data-act="deployed-ok">完了</button></div></div>`;
      default:
        return '';
    }
  }

  function notepadView(s) {
    const urlLine = s.urlFilled
      ? `<span class="sim-line is-filled" data-act="url-line">const API_URL = '${WEBAPP_URL}';</span>`
      : '<span class="sim-line" data-act="url-line">const API_URL = \'\';</span>';
    return `<div class="sim-browser"><div class="sim-notepad">
      <div class="sim-notepad__bar"><b>index.html - テキストエディタ</b><button type="button" class="is-primary" data-act="save-open">保存してブラウザーで開く</button></div>
      <pre>${esc('<h1>お知らせ</h1>\n<ul id="list"></ul>\n<script>\n')}  <span>// デプロイで表示された /exec で終わるURL</span>\n  ${urlLine}\n${esc('  async function load() {\n    const res = await fetch(API_URL);\n    const data = await res.json();\n    // data.items を1件ずつ <li> にする\n  }\n  load();\n</script>')}</pre>
    </div></div>`;
  }

  function desktop(s) {
    if (s.app === 'notepad') return notepadView(s);
    let body;
    if (s.active === 'script') body = editorView(s);
    else if (s.active === 'page') body = pageView(s);
    else body = s.scene === 'doc' ? docView(s) : sheetView(s);
    const modal = s.modal ? `<div class="sim-overlay">${modalView(s)}</div>` : '';
    return `<div class="sim-browser">${tabs(s)}${address(s)}<div class="sim-body" id="sim-body">${body}${modal}</div></div>`;
  }

  /* ---------- 進行 ---------- */
  let state = fresh();
  let index = 0;
  let token = 0;
  let busy = false;

  function sceneFor(ch) { return ch >= 3 ? 'sheet' : 'doc'; }

  function render() {
    const body = stage.querySelector('#sim-body');
    const scroll = body ? body.scrollTop : 0;
    stage.innerHTML = desktop(state);
    const nextBody = stage.querySelector('#sim-body');
    if (nextBody) nextBody.scrollTop = scroll;
    const code = stage.querySelector('#sim-code');
    if (code && state.typing) code.scrollTop = code.scrollHeight;
  }

  function current() { return steps[index]; }

  function renderChapters() {
    const ch = current() ? current().ch : chapters.length;
    chapterList.innerHTML = chapters.map((name, i) => {
      const n = i + 1;
      const attrs = n === ch ? ' aria-current="step"' : '';
      return `<li><button type="button" data-chapter="${n}"${attrs} class="${n < ch ? 'is-done' : ''}">${n}. ${name}</button></li>`;
    }).join('');
  }

  function updateStatus() {
    const step = current();
    renderChapters();
    if (!step) {
      progressEl.textContent = `STEP ${chapters.length} / ${chapters.length}　完了`;
      taskEl.textContent = '練習はここまでです';
      hintEl.textContent = '本物の画面では、文言やボタンの位置が違うことがあります。実際に試すときは、表示を確かめながら進めてください。章の番号を押すと、好きなところからやり直せます。';
      guide.hidden = true;
      return;
    }
    const inChapter = steps.filter((s) => s.ch === step.ch);
    const n = inChapter.indexOf(step) + 1;
    progressEl.textContent = `STEP ${step.ch} / ${chapters.length}　操作 ${n} / ${inChapter.length}`;
    taskEl.textContent = chapterTitles[step.ch - 1];
    hintEl.textContent = step.hint;
  }

  function placeGuide(target) {
    const wrap = stage.parentElement.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    guide.hidden = false;
    guide.classList.remove('is-above');
    const gw = guide.offsetWidth;
    const gh = guide.offsetHeight;
    let left = rect.left - wrap.left + rect.width / 2 - 24;
    left = Math.max(6, Math.min(left, wrap.width - gw - 6));
    let top = rect.bottom - wrap.top + 12;
    if (top + gh > wrap.height - 4) {
      top = rect.top - wrap.top - gh - 12;
      guide.classList.add('is-above');
    }
    guide.style.left = `${left}px`;
    guide.style.top = `${Math.max(4, top)}px`;
    const ax = rect.left - wrap.left + rect.width / 2 - left;
    guide.style.setProperty('--ax', `${Math.max(14, Math.min(ax, gw - 14))}px`);
  }

  function mark() {
    stage.querySelectorAll('.guided').forEach((el) => el.classList.remove('guided'));
    const step = current();
    if (!step || busy) { guide.hidden = true; return; }
    const target = stage.querySelector(`[data-act="${step.act}"]`);
    if (!target) { guide.hidden = true; return; }
    target.classList.add('guided');
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    guide.textContent = step.label;
    placeGuide(target);
  }

  function tools(myToken, animate) {
    const alive = () => myToken === token;
    return {
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, animate && alive() ? ms : 0)),
      render: () => { if (alive()) render(); },
      type: async (text) => {
        if (!animate) { state.code = text; return; }
        state.typing = true;
        state.code = '';
        const chunk = 6;
        for (let i = 0; i < text.length && alive(); i += chunk) {
          state.code = text.slice(0, i + chunk);
          render();
          await new Promise((resolve) => setTimeout(resolve, 16));
        }
        state.code = text;
        state.typing = false;
      },
    };
  }

  async function runStep() {
    const step = current();
    if (!step || busy) return;
    if (step.act === 'apply-form') {
      const invalid = [...stage.querySelectorAll('[data-form-field]')].find(field => !field.value.trim() || !field.checkValidity());
      if (invalid) { invalid.focus(); invalid.reportValidity(); return; }
    }
    busy = true;
    const myToken = token;
    guide.hidden = true;
    stage.querySelectorAll('.guided').forEach((el) => el.classList.remove('guided'));
    await step.run(state, tools(myToken, !reduceMotion));
    if (myToken !== token) return;
    busy = false;
    index += 1;
    explainEl.textContent = step.explain;
    // 3章に入るときはスプレッドシートの場面に切り替える
    if (current() && sceneFor(current().ch) !== state.scene) switchScene(current().ch);
    render();
    updateStatus();
    mark();
  }

  function switchScene(ch) {
    state = fresh();
    state.scene = sceneFor(ch);
  }

  function goTo(chapter) {
    token += 1;
    busy = false;
    state = fresh();
    index = 0;
    const first = steps.findIndex((s) => s.ch === chapter);
    const myTools = tools(token, false);
    for (let i = 0; i < first; i += 1) {
      if (sceneFor(steps[i].ch) !== state.scene) switchScene(steps[i].ch);
      steps[i].run(state, myTools);
    }
    if (sceneFor(chapter) !== state.scene) switchScene(chapter);
    index = first;
    explainEl.textContent = '';
    render();
    updateStatus();
    mark();
  }

  stage.addEventListener('click', (event) => {
    const step = current();
    if (!step || busy) return;
    const hit = event.target.closest('[data-act]');
    if (hit && hit.dataset.act === step.act && hit.classList.contains('guided')) {
      runStep();
      return;
    }
    guide.classList.remove('is-nudge');
    void guide.offsetWidth;
    guide.classList.add('is-nudge');
  });

  chapterList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chapter]');
    if (button) goTo(Number(button.dataset.chapter));
  });

  function tidy() {
    token += 1;
    busy = false;
    guide.hidden = true;
  }

  document.querySelectorAll('[data-open-lab]').forEach((button) => {
    button.addEventListener('click', () => {
      dialog.showModal();
      goTo(1);
    });
  });
  document.getElementById('close-lab').addEventListener('click', () => { tidy(); dialog.close(); });
  document.getElementById('reset-lab').addEventListener('click', () => goTo(1));
  dialog.addEventListener('cancel', tidy);
  window.addEventListener('resize', () => { if (dialog.open) mark(); });
  // 画面の中をスクロールしたら、案内の位置だけを合わせ直す
  stage.addEventListener('scroll', () => {
    const target = stage.querySelector('.guided');
    if (dialog.open && !busy && target) placeGuide(target);
  }, true);
})();
