(() => {
  const downloadPath = "downloads/local-server-practice-kit.zip";

  const makeGuide = () => {
    document.body.classList.add("has-server-lab");

    const dock = document.createElement("aside");
    dock.className = "server-lab-dock";
    dock.setAttribute("aria-label", "ローカルサーバー実習の案内");
    dock.innerHTML = `
      <div class="server-lab-dock__inside">
        <p><strong>実際に試そう：</strong>同じWi-Fiの別端末から、同じページを開いてみよう</p>
        <button class="server-lab-open" type="button" aria-haspopup="dialog">使い方・ダウンロード</button>
      </div>`;

    const dialog = document.createElement("dialog");
    dialog.className = "server-lab-dialog";
    dialog.setAttribute("aria-labelledby", "server-lab-title");
    dialog.innerHTML = `
      <div class="server-lab-dialog__header">
        <div><span class="server-lab-dialog__eyebrow">LOCAL SERVER PRACTICE</span><h2 id="server-lab-title">自分のPCを小さなWebサーバーにしてみよう</h2></div>
        <button class="server-lab-close" type="button" aria-label="案内を閉じる">×</button>
      </div>
      <div class="server-lab-dialog__body">
        <p class="server-lab-dialog__lead">HTMLの知識がなくても大丈夫です。ファイルを一つ開いて、目印の文字を変えるだけで、同じWi-FiにつながったスマホやPCにも変化が届きます。</p>
        <a class="server-lab-download" href="${downloadPath}" download>↓ ローカルサーバー練習キットをダウンロード（Windows / macOS）</a>
        <ol class="server-lab-flow">
          <li><strong>ZIPを解凍して、使うOSのフォルダーを開く</strong>Windows は <code>windows用</code>、Mac は <code>mac用</code> を選びます。</li>
          <li><strong>「サーバーを起動」を開く</strong>Windows は <code>サーバーを起動.bat</code>、Mac は <code>サーバーを起動.command</code> をダブルクリックします。ブラウザーが自動で開きます。</li>
          <li><strong>表示された「同じWi-Fi内」のアドレスを別端末で開く</strong>例：<code>http://192.168.x.x:8123/</code>。スマホもPCも、同じWi-Fiにつながっていることを確認します。</li>
          <li><strong>文字を変えて、両方の画面を更新する</strong>起動したまま <code>public_html/index.html</code> を開き、黄色い目印の文章を好きな言葉に変えて保存します。ブラウザーを更新すると変化が見えます。</li>
        </ol>
        <section class="server-lab-edit" aria-labelledby="server-edit-title">
          <h3 id="server-edit-title">「何を書き換えればいい？」への答え</h3>
          <p>ファイルの中で <code>ここを好きな言葉に書き換えてみましょう</code> と書かれた部分だけを探してください。そこを、たとえば <code>わたしのページが更新されました！</code> に変えて保存すれば完了です。</p>
          <p class="server-lab-note">Windows は <strong>右クリック → メモ帳で編集</strong>、Mac は <strong>テキストエディットで開く</strong> で始められます。ほかの記号や行は最初は変えなくて大丈夫です。</p>
        </section>
        <p class="server-lab-result"><strong>この実習でわかること：</strong>サーバーは、PC内のファイルを「アドレス」でほかの端末へ見せる役目です。<strong>一つの index.html を保存し直すと、同じアドレスを見ている全員に新しい内容が届く</strong>ことを、目で確かめられます。</p>
        <p class="server-lab-note">これはあなたのPCで実際に動かすローカル実習です。ダウンロードや案内モーダルはアカウントや外部のファイルを変更しません。共有は同じLAN内だけで行い、終わるときは起動した画面で Ctrl+C（Mac は Control+C）を押してください。</p>
      </div>`;

    const footer = document.querySelector("footer");
    if (footer) footer.insertAdjacentElement("afterend", dock);
    else document.body.append(dock);
    document.body.append(dialog);

    // モーダル見出しは、本文の影ではなく太い漫画インク風の輪郭で読ませる。
    if (window.jQuery && window.jQuery.fn.outliner) {
      window.jQuery(dialog.querySelector("h2")).outliner({
        width: "20px",
        color: "#07162d",
        corner: "3px"
      });
    }

    const open = () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      dialog.querySelector(".server-lab-close").focus();
    };
    const close = () => dialog.close();

    dock.querySelector(".server-lab-open").addEventListener("click", open);
    dialog.querySelector(".server-lab-close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", makeGuide, { once: true });
  else makeGuide();
})();
