/* Talkie Kids — pet companion, adventure map, treasure hunt at home, sibling duel, call-and-response chants.
   Built on window.KidsAPI (kids.js) and TalkieBus/questEvent (quests.js). Offline, no AI. */
(function(){
const A = window.KidsAPI; if(!A) return;
const {screen, cheer, oops, addStars, finish, say, sayAr, shuffle, pick, esc, tone, CATS, K} = A;
const cat = k => CATS.find(c=>c.k===k);
const dayKey = d => d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const today = () => dayKey(new Date());
const quest = (e,n) => window.questEvent && questEvent(e,n);
const extra = k => (window.KIDS_EXTRA||[]).flatMap(s=>s.games).find(g=>g.k===k);

/* ================= 1. pet companion ================= */
const PET = Object.assign({name:'Nouri', fed:'', food:0, room:[]}, store.get('talkie-pet', {}));
const savePet = () => store.set('talkie-pet', PET);
const STAGES = [[0,'صغير',0.62,''],[20,'يكبر',0.78,'🎀'],[60,'كبير',0.92,'🧣'],[150,'بطل',1.05,'👑']];
const stage = () => { let s=STAGES[0]; STAGES.forEach(x=>{ if(K.stars>=x[0]) s=x; }); return s; };
const nextStage = () => STAGES.find(x=>x[0]>K.stars);
const starsToday = () => { const L=store.get('talkie-kidlog', {days:{}})||{days:{}}; return ((L.days||{})[today()]||{}).stars||0; };
const PHRASES = ["Hi! I'm NAME!","Let's learn English!","You are my best friend!","I love stars!","Can you say camel?","Let's play a game!","Good job today!"];
function mood(){
  if(PET.fed===today()) return ['😋','شبعان وسعيد!','I am full and happy!'];
  if(starsToday()>=3) return ['😄','جائع! أطعمني','I am hungry! Feed me, please!'];
  return ['🥱','اجمع 3 نجوم اليوم لتطعمني','Play with me to get 3 stars!'];
}
function petHTML(){
  const st=stage(), m=mood(), nx=nextStage();
  return '<div class="pet-card"><button class="pet-stage" id="pet-tap" aria-label="'+esc(PET.name)+'"><span class="pet-emo" style="--s:'+st[2]+'">🐪</span>'+(st[3]?'<span class="pet-acc">'+st[3]+'</span>':'')+'<span class="pet-bubble">'+m[0]+'</span></button>'+
    '<div class="pet-info"><b dir="ltr">'+esc(PET.name)+'</b><span class="pet-mood">'+m[1]+'</span><span>'+st[1]+(nx?' · باقي '+(nx[0]-K.stars)+' نجمة ليكبر':' · وصل إلى أعلى مستوى!')+'</span>'+
    '<div class="pet-btns"><button class="k-btn" id="pet-feed">🍎 أطعمه</button><button class="k-btn ghost" id="pet-room">🏠 غرفته</button></div></div></div>';
}
function wirePet(root){
  const t=root.querySelector('#pet-tap'); if(!t) return;
  t.onclick=()=>{ t.classList.remove('hop'); void t.offsetWidth; t.classList.add('hop'); say(pick(PHRASES).replace('NAME', PET.name)); };
  root.querySelector('#pet-feed').onclick=feed;
  root.querySelector('#pet-room').onclick=room;
}
function feed(){
  if(PET.fed===today()){ say(PET.name+' is full. Come back tomorrow!'); window.toast && toast('أكل اليوم. عُد غدًا!'); return; }
  if(starsToday()<3){ say('Play a game and get three stars first!'); window.toast && toast('اجمع 3 نجوم اليوم أولًا ('+starsToday()+'/3)'); return; }
  const foods=cat('food').items, f=foods[PET.food % foods.length];
  PET.fed=today(); PET.food++; savePet();
  const o=document.createElement('div'); o.className='k-overlay';
  o.innerHTML='<div class="k-reveal"><div class="feed-anim"><span class="feed-food">'+f.p+'</span><span class="k-big">🐪</span></div><b dir="ltr">Yummy! '+esc(PET.name)+' eats '+(/^[aeiou]/.test(f.en)?'an ':'a ')+esc(f.en)+'!</b><span>'+esc(f.ar)+'</span><button class="k-btn">رائع</button></div>';
  document.body.append(o); tone('good');
  say('Yummy! '+PET.name+' eats '+(/^[aeiou]/.test(f.en)?'an ':'a ')+f.en+'! Thank you!');
  quest('feed');
  o.querySelector('button').onclick=()=>{ o.remove(); A.home(); };
}
function room(){
  const body=screen('غرفة '+PET.name, 'زيّن الغرفة بملصقاتك');
  const draw=()=>{
    const have=A.STICKERS.slice(0, K.stickers);
    PET.room=PET.room.filter(s=>have.includes(s)); savePet();
    body.innerHTML='<div class="pet-room"><div class="pr-wall">'+Array.from({length:8},(_,i)=>'<span class="pr-slot">'+(PET.room[i]||'')+'</span>').join('')+'</div>'+
      '<button class="pr-pet" id="pr-pet"><span class="pet-emo" style="--s:'+(stage()[2]+0.3)+'">🐪</span>'+(stage()[3]?'<span class="pet-acc">'+stage()[3]+'</span>':'')+'</button><div class="pr-floor"></div></div>'+
      '<div class="k-label">ملصقاتك · اضغط ملصقًا لتضعه في الغرفة أو تزيله</div>'+
      (have.length?'<div class="k-shelf">'+have.map(s=>'<button class="pr-st'+(PET.room.includes(s)?' on':'')+'" data-s="'+s+'">'+s+'</button>').join('')+'</div>':'<p class="k-hint">اجمع 10 نجوم لتحصل على أول ملصق!</p>')+
      '<div class="k-label">اسم صديقك</div><div class="k-row"><input class="field" id="pr-name" maxlength="14" dir="ltr" value="'+esc(PET.name)+'" style="max-width:12rem"><button class="k-btn ghost" id="pr-save">حفظ</button></div>';
    body.querySelector('#pr-pet').onclick=()=>say(pick(PHRASES).replace('NAME', PET.name));
    body.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{ const s=b.dataset.s, i=PET.room.indexOf(s);
      if(i>=0) PET.room.splice(i,1); else if(PET.room.length<8) PET.room.push(s); else { window.toast && toast('الغرفة ممتلئة: أزل ملصقًا أولًا'); return; }
      savePet(); tone('pop'); draw(); });
    body.querySelector('#pr-save').onclick=()=>{ const n=body.querySelector('#pr-name').value.trim().replace(/[<>]/g,''); if(!n) return; PET.name=n.slice(0,14); savePet(); say('Hello! My name is '+PET.name+'!'); draw(); };
  };
  draw();
}

/* ================= 2. adventure map ================= */
const MAPK='talkie-map';
const M = Object.assign({done:{}}, store.get(MAPK, {}));
const story = i => ()=>window.KIDS_STORY && KIDS_STORY.read(KIDS_STORY.list[i]);
const ISLANDS = [['🏝️','جزيرة الكلمات'],['🌋','جبل القواعد'],['🌲','غابة القصص'],['🏰','قلعة الأبطال']];
const STATIONS = [
  ['👂','اسمع: الحيوانات', ()=>A.listenGame(cat('animals'))],
  ['🎈','بالونات الألوان', ()=>A.balloons('colors')],
  ['✍️','اكتب حرفًا', ()=>extra('trace').run(), 'trace'],
  ['🧠','ذاكرة الفواكه', ()=>A.memory(cat('food'))],
  ['🔢','اسمع: الأرقام', ()=>A.listenGame(cat('numbers'))],
  ['🍎','a أو an', ()=>extra('art').run()],
  ['👫','الضمائر', ()=>extra('pron').run()],
  ['🎈','بالونات الحروف', ()=>A.balloons('letters')],
  ['✨','am · is · are', ()=>extra('be').run()],
  ['🐱','المفرد والجمع', ()=>extra('plu').run()],
  ['📖','قصة: القط سام', story(0), 'story'],
  ['🤸','Simon says', ()=>extra('simon').run()],
  ['🧠','ذاكرة المواصلات', ()=>A.memory(cat('go'))],
  ['📖','قصة: الحافلة الحمراء', story(1), 'story'],
  ['↕️','الأضداد', ()=>extra('opp').run()],
  ['📦','أين الكرة؟', ()=>extra('prep').run()],
  ['🎤','قل: الطعام', ()=>A.sayGame(cat('food'))],
  ['🧩','رتّب الجملة', ()=>extra('order').run()],
  ['👂','اسمع: جسمي', ()=>A.listenGame(cat('body'))],
  ['🏆','التحدي الكبير', ()=>A.listenGame({k:'mix', ar:'التحدي الكبير', en:'Final', items:shuffle(CATS.filter(c=>!['numbers','num100','days'].includes(c.k)).flatMap(c=>c.items)).slice(0,14)})]
];
let active = null;     // the station being played from the map
const unlockedUpTo = () => { let i=0; while(i<STATIONS.length && M.done[i]) i++; return i; };
function completeStation(stars){
  if(!active) return; const i=active.i; active=null;
  const before=unlockedUpTo(); M.done[i]=Math.max(M.done[i]||0, stars); store.set(MAPK, M);
  quest('map');
  setTimeout(()=>{ window.toast && toast(unlockedUpTo()>before ? '🗺️ فتحت محطة جديدة في الخريطة!' : '🗺️ أحسنت! حسّنت نجوم المحطة'); }, 900);
  // offer a quick way back to the map from the end-of-round screen
  setTimeout(()=>{ const row=document.querySelector('.k-done .k-row'); if(row && !row.querySelector('.to-map')){ const b=document.createElement('button'); b.className='k-btn to-map'; b.textContent='🗺️ إلى الخريطة'; b.onclick=map; row.prepend(b); } }, 50);
}
TalkieBus.on('kidfinish', (score,total)=>{ if(active && active.ev==='finish') completeStation(total ? (score/total>=0.9?3:score/total>=0.6?2:1) : 1); });
TalkieBus.on('trace', ()=>{ if(active && active.ev==='trace'){ completeStation(3); setTimeout(()=>{ const r=document.querySelector('.k-row'); if(r && !r.querySelector('.to-map')){ const b=document.createElement('button'); b.className='k-btn to-map'; b.textContent='🗺️ إلى الخريطة'; b.onclick=map; r.prepend(b); } }, 1200); } });
TalkieBus.on('story', ()=>{ if(active && active.ev==='story') active.ev='finish'; });   // the story quiz that follows completes the station
function map(){
  const body=screen('خريطة المغامرة','Adventure map');
  const cur=unlockedUpTo();
  let h='<div class="map" id="map"><svg class="map-path" id="map-svg"></svg>';
  STATIONS.forEach(([ic,t],i)=>{
    if(i%5===0){ const [e,n]=ISLANDS[i/5]; h+='<div class="map-island"><span>'+e+'</span>'+n+'</div>'; }
    const done=M.done[i]||0, locked=i>cur, isCur=i===cur;
    const pos=['c','r','c','l'][i%4];
    h+='<div class="map-st '+pos+'"><button class="map-node'+(done?' done':'')+(locked?' locked':'')+(isCur?' cur':'')+'" data-i="'+i+'">'+(locked?'🔒':ic)+(isCur?'<span class="map-pet">🐪</span>':'')+'</button>'+
      '<span class="map-t">'+t+'</span><span class="map-stars">'+(done?'⭐'.repeat(done)+'<em>'+'☆'.repeat(3-done)+'</em>':'')+'</span></div>';
  });
  h+='<div class="map-end">'+(cur>=STATIONS.length?'🎉 أنهيت المغامرة كلها! أنت بطل!':'🏁 النهاية')+'</div></div>';
  body.innerHTML=h;
  body.querySelectorAll('.map-node').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    if(i>unlockedUpTo()){ oops(b); window.toast && toast('أكمل المحطة السابقة أولًا'); return; }
    active={i, ev:STATIONS[i][3]||'finish'};
    STATIONS[i][2]();
  });
  requestAnimationFrame(()=>{
    const mp=body.querySelector('#map'), svg=body.querySelector('#map-svg'); if(!mp||!svg) return;
    const r0=mp.getBoundingClientRect(); svg.setAttribute('width', r0.width); svg.setAttribute('height', mp.scrollHeight);
    const pts=[...mp.querySelectorAll('.map-node')].map(n=>{ const r=n.getBoundingClientRect(); return [r.left-r0.left+r.width/2, r.top-r0.top+r.height/2]; });
    let d=''; pts.forEach(([x,y],i)=>{ if(!i){ d='M'+x+' '+y; return; } const [px,py]=pts[i-1]; const my=(py+y)/2; d+=' C'+px+' '+my+' '+x+' '+my+' '+x+' '+y; });
    svg.innerHTML='<path d="'+d+'" fill="none" stroke="var(--line)" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 16"/>';
    const c=mp.querySelector('.map-node.cur'); if(c) c.scrollIntoView({block:'center', behavior:'smooth'});
  });
}

