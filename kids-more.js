/* Talkie Kids — letter tracing, read-aloud stories, Simon says, opposites. Offline, no AI. */
(function(){
const A = window.KidsAPI; if(!A) return;
const {screen, cheer, oops, addStars, finish, say, sayAr, shuffle, pick, esc, tone, OPP, logMiss} = A;

/* ---------- 1. letter tracing: follow the real strokes of each letter ---------- */
const WORD_FOR = {A:'apple',B:'ball',C:'cat',D:'dog',E:'egg',F:'fish',G:'grapes',H:'horse',I:'ice cream',J:'juice',K:'key',L:'lion',M:'moon',
  N:'nose',O:'orange',P:'pencil',Q:'queen',R:'rabbit',S:'sun',T:'tree',U:'umbrella',V:'van',W:'watermelon',X:'fox',Y:'yellow',Z:'zebra'};
// Strokes in a 100 x 105 box, in writing order. Capitals sit between y=12 and the baseline y=85;
// small letters use the middle line y=42, the baseline y=85 and y=100 for tails (g, j, p, q, y).
const Lp=(x1,y1,x2,y2)=>[[x1,y1],[x2,y2]];
const Ap=(cx,cy,rx,ry,a0,a1)=>{ const n=Math.max(8,Math.ceil(Math.abs(a1-a0)/6)), o=[]; for(let i=0;i<=n;i++){ const a=(a0+(a1-a0)*i/n)*Math.PI/180; o.push([cx+rx*Math.cos(a), cy+ry*Math.sin(a)]); } return o; };
const Jn=(...p)=>[].concat(...p);
const DOT=(x,y)=>({dot:[x,y]});
const GLYPHS = {
  A:[Lp(50,12,22,85), Lp(50,12,78,85), Lp(33,60,67,60)],
  B:[Lp(28,12,28,85), Jn([[28,12],[55,12]], Ap(55,30,18,18,-90,90), [[28,48]]), Jn([[28,48],[58,48]], Ap(58,66.5,19,18.5,-90,90), [[28,85]])],
  C:[Ap(56,48.5,30,36.5,-40,-320)],
  D:[Lp(28,12,28,85), Jn([[28,12],[44,12]], Ap(44,48.5,32,36.5,-90,90), [[28,85]])],
  E:[Lp(28,12,28,85), Lp(28,12,72,12), Lp(28,48,64,48), Lp(28,85,72,85)],
  F:[Lp(28,12,28,85), Lp(28,12,72,12), Lp(28,48,64,48)],
  G:[Jn(Ap(56,48.5,30,36.5,-40,-355), [[60,51]])],
  H:[Lp(25,12,25,85), Lp(75,12,75,85), Lp(25,48,75,48)],
  I:[Lp(50,12,50,85), Lp(35,12,65,12), Lp(35,85,65,85)],
  J:[Jn([[65,12],[65,63]], Ap(46,63,19,22,0,180))],
  K:[Lp(28,12,28,85), Lp(72,12,28,52), Lp(42,40,74,85)],
  L:[Jn([[30,12],[30,85]], [[72,85]])],
  M:[Lp(20,85,20,12), Jn([[20,12],[50,62]], [[80,12]]), Lp(80,12,80,85)],
  N:[Lp(25,85,25,12), Lp(25,12,75,85), Lp(75,85,75,12)],
  O:[Ap(50,48.5,30,36.5,-90,-450)],
  P:[Lp(28,12,28,85), Jn([[28,12],[55,12]], Ap(55,31,19,19,-90,90), [[28,50]])],
  Q:[Ap(50,48.5,30,36.5,-90,-450), Lp(58,66,82,90)],
  R:[Lp(28,12,28,85), Jn([[28,12],[55,12]], Ap(55,31,19,19,-90,90), [[28,50]]), Lp(48,50,76,85)],
  S:[Jn(Ap(50,30,22,18,-30,-270), Ap(50,66.5,22,18.5,-90,150))],
  T:[Lp(20,12,80,12), Lp(50,12,50,85)],
  U:[Jn([[25,12],[25,60]], Ap(50,60,25,25,180,0), [[75,12]])],
  V:[Jn([[22,12],[50,85]], [[78,12]])],
  W:[Jn([[14,12],[32,85]], [[50,35]], [[68,85]], [[86,12]])],
  X:[Lp(25,12,75,85), Lp(75,12,25,85)],
  Y:[Lp(25,12,50,48), Jn([[75,12],[50,48]], [[50,85]])],
  Z:[Jn([[25,12],[75,12]], [[25,85]], [[75,85]])],
  a:[Ap(48,63.5,20,21.5,-20,-380), Lp(68,42,68,85)],
  b:[Lp(30,12,30,85), Ap(50,63.5,20,21.5,180,-180)],
  c:[Ap(52,63.5,21,21.5,-40,-320)],
  d:[Ap(50,63.5,20,21.5,-20,-380), Lp(70,12,70,85)],
  e:[Jn([[30,63.5],[72,63.5]], Ap(51,63.5,21,21.5,0,-315))],
  f:[Jn(Ap(62,26,12,12,-20,-180), [[50,85]]), Lp(36,44,66,44)],
  g:[Ap(48,63.5,20,21.5,-20,-380), Jn([[68,42],[68,90]], Ap(50,90,18,11,0,170))],
  h:[Lp(30,12,30,85), Jn(Ap(50,62,20,20,180,360), [[70,85]])],
  i:[Lp(50,44,50,85), DOT(50,28)],
  j:[Jn([[56,44],[56,92]], Ap(42,92,14,10,0,170)), DOT(56,28)],
  k:[Lp(30,12,30,85), Lp(66,42,30,70), Lp(42,61,68,85)],
  l:[Lp(50,12,50,85)],
  m:[Lp(20,42,20,85), Jn(Ap(33,57,13,15,180,360), [[46,85]]), Jn(Ap(59,57,13,15,180,360), [[72,85]])],
  n:[Lp(30,42,30,85), Jn(Ap(50,62,20,20,180,360), [[70,85]])],
  o:[Ap(50,63.5,21,21.5,-90,-450)],
  p:[Lp(30,42,30,100), Ap(50,63.5,20,21.5,180,-180)],
  q:[Ap(50,63.5,20,21.5,-20,-380), Lp(70,42,70,100)],
  r:[Lp(34,42,34,85), Ap(52,60,18,17,180,300)],
  s:[Jn(Ap(50,52.5,16,10.5,-30,-270), Ap(50,74,17,11,-90,150))],
  t:[Lp(48,20,48,85), Lp(34,44,64,44)],
  u:[Jn([[30,42],[30,64]], Ap(50,64,20,21,180,0), [[70,42]]), Lp(70,42,70,85)],
  v:[Jn([[28,42],[50,85]], [[72,42]])],
  w:[Jn([[16,42],[32,85]], [[50,54]], [[68,85]], [[84,42]])],
  x:[Lp(30,42,70,85), Lp(70,42,30,85)],
  y:[Lp(28,42,50,85), Lp(72,42,36,100)],
  z:[Jn([[30,42],[70,42]], [[30,85]], [[70,85]])]
};
// evenly spaced points along a stroke
function resample(pts, step){
  const dense=[pts[0]];
  for(let i=1;i<pts.length;i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i], d=Math.hypot(x1-x0,y1-y0), n=Math.max(1,Math.ceil(d/0.5)); for(let k=1;k<=n;k++) dense.push([x0+(x1-x0)*k/n, y0+(y1-y0)*k/n]); }
  const out=[dense[0]]; let acc=0;
  for(let i=1;i<dense.length;i++){ acc+=Math.hypot(dense[i][0]-dense[i-1][0], dense[i][1]-dense[i-1][1]); if(acc>=step){ out.push(dense[i]); acc=0; } }
  const l=dense[dense.length-1], o=out[out.length-1]; if(Math.hypot(l[0]-o[0],l[1]-o[1])>step*0.35) out.push(l);
  return out;
}
const TRACE = {HIT:9, DOT_HIT:11, OFF:15, STROKE_NEED:0.8, ALL_NEED:0.86, MAX_STRAY:0.35, MAX_LEN:2.8};
// drawn length; jumps longer than 8 units are pen lifts between strokes, not ink
const plen = pts => { let L=0; for(let i=1;i<pts.length;i++){ const d=Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); if(d<=8) L+=d; } return L; };
const glyphLen = g => g.reduce((a,st)=>{ if(st.dot) return a; let L=0; for(let i=1;i<st.length;i++) L+=Math.hypot(st[i][0]-st[i-1][0], st[i][1]-st[i-1][1]); return a+L; },0);
// pure check, also used by the self-test: which checkpoints a path covers and how much of it strays off the letter
function traceScore(glyph, path){
  const cps=[]; glyph.forEach((st,si)=>{ (st.dot ? [st.dot] : resample(st, 3)).forEach(p=>cps.push({x:p[0], y:p[1], s:si, dot:!!st.dot, hit:false})); });
  let off=0;
  path.forEach(([x,y])=>{ let near=Infinity; cps.forEach(c=>{ const d=Math.hypot(c.x-x,c.y-y); if(d<near) near=d; if(!c.hit && d<=(c.dot?TRACE.DOT_HIT:TRACE.HIT)) c.hit=true; }); if(near>TRACE.OFF) off++; });
  const per=glyph.map((_,si)=>{ const c=cps.filter(c=>c.s===si); return c.filter(x=>x.hit).length/c.length; });
  const all=cps.filter(c=>c.hit).length/cps.length, stray=path.length?off/path.length:0;
  const tooLong = plen(path) > TRACE.MAX_LEN*glyphLen(glyph)+30;   // scribbling all over the letter
  const ok=per.every((p,si)=>p>=(glyph[si].dot?1:TRACE.STROKE_NEED)) && all>=TRACE.ALL_NEED && stray<=TRACE.MAX_STRAY && !tooLong;
  return {ok, per, all, stray, tooLong};
}
window.TALKIE_TRACE = {GLYPHS, traceScore, resample};

