// ---------- Mood Uplift Arcade JS ----------
const App = {
  page: "home", // 'home' | 'hub' | 'moodlog' | 'whack' | 'catch' | 'bubble' | 'quiz'
  mood: null,
  timers: new Set(),
  raf: null,
  high: { whack: 0, catch: 0, bubble: 0, quiz: 0 },
  moodLog: [],
  jokes: [
    "I tried to catch fog yesterday. Mist.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "Parallel lines have so much in common. It’s a shame they’ll never meet.",
    "I would tell you a construction pun, but I’m still working on it.",
    "I’m reading a book about anti-gravity. It’s impossible to put down!",
    "Why don’t scientists trust atoms? Because they make up everything!",
    "What do you call fake spaghetti? An impasta.",
    "I told my computer I needed a break, and now it won’t stop sending me KitKat ads."
  ],
  quotes: [
    "You are stronger than you think.",
    "Small steps count. Keep going.",
    "Storms don’t last forever.",
    "You’ve got this—one minute at a time.",
    "Breathe in, breathe out. Repeat.",
    "Progress, not perfection."
  ],
  posWords: ["happy","joy","great","awesome","love","excited","proud","calm","peace","relaxed","amazing","fantastic","good"],
  negWords: ["sad","angry","stress","stressed","anxious","anxiety","tired","depressed","bad","upset","worried","down","lonely"],
};

// ---------- Persist / Load ----------
function saveState(){
  localStorage.setItem("mua_high", JSON.stringify(App.high));
  localStorage.setItem("mua_moodlog", JSON.stringify(App.moodLog));
}
function loadState(){
  try{
    const h = JSON.parse(localStorage.getItem("mua_high")||"{}");
    App.high = { ...App.high, ...h };
    const m = JSON.parse(localStorage.getItem("mua_moodlog")||"[]");
    App.moodLog = m;
  }catch(e){ console.warn("Load state error", e); }
}

// ---------- Utils ----------
function el(query){ return document.querySelector(query); }
function rnd(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clearTimers(){
  for(const t of App.timers) clearInterval(t);
  App.timers.clear();
  if(App.raf) cancelAnimationFrame(App.raf);
  App.raf = null;
}
function showToast(msg, ms=1800){
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>{ t.remove(); }, ms);
}

// ---------- Router ----------
function render(){
  clearTimers();
  if(App.page === "home") renderHome();
  else if(App.page === "hub") renderHub();
  else if(App.page === "moodlog") renderMoodLog();
  else if(App.page === "whack") renderWhack();
  else if(App.page === "catch") renderCatch();
  else if(App.page === "bubble") renderBubble();
  else if(App.page === "quiz") renderQuiz();
  bindGlobalNav();
}
function bindGlobalNav(){
  document.getElementById("nav-home").onclick = ()=>{ App.page="home"; render(); };
  document.getElementById("nav-hub").onclick = ()=>{ App.page="hub"; render(); };
  document.getElementById("nav-moodlog").onclick = ()=>{ App.page="moodlog"; render(); };
}

// ---------- Mood Analysis ----------
function analyzeMood(text){
  const words = text.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/);
  let score = 0;
  for(const w of words){
    if(App.posWords.includes(w)) score += 1;
    if(App.negWords.includes(w)) score -= 1;
  }
  const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  const entry = { ts: new Date().toISOString(), text: text.slice(0,140), score, label };
  App.mood = entry;
  App.moodLog.unshift(entry);
  if(App.moodLog.length > 100) App.moodLog.pop();
  saveState();
  return entry;
}

