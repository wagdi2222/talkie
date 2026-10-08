/* Talkie Kids — simple grammar games: pronouns, am/is/are, a/an, plurals, prepositions, word order.
   Built on window.KidsAPI from kids.js. Offline, no AI. */
(function(){
const A = window.KidsAPI; if(!A) return;
const {screen, cheer, oops, addStars, finish, say, shuffle, pick, rnd, esc} = A;

/* ---------- shared pieces ---------- */
function lesson(title, sub, html, play){
  const body = screen(title, sub);
  body.innerHTML = '<div class="k-lesson-head">تعلّم أولًا · اضغط أي بطاقة لتسمعها</div>'+html+
    '<button class="k-btn big" id="k-play" style="width:100%">هيا نلعب!</button>';
  body.querySelectorAll('[data-say]').forEach(el=>el.onclick=()=>say(el.dataset.say));
  body.querySelector('#k-play').onclick = play;
}
const card = (vis, en, ar, sayText) =>
  '<button class="k-lc" data-say="'+esc(sayText||en)+'"><span class="k-lv">'+vis+'</span><b>'+esc(en)+'</b><span>'+esc(ar)+'</span></button>';

/* Fill-the-gap quiz: q = {vis, sent:'___ is a boy.', ans, opts, hint?, why?} */
function quiz(title, sub, qs, again, rounds=8){
  const body = screen(title, sub);
  const list = shuffle(qs).slice(0, Math.min(rounds, qs.length));
  let r=0, score=0, tries=0, locked=false;
  body.innerHTML = '<div class="k-qcard"><div class="k-qvis" id="k-v"></div><div class="k-qhint" id="k-hn"></div><div class="k-sent" id="k-s"></div></div>'+
    '<div class="k-opts" id="k-o"></div><div class="k-why" id="k-w"></div><div class="k-progress" id="k-pr"></div>';
  const $b = id => body.querySelector(id);
  const prog = () => { $b('#k-pr').innerHTML = list.map((_,k)=>'<i class="'+(k<r?'done':'')+'"></i>').join(''); };
  const full = q => q.sent.replace('___', q.ans);
  const show = () => {
    if(r>=list.length) return finish(body, score, list.length, again);
    const q = list[r]; tries=0; locked=false;
    $b('#k-v').innerHTML = q.vis;
    $b('#k-hn').textContent = q.hint || '';
    const [a,c] = q.sent.split('___');
    $b('#k-s').innerHTML = esc(a)+'<span class="k-blank">?</span>'+esc(c);
    $b('#k-w').textContent = '';
    const opts = shuffle(q.opts);
    $b('#k-o').innerHTML = opts.map((o,k)=>'<button class="k-opt" data-k="'+k+'">'+esc(o)+'</button>').join('');
    $b('#k-o').querySelectorAll('.k-opt').forEach(btn=>btn.onclick=()=>{
      if(locked) return; const o = opts[+btn.dataset.k];
      if(o===q.ans){
        locked=true; btn.classList.add('k-right');
        const bl=$b('.k-blank'); bl.textContent=q.ans; bl.classList.add('filled');
        if(tries===0) score++; addStars(tries===0?1:0); r++; prog();
        cheer(); setTimeout(()=>say(full(q)), 900); setTimeout(show, 3000);
      } else {
        tries++; oops(btn); btn.disabled=true;
        $b('#k-w').textContent = q.why || 'جرّب مرة أخرى';
      }
    });
    prog();
  };
  show();
}

/* ---------- 1. pronouns ---------- */
const PRON = [
  ['👦','___ is a boy.','He'],['👧','___ is a girl.','She'],['🐶','___ is a dog.','It'],['👧👦','___ are friends.','They'],
  ['👨','___ is my father.','He'],['👩','___ is my mother.','She'],['🐱','___ is small.','It'],['⚽','___ is a ball.','It'],
  ['👴','___ is my grandpa.','He'],['👵','___ is my grandma.','She'],['🐘🐘','___ are big.','They'],['🌳','___ is tall.','It'],
  ['🙋','___ am happy.','I','أتكلم عن نفسي'],['👉🧒','___ are my friend.','You','أكلّم صديقي'],['🙋👦','___ are brothers.','We','أنا وأخي'],
  ['🙋👧','___ are at school.','We','أنا وأختي'],['👉👧','___ are kind.','You','أكلّم صديقتي']];
const PRON_WHY = 'He للولد، She للبنت، It للحيوان أو الشيء، They للجمع، I أنا، You أنت، We نحن';
function pronouns(){
  lesson('الضمائر','I · you · he · she · it · we · they',
    '<div class="k-lgrid">'+
      card('🙋','I','أنا')+card('👉','you','أنت / أنتِ')+card('👦','he','هو (للولد)')+card('👧','she','هي (للبنت)')+
      card('🐶','it','للحيوان والأشياء')+card('🙋👦','we','نحن')+card('👧👦','they','هم')+
    '</div>', play);
  function play(){
    const qs = PRON.map(([v,sent,ans,hint])=>({vis:'<span class="k-big2">'+v+'</span>', sent, ans, hint,
      opts: ['I','You','We'].includes(ans) ? ['I','You','We','They'] : ['He','She','It','They'], why: PRON_WHY}));
    quiz('الضمائر','اختر الضمير المناسب', qs, play);
  }
}

/* ---------- 2. am / is / are ---------- */
const BE = [
  ['🙋','I ___ happy.','am'],['👦','He ___ tall.','is'],['👧','She ___ my sister.','is'],['👧👦','They ___ friends.','are'],
  ['👉','You ___ smart.','are'],['🐱','It ___ a cat.','is'],['🙋👦','We ___ brothers.','are'],['🐱🐱','The cats ___ cute.','are'],
  ['🍎','The apple ___ red.','is'],['☀️','The sun ___ hot.','is'],['🙋','I ___ seven.','am'],['🐶🐶','The dogs ___ funny.','are']];
function beVerb(){
  lesson('am · is · are','فعل يكون',
    '<div class="k-rules">'+
      '<button class="k-rule k1" data-say="I am"><b>I</b><span>→</span><b>am</b></button>'+
      '<button class="k-rule k2" data-say="He is. She is. It is."><b>He · She · It</b><span>→</span><b>is</b></button>'+
      '<button class="k-rule k3" data-say="You are. We are. They are."><b>You · We · They</b><span>→</span><b>are</b></button>'+
    '</div><p class="k-hint">مثال: <span dir="ltr">I am happy · She is tall · We are friends</span></p>', play);
  function play(){
    const qs = BE.map(([v,sent,ans])=>({vis:'<span class="k-big2">'+v+'</span>', sent, ans, opts:['am','is','are'],
      why:'I ← am ، He / She / It ← is ، You / We / They ← are'}));
    quiz('am · is · are','اختر الكلمة الصحيحة', qs, play);
  }
}

/* ---------- 3. a / an ---------- */
const ART = [['🍎','apple'],['🥚','egg'],['🍊','orange'],['🐘','elephant'],['🍦','ice cream'],['☂️','umbrella'],['🦉','owl'],['🐜','ant'],
  ['🐱','cat'],['🐶','dog'],['⚽','ball'],['🍌','banana'],['🚗','car'],['📚','book'],['🐟','fish'],['🏠','house'],['🐝','bee'],['🦁','lion']];
function aAn(){
  lesson('a أو an','أداة النكرة',
    '<div class="k-rules">'+
      '<button class="k-rule k3" data-say="an apple. an egg. an orange."><b>an</b><span>+</span><b dir="ltr">a e i o u</b></button>'+
      '<button class="k-rule k4" data-say="a cat. a dog. a ball."><b>a</b><span>+</span><b>باقي الحروف</b></button>'+
    '</div><div class="k-lgrid">'+card('🍎','an apple','تفاحة')+card('🥚','an egg','بيضة')+card('🐱','a cat','قطة')+card('⚽','a ball','كرة')+'</div>', play);
  function play(){
    const qs = ART.map(([v,w])=>({vis:'<span class="k-big2">'+v+'</span>', sent:'This is ___ '+w+'.', ans:/^[aeiou]/.test(w)?'an':'a', opts:['a','an'],
      why:'نستخدم an قبل الكلمة التي تبدأ بصوت a أو e أو i أو o أو u'}));
    quiz('a أو an','اختر a أو an', qs, play);
  }
}

/* ---------- 4. plurals ---------- */
const PLU = [['🐱','cat','cats','cat'],['🐶','dog','dogs','dog'],['🍎','apple','apples','apple'],['🚗','car','cars','car'],['📚','book','books','book'],
  ['⚽','ball','balls','ball'],['📦','box','boxes','boxs'],['🚌','bus','buses','buss'],['🦊','fox','foxes','foxs'],['🧒','child','children','childs'],
  ['🐭','mouse','mice','mouses'],['🦶','foot','feet','foots'],['🦷','tooth','teeth','tooths'],['👨','man','men','mans'],['🐦','bird','birds','bird']];
function plurals(){
  lesson('المفرد والجمع','one → two',
    '<div class="k-lgrid">'+
      card('🐱 → 🐱🐱','cats','نضيف s','one cat, two cats')+card('📦 → 📦📦','boxes','بعد x و s و ch نضيف es','one box, two boxes')+
      card('🧒 → 🧒🧒','children','كلمات تتغير','one child, two children')+card('🦶 → 🦶🦶','feet','كلمات تتغير','one foot, two feet')+
    '</div>', play);
  function play(){
    const qs = PLU.map(([v,one,two,bad])=>({vis:'<span class="k-plu"><span>'+v+'</span><i>→</i><span>'+v+v+'</span></span>',
      sent:'One '+one+', two ___.', ans:two, opts:[...new Set([one,two,bad])],
      why: /es$/.test(two) ? 'بعد x أو s أو ch نضيف es' : two.endsWith('s') ? 'للجمع نضيف s في آخر الكلمة' : 'هذه كلمة تتغير في الجمع: '+one+' ← '+two}));
    quiz('المفرد والجمع','اختر كلمة الجمع', qs, play);
  }
}

/* ---------- 5. prepositions ---------- */
const OBJ = [['⚽','ball'],['🐱','cat'],['🧸','teddy bear'],['🐶','dog']];
const POS = [['in','داخل'],['on','فوق'],['under','تحت'],['next to','بجانب']];
const scene = (o,p) => '<div class="k-scene"><span class="k-box">📦</span><span class="k-obj k-'+p.replace(' ','')+'">'+o+'</span></div>';
function prepositions(){
  lesson('أين الكرة؟','in · on · under · next to',
    '<div class="k-lgrid">'+POS.map(([p,ar])=>card(scene('⚽',p), p, ar, 'The ball is '+p+' the box.')).join('')+'</div>', play);
  function play(){
    const qs=[]; OBJ.forEach(([o,w])=>POS.forEach(([p,ar])=>qs.push({vis:scene(o,p), sent:'The '+w+' is ___ the box.', ans:p, opts:POS.map(x=>x[0]),
      why:'in داخل ، on فوق ، under تحت ، next to بجانب'})));
    quiz('أين الكرة؟','اختر المكان الصحيح', qs, play);
  }
}

/* ---------- 6. word order ---------- */
const SENT = [['🍎','I like apples.'],['🐱','The cat is small.'],['⚽','She has a red ball.'],['🏫','We go to school.'],['🏃','He can run fast.'],
  ['📚','This is my book.'],['❤️','I love my mom.'],['🐦','The bird can fly.'],['☀️','The sun is hot.'],['🦁','The lion is big.'],['🍦','I want ice cream.'],['🌙','Good night, Dad.']];
function wordOrder(){
  lesson('رتّب الجملة','Word order',
    '<div class="k-rules"><button class="k-rule k5" data-say="I like apples."><b>I</b><span>+</span><b>like</b><span>+</span><b>apples</b></button></div>'+
    '<p class="k-hint">الجملة الإنجليزية تبدأ عادة بـ: <b>من؟</b> ثم <b>ماذا يفعل؟</b> ثم <b>ماذا؟</b><br>اضغط الكلمات بالترتيب الصحيح.</p>', play);
  function play(){
    const body = screen('رتّب الجملة','اضغط الكلمات بالترتيب');
    const list = shuffle(SENT).slice(0,6); let r=0, score=0, tries=0;
    body.innerHTML='<div class="k-qcard"><div class="k-qvis" id="k-v"></div><div class="k-line" id="k-l"></div></div><div class="k-pool" id="k-p"></div>'+
      '<div class="k-row"><button class="k-btn ghost" id="k-hear">🔊 اسمع الجملة</button></div><div class="k-why" id="k-w"></div><div class="k-progress" id="k-pr"></div>';
    const $b=id=>body.querySelector(id);
    let words=[], placed=[];
    const prog=()=>{ $b('#k-pr').innerHTML=list.map((_,k)=>'<i class="'+(k<r?'done':'')+'"></i>').join(''); };
    const paint=()=>{
      $b('#k-l').innerHTML = placed.length ? placed.map((w,k)=>'<button class="k-chip in" data-k="'+k+'">'+esc(words[w])+'</button>').join('') : '<span class="k-ph">اضغط الكلمات هنا…</span>';
      $b('#k-p').innerHTML = words.map((w,k)=> placed.includes(k) ? '' : '<button class="k-chip" data-w="'+k+'">'+esc(w)+'</button>').join('');
      $b('#k-l').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ placed.splice(+b.dataset.k,1); paint(); });
      $b('#k-p').querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ placed.push(+b.dataset.w); say(words[+b.dataset.w]); paint(); check(); });
    };
    const target=()=>list[r][1].replace(/[.,]/g,'');
    const check=()=>{
      if(placed.length!==words.length) return;
      const got=placed.map(k=>words[k]).join(' ');
      if(got===target()){ if(tries===0) score++; addStars(tries===0?2:1); r++; prog(); cheer(); setTimeout(()=>say(list[r-1][1]),900); setTimeout(show,3200); }
      else { tries++; oops($b('#k-l')); $b('#k-w').textContent='قريب! جرّب ترتيبًا آخر. ابدأ بـ «من؟»'; setTimeout(()=>{ placed=[]; paint(); },900); }
    };
    const show=()=>{
      if(r>=list.length) return finish(body, score, list.length, play);
      tries=0; placed=[]; words=shuffle(target().split(' '));
      if(words.join(' ')===target() && words.length>1) words.reverse();
      $b('#k-v').innerHTML='<span class="k-big2">'+list[r][0]+'</span>'; $b('#k-w').textContent=''; prog(); paint();
    };
    $b('#k-hear').onclick=()=>say(list[r]?list[r][1]:'');
    show();
  }
}

window.KIDS_EXTRA = (window.KIDS_EXTRA||[]).concat([{title:'القواعد', games:[
  {k:'pron', ar:'الضمائر', en:'he · she · it', icon:'👫', c:'k2', run:pronouns},
  {k:'be', ar:'am · is · are', en:'to be', icon:'✨', c:'k4', run:beVerb},
  {k:'art', ar:'a أو an', en:'a / an', icon:'🍎', c:'k1', run:aAn},
  {k:'plu', ar:'المفرد والجمع', en:'one · two', icon:'🐱', c:'k3', run:plurals},
  {k:'prep', ar:'أين الكرة؟', en:'in · on · under', icon:'📦', c:'k6', run:prepositions},
  {k:'order', ar:'رتّب الجملة', en:'Word order', icon:'🧩', c:'k5', run:wordOrder},
]}]);
A.refresh();
})();
