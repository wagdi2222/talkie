/* Talkie Kids — offline English games for young Arabic speakers.
   Uses speak(), listen(), stopListening(), store, esc, $ from index.html. No AI, no key, no network. */
(function(){
const root = document.getElementById('kids');

/* ---------- vocabulary ---------- */
const CATS = [
  {k:'animals', ar:'الحيوانات', en:'Animals', icon:'🐱', items:[
    ['🐱','cat','قطة'],['🐶','dog','كلب'],['🐟','fish','سمكة'],['🐦','bird','عصفور'],['🐄','cow','بقرة'],['🐴','horse','حصان'],
    ['🐑','sheep','خروف'],['🐪','camel','جمل'],['🦁','lion','أسد'],['🐘','elephant','فيل'],['🐒','monkey','قرد'],['🐰','rabbit','أرنب'],
    ['🐢','turtle','سلحفاة'],['🦆','duck','بطة'],['🐔','chicken','دجاجة'],['🦒','giraffe','زرافة']]},
  {k:'food', ar:'الفواكه والطعام', en:'Food', icon:'🍎', items:[
    ['🍎','apple','تفاحة'],['🍌','banana','موزة'],['🍇','grapes','عنب'],['🍊','orange','برتقالة'],['🍓','strawberry','فراولة'],['🍉','watermelon','بطيخ'],
    ['🥕','carrot','جزرة'],['🍞','bread','خبز'],['🥛','milk','حليب'],['🥚','egg','بيضة'],['🍦','ice cream','آيس كريم'],['🍰','cake','كعكة'],
    ['🧃','juice','عصير'],['🍕','pizza','بيتزا']]},
  {k:'colors', ar:'الألوان', en:'Colors', icon:'🎨', items:[
    ['#E53935','red','أحمر'],['#1E63D6','blue','أزرق'],['#2E9E4F','green','أخضر'],['#FBC02D','yellow','أصفر'],['#FB8C00','orange','برتقالي'],
    ['#8E44AD','purple','بنفسجي'],['#EC5FA6','pink','وردي'],['#7B4A2A','brown','بني'],['#1B1B1B','black','أسود'],['#FFFFFF','white','أبيض']]},
  {k:'numbers', ar:'الأرقام', en:'Numbers', icon:'🔢', items:[
    ['1','one','واحد'],['2','two','اثنان'],['3','three','ثلاثة'],['4','four','أربعة'],['5','five','خمسة'],
    ['6','six','ستة'],['7','seven','سبعة'],['8','eight','ثمانية'],['9','nine','تسعة'],['10','ten','عشرة']]},
  {k:'body', ar:'جسمي', en:'My body', icon:'✋', items:[
    ['👁️','eye','عين'],['👂','ear','أذن'],['👃','nose','أنف'],['👄','mouth','فم'],['✋','hand','يد'],['🦶','foot','قدم'],
    ['🦷','tooth','سن'],['💪','arm','ذراع'],['🦵','leg','رجل']]},
  {k:'family', ar:'العائلة', en:'Family', icon:'👨‍👩‍👧', items:[
    ['👨','father','أب'],['👩','mother','أم'],['👦','brother','أخ'],['👧','sister','أخت'],['👴','grandfather','جد'],['👵','grandmother','جدة'],['👶','baby','طفل رضيع']]},
  {k:'things', ar:'أشياء حولي', en:'Things', icon:'🎒', items:[
    ['📚','book','كتاب'],['✏️','pencil','قلم رصاص'],['🎒','bag','حقيبة'],['🚪','door','باب'],['🛏️','bed','سرير'],['⚽','ball','كرة'],
    ['🧸','teddy bear','دبدوب'],['⏰','clock','ساعة'],['🔑','key','مفتاح'],['🏠','house','بيت'],['📱','phone','جوال'],['👟','shoe','حذاء']]},
  {k:'go', ar:'المواصلات', en:'Transport', icon:'🚗', items:[
    ['🚗','car','سيارة'],['🚌','bus','حافلة'],['✈️','plane','طائرة'],['🚲','bike','دراجة'],['🚂','train','قطار'],['🚢','ship','سفينة'],['🚀','rocket','صاروخ'],['🚁','helicopter','مروحية']]},
  {k:'nature', ar:'الطبيعة', en:'Nature', icon:'🌳', items:[
    ['☀️','sun','شمس'],['🌙','moon','قمر'],['⭐','star','نجمة'],['☁️','cloud','غيمة'],['🌧️','rain','مطر'],['🌳','tree','شجرة'],['🌸','flower','زهرة'],['🌊','sea','بحر']]},
].map(c=>({...c, items:c.items.map(([p,en,ar])=>({p,en,ar,sw:/^#/.test(p)?p:null,num:/^\d+$/.test(p)}))}));

const ABC = [
  ['A','apple','🍎','أ'],['B','ball','⚽','ب'],['C','cat','🐱','ك'],['D','dog','🐶','د'],['E','egg','🥚','إ'],['F','fish','🐟','ف'],
  ['G','grapes','🍇','ج'],['H','horse','🐴','هـ'],['I','ice cream','🍦','إي'],['J','juice','🧃','ج'],['K','key','🔑','ك'],['L','lion','🦁','ل'],
  ['M','moon','🌙','م'],['N','nose','👃','ن'],['O','orange','🍊','أو'],['P','pencil','✏️','پ'],['Q','queen','👸','كو'],['R','rabbit','🐰','ر'],
  ['S','sun','☀️','س'],['T','tree','🌳','ت'],['U','umbrella','☂️','أ'],['V','van','🚐','ڤ'],['W','watermelon','🍉','و'],['X','fox','🦊','كس'],
  ['Y','yellow','💛','ي'],['Z','zebra','🦓','ز']];
const ABC_TIP = {P:'P ليست B: انفخ هواءً من شفتيك', V:'V ليست F: الأسنان على الشفة مع صوت', X:'X تأتي في آخر كلمة fox'};

const STICKERS = ['🦄','🐼','🦊','🐸','🐙','🦋','🐬','🦖','🐧','🦉','🐳','🦜','🐝','🦀','🐞','🦩','🐨','🐯','🐵','🐹'];
const PRAISE = [['Great job!','أحسنت!'],['Well done!','رائع!'],['Super!','ممتاز!'],['Amazing!','مدهش!'],['You did it!','نجحت!']];

/* ---------- state ---------- */
const K = Object.assign({stars:0, stickers:0}, store.get('talkie-kids', {}));
const saveK = () => store.set('talkie-kids', K);
let cleanup = null;               // stops the running game's timers
function stopGame(){ if(cleanup){ try{ cleanup(); }catch(e){} cleanup=null; } }
window.kidsStop = stopGame;

/* ---------- helpers ---------- */
const rnd = n => Math.random()*n|0;
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pick = a => a[rnd(a.length)];
const say = (t, cb) => speak(t, 0.85, cb);
function pic(it, cls=''){
  if(it.sw) return '<span class="k-sw '+cls+'" style="background:'+it.sw+'"></span>';
  if(it.num) return '<span class="k-num '+cls+'">'+it.p+'</span>';
  return '<span class="k-emo '+cls+'">'+it.p+'</span>';
}
function arVoice(){ try{ return speechSynthesis.getVoices().find(v=>/^ar/i.test(v.lang)); }catch(e){ return null; } }
function sayAr(t, cb){
  const v=arVoice(); if(!v || !('speechSynthesis' in window)){ cb&&cb(); return; }
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.voice=v; u.lang=v.lang; u.rate=0.95;
    let d=false; const f=()=>{ if(!d){ d=true; cb&&cb(); } }; u.onend=f; u.onerror=f; setTimeout(()=>speechSynthesis.speak(u),60); }catch(e){ cb&&cb(); }
}
let AC=null;
function tone(kind){
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const notes = kind==='good' ? [660,880,1320] : kind==='pop' ? [520] : [260,200];
    notes.forEach((f,i)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type = kind==='bad'?'triangle':'sine'; o.frequency.value=f;
      const t=AC.currentTime+i*0.09; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.22);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.25); });
  }catch(e){}
}
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box=document.createElement('div'); box.className='k-confetti';
  for(let i=0;i<22;i++){ const s=document.createElement('span'); s.textContent=pick(['⭐','🎉','✨','🎈','💛','🌟']);
    s.style.left=rnd(100)+'%'; s.style.animationDelay=(Math.random()*0.4).toFixed(2)+'s'; s.style.fontSize=(18+rnd(18))+'px'; box.append(s); }
  document.body.append(box); setTimeout(()=>box.remove(),2200);
}
function addStars(n){
  K.stars+=n; let unlocked=null;
  while(Math.floor(K.stars/10) > K.stickers && K.stickers < STICKERS.length){ unlocked=STICKERS[K.stickers]; K.stickers++; }
  saveK(); paintStars();
  if(unlocked) setTimeout(()=>stickerReveal(unlocked), 700);
}
function paintStars(){ document.querySelectorAll('[data-kstars]').forEach(e=>e.textContent=K.stars); }
function stickerReveal(s){
  const o=document.createElement('div'); o.className='k-overlay';
  o.innerHTML='<div class="k-reveal"><div class="k-big">'+s+'</div><b>ملصق جديد!</b><span>New sticker!</span><button class="k-btn">رائع</button></div>';
  document.body.append(o); tone('good'); confetti(); say('You got a new sticker!');
  o.querySelector('button').onclick=()=>o.remove();
}
function cheer(word){
  const [en,ar]=pick(PRAISE); tone('good'); confetti();
  const b=document.createElement('div'); b.className='k-cheer'; b.innerHTML='<b>'+ar+'</b><span>'+en+'</span>'; document.body.append(b);
  setTimeout(()=>b.remove(),1300);
  say(word ? en+' '+word+'!' : en);
}
function oops(el){ tone('bad'); if(el){ el.classList.remove('k-shake'); void el.offsetWidth; el.classList.add('k-shake'); } }

/* ---------- screens ---------- */
function screen(title, sub){
  stopGame(); try{ speechSynthesis.cancel(); }catch(e){}
  root.innerHTML='<div class="k-top"><button class="k-back" aria-label="رجوع">→ رجوع</button><div class="k-title"><b>'+title+'</b>'+(sub?'<span>'+sub+'</span>':'')+'</div><span class="k-starpill">⭐ <b data-kstars>'+K.stars+'</b></span></div><div class="k-body"></div>';
  root.querySelector('.k-back').onclick=home;
  document.getElementById('main').scrollTop=0;
  return root.querySelector('.k-body');
}
const GAMES = [
  {k:'cards', ar:'بطاقات الكلمات', en:'Word cards', icon:'🃏', c:'k1', run:()=>chooseCat('بطاقات الكلمات', flash)},
  {k:'listen', ar:'اسمع واختر', en:'Listen & tap', icon:'👂', c:'k2', run:()=>chooseCat('اسمع واختر', listenGame)},
  {k:'abc', ar:'الحروف', en:'ABC', icon:'🔤', c:'k3', run:abc},
  {k:'balloon', ar:'فرقع البالون', en:'Balloon pop', icon:'🎈', c:'k4', run:balloonMenu},
  {k:'memory', ar:'لعبة الذاكرة', en:'Memory', icon:'🧠', c:'k5', run:()=>chooseCat('لعبة الذاكرة', memory)},
  {k:'say', ar:'قل الكلمة', en:'Say it', icon:'🎤', c:'k6', run:()=>chooseCat('قل الكلمة', sayGame)},
];
function home(){
  stopGame(); try{ speechSynthesis.cancel(); }catch(e){}
  const shelf = STICKERS.slice(0, Math.min(STICKERS.length, Math.max(K.stickers+1, 5))).map((s,i)=> i<K.stickers ? '<span>'+s+'</span>' : '<span class="k-lock">?</span>').join('');
  const toNext = 10 - (K.stars % 10);
  root.innerHTML =
    '<div class="k-hero"><div><b>مرحبًا يا بطل!</b><span>Hello, superstar!</span></div><span class="k-starpill big">⭐ <b data-kstars>'+K.stars+'</b></span></div>'+
    '<div class="k-shelf-wrap"><div class="k-label">ملصقاتي · '+(K.stickers<STICKERS.length?'باقي '+toNext+' نجوم للملصق التالي':'جمعت كل الملصقات!')+'</div><div class="k-shelf">'+shelf+'</div></div>'+
    '<div class="k-grid">'+GAMES.map(g=>'<button class="k-tile '+g.c+'" data-g="'+g.k+'"><span class="k-ico">'+g.icon+'</span><b>'+g.ar+'</b><span>'+g.en+'</span></button>').join('')+'</div>'+
    '<p class="k-note">كل الألعاب تعمل دون إنترنت ودون مفتاح، ولا يتحدث الطفل مع الذكاء الاصطناعي.</p>';
  root.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>GAMES.find(g=>g.k===b.dataset.g).run());
}
function chooseCat(title, game){
  const body=screen(title,'اختر موضوعًا');
  body.innerHTML='<div class="k-grid">'+CATS.map((c,i)=>'<button class="k-tile k'+(i%6+1)+'" data-c="'+c.k+'"><span class="k-ico">'+c.icon+'</span><b>'+c.ar+'</b><span>'+c.en+'</span></button>').join('')+
    '<button class="k-tile k3" data-c="mix"><span class="k-ico">🎲</span><b>منوّع</b><span>Mix</span></button></div>';
  body.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
    const cat = b.dataset.c==='mix' ? {k:'mix', ar:'منوّع', en:'Mix', items:shuffle(CATS.filter(c=>c.k!=='numbers').flatMap(c=>c.items)).slice(0,14)} : CATS.find(c=>c.k===b.dataset.c);
    game(cat);
  });
}

