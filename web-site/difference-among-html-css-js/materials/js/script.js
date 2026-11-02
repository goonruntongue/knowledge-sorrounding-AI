$(document).ready(function () {
  $("#slide image").hide();
  $("#slide image:first-of-type").show();
  $("#slide image:first-of-type").delay(2000).fadeOut(2000).next().fadeIn(2000);
  setInterval(function () {
    $("#slide image:first-of-type")
      .fadeOut(2000)
      .next()
      .fadeIn(2000)
      .end()
      .appendTo("#slide");
  }, 4000);
  var catchTop = $("h1.catch").css("top");
  var i = 1;
  var wh = $(window).height();
  $(window).scroll(function () {
    var scrlT = $(this).scrollTop();
    var gap = parseInt(catchTop) + scrlT / 2;
    // $('h1.catch').css({
    //     'top': gap
    // });

    var scrlRatio = (scrlT / wh) * 100;

    $("image").attr("width", `${100 + scrlRatio / 5}%`);
  });

  var mediaQuery = window.matchMedia("(min-width:768px)");

  function handler() {
    if (mediaQuery.matches) {
      $("header").addClass("pc-view").removeClass("mobile-view");
      $("#ham").removeClass("in-mobile");
      $("article").addClass("pc-size");
    } else {
      $("header").removeClass("pc-view").addClass("mobile-view");
      $("#ham").addClass("in-mobile");
      $("article").removeClass("pc-size");
    }
  }
  handler();
  mediaQuery.addListener(handler);

  var FV_h = $(".first-view-wrap").height();
  $(window).scroll(function () {
    var scrlT = $(this).scrollTop();
    if (scrlT >= 40 && scrlT < FV_h) {
      $("header.pc-view").slideUp().removeClass("scrolled");
    } else if (scrlT >= FV_h) {
      $("header.pc-view").slideDown(1000).addClass("scrolled");
      $("header.pc-view .logo").attr("src", "image/logo_w.svg");
    } else {
      $("header.pc-view").slideDown().removeClass("scrolled");
      $("header.pc-view .logo").attr("src", "image/logo.svg");
    }
  });

  $("div#ham").on("click", function () {
    $(this).toggleClass("open");
    $("header.mobile-view").toggleClass("open");
    $("footer").toggleClass("open");
  });

  $("header.mobile-view li a").on("click", function () {
    $("div#ham").removeClass("open");
    $("header.mobile-view").removeClass("open");
    $("footer").removeClass("open");
  });

  var scrlQuery = window.matchMedia("(min-width:768px)");

  function scrlHandler() {
    if (scrlQuery.matches) {
      Smooth(180);
    } else {
      Smooth(30);
    }
  }
  scrlHandler();
  scrlQuery.addListener(scrlHandler);

  function Smooth(adj) {
    $('a[href^="#"]').on("click", function () {
      var href = $(this).attr("href");
      $("body,html").animate(
        {
          scrollTop: $(href).offset().top - adj,
        },
        1000,
      );
    });
  }

  var logoQuery = window.matchMedia("(max-width:768px)");

  function logoHandler() {
    if (logoQuery.matches) {
      $(".logo").addClass("mobile-logo");
    } else {
      $(".logo").removeClass("mobile-logo");
    }
  }
  logoHandler();

  logoQuery.addListener(logoHandler);

  /*Dog picture slides into frame sec1 from the right side.*/
  var sec1Top = $("#sec1").offset().top;
  var sec1Height = $("#sec1").height();

  $("#dog").css({
    transform: "translateX(100%)",
    transition: "1s ease-out 0.25s",
  });
  $(window).scroll(function () {
    var scrlT = $(this).scrollTop();
    var scrlRatio = ((scrlT - sec1Top) / sec1Height) * 100;
    if (scrlRatio >= 0 && scrlRatio <= 20) {
      $("#dog").css({
        transform: `translateX(${100 - scrlRatio * 6}%)`,
      });
    }
  });

  /*cat picture slides into frame sec2 from the bottom.*/
  var sec2Top = $("#sec2").offset().top;
  var sec2Height = $("#sec2").height();

  $("#cat").css({
    transform: "translateY(100%)",
    transition: "1s ease-out 0.25s",
  });
  $(window).scroll(function () {
    var scrlT = $(this).scrollTop();
    var scrlRatio = ((scrlT - sec2Top) / sec2Height) * 100;
    if (scrlRatio >= 0 && scrlRatio <= 20) {
      $("#cat").css({
        transform: `translateY(${100 - scrlRatio * 5}%)`,
      });
    }
  });

  /*dog&cat picture slides into frame sec3 from the right side.*/
  var sec3Top = $("#sec3").offset().top;
  var sec3Height = $("#sec3").height();

  $("#dogncat").css({
    transform: "translateX(100%)",
    transition: "1s ease-out 0.25s",
  });
  $(window).scroll(function () {
    var scrlT = $(this).scrollTop();
    var scrlRatio = ((scrlT - sec3Top) / sec3Height) * 100;
    if (scrlRatio >= 0 && scrlRatio <= 20) {
      $("#dogncat").css({
        // transform: `translateX(${100 - scrlRatio * 5}%)`,
        transform: "translateX(0)",
      });
    }
  });

  $(".content").on("inview", function (event, isInview) {
    if (isInview) {
      $(this).addClass("view");
    } else {
      $(this).removeClass("view");
    }
  });

  $(".emp").on("inview", function (event, isInview) {
    if (isInview) {
      $(this).addClass("view");
    } else {
      $(this).removeClass("view");
    }
  });

  /*reload per breakPoint*/
  var reloadQuery = window.matchMedia("(max-width:768px)");

  function reloadHandler() {
    if (reloadQuery.matches) {
      if (window.name != "reloaded") {
        location.reload();
        window.name = "reloaded";
      } else {
        window.name = "";
      }
    }
  }
  reloadHandler();

  reloadQuery.addListener(reloadHandler);

  var modalPosQuery = window.matchMedia("(max-width:768px)");

  function modalPosHandler() {
    if (modalPosQuery.matches) {
      $(".modal").css({
        left: "calc(100vw - 204px)",
        right: "unset",
      });
    } else {
      $(".modal").css({
        right: "40px",
      });
    }
  }

  modalPosHandler();

  modalPosQuery.addListener(modalPosHandler);

  if ($("body").hasClass("all")) {
    $("header.mobile-view").css("transition", "0.5s");
    $(window).scroll(function () {
      var scrlT = $(this).scrollTop();
      if (scrlT > 100) {
        $("header.mobile-view").css({
          background: "rgba(255,255,255,.9)",
          "box-shadow": "0 0 12px rgba(0,0,0,.6)",
        });
      } else {
        $("header.mobile-view").css({
          background: "transparent",
          "box-shadow": "none",
        });
      }
    });
  }
});

