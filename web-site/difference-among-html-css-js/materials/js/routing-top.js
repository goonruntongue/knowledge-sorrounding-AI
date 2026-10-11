// js
$('button#toHTML').on('click', function() {
    location.href="start.html"
});

$('button#toCSS').on('click', function() {
    location.href="materials/css.html"
});
$('button#toJavascript').on('click', function() {
    location.href="materials/all.html"
});
$('.logo').css({
    'cursor':'pointer'
});
$('.logo').on('click',function(){
    location.href="#";
});

$(document).on('keydown',function(e){
    var key=e.keyCode;
    switch(key){
        case 27:
            $('.modal').fadeToggle();
            break;
    }
})