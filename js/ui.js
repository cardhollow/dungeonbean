function layout() {
  $("touch").classList.toggle("off", cfg.hideTouch);
  resize();
}
function resize() {
  const st = $("stage"), w = st.clientWidth, h = st.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (!w) return;
  cv.width = w * dpr;
  cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view = { w, h, cs: Math.max(22, Math.min(46, Math.floor(Math.min(w / 14, h / 8.5)))) };
}
const codeStr = (d) => (gotClues[d.c] || []).map((x) => x === null ? "_" : x).join("");
function hud() {
  if (!S) return;
  let bar = "";
  for (let k = 0; k < S.D; k++) bar += k == P.z ? "▣" : "▫";
  $("lv").innerHTML = `<b>Level ${level}</b> <small>Slice ${P.z + 1}/${S.D} ${bar}</small>`;
  $("inv").innerHTML = inv.map((c) => `<span class="chip"><span class="dot" style="background:${COL[c]}"></span>🔑</span>`).join("") + (hasL ? `<span class="chip">🔦${lanOn ? "" : "<small>off</small>"}</span>` : "") + S.doors.filter((d) => d.isDigital && !opened.has(d.c)).map((d) => `<span class="chip">📟<span class="dot" style="background:${COL[d.c]}"></span>${codeStr(d)}</span>`).join("");
  $("hp").textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
  $("st").textContent = "Moves " + moves;
}
function showInv() {
  if (!playing) return;
  const o = $("invp");
  if (!o.hidden) {
    o.hidden = true;
    return;
  }
  if (overlayOpen()) return;
  const it = inv.map((c) => `<div class="slot f"><svg viewBox="0 0 24 24" width="34" height="34"><circle cx="7" cy="12" r="4" fill="none" stroke="${COL[c]}" stroke-width="3"/><rect x="10.5" y="11" width="11.5" height="2.6" fill="${COL[c]}"/><rect x="17" y="13" width="2.4" height="4.5" fill="${COL[c]}"/><rect x="20.4" y="13" width="2.2" height="3" fill="${COL[c]}"/></svg>${NAM[c]}</div>`);
  if (hasL) it.push(`<div class="slot f"><div style="font-size:30px">🔦</div>Lantern ${lanOn ? "on" : "off"}</div>`);
  S.doors.filter((d) => d.isDigital).forEach((d) => it.push(`<div class="slot f"><div style="font-size:26px">📟</div>${NAM[d.c]}<br>${(gotClues[d.c] || []).map((x) => x === null ? "_" : x).join(" ")}</div>`));
  $("invl").innerHTML = '<div class="slots">' + Array.from({ length: Math.max(8, Math.ceil(it.length / 4) * 4) }, (_, i) => it[i] || '<div class="slot"></div>').join("") + "</div>";
  $("invi").textContent = `Level ${level} · Slice ${P.z + 1}/${S.D}` + (hasL ? " · R toggles lantern" : "");
  o.hidden = false;
}
function menu(show) {
  if (show && playing) saveProgress();
  $("menu").hidden = !show;
  refreshContinueButton();
  if (show) $("settings").hidden = true;
}
const kname = (b) => (b.s ? "Shift+" : "") + (b.k == " " ? "Space" : b.k.length > 1 ? b.k : b.k.toUpperCase());
function renderKB() {
  $("kbs").innerHTML = Object.keys(LBL).map((a) => `<div class="kb"><span>${LBL[a]}</span><button data-b="${a}">${bind == a ? "press a key…" : kname(cfg.binds[a])}</button></div>`).join("");
  document.querySelectorAll("[data-b]").forEach((b) => b.onclick = () => {
    bind = b.dataset.b;
    renderKB();
  });
}
function openSettings() {
  $("vm").value = cfg.master;
  $("vs").value = cfg.sfx;
  $("vu").value = cfg.music;
  $("ht").checked = cfg.hideTouch;
  bind = null;
  renderKB();
  $("menu").hidden = true;
  $("settings").hidden = false;
}
function renderPin() {
  document.querySelectorAll("[data-pin-slot]").forEach((slot) => {
    const i = +slot.dataset.pinSlot, filled = i < pinDigits.length;
    slot.textContent = filled ? pinDigits[i] : "";
    slot.classList.toggle("filled", filled);
  });
}
const clearPin = () => {
  pinDigits = [];
  renderPin();
};
const backPin = () => {
  pinDigits.pop();
  renderPin();
};
function addPinDigit(d) {
  if (pinDigits.length >= 4) return;
  pinDigits.push(String(d));
  renderPin();
  tone(500 + pinDigits.length * 80, 0.05, "square", 0, 0.08);
}
function openDigitalLock(dr) {
  if (!dr || !dr.isDigital) return;
  curDigiDoor = dr;
  pinDigits = [];
  renderPin();
  $("pinfo").textContent = `${NAM[dr.c]} keypad · enter the 4-digit code.`;
  $("pinp").hidden = false;
}
function tryDigitalUnlock() {
  if (!curDigiDoor) return;
  if (pinDigits.length !== 4) {
    say("Enter all 4 digits.");
    sfx.locked();
    return;
  }
  if (pinDigits.join("") === (curDigiDoor.code || []).join("")) {
    opened.add(curDigiDoor.c);
    say("Digital lock opened!");
    sfx.unlock();
    $("pinp").hidden = true;
    curDigiDoor = null;
    pinDigits = [];
    renderPin();
    hud();
  } else {
    say("Incorrect code.");
    sfx.locked();
    pinDigits = [];
    renderPin();
  }
}
$("play").onclick = () => {
  ac();
  newRun();
};
$("cont").onclick = () => {
  ac();
  continueRun();
};
$("bset").onclick = () => {
  ac();
  openSettings();
};
$("sback").onclick = () => {
  save();
  saveProgress();
  bind = null;
  $("settings").hidden = true;
  layout();
  menu(true);
};
$("vm").oninput = (e) => {
  cfg.master = +e.target.value;
  vol();
  save();
};
$("vs").oninput = (e) => {
  cfg.sfx = +e.target.value;
  vol();
  save();
};
$("vu").oninput = (e) => {
  cfg.music = +e.target.value;
  vol();
  save();
};
$("vs").onchange = () => {
  ac();
  sfx.key();
};
$("ht").onchange = (e) => {
  cfg.hideTouch = e.target.checked;
  save();
  layout();
};
$("rk").onclick = () => {
  cfg.binds = JSON.parse(JSON.stringify(DEF.binds));
  save();
  renderKB();
};
$("next").onclick = () => {
  level++;
  saveProgress();
  startLevel();
};
$("retry").onclick = () => {
  ac();
  runSeed = Math.random().toString(36).slice(2, 8);
  lives = 3;
  saveProgress();
  startLevel();
};
$("iclose").onclick = () => $("invp").hidden = true;
$("binv").onclick = showInv;
$("blan").onclick = toggleL;
$("bmenu").onclick = () => menu(true);
document.querySelectorAll("[data-digit]").forEach((b) => b.addEventListener("click", () => {
  ac();
  addPinDigit(b.dataset.digit);
}));
$("pinclear").onclick = () => {
  ac();
  clearPin();
};
$("pinback").onclick = () => {
  ac();
  backPin();
};
$("pinok").onclick = () => {
  ac();
  tryDigitalUnlock();
};
$("pincancel").onclick = () => {
  curDigiDoor = null;
  pinDigits = [];
  renderPin();
  $("pinp").hidden = true;
};
let rep;
document.querySelectorAll("[data-a]").forEach((b) => {
  const a = b.dataset.a, stop = () => clearInterval(rep);
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    act(a);
    stop();
    if (a != "j") rep = setInterval(() => act(a), 170);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stop));
});
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keysDown.add(k);
  if (bind) {
    e.preventDefault();
    if (k == "shift") return;
    if (k != "escape") {
      cfg.binds[bind] = { k, s: e.shiftKey ? 1 : 0 };
      save();
    }
    bind = null;
    renderKB();
    return;
  }
  if (k == "escape") {
    if (!$("invp").hidden) $("invp").hidden = true;
    else if (!$("pinp").hidden) $("pincancel").click();
    else if (playing && $("menu").hidden && $("settings").hidden && $("win").hidden && $("over").hidden) menu(true);
    else if (playing && !$("menu").hidden) $("menu").hidden = true;
    return;
  }
  if (k == "enter" && !$("over").hidden) {
    $("retry").click();
    return;
  }
  if (k == "enter" && !$("win").hidden) {
    level++;
    saveProgress();
    startLevel();
    return;
  }
  const hit = Object.keys(cfg.binds).filter((a2) => cfg.binds[a2].k == k);
  if (!hit.length) return;
  const a = hit.find((x) => !!cfg.binds[x].s == e.shiftKey) || hit[0];
  if (!overlayOpen()) e.preventDefault();
  if (a == "inv") {
    if (e.repeat) return;
    showInv();
  } else if (a == "lantern") {
    if (e.repeat) return;
    toggleL();
  } else {
    const n = performance.now();
    if (e.repeat && n - lastAct < 110) return;
    lastAct = n;
    act(ACT[a]);
  }
});
addEventListener("keyup", (e) => {
  keysDown.delete(e.key.toLowerCase());
  if (e.key == " " && playing) e.preventDefault();
});
addEventListener("blur", () => keysDown.clear());
addEventListener("resize", resize);
addEventListener("beforeunload", () => saveProgress());
