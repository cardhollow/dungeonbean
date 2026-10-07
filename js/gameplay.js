const hid = () => S.fur.get(S.I(P.x, P.y, P.z)) == 5;
function toggleL() {
  if (!hasL || !playing || overlayOpen()) return;
  lanOn = !lanOn;
  sfx.ladder();
  hud();
}
function hurt(msg) {
  const n = performance.now();
  if (n < hurtT || lives <= 0 || overlayOpen()) return;
  hurtT = n + 1200;
  lives--;
  sfx.hurt();
  hud();
  if (lives <= 0) $("over").hidden = false;
  else say((msg || "Ouch! Spikes!") + " " + lives + " heart" + (lives > 1 ? "s" : "") + " left");
}
function act(k) {
  if (!playing || won || overlayOpen()) return;
  ac();
  if (k == "j") {
    const kd = (n) => keysDown.has(cfg.binds[n].k.toLowerCase()), hl = kd("left"), hr = kd("right");
    if (hl && !hr) P.fx = -1;
    else if (hr && !hl) P.fx = 1;
    if (isL(P.x, P.y, P.z)) k = "u";
    else if (isL(P.x + P.fx, P.y, P.z)) k = P.fx > 0 ? "r" : "l";
    else {
      const av = S.moves(P.x, P.y, P.z, cl, 1);
      let jk = P.fx > 0 ? "jr" : "jl";
      if (!av.some((a) => a[0] == jk) && !hl && !hr) {
        const o = jk == "jr" ? "jl" : "jr";
        if (av.some((a) => a[0] == o)) {
          jk = o;
          P.fx = -P.fx;
        }
      }
      if (av.some((a) => a[0] == jk)) {
        J0 = performance.now();
        sfx.jump();
      }
      k = jk;
    }
  }
  let m = S.moves(P.x, P.y, P.z, cl, 1).find((a) => a[0] == k);
  if (!m && "lrfb".includes(k)) {
    const nx = P.x + (k == "l" ? -1 : k == "r" ? 1 : 0), nz = P.z + (k == "f" ? -1 : k == "b" ? 1 : 0), id = S.I(nx, P.y, nz), dr = S.dm.get(id);
    if (dr && cl(id)) {
      if (dr.isDigital) {
        openDigitalLock(dr);
        return;
      }
      if (inv.includes(dr.c)) {
        inv.splice(inv.indexOf(dr.c), 1);
        opened.add(dr.c);
        say(NAM[dr.c] + " padlock opened!");
        sfx.unlock();
        m = S.moves(P.x, P.y, P.z, cl, 1).find((a) => a[0] == k);
      } else {
        say("Locked — you need the " + NAM[dr.c] + " key.");
        sfx.locked();
        return;
      }
    }
  }
  if (!m) {
    if (k == "f" || k == "b") say("No open space on that slice here.");
    if (k[0] != "j") sfx.bump();
    return;
  }
  if (k == "l" || k == "jl") P.fx = -1;
  if (k == "r" || k == "jr") P.fx = 1;
  const oz = P.z, [x, y, z] = S.dec(m[1]), fell = oz == z && y < P.y - 1;
  P.x = x;
  P.y = y;
  P.z = z;
  moves++;
  (z != oz ? sfx.slice : "ud".includes(k) ? sfx.ladder : sfx.step)();
  for (const kk of S.keys) if (kk.i == m[1] && !kk.isDigi && !got.has(kk.c)) {
    got.add(kk.c);
    inv.push(kk.c);
    say("Picked up the " + NAM[kk.c] + " key!");
    sfx.key();
  }
  const clue = S.clueMap.get(m[1]);
  if (clue && gotClues[clue.d] && gotClues[clue.d][clue.idx] === null) {
    gotClues[clue.d][clue.idx] = clue.val;
    say(`${NAM[clue.d]} keypad: digit #${clue.idx + 1} is ${clue.val}`);
    sfx.key();
  }
  if (m[1] == S.lantern && !hasL) {
    hasL = 1;
    lanOn = 1;
    say("Picked up a Lantern! Press R to toggle it.");
    sfx.key();
  }
  if (S.fur.get(m[1]) == 5) say("You hide in the cabinet. Monsters cannot see you in here.");
  if (fell && y <= P.y) say("You dropped through a hole!");
  if (m[1] == S.exit) {
    won = true;
    sfx.win();
    $("wt").textContent = `🎉 Level ${level} complete!`;
    $("wi").textContent = `${moves} moves · ${Math.round((Date.now() - t0) / 1e3)}s · next up: Level ${level + 1} (bigger and more tangled)`;
    $("win").hidden = false;
  }
  hud();
}
function los(m) {
  const dx = P.x - m.x, dy = P.y - m.y, dz = P.z - m.z, n = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  if (n > 12 || hid() || dx * m.dir < 0) return false;
  for (let i = 1; i < n; i++) {
    const id = S.I(Math.round(m.x + dx * i / n), Math.round(m.y + dy * i / n), Math.round(m.z + dz * i / n));
    if (S.s[id] > 0 || S.dm.has(id) && cl(id)) return false;
  }
  return true;
}
function stepMon(m) {
  if (overlayOpen()) return;
  const seen = los(m);
  m.ch = seen;
  let ks;
  if (seen) {
    const dx = P.x - m.x, dz = P.z - m.z;
    ks = [];
    if (dx) ks.push(dx < 0 ? "l" : "r");
    if (dz) ks[Math.abs(dz) > Math.abs(dx) ? "unshift" : "push"](dz < 0 ? "f" : "b");
  } else ks = [m.dir < 0 ? "l" : "r"];
  const mv = S.moves(m.x, m.y, m.z, cl);
  let mm = null;
  for (const k of ks) {
    mm = mv.find((a) => a[0] == k);
    if (mm) {
      if (k == "l") m.dir = -1;
      if (k == "r") m.dir = 1;
      break;
    }
  }
  if (!mm && !seen) {
    m.dir *= -1;
    mm = mv.find((a) => a[0] == (m.dir < 0 ? "l" : "r"));
  }
  if (mm) {
    const [x, y, z] = S.dec(mm[1]);
    m.x = x;
    m.y = y;
    m.z = z;
  }
}
function newRun() {
  runSeed = Math.random().toString(36).slice(2, 8);
  level = 1;
  lives = 3;
  saveProgress();
  startLevel();
}
function continueRun() {
  const p = getProgress();
  if (!p) return;
  runSeed = p.seed;
  level = p.level;
  lives = 3;
  $("menu").hidden = true;
  saveProgress();
  startLevel();
}
function startLevel() {
  if (busy) return;
  busy = 1;
  saveProgress();
  $("bld").hidden = false;
  genAsync(runSeed, level).then((g) => {
    busy = 0;
    $("bld").hidden = true;
    begin(g);
  });
}
function begin(g) {
  S = g;
  S.tint = [];
  S.dkA = new Uint8Array(S.rooms + 2);
  (S.dk || []).forEach((i) => S.dkA[i] = 1);
  mon = (S.mons || []).map((m) => ({ ...m, dx: m.x, dy: m.y, ch: 0, nt: 0 }));
  hasL = 0;
  lanOn = 0;
  const [x, y, z] = S.dec(S.st0);
  P = { x, y, z, fx: 1 };
  F = { x, y, z };
  inv = [];
  opened = new Set();
  got = new Set();
  moves = 0;
  won = false;
  t0 = Date.now();
  playing = true;
  J0 = 0;
  hurtT = 0;
  gotClues = {};
  S.doors.forEach((d) => {
    if (d.isDigital) gotClues[d.c] = [null, null, null, null];
  });
  curDigiDoor = null;
  pinDigits = [];
  keysDown.clear();
  $("game").hidden = false;
  ["menu", "settings", "invp", "win", "over", "pinp"].forEach((i) => $(i).hidden = true);
  say(`Level ${level} · find keys & codes, open doors, reach ★ (slice ${S.dec(S.exit)[2] + 1})`);
  layout();
  hud();
}