/* 1. flashcards */
function flash(cat){
  const body=screen('بطاقات الكلمات', cat.ar);
  let i=0, seen=new Set();
  body.innerHTML='<button class="k-card" id="k-card"></button><div class="k-row"><button class="k-btn ghost" id="k-prev">→ السابق</button><button class="k-btn" id="k-hear">🔊 اسمع</button><button class="k-btn ghost" id="k-next">التالي ←</button></div><div class="k-dots" id="k-dots"></div>';
  const show=()=>{ const it=cat.items[i];
    body.querySelector('#k-card').innerHTML=pic(it,'xl')+'<b class="k-word">'+esc(it.en)+'</b><span class="k-ar">'+esc(it.ar)+'</span>';
    body.querySelector('#k-dots').textContent=(i+1)+' / '+cat.items.length;
    say(it.en);
    if(!seen.has(i)){ seen.add(i); if(seen.size===cat.items.length){ cheer(); addStars(3); } }
  };
  body.querySelector('#k-card').onclick=()=>say(cat.items[i].en);
  body.querySelector('#k-hear').onclick=()=>say(cat.items[i].en);
  body.querySelector('#k-next').onclick=()=>{ i=(i+1)%cat.items.length; show(); };
  body.querySelector('#k-prev').onclick=()=>{ i=(i-1+cat.items.length)%cat.items.length; show(); };
  show();
}

