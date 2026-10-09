/* Talkie — adult practice hub: mistakes notebook (spaced review), presentation coach, dictation, weak-sounds map.
   Uses globals from index.html: $, $$, esc, store, S, P, speak, listen, stopListening, rec, askClaude, hasKey, errText,
   award, toast, show, sayPractice, words, shuffle. */
(function(){
const ICON = {
  say:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></svg>',
  topic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/></svg>',
  stage:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/></svg>',
  ear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9a6 6 0 1 1 12 0c0 4-4 5-4 9a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 1 1 4 0"/></svg>',
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'
};
const DAY = 864e5;
const today = () => { const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); };
const norm = t => words(t||'').join(' ');
function similarity(a, b){ // share of target words heard in order
  const x=words(a), y=words(b); if(!y.length) return 0;
  const L=Array.from({length:x.length+1},()=>new Array(y.length+1).fill(0));
  for(let i=x.length-1;i>=0;i--) for(let j=y.length-1;j>=0;j--) L[i][j]= x[i]===y[j] ? L[i+1][j+1]+1 : Math.max(L[i+1][j],L[i][j+1]);
  return L[0][0]/y.length;
}

/* ================= mistakes notebook ================= */
const BOX_DAYS = [0, 1, 3, 7, 14, 30];
const getM = () => store.get('talkie-mistakes', []);
const setM = m => store.set('talkie-mistakes', m);
const dueList = () => getM().filter(x=>x.box<BOX_DAYS.length && x.due<=today());
window.addMistake = function(wrong, right, tip){
  if(!right || norm(wrong)===norm(right)) return;
  const m = getM(); if(m.some(x=>norm(x.right)===norm(right))) return;
  m.unshift({id:Date.now()+Math.random().toString(36).slice(2,6), wrong:String(wrong||'').slice(0,300), right:String(right).slice(0,300), tip:String(tip||'').slice(0,300), box:0, due:today(), added:Date.now()});
  setM(m.slice(0,300));
};

function renderHub(){
  const v=$('#v-practice'), due=dueList().length, total=getM().length;
  v.innerHTML =
    (window.PRACTICE_TOP||[]).map(f=>f.html()).join('')+
    (due ? '<button class="p-due" id="p-due"><div><b>مراجعة اليوم</b><span>'+due+' من تصحيحاتك تنتظر المراجعة</span></div><span style="font-size:1.6rem">←</span></button>' : '')+
    '<div class="p-grid">'+
      tile('say','قلها','نطق جمل مختارة وتصحيح فوري', ICON.say)+
      tile('topic','دقيقة كلام','تكلم دقيقة عن موضوع واحصل على تقييم', ICON.topic)+
      tile('mistakes','دفتر أخطائي','تصحيحات Sam لتراجعها حتى تتقنها', ICON.book, total? total+'':'')+
      tile('coach','تدريب العرض','سرعة كلامك والكلمات الحشوية وأسئلة الجمهور', ICON.stage)+
      tile('dict','اسمع واكتب','اسمع جملة واكتبها لتقوية السماع', ICON.ear)+
      tile('sounds','أصواتي','الأصوات والكلمات التي تحتاج تمرينًا', ICON.map)+
      (window.EXTRA_PRACTICE||[]).map(x=>tile(x.k, x.t, x.sub, x.ic)).join('')+
    '</div>';
  v.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
  const d=v.querySelector('#p-due'); if(d) d.onclick=()=>{ show('mistakes'); review(); };
  (window.PRACTICE_TOP||[]).forEach(f=>f.wire && f.wire(v));
}
function tile(k, t, sub, ic, badge){ return '<button class="p-tile" data-go="'+k+'">'+ic+'<b>'+t+(badge?' <span class="p-badge">'+badge+'</span>':'')+'</b><span>'+sub+'</span></button>'; }

function renderMistakes(){
  const v=$('#v-mistakes'), m=getM(), due=dueList().length, mastered=m.filter(x=>x.box>=BOX_DAYS.length).length;
  v.innerHTML = '<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>دفتر أخطائي</b></div>'+
    '<div class="p-stat"><div><b>'+m.length+'</b><span>كل التصحيحات</span></div><div><b>'+due+'</b><span>للمراجعة اليوم</span></div><div><b>'+mastered+'</b><span>أتقنتها</span></div></div>'+
    (due ? '<button class="btn" id="m-go">ابدأ المراجعة ('+due+')</button>' : (m.length ? '<p class="hint">لا توجد مراجعة اليوم. أحسنت! ستعود التصحيحات في أوقات متباعدة حتى تثبت في ذاكرتك.</p>' : ''))+
    (m.length ? '' : '<div class="empty"><strong>الدفتر فارغ</strong>كل تصحيح يقدمه Sam في المحادثة أو في «دقيقة كلام» يُحفظ هنا تلقائيًا. ويمكنك إضافة عبارة بنفسك من الأسفل.</div>')+
    '<details class="card"><summary class="label" style="cursor:pointer">أضف عبارة بنفسك</summary>'+
      '<input class="field" id="m-w" placeholder="What I said (wrong)…"><input class="field" id="m-r" placeholder="The correct way…"><button class="btn ghost" id="m-add">أضف</button></details>'+
    '<div class="p-list">'+m.map(x=>'<div class="p-item"><div class="p-wrong">'+esc(x.wrong||'—')+'</div><div class="p-right">'+esc(x.right)+'</div>'+
      (x.tip?'<small>'+esc(x.tip)+'</small>':'')+'<div style="display:flex;gap:8px;align-items:center"><small>'+(x.box>=BOX_DAYS.length?'أتقنتها ✓':'المستوى '+(x.box+1)+' من '+BOX_DAYS.length)+'</small>'+
      '<span style="flex:1"></span><button class="speak" data-say="'+esc(x.right)+'" aria-label="استمع">'+SPK+'</button><button class="p-back" data-del="'+x.id+'">حذف</button></div></div>').join('')+'</div>';
  const go=v.querySelector('#m-go'); if(go) go.onclick=review;
  v.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say));
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(b.dataset.armed){ setM(getM().filter(x=>x.id!==b.dataset.del)); renderMistakes(); } else { b.dataset.armed='1'; b.textContent='تأكيد الحذف'; } });
  v.querySelector('#m-add').onclick=()=>{ const r=v.querySelector('#m-r').value.trim(); if(!r){ v.querySelector('#m-r').focus(); return; }
    const before=getM().length; addMistake(v.querySelector('#m-w').value.trim(), r, ''); if(getM().length===before) toast('هذه العبارة موجودة في الدفتر.'); renderMistakes(); };
}
function review(){
  const v=$('#v-mistakes'); let queue=shuffle(dueList()), done=0, again=new Set();
  const step=()=>{
    if(!queue.length){ award(done*3,'مراجعة'); v.innerHTML='<div class="p-top"><button class="p-back" id="r-back">→ الدفتر</button><b>انتهت المراجعة</b></div><div class="card" style="align-items:center;text-align:center"><div class="big">✓</div><b>راجعت '+done+' تصحيحًا</b><span class="hint">ستعود إليك في الوقت المناسب للتثبيت.</span></div>';
      v.querySelector('#r-back').onclick=renderMistakes; return; }
    const it=queue[0];
    v.innerHTML='<div class="p-top"><button class="p-back" id="r-back">→ الدفتر</button><b>مراجعة · باقي '+queue.length+'</b></div>'+
      '<div class="card"><div class="label">قلها بالشكل الصحيح:</div><div class="p-wrong" style="font-size:1.15rem">'+esc(it.wrong||'(اكتب أو قل الصيغة الصحيحة)')+'</div>'+(it.tip?'<div class="hint" style="text-align:start">'+esc(it.tip)+'</div>':'')+
      '<div class="heard" id="r-h"></div><div class="talkbar"><button class="mic sm" id="r-mic" aria-label="قلها"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button><button class="btn ghost" id="r-show">أظهر الإجابة</button></div>'+
      '<div id="r-ans" hidden><div class="p-right" style="margin:6px 0">'+esc(it.right)+'</div><div class="actions"><button class="btn ghost" id="r-hear">🔊 استمع</button></div>'+
      '<div class="actions" style="margin-top:8px"><button class="btn" id="r-ok">عرفتها ✓</button><button class="btn ghost" id="r-no">لم أعرفها</button></div></div></div>';
    const reveal=()=>{ v.querySelector('#r-ans').hidden=false; v.querySelector('#r-show').hidden=true; speak(it.right); };
    v.querySelector('#r-back').onclick=renderMistakes;
    v.querySelector('#r-show').onclick=reveal;
    v.querySelector('#r-hear').onclick=()=>speak(it.right);
    v.querySelector('#r-mic').onclick=()=>{ if(rec){ stopListening(); return; } const h=v.querySelector('#r-h'); h.textContent='…';
      listen({btn:v.querySelector('#r-mic'), onText:t=>h.textContent=t, onEnd:t=>{ if(!t){ h.textContent='لم أسمع شيئًا'; return; }
        const sc=similarity(t, it.right); h.textContent=t+'  ·  '+Math.round(sc*100)+'%'; reveal();
        if(sc>=0.85){ v.querySelector('#r-ok').classList.add('pulse'); toast('ممتاز! قلتها صحيحة'); } }}); };
    const grade=ok=>{
      const m=getM(), x=m.find(y=>y.id===it.id);
      if(x){ if(ok && !again.has(it.id)){ x.box++; x.due=today()+(BOX_DAYS[Math.min(x.box,BOX_DAYS.length-1)]||1)*DAY; }
             else if(!ok){ x.box=0; x.due=today()+DAY; } setM(m); }
      queue.shift(); done++; window.questEvent && questEvent('review');
      if(!ok && !again.has(it.id)){ again.add(it.id); queue.push(it); }
      step();
    };
    v.querySelector('#r-ok').onclick=()=>grade(true);
    v.querySelector('#r-no').onclick=()=>grade(false);
  };
  step();
}

