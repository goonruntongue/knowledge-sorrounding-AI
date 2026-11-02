(() => {
  const questions = [
    {title:'HTML / CSS / JSだけで作ったクイズゲーム', task:'問題と答えはアプリ内にあり、成績の共有や保存は不要です。まず何があれば公開できる？', choices:['画面の配信＋データベースが必須','HTML・CSS・JSを配信できる公開先','Googleログインが必須'], answer:1, why:'採点までブラウザー内で完結するので、静的ファイルの配信で動かせます。ランキングや共有を追加すると、必要な部品も変わります。', stack:'ブラウザー ↔ 静的ホスティング', example:'例：Cloudflare PagesにHTML・CSS・JSを配置。'},
    {title:'どこからでも履歴を見られるメモ帳',task:'自分のメモと過去の編集履歴を、スマホでも別のPCでも確認したい。必要な構成は？',choices:['各端末のブラウザーだけに保存','最新版だけをサーバーに上書き保存','共通の保存先＋編集履歴の記録＋本人確認'],answer:2,why:'端末を越えて使うには共通の保存先が必要です。過去の文章は、更新ごとに別の履歴として残します。個人のメモなら、本人確認と「本人だけが読める」権限設定も必要です。',stack:'画面 ↔ 認証・保存処理 ↔ メモと編集履歴のDB',example:'構成例①：Cloudflare Pages＋Supabase Auth / Database。構成例②：Firebase Hosting＋Firebase Authentication＋Cloud Firestore。Firebase AuthenticationはGoogleログイン（OAuth 2.0）を標準でサポートしています。どちらも編集のたびに履歴を残す処理と、本人だけが読み書きできるアクセス制限を実装します。'},
    {title:'常にリアルタイムに交信するチャットアプリ',task:'相手の投稿を、ページの再読み込みなしで受け取りたい。特に必要な仕組みは？',choices:['接続中の利用者にメッセージを届けるリアルタイム通信','HTMLを公開するだけ','自分の端末にだけメッセージを保存'],answer:0,why:'投稿を受け取り、接続中の相手へ届ける仕組みを用意します。過去の会話も読みたい場合は、通信とは別にメッセージの保存も必要です。',stack:'画面 ↔ リアルタイム通信 ↔ 相手の画面（履歴はDBへ）',example:'構成例①：Cloudflare Pages＋Cloudflare Workers＋Durable Objects。Pagesで画面を配信し、WorkersとDurable ObjectsでWebSocket通信によるメッセージの中継を実装します。会話履歴を残す場合は、Durable Objectsの永続ストレージなどに保存する処理も実装します。構成例②：Firebase Hosting＋Firebase Realtime Database。Hostingで画面を配信し、Realtime Databaseに投稿を保存して、データの変更を各利用者の画面にリアルタイムで反映します。どちらも利用者の認証・アクセス権限を要件に応じて設定します。'},
    {title:'Googleのログイン認証がついたアプリ',task:'Googleアカウントでログインできるようにするには？',choices:['Googleのロゴを置くだけ','Googleと連携する認証の仕組みを設定する','利用者のGoogleパスワードを自分のDBに保存する'],answer:1,why:'認証サービスなどを通じてGoogleと連携し、ログイン結果を確認します。利用者のGoogleパスワードをアプリ側で集める必要はありません。ログイン後の閲覧・編集権限は別に設定します。',stack:'画面 ↔ 認証サービス ↔ Google',example:'例：Firebase Hosting＋Firebase Authentication。Hostingで画面を公開し、Firebase Authenticationが標準でサポートするGoogleログインを利用します。Googleプロバイダーの有効化や承認済みドメインなど、認証に必要な設定を行います。'},
    {title:'複数のテーブルで個人の情報を管理するアプリ',task:'架空の会員・所属・活動履歴を関連付け、詳しい状態を検索・登録したい。適した構成は？',choices:['すべての情報をHTMLに直接書き込む','リアルタイム通信だけを追加する','関連を扱うDB＋検索・登録処理＋利用者ごとの権限'],answer:2,why:'会員IDなどでテーブルを結び、関連する情報をまとめて取り出します。SQLを使うリレーショナルDBが有力な選択肢です。登録・更新処理に加え、誰がどの情報を扱えるかも設計します。',stack:'画面 ↔ 認証・検索・登録処理 ↔ 関連する複数のテーブル',example:'例：Cloudflare Pages＋Supabase Auth / PostgreSQL。会員・所属・活動履歴をIDで関連付けます。'}
  ];
  const dialog=document.getElementById('deploy-quiz'), launch=document.getElementById('deploy-quiz-open');
  const area=document.getElementById('dq-question'), feedback=document.getElementById('dq-feedback'), nav=document.getElementById('dq-nav');
  let current=0, selections=Array(5).fill(null), checked=Array(5).fill(false), oldOverflow='';
  const score=()=>checked.filter((v,i)=>v&&selections[i]===questions[i].answer).length;
  function render(){
    const q=questions[current];
    nav.replaceChildren(...questions.map((item,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`Q${i+1}${checked[i]?' ✓':''}`;b.setAttribute('aria-label',`第${i+1}問 ${item.title}`);b.setAttribute('aria-current',i===current?'step':'false');b.onclick=()=>{current=i;render();document.getElementById('dq-title').focus();};return b;}));
    area.innerHTML=`<p class="dq-count">QUESTION ${current+1} / 5</p><h3 id="dq-title" tabindex="-1">${q.title}</h3><p>${q.task}</p><fieldset><legend>必要な仕組みを1つ選んでください</legend>${q.choices.map((c,i)=>`<label class="dq-option"><input type="radio" name="dq-answer" value="${i}" ${selections[current]===i?'checked':''}> <span>${c}</span></label>`).join('')}</fieldset>`;
    area.querySelectorAll('input').forEach(input=>input.onchange=()=>{selections[current]=Number(input.value);checked[current]=false;update();});
    update();document.getElementById('dq-prev').disabled=current===0;document.getElementById('dq-next').disabled=current===4;
  }
  function update(){
    const q=questions[current];document.getElementById('dq-check').disabled=selections[current]===null;
    feedback.hidden=!checked[current];
    if(checked[current]) feedback.innerHTML=`<strong>${selections[current]===q.answer?'正解！':'もう一度ポイントを確認しましょう。'}</strong><p>答え：${q.choices[q.answer]}</p><p>${q.why}</p><p class="dq-stack">${q.stack}</p><p>${q.example}</p><small>構成は一例です。同じ機能を別のサービスや自作のサーバーで実現する方法もあります。</small>`;
    const done=checked.filter(Boolean).length;
    document.getElementById('dq-progress').textContent=done===5?`5問完了！ 正解 ${score()} / 5問。解説を見直したり、最初から挑戦できます。`:`回答済み ${done} / 5問`;
  }
  launch.onclick=()=>{oldOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';};
  document.getElementById('dq-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{document.body.style.overflow=oldOverflow;launch.focus({preventScroll:true});});
  document.getElementById('dq-check').onclick=()=>{checked[current]=true;render();feedback.focus();};
  document.getElementById('dq-prev').onclick=()=>{if(current>0)current--;render();document.getElementById('dq-title').focus();};
  document.getElementById('dq-next').onclick=()=>{if(current<4)current++;render();document.getElementById('dq-title').focus();};
  document.getElementById('dq-reset').onclick=()=>{current=0;selections=Array(5).fill(null);checked=Array(5).fill(false);render();document.getElementById('dq-title').focus();};
  render();
})();
