(() => {
  'use strict';

  const form = document.getElementById('fortune-form');
  if (!form) return;

  const month = document.getElementById('fortune-month');
  const draw = document.getElementById('draw-fortune');
  const status = document.getElementById('fortune-status');
  const image = document.getElementById('fortune-image');
  const badge = document.getElementById('fortune-badge');
  const title = document.getElementById('fortune-result-title');
  const message = document.getElementById('fortune-message');
  const resultId = document.getElementById('fortune-result-id');
  const output = document.getElementById('fortune-json-output');
  let fortunes;
  let previousId;

  const validData = (data) => {
    if (!data || typeof data !== 'object') throw new Error('JSONの形式が正しくありません');
    for (let index = 1; index <= 12; index += 1) {
      if (!Array.isArray(data[index]) || data[index].length !== 5) throw new Error('おたよりの件数が正しくありません');
    }
    return data;
  };

  const sync = () => {
    draw.disabled = !fortunes || !month.value;
  };

  fetch('fortune-mock/fortune.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      fortunes = validData(data);
      month.disabled = false;
      status.textContent = 'JSONを受け取りました。誕生月を選んでみましょう。';
      sync();
    })
    .catch(() => {
      status.textContent = 'JSONを読み込めませんでした。通信環境を確認して、ページを開き直してください。';
    });

  month.addEventListener('change', () => {
    sync();
    status.textContent = `${month.value}月を選びました。ボタンでおたよりを受け取れます。`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const selectedMonth = Number(month.value);
    if (!fortunes || !selectedMonth) return;
    const candidates = fortunes[selectedMonth].filter((item) => item.id !== previousId);
    const result = candidates[Math.floor(Math.random() * candidates.length)];
    draw.disabled = true;
    status.textContent = 'JSONからおたよりを選んでいます…';
    try {
      const nextImage = new Image();
      nextImage.src = `fortune-mock/${result.image}`;
      await nextImage.decode();
      image.src = nextImage.src;
      image.alt = result.alt;
      badge.textContent = `${selectedMonth}月のおたより`;
      title.textContent = `${selectedMonth}月生まれのあなたへ`;
      message.textContent = result.message;
      resultId.textContent = `LETTER ${result.id} / 5 LETTERS IN THIS MONTH`;
      output.textContent = JSON.stringify({ month: selectedMonth, ...result }, null, 2);
      previousId = result.id;
      draw.textContent = 'もうひとつ受け取る ↻';
      status.textContent = `${selectedMonth}月のおたよりが届きました。`;
    } catch {
      status.textContent = '画像を表示できませんでした。もう一度お試しください。';
    } finally {
      sync();
    }
  });
})();