/* ================= 3. treasure hunt at home ================= */
const HUNT = [['#E53935','something red','شيئًا أحمر'],['#1E63D6','something blue','شيئًا أزرق'],['#FBC02D','something yellow','شيئًا أصفر'],['#2E9E4F','something green','شيئًا أخضر'],
  ['⚽','something round','شيئًا دائريًا'],['📚','a book','كتابًا'],['🥄','a spoon','ملعقة'],['👟','a shoe','حذاءً'],['🧸','a toy','لعبة'],['🥤','a cup','كوبًا'],
  ['🧦','a sock','جوربًا'],['🍎','a fruit','فاكهة'],['✏️','a pencil','قلمًا'],['☁️','something soft','شيئًا ناعمًا'],['🐘','something big','شيئًا كبيرًا'],['🐜','something small','شيئًا صغيرًا']];
function hunt(){
  const body=screen('البحث عن الكنز','Treasure hunt');
  body.innerHTML='<div class="k-qcard"><div class="k-big2">🗺️🏠</div><p class="k-hint" style="font-size:1rem">سأطلب منك أن تجد شيئًا في البيت.<br>اركض وأحضره قبل أن ينتهي الوقت، ثم اضغط «وجدته!»</p></div><button class="k-btn big" id="h-go" style="width:100%">ابدأ البحث</button>';
  body.querySelector('#h-go').onclick=()=>sayAr('ابحث في البيت وأحضر الشيء المطلوب', run);
  function run(){
    const ROUNDS=6, list=shuffle(HUNT).slice(0,ROUNDS); let r=0, score=0, iv=null;
    A.setCleanup(()=>clearInterval(iv));
    const next=()=>{
      clearInterval(iv);
      if(r>=ROUNDS) return finish(body, score, ROUNDS, hunt);
      const [p,en,ar]=list[r]; let left=30;
      const vis=/^#/.test(p)?'<span class="k-sw xl" style="background:'+p+'"></span>':'<span class="k-big2">'+p+'</span>';
      body.innerHTML='<div class="k-qcard">'+vis+'<div class="k-sent">Find '+esc(en)+'!</div><div class="k-qhint">أحضر '+ar+'</div></div>'+
        '<div class="hunt-timer"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="ht-bg"/><circle cx="50" cy="50" r="44" class="ht-fg" id="h-ring"/></svg><b id="h-t">30</b></div>'+
        '<div class="k-row"><button class="k-btn big" id="h-found">وجدته! ✅</button><button class="k-btn ghost" id="h-rep">🔊</button></div>'+
        '<div class="k-progress">'+list.map((_,k)=>'<i class="'+(k<r?'done':'')+'"></i>').join('')+'</div>';
      say('Find '+en+'! Go, go, go!');
      body.querySelector('#h-rep').onclick=()=>say('Find '+en+'!');
      body.querySelector('#h-found').onclick=()=>{ clearInterval(iv); score++; addStars(2); cheer(); setTimeout(()=>say('Great! What is it? Say it in English!'), 1000); r++; setTimeout(next, 3800); };
      iv=setInterval(()=>{ left--; const t=body.querySelector('#h-t'), ring=body.querySelector('#h-ring'); if(!t){ clearInterval(iv); return; }
        t.textContent=left; ring.style.strokeDashoffset=(276.5*(1-left/30)).toFixed(1); if(left<=5 && left>0) tone('pop');
        if(left<=0){ clearInterval(iv); oops(body.querySelector('.k-qcard')); say("Time's up! Let's try another one."); r++; setTimeout(next, 2200); } }, 1000);
    };
    next();
  }
}