/* 2. listen & tap */
function listenGame(cat){
  const body=screen('اسمع واختر', cat.ar);
  const ROUNDS=8; let round=0, score=0, target=null, locked=false, tries=0;
  const order=shuffle(cat.items);
  body.innerHTML='<div class="k-ask"><button class="k-btn big" id="k-rep">🔊 اسمع مرة أخرى</button></div><div class="k-choices" id="k-ch"></div><div class="k-progress" id="k-pr"></div>';
  const prog=()=>{ body.querySelector('#k-pr').innerHTML=Array.from({length:ROUNDS},(_,k)=>'<i class="'+(k<round?'done':'')+'"></i>').join(''); };
  const ask=()=>say('Where is the '+target.en+'?');
  const next=()=>{
    if(round>=ROUNDS){ return finish(body, score, ROUNDS, ()=>listenGame(cat)); }
    locked=false; tries=0; target=order[round%order.length];
    const opts=shuffle([target, ...shuffle(cat.items.filter(x=>x!==target)).slice(0,3)]);
    const ch=body.querySelector('#k-ch');
    ch.innerHTML=opts.map((o,k)=>'<button class="k-choice" data-k="'+k+'">'+pic(o,'lg')+'</button>').join('');
    ch.querySelectorAll('.k-choice').forEach(b=>b.onclick=()=>{
      if(locked) return; const o=opts[+b.dataset.k];
      if(o===target){ locked=true; b.classList.add('k-right'); if(tries===0) score++; round++; prog(); cheer(target.en); addStars(tries===0?1:0);
        setTimeout(next, 1700); }
      else { tries++; oops(b); say('No, that is '+o.en+'.'); setTimeout(ask, 1500); }
    });
    prog(); ask();
  };
  body.querySelector('#k-rep').onclick=ask;
  if(round===0) sayAr('اسمع الكلمة واختر الصورة', next); else next();
}

