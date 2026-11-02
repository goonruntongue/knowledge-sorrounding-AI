(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let data;
  let mode = 'loading';
  let previous;
  const isFile = location.protocol === 'file:';
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 12) throw Error('12か月のデータが必要です');
    const ids = new Set();
    for (let month = 1; month <= 12; month++) {
      const items = input[String(month)];
      if (!Array.isArray(items) || items.length !== 5) throw Error(`${month}月は5件必要です`);
      for (const item of items) {
        if (typeof item.id !== 'string' || ids.has(item.id) || typeof item.message !== 'string' || !item.message || typeof item.alt !== 'string' || !/^images\/fortune-\d{2}-\d{2}\.png$/.test(item.image || '')) throw Error('データの形式が正しくありません');
        ids.add(item.id);
      }
    }
    return input;
  }
  function sync() { $('draw').disabled = mode === 'loading' || mode === 'error' || !$('month').value; }
  function ready() {
    $('status').textContent = '誕生月を選んで、おたよりを受け取りましょう。';
    sync();
  }
  async function init() {
    if (isFile) {
      mode = 'error';
      $('file-mode').hidden = false;
      $('status').textContent = 'fortune.jsonを選ぶと、見た目を試せます。';
      $('mode-note').textContent = 'ファイルモード：JSONを読み込み、ブラウザ内で抽選します。API通信ではありません。';
      $('request-label').textContent = 'LOCAL FILE / fortune.json';
      return;
    }
    try {
      const response = await fetch('fortune.json', {cache:'no-store', signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw Error('JSONを取得できません');
      data = validate(await response.json());
      // Only the bundled Node server has the dynamic endpoint. A static host
      // still supports a clearly labeled JSON-fetch prototype.
      const probe = await fetch('fortune.api?month=1', {cache:'no-store', signal:AbortSignal.timeout(5000)}).catch(() => null);
      const type = probe?.headers.get('content-type') || '';
      const payload = probe?.ok && type.includes('application/json') ? await probe.json().catch(()=>null) : null;
      mode = payload?.month === 1 && data['1'].some(item => item.id === payload.id) ? 'api' : 'static';
      $('mode-note').textContent = mode === 'api' ? 'APIモード：GET /fortune.api?month=選んだ月 を送信し、サーバーが抽選した1件を受け取ります。' : '静的サーバーモード：fortune.jsonを実際に取得し、抽選はブラウザ内で行います。付属Nodeサーバーなら抽選もAPIに任せられます。';
      if (mode === 'static') $('request-label').textContent = 'GET /fortune.json → ブラウザ内で抽選';
      ready();
    } catch {
      mode = 'error';
      $('status').textContent = 'データを読み込めませんでした。付属サーバーを起動し、ページを開き直してください。';
      $('mode-note').textContent = 'データの取得に失敗しています。';
      sync();
    }
  }
  $('month').addEventListener('change', () => {
    if (mode === 'error' || mode === 'loading') return;
    sync();
    $('draw').innerHTML = 'おたよりを受け取る <span aria-hidden="true">→</span>';
    $('status').textContent = `${$('month').value}月を選びました。ボタンで新しいおたよりを受け取れます。`;
  });
  $('json-file').addEventListener('change', async event => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      data = validate(JSON.parse(await file.text()));
      mode = 'file';
      ready();
    } catch (error) {
      mode = 'error';
      $('status').textContent = `読み込めませんでした：${error.message}`;
      sync();
    }
  });
  async function render(result) {
    const image = new Image();
    image.src = result.image;
    await image.decode();
    $('fortune-image').src = result.image;
    $('fortune-image').alt = result.alt;
    $('fortune-message').textContent = result.message;
    $('result-title').textContent = `${result.month}月生まれのあなたへ`;
    $('month-badge').textContent = `${result.month}月のおたより`;
    $('result-id').textContent = `LETTER ${result.id} / 5 LETTERS IN THIS MONTH`;
    $('response-json').textContent = JSON.stringify(result, null, 2);
    $('image-stage').classList.remove('arrival');
    void $('image-stage').offsetWidth;
    $('image-stage').classList.add('arrival');
    $('fortune-message').classList.remove('arrival');
    void $('fortune-message').offsetWidth;
    $('fortune-message').classList.add('arrival');
  }
  $('fortune-form').addEventListener('submit', async event => {
    event.preventDefault();
    const month = Number($('month').value);
    if (!month || !data || $('draw').disabled) return;
    $('draw').disabled = true;
    $('month').disabled = true;
    $('status').textContent = 'おたよりを受け取っています…';
    try {
      let result;
      if (mode === 'api') {
        const query = new URLSearchParams({month:String(month)});
        if (previous?.month === month) query.set('exclude', previous.id);
        const endpoint = `fortune.api?${query}`;
        $('request-label').textContent = `GET /${endpoint}`;
        $('endpoint-link').href = `fortune.api?month=${month}`;
        $('endpoint-link').hidden = false;
        const response = await fetch(endpoint, {cache:'no-store', signal:AbortSignal.timeout(10000)});
        if (!response.ok) throw Error('APIへの接続に失敗しました');
        result = await response.json();
        const expected = data[String(month)].find(item => item.id === result.id);
        if (result.month !== month || !expected || result.image !== expected.image || result.message !== expected.message) throw Error('想定と異なるレスポンスです');
      } else {
        const items = data[String(month)].filter(item => previous?.month !== month || item.id !== previous.id);
        result = {month,...items[Math.floor(Math.random()*items.length)]};
      }
      await render(result);
      previous = result;
      $('status').textContent = `${month}月のおたよりが届きました。もう一度押すと別のおたよりを受け取れます。`;
      $('draw').innerHTML = 'もうひとつ受け取る <span aria-hidden="true">↻</span>';
    } catch (error) {
      $('status').textContent = `受け取れませんでした。${error.message}。再度お試しください。`;
    } finally {
      $('month').disabled = false;
      sync();
    }
  });
  init();
})();
