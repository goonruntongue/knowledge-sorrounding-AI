(() => {
  const links = document.querySelectorAll('#auth figure a, .docs-live-shot a');
  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-label', '画像の拡大表示');
  viewer.innerHTML = '<div class="photo-viewer__bar"><button type="button">← 元の画面に戻る</button></div><div class="photo-viewer__body"><span class="photo-viewer__loading" role="status" hidden><span class="photo-viewer__spinner" aria-hidden="true"></span>画像を読み込んでいます</span><img alt=""><p class="photo-viewer__error" role="status" hidden>画像を読み込めませんでした。元の画面に戻って、もう一度お試しください。</p></div>';
  document.body.append(viewer);
  const image = viewer.querySelector('img');
  const loading = viewer.querySelector('.photo-viewer__loading');
  const errorMessage = viewer.querySelector('.photo-viewer__error');
  const body = viewer.querySelector('.photo-viewer__body');
  let loadingTimer;
  let opener;
  function finishLoading(failed = false) {
    clearTimeout(loadingTimer);
    loading.hidden = true;
    body.setAttribute('aria-busy', 'false');
    image.classList.toggle('is-ready', !failed);
    errorMessage.hidden = !failed;
  }
  image.addEventListener('load', () => finishLoading());
  image.addEventListener('error', () => finishLoading(true));
  function restore() {
    if (!viewer.open) return;
    clearTimeout(loadingTimer);
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
    clearTimeout(loadingTimer);
    loading.hidden = true;
    errorMessage.hidden = true;
    image.classList.remove('is-ready');
    body.setAttribute('aria-busy', 'true');
    body.scrollTop = 0;
    loadingTimer = setTimeout(() => { loading.hidden = false; }, 180);
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt || '拡大画像';
    history.pushState({...history.state, gasPhotoViewer:true}, '', location.href);
    viewer.showModal();
    if (image.complete) finishLoading(image.naturalWidth === 0);
    document.documentElement.classList.add('photo-viewer-open');
  }));
  viewer.querySelector('button').addEventListener('click', back);
  viewer.addEventListener('cancel', event => {event.preventDefault(); back();});
  window.addEventListener('popstate', restore);
})();
