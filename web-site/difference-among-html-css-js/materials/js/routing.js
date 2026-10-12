// js
$('button#toHTML').on('click', function() {
    location.href = "../start.html"
});

$('button#toCSS').on('click', function() {
    location.href = "./css.html"
});
$('button#toJavascript').on('click', function() {
    location.href = "./all.html"
});

$('.logo').css({
    'cursor': 'pointer'
});
// $('.logo').on('click',function(){
//     location.href="#";
// });
$('.logo').on('click', function() {
    $('html,body').animate({
        'scrollTop': $('#anchor_top').offset().top
    }, 1000);
});
$(document).on('keydown', function(e) {
    var key = e.keyCode;
    switch (key) {
        case 27:
            $('.modal').fadeToggle();
            break;
    }
})

// 元の教材ページへ戻るボタン。PWA（アプリ表示）ではブラウザーの「戻る」が無いので、どの表示モードでも常に出しておく。
;(function() {
    var back = document.createElement('a');
    back.href = '../../index.html';
    back.textContent = '← 教材ページへ戻る';
    back.setAttribute('aria-label', '「WEBサイトとは」の教材ページへ戻る');
    back.style.cssText = 'position:fixed;top:10px;left:10px;z-index:2147483000;display:inline-block;padding:8px 14px;border:2px solid #fff;border-radius:999px;background:#18385e;color:#fff;font:700 14px/1.2 sans-serif;text-decoration:none;box-shadow:0 3px 8px rgba(0,0,0,.35);writing-mode:horizontal-tb;';
    document.body.appendChild(back);
})();