/* 3. ABC */
function abc(){
  const body=screen('الحروف', 'ABC');
  body.innerHTML='<div class="k-letter" id="k-let"></div><div class="k-abc">'+ABC.map(([L],i)=>'<button data-i="'+i+'">'+L+'</button>').join('')+'</div><button class="k-btn" id="k-song" style="width:100%">🎵 اسمع كل الحروف</button>';
  const heard=new Set();
  const show=i=>{ const [L,w,e,ar]=ABC[i];
    body.querySelectorAll('.k-abc button').forEach((b,k)=>b.classList.toggle('on',k===i));
    body.querySelector('#k-let').innerHTML='<div class="k-pair"><b class="k-L">'+L+'<small>'+L.toLowerCase()+'</small></b><span class="k-emo xl">'+e+'</span></div><div class="k-word">'+L+' is for '+esc(w)+'</div><div class="k-ar">يشبه صوت حرف «'+ar+'»'+(ABC_TIP[L]?'<br>'+ABC_TIP[L]:'')+'</div>';
    say(L+'. '+L+' is for '+w+'.');
    heard.add(i); if(heard.size===ABC.length){ cheer(); addStars(5); heard.clear(); }
  };
  body.querySelectorAll('.k-abc button').forEach(b=>b.onclick=()=>show(+b.dataset.i));
  body.querySelector('#k-let').onclick=()=>{ const on=body.querySelector('.k-abc .on'); if(on) show(+on.dataset.i); };
  let songOn=false;
  body.querySelector('#k-song').onclick=()=>{ if(songOn){ songOn=false; try{speechSynthesis.cancel()}catch(e){} return; } songOn=true; say(ABC.map(a=>a[0]).join(', ')+'. Now I know my A B C!', ()=>{ songOn=false; addStars(1); }); };
  cleanup=()=>{ songOn=false; };
  show(0);
}