/* ================= presentation coach ================= */
const FILLERS = ['um','umm','uh','uhh','er','erm','ah','like','so','basically','actually','literally','you know','i mean','kind of','sort of','okay so','right'];
const countFillers = t => { const s=' '+norm(t)+' '; let n=0, by={}; FILLERS.forEach(f=>{ const c=s.split(' '+f+' ').length-1; if(c){ n+=c; by[f]=c; } }); return {n, by}; };
let coach = {on:false, base:'', t0:0, tmr:null, dur:120};
function renderCoach(){
  const v=$('#v-coach'); const hist=(P.coach||[]).slice(-5);
  v.innerHTML='<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>تدريب العرض</b></div>'+
    '<div class="card"><div class="label">عن ماذا ستتكلم؟ (اختياري)</div><input class="field" id="c-topic" placeholder="e.g. My research on soil stabilization" value="'+esc(P.coachTopic||'')+'">'+
    '<div class="label">المدة</div><div class="seg" id="c-dur"><button data-d="60">دقيقة</button><button data-d="120">دقيقتان</button><button data-d="180">3 دقائق</button></div></div>'+
    '<div class="p-live"><div><b id="c-left">2:00</b><span>الوقت المتبقي</span></div><div><b id="c-wpm">–</b><span>كلمة/دقيقة</span></div><div><b id="c-fill">0</b><span>كلمات حشوية</span></div></div>'+
    '<div class="actions" style="justify-content:center"><button class="btn" id="c-go">ابدأ العرض</button></div>'+
    '<div class="card"><div class="label">ما سمعه التطبيق</div><textarea id="c-text" rows="5" placeholder="Your talk will appear here…"></textarea>'+
    '<p class="hint" style="text-align:start">الكلمات الحشوية مثل um وuh قد لا يكتبها الجوال دائمًا، لذا يكون عددها الحقيقي أعلى غالبًا. المدى المريح للعروض تقريبًا 120 إلى 160 كلمة في الدقيقة.</p></div>'+
    '<div id="c-res" style="display:flex;flex-direction:column;gap:10px"></div>'+
    (hist.length?'<div class="card"><div class="label">آخر تدريباتك</div><div class="p-list">'+hist.reverse().map(h=>'<div class="p-bar" style="grid-template-columns:1fr auto auto"><span>'+new Date(h.d).toLocaleDateString('ar-SA',{day:'numeric',month:'short'})+'</span><span class="v">'+h.wpm+' ك/د</span><span class="v">'+h.f+' حشو</span></div>').join('')+'</div></div>':'');
  const seg=v.querySelector('#c-dur');
  const paintDur=()=>{ seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', +b.dataset.d===coach.dur)); v.querySelector('#c-left').textContent=fmt(coach.dur); };
  seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{ if(coach.on) return; coach.dur=+b.dataset.d; paintDur(); });
  paintDur();
  v.querySelector('#c-go').onclick=()=>coach.on?stopCoach(true):startCoach();
}
const fmt = s => Math.floor(s/60)+':'+String(Math.max(0,s%60)).padStart(2,'0');
function liveStats(){
  const txt=$('#c-text').value, n=words(txt).length, el=(Date.now()-coach.t0)/60000;
  $('#c-wpm').textContent = el>0.15 ? Math.round(n/el) : '–';
  $('#c-fill').textContent = countFillers(txt).n;
}
function coachListen(){
  listen({continuous:true, onText:t=>{ $('#c-text').value=(coach.base+' '+t).trim(); liveStats(); },
    onEnd:()=>{ coach.base=$('#c-text').value.trim(); if(coach.on) setTimeout(()=>{ if(coach.on && !rec) coachListen(); },150); }});
}
function startCoach(){
  P.coachTopic=$('#c-topic').value.trim(); store.set('talkie',P);
  coach.on=true; coach.base=''; coach.t0=Date.now(); $('#c-text').value=''; $('#c-res').innerHTML='';
  $('#c-go').textContent='إنهاء العرض'; coachListen();
  coach.tmr=setInterval(()=>{ const left=coach.dur-Math.round((Date.now()-coach.t0)/1000); $('#c-left').textContent=fmt(left); liveStats(); if(left<=0) stopCoach(true); },1000);
}
function stopCoach(evaluate){
  if(!coach.on) return; coach.on=false; clearInterval(coach.tmr); stopListening();
  const b=$('#c-go'); if(b) b.textContent='ابدأ العرض';
  if(evaluate) setTimeout(evaluateCoach, 700);
}
async function evaluateCoach(){
  const txt=$('#c-text').value.trim(), n=words(txt).length, mins=Math.max(0.25,(Date.now()-coach.t0)/60000), wpm=Math.round(n/mins), f=countFillers(txt);
  const res=$('#c-res');
  if(n<15){ res.innerHTML='<div class="notice">لم يُسجل كلام كافٍ. تأكد من السماح بالميكروفون وتكلم بصوت واضح.</div>'; return; }
  P.coach=(P.coach||[]).concat([{d:Date.now(), wpm, f:f.n}]).slice(-30); store.set('talkie',P); award(20,'عرض'); window.questEvent && questEvent('coach');
  const pace = wpm<110 ? 'أبطأ من المعتاد. حاول أن تقلل الوقفات الطويلة.' : wpm>170 ? 'أسرع من المعتاد. خذ نفسًا بين الأفكار.' : 'سرعة مريحة للمستمعين.';
  const top=Object.entries(f.by).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,c])=>k+' ×'+c).join('، ');
  res.innerHTML='<div class="card"><div class="p-stat"><div><b>'+wpm+'</b><span>كلمة/دقيقة</span></div><div><b>'+f.n+'</b><span>حشو</span></div><div><b>'+n+'</b><span>كلمة</span></div></div>'+
    '<div class="hint" style="text-align:start">'+pace+(top?'<br>أكثر الكلمات الحشوية: <span dir="ltr">'+esc(top)+'</span>':'')+'</div></div><div id="c-ai"></div>';
  const ai=res.querySelector('#c-ai');
  if(!hasKey()){ ai.innerHTML='<p class="hint">أضف مفتاح API من الإعدادات ليقترح Sam صياغات أقوى وأسئلة متوقعة من الجمهور.</p>'; return; }
  ai.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  try{
    const r=await askClaude(`You are an experienced presentation coach for academics and professionals. An Arabic speaker practiced a short spoken talk in English${P.coachTopic?' about "'+P.coachTopic+'"':''}. The transcript below comes from speech recognition, so ignore punctuation, capitalization and obvious recognition glitches.
Speaking rate: ${wpm} words per minute. Filler words detected: ${f.n}.

Transcript:
"""${txt.slice(0,6000)}"""

Reply with ONLY JSON:
{"score": 1-10 overall clarity and fluency,
 "summary": "two sentences of feedback in Arabic: what worked and the single most important improvement",
 "upgrades": [up to 3 {"said": "learner's exact phrase", "better": "a stronger, more natural way to say it in a talk"}],
 "opener": "one strong English opening sentence they could use for this talk",
 "questions": [3 realistic audience questions in English they should prepare for]}`, 900);
    let h='<div class="card"><div class="score"><div class="big">'+Math.max(1,Math.min(10,Number(r.score)||6))+'/10</div><div style="flex:1">'+esc(r.summary||'')+'</div></div></div>';
    (r.upgrades||[]).slice(0,3).forEach(u=>{ addMistake(u.said, u.better, 'من تدريب العرض'); h+='<div class="fb-row"><div class="en"><del>'+esc(u.said)+'</del><br><ins>'+esc(u.better)+'</ins></div></div>'; });
    if(r.opener) h+='<div class="fb-row"><div class="label">افتتاحية قوية</div><div class="en">'+esc(r.opener)+'</div><button class="btn ghost" style="margin-top:6px" data-say="'+esc(r.opener)+'">🔊 استمع</button></div>';
    if(r.questions?.length) h+='<div class="card"><div class="label">أسئلة متوقعة من الجمهور · تدرّب على إجابتها</div><div class="p-list">'+r.questions.slice(0,3).map(q=>'<div class="p-item"><div class="p-en">'+esc(q)+'</div><div><button class="btn ghost" style="padding:6px 12px" data-say="'+esc(q)+'">🔊</button></div></div>').join('')+'</div></div>';
    ai.innerHTML=h; ai.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say));
  }catch(e){ ai.innerHTML='<div class="notice">'+esc(errText(e))+'</div>'; }
}

