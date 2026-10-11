(function () {
  const { protocol, hostname, port, pathname, origin } = window.location;

  // IPv6 リテラルの場合は [ ] を付与
  const hostForUrl = hostname.includes(":") ? `[${hostname}]` : hostname;

  // 実ポートを決定（空のときはプロトコル既定値）
  const effectivePort =
    port && port !== "" ? port : protocol === "https:" ? "443" : "80";

  // origin（例: http://192.168.x.x:8888）を安全に生成（古い環境向けフォールバック付き）
  const safeOrigin =
    origin && origin !== "null"
      ? origin
      : `${protocol}//${hostForUrl}${effectivePort ? `:${effectivePort}` : ""}`;
  // file:// の場合は QR 生成をスキップ
  if (protocol === "file:") {
    document.querySelector("h1").innerText = "サーバーは起動していません";
    document.querySelector("h1").style.color = "#f94646";
    document.querySelectorAll(".line p").forEach((e) => {
      e.innerText = "";
    });
    document.querySelector(".ipAddress span").style.textDecoration =
      "line-through";
    document.getElementById("access-url").textContent =
      safeOrigin + " （これはローカルファイルを直接開いているという意味です）";
    document.querySelector(".qr").textContent =
      "※ローカルファイルとして開いているため、IPアドレスは表示されません";
    return;
  }
  // 表示は origin のみ（パスは不要なら付けない）
  document.getElementById("access-url").textContent = safeOrigin;

  // ===== QRコード（現在のアクセスURLをそのまま埋め込む）=====
  // パスまで含めたい場合： const urlForQR = window.location.href;
  // ルートだけで良ければ：
  const urlForQR = safeOrigin + "/";

  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?" +
    "color=000000&bgcolor=FFFFFF&" +
    "data=" +
    encodeURIComponent(urlForQR) +
    "&qzone=1&margin=0&size=400x400&ecc=L";

  document.querySelector(
    ".qr"
  ).innerHTML = `<img src="${qrUrl}" alt="QRコード" width="200" height="200">`;
})();

// file;//の時は、document.querySelector("header img")のsrcをimg/server-off.pngに変更する
(function () {
  if (window.location.protocol === "file:") {
    const headerImg = document.querySelector("header img");
    headerImg.src = "img/server-off.png";
  }
})();
