(() => {
  "use strict";
  const lab = document.querySelector("#lab");
  const simulation = document.querySelector("#simulation");
  const progress = document.querySelector("#progress");
  const instruction = document.querySelector("#instruction");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let app = "codex", stage = 0, mode = "ask", menu = "", timer, returnFocus;
  let prompt = "", response = "", running = false, error = "";
  const title = "はじめてのAI制作";
  const sample = "index.htmlのh1を「はじめてのAI制作」に変更してください。ほかの文章やレイアウトは変えず、変更箇所と確認結果を教えてください。";
  const modes = {
    codex: [
      ["ask", "承認を求める", "作業領域内の編集は進められます。外部アクセスなど、境界を越える操作では自分で承認します。"],
      ["auto", "代わりに承認", "対象の承認依頼をレビュー用エージェントが判断します。すべてを無条件に許可する設定ではありません。"],
      ["full", "フルアクセス", "ファイルとネットワークへのアクセス範囲を広く解除します。今回は選択の意味を練習するだけで、実際の権限は変わりません。"]
    ],
    claude: [
      ["plan", "プラン", "調査して方針を提案します。このモードではソースコードを編集しません。"],
      ["edits", "編集を受け入れる", "ファイル編集と一部の基本的なファイル操作を自動承認します。他のコマンドは確認されることがあります。"],
      ["auto", "自動", "バックグラウンドのチェックを通じて操作を進めます。実機では利用条件によって選べないことがあります。"]
    ]
  };
  const escape = text => text.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const chosen = () => modes[app].find(m => m[0] === mode);
  const control = (action, label, enabled, guided = false) => '<button type="button" class="sim-control' + (guided ? " guided" : "") + '" data-action="' + action + '"' + (enabled ? "" : " disabled") + ">" + label + "</button>";
  const coach = text => '<div class="coach">' + text + "</div>";
  const messages = [
    "開発用のモードに切り替えましょう。",
    "フォルダボタンから、練習用の作品を選びましょう。",
    "権限を開き、それぞれの説明を読んで設定しましょう。",
    "変更したいファイル・内容・条件を入力し、送信しましょう。",
    "作業内容を確認して、選んだ権限に応じた流れを体験しましょう。",
    "変更前後を確認して、ブラウザ表示を開きましょう。",
    "練習完了！別の権限や、もう一方のアプリも試せます。"
  ];
  function cancelRun() { clearTimeout(timer); running = false; }
  function reset(nextApp = app) {
    cancelRun(); app = nextApp; stage = 0; mode = app === "codex" ? "ask" : "plan";
    menu = ""; prompt = ""; response = ""; error = ""; render();
  }
  function permissionPanel() {
    return '<div class="panel-box"><h3>権限を選ぶ</h3>' + modes[app].map(([key,label,detail]) =>
      '<label><input type="radio" name="mode" value="' + key + '"' + (mode === key ? " checked" : "") + '> <strong>' + label + '</strong><br><span class="mode-description">' + detail + '</span></label>').join("") +
      control("permission-done", "この設定で進む", true) + "</div>";
  }
  function stageContent() {
    if (menu === "folder") return '<div class="panel-box"><h3>作品フォルダを選択（練習用）</h3><p>デスクトップ / my-website</p><pre>my-website/\n├─ index.html\n└─ css/\n   └─ style.css</pre>' + coach("このフォルダを選びます") + control("select-folder", "my-website を選択", true, true) + "</div>";
    if (menu === "permission") return permissionPanel();
    if (stage < 3) return '<p class="mode-description">練習用の新しいタスクです。下の赤枠を順番に操作してください。</p>';
    if (stage === 3) return '<div class="panel-box"><h3>今回の課題</h3><p>index.htmlの見出し「Hello!」を「はじめてのAI制作」に変更します。</p>' + control("sample", "依頼文の例を入力", true) + '<p class="mode-description">例を使っても、自分の言葉で書いてもOK。練習ではこの見出し変更を再現します。</p></div>' + (error ? '<p role="alert">' + error + "</p>" : "");
    if (running) return '<p class="typing" role="status">' + escape(response) + '</p>' + control("stop", "■ 作業を停止", true);
    if (stage === 4 && app === "claude" && mode === "plan") return '<div class="panel-box"><h3>提案されたプラン</h3><p>1. index.htmlのh1を確認<br>2. 見出しの文字だけ変更<br>3. 差分と表示を確認</p><p>まだファイルは変更していません。確認したら実行モードを選びます。</p><div class="sim-choices">' + control("execute-edits", "編集を受け入れるで実行", true, true) + control("execute-auto", "自動で実行", true) + "</div></div>";
    if (stage === 4) {
      if (app === "codex") return '<div class="panel-box"><h3>外部アクセスの確認を体験</h3><p>作業フォルダ内のh1編集に毎回承認は必要ありません。ここでは追加で「HTML仕様の公式サイトを参照する」場面を練習します。</p>' + (mode === "ask" ? '<p>ネットワークアクセスを許可しますか？</p>' + control("approve", "今回のみ許可", true, true) + control("deny", "許可せず、手元のファイルで続ける", true) : '<p>' + (mode === "auto" ? "レビュー用エージェントが、依頼に沿う参照かを確認して承認する流れです。" : "この設定では、ネットワークアクセスの承認待ちをせず進みます。") + '</p>' + control("continue", "この設定での実行を体験", true, true)) + "</div>";
      return '<div class="panel-box"><h3>' + chosen()[1] + 'で作業</h3><p>' + (mode === "auto" ? "依頼に沿う編集かをチェックしながら進みます。" : "ファイルの編集を自動承認して進みます。") + '</p>' + control("continue", "見出しの変更を実行", true, true) + "</div>";
    }
    if (stage === 5) return '<p class="success">✓ index.htmlの見出しを変更しました</p><p>差分：赤が変更前、緑が変更後です。</p><div class="diff"><del>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins>＋ &lt;h1&gt;' + title + '&lt;/h1&gt;</ins></div><p>ほかの文章やレイアウトは変更していません。</p>' + coach("変更点を読んだら、表示も確認") + control("preview", "ブラウザ表示を確認", true, true);
    return '<div class="browser-preview"><small>練習用プレビュー / index.html</small><h3>' + title + '</h3><p>My first website</p></div><p class="success">✓ 依頼 → 作業 → 差分 → 表示確認まで完了！</p><p>実機でも変更点を確認して、よければGitに履歴を残しましょう。</p>' + control("reset", "別の権限でもう一度", true) + control("switch-app", app === "codex" ? "Claude Codeも試す" : "Codexも試す", true);
  }
  function render() {
    progress.textContent = stage < 6 ? "STEP " + (stage + 1) + " / 6" : "COMPLETE";
    instruction.textContent = messages[stage];
    document.querySelectorAll("[data-app]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.app === app)));
    const name = app === "codex" ? "Codex" : "Claude";
    simulation.innerHTML = '<div class="app-shell ' + app + '"><aside class="app-sidebar"><div class="app-brand">' + name + '<span>☰</span></div><div class="fake-item">⌕ 検索</div><div class="fake-item">＋ 新しいタスク</div><p>プロジェクト</p><div class="fake-item">' + (stage > 1 ? "▱ my-website" : "まだありません") + '</div><p>練習用アカウント</p><div class="fake-item">Student</div></aside><div class="app-main"><div class="composer-row">' + control("activate", app === "codex" ? "ChatGPT ▾ → Codex" : "チャット　 /　 &lt;/&gt; Code", stage === 0, stage === 0) + '</div>' + (stage === 0 ? coach(app === "codex" ? "ここでCodexへ切り替え" : "ここでCodeへ切り替え") : "") +
      '<div class="app-greeting"><span>' + (app === "claude" ? "✳ " : "✦ ") + '</span>' + (app === "claude" ? "何をつくりましょう？" : "次は何をつくりますか？") + '</div><div class="conversation">' + stageContent() + '</div><div class="composer">' +
      (stage === 1 && !menu ? coach("フォルダをクリックして作品を紐づける") : "") +
      '<div class="composer-row"><span class="sim-control">▱ ローカル</span>' + control("folder", "▱ " + (stage > 1 ? "my-website" : "フォルダなし"), stage === 1, stage === 1 && !menu) + '</div>' +
      (stage === 2 && !menu ? coach("ここで任せる範囲を設定") : "") +
      '<div class="input-box"><textarea id="request" aria-label="AIへの依頼文" placeholder="タスクを説明するか、質問を入力してください"' + (stage === 3 ? "" : " disabled") + '>' + escape(prompt) + '</textarea><div class="composer-row">' +
      control("permission", chosen()[1] + " ▾", stage === 2, stage === 2 && !menu) +
      control("send", "送信 ↑", stage === 3, stage === 3 && !!prompt.trim()) + '</div></div>' +
      (stage === 3 && prompt.trim() ? coach("内容を読んで送信") : "") + '</div></div></div>';
    simulation.querySelectorAll("[data-action]").forEach(b => b.addEventListener("click", () => act(b.dataset.action)));
    simulation.querySelectorAll('[name="mode"]').forEach(r => r.addEventListener("change", () => { mode = r.value; }));
    simulation.querySelector("#request").addEventListener("input", e => { prompt = e.target.value; });
    simulation.querySelector("#request").addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); act("send"); } });
  }
  function animate(done) {
    cancelRun(); running = true; response = "";
    const message = "index.htmlを読み取りました。h1を「はじめてのAI制作」に変更しています…";
    let index = 0;
    const tick = () => {
      if (!lab.open) return;
      index = reduced ? message.length : index + 2;
      response = message.slice(0,index); render();
      if (index < message.length) timer = setTimeout(tick,45);
      else { running = false; done(); render(); }
    };
    tick();
  }
  function act(action) {
    if (action === "activate") stage = 1;
    if (action === "folder") menu = "folder";
    if (action === "select-folder") { stage = 2; menu = ""; }
    if (action === "permission") menu = "permission";
    if (action === "permission-done") { stage = 3; menu = ""; }
    if (action === "sample") prompt = sample;
    if (action === "send") {
      if (!prompt.trim()) { error = "変更したい内容を入力してください。「依頼文の例を入力」も使えます。"; render(); return; }
      error = ""; stage = 4;
    }
    if (action === "execute-edits" || action === "execute-auto") {
      mode = action === "execute-edits" ? "edits" : "auto"; animate(() => { stage = 5; }); return;
    }
    if (["approve","deny","continue"].includes(action)) { animate(() => { stage = 5; }); return; }
    if (action === "stop") { cancelRun(); response = ""; }
    if (action === "preview") stage = 6;
    if (action === "reset") { reset(); return; }
    if (action === "switch-app") { reset(app === "codex" ? "claude" : "codex"); return; }
    render();
    requestAnimationFrame(() => {
      const target = menu ? simulation.querySelector(".panel-box") : stage >= 4 ? simulation.querySelector(".conversation") : simulation.querySelector(".guided");
      target?.scrollIntoView({block:"nearest",behavior:reduced ? "auto" : "smooth"});
      if (action === "sample") simulation.querySelector("#request").focus();
    });
  }
  document.querySelector("#launch").addEventListener("click", () => {
    returnFocus = document.activeElement; reset(); lab.showModal(); document.body.classList.add("lab-open");
  });
  document.querySelector("#close").addEventListener("click", () => lab.close());
  lab.addEventListener("close", () => { cancelRun(); document.body.classList.remove("lab-open"); returnFocus?.focus(); });
  document.querySelector("#restart").addEventListener("click", () => reset());
  document.querySelectorAll("[data-app]").forEach(b => b.addEventListener("click", () => reset(b.dataset.app)));
  const top = document.querySelector("#toTop");
  const updateTop = () => { const visible = scrollY > 360; top.classList.toggle("is-visible",visible); top.tabIndex = visible ? 0 : -1; };
  addEventListener("scroll",updateTop,{passive:true}); updateTop();
  top.addEventListener("click", () => window.scrollTo({top:0,behavior:reduced ? "auto" : "smooth"}));
})();