/* ================= dictation ================= */
const DICT = {
  beg:['I have two brothers.','The shop opens at nine.','My car is white.','We eat dinner at home.','It is very hot today.','Can I have some water?','She works at a hospital.','The bus is late again.','I like reading books.','Where is the station?'],
  mid:['I have been waiting for twenty minutes.','Could you send me the file by Thursday?','The meeting was moved to next week.','He would rather take the train than drive.','We need to finish this before the deadline.','I am not sure I understood the question.','The weather was better than we expected.','She has already booked the hotel.','Let me know if you have any questions.','They are planning a trip to the mountains.'],
  adv:['The results were consistent with our earlier findings.','Despite the delay, the project was completed on schedule.','Further research is needed to confirm this hypothesis.','The samples were cured for twenty-eight days before testing.','I would like to draw your attention to the second figure.','Had we known earlier, we would have changed the design.','The committee has yet to reach a final decision.','This approach significantly reduces both cost and time.','Could you elaborate on the limitations of your method?','The data suggest a strong relationship between the two variables.']
};
let dict={list:[], i:0, plays:0};
function renderDict(){
  if(!dict.list.length || dict.level!==S.level){ dict.list=shuffle(DICT[S.level]); dict.i=0; dict.level=S.level; }
  const v=$('#v-dict');
  v.innerHTML='<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>اسمع واكتب</b></div>'+
    '<div class="card" style="align-items:center;text-align:center"><div class="label">اسمع الجملة ثم اكتبها كما سمعتها · '+(dict.i+1)+' / '+dict.list.length+'</div>'+
    '<div class="actions" style="justify-content:center"><button class="btn" id="d-play">🔊 استمع</button><button class="btn ghost" id="d-slow">ببطء</button></div></div>'+
    '<textarea id="d-in" rows="3" placeholder="Type what you hear…" autocomplete="off" autocapitalize="sentences" spellcheck="false"></textarea>'+
    '<div class="actions"><button class="btn" id="d-check">تحقق</button><button class="btn ghost" id="d-next">جملة أخرى</button></div>'+
    '<div id="d-res"></div><p class="hint">مستوى الجمل يتبع المستوى الذي اخترته في المحادثة.</p>';
  const cur=()=>dict.list[dict.i];
  v.querySelector('#d-play').onclick=()=>{ dict.plays++; speak(cur(), S.rate); };
  v.querySelector('#d-slow').onclick=()=>{ dict.plays++; speak(cur(), 0.65); };
  v.querySelector('#d-next').onclick=()=>{ dict.i=(dict.i+1)%dict.list.length; dict.plays=0; renderDict(); };
  v.querySelector('#d-check').onclick=()=>{
    const typed=v.querySelector('#d-in').value; if(!typed.trim()){ v.querySelector('#d-in').focus(); return; }
    const tw=words(cur()), uw=words(typed), n=tw.length, m=uw.length;
    const L=Array.from({length:n+1},()=>new Array(m+1).fill(0));
    for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) L[i][j]= tw[i]===uw[j] ? L[i+1][j+1]+1 : Math.max(L[i+1][j],L[i][j+1]);
    const hit=new Array(n).fill(false); let i=0,j=0, extra=[];
    while(i<n&&j<m){ if(tw[i]===uw[j]){ hit[i]=true; i++; j++; } else if(L[i+1][j]>=L[i][j+1]) i++; else { extra.push(uw[j]); j++; } }
    while(j<m) extra.push(uw[j++]);
    const pct=Math.round(100*hit.filter(Boolean).length/n);
    const shown=cur().split(' ');
    v.querySelector('#d-res').innerHTML='<div class="card"><div class="score"><div class="big">'+pct+'%</div><div class="meter"><i style="width:'+pct+'%"></i></div></div>'+
      '<div class="p-diff">'+shown.map((w,k)=>'<span class="'+(hit[k]?'ok':'no')+'">'+esc(w)+'</span>').join(' ')+'</div>'+
      (extra.length?'<div class="hint" style="text-align:start">كلمات زائدة أو مكتوبة خطأ: <span class="p-diff"><span class="ex">'+esc(extra.join(' '))+'</span></span></div>':'')+
      '<div class="hint" style="text-align:start">'+(pct===100?'ممتاز! سمعتها كاملة.':'الكلمات الحمراء فاتتك. استمع مرة أخرى وركّز عليها.')+'</div></div>';
    award(Math.round(pct/10)+(dict.plays<=1&&pct===100?3:0), pct===100?'Perfect!':''); window.questEvent && questEvent('dict');
  };
}