// ---------- Views ----------
function renderHome(){
  el("#app").innerHTML = `
    <section class="card">
      <h2>Welcome 👋</h2>
      <p class="label">Write how you feel (or skip to play). We’ll suggest a light activity.</p>
      <textarea id="mood-text" placeholder="Type anything on your mind... (optional)"></textarea>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn primary" id="btn-analyze">Analyze Mood</button>
        <button class="btn" id="btn-skip">Skip → Arcade Hub</button>
      </div>
      <div id="mood-result" style="margin-top:14px;"></div>
    </section>

    <section class="grid col-3" style="margin-top:18px;">
      ${["Whack-a-Stress","Catch the Smile","Bubble Pop"].map((n,i)=>`
        <div class="card game-card">
          <div class="game-title">${n}</div>
          <div class="game-desc">Quick, simple, and fun. Instant mood lift.</div>
          <div class="game-meta"><span class="badge">High: ${Object.values(App.high)[i]}</span><button class="btn" data-g="${["whack","catch","bubble"][i]}">Play</button></div>
        </div>`).join("")}
      <div class="card game-card">
        <div class="game-title">Joke Quiz</div>
        <div class="game-desc">Pick the punchline. Laugh guaranteed 😄</div>
        <div class="game-meta"><span class="badge">High: ${App.high.quiz}</span><button class="btn" data-g="quiz">Play</button></div>
      </div>
      <div class="card">
        <div class="game-title">Quick Chuckle</div>
        <p id="home-chuckle" class="game-desc"></p>
        <button class="btn" id="btn-new-chuckle">Another one</button>
      </div>
    </section>
  `;
  // events
  el("#btn-skip").onclick = ()=>{ App.page="hub"; render(); };
  el("#btn-analyze").onclick = ()=>{
    const tx = el("#mood-text").value.trim();
    if(!tx){ showToast("Type something first (or Skip)."); return; }
    const res = analyzeMood(tx);
    const moodColor = res.label==="positive"?"good":res.label==="negative"?"bad":"warn";
    el("#mood-result").innerHTML = `
      <div class="kpi">
        <span class="badge ${moodColor}">Mood: ${res.label} (${res.score})</span>
        <span class="badge">Suggestion: ${res.label==="negative" ? "Play Whack-a-Stress or Bubble Pop" : res.label==="neutral" ? "Try Joke Quiz" : "Keep the vibes with Catch the Smile"}</span>
      </div>
    `;
  };
  document.querySelectorAll("[data-g]").forEach(b=>{
    b.onclick = ()=>{ App.page = b.getAttribute("data-g"); render(); };
  });
  const chuckle = ()=>{ el("#home-chuckle").textContent = choice(App.jokes); };
  chuckle();
  el("#btn-new-chuckle").onclick = chuckle;
}

function renderHub(){
  el("#app").innerHTML = `
    <section class="card">
      <h2>Arcade Hub</h2>
      <p class="label">Pick anything you like. Your high scores are saved offline.</p>
      <div class="grid col-3" style="margin-top:12px;">
        ${[
          {k:"whack", t:"Whack-a-Stress", d:"Tap the stress gremlins!"},
          {k:"catch", t:"Catch the Smile", d:"Catch 😃 / 😂, avoid 😢!"},
          {k:"bubble", t:"Bubble Pop", d:"Pop all the stress bubbles."},
          {k:"quiz", t:"Joke Quiz", d:"Select the funniest punchline."},
        ].map(g=>`
          <div class="card game-card">
            <div class="game-title">${g.t}</div>
            <div class="game-desc">${g.d}</div>
            <div class="game-meta">
              <span class="badge">High: ${App.high[g.k]}</span>
              <button class="btn" data-g="${g.k}">Play</button>
            </div>
          </div>
        `).join("")}
        <div class="card">
          <div class="game-title">Random Joke</div>
          <p id="hub-joke" class="game-desc"></p>
          <div style="display:flex; gap:8px;">
            <button class="btn" id="btn-next-joke">New joke</button>
            <button class="btn" id="btn-quote">Uplifting quote</button>
          </div>
        </div>
      </div>
    </section>
  `;
  document.querySelectorAll("[data-g]").forEach(b=> b.onclick = ()=>{ App.page=b.getAttribute("data-g"); render(); });
  const setJoke = ()=> el("#hub-joke").textContent = choice(App.jokes);
  setJoke();
  el("#btn-next-joke").onclick = setJoke;
  el("#btn-quote").onclick = ()=> showToast(choice(App.quotes));
}

