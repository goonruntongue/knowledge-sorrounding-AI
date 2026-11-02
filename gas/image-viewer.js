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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const OPEN_MS = 460;
  const CLOSE_MS = 380;
  let loadingTimer;
  let opener;
  let zooming = false;
  let loaded = false;
  let closing = false;

  function finishLoading(failed = false) {
    clearTimeout(loadingTimer);
    loaded = !failed;
    loading.hidden = true;
    body.setAttribute('aria-busy', 'false');
    // 拡大の途中は、動いている画像（ghost）を見せ、本物は拡大が終わってから出す
    image.classList.toggle('is-ready', !failed && !zooming);
    errorMessage.hidden = !failed;
  }
  image.addEventListener('load', () => finishLoading());
  image.addEventListener('error', () => finishLoading(true));

  // 画面に見えているカード画像の位置。見えていなければ null
  function visibleRect(img) {
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return null;
    return rect;
  }

  // to の位置に置いた ghost を、from の位置・大きさから動かし始めるための変形
  function transformFrom(from, to) {
    const x = from.left - to.left;
    const y = from.top - to.top;
    return `translate(${x}px, ${y}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  function makeGhost(src, rect) {
    const ghost = document.createElement('img');
    ghost.className = 'photo-viewer__ghost';
    ghost.alt = '';
    ghost.src = src;
    Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    viewer.append(ghost);
    return ghost;
  }

  // アニメーションが終わったら一度だけ done を呼ぶ。描画が止まっている環境でも、時間がたてば必ず呼ぶ
  function whenDone(animation, ms, done) {
    let called = false;
    const once = () => { if (!called) { called = true; done(); } };
    animation.finished.then(once, once);
    setTimeout(once, ms + 200);
  }

  function open(link) {
    const thumb = link.querySelector('img');
    opener = link;
    closing = false;
    clearTimeout(loadingTimer);
    loading.hidden = true;
    errorMessage.hidden = true;
    loaded = false;
    image.classList.remove('is-ready');
    body.setAttribute('aria-busy', 'true');
    body.scrollTop = 0;
    // 読み込み前でも拡大後の大きさが決まるよう、カード画像の縦横を渡す
    image.width = thumb?.naturalWidth || Number(thumb?.getAttribute('width')) || 0;
    image.height = thumb?.naturalHeight || Number(thumb?.getAttribute('height')) || 0;
    loadingTimer = setTimeout(() => { loading.hidden = false; }, 180);
    image.src = link.href;
    image.alt = thumb?.alt || '拡大画像';
    history.pushState({...history.state, gasPhotoViewer: true}, '', location.href);

    const from = reduceMotion.matches ? null : visibleRect(thumb);
    zooming = Boolean(from);
    viewer.classList.toggle('is-zooming', zooming);
    viewer.classList.toggle('is-zoom-motion', zooming);
    viewer.showModal();
    document.documentElement.classList.add('photo-viewer-open');
    if (image.complete && image.src) finishLoading(image.naturalWidth === 0);
    if (!zooming) return;

    link.classList.remove('is-opening');
    void link.offsetWidth;
    link.classList.add('is-opening', 'is-source');
    const to = image.getBoundingClientRect();
    const ghost = makeGhost(thumb.currentSrc || thumb.src, to);
    setTimeout(() => viewer.classList.remove('is-zooming'), 16);
    const zoomIn = ghost.animate(
      [{ transform: transformFrom(from, to), borderRadius: '12px' }, { transform: 'none', borderRadius: '6px' }],
      { duration: OPEN_MS, easing: 'cubic-bezier(.2, .9, .25, 1.06)' },
    );
    whenDone(zoomIn, OPEN_MS, () => {
      zooming = false;
      viewer.classList.remove('is-zoom-motion');
      if (loaded) image.classList.add('is-ready');
      ghost.remove();
      link.classList.remove('is-source', 'is-opening');
    });
  }

  function finishClose() {
    viewer.close();
    viewer.classList.remove('is-zooming', 'is-zoom-motion');
    document.documentElement.classList.remove('photo-viewer-open');
    opener?.classList.remove('is-source', 'is-opening');
    opener?.focus({preventScroll: true});
    closing = false;
  }

  function restore() {
    if (!viewer.open || closing) return;
    closing = true;
    clearTimeout(loadingTimer);
    viewer.querySelectorAll('.photo-viewer__ghost').forEach((node) => node.remove());
    const thumb = opener?.querySelector('img');
    const to = reduceMotion.matches || !loaded ? null : visibleRect(thumb);
    const from = image.getBoundingClientRect();
    if (!to || !from.width) {
      finishClose();
      return;
    }
    // 拡大画像がカードの位置へ縮んで戻る
    const ghost = makeGhost(image.currentSrc || image.src, from);
    viewer.classList.add('is-zoom-motion', 'is-zooming');
    image.classList.remove('is-ready');
    opener.classList.add('is-source');
    const zoomOut = ghost.animate(
      [{ transform: 'none', borderRadius: '6px' }, { transform: transformFrom(to, from), borderRadius: '12px' }],
      { duration: CLOSE_MS, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' },
    );
    whenDone(zoomOut, CLOSE_MS, () => {
      ghost.remove();
      finishClose();
    });
  }

  function back() {
    if (history.state?.gasPhotoViewer) history.back();
    else restore();
  }

  links.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  }));
  viewer.querySelector('button').addEventListener('click', back);
  viewer.addEventListener('cancel', event => {event.preventDefault(); back();});
  window.addEventListener('popstate', restore);
})();
