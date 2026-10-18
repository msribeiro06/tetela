// =========================================================
//  GALAXY HEART 3D — script.js
//  Fluxo: intro → coração 3D girando → tela de mensagem
// =========================================================

// ── CANVAS PRINCIPAL (coração) ──
const canvas = document.getElementById('galaxy');
const ctx    = canvas.getContext('2d');

// ── CANVAS DE FUNDO DA MENSAGEM ──
const canvas2 = document.getElementById('galaxy2');
const ctx2    = canvas2.getContext('2d');

let W, H, cx, cy;
let stars = [], stars2 = [], particles = [], heartPts3d = [];
let phase = 'idle';
let heartDone = false;

const isMobile = () => window.innerWidth <= 768 || ('ontouchstart' in window);

// ── 3D rotation state ──
let rotY = 0, rotX = 0.18;
let targetRotY = 0, targetRotX = 0.18;
let autoSpin = true;
let drag = false, lastMX = 0, lastMY = 0;

// ── RESIZE ──
function resize() {
  W = canvas.width  = canvas2.width  = window.innerWidth;
  H = canvas.height = canvas2.height = window.innerHeight;
  cx = W / 2; cy = H / 2;
}
window.addEventListener('resize', () => {
  resize(); buildStars();
  if (phase !== 'idle') buildHeartPoints();
});

// ── ESTRELAS ──
function buildStars() {
  stars = []; stars2 = [];
  const density = isMobile() ? 5500 : 3200;
  const n = Math.floor(W * H / density);
  for (let i = 0; i < n; i++) {
    const s = {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.3 + .2,
      alpha: Math.random(),
      speed: Math.random() * .004 + .001,
      phase: Math.random() * Math.PI * 2,
    };
    stars.push({...s});
    stars2.push({...s, x: Math.random()*W, y: Math.random()*H});
  }
}

function drawStars(c, arr, t) {
  for (const s of arr) {
    const a = .35 + .65 * Math.abs(Math.sin(s.phase + t * s.speed));
    c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    c.fillStyle = `rgba(255,255,255,${a})`; c.fill();
  }
}