function renderMoodLog(){
  const rows = App.moodLog.map(m=>`
    <tr>
      <td>${new Date(m.ts).toLocaleString()}</td>
      <td>${m.label} (${m.score})</td>
      <td>${(m.text||"").replace(/</g,"&lt;")}</td>
    </tr>
  `).join("");
  el("#app").innerHTML = `
    <section class="card">
      <h2>Mood Log</h2>
      <p class="label">Stored locally on your device. You can clear it anytime.</p>
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <button class="btn bad" id="btn-clear-log">Clear Log</button>
        <button class="btn" id="btn-clear-scores">Reset High Scores</button>
      </div>
      <div class="card" style="overflow:auto; max-height:420px;">
        <table style="width:100%; border-collapse:collapse;">
          <thead><tr><th style="text-align:left; padding:6px;">Time</th><th style="text-align:left; padding:6px;">Mood</th><th style="text-align:left; padding:6px;">Snippet</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="3" class="label">No entries yet.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
  el("#btn-clear-log").onclick = ()=>{ App.moodLog = []; saveState(); render(); };
  el("#btn-clear-scores").onclick = ()=>{ App.high = {whack:0, catch:0, bubble:0, quiz:0}; saveState(); render(); };
}

// ---------- Game: Whack-a-Stress ----------
function renderWhack(){
  let playing = false, score = 0, time = 30;
  el("#app").innerHTML = `
    <section class="card">
      <h2>Whack-a-Stress</h2>
      <div class="kpi">
        <span class="badge">Time: <b id="whack-time">${time}</b>s</span>
        <span class="badge">Score: <b id="whack-score">0</b></span>
        <span class="badge">High: ${App.high.whack}</span>
      </div>
      <div class="whack-grid">
        ${Array.from({length:9}).map((_,i)=>`<div class="hole" data-i="${i}"></div>`).join("")}
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn primary" id="whack-start">Start</button>
        <button class="btn" id="whack-back">Back</button>
      </div>
      <p class="label">Tip: click/tap the stress gremlins (😤 😖 😵‍💫). Avoid empty clicks—focus!</p>
    </section>
  `;
  el("#whack-back").onclick = ()=>{ App.page="hub"; render(); };

  const holes = [...document.querySelectorAll(".hole")];
  let active = -1;

  function spawn(){
    holes.forEach(h=> h.innerHTML="");
    active = rnd(0,8);
    const m = document.createElement("div");
    m.className = "mole show";
    m.innerHTML = `<span>${choice(["😤","😖","😵‍💫"])}</span>`;
    m.style.left = "0"; m.style.width = "100%";
    m.onclick = (e)=>{ e.stopPropagation(); score++; el("#whack-score").textContent = score; active=-1; m.remove(); };
    holes[active].appendChild(m);
  }
  holes.forEach(h=> h.onclick = ()=>{ /* empty hole click does nothing */ });

  function tick(){
    time--; el("#whack-time").textContent = time;
    if(time<=0){ end(); }
  }
  function end(){
    playing = false; clearTimers();
    el("#whack-start").disabled = false;
    showToast(`Time! You scored ${score}. ${encourage()}`);
    if(score > App.high.whack){ App.high.whack = score; saveState(); }
    setTimeout(()=>{ showToast(`Joke: ${choice(App.jokes)}`, 2600); }, 400);
  }

  el("#whack-start").onclick = ()=>{
    if(playing) return;
    playing = true; score=0; time=30;
    el("#whack-score").textContent = "0";
    el("#whack-time").textContent = time;
    spawn();
    const s = setInterval(spawn, 800); App.timers.add(s);
    const t = setInterval(tick, 1000); App.timers.add(t);
    el("#whack-start").disabled = true;
  };
}

// ---------- Game: Catch the Smile ----------
function renderCatch(){
  let playing=false, score=0, time=40;
  el("#app").innerHTML = `
    <section class="card">
      <h2>Catch the Smile</h2>
      <div class="kpi">
        <span class="badge">Time: <b id="c-time">${time}</b>s</span>
        <span class="badge">Score: <b id="c-score">${score}</b></span>
        <span class="badge">High: ${App.high.catch}</span>
      </div>
      <div class="canvas-wrap">
        <canvas id="c-canvas" width="640" height="360"></canvas>
        <div style="display:flex; gap:10px;">
          <button class="btn primary" id="c-start">Start</button>
          <button class="btn" id="c-back">Back</button>
        </div>
      </div>
      <p class="label">Move your mouse (or finger) to steer the basket. Catch 😃 / 😂, avoid 😢.</p>
    </section>
  `;
  el("#c-back").onclick = ()=>{ App.page="hub"; render(); };

  const cvs = el("#c-canvas"), ctx = cvs.getContext("2d");
  const basket = { x: cvs.width/2, y: cvs.height-24, w: 90, h: 16 };
  let items = [];
  let lastSpawn = 0;

  function reset(){
    score=0; time=40; items=[]; lastSpawn=0;
    el("#c-time").textContent = time;
    el("#c-score").textContent = score;
  }

  function spawnItem(){
    const good = Math.random() < 0.7;
    items.push({
      x: rnd(20, cvs.width-20), y: -20, vy: rnd(2,4),
      type: good ? "good" : "bad",
      char: good ? choice(["😃","😂","😊"]) : choice(["😢","😡","😤"]),
      size: 20
    });
  }

  function step(ts){
    App.raf = requestAnimationFrame(step);
    ctx.clearRect(0,0,cvs.width,cvs.height);
    // basket
    ctx.fillStyle = "#334155";
    roundRect(ctx, basket.x - basket.w/2, basket.y - basket.h/2, basket.w, basket.h, 10);
    ctx.fill();

    // items
    if(!lastSpawn || ts - lastSpawn > 600){ spawnItem(); lastSpawn = ts; }
    for(const it of items){
      it.y += it.vy;
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.fillText(it.char, it.x, it.y);
    }
    // collisions
    for(const it of items){
      if(it.y > basket.y-10 && Math.abs(it.x - basket.x) < basket.w/2){
        if(it.type === "good"){ score++; } else { score = Math.max(0, score-1); }
        it.hit = true;
      }
    }
    items = items.filter(it => !it.hit && it.y < cvs.height+30);
    el("#c-score").textContent = score;
  }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  cvs.addEventListener("mousemove", (e)=>{
    const rect = cvs.getBoundingClientRect();
    basket.x = Math.max(45, Math.min(cvs.width-45, e.clientX - rect.left));
  });
  cvs.addEventListener("touchmove", (e)=>{
    const t = e.touches[0];
    const rect = cvs.getBoundingClientRect();
    basket.x = Math.max(45, Math.min(cvs.width-45, t.clientX - rect.left));
  }, {passive: true});

  function tick(){
    time--; el("#c-time").textContent = time;
    if(time<=0){ end(); }
  }

  function end(){
    playing=false; clearTimers();
    showToast(`Nice! Score ${score}. ${encourage()}`);
    if(score > App.high.catch){ App.high.catch = score; saveState(); }
    setTimeout(()=> showToast(`Quote: ${choice(App.quotes)}`, 2600), 400);
  }

  el("#c-start").onclick = ()=>{
    if(playing) return;
    playing = true; reset();
    const t = setInterval(tick, 1000); App.timers.add(t);
    step(0);
  };
}

// ---------- Game: Bubble Pop ----------
function renderBubble(){
  let playing=false, score=0, time=30;
  el("#app").innerHTML = `
    <section class="card">
      <h2>Bubble Pop</h2>
      <div class="kpi">
        <span class="badge">Time: <b id="b-time">${time}</b>s</span>
        <span class="badge">Score: <b id="b-score">${score}</b></span>
        <span class="badge">High: ${App.high.bubble}</span>
      </div>
      <div class="canvas-wrap">
        <canvas id="b-canvas" width="640" height="360"></canvas>
        <div style="display:flex; gap:10px;">
          <button class="btn primary" id="b-start">Start</button>
          <button class="btn" id="b-back">Back</button>
        </div>
      </div>
      <p class="label">Click bubbles to pop them! Big ones give more points.</p>
    </section>
  `;
  el("#b-back").onclick = ()=>{ App.page="hub"; render(); };
  const cvs = el("#b-canvas"), ctx = cvs.getContext("2d");
  let bubbles = [];
  function reset(){
    score=0; time=30; bubbles=[];
    el("#b-time").textContent=time; el("#b-score").textContent=score;
  }
  function spawn(){
    bubbles.push({
      x: rnd(30, cvs.width-30), y: cvs.height + rnd(10,60),
      r: rnd(12, 34), vy: rnd(1,3) + Math.random(),
      hue: rnd(180,260)
    });
  }
  function drawBubble(b){
    const g = ctx.createRadialGradient(b.x-b.r/3, b.y-b.r/3, 2, b.x, b.y, b.r);
    g.addColorStop(0, `hsla(${b.hue}, 80%, 70%, .9)`);
    g.addColorStop(1, `hsla(${b.hue}, 60%, 30%, .25)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.stroke();
  }
  function step(){
    App.raf = requestAnimationFrame(step);
    ctx.clearRect(0,0,cvs.width,cvs.height);
    if(Math.random() < 0.08) spawn();
    for(const b of bubbles){ b.y -= b.vy; drawBubble(b); }
    bubbles = bubbles.filter(b => b.y + b.r > -10);
  }
  function onClick(e){
    const rect = cvs.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    for(const b of bubbles){
      const dx = b.x - x, dy = b.y - y;
      if(Math.hypot(dx,dy) <= b.r){
        score += Math.max(1, Math.round(b.r/10));
        el("#b-score").textContent = score;
        b.r = 0; b.y = -9999; // remove
        showToast("Pop!");
        break;
      }
    }
  }
  cvs.addEventListener("click", onClick);

  function tick(){
    time--; el("#b-time").textContent=time;
    if(time<=0) end();
  }
  function end(){
    playing=false; clearTimers();
    if(score > App.high.bubble){ App.high.bubble = score; saveState(); }
    showToast(`Poptastic! Score ${score}. ${encourage()}`);
    setTimeout(()=> showToast(`Joke: ${choice(App.jokes)}`, 2600), 400);
  }

  el("#b-start").onclick = ()=>{
    if(playing) return;
    playing=true; reset();
    const t = setInterval(tick,1000); App.timers.add(t);
    step();
  };
}

