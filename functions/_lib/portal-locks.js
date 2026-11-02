// ポータルのカードに鍵（鎖）をかける見た目と、押しても開かない演出
// _middleware.js が、ポータルの HTML に HTMLRewriter で差し込む

export const LOCK_IMAGE = '/assets/lock-padlock.webp';

export const LOCK_STYLE = `<style id="ksa-lock-style">
.menu a[data-locked]{position:relative;cursor:not-allowed}
.menu a[data-locked]>*:not(.ksa-chain){filter:saturate(.55) brightness(.92);opacity:.78}
.menu a[data-locked]:hover,.menu a[data-locked]:active{transform:none}
.ksa-chain{position:absolute;inset:-6% -7%;z-index:3;display:grid;place-items:center;pointer-events:none}
.ksa-chain img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(20,16,40,.35));transform-origin:50% 62%}
.menu a[data-locked].is-rattling{animation:ksa-rattle .62s cubic-bezier(.36,.07,.19,.97) both}
.menu a[data-locked].is-rattling .ksa-chain img{animation:ksa-chain-jolt .62s ease-in-out both}
@keyframes ksa-rattle{
  0%,100%{transform:translate(0,0) rotate(0)}
  10%{transform:translate(-7px,1px) rotate(-1.4deg)}
  20%{transform:translate(8px,-2px) rotate(1.6deg)}
  30%{transform:translate(-9px,2px) rotate(-1.8deg)}
  40%{transform:translate(8px,-1px) rotate(1.4deg)}
  50%{transform:translate(-6px,1px) rotate(-1deg)}
  62%{transform:translate(5px,0) rotate(.7deg)}
  74%{transform:translate(-3px,0) rotate(-.4deg)}
  86%{transform:translate(2px,0) rotate(.2deg)}}
@keyframes ksa-chain-jolt{
  0%,100%{transform:scale(1) rotate(0)}
  12%{transform:scale(1.05) rotate(2.5deg)}
  26%{transform:scale(.98) rotate(-3deg)}
  40%{transform:scale(1.04) rotate(2deg)}
  54%{transform:scale(.99) rotate(-1.5deg)}
  70%{transform:scale(1.02) rotate(.8deg)}}
.ksa-lock-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));z-index:2000;display:grid;gap:8px;width:min(92vw,420px);padding:14px 16px;border-radius:16px;background:#2f2a4a;color:#fff;box-shadow:0 14px 34px rgba(20,16,40,.35);font:700 14px/1.6 "Noto Sans JP",sans-serif;transform:translate(-50%,0);animation:ksa-toast-in .22s ease-out both}
.ksa-lock-toast[hidden]{display:none}
.ksa-lock-toast p{margin:0}
.ksa-lock-toast small{color:#d9d3f2;font-weight:500}
.ksa-lock-toast a{justify-self:start;padding:6px 14px;border-radius:999px;background:#fff;color:#2f2a4a;text-decoration:none}
@keyframes ksa-toast-in{from{opacity:0;transform:translate(-50%,8px)}}
@media (prefers-reduced-motion:reduce){
  .menu a[data-locked].is-rattling{animation:ksa-rattle-soft .4s ease both}
  .menu a[data-locked].is-rattling .ksa-chain img,.ksa-lock-toast{animation:none}
  @keyframes ksa-rattle-soft{50%{outline:3px solid #c9a227;outline-offset:3px}}}
</style>`;

// カードの中に重ねる鎖
export const CHAIN_OVERLAY = `<span class="ksa-chain" aria-hidden="true"><img src="${LOCK_IMAGE}" alt="" width="720" height="258" decoding="async"></span>`;

// 押したら揺らすだけで、ページは開かない。ページ遷移の演出より先に止める
export function lockScript(loggedIn) {
  const message = loggedIn
    ? '<p>このページには鍵がかかっています。</p><small>このアカウントには、まだ許可がありません。管理者に知らせてください。</small>'
    : '<p>このページには鍵がかかっています。</p><small>許可されたアカウントでログインすると開けます。</small><a data-login-link href="#">Googleでログイン</a>';
  return `<script>(function(){
var toast,timer;
function show(href){
  if(!toast){toast=document.createElement('div');toast.className='ksa-lock-toast';toast.setAttribute('role','status');document.body.appendChild(toast);}
  toast.innerHTML=${JSON.stringify(message)};
  var link=toast.querySelector('[data-login-link]');
  // 鍵のかかったページそのものを開くと、ログインの画面が出る
  if(link)link.href=href;
  toast.hidden=false;clearTimeout(timer);timer=setTimeout(function(){toast.hidden=true},4200);
}
window.addEventListener('click',function(e){
  var card=e.target.closest&&e.target.closest('.menu a[data-locked]');
  if(!card)return;
  e.preventDefault();e.stopImmediatePropagation();
  card.classList.remove('is-rattling');void card.offsetWidth;card.classList.add('is-rattling');
  if(navigator.vibrate)try{navigator.vibrate([30,40,30,40,30])}catch(x){}
  show('/'+card.getAttribute('data-locked')+'/');
},true);
document.addEventListener('animationend',function(e){if(e.animationName==='ksa-rattle'||e.animationName==='ksa-rattle-soft')e.target.classList.remove('is-rattling')});
})();</script>`;
}