function drawNebula(c, t) {
  const blobs = [
    { dx: Math.sin(t*.00025)*70, dy: Math.cos(t*.00018)*50, col: [80,30,160] },
    { dx: Math.cos(t*.00032)*90, dy: Math.sin(t*.00022)*65, col: [160,30,100] },
  ];
  for (const b of blobs) {
    const g = c.createRadialGradient(cx+b.dx, cy+b.dy, 0, cx+b.dx, cy+b.dy, Math.min(W,H)*.55);
    g.addColorStop(0, `rgba(${b.col},.10)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
}

// ── CORAÇÃO 3D ──
function heartXYZ(angle, sc) {
  const x =  sc * 16 * Math.pow(Math.sin(angle), 3);
  const y = -sc * (13*Math.cos(angle) - 5*Math.cos(2*angle) - 2*Math.cos(3*angle) - Math.cos(4*angle));
  const z =  sc * 4.5 * Math.sin(angle) * Math.max(0, Math.sin(angle / 2));
  return { x, y, z };
}

function project(x3, y3, z3) {
  const fov = Math.min(W, H) * 1.6;
  const s = fov / (fov + z3);
  return { px: cx + x3 * s, py: cy + y3 * s, scale: s };
}

function rotate3d(x, y, z, ry, rx) {
  const x1 =  x * Math.cos(ry) + z * Math.sin(ry);
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  const y2 =  y * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 =  y * Math.sin(rx) + z1 * Math.cos(rx);
  return { x: x1, y: y2, z: z2 };
}

function buildHeartPoints() {
  heartPts3d = [];
  const sc = Math.min(W, H) * (isMobile() ? .023 : .027);
  const total = isMobile() ? 500 : 700;
  for (let i = 0; i < total; i++) {
    const angle = (i / total) * Math.PI * 2;
    const { x, y, z } = heartXYZ(angle, sc);
    const j = (Math.random() - .5) * sc * .28;
    heartPts3d.push({
      ox: x + (Math.random()-.5)*j,
      oy: y + (Math.random()-.5)*j,
      oz: z + (Math.random()-.5)*j*.5,
    });
  }
}

// ── PARTÍCULAS ──
const palette = [[255,160,200],[220,130,255],[255,200,220],[200,100,255],[255,120,180],[255,255,255],[180,140,255]];

function buildParticles() {
  particles = heartPts3d.map(hp => {
    const a = Math.random() * Math.PI * 2;
    const d = Math.min(W, H) * (.32 + Math.random() * .28);
    return {
      tx: hp.ox, ty: hp.oy, tz: hp.oz,
      x: Math.cos(a)*d, y: (Math.random()-.5)*d*1.2, z: (Math.random()-.5)*d*.6,
      vx: (Math.random()-.5)*.5, vy: (Math.random()-.5)*.5, vz: (Math.random()-.5)*.3,
      alpha: 0,
      size: Math.random() * 1.9 + .7,
      color: palette[Math.floor(Math.random() * palette.length)],
      speed: Math.random() * .013 + .007,
      delay: Math.floor(Math.random() * 130 + 10),
      age: 0,
    };
  });
}

function updateParticles() {
  let all = true;
  const now = Date.now();
  for (const p of particles) {
    p.age++;
    if (p.age < p.delay) { all = false; continue; }
    const dx = p.tx-p.x, dy = p.ty-p.y, dz = p.tz-p.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (dist > 1.2) {
      const f = Math.min(dist*.011, .75) * p.speed * 60;
      p.vx += (dx/dist)*f; p.vy += (dy/dist)*f; p.vz += (dz/dist)*f;
      p.vx *= .88; p.vy *= .88; p.vz *= .88;
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      all = false;
    } else {
      p.x = p.tx + Math.sin(now*.0022+p.delay)*.5;
      p.y = p.ty + Math.cos(now*.0022+p.delay)*.5;
      p.z = p.tz + Math.sin(now*.0018+p.delay*.7)*.4;
    }
    p.alpha = Math.min(p.alpha + .011, 1);
  }
  return all;
}

function drawParticles() {
  const blur = isMobile() ? 4 : 7;
  const visible = [];
  for (const p of particles) {
    if (p.age < p.delay) continue;
    const r = rotate3d(p.x, p.y, p.z, rotY, rotX);
    const { px, py, scale } = project(r.x, r.y, r.z);
    visible.push({ p, px, py, scale, rz: r.z });
  }
  visible.sort((a, b) => a.rz - b.rz);
  for (const { p, px, py, scale } of visible) {
    const [r, g, b] = p.color;
    const sz = Math.max(.3, p.size * scale * 1.1);
    const bright = .55 + .45 * Math.max(0, Math.min(1, (scale-.7)/.6));
    ctx.shadowBlur  = blur * scale;
    ctx.shadowColor = `rgba(${r},${g},${b},.9)`;
    ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2);
    ctx.fillStyle   = `rgba(${r},${g},${b},${p.alpha * bright})`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ── LOOPS ──
function introLoop(t) {
  if (phase !== 'idle') return;
  requestAnimationFrame(introLoop);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0,0,W,H);
  drawStars(ctx, stars, t);
}

function heartLoop(t) {
  if (phase === 'msg') return;
  requestAnimationFrame(heartLoop);

  if (autoSpin) targetRotY += .004;
  rotY += (targetRotY - rotY) * .06;
  rotX += (targetRotX - rotX) * .06;

  ctx.fillStyle = 'rgba(0,0,8,.2)'; ctx.fillRect(0,0,W,H);
  drawNebula(ctx, t); drawStars(ctx, stars, t);

  if (!heartDone) {
    heartDone = updateParticles();
    if (heartDone) {
      phase = 'done';
      // mostra botão "ler mensagem"
      const btn = document.getElementById('nextBtn');
      btn.classList.remove('hidden');
      setTimeout(() => btn.classList.add('visible'), 50);
      // esconde hint de arrastar
      document.getElementById('heartHint').style.opacity = '0';
    }
  } else {
    updateParticles();
  }
  drawParticles();
}

// loop suave de estrelas para o fundo da tela de mensagem
function msgBgLoop(t) {
  if (phase !== 'msg') return;
  requestAnimationFrame(msgBgLoop);
  ctx2.fillStyle = 'rgba(0,0,8,.18)'; ctx2.fillRect(0,0,W,H);
  drawNebula(ctx2, t); drawStars(ctx2, stars2, t);
}

// ── DRAG PARA ROTACIONAR ──
const hs = document.getElementById('heart-screen');
hs.addEventListener('mousedown', e => {
  if (phase === 'idle') return;
  drag = true; autoSpin = false;
  lastMX = e.clientX; lastMY = e.clientY;
  document.getElementById('heartHint').style.opacity = '0';
});
window.addEventListener('mousemove', e => {
  if (!drag) return;
  targetRotY += (e.clientX - lastMX) * .007;
  targetRotX += (e.clientY - lastMY) * .007;
  targetRotX = Math.max(-.9, Math.min(.9, targetRotX));
  lastMX = e.clientX; lastMY = e.clientY;
});
window.addEventListener('mouseup', () => drag = false);

hs.addEventListener('touchstart', e => {
  if (phase === 'idle') return;
  autoSpin = false;
  lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
  document.getElementById('heartHint').style.opacity = '0';
}, { passive: true });
hs.addEventListener('touchmove', e => {
  targetRotY += (e.touches[0].clientX - lastMX) * .007;
  targetRotX += (e.touches[0].clientY - lastMY) * .007;
  targetRotX = Math.max(-.9, Math.min(.9, targetRotX));
  lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
}, { passive: true });

// ── BOTÃO ABRIR ──
document.getElementById('openBtn').addEventListener('click', openHeart);
document.getElementById('openBtn').addEventListener('touchend', e => { e.preventDefault(); openHeart(); });

function openHeart() {
  const intro = document.getElementById('intro');
  const hs    = document.getElementById('heart-screen');
  intro.classList.add('fade-out');
  setTimeout(() => {
    intro.style.display = 'none';
    hs.classList.remove('hidden');
    resize(); buildStars(); buildHeartPoints(); buildParticles();
    phase = 'forming';
    requestAnimationFrame(heartLoop);
  }, 1200);
}

// ── BOTÃO LER MENSAGEM ──
document.getElementById('nextBtn').addEventListener('click', openMsg);
document.getElementById('nextBtn').addEventListener('touchend', e => { e.preventDefault(); openMsg(); });

function openMsg() {
  const hs  = document.getElementById('heart-screen');
  const ms  = document.getElementById('msg-screen');
  hs.classList.add('fade-out');
  setTimeout(() => {
    hs.style.display = 'none';
    ms.classList.remove('hidden');
    phase = 'msg';
    // ativa fade-in do texto
    setTimeout(() => document.querySelector('.msg-inner').classList.add('visible'), 100);
    requestAnimationFrame(msgBgLoop);
  }, 1200);
}

// ── INIT ──
resize(); buildStars();
requestAnimationFrame(introLoop);
