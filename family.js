/* Talkie — family profiles, kid mode, parent gate, parent dashboard, daily play-time limit.
   Uses globals from index.html: $, $$, esc, store, PID, show, current, toast. Each profile's progress lives under its own keys. */
(function(){
const EMOJIS = ['🧑','👨','👩','👦','👧','🧒','👶','🦁','🐼','🦄','🐯','🚀','⚽','🌟'];
const F = Object.assign({list:[{id:'main', name:'أنا', emoji:'🧑', kid:false}], limits:{}, extra:{}}, store.get('talkie-profiles', {}));
if(!F.list.some(p=>p.id==='main')) F.list.unshift({id:'main', name:'أنا', emoji:'🧑', kid:false});
const saveF = () => store.set('talkie-profiles', F);
const me = F.list.find(p=>p.id===PID) || F.list[0];
const dayKey = d => d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const todayKey = () => dayKey(new Date());

/* ---------- header avatar ---------- */
const av = document.createElement('button'); av.className='f-av'; av.id='f-av'; av.setAttribute('aria-label','الأفراد'); av.textContent=me.emoji;
$('#gear').before(av);
av.onclick = openSheet;

/* ---------- kid mode ---------- */
if(me.kid){
  document.body.classList.add('kidmode');
  const prev = window.onShow;
  window.onShow = v => { if(v!=='kids'){ setTimeout(()=>show('kids'),0); return; } prev && prev(v); };
  if(current!=='kids') show('kids');
}

/* ---------- parent gate ---------- */
function gate(){
  return new Promise(res=>{
    const a=3+Math.floor(Math.random()*7), b=3+Math.floor(Math.random()*7);
    const o=document.createElement('div'); o.className='f-sheet';
    o.innerHTML='<div class="f-panel"><div class="f-gate"><h2>لولي الأمر فقط</h2><p class="hint">أجب عن السؤال للمتابعة</p><div class="q">'+a+' × '+b+' = ?</div>'+
      '<input class="field" id="g-in" inputmode="numeric" style="text-align:center;font-size:1.4rem;max-width:10rem"><div class="actions" style="justify-content:center"><button class="btn" id="g-ok">متابعة</button><button class="btn ghost" id="g-x">إلغاء</button></div><div class="status err" id="g-e"></div></div></div>';
    document.body.append(o);
    const inp=o.querySelector('#g-in'); setTimeout(()=>inp.focus(),50);
    const ok=()=>{ if(+inp.value===a*b){ o.remove(); res(true); } else { o.querySelector('#g-e').textContent='إجابة غير صحيحة'; inp.value=''; } };
    o.querySelector('#g-ok').onclick=ok; inp.onkeydown=e=>{ if(e.key==='Enter') ok(); };
    o.querySelector('#g-x').onclick=()=>{ o.remove(); res(false); };
  });
}
const guarded = async fn => { if(me.kid && !(await gate())) return; fn(); };

/* ---------- profiles sheet ---------- */
function switchTo(id){
  try{ localStorage.setItem('talkie-current', JSON.stringify(id)); }catch(e){}
  location.reload();
}
function openSheet(){
  const o=document.createElement('div'); o.className='f-sheet';
  o.innerHTML='<div class="f-panel"><h2>من يتعلم الآن؟</h2><div class="p-list">'+
    F.list.map(p=>'<button class="f-prof'+(p.id===me.id?' on':'')+'" data-id="'+p.id+'"><span class="e">'+p.emoji+'</span><div><b>'+esc(p.name)+'</b><small>'+(p.kid?'طفل · يرى عالم الأطفال فقط':'بالغ · كل الأقسام')+(p.id===me.id?' · الحالي':'')+'</small></div></button>').join('')+
    '</div><div class="actions"><button class="btn ghost" id="f-add">+ إضافة فرد</button><button class="btn ghost" id="f-dash">لوحة ولي الأمر</button><button class="btn ghost" id="f-x">إغلاق</button></div></div>';
  document.body.append(o);
  o.addEventListener('click', e=>{ if(e.target===o) o.remove(); });
  o.querySelector('#f-x').onclick=()=>o.remove();
  o.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.id; if(id===me.id){ o.remove(); return; }
    if(me.kid && !(await gate())) return;   // a child cannot leave kid mode alone
    switchTo(id);
  });
  o.querySelector('#f-add').onclick=()=>guarded(()=>{ o.remove(); addForm(); });
  o.querySelector('#f-dash').onclick=()=>guarded(()=>{ o.remove(); openDash(); });
}
function addForm(){
  let emoji='👦', kid=true;
  const o=document.createElement('div'); o.className='f-sheet';
  o.innerHTML='<div class="f-panel"><h2>فرد جديد</h2><label class="label" for="f-name">الاسم</label><input class="field" id="f-name" style="direction:rtl" maxlength="20" placeholder="مثلًا: محمد">'+
    '<div class="label">الصورة</div><div class="f-emojis">'+EMOJIS.map(e=>'<button data-e="'+e+'" aria-pressed="'+(e===emoji)+'">'+e+'</button>').join('')+'</div>'+
    '<label class="switch" style="color:var(--ink);font-size:.95rem"><input type="checkbox" id="f-kid" checked> طفل (يفتح على عالم الأطفال فقط، ويحتاج سؤال ولي الأمر للخروج)</label>'+
    '<div class="actions"><button class="btn" id="f-save">حفظ والانتقال إليه</button><button class="btn ghost" id="f-cancel">إلغاء</button></div><div class="status err" id="f-err"></div></div>';
  document.body.append(o);
  o.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{ emoji=b.dataset.e; o.querySelectorAll('[data-e]').forEach(x=>x.setAttribute('aria-pressed', x===b)); });
  o.querySelector('#f-cancel').onclick=()=>o.remove();
  o.querySelector('#f-save').onclick=()=>{
    const name=o.querySelector('#f-name').value.trim(); kid=o.querySelector('#f-kid').checked;
    if(!name){ o.querySelector('#f-err').textContent='اكتب الاسم أولًا'; return; }
    const id='p'+Date.now().toString(36);
    F.list.push({id, name, emoji, kid}); if(kid && F.limits[id]==null) F.limits[id]=30; saveF(); switchTo(id);
  };
}

