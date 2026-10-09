/* Talkie — Shadowing: hear a natural phrase, repeat it right after the speaker, climb from slow to natural speed.
   Uses globals from index.html: $, $$, esc, S, words, shuffle, listen, stopListening, rec, award, toast. */
(function(){
const LINES = {
  beg:['Nice to meet you.','How are you today?',"I'm fine, thank you.","What's your name?",'I live in Riyadh.','I like tea with milk.','See you tomorrow.','Can you help me, please?','What time is it?','Have a nice day!'],
  mid:["I'm sorry, I didn't catch that.",'Could you say that again, please?',"I'm looking forward to it.",'That sounds like a great idea.','Let me think about it for a second.',"I've been really busy this week.",'What do you do for a living?','It depends on the weather.',"I'll get back to you tomorrow.",'Do you mind if I open the window?'],
  adv:["That's a fair point, but I see it a little differently.","To be honest, I hadn't thought about it that way.",'Let me walk you through the main findings.','As you can see on this slide, the trend is quite clear.',"I'd like to build on what you just said.","The short answer is yes, but there's a catch.",'We should take that into account before we decide.','In a nutshell, it saves time and money.','If I remember correctly, the deadline is next Friday.',"I couldn't agree more."]
};
const SPEEDS = [[0.7,'🐢','بطيء'],[0.85,'🚶','متوسط'],[1.0,'🏃','طبيعي']];
let Sh = {list:[], i:0, stage:0, mode:'echo', hide:false, level:null, busy:false, tries:0};

function voiceFor(){ const vs=(speechSynthesis.getVoices()||[]).filter(v=>/^en/i.test(v.lang)); return vs.find(v=>v.voiceURI===S.voice) || vs[0] || null; }
/* speak and light up each word in time; boundary events where available, otherwise a timed estimate */
function speakLit(text, rate, spans, done){
  try{ speechSynthesis.cancel(); }catch(e){}
  stopListening(true);
  const starts=[]; let pos=0; text.split(' ').forEach(w=>{ starts.push(pos); pos+=w.length+1; });
  let gotB=false, k=0, timer=null, finished=false;
  const mark=i=>spans.forEach((s,j)=>s.classList.toggle('on', j===i));
  const fin=()=>{ if(finished) return; finished=true; clearInterval(timer); mark(-1); done&&done(); };
  try{
    const u=new SpeechSynthesisUtterance(text); const v=voiceFor(); if(v){ u.voice=v; u.lang=v.lang; } else u.lang='en-US';
    u.rate=rate;
    u.onboundary=e=>{ if(e.name && e.name!=='word') return; gotB=true; clearInterval(timer); let i=0; while(i+1<starts.length && starts[i+1]<=e.charIndex) i++; mark(i); };
    u.onstart=()=>{ const step=Math.max(220, 380/rate); timer=setInterval(()=>{ if(gotB){ clearInterval(timer); return; } mark(k++); if(k>spans.length) clearInterval(timer); }, step); };
    u.onend=fin; u.onerror=fin;
    setTimeout(()=>{ try{ speechSynthesis.speak(u); }catch(e){ fin(); } }, 60);
    setTimeout(()=>{ if(!finished && !speechSynthesis.speaking) fin(); }, 4000 + text.length*120/rate);  // safety net if the phone never reports the end
  }catch(e){ fin(); }
}
function score(heard, target){
  const t=words(target), h=words(heard), n=t.length, m=h.length;
  const L=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) L[i][j]= t[i]===h[j] ? L[i+1][j+1]+1 : Math.max(L[i+1][j],L[i][j+1]);
  const hit=new Array(n).fill(false); let i=0,j=0;
  while(i<n&&j<m){ if(t[i]===h[j]){ hit[i]=true; i++; j++; } else if(L[i+1][j]>=L[i][j+1]) i++; else j++; }
  return {pct: n? hit.filter(Boolean).length/n : 0, hit};
}

function render(){
  if(!Sh.list.length || Sh.level!==S.level){ Sh.list=shuffle(LINES[S.level]); Sh.i=0; Sh.stage=0; Sh.level=S.level; }
  const v=$('#v-shadow'), line=Sh.list[Sh.i];
  v.innerHTML='<div class="p-top"><button class="p-back" data-back>→ التمارين</button><b>تمرين الظل</b></div>'+
    '<div class="seg sh-mode"><button data-m="echo" aria-pressed="'+(Sh.mode==='echo')+'">ردّد بعده</button><button data-m="along" aria-pressed="'+(Sh.mode==='along')+'">معه في نفس اللحظة</button><button data-m="hide" aria-pressed="'+Sh.hide+'">أخفِ النص</button></div>'+
    '<div class="card sh-card"><div class="sh-speeds">'+SPEEDS.map(([r,ic,ar],k)=>'<span class="'+(k<Sh.stage?'done':k===Sh.stage?'on':'')+'">'+ic+' '+ar+'</span>').join('')+'</div>'+
      '<div class="sh-line'+(Sh.hide?' hidden-text':'')+'" id="sh-line">'+line.split(' ').map(w=>'<span class="s-w">'+esc(w)+'</span>').join(' ')+'</div>'+
      '<div class="heard" id="sh-heard"></div>'+
      '<div class="score" id="sh-score" hidden><div class="big" id="sh-pct"></div><div class="meter"><i id="sh-bar"></i></div></div>'+
      '<div class="talkbar"><button class="btn" id="sh-play">▶ ابدأ</button>'+(Sh.mode==='echo'?'<button class="mic sm" id="sh-mic" aria-label="ردّد"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>':'')+'<button class="btn ghost" id="sh-next">جملة أخرى</button></div>'+
      '<div class="hint" id="sh-msg">'+(Sh.mode==='echo'?'اسمع الجملة، ثم ردّدها مباشرة بنفس النغمة والسرعة. عندما تنجح ترتفع السرعة.':'شغّل الجملة وتكلم معها في نفس اللحظة، كأنك ظلّ المتحدث. ستتكرر ثلاث مرات.')+'</div></div>'+
    '<p class="hint">'+(Sh.i+1)+' / '+Sh.list.length+' · المستوى يتبع اختيارك في المحادثة</p>';
  v.querySelectorAll('.sh-mode [data-m]').forEach(b=>b.onclick=()=>{ const m=b.dataset.m; if(m==='hide') Sh.hide=!Sh.hide; else Sh.mode=m; Sh.stage=0; stopAll(); render(); });
  v.querySelector('#sh-play').onclick=()=> Sh.mode==='echo' ? playThenRepeat() : along();
  v.querySelector('#sh-next').onclick=()=>{ stopAll(); Sh.i=(Sh.i+1)%Sh.list.length; Sh.stage=0; Sh.tries=0; render(); };
  const mic=v.querySelector('#sh-mic'); if(mic) mic.onclick=()=>{ if(rec){ stopListening(); return; } repeat(true); };
}
function spans(){ return [...document.querySelectorAll('#sh-line .s-w')]; }
function stopAll(){ Sh.busy=false; try{ speechSynthesis.cancel(); }catch(e){} stopListening(true); }
function playThenRepeat(){
  if(Sh.busy) return; Sh.busy=true;
  const line=Sh.list[Sh.i]; $('#sh-msg').textContent='اسمع…'; $('#sh-heard').textContent='';
  speakLit(line, SPEEDS[Sh.stage][0], spans(), ()=>{ if(!Sh.busy) return; repeat(false); });
}
function repeat(byTap){
  const line=Sh.list[Sh.i];
  $('#sh-msg').textContent='ردّد الآن!';
  listen({btn:$('#sh-mic'), quiet:!byTap, onText:t=>{ const h=$('#sh-heard'); if(h) h.textContent=t; }, onEnd:(t, err)=>{
    Sh.busy=false;
    if(!$('#sh-line')) return;
    if(!t){ $('#sh-msg').textContent = err==='not-allowed' ? 'اضغط الميكروفون وردّد الجملة' : 'لم أسمعك. اضغط الميكروفون وردّد الجملة.'; return; }
    const {pct, hit}=score(t, line);
    spans().forEach((s,k)=>{ s.classList.toggle('ok', hit[k]); s.classList.toggle('no', !hit[k]); });
    $('#sh-score').hidden=false; $('#sh-pct').textContent=Math.round(pct*100)+'%'; $('#sh-bar').style.width=Math.round(pct*100)+'%';
    if(pct>=0.8){
      award(2+Sh.stage*2, SPEEDS[Sh.stage][1]); window.questEvent && questEvent('shadow');
      if(Sh.stage<SPEEDS.length-1){ Sh.stage++; $('#sh-msg').textContent='ممتاز! الآن أسرع قليلًا…'; setTimeout(()=>{ if($('#sh-line')){ render(); playThenRepeat(); } }, 1400); }
      else { $('#sh-msg').textContent='أتقنت هذه الجملة بالسرعة الطبيعية! 🎉'; award(5,'Shadowing'); setTimeout(()=>{ if($('#sh-line')){ Sh.i=(Sh.i+1)%Sh.list.length; Sh.stage=0; render(); } }, 1800); }
    } else {
      Sh.tries++;
      $('#sh-msg').textContent='قريب! ركّز على الكلمات الحمراء ثم اضغط ▶ لتسمعها مرة أخرى.';
    }
  }});
}
function along(){
  if(Sh.busy) return; Sh.busy=true;
  const line=Sh.list[Sh.i]; let n=0;
  const go=()=>{ if(!Sh.busy || !$('#sh-line')) return;
    if(n>=3){ Sh.busy=false; $('#sh-msg').textContent='أحسنت! جرّب الآن «ردّد بعده» لتحصل على تقييم.'; award(3,'Shadowing'); window.questEvent && questEvent('shadow'); return; }
    $('#sh-msg').textContent='المرة '+(n+1)+' من 3 · تكلم معه'; const r=[0.75,0.9,1][n]; n++;
    speakLit(line, r, spans(), ()=>setTimeout(go, 700)); };
  go();
}

window.EXTRA_PRACTICE=(window.EXTRA_PRACTICE||[]).concat([{k:'shadow', t:'تمرين الظل', sub:'ردّد خلف المتحدث من البطء إلى السرعة الطبيعية', ic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12c3-6 6-6 9 0s6 6 9 0"/><path d="M3 17c3-6 6-6 9 0s6 6 9 0" opacity=".45"/></svg>'}]);
const prev=window.onShow;
window.onShow=v=>{ if(v==='shadow') render(); else if(Sh.busy) stopAll(); prev && prev(v); };
if(!$('#v-shadow').hidden) render();
})();
