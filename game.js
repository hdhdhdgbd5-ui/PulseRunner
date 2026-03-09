const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const meterFill = document.getElementById('meterFill');
const startBtn = document.getElementById('startBtn');

let w, h, running=false;
let t=0, last=0;
let bpm=96;
let pulse=0;
let score=0, streak=1, energy=1;

// Monetization + Persistence
let coins=0, dailyBonusClaimed=false, lastLogin=null;
const STORAGE_KEY='pulseRunner_save';
function loadSave(){try{const s=localStorage.getItem(STORAGE_KEY);if(s){const d=JSON.parse(s);coins=d.coins||0;dailyBonusClaimed=d.dailyBonusClaimed||false;lastLogin=d.lastLogin||null;}}catch(e){}}
function saveGame(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({coins,dailyBonusClaimed,lastLogin}));}catch(e){}}
function checkDailyBonus(){const today=new Date().toDateString();if(lastLogin!==today){dailyBonusClaimed=false;}if(!dailyBonusClaimed){coins+=50;dailyBonusClaimed=true;lastLogin=today;saveGame();showDailyBonus();}}
function showDailyBonus(){alert('Daily Bonus: +50 coins! Total: '+coins);}
function showRewardedAd(){const reward=100;coins+=reward;saveGame();alert('Rewarded Ad: +'+reward+' coins! Total: '+coins);}
function showInterstitial(){console.log('Interstitial ad triggered');}

function resize(){
  const dpr = devicePixelRatio || 1;
  w = canvas.width = innerWidth * dpr;
  h = canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth+'px';
  canvas.style.height = innerHeight+'px';
  ctx.scale(dpr, dpr);
}
addEventListener('resize', resize);
resize();

function reset(){
  t=0; last=performance.now();
  score=0; streak=1; energy=1;
  bpm=96; pulse=0;
  updateUI();
}

function updateUI(){
  scoreEl.textContent = score;
  streakEl.textContent = 'x'+streak;
  meterFill.style.width = Math.max(0, Math.min(1, energy)) * 100 + '%';
}

function loop(now){
  if(!running) return;
  const dt = (now-last)/1000; last=now; t+=dt;
  const beat = (bpm/60);
  const phase = (t*beat) % 1;
  pulse = Math.sin(phase*Math.PI*2)*0.5+0.5;
  energy -= dt*0.08; // decay
  energy = Math.max(0, energy);

  if(energy<=0){ running=false; startBtn.style.display='inline-block'; }

  draw();
  updateUI();
  requestAnimationFrame(loop);
}

function draw(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const cx = innerWidth/2, cy = innerHeight/2;
  const r = 40 + pulse*40;
  ctx.fillStyle = 'rgba(78,240,255,'+(0.2+pulse*0.8)+')';
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

  // runner bar
  const barW = innerWidth*0.8, barH=14;
  const x = (innerWidth-barW)/2, y = innerHeight*0.7;
  ctx.fillStyle='#1e2636'; ctx.fillRect(x,y,barW,barH);
  ctx.fillStyle='#7cff7c'; ctx.fillRect(x,y,barW*energy,barH);

  // text hint
  ctx.fillStyle='#cfe3ff'; ctx.font='16px system-ui';
  ctx.fillText('Tap on the pulse', cx-60, cy+80);
}

function onTap(){
  if(!running) return;
  const phase = (t*(bpm/60)) % 1;
  const dist = Math.min(Math.abs(phase-0.0), Math.abs(phase-1.0));
  if(dist < 0.08){
    streak = Math.min(10, streak+1);
    score += 10*streak;
    energy = Math.min(1, energy + 0.18);
    bpm = Math.min(140, bpm + 0.3);
  } else {
    streak = 1;
    energy = Math.max(0, energy - 0.12);
  }
  updateUI();
}

function gameOver(){
  running=false;
  const coinReward=Math.floor(score/10);
  coins+=coinReward;
  saveGame();
  startBtn.style.display='inline-block';
  setTimeout(()=>{showInterstitial();},500);
}

startBtn.addEventListener('click', ()=>{
  startBtn.style.display='none';
  running=true; reset(); loadSave(); checkDailyBonus(); requestAnimationFrame(loop);
});
addEventListener('touchstart', (e)=>{ e.preventDefault(); onTap(); }, {passive:false});
addEventListener('mousedown', ()=>onTap());