/* 4. balloon pop */
function balloonMenu(){
  const body=screen('فرقع البالون','اختر نوع البالونات');
  const modes=[['colors','🎨','الألوان','Colors'],['letters','🔤','الحروف','Letters'],['numbers','🔢','الأرقام','Numbers']];
  body.innerHTML='<div class="k-grid">'+modes.map(([k,i,a,e],n)=>'<button class="k-tile k'+(n+2)+'" data-m="'+k+'"><span class="k-ico">'+i+'</span><b>'+a+'</b><span>'+e+'</span></button>').join('')+'</div>';
  body.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>balloons(b.dataset.m));
}
function balloons(mode){
  const body=screen('فرقع البالون', {colors:'الألوان',letters:'الحروف',numbers:'الأرقام'}[mode]);
  const COLS=CATS.find(c=>c.k==='colors').items.filter(c=>c.en!=='white'&&c.en!=='black');
  const LET='ABCDEFGHIJKLMNOPRSTWYZ'.split(''), NUMS=['1','2','3','4','5','6','7','8','9','10'];
  const GOAL=8; let got=0, target=null, alive=true;
  body.innerHTML='<div class="k-ask"><button class="k-btn big" id="k-rep">🔊</button><b id="k-goal" class="k-goaltxt"></b></div><div class="k-sky" id="k-sky"></div><div class="k-progress" id="k-pr"></div>';
  const sky=body.querySelector('#k-sky');
  const prog=()=>{ body.querySelector('#k-pr').innerHTML=Array.from({length:GOAL},(_,k)=>'<i class="'+(k<got?'done':'')+'"></i>').join(''); };
  const label=t=> mode==='colors' ? t.en : mode==='letters' ? 'letter '+t : 'number '+t;
  const ask=()=>say('Pop the '+(mode==='colors'? target.en+' balloon' : label(target))+'!');
  const newTarget=()=>{ target = mode==='colors'?pick(COLS):mode==='letters'?pick(LET):pick(NUMS);
    body.querySelector('#k-goal').innerHTML = mode==='colors' ? '<span class="k-sw sm" style="background:'+target.sw+'"></span> '+target.en : esc(target);
    ask(); };
  const spawn=(force)=>{
    if(!alive) return;
    const val = force || (mode==='colors'?pick(COLS):mode==='letters'?pick(LET):pick(NUMS));
    const color = mode==='colors' ? val.sw : pick(COLS).sw;
    const b=document.createElement('button'); b.className='k-balloon'; b.style.left=(5+rnd(75))+'%';
    b.style.background=color; b.style.animationDuration=(6+Math.random()*3).toFixed(1)+'s';
    b.setAttribute('aria-label', mode==='colors'?val.en:val);
    if(mode!=='colors') b.innerHTML='<span>'+esc(val)+'</span>';
    b.onclick=()=>{
      if(b.classList.contains('pop')) return;
      const ok = mode==='colors' ? val===target : val===target;
      if(ok){ b.classList.add('pop'); tone('pop'); got++; prog(); addStars(1); setTimeout(()=>b.remove(),300);
        if(got>=GOAL){ alive=false; setTimeout(()=>finish(body, GOAL, GOAL, ()=>balloons(mode)), 500); }
        else { cheer(mode==='colors'?target.en:target); setTimeout(newTarget, 1500); } }
      else { oops(b); say(mode==='colors' ? 'That is '+val.en+'.' : 'That is '+val+'.'); }
    };
    b.addEventListener('animationend',()=>b.remove());
    sky.append(b);
  };
  let tick=0;
  const iv=setInterval(()=>{ tick++;
    const hasTarget=[...sky.children].some(c=>!c.classList.contains('pop') && c.getAttribute('aria-label')===(mode==='colors'?target?.en:target));
    spawn(!hasTarget && tick%2===0 ? target : null); }, 900);
  cleanup=()=>{ alive=false; clearInterval(iv); };
  body.querySelector('#k-rep').onclick=ask;
  prog(); newTarget(); spawn(target);
}

