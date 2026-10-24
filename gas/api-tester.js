// 07「このページで試す」：入力されたウェブアプリのURLを呼び、notice.html と同じようにお知らせを一覧にする
(() => {
  const root = document.getElementById('notice-tester');
  if (!root) return;

  const form = root.querySelector('form');
  const input = form.querySelector('input[name="url"]');
  const button = form.querySelector('button');
  const status = root.querySelector('.api-tester__status');
  const list = root.querySelector('.api-tester__list');
  // GASのウェブアプリのURLだけを受け付ける
  const pattern = /^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[\w-]+\/exec$/;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = input.value.trim();
    list.replaceChildren();
    if (!pattern.test(url)) {
      status.textContent = '「https://script.google.com/macros/s/」で始まり、「/exec」で終わるURLを入れてください。';
      return;
    }
    button.disabled = true;
    status.textContent = '読み込んでいます…';
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error('unexpected');
      status.textContent = data.items.length
        ? `${data.items.length}件のお知らせを読み込みました。`
        : 'お知らせはまだありません。シートの「公開」にチェックが入っているか確かめてください。';
      data.items.forEach((item) => {
        const li = document.createElement('li');
        const time = document.createElement('time');
        const title = document.createElement('b');
        const body = document.createElement('span');
        time.textContent = String(item.date ?? '');
        title.textContent = String(item.title ?? '');
        body.textContent = String(item.body ?? '');
        li.append(time, title, body);
        list.append(li);
      });
    } catch (error) {
      status.textContent = '読み込めませんでした。URLと、デプロイの「アクセスできるユーザー」が「全員」になっているかを確かめてください。';
    } finally {
      button.disabled = false;
    }
  });
})();