function trace(){
  const body = screen('اكتب الحرف', 'Trace the letter');
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let idx = 0, lower = false; const done = {U:new Set(), l:new Set()};
  body.innerHTML =
    '<p class="k-hint" id="t-hint"></p>'+
    '<div class="t-wrap"><canvas id="t-c"></canvas><div class="t-meter"><i id="t-m"></i></div></div>'+
    '<div class="k-row"><button class="k-btn ghost" id="t-demo">👆 شاهد</button><button class="k-btn ghost" id="t-clear">امسح</button><button class="k-btn ghost" id="t-case">Aa</button><button class="k-btn ghost" id="t-hear">🔊</button><button class="k-btn" id="t-next">التالي ←</button></div>'+
    '<div class="t-strip" id="t-s"></div>';
  const cv = body.querySelector('#t-c'), ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  const COLORS = ['#E53935','#FB8C00','#2E9E4F','#1E63D6','#8E44AD','#EC5FA6'];
  let marks=[], W=0, sc=1, ox=0, oy=0, strokes=[], cps=[], path=[], off=0, drawing=false, last=null, won=false, demoRaf=0, guide=null, inkC=null, col={}, moves=0, inkLen=0, gLen=1;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#999';
  const P = (x,y) => [ox+x*sc, oy+y*sc];
  const M = (px,py) => [(px-ox)/sc, (py-oy)/sc];
  const hint = t => { body.querySelector('#t-hint').textContent = t; };
  const key = () => lower ? LET[idx].toLowerCase() : LET[idx];
  const doneSet = () => lower ? done.l : done.U;
  function mk(){ const c=document.createElement('canvas'); c.width=W*dpr; c.height=W*dpr; c.getContext('2d').setTransform(dpr,0,0,dpr,0,0); return c; }
  function strip(){
    body.querySelector('#t-s').innerHTML = LET.map((L,i)=>'<button data-i="'+i+'" class="'+(i===idx?'on ':'')+(doneSet().has(i)?'done':'')+'">'+(lower?L.toLowerCase():L)+'</button>').join('');
    body.querySelectorAll('#t-s button').forEach(b=>b.onclick=()=>go(+b.dataset.i));
    const on=body.querySelector('#t-s .on'); on && on.scrollIntoView({block:'nearest', inline:'center'});
  }
  function setup(){
    cancelAnimationFrame(demoRaf);
    W = Math.min(body.clientWidth || 340, 360);
    cv.style.width = W+'px'; cv.style.height = W+'px'; cv.width = W*dpr; cv.height = W*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    sc = W*0.86/105; ox = (W-100*sc)/2; oy = (W-105*sc)/2;
    col = {surface:css('--surface'), line:css('--line'), muted:css('--muted'), accent:css('--accent'), aink:css('--accent-ink'), good:css('--good'), ink:COLORS[idx % COLORS.length]};
    const g = GLYPHS[key()];
    strokes = g.map(st => st.dot ? {dot:true, pts:[st.dot]} : {dot:false, pts:resample(st, 1)});
    cps = []; g.forEach((st,si)=>{ (st.dot ? [st.dot] : resample(st, 3)).forEach(p=>cps.push({x:p[0], y:p[1], s:si, dot:!!st.dot, hit:false})); });
    path = []; off = 0; won = false; moves = 0; inkLen = 0; gLen = glyphLen(g);
    guide = mk(); drawGuide(guide.getContext('2d'));
    inkC = mk();
    paint(); meter(0); strip();
    hint('ابدأ من النقطة رقم 1 واتبع السهم');
    body.querySelector('#t-next').classList.remove('glow');
  }
  function polyline(g, pts){ g.beginPath(); pts.forEach((p,i)=>{ const [x,y]=P(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); }
  function drawGuide(g){
    g.fillStyle = col.surface; g.fillRect(0,0,W,W);
    // writing lines like a school notebook: top, middle (dashed), baseline, tail line
    const rule = (y, dash, w, c) => { g.save(); g.strokeStyle=c; g.lineWidth=w; g.setLineDash(dash); const [x0,yy]=P(-4,y), [x1]=P(104,y); g.beginPath(); g.moveTo(x0,yy); g.lineTo(x1,yy); g.stroke(); g.restore(); };
    rule(12, [], 1, col.line); rule(42, [5,6], 1, col.line); rule(85, [], 2, col.muted); rule(100, [2,6], 1, col.line);
    g.lineCap = 'round'; g.lineJoin = 'round';
    // the road to write on
    strokes.forEach(st=>{
      if(st.dot){ const [x,y]=P(...st.pts[0]); g.fillStyle=col.line; g.beginPath(); g.arc(x,y,7*sc,0,7); g.fill(); return; }
      g.strokeStyle = col.line; g.lineWidth = 12*sc; polyline(g, st.pts);
    });
    // dotted centre line
    g.strokeStyle = col.muted; g.lineWidth = Math.max(1.5, 1.1*sc); g.setLineDash([2.2*sc, 2.8*sc]);
    strokes.forEach(st=>{ if(!st.dot) polyline(g, st.pts); }); g.setLineDash([]);
    // direction arrows (the numbered starting points are drawn on top of the ink in paint)
    const placed = []; marks = [];
    strokes.forEach((st,si)=>{
      if(!st.dot && st.pts.length>10){
        const k = Math.min(st.pts.length-4, Math.max(5, Math.round(st.pts.length*0.32)));
        const [ax,ay]=P(...st.pts[k]), [bx,by]=P(...st.pts[k+3]), an=Math.atan2(by-ay,bx-ax), L=4.4*sc;
        g.fillStyle = col.accent; g.beginPath();
        g.moveTo(bx+Math.cos(an)*L*0.7, by+Math.sin(an)*L*0.7);
        g.lineTo(bx-Math.cos(an-0.65)*L, by-Math.sin(an-0.65)*L);
        g.lineTo(bx-Math.cos(an+0.65)*L, by-Math.sin(an+0.65)*L); g.closePath(); g.fill();
      }
      let sp = st.pts[0];
      if(placed.some(q=>Math.hypot(q[0]-sp[0], q[1]-sp[1])<8)) sp = st.pts[Math.min(st.pts.length-1, 9)];   // two strokes start at the same spot
      placed.push(sp); marks.push(sp);
    });
  }
  function drawMarks(g){
    marks.forEach((sp,si)=>{
      const [sx,sy] = P(...sp), doneStroke = won || cps.filter(c=>c.s===si).every(c=>c.hit);
      g.globalAlpha = doneStroke ? 0.35 : 1;
      g.fillStyle = col.accent; g.strokeStyle = col.surface; g.lineWidth = 2; g.beginPath(); g.arc(sx,sy,4.8*sc,0,7); g.fill(); g.stroke();
      g.fillStyle = col.aink; g.font = '800 '+Math.round(5.8*sc)+'px "Baloo Bhaijaan 2", system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
      g.fillText(String(si+1), sx, sy+0.4*sc);
    });
    g.globalAlpha = 1;
  }
  function paint(){
    ctx.clearRect(0,0,W,W);
    ctx.drawImage(guide, 0, 0, W, W);
    ctx.drawImage(inkC, 0, 0, W, W);
    ctx.fillStyle = col.good;
    cps.forEach(c=>{ if(!c.hit) return; const [x,y]=P(c.x,c.y); ctx.beginPath(); ctx.arc(x,y,1.2*sc,0,7); ctx.fill(); });
    drawMarks(ctx);
  }
  function meter(p){ body.querySelector('#t-m').style.width = Math.round(p*100)+'%'; }
  function pos(e){ const r = cv.getBoundingClientRect(); return [ (e.clientX-r.left)*(W/r.width), (e.clientY-r.top)*(W/r.height) ]; }
  function addInk(a, b){
    const g = inkC.getContext('2d'); g.strokeStyle = col.ink; g.lineWidth = 6.5*sc; g.lineCap='round'; g.lineJoin='round';
    g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
    const [x0,y0]=M(...a), [x1,y1]=M(...b), n=Math.max(1, Math.ceil(Math.hypot(x1-x0,y1-y0)/1.5));
    inkLen += Math.hypot(x1-x0, y1-y0);
    for(let k=0;k<=n;k++){
      const x=x0+(x1-x0)*k/n, y=y0+(y1-y0)*k/n; path.push([x,y]);
      let near=Infinity;
      for(const c of cps){ const d=Math.hypot(c.x-x, c.y-y); if(d<near) near=d; if(!c.hit && d<=(c.dot?TRACE.DOT_HIT:TRACE.HIT)) c.hit=true; }
      if(near>TRACE.OFF) off++;
    }
  }
  function state(){
    const per = strokes.map((_,si)=>{ const c=cps.filter(c=>c.s===si); return c.filter(x=>x.hit).length/c.length; });
    return {per, all: cps.filter(c=>c.hit).length/cps.length, stray: path.length ? off/path.length : 0, tooLong: inkLen > TRACE.MAX_LEN*gLen+30};
  }
  function check(final){
    if(won) return;
    const {per, all, stray, tooLong} = state(); meter(all);
    const strokesOk = per.every((p,si)=>p >= (strokes[si].dot ? 1 : TRACE.STROKE_NEED));
    if(strokesOk && all >= TRACE.ALL_NEED){
      if(stray <= TRACE.MAX_STRAY && !tooLong) return win();
      if(final) hint(tooLong ? 'اكتب الحرف بخطوط هادئة بدل التلوين. اضغط «امسح» وحاول' : 'اكتب فوق الخط المنقّط بالضبط. اضغط «امسح» وحاول مرة أخرى');
      return;
    }
    if(!final) return;
    if(stray > 0.5 && path.length > 30) hint('اكتب فوق الخط المنقّط، وابدأ من النقطة رقم 1');
    else { const nx = per.findIndex((p,si)=>p < (strokes[si].dot ? 1 : TRACE.STROKE_NEED)); if(nx>=0) hint(strokes[nx].dot ? 'لا تنسَ النقطة! المسها بإصبعك' : (per[nx]>0.15 ? 'أكمل الخط رقم '+(nx+1) : 'أحسنت! الآن الخط رقم '+(nx+1))); }
  }
  function win(){
    won = true; doneSet().add(idx); const L = LET[idx];
    meter(1); paint();
    window.questEvent && questEvent('trace'); window.TalkieBus && TalkieBus.emit('trace');
    cheer(); addStars(2); setTimeout(()=>say(L+'. '+L+' is for '+WORD_FOR[L]+'.'), 900);
    hint('رائع! كتبت الحرف '+key()+' 🎉');
    strip(); body.querySelector('#t-next').classList.add('glow');
  }
  function demo(){
    cancelAnimationFrame(demoRaf);
    let si=0, pi=0, lastT=0;
    const step = t => {
      if(!lastT) lastT=t;
      pi += Math.max(1, Math.round((t-lastT)/1000*60)); lastT=t;
      if(pi >= strokes[si].pts.length + (strokes[si].dot ? 18 : 6)){ si++; pi=0; if(si>=strokes.length){ paint(); return; } }
      paint();
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=col.accent; ctx.fillStyle=col.accent; ctx.globalAlpha=0.6; ctx.lineWidth=5*sc;
      for(let k=0;k<=si;k++){ const st=strokes[k], end = k<si ? st.pts.length : Math.min(st.pts.length, pi+1);
        if(st.dot){ const [x,y]=P(...st.pts[0]); ctx.beginPath(); ctx.arc(x,y,3.5*sc,0,7); ctx.fill(); continue; }
        polyline(ctx, st.pts.slice(0, Math.max(1,end))); }
      ctx.globalAlpha=1;
      const st=strokes[si], [hx,hy]=P(...st.pts[Math.min(pi, st.pts.length-1)]);
      ctx.font=Math.round(9*sc)+'px system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText('☝️', hx, hy-1.5*sc);
      ctx.restore();
      demoRaf = requestAnimationFrame(step);
    };
    demoRaf = requestAnimationFrame(step);
  }
  cv.addEventListener('pointerdown', e=>{ e.preventDefault(); cancelAnimationFrame(demoRaf); try{ cv.setPointerCapture(e.pointerId); }catch(_){} drawing=true; last=pos(e); addInk(last,last); paint(); });
  cv.addEventListener('pointermove', e=>{ if(!drawing) return; e.preventDefault(); const p=pos(e); addInk(last,p); last=p; paint(); if(++moves % 4 === 0) check(false); });
  const up = ()=>{ if(drawing){ drawing=false; check(true); } };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
  const go = i => { idx = (i+LET.length)%LET.length; setup(); say(LET[idx]); };
  body.querySelector('#t-clear').onclick = ()=>{ won=false; path=[]; off=0; inkLen=0; cps.forEach(c=>c.hit=false); inkC.getContext('2d').clearRect(0,0,W,W); paint(); meter(0); hint('ابدأ من النقطة رقم 1 واتبع السهم'); };
  body.querySelector('#t-case').onclick = ()=>{ lower = !lower; body.querySelector('#t-case').textContent = lower ? 'aA' : 'Aa'; go(idx); };
  body.querySelector('#t-hear').onclick = ()=>say(LET[idx]+'. '+LET[idx]+' is for '+WORD_FOR[LET[idx]]+'.');
  body.querySelector('#t-next').onclick = ()=>go(idx+1);
  body.querySelector('#t-demo').onclick = demo;
  A.setCleanup(()=>cancelAnimationFrame(demoRaf));
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
  const stopRead = ()=>{ reading=false; clearInterval(timer); timer=null; stopSpeaking(true); body.querySelectorAll('.s-w').forEach(w=>w.classList.remove('on')); };
  A.setCleanup(()=>{ stopRead(); try{ stopListening(true); }catch(e){} });
  const norm = w => w.toLowerCase().replace(/[^a-z']/g,'');
  /* the child reads the page aloud; each word lights up green when the phone hears it in order */
  function readMe(){
    if(typeof rec!=='undefined' && rec){ stopListening(); return; }
    if(!canListen()){ $b('#s-hd').textContent='لتفعيل القراءة بصوتك في هذا الجهاز، يضيف ولي الأمر مفتاح Gemini المجاني من الإعدادات.'; return; }
    stopRead();
    const spans=[...body.querySelectorAll('.s-w')], target=spans.map(s=>norm(s.textContent));
    spans.forEach(s=>s.classList.remove('got'));
    let doneHere=false;
    $b('#s-hd').textContent='اقرأ الجملة بصوت عالٍ…';
    listen({btn:$b('#s-me'), continuous:listenMode()==='native', onText:t=>{
      const heard=t.split(/\s+/).map(norm).filter(Boolean); let i=0, j=0; const got=new Array(target.length).fill(false);
      while(i<target.length && j<heard.length){
        if(heard[j]===target[i]){ got[i]=true; i++; j++; }
        else if(i+1<target.length && heard[j]===target[i+1]){ i++; }      // a word the phone missed; keep going
        else j++;
      }
      spans.forEach((s,k)=>s.classList.toggle('got', got[k]));
      const ratio=got.filter(Boolean).length/target.length;
      if(!doneHere && ratio>=0.85){ doneHere=true; stopListening(); cheer(); addStars(1); $b('#s-hd').textContent='قرأتها رائع! 🌟'; }
    }, onEnd:()=>{ if(!doneHere && $b('#s-hd')) $b('#s-hd').textContent = listenMode()==='cloud' ? 'اضغط «اقرأ أنت» وحاول مرة أخرى' : 'اضغط «اقرأ أنت» لتكمل القراءة'; }});
    if(listenMode()==='cloud') $b('#s-hd').textContent='اقرأ الجملة بصوت عالٍ ثم توقف… سأستمع إليك';
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
    const spans = [...body.querySelectorAll('.s-w')];
    speakWords(st.pages[p][1], 0.8, i=>spans.forEach((s,j)=>s.classList.toggle('on', j===i)), ()=>{ reading=false; spans.forEach(s=>s.classList.remove('on')); });
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

TALKIE_PHRASES.push(()=>{
  const out=[];
  STORIES.forEach(st=>{ out.push(st.t);
    st.pages.forEach(([p,en])=>{ out.push(en); en.split(' ').forEach(w=>{ const x=w.replace(/[^A-Za-z']/g,''); if(x) out.push(x); }); });
    st.qs.forEach(([q,opts])=>{ out.push(q); opts.forEach(([e,w])=>out.push(w, 'Not '+w+'. Try again!')); }); });
  MOVES.forEach(([e,en])=>{ const m=en.replace('!',''); out.push('Simon says, '+m, m); });
  out.push('Simon said it! You should move.', 'Simon did not say it! Do not move.');
  OPP.forEach(([a,b])=>{ out.push('What is the opposite of '+a.en+'?', 'What is the opposite of '+b.en+'?', a.en+', '+b.en+'!', b.en+', '+a.en+'!', a.en+' is not the opposite. Try again!', b.en+' is not the opposite. Try again!'); });
  return out;
});
window.KIDS_STORY = {read: readStory, list: STORIES};
window.KIDS_EXTRA = (window.KIDS_EXTRA||[]).concat([{title:'اكتب واقرأ وتحرّك', games:[
  {k:'trace', ar:'اكتب الحرف', en:'Trace letters', icon:'✍️', c:'k3', run:trace},
  {k:'stories', ar:'قصص قصيرة', en:'Stories', icon:'📖', c:'k1', run:stories},
  {k:'simon', ar:'Simon says', en:'اسمع وتحرّك', icon:'🤸', c:'k2', run:simon},
  {k:'opp', ar:'الأضداد', en:'Opposites', icon:'↕️', c:'k5', run:opposites},
]}]);
A.refresh();
})();
