const toTop = document.getElementById('toTop');

if (window.jQuery && window.jQuery.fn.outliner) {
  window.jQuery('.language-card h3, .language-card .badge, .language-card p').outliner({
    width: '7px',
    color: '#e8eef1',
    corner: '5px'
  });
}

const updateToTop = () => { toTop.hidden = window.scrollY <= 360; };
window.addEventListener('scroll', updateToTop, { passive: true });
updateToTop();
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));

const examples = {
  js: 'const total = 100 + 200;\nconsole.log(total);',
  python: 'total = 100 + 200\nprint(total)',
  php: '<?php\n$total = 100 + 200;\necho $total;'
};
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-language]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#comparison-code code').textContent = examples[button.dataset.language];
  });
});
document.getElementById('copy-prompt').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-prompt');
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText(prompt.textContent.trim());
    status.textContent = '相談文をコピーしました。';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(prompt);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = '自動コピーが使えないため相談文を選択しました。Ctrl+C（Macは⌘C）でコピーできます。';
  }
});
