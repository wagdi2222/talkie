/* Talkie Kids — letter tracing, read-aloud stories, Simon says, opposites. Offline, no AI. */
(function(){
const A = window.KidsAPI; if(!A) return;
const {screen, cheer, oops, addStars, finish, say, sayAr, shuffle, pick, esc, tone, OPP, logMiss} = A;

/* ---------- 1. letter tracing ---------- */
const WORD_FOR = {A:'apple',B:'ball',C:'cat',D:'dog',E:'egg',F:'fish',G:'grapes',H:'horse',I:'ice cream',J:'juice',K:'key',L:'lion',M:'moon',
  N:'nose',O:'orange',P:'pencil',Q:'queen',R:'rabbit',S:'sun',T:'tree',U:'umbrella',V:'van',W:'watermelon',X:'fox',Y:'yellow',Z:'zebra'};
function trace(){
  const body = screen('اكتب الحرف', 'Trace the letter');
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let idx = 0, lower = false, done = new Set();
  body.innerHTML =
    '<p class="k-hint">مرّر إصبعك فوق الحرف الرمادي حتى تلوّنه كله</p>'+
    '<div class="t-wrap"><canvas id="t-c"></canvas><div class="t-meter"><i id="t-m"></i></div></div>'+
    '<div class="k-row"><button class="k-btn ghost" id="t-clear">امسح</button><button class="k-btn ghost" id="t-case">Aa</button><button class="k-btn ghost" id="t-hear">🔊</button><button class="k-btn" id="t-next">التالي ←</button></div>'+
    '<div class="t-strip" id="t-s">'+LET.map((L,i)=>'<button data-i="'+i+'">'+L+'</button>').join('')+'</div>';
  const cv = body.querySelector('#t-c'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  let W = 0, mask = null, tol = null, targets = [], drawing = false, last = null, ink = null;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#999';
  const COLORS = ['#E53935','#FB8C00','#FBC02D','#2E9E4F','#1E63D6','#8E44AD'];
  function letter(){ const L = LET[idx]; return lower ? L.toLowerCase() : L; }
  function setup(){
    W = Math.min(body.clientWidth, 340); cv.style.width = W+'px'; cv.style.height = W+'px';
    cv.width = W*dpr; cv.height = W*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const font = '800 '+Math.round(W*0.78)+'px "Baloo Bhaijaan 2", "Readex Pro", system-ui, sans-serif';
    // exact letter shape (for coverage) and a fattened copy (for "stayed on the letter")
    mask = document.createElement('canvas'); mask.width = W; mask.height = W;
    const m = mask.getContext('2d'); m.font = font; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText(letter(), W/2, W*0.56);
    tol = document.createElement('canvas'); tol.width = W; tol.height = W;
    const t = tol.getContext('2d'); t.font = font; t.textAlign = 'center'; t.textBaseline = 'middle';
    t.lineWidth = W*0.09; t.lineJoin = 'round'; t.fillText(letter(), W/2, W*0.56); t.strokeText(letter(), W/2, W*0.56);
    ink = document.createElement('canvas'); ink.width = W; ink.height = W;
    const md = m.getImageData(0,0,W,W).data; targets = [];
    for(let y=0;y<W;y+=5) for(let x=0;x<W;x+=5) if(md[(y*W+x)*4+3]>128) targets.push([x,y]);
    paint(); meter(0);
    body.querySelectorAll('#t-s button').forEach((b,i)=>{ b.classList.toggle('on', i===idx); b.classList.toggle('done', done.has(i)); });
  }
  function paint(){
    ctx.clearRect(0,0,W,W);
    ctx.drawImage(tol, 0, 0); // wide guide shape, then tint it
    ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = css('--line'); ctx.fillRect(0,0,W,W);
    ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = css('--surface'); ctx.fillRect(0,0,W,W);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(ink, 0, 0);
  }
  function meter(p){ body.querySelector('#t-m').style.width = Math.round(p*100)+'%'; }
  function pos(e){ const r = cv.getBoundingClientRect(); return [ (e.clientX-r.left), (e.clientY-r.top) ]; }
  function stroke(a, b){
    const g = ink.getContext('2d'); g.strokeStyle = COLORS[idx % COLORS.length]; g.lineWidth = W*0.085; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
  }
  function score(){
    const id = ink.getContext('2d').getImageData(0,0,W,W).data, td = tol.getContext('2d').getImageData(0,0,W,W).data;
    let cov = 0; for(const [x,y] of targets) if(id[(y*W+x)*4+3]>0) cov++;
    let drawn = 0, out = 0;
    for(let y=0;y<W;y+=6) for(let x=0;x<W;x+=6){ const k=(y*W+x)*4+3; if(id[k]>0){ drawn++; if(td[k]<20) out++; } }
    return {cov: targets.length ? cov/targets.length : 0, out: drawn ? out/drawn : 0};
  }
  let won = false;
  function check(){
    const s = score(); meter(s.cov);
    if(!won && s.cov >= 0.72 && s.out <= 0.3){
      won = true; done.add(idx); const L = LET[idx];
      window.questEvent && questEvent('trace'); window.TalkieBus && TalkieBus.emit('trace');
      cheer(); addStars(2); setTimeout(()=>say(L+'! '+L+' is for '+WORD_FOR[L]+'.'), 900);
      body.querySelectorAll('#t-s button')[idx].classList.add('done');
    } else if(!won && s.out > 0.45 && s.cov > 0.2){
      body.querySelector('.k-hint').textContent = 'حاول أن تبقى داخل الحرف الرمادي';
    }
  }
  cv.addEventListener('pointerdown', e=>{ e.preventDefault(); cv.setPointerCapture(e.pointerId); drawing = true; last = pos(e); stroke(last, last); paint(); });
  cv.addEventListener('pointermove', e=>{ if(!drawing) return; e.preventDefault(); const p = pos(e); stroke(last, p); last = p; paint(); });
  const up = ()=>{ if(drawing){ drawing = false; check(); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const go = i => { idx = (i+LET.length)%LET.length; won = false; body.querySelector('.k-hint').textContent='مرّر إصبعك فوق الحرف الرمادي حتى تلوّنه كله'; setup(); say(LET[idx]); };
  body.querySelector('#t-clear').onclick = ()=>{ won=false; ink.getContext('2d').clearRect(0,0,W,W); paint(); meter(0); };
  body.querySelector('#t-case').onclick = ()=>{ lower = !lower; body.querySelector('#t-case').textContent = lower ? 'aA' : 'Aa'; go(idx); };
  body.querySelector('#t-hear').onclick = ()=>say(LET[idx]+'. '+LET[idx]+' is for '+WORD_FOR[LET[idx]]+'.');
  body.querySelector('#t-next').onclick = ()=>go(idx+1);
  body.querySelectorAll('#t-s button').forEach(b=>b.onclick = ()=>go(+b.dataset.i));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(()=>{ setup(); say(LET[idx]); });
}

/* ---------- 2. stories ---------- */
const STORIES = [
  {t:'Sam the Cat', ar:'القط سام', icon:'🐱', pages:[
    ['🐱','This is Sam. Sam is a little cat.','هذا سام. سام قط صغير.'],
    ['🐱🔴','Sam has a red ball.','عند سام كرة حمراء.'],
    ['🔴🌳','The ball rolls under a big tree.','تتدحرج الكرة تحت شجرة كبيرة.'],
    ['🐦🌳','A bird sits on the tree. Hello, bird!','عصفور يجلس على الشجرة. مرحبًا يا عصفور!'],
    ['🐱😴','Sam is tired. Good night, Sam!','سام متعب. تصبح على خير يا سام!']],
   qs:[['What is the cat\'s name?',[['🐱','Sam'],['🐶','Max'],['🐰','Bob']],0],
       ['What color is the ball?',[['🔵','blue'],['🔴','red'],['🟢','green']],1],
       ['Where does the ball roll?',[['🌳','under the tree'],['🛏️','on the bed'],['📦','in the box']],0]]},
  {t:'The Big Red Bus', ar:'الحافلة الحمراء', icon:'🚌', pages:[
    ['🚌','Look! A big red bus.','انظر! حافلة حمراء كبيرة.'],
    ['👦👧🚌','Ali and Mona get on the bus.','علي ومنى يركبان الحافلة.'],
    ['🚌🏫','The bus goes to school.','تذهب الحافلة إلى المدرسة.'],
    ['📚🏫','They read books at school.','يقرآن الكتب في المدرسة.'],
    ['🏠😃','Then they go home. They are happy.','ثم يعودان إلى البيت. هما سعيدان.']],
   qs:[['What color is the bus?',[['🟡','yellow'],['🔴','red'],['🔵','blue']],1],
       ['Where does the bus go?',[['🏫','school'],['🏥','hospital'],['🏖️','beach']],0],
       ['How do they feel?',[['😢','sad'],['😠','angry'],['😃','happy']],2]]},
  {t:'My Garden', ar:'حديقتي', icon:'🌸', pages:[
    ['🌱','I have a small garden.','عندي حديقة صغيرة.'],
    ['💧🌱','I give water to my plants every day.','أسقي نباتاتي كل يوم.'],
    ['☀️🌱','The sun is hot and bright.','الشمس حارة ومشرقة.'],
    ['🌸🌼','Now I have pink and yellow flowers!','الآن عندي أزهار وردية وصفراء!'],
    ['🐝🌸','A bee says, buzz, buzz!','نحلة تقول: بزز، بزز!']],
   qs:[['What do I give my plants?',[['🥛','milk'],['💧','water'],['🧃','juice']],1],
       ['What colors are the flowers?',[['🌸🌼','pink and yellow'],['🔵⚫','blue and black'],['🟤⚪','brown and white']],0],
       ['Who says buzz?',[['🐶','a dog'],['🐱','a cat'],['🐝','a bee']],2]]},
  {t:'Lulu the Duck', ar:'البطة لولو', icon:'🦆', pages:[
    ['🦆','Lulu is a little duck.','لولو بطة صغيرة.'],
    ['🦆🌊','Lulu can swim in the lake.','لولو تستطيع السباحة في البحيرة.'],
    ['🦆🐸','She sees a green frog.','ترى ضفدعًا أخضر.'],
    ['🐸⬆️','The frog can jump. Jump, jump, jump!','الضفدع يستطيع القفز. اقفز، اقفز، اقفز!'],
    ['🦆❤️🐸','Lulu and the frog are friends.','لولو والضفدع صديقان.']],
   qs:[['Who is Lulu?',[['🦆','a duck'],['🐱','a cat'],['🐶','a dog']],0],
       ['What color is the frog?',[['🔴','red'],['🟢','green'],['🟣','purple']],1],
       ['What can the frog do?',[['✈️','fly'],['📖','read'],['⬆️','jump']],2]]},
  {t:'Breakfast Time', ar:'وقت الفطور', icon:'🍞', pages:[
    ['⏰','It is seven o\'clock. Good morning!','الساعة السابعة. صباح الخير!'],
    ['🥛🍞','I drink milk and eat bread.','أشرب الحليب وآكل الخبز.'],
    ['🍌','I eat a banana too. Yummy!','وآكل موزة أيضًا. لذيذ!'],
    ['🦷✨','I brush my teeth.','أنظف أسناني.'],
    ['🎒👋','I take my bag. Bye, Mom!','آخذ حقيبتي. مع السلامة يا أمي!']],
   qs:[['What time is it?',[['7️⃣','seven'],['🔟','ten'],['2️⃣','two']],0],
       ['What do I drink?',[['🧃','juice'],['🥛','milk'],['💧','water']],1],
       ['What do I take?',[['⚽','my ball'],['🧸','my teddy'],['🎒','my bag']],2]]},
  {t:'At the Zoo', ar:'في حديقة الحيوان', icon:'🦁', pages:[
    ['🦁🦒🐘','We go to the zoo.','نذهب إلى حديقة الحيوان.'],
    ['🦁','The lion is big and strong.','الأسد كبير وقوي.'],
    ['🐒🍌','The monkey eats a banana.','القرد يأكل موزة.'],
    ['🦒','The giraffe is very tall.','الزرافة طويلة جدًا.'],
    ['🐘💦','The elephant takes a bath. Splash!','الفيل يستحم. طشش!']],
   qs:[['What does the monkey eat?',[['🍎','an apple'],['🍌','a banana'],['🥕','a carrot']],1],
       ['Who is very tall?',[['🦒','the giraffe'],['🐒','the monkey'],['🦁','the lion']],0],
       ['Who takes a bath?',[['🦁','the lion'],['🐒','the monkey'],['🐘','the elephant']],2]]},
];
function stories(){
  const body = screen('قصص قصيرة','Stories');
  body.innerHTML = '<div class="k-grid">'+STORIES.map((s,i)=>'<button class="k-tile k'+(i%6+1)+'" data-s="'+i+'"><span class="k-ico">'+s.icon+'</span><b>'+esc(s.ar)+'</b><span>'+esc(s.t)+'</span></button>').join('')+'</div>';
  body.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>readStory(STORIES[+b.dataset.s]));
}
function readStory(st){
  const body = screen(st.ar, st.t);
  let p = 0, showAr = false, timer = null, reading = false;
  body.innerHTML = '<div class="s-page"><div class="s-pic" id="s-pic"></div><div class="s-text" id="s-text"></div><div class="s-ar" id="s-ar" hidden></div></div>'+
    '<div class="k-row"><button class="k-btn ghost" id="s-prev">→</button><button class="k-btn" id="s-read">🔊 اقرأ لي</button><button class="k-btn ghost" id="s-next">←</button></div>'+
    '<div class="k-row"><button class="k-btn ghost" id="s-tr">الترجمة</button><button class="k-btn ghost" id="s-me">🎤 اقرأ أنت</button></div><div class="k-heard" id="s-hd"></div><div class="k-progress" id="s-pr"></div>'+
    '<p class="k-hint">اضغط أي كلمة لتسمعها وحدها</p>';
  const $b = id => body.querySelector(id);
  const stopRead = ()=>{ reading=false; clearInterval(timer); timer=null; try{ speechSynthesis.cancel(); }catch(e){} body.querySelectorAll('.s-w').forEach(w=>w.classList.remove('on')); };
  A.setCleanup(()=>{ stopRead(); try{ stopListening(true); }catch(e){} });
  const norm = w => w.toLowerCase().replace(/[^a-z']/g,'');
  /* the child reads the page aloud; each word lights up green when the phone hears it in order */
  function readMe(){
    if(typeof rec!=='undefined' && rec){ stopListening(); return; }
    if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){ $b('#s-hd').textContent='هذا المتصفح لا يدعم الميكروفون. جرّب Safari أو Chrome.'; return; }
    stopRead();
    const spans=[...body.querySelectorAll('.s-w')], target=spans.map(s=>norm(s.textContent));
    spans.forEach(s=>s.classList.remove('got'));
    let doneHere=false;
    $b('#s-hd').textContent='اقرأ الجملة بصوت عالٍ…';
    listen({btn:$b('#s-me'), continuous:true, onText:t=>{
      const heard=t.split(/\s+/).map(norm).filter(Boolean); let i=0, j=0; const got=new Array(target.length).fill(false);
      while(i<target.length && j<heard.length){
        if(heard[j]===target[i]){ got[i]=true; i++; j++; }
        else if(i+1<target.length && heard[j]===target[i+1]){ i++; }      // a word the phone missed; keep going
        else j++;
      }
      spans.forEach((s,k)=>s.classList.toggle('got', got[k]));
      const ratio=got.filter(Boolean).length/target.length;
      if(!doneHere && ratio>=0.85){ doneHere=true; stopListening(); cheer(); addStars(1); $b('#s-hd').textContent='قرأتها رائع! 🌟'; }
    }, onEnd:()=>{ if(!doneHere && $b('#s-hd')) $b('#s-hd').textContent='اضغط «اقرأ أنت» لتكمل القراءة'; }});
  }
  function render(){
    stopRead();
    const [pic, en, ar] = st.pages[p];
    $b('#s-pic').textContent = pic;
    $b('#s-text').innerHTML = en.split(' ').map((w,i)=>'<span class="s-w" data-i="'+i+'">'+esc(w)+'</span>').join(' ');
    $b('#s-ar').textContent = ar; $b('#s-ar').hidden = !showAr; $b('#s-hd').textContent='';
    $b('#s-pr').innerHTML = st.pages.map((_,k)=>'<i class="'+(k<=p?'done':'')+'"></i>').join('');
    $b('#s-next').textContent = p===st.pages.length-1 ? 'الأسئلة ←' : '←';
    body.querySelectorAll('.s-w').forEach(w=>w.onclick=()=>{ stopRead(); w.classList.add('on'); say(w.textContent.replace(/[^A-Za-z']/g,''), ()=>w.classList.remove('on')); });
    read();
  }
  function read(){
    stopRead(); reading = true;
    const en = st.pages[p][1], spans = [...body.querySelectorAll('.s-w')];
    // highlight words in time with the voice; boundary events where the phone supports them, otherwise an estimate
    const starts = []; let pos = 0; en.split(' ').forEach(w=>{ starts.push(pos); pos += w.length+1; });
    let gotBoundary = false, k = 0;
    const mark = i => spans.forEach((s,j)=>s.classList.toggle('on', j===i));
    try{
      const u = new SpeechSynthesisUtterance(en);
      const vs = speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang)); const v = vs.find(v=>v.voiceURI===S.voice) || vs[0];
      if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-US';
      u.rate = 0.8;
      u.onboundary = e=>{ if(e.name && e.name!=='word') return; gotBoundary = true; clearInterval(timer); let i=0; while(i+1<starts.length && starts[i+1]<=e.charIndex) i++; mark(i); };
      u.onstart = ()=>{ timer = setInterval(()=>{ if(gotBoundary){ clearInterval(timer); return; } mark(k++); if(k>spans.length) clearInterval(timer); }, 430); };
      u.onend = u.onerror = ()=>{ clearInterval(timer); mark(-1); reading = false; };
      speechSynthesis.cancel(); setTimeout(()=>speechSynthesis.speak(u), 60);
    }catch(e){}
  }
  $b('#s-read').onclick = read;
  $b('#s-me').onclick = readMe;
  $b('#s-tr').onclick = ()=>{ showAr = !showAr; $b('#s-ar').hidden = !showAr; };
  $b('#s-prev').onclick = ()=>{ if(p>0){ p--; render(); } };
  $b('#s-next').onclick = ()=>{ if(p<st.pages.length-1){ p++; render(); } else { stopRead(); addStars(2); window.questEvent && questEvent('story'); window.TalkieBus && TalkieBus.emit('story'); storyQuiz(st); } };
  render();
}
function storyQuiz(st){
  const body = screen(st.ar, 'أسئلة القصة');
  let i = 0, score = 0, tries = 0;
  const show = ()=>{
    if(i>=st.qs.length) return finish(body, score, st.qs.length, ()=>readStory(st));
    const [q, opts, a] = st.qs[i]; tries = 0;
    body.innerHTML = '<div class="k-qcard"><div class="k-sent" style="font-size:1.5rem">'+esc(q)+'</div><button class="k-btn ghost" id="q-h">🔊</button></div>'+
      '<div class="s-opts">'+opts.map(([e,w],k)=>'<button class="k-choice s-opt" data-k="'+k+'"><span class="k-emo lg">'+e+'</span><b>'+esc(w)+'</b></button>').join('')+'</div>'+
      '<div class="k-progress">'+st.qs.map((_,k)=>'<i class="'+(k<i?'done':'')+'"></i>').join('')+'</div>';
    body.querySelector('#q-h').onclick = ()=>say(q);
    body.querySelectorAll('.s-opt').forEach(b=>b.onclick=()=>{
      const k = +b.dataset.k;
      if(k===a){ b.classList.add('k-right'); if(tries===0) score++; addStars(tries===0?1:0); cheer(opts[a][1]); i++; setTimeout(show, 1800); }
      else { tries++; oops(b); say('Not '+opts[k][1]+'. Try again!'); }
    });
    say(q);
  };
  show();
}

/* ---------- 3. Simon says ---------- */
const MOVES = [['🦘','Jump!','اقفز'],['👏','Clap your hands!','صفّق'],['👃','Touch your nose!','المس أنفك'],['🙆','Touch your head!','المس رأسك'],
  ['👋','Wave hello!','لوّح بيدك'],['🔄','Turn around!','استدر'],['🪑','Sit down!','اجلس'],['🧍','Stand up!','قف'],['🏃','Run in place!','اركض في مكانك'],
  ['🙌','Raise your hands!','ارفع يديك'],['🦶','Stamp your feet!','اضرب الأرض بقدميك'],['😃','Smile!','ابتسم'],['👂','Touch your ears!','المس أذنيك'],
  ['🦵','Touch your knees!','المس ركبتيك'],['🐸','Hop like a frog!','اقفز مثل الضفدع'],['🤫','Be quiet!','اسكت']];
function simon(){
  const body = screen('Simon says', 'اسمع وتحرّك');
  body.innerHTML = '<div class="k-qcard"><div class="k-big2">🧑‍🏫</div><p class="k-hint" style="font-size:1rem">إذا قال <b dir="ltr">Simon says</b> قبل الحركة، افعلها!<br>وإذا لم يقلها، لا تتحرك أبدًا 🤫</p></div><button class="k-btn big" id="sm-go" style="width:100%">ابدأ</button>';
  body.querySelector('#sm-go').onclick = ()=>sayAr('إذا قال سايمن سيز افعل الحركة، وإذا لم يقلها لا تتحرك', run);
  function run(){
    const ROUNDS = 10, list = shuffle(MOVES).slice(0, ROUNDS).map((m,i)=>({m, simon: i===0 ? true : Math.random() < 0.7}));
    let r = 0, score = 0, t = null;
    A.setCleanup(()=>clearTimeout(t));
    const next = ()=>{
      if(r>=ROUNDS) return finish(body, score, ROUNDS, simon);
      const {m:[e,en,ar], simon:si} = list[r];
      body.innerHTML = '<div class="k-qcard sm-card"><div class="k-big2">'+e+'</div><div class="k-sent">'+(si?'<span class="sm-s">Simon says:</span> ':'')+esc(en)+'</div><div class="k-qhint">'+ar+'</div></div>'+
        '<div class="s-opts two"><button class="k-choice sm-b" data-d="1"><span class="k-emo lg">👍</span><b>فعلتها</b></button><button class="k-choice sm-b" data-d="0"><span class="k-emo lg">✋</span><b>لم أتحرك</b></button></div>'+
        '<div class="k-progress">'+list.map((_,k)=>'<i class="'+(k<r?'done':'')+'"></i>').join('')+'</div>';
      say((si?'Simon says, ':'')+en.replace('!',''));
      body.querySelectorAll('.sm-b').forEach(b=>b.onclick=()=>{
        const did = b.dataset.d==='1', ok = did===si;
        body.querySelectorAll('.sm-b').forEach(x=>x.disabled=true);
        if(ok){ score++; addStars(1); cheer(); }
        else { oops(b); say(si ? 'Simon said it! You should move.' : 'Simon did not say it! Do not move.'); }
        r++; t = setTimeout(next, ok?1700:2600);
      });
    };
    next();
  }
}

/* ---------- 4. opposites ---------- */
function opposites(){
  const body = screen('الأضداد','Opposites');
  const pairs = shuffle(OPP.flatMap(([a,b])=>[[a,b],[b,a]])).slice(0,8);
  let i = 0, score = 0, tries = 0;
  const show = ()=>{
    if(i>=pairs.length) return finish(body, score, pairs.length, opposites);
    const [w, ans] = pairs[i]; tries = 0;
    const others = shuffle(OPP.flat().filter(x=>x!==w && x!==ans)).slice(0,2);
    const opts = shuffle([ans, ...others]);
    body.innerHTML = '<div class="k-qcard"><div class="k-big2">'+w.p+'</div><div class="k-sent">'+esc(w.en)+'</div><div class="k-qhint">ما عكس هذه الكلمة؟ · What is the opposite?</div></div>'+
      '<div class="s-opts">'+opts.map((o,k)=>'<button class="k-choice s-opt" data-k="'+k+'"><span class="k-emo lg">'+o.p+'</span><b>'+esc(o.en)+'</b></button>').join('')+'</div>'+
      '<div class="k-progress">'+pairs.map((_,k)=>'<i class="'+(k<i?'done':'')+'"></i>').join('')+'</div>';
    say('What is the opposite of '+w.en+'?');
    body.querySelectorAll('.s-opt').forEach(b=>b.onclick=()=>{
      const o = opts[+b.dataset.k];
      if(o===ans){ b.classList.add('k-right'); if(tries===0) score++; addStars(tries===0?1:0); cheer(); setTimeout(()=>say(w.en+', '+ans.en+'!'), 900); i++; setTimeout(show, 2600); }
      else { tries++; oops(b); logMiss(ans.en); say(o.en+' is not the opposite. Try again!'); }
    });
  };
  show();
}

window.KIDS_STORY = {read: readStory, list: STORIES};
window.KIDS_EXTRA = (window.KIDS_EXTRA||[]).concat([{title:'اكتب واقرأ وتحرّك', games:[
  {k:'trace', ar:'اكتب الحرف', en:'Trace letters', icon:'✍️', c:'k3', run:trace},
  {k:'stories', ar:'قصص قصيرة', en:'Stories', icon:'📖', c:'k1', run:stories},
  {k:'simon', ar:'Simon says', en:'اسمع وتحرّك', icon:'🤸', c:'k2', run:simon},
  {k:'opp', ar:'الأضداد', en:'Opposites', icon:'↕️', c:'k5', run:opposites},
]}]);
A.refresh();
})();
