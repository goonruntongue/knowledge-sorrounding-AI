/* Local teaching simulation. No installation, authentication, network or filesystem actions. */
window.ChatGPTLessons = (() => {
  const root = document.querySelector("#simulation");
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let course, step, screen, selected, task, feedback, input, mention, installed, connected, menu, search, skillRoute;
  const button = (action,label,guide=false) => '<button type="button" class="sim-control'+(guide?' guided':'')+'" data-learn="'+action+'">'+label+'</button>';
  const hint = text => '<div class="coach">'+text+'</div>';
  const scenarios = [
    {mode:"Chat",request:"文化祭サイトの見出し案を3つ相談したい。",why:"短い相談や案出しから始めたいので、Chatが自然な入口です。",result:'<h3>見出し案</h3><p>1. 好きが集まる、わたしたちの文化祭<br>2. 今日だけのワクワクを、ここに。<br>3. みんなでつくる、特別な一日</p><p>もう少し元気な雰囲気にすることもできます。</p>'},
    {mode:"Work",request:"開催情報を整理し、先生に見せる企画書を仕上げてほしい。",why:"確認して使える成果物まで任せたいので、Workを選びます。",result:'<p>✓ 開催情報を整理 → 構成を作成 → 企画書を作成</p><div class="mock-document"><small>成果物のプレビュー（練習用）</small><h3>文化祭サイト企画書</h3><p>目的：来場者に企画と時間を伝える<br>構成：見どころ・タイムテーブル・アクセス<br>次の確認：学校名と開催日を先生に確認</p></div>'},
    {mode:"Codex",request:"index.htmlのh1を変え、コードの差分と確認結果を見たい。",why:"ファイルや変更差分を見ながら開発したいので、Codexを選びます。",result:'<p>✓ index.htmlを確認 → h1を変更 → 変更箇所を確認</p><div class="diff"><del>− &lt;h1&gt;Hello!&lt;/h1&gt;</del><ins>＋ &lt;h1&gt;みんなの文化祭&lt;/h1&gt;</ins></div><p>確認結果の例：h1の文章のみ変更。他の要素は変更なし。</p>'}
  ];
  const skillSteps = ["Skillsを開いて、作業手順を追加しましょう。","作成用スキルを選びましょう。","覚えてほしい手順を依頼して送信しましょう。","作成されたスキルの内容と保存先を確認しましょう。","新しいチャットを開きましょう。","@でスキルを選び、依頼を書いて送信しましょう。","スキルに沿った結果を確認できました。"];
  const pluginSteps = ["Pluginsを開きましょう。","GitHubを検索して詳細を開きましょう。","機能を確認して＋でインストールしましょう。","外部アカウントを接続する流れを体験しましょう。","接続先とアクセス範囲を確認しましょう。","導入後は、新しいチャットを開きましょう。","@でGitHubを選び、依頼を書いて送信しましょう。","プラグインを使った結果を確認できました。"];
  function reset(value) {
    course=value;step=0;screen="ChatGPT";selected="Chat";task=0;feedback="";input="";mention=false;installed=false;connected=false;menu=false;search="";skillRoute="create";
  }
  function toolbar() {
    return '<div class="learn-toolbar">'+button("selector",screen+" ▾",course==="modes"&&step===0)+
      (screen==="ChatGPT"?'<div class="mode-switch">'+["Chat","Work"].map(m=>'<button type="button" class="sim-control" data-learn="mode-'+m+'" aria-pressed="'+(selected===m)+'">'+m+'</button>').join("")+'</div>':'<span class="lab-mini">プロジェクト / my-website</span>')+
      (menu?'<div class="product-menu">'+button("product-chatgpt","ChatGPT")+button("product-codex","Codex")+'</div>':"")+'</div>';
  }
  function composer(kind) {
    const name=kind==="creator"?(skillRoute==="create"?"$skill-creator":"$skill-installer"):course==="skills"?"依頼文整理":"GitHub";
    return '<div class="input-box">'+(kind==="creator"||mention?'<div class="mention-token">'+(kind==="creator"?"":"@ ")+name+'</div>':"")+
      '<textarea id="learn-prompt" aria-label="練習用チャット入力欄" placeholder="'+(kind==="creator"?"覚えてほしい手順を入力":"@を入力して候補を選び、依頼を入力")+'">'+escape(input)+'</textarea>'+
      '<div class="mention-results" id="mention-results" '+(kind!=="creator"&&input.includes("@")&&!mention?"":"hidden")+'><span class="lab-mini">導入済みの候補</span><br>'+button("mention","@ "+name,true)+'</div>'+
      '<div class="composer-row">'+button("example","依頼文の例を入力")+button("send","送信 ↑",kind==="creator"||mention)+'</div></div>';
  }
  function modeContent() {
    const s=scenarios[task];
    return '<div class="panel-box"><h3>課題 '+(task+1)+' / 3</h3><p>'+s.request+'</p><p class="lab-mini">この課題で選びやすい入口を試しましょう。WorkとCodexの能力には重なりがあります。</p></div>'+
      (step===0?hint("上の切り替えで、使うモードを選ぶ")+'<p>現在：<strong>'+selected+'</strong></p>'+button("try-mode","このモードで依頼を送る",true):
      '<div class="mock-result">'+s.result+'</div><p class="learn-summary">'+s.why+'</p>'+button("next-mode",task<2?"次の依頼を試す":"3つの違いを確認",true));
  }
  function skillsContent() {
    if(step===0)return '<p>同じ整理手順を何度も使えるように、Codexへスキルを導入する練習です。</p>'+hint("Skillsを開く");
    if(step===1)return '<div class="panel-box"><h3>Skills</h3><p>既存のスキルを入れるか、自分用に作るかを選びます。</p><div class="plugin-card"><b>Skill Installer</b><p>配布済みのスキルを追加します。</p>'+button("installer","$skill-installer をチャットで使う",true)+'</div><div class="plugin-card"><b>Skill Creator</b><p>手順を説明して、自分用スキルを作成します。</p>'+button("creator","$skill-creator をチャットで使う")+'</div></div>';
    if(step===2)return '<p>'+ (skillRoute==="create"?'「依頼文整理」という教材用スキルを作ります。目的と手順を書きましょう。':'教材として用意した「依頼文整理」を追加します。実機では、導入したいスキル名や配布元のURLを伝えます。')+'</p>'+composer("creator");
    if(step===3)return '<div class="panel-box"><h3>'+(skillRoute==="create"?'作成案':'配布内容の確認')+'：依頼文整理</h3><p>保存先：'+(skillRoute==="create"?'このプロジェクト内':'自分用のスキル一覧')+'</p><pre>'+(skillRoute==="create"?'.agents/skills/request-organizer/SKILL.md':'依頼文整理 / SKILL.md（教材配布データ）')+'</pre><pre>name: request-organizer\ndescription: 依頼文の整理に使う\n\n1. 目的を取り出す\n2. 対象ファイルを明確にする\n3. 変更内容と条件を分ける\n4. 不明点は推測せず質問する</pre><p>自分が繰り返したい手順になっているか確認します。</p>'+button("save-skill","内容を確認して"+(skillRoute==="create"?"保存":"導入")+"（練習）",true)+'</div>';
    if(step===4)return '<div class="panel-box"><h3 class="success">✓ スキルを登録しました（練習）</h3><p>Skills一覧：依頼文整理 / '+(skillRoute==="create"?'このプロジェクト':'自分用')+'</p><p>次はチャット欄から呼び出して使ってみましょう。</p>'+button("new-chat","＋ 新しいチャット",true)+'</div>';
    if(step===5)return '<p>課題：「見出しを変えて。色はそのまま」を、スキルで整理します。</p>'+hint(mention?"依頼を書いて送信":"入力欄に @ を入力し、候補を選ぶ")+composer("use");
    return '<div class="mock-result"><h3>✓ 依頼文整理を使った結果（例）</h3><p><b>目的：</b>見出しを変更する<br><b>対象ファイル：</b>未指定<br><b>変更内容：</b>新しい見出しの文章は未指定<br><b>条件：</b>色は変えない</p><p>確認したいこと：どのファイルの見出しを、何という文章に変えますか？</p></div><p>スキルの「不明点を推測しない」という手順も反映されています。</p>'+button("again","もう一度練習");
  }
  function pluginsContent() {
    if(step===0)return '<p>GitHubプラグインを追加し、教材用リポジトリのREADMEを読む流れを体験します。</p>'+hint("Pluginsを開く");
    if(step===1)return '<div class="panel-box"><h3>Plugins</h3><label for="plugin-search">プラグイン名で検索</label><input class="search-field" id="plugin-search" value="'+escape(search)+'" placeholder="GitHub">'+button("search","検索",true)+'<div id="search-results">'+(search?(search.toLowerCase().includes("github")?'<div class="plugin-card"><b>GitHub</b><p>リポジトリ・Issue・PRなどを扱う道具</p>'+button("details","詳細を見る",true)+'</div>':'<p>教材では「GitHub」を検索してください。</p>'):"")+'</div></div>';
    if(step===2)return '<div class="panel-box"><h3>GitHub</h3><p>リポジトリの情報や開発作業を扱うプラグインです。</p><p>この課題ではREADMEを読む機能を使います。</p>'+button("install","＋ インストール（練習）",true)+'</div>';
    if(step===3)return '<div class="panel-box"><h3>✓ インストール済み</h3><p>道具は追加されましたが、まだアカウントには接続していません。</p>'+button("connect","GitHubに接続（練習）",true)+'</div>';
    if(step===4)return '<div class="panel-box"><h3>接続内容を確認（教材用）</h3><p>アカウント：student-demo<br>対象：school-festival</p><div class="permission-scope"><p>この練習で使う情報：選んだリポジトリのREADMEを読む。</p><label><input id="scope-check" type="checkbox"> 接続先と表示されたアクセス範囲を確認しました</label></div><p class="lab-mini">実際の認証画面・要求される権限はサービスにより異なります。このチェック欄は確認手順を学ぶための再現です。</p>'+button("authorize","接続を完了（練習）",true)+button("cancel-connect","戻って確認する")+'</div>';
    if(step===5)return '<div class="panel-box"><h3>✓ 接続済み（練習）</h3><p>新しいチャットで、プラグインを指定して頼んでみましょう。</p>'+button("new-chat","＋ 新しいチャット",true)+'</div>';
    if(step===6)return '<p>課題：GitHubのschool-festivalリポジトリのREADMEを要約します。</p>'+hint(mention?"何を調べるか書いて送信":"入力欄に @ を入力し、GitHubを選ぶ")+composer("use");
    return '<div class="mock-result"><h3>✓ GitHubを使った結果（教材用データ）</h3><p>参照：student-demo / school-festival / README.md</p><p>文化祭の案内サイトです。index.htmlがトップページ、css/style.cssがデザインを担当します。公開前に開催日時とアクセス情報を確認します。</p></div><p>プラグインで情報にアクセスし、その情報に基づいて回答する流れを体験しました。</p>'+button("again","もう一度練習");
  }
  function render() {
    const complete=course==="modes"?step===2:course==="skills"?step===6:step===7;
    const instructions=course==="skills"?skillSteps:pluginSteps;
    document.querySelector("#progress").textContent=complete?"COMPLETE":course==="modes"?"課題 "+(task+1)+" / 3":"STEP "+(step+1)+" / "+(course==="skills"?6:7);
    document.querySelector("#instruction").textContent=course==="modes"?(complete?"使い分けの練習が完了しました。":step===0?"依頼に合う入口を選んで送信しましょう。":"結果と、選んだ理由を確認しましょう。"):instructions[step];
    const nav=course==="skills"?button("open-skills","Skills",step===0):course==="plugins"?button("open-plugins","Plugins",step===0):"";
    root.innerHTML='<div class="learn-shell"><aside class="learn-sidebar"><strong>ChatGPT</strong><span class="lab-mini">練習用アカウント</span><p>＋ 新しいチャット</p>'+nav+'<p class="lab-mini">教材の操作だけを再現しています。</p></aside><div class="learn-main"><div class="learn-mobile-nav">'+nav+'</div>'+toolbar()+
      (course==="modes"?(complete?'<div class="panel-box"><h3>相談・成果物・開発</h3><p>Chat：会話で考える<br>Work：成果物まで任せる<br>Codex：開発の詳細を見ながら進める</p><p>WorkとCodexの能力には重なりがあります。目的と見やすい画面で選びましょう。</p>'+button("again","もう一度練習")+'</div>':modeContent()):course==="skills"?skillsContent():pluginsContent())+
      (feedback?'<p class="feedback" role="alert">'+escape(feedback)+'</p>':"")+'</div></div>';
    root.querySelectorAll("[data-learn]").forEach(el=>el.addEventListener("click",()=>act(el.dataset.learn)));
    const text=root.querySelector("#learn-prompt");
    if(text){
      text.addEventListener("input",()=>{input=text.value;const results=root.querySelector("#mention-results");results.hidden=mention||!input.includes("@")||(course==="skills"&&step===2);});
      text.addEventListener("keydown",event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();act("send");}});
    }
    root.querySelector("#plugin-search")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();act("search");}});
  }
  function act(action) {
    feedback="";
    if(action==="selector")menu=!menu;
    if(action==="product-chatgpt"){screen="ChatGPT";selected="Chat";menu=false;}
    if(action==="product-codex"){screen="Codex";selected="Codex";menu=false;}
    if(action.startsWith("mode-"))selected=action.slice(5);
    if(action==="try-mode"){
      if(selected===scenarios[task].mode)step=1;
      else feedback="この課題では "+scenarios[task].mode+" を試しましょう。"+scenarios[task].why+" ほかのモードでも対応できることはあります。";
    }
    if(action==="next-mode"){if(task<2){task++;step=0;}else step=2;}
    if(action==="open-skills"&&course==="skills"&&step===0){step=1;screen="Codex";selected="Codex";}
    if(action==="creator"){step=2;input="";}
    if(action==="installer"){skillRoute="install";step=2;input="";}
    if(action==="save-skill"){installed=true;step=4;}
    if(action==="open-plugins"&&course==="plugins"&&step===0)step=1;
    if(action==="search")search=root.querySelector("#plugin-search").value.trim();
    if(action==="details")step=2;
    if(action==="install"){installed=true;step=3;}
    if(action==="connect")step=4;
    if(action==="authorize"){
      if(root.querySelector("#scope-check").checked){connected=true;step=5;}
      else feedback="表示された接続先とアクセス範囲を確認し、チェックしてください。";
    }
    if(action==="cancel-connect")step=3;
    if(action==="new-chat"){step=course==="skills"?5:6;input="";mention=false;}
    if(action==="mention"){mention=true;input=input.replace(/@[^\s　]*\s*/,"");}
    if(action==="example"){
      input=course==="skills"?(step===2?(skillRoute==="create"?"「依頼文整理」をこのプロジェクト用に作って。目的・対象ファイル・変更内容・条件に整理し、不明点は質問して。":"教材で配布された「依頼文整理」を自分用のスキルとして導入してください。"):"見出しを変えて。色はそのまま。"):"school-festivalのREADMEを要約して。";
      if(!(course==="skills"&&step===2)&&!mention)input="@ "+input;
    }
    if(action==="send"){
      if(!input.trim())feedback="依頼内容を入力してください。例文も使えます。";
      else if(course==="skills"&&step===2){step=3;input="";}
      else if(!mention)feedback="@の候補から使う機能を選んでください。文字を打つだけでなく、選択する操作を体験しましょう。";
      else if(!input.replace(/@/g,"").trim())feedback="機能を選んだら、依頼内容も書きましょう。";
      else if(course==="skills"&&installed)step=6;
      else if(course==="plugins"&&installed&&connected)step=7;
    }
    if(action==="again")reset(course);
    render();
    if(["example","mention"].includes(action))root.querySelector("#learn-prompt")?.focus();
  }
  return {reset,render};
})();