// ---------- Game: Joke Quiz ----------
const QUIZ = [
  {
    q:"I tried to catch fog yesterday...",
    opts:["But it mist.","But it evaporated on me.","It rained instead.","And now I'm clouded."],
    a:0
  },
  {
    q:"Why did the math book look sad?",
    opts:["Too many problems.","Lost its functions.","Hated division.","Ran out of pages."],
    a:0
  },
  {
    q:"What do you call fake spaghetti?",
    opts:["Impasta","Pasta-lanche","Fauxguine","Pseudo-noodle"],
    a:0
  },
  {
    q:"I told my computer I needed a break...",
    opts:["It sent me KitKat ads.","It crashed.","It went to sleep.","It opened Solitaire."],
    a:0
  },
  {
    q:"Why don’t scientists trust atoms?",
    opts:["They make up everything.","They split too fast.","They bond too often.","Neutrons are moody."],
    a:0
  },
  {
    q:"Parallel lines have so much in common...",
    opts:["It’s a shame they’ll never meet.","They’re always equal.","But angles envy them.","Only in Euclid's dreams."],
    a:0
  }
];
function renderQuiz(){
  let i=0, score=0;
  function view(){
    const curr = QUIZ[i];
    el("#app").innerHTML = `
      <section class="card">
        <h2>Joke Quiz</h2>
        <div class="kpi">
          <span class="badge">Q ${i+1}/${QUIZ.length}</span>
          <span class="badge">Score: <b id="q-score">${score}</b></span>
          <span class="badge">High: ${App.high.quiz}</span>
        </div>
        <div class="card">
          <div class="quiz-q">${curr.q}</div>
          ${curr.opts.map((o,idx)=>`<button class="quiz-opt" data-i="${idx}">${o}</button>`).join("")}
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="btn" id="q-back">Back</button>
        </div>
      </section>
    `;
    el("#q-back").onclick = ()=>{ App.page="hub"; render(); };
    document.querySelectorAll(".quiz-opt").forEach(b=>{
      b.onclick = ()=>{
        const idx = +b.getAttribute("data-i");
        if(idx === curr.a){ b.classList.add("quiz-correct"); score++; showToast("😄 Correct!"); }
        else { b.classList.add("quiz-wrong"); showToast("😅 Not quite!"); }
        el("#q-score").textContent = score;
        setTimeout(()=>{
          i++;
          if(i>=QUIZ.length) finish();
          else view();
        }, 600);
      };
    });
  }
  function finish(){
    showToast(`You scored ${score}/${QUIZ.length}. ${encourage()}`, 2200);
    if(score > App.high.quiz){ App.high.quiz = score; saveState(); }
    setTimeout(()=> showToast(`Quote: ${choice(App.quotes)}`, 2600), 400);
    App.page="hub"; render();
  }
  view();
}

// ---------- Encouragement generator ----------
function encourage(){
  const arr = [
    "Nice job!",
    "Great run!",
    "You're on a roll!",
    "That was fun 😄",
    "You did awesome!",
  ];
  return choice(arr);
}

// ---------- Boot ----------
window.addEventListener("DOMContentLoaded", ()=>{
  loadState();
  render();
});
