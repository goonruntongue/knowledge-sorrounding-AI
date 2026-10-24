(() => {
  const links = document.querySelectorAll('#auth figure a, .docs-live-shot a');
  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-label', '画像の拡大表示');
  viewer.innerHTML = '<div class="photo-viewer__bar"><button type="button">← 元の画面に戻る</button></div><div class="photo-viewer__body"><img alt=""></div>';
  document.body.append(viewer);
  const image = viewer.querySelector('img');
  let opener;
  function restore() {
    if (!viewer.open) return;
    viewer.close();
    document.documentElement.classList.remove('photo-viewer-open');
    opener?.focus({preventScroll:true});
  }
  function back() {
    if (history.state?.gasPhotoViewer) history.back();
    else restore();
  }
  links.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt || '拡大画像';
    history.pushState({...history.state, gasPhotoViewer:true}, '', location.href);
    viewer.showModal();
    document.documentElement.classList.add('photo-viewer-open');
  }));
  viewer.querySelector('button').addEventListener('click', back);
  viewer.addEventListener('cancel', event => {event.preventDefault(); back();});
  window.addEventListener('popstate', restore);
})();
