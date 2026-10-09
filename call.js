/* Talkie — "Call Sam": a hands-free voice call with an animated Sam who remembers the learner.
   Uses globals from index.html: $, esc, store, S, speak, listen, stopListening, rec, askClaude, hasKey, errText, award, toast, show, LV. */
(function(){
const MEMKEY = 'talkie-sammem';
const getMem = () => Object.assign({name:'', facts:[], topics:[]}, store.get(MEMKEY, {}));
const setMem = m => store.set(MEMKEY, m);
let C = {on:false, turns:[], fixes:[], t0:0, tick:null, misses:0, phase:'idle', captions:true};

const AVATAR = '<svg class="sam-face" viewBox="0 0 200 200" aria-hidden="true">'+
  '<circle cx="100" cy="100" r="92" class="sf-bg"/>'+
  '<path d="M38 82 Q44 30 100 28 Q156 30 162 82 Q150 58 100 56 Q50 58 38 82Z" class="sf-hair"/>'+
  '<g class="sf-eyes"><ellipse cx="72" cy="96" rx="9" ry="11" class="sf-eye"/><ellipse cx="128" cy="96" rx="9" ry="11" class="sf-eye"/>'+
  '<circle cx="75" cy="92" r="3" class="sf-glint"/><circle cx="131" cy="92" r="3" class="sf-glint"/></g>'+
  '<ellipse cx="56" cy="122" rx="11" ry="7" class="sf-cheek"/><ellipse cx="144" cy="122" rx="11" ry="7" class="sf-cheek"/>'+
  '<g class="sf-mouth-g"><path d="M76 132 Q100 156 124 132 Q100 144 76 132Z" class="sf-mouth"/></g>'+
  '</svg>';

function memSummary(m){
  const bits=[];
  if(m.name) bits.push("The learner's name is "+m.name+'.');
  if(m.facts.length) bits.push('Things you remember about them: '+m.facts.join('; ')+'.');
  if(m.topics.length) bits.push('Recent call topics: '+m.topics.slice(-3).join('; ')+'.');
  return bits.length ? bits.join(' ') : 'This is your first call with this learner; you know nothing about them yet, so ask their name early.';
}

/* ---------- pre-call screen ---------- */
function renderLobby(){
  const v=$('#v-call'), m=getMem();
  v.innerHTML='<div class="p-top"><button class="p-back" id="cl-back">→ المحادثة</button><b>اتصل بـ Sam</b></div>'+
    '<div class="call-lobby"><div class="sam-wrap idle">'+AVATAR+'</div><b class="call-name">Sam</b><span class="hint">شريكك في التحدث بالإنجليزية</span></div>'+
    (hasKey()?'':'<div class="notice">المكالمة تحتاج مفتاح API. أضفه من الإعدادات ⚙️ (Gemini مجاني).</div>')+
    '<button class="call-start" id="cl-start"'+(hasKey()?'':' disabled')+'>📞 ابدأ المكالمة</button>'+
    '<div class="card"><div class="label">ما يتذكره Sam عنك · يُحفظ على جوالك فقط</div>'+
      '<input class="field" id="cl-name" placeholder="Your name" value="'+esc(m.name)+'">'+
      (m.facts.length?'<div class="p-list">'+m.facts.map((f,i)=>'<div class="p-item" style="flex-direction:row;align-items:center;gap:8px"><span class="p-en" style="flex:1">'+esc(f)+'</span><button class="p-back" data-rmf="'+i+'">حذف</button></div>').join('')+'</div>'
        :'<p class="hint" style="text-align:start">بعد كل مكالمة يحفظ Sam أهم ما ذكرته عن نفسك، مثل عملك واهتماماتك، ليكمل معك في المرة القادمة.</p>')+
      (m.topics.length?'<div class="hint" style="text-align:start">آخر المواضيع: <span dir="ltr">'+esc(m.topics.slice(-3).join(' · '))+'</span></div>':'')+
      (m.facts.length||m.topics.length?'<button class="p-back" id="cl-forget" style="align-self:flex-start">امسح ذاكرة Sam</button>':'')+
    '</div>'+
    '<p class="hint">نصيحة: استخدم سماعة أذن ليسمعك Sam بوضوح ولا يلتقط صوته هو.</p>';
  v.querySelector('#cl-back').onclick=()=>show('chat');
  v.querySelector('#cl-name').onchange=e=>{ const m=getMem(); m.name=e.target.value.trim().slice(0,30); setMem(m); };
  v.querySelectorAll('[data-rmf]').forEach(b=>b.onclick=()=>{ const m=getMem(); m.facts.splice(+b.dataset.rmf,1); setMem(m); renderLobby(); });
  const fg=v.querySelector('#cl-forget'); if(fg) fg.onclick=()=>{ if(!fg.dataset.armed){ fg.dataset.armed='1'; fg.textContent='اضغط مرة أخرى للتأكيد'; return; } setMem({name:getMem().name, facts:[], topics:[]}); renderLobby(); };
  v.querySelector('#cl-start').onclick=startCall;
}

/* ---------- in-call screen ---------- */
function renderStage(){
  const v=$('#v-call');
  v.innerHTML='<div class="call-stage">'+
    '<div class="call-top"><span class="call-live">● مباشر</span><span class="call-time" id="cs-time">0:00</span></div>'+
    '<div class="sam-wrap" id="cs-av">'+AVATAR+'<div class="sam-think"><i></i><i></i><i></i></div></div>'+
    '<div class="call-status" id="cs-st">جارٍ الاتصال…</div>'+
    '<div class="call-caps" id="cs-caps"><div class="cap sam" id="cs-sam"></div><div class="cap you" id="cs-you"></div></div>'+
    '<div class="call-ctl">'+
      '<button class="cc-btn" id="cs-cc" aria-label="الترجمة النصية">CC</button>'+
      '<button class="mic cs-mic" id="cs-mic" aria-label="تكلم"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>'+
      '<button class="cc-btn end" id="cs-end" aria-label="إنهاء المكالمة">✕</button>'+
    '</div><div class="hint" id="cs-hint">تكلم بعد أن ينهي Sam كلامه. يمكنك الضغط على الميكروفون لمقاطعته.</div></div>';
  v.querySelector('#cs-end').onclick=()=>endCall();
  v.querySelector('#cs-cc').onclick=()=>{ C.captions=!C.captions; v.querySelector('#cs-caps').hidden=!C.captions; v.querySelector('#cs-cc').classList.toggle('off',!C.captions); };
  v.querySelector('#cs-mic').onclick=()=>{
    if(!C.on) return;
    if(rec){ stopListening(); return; }                         // finish my sentence now
    if(C.phase==='thinking') return;
    try{ speechSynthesis.cancel(); }catch(e){}                   // barge in while Sam talks
    listenTurn(true);
  };
}
function phase(p, text){
  C.phase=p; const av=$('#cs-av'), st=$('#cs-st'); if(!av) return;
  av.className='sam-wrap '+p; st.textContent=text;
}
const mmss = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');

async function startCall(){
  if(!hasKey()){ toast('أضف مفتاح API من الإعدادات أولًا.'); return; }
  C={on:true, turns:[], fixes:[], t0:Date.now(), tick:null, misses:0, phase:'idle', captions:true};
  renderStage();
  C.tick=setInterval(()=>{ const el=$('#cs-time'); if(el) el.textContent=mmss(Math.round((Date.now()-C.t0)/1000)); },1000);
  phase('thinking','Sam يتصل بك…');
  await samTurn(true);
}
function callPrompt(opening){
  const hist=C.turns.slice(-16).map(t=>(t.who==='Sam'?'Sam: ':'Learner: ')+t.text).join('\n');
  return `You are Sam, a warm, upbeat English conversation partner on a VOICE CALL with an adult Arabic speaker.
Learner level: ${LV[S.level]}.
${memSummary(getMem())}
Rules: this is spoken conversation, so reply in 1-2 short natural sentences (they are read aloud) and usually end with a question. No lists, no emojis, no stage directions. Their words come from speech recognition, so ignore punctuation and small recognition glitches.
If their last message had a real grammar or word-choice mistake, naturally use the correct form in your reply (a gentle recast) without lecturing.
${opening ? 'Start the call now: greet them warmly (by name if you know it). If you remember something about them, mention it naturally and ask a follow-up about it.' : ''}

Call so far:
${hist||'(the call is just starting)'}

Reply with ONLY a JSON object:
{"reply": "your next spoken line",
 "fix": ${opening?'null':'"corrected natural version of the learner\'s LAST message, or null if it was fine"'},
 "tip": ${opening?'null':'"one short Arabic explanation of that fix, or null"'}}`;
}
async function samTurn(opening){
  if(!C.on) return;
  phase('thinking','Sam يفكر…');
  try{
    const r=await askClaude(callPrompt(opening), 300);
    if(!C.on) return;
    if(!opening && r.fix){ const last=[...C.turns].reverse().find(t=>t.who!=='Sam');
      C.fixes.push({said:last?last.text:'', better:r.fix, tip:r.tip||''}); window.addMistake && addMistake(last?last.text:'', r.fix, r.tip||''); }
    const reply=String(r.reply||'Sorry, could you say that again?');
    C.turns.push({who:'Sam', text:reply});
    const sc=$('#cs-sam'); if(sc) sc.textContent=reply;
    phase('talking','Sam يتكلم…');
    speak(reply, null, ()=>{ if(C.on && C.phase==='talking') listenTurn(false); });
  }catch(e){
    if(!C.on) return;
    phase('idle', errText(e));
    const h=$('#cs-hint'); if(h) h.textContent='اضغط الميكروفون للمحاولة مرة أخرى.';
  }
}
function listenTurn(byTap){
  if(!C.on) return;
  phase('listening','دورك… تكلم الآن');
  const you=$('#cs-you'); if(you) you.textContent='';
  listen({btn:$('#cs-mic'), quiet:!byTap,
    onText:t=>{ const y=$('#cs-you'); if(y) y.textContent=t; },
    onEnd:(t, err)=>{
      if(!C.on) return;
      if(t){ C.misses=0; C.turns.push({who:'You', text:t}); window.questEvent && questEvent('callturn'); samTurn(false); return; }
      if(err==='not-allowed' || err==='service-not-allowed'){ phase('idle','اضغط الميكروفون للرد'); return; }
      C.misses++;
      if(C.misses===1){ listenTurn(false); return; }          // one silent retry
      phase('idle','اضغط الميكروفون عندما تكون جاهزًا');
    }});
}
async function endCall(){
  if(!C.on) return;
  C.on=false; clearInterval(C.tick); stopListening(true); try{ speechSynthesis.cancel(); }catch(e){}
  const secs=Math.round((Date.now()-C.t0)/1000), mine=C.turns.filter(t=>t.who==='You').length;
  const v=$('#v-call');
  v.innerHTML='<div class="p-top"><button class="p-back" id="ce-back">→ المحادثة</button><b>انتهت المكالمة</b></div>'+
    '<div class="call-lobby"><div class="sam-wrap idle small">'+AVATAR+'</div></div>'+
    '<div class="p-stat"><div><b>'+mmss(secs)+'</b><span>مدة المكالمة</span></div><div><b>'+mine+'</b><span>مرة تكلمت</span></div><div><b>'+C.fixes.length+'</b><span>تصحيحات</span></div></div>'+
    (C.fixes.length?'<div class="card"><div class="label">تصحيحات هذه المكالمة · أُضيفت إلى دفتر أخطائك</div>'+
      C.fixes.map(f=>'<div class="fb-row"><div class="en"><del>'+esc(f.said)+'</del><br><ins>'+esc(f.better)+'</ins></div>'+(f.tip?'<div class="hint" style="text-align:start">'+esc(f.tip)+'</div>':'')+'</div>').join('')+'</div>'
      : (mine?'<p class="hint">لم يجد Sam أخطاء واضحة. أحسنت!</p>':''))+
    '<div class="hint" id="ce-mem">'+(mine>=2?'Sam يحفظ ما تعلّمه عنك…':'')+'</div>'+
    '<div class="actions" style="justify-content:center"><button class="btn" id="ce-again">📞 اتصل مرة أخرى</button></div>';
  v.querySelector('#ce-back').onclick=()=>show('chat');
  v.querySelector('#ce-again').onclick=startCall;
  if(mine>0){ award(Math.min(60, 5*mine + Math.round(secs/30)), 'مكالمة'); window.questEvent && questEvent('callmin', Math.max(1, Math.round(secs/60))); }
  if(mine>=2) rememberCall(v.querySelector('#ce-mem'));
}
async function rememberCall(el){
  const m=getMem();
  try{
    const r=await askClaude(`From this English practice call, update what a friendly tutor should remember about the learner for next time.
Existing memory: ${JSON.stringify({name:m.name, facts:m.facts})}
Transcript ("You" is the learner):
${C.turns.map(t=>t.who+': '+t.text).join('\n').slice(0,6000)}

Keep only durable facts the learner said about themselves (name, work, family members' roles, interests, plans). Never store sensitive details such as health, religion, money, or exact addresses. Keep each fact under 10 words.
Reply with ONLY JSON: {"name": "learner's first name or empty string", "facts": [up to 10 short English facts, merged with existing, no duplicates], "topic": "3-6 word topic of this call"}`, 400);
    const nm={name:(String(r.name||'').trim()||m.name).slice(0,30), facts:(Array.isArray(r.facts)?r.facts:m.facts).map(String).filter(Boolean).slice(0,10), topics:m.topics.concat(r.topic?[String(r.topic).slice(0,60)]:[]).slice(-6)};
    setMem(nm);
    if(el) el.innerHTML = nm.facts.length ? 'Sam يتذكر الآن: <span dir="ltr">'+esc(nm.facts.slice(0,3).join(' · '))+'</span>' : '';
  }catch(e){ if(el) el.textContent=''; }
}

/* ---------- wiring ---------- */
$('#call-cta').onclick=()=>show('call');
window.EXTRA_PRACTICE=(window.EXTRA_PRACTICE||[]).concat([{k:'call', t:'اتصل بـ Sam', sub:'مكالمة صوتية دون لمس الشاشة', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'}]);
const prev=window.onShow;
window.onShow=v=>{ if(v!=='call' && C.on) endCall(); if(v==='call' && !C.on) renderLobby(); prev && prev(v); };
document.addEventListener('visibilitychange',()=>{ if(document.hidden && C.on) endCall(); });
if(!$('#v-call').hidden) renderLobby();
})();