/* ---------- play-time tracking & daily limit ---------- */
const TICK=15;
setInterval(()=>{
  if(document.hidden || current!=='kids') return;
  const L=Object.assign({days:{}, miss:{}}, store.get('talkie-kidlog', {}));
  const d=L.days[todayKey()] = L.days[todayKey()] || {sec:0, games:{}};
  d.sec+=TICK; store.set('talkie-kidlog', L);
  checkLimit();
}, TICK*1000);
function usedToday(pid){ const L=store.get('talkie-kidlog', {days:{}}, pid); return ((L.days||{})[todayKey()]||{}).sec||0; }
function allowedToday(pid){ const lim=F.limits[pid]; if(!lim) return Infinity; return (lim + (((F.extra||{})[pid]||{})[todayKey()]||0))*60; }
function checkLimit(){
  if(!me.kid || document.querySelector('.f-limit')) return;
  if(usedToday(me.id) < allowedToday(me.id)) return;
  window.kidsStop && kidsStop(); try{ speechSynthesis.cancel(); }catch(e){}
  const o=document.createElement('div'); o.className='f-limit';
  o.innerHTML='<div class="big">🌙</div><b>انتهى وقت اللعب اليوم</b><span dir="ltr">See you tomorrow, '+esc(me.name)+'!</span><span style="font-family:var(--body)">أحسنت اليوم! نلتقي غدًا.</span><button class="k-btn ghost" id="l-more">ولي الأمر: أضف 15 دقيقة</button>';
  document.body.append(o);
  o.querySelector('#l-more').onclick=async()=>{ if(!(await gate())) return;
    F.extra=F.extra||{}; const e=F.extra[me.id]=F.extra[me.id]||{}; e[todayKey()]=(e[todayKey()]||0)+15; saveF(); o.remove(); };
}
checkLimit();

