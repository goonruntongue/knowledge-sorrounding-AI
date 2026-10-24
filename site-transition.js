// サイト内でページを移るときの演出（全ページ共通）。
// 出発：リンクが弾み、押した位置から色の円が広がって、行き先の名前が浮かぶ。
// 到着：色の円が「ぽんっ」と縮んで消え、白い輪が弾ける。
// ページ内リンク（#）、ライトボックスなどほかの処理が止めたクリック、別タブ・ダウンロードは対象外。
// <head> で読み込む（到着の演出を最初の描画に間に合わせるため）。
(() => {
  const KEY = 'ksa-warp';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FILE_LINK = /\.(zip|png|jpe?g|gif|webp|svg|pdf|txt|gs|bat|command|ps1|json|psd|mp4)$/i;
  const LEAVE_MS = 560;
  const prefetched = new Set();
  // このファイルはサイトの一番上に置くので、その場所がポータルの場所になる
  const siteRoot = new URL('.', document.currentScript?.src || location.href).href;
  let leaving = false;

  // ---------- 到着 ----------
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    sessionStorage.removeItem(KEY);
    if (saved && Date.now() - saved.t < 8000 && !reduceMotion.matches) {
      root.classList.add('is-warp-arriving');
      setTimeout(() => root.classList.remove('is-warp-arriving'), 900);
    }
  } catch (error) { /* 保存できない環境では到着の演出を省く */ }

  // ---------- 表示できなかった画像の読み込み直し ----------
  // 通信が一瞬途切れて画像が出なかったときは、少し待って最大2回読み込み直す
  const IMAGE_RETRY_WAITS = [800, 2500];
  function withRetryMark(url, attempt) {
    try {
      const next = new URL(url, location.href);
      next.searchParams.set('retry', String(attempt));
      return next.href;
    } catch (error) {
      return url;
    }
  }
  window.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.currentSrc && !img.getAttribute('src')) return;
    const attempt = Number(img.dataset.retry || 0);
    if (attempt >= IMAGE_RETRY_WAITS.length) return;
    img.dataset.retry = String(attempt + 1);
    setTimeout(() => {
      const picture = img.parentElement instanceof HTMLPictureElement ? img.parentElement : null;
      picture?.querySelectorAll('source[srcset]').forEach((source) => {
        source.srcset = source.srcset.split(',').map((part) => {
          const [url, size] = part.trim().split(/\s+/);
          return size ? `${withRetryMark(url, attempt + 1)} ${size}` : withRetryMark(url, attempt + 1);
        }).join(', ');
      });
      img.src = withRetryMark(img.getAttribute('src'), attempt + 1);
    }, IMAGE_RETRY_WAITS[attempt]);
  }, true);

  // ---------- 出発 ----------
  function pageLink(target) {
    const link = target instanceof Element ? target.closest('a[href]') : null;
    if (!link || link.hasAttribute('download') || link.dataset.noWarp !== undefined) return null;
    if (link.target && link.target !== '_self') return null;
    if (!/^https?:$|^file:$/.test(link.protocol)) return null;
    if (link.protocol !== location.protocol || link.host !== location.host) return null;
    if (link.pathname === location.pathname && link.search === location.search) return null;
    if (FILE_LINK.test(link.pathname)) return null;
    return link;
  }

  function prefetch(link) {
    if (prefetched.has(link.href) || location.protocol === 'file:') return;
    prefetched.add(link.href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = link.href;
    document.head.append(hint);
  }

  // ふちどり（outliner）が文字を複製している場合は、元の文字（.original）だけを読む
  function textOf(node) {
    if (!node) return '';
    return (node.querySelector('.original') || node).textContent.replace(/\s+/g, ' ').trim();
  }

  function describe(link) {
    const card = link.closest('.menu a');
    if (card) {
      const art = card.querySelector('.card-illustration img');
      return {
        art: art ? art.currentSrc || art.src : '',
        label: textOf(card.querySelector('.number')),
        title: textOf(card.querySelector('.title')),
      };
    }
    const target = new URL(link.href);
    const page = target.origin + target.pathname;
    const toPortal = page === siteRoot || page === `${siteRoot}index.html`;
    const named = textOf(link.querySelector('strong')) || textOf(link);
    return {
      art: '',
      label: toPortal ? 'PORTAL' : 'NEXT PAGE',
      title: toPortal ? 'ポータルへもどります' : named.replace(/^[←→\s]+|[←→\s]+$/g, '') || 'つぎのページへ',
    };
  }

  function buildOverlay(link, x, y) {
    const info = describe(link);
    const overlay = document.createElement('div');
    overlay.className = 'site-warp';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.setProperty('--warp-x', `${x}px`);
    overlay.style.setProperty('--warp-y', `${y}px`);

    const stage = document.createElement('div');
    stage.className = 'site-warp__stage';
    if (info.art) {
      const img = document.createElement('img');
      img.className = 'site-warp__art';
      img.src = info.art;
      img.alt = '';
      stage.append(img);
    } else {
      const blob = document.createElement('span');
      blob.className = 'site-warp__blob';
      blob.innerHTML = '<i></i><i></i>';
      stage.append(blob);
    }
    const label = document.createElement('p');
    label.className = 'site-warp__label';
    label.textContent = info.label;
    const title = document.createElement('p');
    title.className = 'site-warp__title';
    title.textContent = info.title;
    const dots = document.createElement('p');
    dots.className = 'site-warp__dots';
    dots.innerHTML = 'ひらいています<span>.</span><span>.</span><span>.</span>';
    stage.append(label, title, dots);
    overlay.append(stage);

    // 押した位置から飛び散る小さな粒
    for (let i = 0; i < 12; i += 1) {
      const spark = document.createElement('span');
      spark.className = 'site-warp__spark';
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const distance = 70 + Math.random() * 70;
      spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--hue', String(150 + i * 18));
      overlay.append(spark);
    }
    return overlay;
  }

  function leave(link, event) {
    if (leaving) return;
    leaving = true;
    const url = link.href;
    if (reduceMotion.matches) {
      location.href = url;
      return;
    }
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now() })); } catch (error) { /* 省略 */ }
    const rect = link.getBoundingClientRect();
    // キーボードで開いたときは、リンクの中央から広げる
    const fromPointer = event.detail > 0 && (event.clientX || event.clientY);
    const x = fromPointer ? event.clientX : rect.left + rect.width / 2;
    const y = fromPointer ? event.clientY : rect.top + rect.height / 2;

    link.classList.add('is-warp-launching');
    link.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(.92)', offset: 0.35 },
        { transform: 'scale(1.05)', offset: 0.75 },
        { transform: 'scale(1.02)' },
      ],
      { duration: 320, easing: 'ease-out', fill: 'forwards' },
    );
    const overlay = buildOverlay(link, x, y);
    document.body.append(overlay);
    root.classList.add('is-warp-leaving');
    setTimeout(() => overlay.classList.add('is-active'), 16);
    setTimeout(() => { location.href = url; }, LEAVE_MS);
  }

  document.addEventListener('pointerover', (event) => {
    const link = pageLink(event.target);
    if (link) prefetch(link);
  });
  document.addEventListener('touchstart', (event) => {
    const link = pageLink(event.target);
    if (link) prefetch(link);
  }, { passive: true });
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = pageLink(event.target);
    if (!link || link.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    leave(link, event);
  });

  // 戻るボタンで戻ってきたとき（ページが保存されていた場合）は、演出を片づける
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    leaving = false;
    root.classList.remove('is-warp-leaving', 'is-warp-arriving');
    document.querySelectorAll('.site-warp').forEach((node) => node.remove());
    document.querySelectorAll('.is-warp-launching').forEach((node) => {
      node.classList.remove('is-warp-launching');
      node.getAnimations().forEach((animation) => animation.cancel());
    });
  });
})();