/* ================= weak sounds map ================= */
const getSnd = () => Object.assign({tags:{}, words:{}}, store.get('talkie-sounds', {}));
window.onSayResult = function(tag, tw, hit){
  const s=getSnd(); const t=s.tags[tag]=s.tags[tag]||{t:0,h:0};
  tw.forEach((w,k)=>{ t.t++; if(hit[k]) t.h++; const x=s.words[w]=s.words[w]||{seen:0,miss:0}; x.seen++; if(!hit[k]) x.miss++; });
  store.set('talkie-sounds', s);
};
function renderSounds(){
  const v=$('#v-sounds'), s=getSnd();
  const tags=Object.entries(s.tags).filter(([,x])=>x.t>0).map(([k,x])=>[k,x.h/x.t,x.t]).sort((a,b)=>a[1]-b[1]);
  const weak=Object.entries(s.words).filter(([,x])=>x.miss>0).map(([w,x])=>[w,x.miss,x.seen]).sort((a,b)=>(b[1]/b[2])-(a[1]/a[2])||b[1]-a[1]).slice(0,12);
  const col=p=> p>=0.85?'var(--good)':p>=0.65?'var(--sun)':'var(--bad)';
  v.innerHTML='<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>أصواتي</b></div>'+
    (tags.length ? '<div class="card"><div class="label">دقة نطقك حسب المجموعة · اضغط مجموعة لتتمرن عليها</div><div class="p-list">'+
      tags.map(([k,p,n])=>'<button class="p-bar" data-tag="'+esc(k)+'"><span class="t">'+esc(k)+'</span><span class="m"><i style="width:'+Math.round(p*100)+'%;background:'+col(p)+'"></i></span><span class="v">'+Math.round(p*100)+'%</span></button>').join('')+'</div></div>'
      : '<div class="empty"><strong>لا توجد بيانات بعد</strong>العب «قلها» عدة مرات، وسيظهر لك هنا أي الأصوات تتقنها وأيها يحتاج تمرينًا.</div>')+
    (weak.length ? '<div class="card"><div class="label">كلمات تحتاج تمرينًا</div><div class="p-list">'+
      weak.map(([w,m,n])=>'<div class="p-bar" style="grid-template-columns:1fr auto auto"><span class="t">'+esc(w)+'</span><span class="v">'+m+' من '+n+'</span><button class="speak" data-say="'+esc(w)+'" aria-label="استمع">'+SPK+'</button></div>').join('')+'</div></div>' : '')+
    '<p class="hint">الدقة هنا تعني أن الجوال فهم الكلمة من نطقك، وهي مقياس تقريبي مفيد لمتابعة تقدمك.</p>';
  v.querySelectorAll('[data-tag]').forEach(b=>b.onclick=()=>sayPractice(b.dataset.tag));
  v.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say, 0.8));
}

/* ================= routing ================= */
const prevShow = window.onShow;
window.onShow = function(v){
  if(v!=='coach' && coach.on) stopCoach(false);
  if(v==='practice') renderHub();
  else if(v==='mistakes') renderMistakes();
  else if(v==='coach') renderCoach();
  else if(v==='dict') renderDict();
  else if(v==='sounds') renderSounds();
  prevShow && prevShow(v);
};
if(!$('#v-practice').hidden) renderHub();
['mistakes','coach','dict','sounds'].forEach(k=>{ if(!$('#v-'+k).hidden) window.onShow(k); });
})();
