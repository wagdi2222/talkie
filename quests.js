/* Talkie — daily quests, weekly family league, shareable weekly report card.
   Uses globals from index.html: $, esc, store, PID, keyOf, award, toast, show. Loads before call/shadow/kids-world/family. */
(function(){
/* tiny event bus shared by the add-on modules */
const bus = {};
window.TalkieBus = { on:(e,f)=>{ (bus[e]=bus[e]||[]).push(f); }, emit:(e,...a)=>{ (bus[e]||[]).forEach(f=>{ try{ f(...a); }catch(err){ console.error(err); } }); } };
window.onKidStars = n => TalkieBus.emit('kidstars', n);
window.onKidFinish = (s,t,g) => TalkieBus.emit('kidfinish', s, t, g);

const profiles = () => Object.assign({list:[{id:'main', name:'أنا', emoji:'🧑', kid:false}]}, store.get('talkie-profiles', {})).list;
const meP = () => profiles().find(p=>p.id===PID) || {id:PID, name:'أنا', emoji:'🧑', kid:false};
const dayKey = d => d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const today = () => dayKey(new Date());
const weekStart = (d=new Date()) => { const x=new Date(d); x.setHours(0,0,0,0); x.setDate(x.getDate()-x.getDay()); return x; }; // week starts Sunday
const weekKey = (d) => dayKey(weekStart(d));

const ADULT = [
  {id:'chat5', ev:'chat', n:5, t:'أرسل 5 رسائل إلى Sam', go:'chat'},
  {id:'callmin2', ev:'callmin', n:2, t:'كلّم Sam دقيقتين', go:'call'},
  {id:'callturn6', ev:'callturn', n:6, t:'تكلم 6 مرات في مكالمة مع Sam', go:'call'},
  {id:'review3', ev:'review', n:3, t:'راجع 3 تصحيحات من دفترك', go:'mistakes', needs:'mistakes'},
  {id:'say3', ev:'say', n:3, t:'انطق 3 جمل في «قلها»', go:'say'},
  {id:'shadow3', ev:'shadow', n:3, t:'3 محاولات ناجحة في تمرين الظل', go:'shadow'},
  {id:'dict2', ev:'dict', n:2, t:'اكتب جملتين في «اسمع واكتب»', go:'dict'},
  {id:'coach1', ev:'coach', n:1, t:'تدرّب على عرض قصير', go:'coach'}
];
const KID = [
  {id:'stars5', ev:'stars', n:5, t:'اجمع 5 نجوم ⭐'},
  {id:'stars12', ev:'stars', n:12, t:'اجمع 12 نجمة ⭐'},
  {id:'game2', ev:'kidgame', n:2, t:'أكمل لعبتين 🎮'},
  {id:'feed1', ev:'feed', n:1, t:'أطعم صديقك 🐪'},
  {id:'story1', ev:'story', n:1, t:'اقرأ قصة 📖'},
  {id:'trace2', ev:'trace', n:2, t:'اكتب حرفين ✍️'},
  {id:'map1', ev:'map', n:1, t:'أكمل محطة في الخريطة 🗺️'}
];
function seeded(str){ let h=2166136261; for(const c of str){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%10000)/10000; }; }
function pickToday(){
  const kid=meP().kid, pool=(kid?KID:ADULT).filter(q=> q.needs!=='mistakes' || (store.get('talkie-mistakes',[])||[]).length>0);
  const r=seeded(today()+PID), arr=pool.slice();
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  // avoid two quests on the same event
  const out=[], seen=new Set(); for(const q of arr){ if(seen.has(q.ev)) continue; seen.add(q.ev); out.push(q); if(out.length===3) break; }
  return out.map(q=>({id:q.id, p:0, done:false}));
}
function getQ(){
  const Q=Object.assign({day:'', items:[], week:{}}, store.get('talkie-quests', {}));
  if(Q.day!==today()){ Q.day=today(); Q.items=pickToday(); store.set('talkie-quests', Q); }
  return Q;
}
const defOf = id => ADULT.concat(KID).find(q=>q.id===id);
window.questEvent = function(ev, n=1){
  const Q=getQ(), wk=weekKey(); let changed=false;
  Q.week[wk]=(Q.week[wk]||0)+Math.min(n,5);            // every bit of practice counts in the family league
  Q.items.forEach(it=>{ const d=defOf(it.id); if(!d || it.done || d.ev!==ev) return;
    it.p=Math.min(d.n, it.p+n); changed=true;
    if(it.p>=d.n){ it.done=true; Q.week[wk]+=10; setTimeout(()=>celebrate(d), 400); } });
  store.set('talkie-quests', Q);
  if(changed) paintCards();
};
function celebrate(d){
  toast('🏅 أنجزت مهمة: '+d.t);
  if(meP().kid){ window.KidsAPI && KidsAPI.addStars(2); }
  else award(15, 'مهمة');
  const Q=getQ(); if(Q.items.length && Q.items.every(i=>i.done)){ Q.week[weekKey()]+=20; store.set('talkie-quests', Q); setTimeout(()=>toast('🎉 أنجزت كل مهام اليوم! +20 نقطة للدوري'), 2200); }
}
// kid activity → quest events, and stars into the daily log for reports
TalkieBus.on('kidstars', n=>{
  questEvent('stars', n);
  const L=Object.assign({days:{}, miss:{}}, store.get('talkie-kidlog', {})); const d=L.days[today()]=L.days[today()]||{sec:0, games:{}};
  d.stars=(d.stars||0)+n; store.set('talkie-kidlog', L);
});
TalkieBus.on('kidfinish', ()=>questEvent('kidgame'));

/* ---------- quest cards ---------- */
function cardHTML(kid){
  const Q=getQ(), done=Q.items.filter(i=>i.done).length;
  return '<div class="q-card'+(kid?' kid':'')+'" data-qcard><div class="q-head"><b>مهام اليوم</b><span>'+done+' / '+Q.items.length+'</span></div>'+
    Q.items.map(it=>{ const d=defOf(it.id); if(!d) return ''; const pc=Math.round(100*it.p/d.n);
      return '<button class="q-row'+(it.done?' done':'')+'" '+(d.go?'data-qgo="'+d.go+'"':'')+'><span class="q-chk">'+(it.done?'✓':'')+'</span><span class="q-t">'+d.t+'</span><span class="q-n">'+it.p+'/'+d.n+'</span><i style="width:'+pc+'%"></i></button>'; }).join('')+
    '<button class="q-league" data-qleague>🏆 الدوري العائلي · '+(Q.week[weekKey()]||0)+' نقطة هذا الأسبوع ←</button></div>';
}
function wireCard(root){
  root.querySelectorAll('[data-qgo]').forEach(b=>b.onclick=()=>show(b.dataset.qgo));
  root.querySelectorAll('[data-qleague]').forEach(b=>b.onclick=()=>{ if(meP().kid && window.KidsAPI){ kidLeague(); } else show('league'); });
}
function paintCards(){ document.querySelectorAll('[data-qcard]').forEach(c=>{ const kid=c.classList.contains('kid'); const t=document.createElement('div'); t.innerHTML=cardHTML(kid); const n=t.firstChild; c.replaceWith(n); wireCard(n.parentNode||document); }); }
window.PRACTICE_TOP=(window.PRACTICE_TOP||[]).concat([{html:()=>cardHTML(false), wire:wireCard}]);
// on the kids home the quest card belongs to child profiles; a grown-up browsing the kids games sees their own quests in Practice
window.KIDS_TOP=(window.KIDS_TOP||[]).concat([{html:()=>meP().kid?cardHTML(true):'', wire:wireCard}]);

/* ---------- family league ---------- */
function standings(){
  const wk=weekKey(), lastWk=weekKey(new Date(weekStart().getTime()-864e5));
  const rows=profiles().map(p=>{ const Q=store.get('talkie-quests', {week:{}}, p.id)||{}; const w=Q.week||{}; return {p, pts:w[wk]||0, last:w[lastWk]||0}; });
  return {rows:rows.sort((a,b)=>b.pts-a.pts), lastChamp: rows.slice().sort((a,b)=>b.last-a.last)[0]};
}
function leagueHTML(){
  const {rows, lastChamp}=standings(), daysLeft=7-new Date().getDay(), medals=['🥇','🥈','🥉'];
  return '<div class="lg-hero"><b>الدوري العائلي</b><span>ينتهي الأسبوع بعد '+daysLeft+' '+(daysLeft===1?'يوم':'أيام')+' · كل تمرين = نقطة، وكل مهمة = 10 نقاط</span></div>'+
    '<div class="p-list">'+rows.map((r,i)=>'<div class="lg-row'+(r.p.id===PID?' me':'')+'"><span class="lg-rank">'+(r.pts>0&&medals[i]?medals[i]:(i+1))+'</span><span class="lg-emo">'+r.p.emoji+'</span><b>'+esc(r.p.name)+(r.p.id===PID?' (أنت)':'')+'</b><span class="lg-pts">'+r.pts+'</span></div>').join('')+'</div>'+
    (lastChamp && lastChamp.last>0 ? '<p class="hint">بطل الأسبوع الماضي: '+lastChamp.p.emoji+' '+esc(lastChamp.p.name)+' ('+lastChamp.last+' نقطة)</p>' : '')+
    (rows.length<2?'<p class="hint">أضف أفراد العائلة من زر الصورة أعلى الشاشة ليتنافسوا معك.</p>':'');
}
function renderLeague(){ const v=$('#v-league'); v.innerHTML='<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>الدوري العائلي</b></div>'+leagueHTML(); }
function kidLeague(){ const body=KidsAPI.screen('الدوري العائلي','Family league'); body.innerHTML=leagueHTML(); }

/* ---------- weekly report card (shareable image) ---------- */
window.weeklyCard = async function(pid){
  const p=profiles().find(x=>x.id===pid); if(!p) return;
  const L=Object.assign({days:{}, miss:{}}, store.get('talkie-kidlog', {}, pid)), K=store.get('talkie-kids', {stars:0, stickers:0}, pid);
  let mins=0, stars=0, plays=0, games={};
  for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); const x=L.days[dayKey(d)]; if(!x) continue;
    mins+=Math.round((x.sec||0)/60); stars+=x.stars||0; Object.entries(x.games||{}).filter(([g])=>!/^غرفة |خريطة المغامرة|الدوري العائلي/.test(g)).forEach(([g,v])=>{ plays+=v.plays||0; games[g]=(games[g]||0)+(v.plays||0); }); }
  const fav=Object.entries(games).sort((a,b)=>b[1]-a[1])[0];
  const stickers=(window.KidsAPI?KidsAPI.STICKERS:[]).slice(0, K.stickers||0);
  const Q=store.get('talkie-quests', {week:{}}, pid)||{week:{}}; const pts=(Q.week||{})[weekKey()]||0;
  if(document.fonts && document.fonts.ready) await document.fonts.ready;
  const W=1080, H=1350, c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,H); grd.addColorStop(0,'#A9C8FF'); grd.addColorStop(1,'#FFE07A'); g.fillStyle=grd; g.fillRect(0,0,W,H);
  const rr=(x,y,w,h,r,fill)=>{ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fillStyle=fill; g.fill(); };
  g.direction='rtl'; g.textAlign='center'; g.fillStyle='#2A1E3D';
  g.font='800 64px "Baloo Bhaijaan 2", "Readex Pro", sans-serif'; g.fillText('بطاقة إنجاز الأسبوع', W/2, 130);
  g.font='500 34px "Readex Pro", sans-serif'; g.fillText(new Date(weekStart()).toLocaleDateString('ar-SA',{day:'numeric',month:'long'})+' – '+new Date().toLocaleDateString('ar-SA',{day:'numeric',month:'long'}), W/2, 185);
  rr(90,225,900,325,48,'rgba(255,255,255,.85)');
  g.fillStyle='#2A1E3D'; g.font='170px sans-serif'; g.fillText(p.emoji, W/2, 400);
  g.fillStyle='#2A1E3D'; g.font='800 70px "Baloo Bhaijaan 2", "Readex Pro", sans-serif'; g.fillText(p.name, W/2, 518);
  const tiles=[[String(mins),'دقيقة تعلّم'],[String(stars),'نجمة ⭐'],[String(plays),'لعبة']];
  tiles.forEach(([v,l],i)=>{ const x=90+i*306; rr(x,570,282,230,40,'rgba(255,255,255,.85)'); g.fillStyle='#2952E3'; g.font='800 92px "Baloo Bhaijaan 2", sans-serif'; g.fillText(v, x+141, 690); g.fillStyle='#2A1E3D'; g.font='600 34px "Readex Pro", sans-serif'; g.fillText(l, x+141, 760); });
  rr(90,840,900,250,48,'rgba(255,255,255,.85)'); g.fillStyle='#2A1E3D';
  g.font='600 38px "Readex Pro", sans-serif'; g.fillText(fav ? 'لعبته المفضلة: '+fav[0] : 'ابدأ أسبوعًا جديدًا من اللعب والتعلّم!', W/2, 915);
  g.fillText('نقاط الدوري العائلي: '+pts, W/2, 975);
  g.font='60px sans-serif'; g.fillText(stickers.length ? stickers.slice(-8).join(' ') : '⭐ 🎈 📚', W/2, 1060);
  g.fillStyle='#2A1E3D'; g.font='800 56px "Baloo Bhaijaan 2", sans-serif'; g.fillText(mins>=30 ? 'أحسنت! أنت بطل الإنجليزية 🏆' : 'بداية رائعة! استمر 💪', W/2, 1185);
  g.font='500 30px "Readex Pro", sans-serif'; g.fillStyle='rgba(42,30,61,.7)'; g.fillText('Talkie English', W/2, 1290);
  const blob=await new Promise(r=>c.toBlob(r,'image/png')); const url=URL.createObjectURL(blob);
  const file=new File([blob], 'talkie-'+p.name+'.png', {type:'image/png'});
  const canShare=!!(navigator.canShare && navigator.canShare({files:[file]}));
  const o=document.createElement('div'); o.className='f-sheet';
  o.innerHTML='<div class="f-panel"><h2>بطاقة '+esc(p.name)+'</h2><img src="'+url+'" alt="بطاقة الأسبوع" style="border-radius:18px;width:100%">'+
    '<div class="actions">'+(canShare?'<button class="btn" id="wc-share">مشاركة</button>':'')+'<a class="btn ghost" id="wc-dl" href="'+url+'" download="talkie-'+esc(p.name)+'.png">حفظ الصورة</a><button class="btn ghost" id="wc-x">إغلاق</button></div>'+
    (canShare?'':'<p class="hint">إذا لم يعمل زر الحفظ، اضغط مطولًا على الصورة واختر «حفظ».</p>')+'</div>';
  document.body.append(o);
  o.querySelector('#wc-x').onclick=()=>{ o.remove(); URL.revokeObjectURL(url); };
  const sh=o.querySelector('#wc-share'); if(sh) sh.onclick=async()=>{ try{ await navigator.share({files:[file], title:'Talkie', text:'إنجاز '+p.name+' هذا الأسبوع في تعلّم الإنجليزية 🌟'}); }catch(e){} };
};

const prev=window.onShow;
window.onShow=v=>{ if(v==='league') renderLeague(); prev && prev(v); };
})();