/* 5. memory */
function memory(cat){
  const body=screen('لعبة الذاكرة', cat.ar);
  const pairs=shuffle(cat.items).slice(0,6);
  const cards=shuffle(pairs.flatMap((it,k)=>[{k,face:'pic',it},{k,face:'word',it}]));
  let open=[], done=0, moves=0, busy=false;
  body.innerHTML='<p class="k-hint">اقلب بطاقتين: الصورة وكلمتها الإنجليزية</p><div class="k-mem">'+cards.map((c,i)=>'<button class="k-mc" data-i="'+i+'"><span class="k-back-face">?</span><span class="k-front">'+(c.face==='pic'?pic(c.it,'md'):'<b class="k-mw">'+esc(c.it.en)+'</b>')+'</span></button>').join('')+'</div>';
  body.querySelectorAll('.k-mc').forEach(el=>el.onclick=()=>{
    const i=+el.dataset.i, c=cards[i];
    if(busy || el.classList.contains('flip')) return;
    el.classList.add('flip'); open.push([el,c]);
    if(c.face==='word') say(c.it.en);
    if(open.length===2){
      moves++; const [[a,ca],[b,cb]]=open; open=[];
      if(ca.k===cb.k){ a.classList.add('match'); b.classList.add('match'); done++; tone('good'); say(ca.it.en); addStars(1);
        if(done===pairs.length) setTimeout(()=>finish(body, pairs.length, pairs.length, ()=>memory(cat), 'في '+moves+' محاولة'), 800); }
      else { busy=true; setTimeout(()=>{ a.classList.remove('flip'); b.classList.remove('flip'); busy=false; }, 1000); }
    }
  });
}

