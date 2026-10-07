const $ = (id) => document.getElementById(id);
const COL = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#06b6d4", "#ec4899"];
const NAM = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Cyan", "Pink"];
const DEF = { master: 0.7, sfx: 0.8, music: 0.35, hideTouch: false, binds: { left: { k: "a", s: 0 }, right: { k: "d", s: 0 }, zp: { k: "w", s: 0 }, zm: { k: "s", s: 0 }, up: { k: "q", s: 0 }, down: { k: "q", s: 1 }, jump: { k: " ", s: 0 }, inv: { k: "e", s: 0 }, lantern: { k: "r", s: 0 } } };
const ACT = { left: "l", right: "r", zp: "b", zm: "f", up: "u", down: "d", jump: "j" };
const LBL = { left: "Left", right: "Right", zp: "Move +Z", zm: "Move −Z", up: "Climb Up", down: "Climb Down", jump: "Jump / Climb", inv: "Inventory", lantern: "Lantern" };
const CFG_KEY = "bean25d", PROGRESS_KEY = "bean25d_progress";
let cfg = JSON.parse(JSON.stringify(DEF));
try {
  const o = JSON.parse(localStorage.getItem(CFG_KEY));
  if (o) cfg = { ...cfg, ...o, binds: { ...cfg.binds, ...o.binds } };
} catch (e) {
}
const save = () => {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch (e) {
  }
};
function getProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (p && Number.isInteger(p.level) && p.level >= 1 && typeof p.seed === "string" && p.seed.length) return p;
  } catch (e) {
  }
  return null;
}
function saveProgress() {
  if (!runSeed || !level) return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ level, seed: runSeed }));
  } catch (e) {
  }
}
function refreshContinueButton() {
  const p = getProgress();
  if (p) {
    $("cont").hidden = false;
    $("cont").textContent = `Continue · Level ${p.level}`;
    $("mi").textContent = `Saved seed "${p.seed}" · Level ${p.level}`;
  } else {
    $("cont").hidden = true;
    $("mi").textContent = "";
  }
}
const LOGO_DEFS = '<defs><linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#465064"/><stop offset="1" stop-color="#252c3b"/></linearGradient><linearGradient id="bean" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9bea68"/><stop offset=".55" stop-color="#7ed957"/><stop offset="1" stop-color="#4f9f38"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset="1" stop-color="#d49a28"/></linearGradient><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000000" flood-opacity=".45"/></filter></defs>';
const LOGO_ICON = '<g transform="translate(60 0)"><path d="M28 154V76C28 39 53 20 90 20C127 20 152 39 152 76V154Z" fill="url(#stone)" stroke="#151a24" stroke-width="8" stroke-linejoin="round" filter="url(#shadow)"/><path d="M31 67H55M125 67H149M30 95H52M128 95H150M30 123H57M123 123H150" fill="none" stroke="#69758a" stroke-width="4" opacity=".5" stroke-linecap="round"/><path d="M49 154V79C49 54 65 39 90 39C115 39 131 54 131 79V154Z" fill="#090d15"/><path d="M91 45C72 45 60 57 59 79C58 101 67 128 88 137C101 143 118 136 123 120C129 103 124 78 119 64C114 51 104 45 91 45Z" fill="url(#bean)" stroke="#315d28" stroke-width="6" stroke-linejoin="round"/><path d="M73 63C67 72 67 88 70 97C72 104 77 103 79 96C82 85 80 72 84 63C86 57 77 57 73 63Z" fill="#c2f58c" opacity=".65"/><ellipse cx="92" cy="82" rx="10" ry="12" fill="#ffffff"/><ellipse cx="95" cy="84" rx="5" ry="7" fill="#182033"/><circle cx="91" cy="119" r="5" fill="url(#gold)"/><path d="M91 123V131" stroke="#d49a28" stroke-width="5" stroke-linecap="round"/><path d="M31 66C35 37 57 21 90 21C123 21 145 37 149 66L130 72C125 51 110 41 90 41C70 41 55 51 50 72Z" fill="url(#stone)" stroke="#151a24" stroke-width="7" stroke-linejoin="round"/><path d="M48 67C54 50 69 41 90 41C111 41 126 50 132 67" fill="none" stroke="#7b6845" stroke-width="5" stroke-linecap="round"/></g>';
const LOGO_TEXT = '<text x="150" y="202" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="900" letter-spacing="1" fill="#f2d58a" stroke="#151a24" stroke-width="6" paint-order="stroke">Dungeon Bean</text>';
const LOGO_FULL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 230" role="img" aria-label="Dungeon Bean">' + LOGO_DEFS + LOGO_ICON + LOGO_TEXT + "</svg>";
const LOGO_FAV = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 12 140 150" width="140" height="150">' + LOGO_DEFS + LOGO_ICON + "</svg>";
$("logo").innerHTML = LOGO_FULL;
$("fav").href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(LOGO_FAV);
let AC, MG, SG, UG;
function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    MG = AC.createGain();
    MG.connect(AC.destination);
    SG = AC.createGain();
    SG.connect(MG);
    UG = AC.createGain();
    UG.connect(MG);
    vol();
  }
  if (AC.state == "suspended") AC.resume();
}
function vol() {
  if (!AC) return;
  MG.gain.value = cfg.master;
  SG.gain.value = cfg.sfx;
  UG.gain.value = cfg.music;
}
function tone(f, d = 0.1, type = "square", t = 0, v = 0.2, dest) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain(), s = AC.currentTime + t;
  o.type = type;
  o.frequency.setValueAtTime(f, s);
  g.gain.setValueAtTime(0, s);
  g.gain.linearRampToValueAtTime(v, s + 0.01);
  g.gain.exponentialRampToValueAtTime(1e-3, s + d);
  o.connect(g);
  g.connect(dest || SG);
  o.start(s);
  o.stop(s + d + 0.03);
}
const sfx = {
  step: () => tone(150 + Math.random() * 30, 0.05, "triangle", 0, 0.25),
  slice: () => {
    tone(300, 0.08, "sine");
    tone(450, 0.1, "sine", 0.06);
  },
  ladder: () => tone(520, 0.05, "square", 0, 0.1),
  jump: () => {
    tone(320, 0.08, "sine", 0, 0.18);
    tone(520, 0.1, "sine", 0.05, 0.14);
  },
  key: () => [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.15, "triangle", i * 0.07)),
  unlock: () => {
    tone(200, 0.08, "square");
    tone(400, 0.08, "square", 0.08);
    tone(800, 0.18, "triangle", 0.16);
  },
  hurt: () => {
    tone(120, 0.25, "sawtooth", 0, 0.3);
    tone(70, 0.3, "square", 0.05, 0.2);
  },
  locked: () => tone(90, 0.18, "sawtooth", 0, 0.25),
  bump: () => tone(110, 0.05, "triangle", 0, 0.2),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, "triangle", i * 0.11, 0.25))
};
const PENT = [220, 247, 277, 329, 370, 440, 494, 554];
setInterval(() => {
  if (AC && playing && cfg.music > 0 && !overlayOpen()) {
    const f = PENT[Math.floor(Math.random() * PENT.length)];
    tone(f, 1.6, "sine", 0, 0.22, UG);
    if (Math.random() < 0.4) tone(f / 2, 2.2, "triangle", 0.1, 0.15, UG);
  }
}, 900);
function hash(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h >>> 0;
}
function rng(a) {
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