let titleSpan = document.querySelector("h1 span.title");
let titleText = titleSpan.textContent;
let wrappedChar = titleSpan.textContent
  .split("")
  .map((char) => `<span>${char}</span>`)
  .join("");
titleSpan.innerHTML = wrappedChar;

let titleSpans = document.querySelectorAll("h1 span.title span");
let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function animateTitle() {
  for (const span of titleSpans) {
    span.style.opacity = 0;
  }
  await sleep(2000);
  for (const span of titleSpans) {
    span.style.opacity = 1;
    await sleep(150);
  }
}

let subTitleSpan = document.querySelector("h1 span.sub-title");
let subTitleText = subTitleSpan.textContent;
let wrappedSubChar = subTitleSpan.textContent
  .split("")
  .map((char) => `<span>${char}</span>`)
  .join("");
subTitleSpan.innerHTML = wrappedSubChar;

let subTitleSpans = document.querySelectorAll("h1 span.sub-title span");
subTitleSpans.forEach((span) => {
  span.style.opacity = 0;
});
async function animateSubTitle() {
  subTitleSpans.forEach(async (span, index) => {
    setTimeout(() => {
      span.style.opacity = 1;
    }, index * 100);
  });
}
(async () => {
  await animateTitle();
  await animateSubTitle();
})();
