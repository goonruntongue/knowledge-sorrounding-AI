(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

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
  const guideLabel = dialog.querySelector('.guide-label');
  const labAction = $('lab-action');
  const nodeScreen = $('node-download-sim');
  const vscodeScreen = dialog.querySelector('.vscode-sim');
  const loader = $('lab-loader');
  const loaderTitle = $('lab-loader-title');
  const loaderDetail = $('lab-loader-detail');
  const loaderBar = $('lab-loader-bar');
  const loaderPercent = $('lab-loader-percent');
  let opener;
  let step = 0;
  let isTransitioning = false;
  const stages = [
    ['Node.jsをインストールする', 'Node.jsをインストールする', 'Node.jsを使える状態にしました。実際には公式サイトからLTS版をインストールします。'],
    ['作業用フォルダーを用意する', 'sample-apiフォルダーを作る', 'APIのファイルをまとめる作業用フォルダーを用意しました。'],
    ['VS Codeでフォルダーを開く', 'VS Codeにフォルダーを紐付ける', 'VS Codeに sample-api フォルダーを開きました。左のエクスプローラーでファイルを管理できます。'],
    ['ターミナルで準備する', '初期化してExpressを追加する', 'npm init -y でプロジェクト情報を作り、npm install express でAPIを作りやすくする道具を追加しました。'],
    ['JSONの中身を用意する', 'data.jsonを作る', 'APIが返すデータを data.json に用意しました。JSONは、名前と値を組にしたデータです。'],
    ['サーバーのコードを書く', 'server.jsを書く', 'server.js は、お願いを受け取り、data.json の中身を返すプログラムです。'],
    ['サーバーを起動する', 'サーバーを起動する', 'Node.jsで server.js を実行すると、localhost:3000 でお願いを待てる状態になります。'],
    ['APIにお願いする', 'JSONを受け取る', 'GET /api/hello に接続すると、サーバーがJSONを返しました。実際の通信ではなく学習用の再現です。'],
    ['Webアプリとして公開する準備', '公開用の設定を見る', 'localhostの次は、GitHubに保存したコードをNode.js対応の公開先へ接続します。公開先が指定するPORTを使って起動する設定にします。']
  ];
  const dataJson = '{\n  "message": "こんにちは、API！"\n}';
  const serverCode = `const express = require('express');
const data = require('./data.json');
const app = express();
const port = process.env.PORT || 3000;

app.get('/api/hello', (req, res) => {
  res.json(data);
});

app.listen(port, '0.0.0.0', () => {
  console.log('http://localhost:' + port + '/api/hello');
});`;

  function setPanel(stage) {
    const files = [];
    if (stage >= 4) files.push('package.json');
    if (stage >= 5) files.push('data.json');
    if (stage >= 6) files.push('server.js');
    const currentFile = stage < 4 ? '準備' : stage === 4 ? '新規ファイル' : stage === 5 ? 'data.json' : 'server.js';
    $('lab-file-tree').innerHTML = files.length
      ? files.map((file) => `<li class="${file === currentFile ? 'is-selected' : ''}">${file}</li>`).join('')
      : '<li class="is-empty">（まだファイルはありません）</li>';
    $('lab-tab').textContent = currentFile;
    $('lab-breadcrumb').textContent = currentFile;
    $('lab-code').textContent = stage === 0
      ? '// まずはNode.jsをインストールします。\n// Node.js は、JavaScriptをブラウザの外で動かす実行環境です。'
      : stage === 1
        ? '// 作業用フォルダー sample-api を用意します。\n// APIに必要なファイルを、この中にまとめます。'
        : stage === 2
          ? '// VS Code で「フォルダーを開く」を選び、\n// sample-api を開きます。'
          : stage === 3
            ? '// ターミナルで、プロジェクトを初期化し、\n// Expressを追加します。'
            : stage === 4
              ? '// 「data.jsonを作る」を押すと、ここにJSONが入ります。'
              : stage === 5
        ? dataJson
        : serverCode;
    $('lab-terminal').textContent = stage === 0
      ? 'Node.js はまだインストールされていません。'
      : stage === 1
        ? 'PS C:\\Users\\you\\Desktop> mkdir sample-api\n（まだ実行していません）'
        : stage === 2
          ? 'VS Codeで sample-api フォルダーを開きます。'
          : stage === 3
            ? 'PS C:\\Users\\you\\Desktop\\sample-api> npm init -y\nPS C:\\Users\\you\\Desktop\\sample-api> npm install express\n（まだ実行していません）'
            : stage === 4
              ? 'PS C:\\Users\\you\\Desktop\\sample-api> npm init -y\nPS C:\\Users\\you\\Desktop\\sample-api> npm install express\nadded packages.\n\nファイルを作る準備ができました。'
              : stage === 5
                ? 'PS C:\\Users\\you\\Desktop\\sample-api>\ndata.json を保存しました。'
                : stage === 6
                  ? 'PS C:\\Users\\you\\Desktop\\sample-api> node server.js\n（まだ実行していません）'
                  : stage === 7
                    ? 'PS C:\\Users\\you\\Desktop\\sample-api> node server.js\nhttp://localhost:3000/api/hello\nサーバーを起動しました。'
                    : stage === 8
                      ? '1. GitHubへコードを保存\n2. Renderで New → Web Service\n3. Build Command: npm install\n4. Start Command: node server.js\n\n公開URL: https://your-api.onrender.com/api/hello'
                      : 'GET https://your-api.onrender.com/api/hello  200 OK\nContent-Type: application/json\n\n{\n  "message": "こんにちは、API！"\n}';
  }

  function render() {
    const complete = step >= stages.length;
    const isDownload = step === 0 && !complete;
    $('lab-progress').textContent = complete ? `${stages.length} / ${stages.length} 完了` : `${step + 1} / ${stages.length}`;
    nodeScreen.hidden = !isDownload;
    vscodeScreen.hidden = isDownload;
    labAction.hidden = complete || isDownload;
    guideLabel.hidden = complete || isDownload;
    setPanel(step);
    if (complete) {
      $('lab-task').textContent = 'ローカルから公開までの流れを確認しました！';
      $('lab-explanation').textContent = 'まずはlocalhostでJSONが返ることを確認し、次にGitHubとNode.js対応の公開先を使ってWebアプリとして公開します。';
      return;
    }
    const [title, action] = stages[step];
    $('lab-task').textContent = title;
    labAction.textContent = action;
    if (!isDownload && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      vscodeScreen.classList.remove('is-updating');
      void vscodeScreen.offsetWidth;
      vscodeScreen.classList.add('is-updating');
    }
  }

  function advanceWithLoading(isNodeDownload = false) {
    if (isTransitioning) return;
    isTransitioning = true;
    const labels = isNodeDownload
      ? ['ダウンロードを開始しています…', 'セットアップを確認しています…', 'Node.jsを使う準備ができました']
      : ['操作を実行しています…', '画面の変更を確認しています…', '次のステップを準備できました'];
    loaderTitle.textContent = isNodeDownload ? 'Node.jsをダウンロードしています…' : '変更を反映しています…';
    loader.hidden = false;
    dialog.setAttribute('aria-busy', 'true');
    let progress = 0;
    const timer = window.setInterval(() => {
      progress = Math.min(progress + 8, 100);
      loaderBar.style.width = `${progress}%`;
      loaderPercent.textContent = `${progress}%`;
      loaderDetail.textContent = labels[progress < 40 ? 0 : progress < 80 ? 1 : 2];
      if (progress < 100) return;
      window.clearInterval(timer);
      window.setTimeout(() => {
        $('lab-explanation').textContent = stages[step][2];
        step += 1;
        render();
        loader.hidden = true;
        dialog.removeAttribute('aria-busy');
        isTransitioning = false;
        if (step === stages.length) $('reset-lab').focus();
      }, 220);
    }, 70);
  }

  document.querySelectorAll('[data-open-lab]').forEach((button) => button.addEventListener('click', () => {
    opener = button;
    step = 0;
    $('lab-explanation').textContent = '';
    loader.hidden = true;
    loaderBar.style.width = '0%';
    loaderPercent.textContent = '0%';
    render();
    dialog.showModal();
    document.body.classList.add('lab-open');
    $('close-lab').focus();
  }));
  $('close-lab').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('lab-open');
    opener?.focus();
  });
  $('node-download-action').addEventListener('click', () => advanceWithLoading(true));
  labAction.addEventListener('click', () => advanceWithLoading());
  $('reset-lab').addEventListener('click', () => {
    step = 0;
    $('lab-explanation').textContent = '';
    render();
    $('node-download-action').focus();
  });

  const top = $('toTop');
  const update = () => top.classList.toggle('is-visible', window.scrollY > 360);
  window.addEventListener('scroll', update, { passive: true });
  update();
  top.addEventListener('click', () => window.scrollTo({
    top: 0,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  }));
})();