/* 6. say it */
function lev(a,b){ const m=[...Array(b.length+1).keys()]; for(let i=1;i<=a.length;i++){ let p=m[0]; m[0]=i; for(let j=1;j<=b.length;j++){ const t=m[j]; m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]===b[j-1]?0:1)); p=t; } } return m[b.length]; }
function heardMatch(heard, word){
  const h=heard.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(), w=word.toLowerCase();
  if(!h) return false; if((' '+h+' ').includes(' '+w+' ')) return true;
  const NUM={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};
  if(NUM[w] && (' '+h+' ').includes(' '+NUM[w]+' ')) return true;
  const n=w.split(' ').length, toks=h.split(' ');
  for(let i=0;i+n<=toks.length;i++){ const g=toks.slice(i,i+n).join(' '); if(lev(g,w) <= Math.max(1, Math.floor(w.length/4))) return true; if(g===w+'s') return true; }
  return false;
}
function sayGame(cat){
  const body=screen('قل الكلمة', cat.ar);
  if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){
    body.innerHTML='<p class="k-hint">هذه اللعبة تحتاج متصفحًا يدعم الميكروفون، مثل Safari على iPhone أو Chrome على Android.</p>'; return; }
  const ROUNDS=6, order=shuffle(cat.items).slice(0,ROUNDS); let r=0, score=0, tries=0;
  body.innerHTML='<div class="k-card" id="k-sc"></div><div class="k-row"><button class="k-btn ghost" id="k-h">🔊 اسمع</button></div><div class="k-micwrap"><button class="mic k-mic" id="k-mic" aria-label="تكلم"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button><div class="k-heard" id="k-hd">اضغط الميكروفون وقل الكلمة</div></div><div class="k-progress" id="k-pr"></div>';
  const prog=()=>{ body.querySelector('#k-pr').innerHTML=Array.from({length:ROUNDS},(_,k)=>'<i class="'+(k<r?'done':'')+'"></i>').join(''); };
  const show=()=>{ if(r>=ROUNDS) return finish(body, score, ROUNDS, ()=>sayGame(cat));
    tries=0; const it=order[r]; body.querySelector('#k-sc').innerHTML=pic(it,'xl')+'<b class="k-word">'+esc(it.en)+'</b><span class="k-ar">'+esc(it.ar)+'</span>';
    body.querySelector('#k-hd').textContent='اضغط الميكروفون وقل الكلمة'; prog(); say(it.en); };
  body.querySelector('#k-h').onclick=()=>say(order[r].en);
  body.querySelector('#k-mic').onclick=()=>{
    if(rec){ stopListening(); return; }
    const it=order[r], hd=body.querySelector('#k-hd'); hd.textContent='…';
    listen({btn:body.querySelector('#k-mic'), onText:t=>{ hd.textContent=t; }, onEnd:t=>{
      if(!t){ hd.textContent='لم أسمع شيئًا، جرّب بصوت أعلى'; return; }
      if(heardMatch(t, it.en)){ if(tries===0) score++; addStars(tries===0?2:1); cheer(it.en); r++; setTimeout(show, 1800); }
      else { tries++; oops(body.querySelector('#k-sc'));
        if(tries>=2){ hd.textContent='محاولة جميلة! اسمعها مرة أخرى'; say('Good try! Listen: '+it.en, ()=>{ r++; setTimeout(show, 600); }); }
        else { hd.textContent='سمعت: «'+t+'» — جرّب مرة أخرى'; say('Try again. '+it.en); } }
    }});
  };
  show();
}

/* end of round */
function finish(body, score, total, again, extra){
  stopGame();
  const starsTxt='⭐'.repeat(Math.max(1, Math.round(3*score/total)));
  body.innerHTML='<div class="k-done"><div class="k-big">🏆</div><b>انتهت الجولة!</b><span>'+score+' / '+total+(extra?' · '+extra:'')+'</span><div class="k-stars3">'+starsTxt+'</div><div class="k-row"><button class="k-btn" id="k-again">العب مرة أخرى</button><button class="k-btn ghost" id="k-home">الألعاب</button></div></div>';
  confetti(); tone('good'); say(score===total ? 'Perfect! You are a superstar!' : 'Well done! Let us play again!');
  addStars(2);
  body.querySelector('#k-again').onclick=again; body.querySelector('#k-home').onclick=home;
}

window.kidsHome = home;
home();
})();