/* ================= 4. sibling duel (two players, one phone) ================= */
function duel(){
  const body=screen('تحدي الإخوة','لاعبان على جوال واحد');
  body.innerHTML='<div class="k-qcard"><div class="k-big2">🧒⚡👧</div><p class="k-hint" style="font-size:1rem">ضعا الجوال على الطاولة بينكما، كل لاعب من جهة.<br>اسمعا الكلمة، ومن يلمس الصورة الصحيحة أولًا يكسب النقطة!</p></div>'+
    '<div class="k-label">الموضوع</div><div class="k-grid">'+['animals','food','colors','numbers','things','go'].map((k,i)=>'<button class="k-tile k'+(i+1)+'" data-c="'+k+'"><span class="k-ico">'+cat(k).icon+'</span><b>'+cat(k).ar+'</b></button>').join('')+'</div>';
  body.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>play(cat(b.dataset.c)));
  function play(c){
    const ROUNDS=10; let r=0, sc=[0,0], target=null, locked=false, frozen=[false,false], t=null;
    const ov=document.createElement('div'); ov.className='duel';
    const half=(p)=>'<div class="duel-half p'+p+'" data-p="'+p+'"><div class="duel-top"><b class="duel-sc" id="dsc'+p+'">0</b><span>'+(p?'اللاعب البرتقالي':'اللاعب الأزرق')+'</span><button class="duel-rep" aria-label="أعد">🔊</button></div><div class="duel-opts" id="dop'+p+'"></div></div>';
    ov.innerHTML=half(0)+'<div class="duel-mid"><span id="dround">1 / '+ROUNDS+'</span><button class="duel-x" id="dx">إنهاء</button></div>'+half(1);
    document.body.append(ov);
    const end=()=>{ clearTimeout(t); ov.remove(); };
    A.setCleanup(end);
    ov.querySelector('#dx').onclick=()=>{ end(); A.home(); };
    ov.querySelectorAll('.duel-rep').forEach(b=>b.onclick=()=>say(target?target.en:''));
    const next=()=>{
      if(r>=ROUNDS){
        end(); addStars(2);
        const w = sc[0]===sc[1] ? 'تعادل! كلاكما بطل 🤝' : (sc[0]>sc[1] ? 'فاز اللاعب الأزرق! 🏆' : 'فاز اللاعب البرتقالي! 🏆');
        body.innerHTML='<div class="k-done"><div class="k-big">🏆</div><b>'+w+'</b><span>'+sc[0]+' : '+sc[1]+'</span><div class="k-row"><button class="k-btn" id="d-again">جولة أخرى</button><button class="k-btn ghost" id="d-home">الألعاب</button></div></div>';
        cheer(); body.querySelector('#d-again').onclick=()=>play(c); body.querySelector('#d-home').onclick=A.home;
        window.onKidFinish && onKidFinish(Math.max(sc[0],sc[1]), ROUNDS, 'تحدي الإخوة');
        return;
      }
      locked=false; frozen=[false,false]; target=c.items[Math.floor(Math.random()*c.items.length)];
      const opts=shuffle([target, ...shuffle(c.items.filter(x=>x!==target)).slice(0,2)]);
      [0,1].forEach(p=>{ const box=ov.querySelector('#dop'+p); const mine=shuffle(opts);
        box.innerHTML=mine.map((o,k)=>'<button class="duel-opt" data-k="'+k+'">'+A.pic(o,'lg')+'</button>').join('');
        ov.querySelector('.duel-half.p'+p).classList.remove('frozen','win');
        box.querySelectorAll('.duel-opt').forEach(b=>b.addEventListener('pointerdown', e=>{ e.preventDefault();
          if(locked || frozen[p]) return; const o=mine[+b.dataset.k];
          if(o===target){ locked=true; sc[p]++; ov.querySelector('#dsc'+p).textContent=sc[p]; b.classList.add('k-right'); ov.querySelector('.duel-half.p'+p).classList.add('win'); tone('good'); say(target.en+'!'); r++; t=setTimeout(next, 1400); }
          else { frozen[p]=true; tone('bad'); const hf=ov.querySelector('.duel-half.p'+p); hf.classList.add('frozen'); setTimeout(()=>{ frozen[p]=false; hf.classList.remove('frozen'); }, 1200); }
        })); });
      ov.querySelector('#dround').textContent=(r+1)+' / '+ROUNDS;
      setTimeout(()=>say(target.en), 300);
    };
    next();
  }
}