/* ---------- parent dashboard ---------- */
function openDash(){ show('parent'); }
function weekBars(pid){
  const L=store.get('talkie-kidlog', {days:{}}, pid), days=[], names=['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'];
  for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const s=(((L.days||{})[dayKey(d)])||{}).sec||0; days.push([names[d.getDay()], Math.round(s/60)]); }
  const max=Math.max(10, ...days.map(x=>x[1]));
  return '<div class="f-week">'+days.map(([n,m])=>'<div><em>'+m+'</em><i style="height:'+Math.round(60*m/max)+'%"></i><span>'+n+'</span></div>').join('')+'</div>';
}
function kidCard(p){
  const K=store.get('talkie-kids', {stars:0, stickers:0}, p.id), L=Object.assign({days:{}, miss:{}}, store.get('talkie-kidlog', {}, p.id));
  const games={}; Object.values(L.days).forEach(d=>Object.entries(d.games||{}).forEach(([g,x])=>{ const t=games[g]=games[g]||{plays:0,score:0,total:0}; t.plays+=x.plays; t.score+=x.score; t.total+=x.total; }));
  const top=Object.entries(games).sort((a,b)=>b[1].plays-a[1].plays).slice(0,8);
  const miss=Object.entries(L.miss||{}).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const lim=F.limits[p.id]||0, today=Math.round(usedToday(p.id)/60);
  return '<div class="f-kid"><h3><span style="font-size:1.6rem">'+p.emoji+'</span>'+esc(p.name)+'</h3>'+
    '<div class="p-stat"><div><b>'+today+'</b><span>دقيقة اليوم</span></div><div><b>'+K.stars+'</b><span>نجمة</span></div><div><b>'+K.stickers+'</b><span>ملصق</span></div></div>'+
    '<div class="label">دقائق اللعب في آخر 7 أيام</div>'+weekBars(p.id)+
    (top.length?'<div class="label">الألعاب</div><div class="p-list">'+top.map(([g,x])=>{ const acc=x.total?Math.round(100*x.score/x.total):null;
      return '<div class="p-bar" style="grid-template-columns:1fr auto auto"><span>'+esc(g)+'</span><span class="v">'+x.plays+' مرة</span><span class="v" style="min-width:3.2rem">'+(acc==null?'–':acc+'%')+'</span></div>'; }).join('')+'</div>'
      :'<p class="hint">لم يلعب بعد.</p>')+
    (miss.length?'<div class="label">كلمات يخطئ فيها</div><div class="starters" style="direction:ltr">'+miss.map(([w,n])=>'<span>'+esc(w)+' ×'+n+'</span>').join('')+'</div>':'')+
    '<div class="label">حد اللعب اليومي</div><div class="p-seg" data-lim="'+p.id+'">'+[0,15,30,45,60].map(m=>'<button class="chip" data-m="'+m+'" aria-pressed="'+(m===lim)+'">'+(m?m+' د':'بلا حد')+'</button>').join('')+'</div>'+
    (p.id!=='main'?'<button class="p-back" data-rm="'+p.id+'" style="align-self:flex-start">حذف هذا الملف</button>':'')+
  '</div>';
}
function adultCard(p){
  const P2=store.get('talkie', {xp:0, streak:0}, p.id), M=store.get('talkie-mistakes', [], p.id);
  return '<div class="f-kid"><h3><span style="font-size:1.6rem">'+p.emoji+'</span>'+esc(p.name)+'</h3><div class="p-stat"><div><b>'+(P2.xp||0)+'</b><span>XP</span></div><div><b>'+(P2.streak||0)+'</b><span>أيام متتالية</span></div><div><b>'+M.length+'</b><span>في دفتر الأخطاء</span></div></div>'+
    (p.id!=='main'?'<button class="p-back" data-rm="'+p.id+'" style="align-self:flex-start">حذف هذا الملف</button>':'')+'</div>';
}
function renderDash(){
  const v=$('#v-parent');
  const kids=F.list.filter(p=>p.kid), adults=F.list.filter(p=>!p.kid);
  v.innerHTML='<div class="p-top"><button class="p-back" id="pd-back">→ الإعدادات</button><b>لوحة ولي الأمر</b></div>'+
    (kids.length?'':'<div class="empty"><strong>لا يوجد أطفال بعد</strong>أضف طفلًا من زر الصورة أعلى الشاشة، ليكون له ملف خاص بنجومه وتقدمه.</div>')+
    kids.map(kidCard).join('')+'<div class="label">البالغون</div>'+adults.map(adultCard).join('')+
    '<button class="btn ghost" id="pd-add">+ إضافة فرد</button>';
  v.querySelector('#pd-back').onclick=()=>show('set');
  v.querySelector('#pd-add').onclick=addForm;
  v.querySelectorAll('[data-lim]').forEach(row=>row.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{
    F.limits[row.dataset.lim]=+b.dataset.m; saveF(); row.querySelectorAll('[data-m]').forEach(x=>x.setAttribute('aria-pressed', x===b)); toast(+b.dataset.m?'الحد اليومي '+b.dataset.m+' دقيقة':'بلا حد يومي'); }));
  v.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{
    if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='اضغط مرة أخرى لحذف كل تقدمه نهائيًا'; return; }
    const id=b.dataset.rm; F.list=F.list.filter(p=>p.id!==id); delete F.limits[id]; saveF();
    ['talkie','talkie-kids','talkie-tab','talkie-mistakes','talkie-sounds','talkie-kidlog'].forEach(k=>{ try{ localStorage.removeItem(keyOf(k,id)); }catch(e){} });
    if(id===me.id) switchTo('main'); else renderDash();
  });
}

/* ---------- settings card ---------- */
const card=document.createElement('div'); card.className='card';
card.innerHTML='<h2>العائلة</h2><p class="hint" style="text-align:start">لكل فرد ملف خاص بنقاطه ونجومه وأخطائه. ملف الطفل يفتح على عالم الأطفال فقط.</p>'+
  '<div class="actions"><button class="btn ghost" id="fs-who">الأفراد ('+F.list.length+')</button><button class="btn ghost" id="fs-dash">لوحة ولي الأمر</button></div>';
$('#v-set').insertBefore(card, $('#v-set').firstChild);
card.querySelector('#fs-who').onclick=openSheet;
card.querySelector('#fs-dash').onclick=openDash;

const prev = window.onShow;
window.onShow = v => { if(v==='parent') renderDash(); prev && prev(v); };
})();
