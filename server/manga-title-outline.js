/* 見出しだけを軽く縁取り、漫画インクの太い主線とそろえる。 */
(function () {
  var favicon = document.querySelector('link[rel="icon"]') || document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  favicon.href = "assets/favicon-server.png?v=20261011";
  if (!favicon.parentNode) document.head.appendChild(favicon);

  var guideStyle = document.createElement("link");
  guideStyle.rel = "stylesheet";
  guideStyle.href = "local-server-guide.css";
  document.head.appendChild(guideStyle);

  var guideScript = document.createElement("script");
  guideScript.src = "local-server-guide.js";
  guideScript.defer = true;
  document.head.appendChild(guideScript);

  function applyOutline() {
    if (!window.jQuery || !window.jQuery.fn.outliner) return;

    window.jQuery(".hero h1").outliner({
      // ヒーローのイラストに重なっても読める、太い白の袋文字。
      width: "8px",
      color: "#fffdf8",
      corner: "4px"
    });
    window.jQuery("section:not(.hero) h2").outliner({
      width: "1px",
      color: "#fffaf0",
      corner: "2px"
    });
    window.jQuery(".word b").outliner({
      width: "2px",
      color: "#07162d",
      corner: "2px"
    });
    // 絵と重なる文字は、白い太めの袋文字で読みやすさを保つ。
    window.jQuery(".top span, .card--key h3, .card--key > p:not(.kicker)").outliner({
      width: "4px",
      color: "#fffdf8",
      corner: "3px"
    });
  }

  window.addEventListener("load", applyOutline, { once: true });
}());