/* ================= 5. call-and-response chants ================= */
const CHANTS = [
  {t:'Colors chant', ar:'أنشودة الألوان', icon:'🎨', lines:[['Red, red, an apple is red.','🍎'],['Yellow, yellow, the sun is yellow.','☀️'],['Green, green, the tree is green.','🌳'],['Blue, blue, the sea is blue.','🌊']]},
  {t:'Animal sounds', ar:'أصوات الحيوانات', icon:'🐄', lines:[['The cat says meow, meow, meow.','🐱'],['The dog says woof, woof, woof.','🐶'],['The cow says moo, moo, moo.','🐄'],['The duck says quack, quack, quack.','🦆']]},
  {t:'One, two, buckle my shoe', ar:'واحد، اثنان', icon:'👟', lines:[['One, two, buckle my shoe.','👟'],['Three, four, knock at the door.','🚪'],['Five, six, pick up sticks.','🥢'],['Seven, eight, lay them straight.','📏'],['Nine, ten, a big fat hen.','🐔']]},
  {t:'Hello chant', ar:'أنشودة التحية', icon:'👋', lines:[['Hello, hello, how are you?','👋'],['I am fine, and how are you?','😊'],['Good morning, good morning, nice to see you!','🌞'],['Goodbye, goodbye, see you soon!','👋']]},
  {t:'Move your body', ar:'حرّك جسمك', icon:'🙌', lines:[['Head and nose, touch your toes.','🦶'],['Hands up high, reach the sky.','🙌'],['Clap, clap, one, two, three.','👏'],['Turn around and look at me!','🔄']]},
  {t:'Days chant', ar:'أنشودة الأيام', icon:'📅', lines:[['Sunday, Monday, Tuesday too.','📅'],['Wednesday, Thursday, me and you.','🤝'],['Friday, Saturday, time to play.','⚽'],['Seven days in every week, hooray!','🎉']]}
];
let AC=null;
function beat(on){
  if(!on){ if(beat.iv){ clearInterval(beat.iv); beat.iv=null; } return; }
  try{ AC = AC || new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); }catch(e){ return; }
  const spb=60/96; let next=AC.currentTime+0.1, n=0;
  const noise=AC.createBuffer(1, AC.sampleRate*0.05, AC.sampleRate); const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const kick=t=>{ const o=AC.createOscillator(), g=AC.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(45,t+0.12); g.gain.setValueAtTime(0.35,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.2); };
  const hat=t=>{ const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(); s.buffer=noise; f.type='highpass'; f.frequency.value=6000; g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); };
  const clap=t=>{ const s=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(); s.buffer=noise; f.type='bandpass'; f.frequency.value=1500; g.gain.setValueAtTime(0.22,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); };
  beat(false);
  beat.iv=setInterval(()=>{ while(next < AC.currentTime+0.25){ if(n%2===0) kick(next); else clap(next); hat(next+spb/2); next+=spb; n++; } }, 60);
}
function chants(){
  const body=screen('أناشيد إيقاعية','Chants');
  body.innerHTML='<p class="k-hint">اسمع الجملة مع الإيقاع، ثم ردّدها أنت بصوت عالٍ عندما يظهر «دورك»!</p><div class="k-grid">'+
    CHANTS.map((c,i)=>'<button class="k-tile k'+(i%6+1)+'" data-c="'+i+'"><span class="k-ico">'+c.icon+'</span><b>'+c.ar+'</b><span>'+esc(c.t)+'</span></button>').join('')+'</div>';
  body.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>sing(CHANTS[+b.dataset.c]));
}
function sing(c){
  const body=screen(c.ar, c.t);
  let i=0, alive=true, timer=null, round=1;
  body.innerHTML='<div class="ch-box">'+c.lines.map(([l,e],k)=>'<div class="ch-line" data-k="'+k+'"><span class="ch-e">'+e+'</span><span class="ch-t">'+esc(l)+'</span></div>').join('')+'</div>'+
    '<div class="ch-turn" id="ch-turn">استعد…</div><div class="k-row"><button class="k-btn" id="ch-go">▶ ابدأ</button><button class="k-btn ghost" id="ch-stop">إيقاف</button></div>';
  const stop=()=>{ alive=false; clearTimeout(timer); beat(false); try{ speechSynthesis.cancel(); }catch(e){} };
  A.setCleanup(stop);
  const mark=(k,cls)=>body.querySelectorAll('.ch-line').forEach((el,j)=>{ el.classList.toggle('listen', j===k && cls==='listen'); el.classList.toggle('turn', j===k && cls==='turn'); el.classList.toggle('sung', j<k); });
  const step=()=>{
    if(!alive) return;
    if(i>=c.lines.length){
      beat(false); mark(-1); body.querySelectorAll('.ch-line').forEach(el=>el.classList.add('sung'));
      body.querySelector('#ch-turn').textContent='🎉 رائع! أنهيت الأنشودة'; cheer(); addStars(2);
      body.querySelector('#ch-go').textContent = round===1 ? '⚡ مرة أخرى أسرع' : '▶ مرة أخرى';
      window.onKidFinish && onKidFinish(1,1,'أناشيد'); return;
    }
    const [line]=c.lines[i]; mark(i,'listen'); body.querySelector('#ch-turn').innerHTML='👂 اسمع';
    speak(line, round===1?0.85:1.0, ()=>{
      if(!alive) return;
      mark(i,'turn'); const tt=body.querySelector('#ch-turn'); if(tt) tt.innerHTML='🎤 دورك! ردّد بصوت عالٍ';
      const ms=Math.max(2400, line.split(' ').length*(round===1?520:420)+600);
      timer=setTimeout(()=>{ i++; step(); }, ms);
    });
  };
  body.querySelector('#ch-go').onclick=()=>{ if(i>=c.lines.length){ round++; i=0; } alive=true; clearTimeout(timer); beat(true); setTimeout(step, 700); };
  body.querySelector('#ch-stop').onclick=()=>{ stop(); body.querySelector('#ch-turn').textContent='توقفت الأنشودة'; i=0; };
}

/* ================= wiring into the kids home ================= */
window.KIDS_TOP = [{html:petHTML, wire:wirePet},
  {html:()=>'<button class="map-cta" id="map-cta"><span>🗺️</span><div><b>خريطة المغامرة</b><em>المحطة '+Math.min(unlockedUpTo()+1, STATIONS.length)+' من '+STATIONS.length+'</em></div><span class="map-cta-go">←</span></button>', wire:r=>{ const b=r.querySelector('#map-cta'); if(b) b.onclick=map; }}
].concat(window.KIDS_TOP||[]);
window.KIDS_EXTRA = (window.KIDS_EXTRA||[]).concat([{title:'العب وتحرّك مع العائلة', games:[
  {k:'hunt', ar:'البحث عن الكنز', en:'Treasure hunt', icon:'🔍', c:'k6', run:hunt},
  {k:'duel', ar:'تحدي الإخوة', en:'Two players', icon:'⚡', c:'k4', run:duel},
  {k:'chant', ar:'أناشيد إيقاعية', en:'Chants', icon:'🥁', c:'k2', run:chants},
  {k:'pet', ar:'غرفة '+PET.name, en:'My pet', icon:'🐪', c:'k1', run:room},
]}]);
A.refresh();
})();
