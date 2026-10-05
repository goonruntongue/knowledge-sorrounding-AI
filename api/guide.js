(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const endpoint = () => `https://jsonplaceholder.typicode.com/posts/${$('post-id').value}`;
  $('post-id').addEventListener('change', () => {
    $('endpoint').textContent = endpoint();
    $('open-endpoint').href = endpoint();
    $('fetch-status').textContent = '接続先を変更しました。取得ボタンで新しい投稿を読み込みます。';
  });
  $('fetch-post').addEventListener('click', async () => {
    const button = $('fetch-post');
    const url = endpoint();
    button.disabled = true;
    $('post-id').disabled = true;
    $('fetch-status').textContent = 'リクエストを送っています…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (typeof data.title !== 'string' || typeof data.body !== 'string') throw new Error('想定と異なるデータです');
      $('post-badge').textContent = `POST ${data.id} / USER ${data.userId}`;
      $('post-title').textContent = data.title;
      $('post-body').textContent = data.body;
      $('json-output').textContent = JSON.stringify(data, null, 2);
      $('fetch-status').textContent = `HTTP ${response.status}：投稿${data.id}のJSONを受け取りました。`;
    } catch (error) {
      $('fetch-status').textContent = '取得できませんでした。通信環境やブラウザの制限を確認し、再度お試しください。ブラウザでJSONを直接開く方法も試せます。';
      $('post-title').textContent = 'まだ新しい投稿は届いていません';
      $('post-body').textContent = '外部APIに接続できなかったため、架空の成功結果は表示していません。';
      $('post-badge').textContent = 'REQUEST FAILED';
      $('json-output').textContent = '取得できませんでした。再試行すると、実際に届いたJSONを確認できます。';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      $('post-id').disabled = false;
    }
  });
  $('copy-prompt').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('ai-prompt').textContent);
      $('copy-status').textContent = '依頼文をコピーしました。';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('ai-prompt'));
      selection.removeAllRanges();
      selection.addRange(range);
      $('ai-prompt').focus();
      $('copy-status').textContent = '依頼文を選択しました。端末のコピー操作でコピーしてください。';
    }
  });
  const dialog = $('api-lab');
  let opener;
  let step = 0;
  const stages = [
    ['Node.jsの準備', 'まだJavaScriptを実行する環境がありません。', 'Node.jsの準備を再現する', 'Node.jsの準備ができました。実際の作業では公式インストーラーを使います。'],
    ['窓口を書く', '作業フォルダ\n└ server.js（まだ未作成）', 'server.jsの作成を再現する', 'GET /api/hello にJSONを返すコードを用意しました。'],
    ['サーバーを起動する', '> node server.js\n（まだ実行していません）', '起動コマンドを再現する', 'サーバーが待ち受ける状態になりました。ファイルを作るだけでは応答しません。'],
    ['ブラウザから接続する', 'http://localhost:3000/api/hello\n（まだ接続していません）', 'エンドポイントへの接続を再現する', '窓口に接続し、JSONを受け取りました。実際の通信ではなく学習用の再現です。']
  ];
  function render() {
    $('lab-progress').textContent = step < stages.length ? `${step + 1} / 4` : '4 / 4 完了';
    $('lab-action').hidden = step >= stages.length;
    if (step >= stages.length) {
      $('lab-task').textContent = 'データが返ってきました！';
      $('lab-screen').textContent = '{ "message": "こんにちは、API！" }';
      dialog.querySelector('.guide-label').hidden = true;
      return;
    }
    dialog.querySelector('.guide-label').hidden = false;
    const [title, screen, action] = stages[step];
    $('lab-task').textContent = title;
    $('lab-screen').textContent = screen;
    $('lab-action').textContent = action;
  }
  document.querySelectorAll('[data-open-lab]').forEach((button) => button.addEventListener('click', () => {
    opener = button;
    step = 0;
    $('lab-explanation').textContent = '';
    render();
    dialog.showModal();
    document.body.classList.add('lab-open');
    $('close-lab').focus();
  }));
  $('close-lab').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('lab-open'); opener?.focus(); });
  // Native dialog cancel behavior keeps Escape available.
  $('lab-action').addEventListener('click', () => {
    $('lab-explanation').textContent = stages[step][3];
    step += 1;
    render();
    if (step === stages.length) $('reset-lab').focus();
  });
  $('reset-lab').addEventListener('click', () => { step = 0; $('lab-explanation').textContent = ''; render(); $('lab-action').focus(); });
  const top = $('toTop');
  const update = () => top.classList.toggle('is-visible', window.scrollY > 360);
  window.addEventListener('scroll', update, { passive: true });
  update();
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }));
})();
