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