function mkMoves(W, H, D, s, lad, dm, hz) {
  const LL = W * H, I = (x, y, z) => z * LL + y * W + x;
  const sol = (x, y, z, cl2) => {
    if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return true;
    const i = I(x, y, z);
    return s[i] > 0 || dm.has(i) && cl2(i);
  };
  const ld = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D && lad[I(x, y, z)] == 1;
  const sup = (x, y, z, cl2) => sol(x, y - 1, z, cl2) || ld(x, y, z) || ld(x, y - 1, z);
  return (x, y, z, cl2, al) => {
    const o = [], bl = (a, b, c) => !al && hz.has(I(a, b, c));
    const st = (k, nx, nz) => {
      if (!sol(nx, y, nz, cl2)) {
        for (let d = 0; d < 5; d++) {
          if (sol(nx, y - d, nz, cl2)) break;
          if (sup(nx, y - d, nz, cl2)) {
            if (!bl(nx, y - d, nz)) {
              if ((k == "f" || k == "b") && d >= 2) break;
              o.push([k, I(nx, y - d, nz)]);
            }
            break;
          }
        }
      } else if (!sol(nx, y + 1, nz, cl2) && !sol(x, y + 1, z, cl2) && !bl(nx, y + 1, nz)) o.push([k, I(nx, y + 1, nz)]);
    };
    st("l", x - 1, z);
    st("r", x + 1, z);
    st("f", x, z - 1);
    st("b", x, z + 1);
    const jp = (k, d) => {
      const nx = x + d, n2 = x + 2 * d;
      if (sol(nx, y, z, cl2) && sol(nx, y + 1, z, cl2) && !sol(nx, y + 2, z, cl2) && !sol(x, y + 1, z, cl2)) o.push([k, I(nx, y + 2, z)]);
      else if (!sol(x, y + 1, z, cl2) && !sol(nx, y + 1, z, cl2) && !sol(n2, y, z, cl2) && !sol(n2, y + 1, z, cl2) && sup(n2, y, z, cl2) && !bl(n2, y, z)) o.push([k, I(n2, y, z)]);
    };
    jp("jl", -1);
    jp("jr", 1);
    if (ld(x, y, z) && !sol(x, y + 1, z, cl2)) o.push(["u", I(x, y + 1, z)]);
    if (ld(x, y - 1, z)) o.push(["d", I(x, y - 1, z)]);
    return o;
  };
}
function genOne(seed, L) {
  const R = rng(hash(seed)), ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const RX = Math.min(8, 3 + (L / 3 | 0)), RY = Math.min(5, 2 + (L > 3) + (L > 7) + (L > 11)), RZ = Math.min(4, 2 + (L > 4) + (L > 8));
  const iw = 7, ih = 3, ip = 2;
  const winding = Math.min(0.9, L * 0.08), blockP = Math.min(0.95, 0.2 + L * 0.07), loops = Math.max(0, 0.4 - L * 0.035);
  const ndMax = Math.min(8, Math.ceil(L * 0.6) + (L >= 6 ? 1 : 0)), ndMin = Math.max(L < 2 ? 0 : 1, ndMax >> 1), nd = ri(ndMin, ndMax);
  const W = RX * (iw + 1) + 1, H = RY * (ih + 1) + 1, D = RZ * (ip + 1) + 1, LL = W * H, N = LL * D;
  const I = (x, y, z) => z * LL + y * W + x;
  const s = new Uint8Array(N).fill(1), lad = new Uint8Array(N), rid = new Uint8Array(N);
  const dm = new Map(), doors = [], dw = [], dset = new Set(), res = new Set();
  const ox = (a) => 1 + a * (iw + 1), oy = (b) => 1 + b * (ih + 1), oz = (c) => 1 + c * (ip + 1);
  const sx0 = ox(0) + (iw >> 1), sy0 = oy(0), sz0 = oz(0);
  let n = 0;
  for (let c = 0; c < RZ; c++) for (let b = 0; b < RY; b++) for (let a = 0; a < RX; a++) {
    n++;
    for (let z = oz(c); z < oz(c) + ip; z++) for (let y = oy(b); y < oy(b) + ih; y++) for (let x = ox(a); x < ox(a) + iw; x++) {
      s[I(x, y, z)] = 0;
      rid[I(x, y, z)] = n;
    }
    for (let r = 0; r < 1 + (L > 6); r++) if (R() < blockP) {
      const bw = ri(1, 3), bx = ox(a) + ri(0, iw - bw), bz = oz(c) + ri(0, ip - 1);
      for (let i = 0; i < bw; i++) {
        if (bx + i == sx0 && oy(b) == sy0 && bz == sz0) continue;
        s[I(bx + i, oy(b), bz)] = 1;
      }
    }
  }
  const key = (a, b, c) => (c * RY + b) * RX + a;
  const seen = new Set([0]), fr = [], edges = [], pairs = new Set();
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const addF = (a, b, c) => {
    for (const [p, q, r] of DIRS) {
      const A = a + p, B = b + q, C = c + r;
      if (A >= 0 && B >= 0 && C >= 0 && A < RX && B < RY && C < RZ) fr.push([a, b, c, A, B, C]);
    }
  };
  const pk = (e) => {
    const u = key(e[0], e[1], e[2]), v = key(e[3], e[4], e[5]);
    return Math.min(u, v) + "_" + Math.max(u, v);
  };
  addF(0, 0, 0);
  while (fr.length) {
    const e = fr.splice(R() < winding ? fr.length - 1 : ri(0, fr.length - 1), 1)[0];
    const k2 = key(e[3], e[4], e[5]);
    if (seen.has(k2)) continue;
    seen.add(k2);
    edges.push(e);
    pairs.add(pk(e));
    addF(e[3], e[4], e[5]);
  }
  for (let t = 0, ex = Math.round(n * loops); t < 100 && ex > 0; t++) {
    const a = ri(0, RX - 1), b = ri(0, RY - 1), c = ri(0, RZ - 1), [p, q, r] = DIRS[ri(0, 5)], A = a + p, B = b + q, C = c + r;
    if (A < 0 || B < 0 || C < 0 || A >= RX || B >= RY || C >= RZ) continue;
    const e = [a, b, c, A, B, C];
    if (pairs.has(pk(e))) continue;
    pairs.add(pk(e));
    edges.push(e);
    ex--;
  }
  for (const [a, b, c, A, B, C] of edges) {
    if (A != a) {
      const xw = ox(Math.min(a, A)) + iw, zc = oz(c) + ri(0, ip - 1), y = oy(b);
      s[I(xw, y, zc)] = 0;
      s[I(xw, y + 1, zc)] = 0;
      dw.push([I(xw, y, zc), I(xw, y + 1, zc)]);
    } else if (C != c) {
      const zw = oz(Math.min(c, C)) + ip, xc = ox(a) + ri(0, iw - 1), y = oy(b);
      s[I(xc, y, zw)] = 0;
      s[I(xc, y + 1, zw)] = 0;
      const q = [I(xc, y, zw), I(xc, y + 1, zw)];
      q.z = 1;
      dw.push(q);
    } else {
      const lo = Math.min(b, B);
      let zl = oz(c) + ri(0, ip - 1);
      if (a == 0 && c == 0 && lo == 0) zl = sz0 + 1;
      const y0 = oy(lo), yt = oy(lo + 1);
      if (R() < 0.5) {
        const xl = ox(a) + ri(0, iw - 1);
        for (let y = y0; y <= y0 + ih; y++) {
          s[I(xl, y, zl)] = 0;
          lad[I(xl, y, zl)] = 1;
        }
        s[I(xl, yt, zl)] = 0;
      } else {
        const d = R() < 0.5 ? 1 : -1, xb = d > 0 ? ox(a) + ri(1, 3) : ox(a) + ri(3, 5);
        for (let j = 0; j < 3; j++) for (let y = y0; y <= y0 + j; y++) s[I(xb + d * j, y, zl)] = 3;
        s[I(xb + d, y0 + 3, zl)] = 0;
        s[I(xb + 2 * d, y0 + 3, zl)] = 0;
        for (let j = 1; j <= 3; j++) s[I(xb + d * j, yt, zl)] = 0;
        [[xb, y0 + 1], [xb + d, y0 + 2], [xb + 2 * d, y0 + 3], [xb - d, y0], [xb + d, y0 + 3], [xb + d, yt], [xb + 2 * d, yt], [xb + 3 * d, yt]].forEach(([x, y]) => res.add(I(x, y, zl)));
      }
    }
  }
  dw.forEach((p) => p.forEach((i) => dset.add(i)));
  const tun = L >= 20;
  if (tun) for (let c = 0; c < RZ; c++) for (let b = 0; b < RY; b++) for (let a = 0; a < RX; a++) {
    if (R() > 0.85) continue;
    const y0 = oy(b);
    const busy2 = (z2) => {
      for (let y = y0; y <= y0 + 3; y++) for (let x = ox(a) - 1; x <= ox(a) + iw; x++) {
        const q = I(x, y, z2);
        if (lad[q] || res.has(q) || s[q] == 3) return true;
      }
      return false;
    };
    const zs = [oz(c), oz(c) + 1].filter((z2) => !busy2(z2) && !(a == 0 && b == 0 && z2 == sz0));
    if (!zs.length) continue;
    const z = zs[ri(0, zs.length - 1)];
    for (let x = ox(a); x < ox(a) + iw; x++) for (let y = y0; y < y0 + ih; y++) {
      const q = I(x, y, z);
      if (!s[q] && !dset.has(q) && !dset.has(I(x, y, z - 1)) && !dset.has(I(x, y, z + 1)) && !dset.has(I(x - 1, y, z)) && !dset.has(I(x + 1, y, z))) s[q] = 1;
    }
  }
  for (let c = 0; c < RZ; c++) for (let b = 0; b < RY; b++) for (let a = 0; a < RX; a++)
    if (!tun && R() < Math.min(0.8, 0.25 + L * 0.06)) {
      const w = ri(1, 2), x0 = ox(a) + 2 + ri(0, 3 - w), z = oz(c) + ri(0, ip - 1), y = oy(b);
      let good = true;
      for (let i = 0; i < w; i++) {
        for (let q = 0; q < 2; q++) {
          const id = I(x0 + i, y + q, z);
          if (s[id] || lad[id] || res.has(id) || s[I(x0 + i, y - 1, z)] != 1) good = false;
        }
        if (dset.has(I(x0 + i, y, z - 1)) || dset.has(I(x0 + i, y, z + 1)) || x0 + i == sx0 && z == sz0 && (y == sy0 || y + 1 == sy0)) good = false;
      }
      if (good) for (let i = 0; i < w; i++) {
        s[I(x0 + i, y, z)] = 2;
        s[I(x0 + i, y + 1, z)] = 2;
      }
    }
  s[I(sx0, sy0, sz0)] = 0;
  s[I(sx0, sy0 + 1, sz0)] = 0;
  s[I(sx0, sy0 - 1, sz0)] = 1;
  const hz = new Map();
  const moves2 = mkMoves(W, H, D, s, lad, dm, hz);
  const st0 = I(sx0, sy0, sz0);
  const dec = (i) => [i % W, (i / W | 0) % H, i / LL | 0];
  const holeP = L < 2 ? 0 : Math.min(0.5, 0.1 + L * 0.035);
  if (holeP > 0) for (let c = 0; c < RZ; c++) for (let b = 1; b < RY; b++) for (let a = 0; a < RX; a++) {
    if (R() >= holeP) continue;
    const x = ox(a) + ri(1, iw - 2), z = oz(c) + ri(0, ip - 1), y = oy(b);
    const col = [0, 1, 2, 3, 4].map((d) => I(x, y - d, z));
    if (s[col[0]] !== 0 || s[col[1]] !== 1 || s[col[2]] !== 0 || s[col[3]] !== 0 || s[col[4]] !== 0) continue;
    if (col.some((i) => lad[i] || res.has(i) || dset.has(i))) continue;
    if (s[I(x - 1, y - 1, z)] !== 1 || s[I(x + 1, y - 1, z)] !== 1) continue;
    const r1 = rid[col[0]], r2 = rid[col[4]];
    s[col[1]] = 0;
    let back = false;
    const sn = new Set([col[4]]), qq = [col[4]];
    for (let h = 0; h < qq.length && !back; h++) {
      const [x1, y1, z1] = dec(qq[h]);
      for (const [, j] of moves2(x1, y1, z1, () => false, 1)) {
        if (sn.has(j)) continue;
        const rj = rid[j];
        if (rj === r1) {
          back = true;
          break;
        }
        if (rj === r2 || rj === 0 && !dset.has(j)) {
          sn.add(j);
          qq.push(j);
        }
      }
    }
    if (!back) s[col[1]] = 1;
  }
  const bfs = (k, src = st0) => {
    const cl2 = (i) => {
      const d = dm.get(i);
      return d && d.c >= k;
    };
    const dist = new Int32Array(N).fill(-1), q = [src];
    dist[src] = 0;
    for (let h = 0; h < q.length; h++) {
      const [x, y, z] = dec(q[h]);
      for (const [, j] of moves2(x, y, z, cl2)) if (dist[j] < 0) {
        dist[j] = dist[q[h]] + 1;
        q.push(j);
      }
    }
    return { dist, q };
  };
  const ok = (i) => !dset.has(i) && !lad[i] && !res.has(i);
  for (let i = dw.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [dw[i], dw[j]] = [dw[j], dw[i]];
  }
  for (let k = 0; k < nd; k++) {
    const d0 = bfs(k), dp = k ? bfs(k - 1) : null;
    let hit = false;
    for (const [mb, mr] of [[10, 15], [6, 10]]) {
      if (hit) break;
      let tr = 0;
      for (const cs of dw.filter((p) => !!p.z == (k % 2 == 0)).concat(dw.filter((p) => !!p.z != (k % 2 == 0)))) {
        if (dm.has(cs[0]) || dm.has(cs[1])) continue;
        if (d0.dist[cs[0]] < 0) continue;
        if (dp && dp.dist[cs[0]] >= 0) continue;
        if (tr++ >= 12) break;
        const dr = { c: k, cells: cs };
        cs.forEach((i) => dm.set(i, dr));
        const a = bfs(k);
        let good = d0.q.length - a.q.length >= mb && a.q.length >= mr;
        if (good && dp) {
          let m = 0, o = 0;
          for (const i of a.q) if (dp.dist[i] < 0) {
            m++;
            if (ok(i)) o++;
          }
          good = m >= (mb > 6 ? 8 : 5) && o >= (mb > 6 ? 3 : 2);
        }
        if (good) {
          doors.push(dr);
          hit = true;
          break;
        }
        cs.forEach((i) => dm.delete(i));
      }
    }
    if (!hit) break;
  }
  const nD = doors.length, rc = [];
  for (let k = 0; k <= nD; k++) rc.push(bfs(k));
  const full = rc[nD], used = new Set([st0]), keys = [];
  const behind = (c) => rc[c + 1].q.filter((i) => rc[c].dist[i] < 0 && ok(i) && !used.has(i));
  const far = (arr, dist, lo) => {
    if (!arr.length) return null;
    arr.sort((a, b) => dist[a] - dist[b]);
    return arr[ri(Math.floor(arr.length * lo), arr.length - 1)];
  };
  const exit = nD ? far(behind(nD - 1), full.dist, 0.8) : far(full.q.filter((i) => ok(i)), full.dist, 0.9);
  if (exit == null) return null;
  used.add(exit);
  const clueList = [];
  if (nD > 1 && L >= 5) {
    const dMax = Math.min(3, 1 + (L - 5 >> 2), nD - 1), dn = ri(0, dMax), cand = [];
    for (let i = 1; i < nD; i++) cand.push(i);
    for (let i = cand.length - 1; i > 0; i--) {
      const j = ri(0, i);
      [cand[i], cand[j]] = [cand[j], cand[i]];
    }
    for (let t = 0; t < dn; t++) {
      const dd = doors[cand[t]];
      dd.isDigital = true;
      dd.code = [ri(0, 9), ri(0, 9), ri(0, 9), ri(0, 9)];
    }
  }
  for (let c = 0; c < nD; c++) {
    const pool = c ? behind(c - 1) : rc[0].q.filter((i) => ok(i) && !used.has(i));
    const dc = doors[c].cells;
    const pf = pool.filter((i) => {
      const [ix, iy, iz] = dec(i);
      return dc.every((d) => {
        const [dx, dy, dz] = dec(d);
        return Math.abs(ix - dx) + Math.abs(iy - dy) + Math.abs(iz - dz) > 3;
      });
    });
    const k = far(pf.length ? pf : pool, rc[c].dist, 0.4 + Math.min(0.3, L * 0.03));
    if (k == null) return null;
    used.add(k);
    if (doors[c].isDigital) {
      keys.push({ i: k, c, isDigi: true });
      clueList.push({ i: k, val: doors[c].code[0], idx: 0, d: c });
      for (let j = 1; j < 4; j++) {
        let cp = (pf.length ? pf.slice() : pool.slice()).filter((x) => !used.has(x));
        if (!cp.length) cp = rc[c].q.filter((x) => ok(x) && !used.has(x));
        if (cp.length) {
          const spot = cp[ri(0, cp.length - 1)];
          clueList.push({ i: spot, val: doors[c].code[j], idx: j, d: c });
          used.add(spot);
        }
      }
    } else keys.push({ i: k, c });
  }
  let score = 0, prev = st0;
  for (const k of keys) {
    const dc = doors[k.c].cells[0];
    score += Math.max(0, bfs(k.c, prev).dist[k.i]);
    score += Math.max(0, bfs(k.c + 1, k.i).dist[dc]);
    prev = dc;
  }
  score += Math.max(0, bfs(nD, prev).dist[exit]);
  const fur = new Map(), lights = [], dk = [];
  let rn = 0;
  for (let c = 0; c < RZ; c++) for (let b = 0; b < RY; b++) for (let a = 0; a < RX; a++) {
    const ph = R() * 6.28;
    let lit = 0;
    rn++;
    const lx = ox(a) + ri(2, 4), ly = oy(b) + (tun ? 1 : ih - 1);
    const lg = R() > (a + b + c ? (L < 3 ? 0.05 : Math.min(0.45, 0.06 + L * 0.02)) + (tun ? 0.4 : 0) : 0);
    let ok2 = 0;
    for (let z = oz(c); z < oz(c) + ip; z++) {
      const q = I(lx, ly, z);
      if (!(s[q] || lad[q] || s[I(lx, ly + 1, z)] != 1)) ok2++;
    }
    if (lg && ok2 >= (tun ? 1 : ip) && (lit = 1)) lights.push({ x: lx, y: ly, z0: oz(c), z1: oz(c) + ip - 1, ph, fl: R() < 0.3 ? 1 : 0, r: 4.2, c: 1 });
    for (let t = ri(1, 3); t > 0; t--) {
      const x = ox(a) + ri(0, iw - 1), z = oz(c) + ri(0, ip - 1), id = I(x, oy(b), z);
      if (s[id] || lad[id] || dset.has(id) || res.has(id) || used.has(id) || fur.has(id) || s[I(x, oy(b) - 1, z)] != 1) continue;
      let ty = ri(0, 5);
      if (ty == 5) {
        const fz = z == oz(c) ? z + 1 : z - 1, fq = I(x, oy(b), fz);
        if (s[fq] || lad[fq] || fur.has(fq)) ty = 0;
      }
      fur.set(id, ty);
      if (ty == 4 && (lit = 1)) lights.push({ x, y: oy(b), z0: z, z1: z, ph, fl: 0, r: 2.3, c: 0 });
    }
    if (!lit && rn > 1) dk.push(rn);
  }
  for (let c = 0; c < RZ; c++) for (let b = 0; b < RY; b++) for (let a = 0; a < RX; a++)
    if (R() < Math.min(0.7, 0.15 + L * 0.05)) {
      const x = ox(a) + ri(2, 4), z = oz(c) + ri(0, ip - 1), y = oy(b), id = I(x, y, z);
      if (s[id] || lad[id] || dset.has(id) || res.has(id) || used.has(id) || fur.has(id) || s[I(x, y - 1, z)] != 1 || s[I(x, y + 1, z)] || s[I(x, y + 2, z)] || y == sy0 && Math.abs(x - sx0) < 4 || dset.has(I(x, y, z - 1)) || dset.has(I(x, y, z + 1))) continue;
      let g = 1;
      for (const d of [-1, 1]) {
        const q = I(x + d, y, z);
        if (s[q] || lad[q] || hz.has(q) || s[I(x + d, y + 1, z)] || s[I(x + d, y - 1, z)] != 1) g = 0;
      }
      if (g) hz.set(id, { ph: R() * 4, tm: R() < 0.4 });
    }
  let vf = true;
  for (let k = 0; k < nD && vf; k++) if (bfs(k).dist[keys[k].i] < 0) vf = false;
  if (vf && bfs(nD).dist[exit] < 0) vf = false;
  if (!vf) hz.clear();
  const mons = [], dks = new Set(dk);
  let lantern = -1;
  if (dk.length) {
    const p = rc[0].q.filter((i) => ok(i) && !used.has(i) && !fur.has(i) && !hz.has(i) && !dks.has(rid[i]));
    if (p.length) {
      lantern = p[ri(0, p.length - 1)];
      used.add(lantern);
    }
  }
  if (L >= 10) {
    const fq = rc[nD].q.filter((i) => {
      if (!ok(i) || used.has(i) || hz.has(i) || fur.has(i)) return false;
      const [x, y, z] = dec(i);
      return s[I(x, y - 1, z)] == 1 && Math.abs(x - sx0) + Math.abs(y - sy0) * 6 > 12 && moves2(x, y, z, () => false).some((m) => m[0] == "l" || m[0] == "r");
    });
    let mc = Math.min(10, 1 + (L - 10 >> 1));
    while (mc > 0 && fq.length) {
      const i = fq.splice(ri(0, fq.length - 1), 1)[0], [x, y, z] = dec(i);
      if (mons.some((M) => Math.abs(M.x - x) + Math.abs(M.y - y) + Math.abs(M.z - z) < 3)) continue;
      mons.push({ x, y, z, dir: R() < 0.5 ? -1 : 1 });
      used.add(i);
      mc--;
    }
  }
  return { W, H, D, L: LL, s, lad, rid, I, dec, st0, exit, doors, dm, keys, moves: moves2, hz, mons, lantern, dk, tun, rooms: n, score, dset, dtop: new Set(dw.map((p) => p[1])), fur, lights, kset: new Map(keys.map((k) => [k.i, k])), clueList };
}
function gen(seed, L) {
  const c = [];
  for (let t = 0; t < (L > 6 ? 2 : 3); t++) {
    const g = genOne(seed + "#" + L + "#" + t, L);
    if (g) c.push(g);
  }
  if (!c.length) return gen(seed + "~", L);
  c.sort((a, b) => a.score - b.score);
  return c[c.length >> 1];
}
function ser(g) {
  return {
    W: g.W,
    H: g.H,
    D: g.D,
    L: g.L,
    s: g.s,
    lad: g.lad,
    rid: g.rid,
    st0: g.st0,
    exit: g.exit,
    rooms: g.rooms,
    score: g.score,
    doors: g.doors.map((d) => ({ c: d.c, cells: [...d.cells], isDigital: !!d.isDigital, code: d.code || null })),
    keys: g.keys,
    dset: [...g.dset],
    dtop: [...g.dtop],
    fur: [...g.fur],
    lights: g.lights,
    hz: [...g.hz],
    mons: g.mons,
    lantern: g.lantern,
    dk: g.dk,
    tun: g.tun,
    clueList: g.clueList
  };
}
function hyd(o) {
  const dm = new Map(), hz = new Map(o.hz);
  o.doors.forEach((d) => d.cells.forEach((i) => dm.set(i, d)));
  const clueMap = new Map();
  (o.clueList || []).forEach((c) => clueMap.set(c.i, c));
  return { ...o, I: (x, y, z) => z * o.L + y * o.W + x, dec: (i) => [i % o.W, (i / o.W | 0) % o.H, i / o.L | 0], dm, hz, dset: new Set(o.dset), dtop: new Set(o.dtop), fur: new Map(o.fur), kset: new Map(o.keys.map((k) => [k.i, k])), moves: mkMoves(o.W, o.H, o.D, o.s, o.lad, dm, hz), clueMap };
}
const WSRC = () => [hash, rng, mkMoves, genOne, gen, ser].map((f) => f.toString()).join("\n") + "\nonmessage=e=>{const g=gen(e.data[0],e.data[1]);postMessage(ser(g),[g.s.buffer,g.lad.buffer,g.rid.buffer])}";
function genAsync(seed, L) {
  return new Promise((res) => {
    let done = 0;
    const fin = (g) => {
      if (!done) {
        done = 1;
        clearTimeout(tm);
        res(g);
      }
    };
    const fb = () => {
      if (!done) setTimeout(() => fin(hyd(ser(gen(seed, L)))), 30);
    };
    const tm = setTimeout(fb, 7e3);
    try {
      if (!wk) wk = new Worker(URL.createObjectURL(new Blob([WSRC()], { type: "text/javascript" })));
      wk.onmessage = (e) => fin(hyd(e.data));
      wk.onerror = () => {
        wk = null;
        fb();
      };
      wk.postMessage([seed, L]);
    } catch (e) {
      wk = null;
      fb();
    }
  });
}
let S, P, F, inv, opened, got, moves, t0, won, level = 1, runSeed = "", playing = false, view = { w: 300, h: 300, cs: 30 }, bind = null, J0 = 0, lives = 3, hurtT = 0, wk, busy = 0, hasL = 0, lanOn = 0, mon = [];
let gotClues = {}, curDigiDoor = null, pinDigits = [], keysDown = new Set(), lastAct = 0;
const cv = $("c"), ctx = cv.getContext("2d");
const say = (t) => $("msg").textContent = t;
const cl = (i) => {
  const d = S.dm.get(i);
  return d && !opened.has(d.c);
};
const overlayOpen = () => [...document.querySelectorAll(".ov")].some((o) => !o.hidden);
const isL = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < S.W && y < S.H && z < S.D && S.lad[S.I(x, y, z)] == 1;
const GS = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d"), q = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  q.addColorStop(0, "rgba(255,220,150,1)");
  q.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = q;
  g.fillRect(0, 0, 128, 128);
  return c;
})();
const DK = Array.from({ length: 11 }, (_, i) => `rgba(5,7,14,${i / 10})`);
const dust = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 0.6 + 0.3, p: Math.random() * 6 }));
function doorf(x, y, c, top, cl2) {
  const ty = y + (top ? c * 0.1 : 0), th = c * (top ? 0.9 : 1) + 0.5;
  ctx.fillStyle = "#6b4a2b";
  ctx.fillRect(x, y, c * 0.1, c + 0.5);
  ctx.fillRect(x + c * 0.9, y, c * 0.1, c + 0.5);
  if (top) ctx.fillRect(x, y, c, c * 0.1);
  if (cl2) {
    ctx.fillStyle = "#8a6035";
    ctx.fillRect(x + c * 0.1, ty, c * 0.8, th);
    ctx.fillStyle = "#5a3e24";
    ctx.fillRect(x + c * 0.5 - 1, ty, 2, th);
    ctx.fillRect(x + c * 0.1, ty + th * 0.5, c * 0.8, 2);
    ctx.fillStyle = "#e8c46a";
    ctx.fillRect(x + c * 0.7, y + c * 0.45, c * 0.06, c * 0.06);
  } else {
    ctx.fillStyle = "#8a6035bb";
    ctx.fillRect(x + c * 0.1, ty, c * 0.16, th);
    ctx.fillStyle = "#e8c46a";
    ctx.fillRect(x + c * 0.2, y + c * 0.5, c * 0.05, c * 0.05);
  }
}
function lock(x, y, c, cell) {
  const cx = x + cell * 0.5, cy = y + cell * 0.55, w = cell * 0.5, h = cell * 0.38;
  ctx.strokeStyle = "#d8dbe6";
  ctx.lineWidth = cell * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.27, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = c;
  ctx.strokeStyle = "#000b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy, w, h, cell * 0.06);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#000a";
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.42, cell * 0.045, 0, 7);
  ctx.fill();
  ctx.fillRect(cx - cell * 0.015, cy + h * 0.45, cell * 0.03, cell * 0.1);
}
function keyG(g, x, y, s, col, bob) {
  g.save();
  g.translate(x + s * 0.5, y + s * 0.5 + bob);
  g.rotate(-0.55);
  g.globalCompositeOperation = "lighter";
  g.fillStyle = col + "44";
  g.beginPath();
  g.arc(0, 0, s * 0.42, 0, 7);
  g.fill();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = col;
  g.strokeStyle = "#000b";
  g.lineWidth = Math.max(1, s * 0.04);
  g.beginPath();
  g.arc(-s * 0.24, 0, s * 0.15, 0, 7);
  g.moveTo(-s * 0.24 + s * 0.065, 0);
  g.arc(-s * 0.24, 0, s * 0.065, 0, 7, true);
  g.fill("evenodd");
  g.stroke();
  g.fillRect(-s * 0.09, -s * 0.04, s * 0.42, s * 0.08);
  g.strokeRect(-s * 0.09, -s * 0.04, s * 0.42, s * 0.08);
  g.fillRect(s * 0.2, s * 0.04, s * 0.07, s * 0.14);
  g.fillRect(s * 0.3, s * 0.04, s * 0.06, s * 0.1);
  g.restore();
}
const spikeOn = (h, t) => !h.tm || Math.floor(t * 0.9 + h.ph) % 2 == 0;
function spk(x, y, c, on) {
  ctx.fillStyle = on ? "#cfd5e6" : "#6b7288";
  const hg = on ? c * 0.55 : c * 0.14;
  for (let i = 0; i < 3; i++) {
    const bx = x + c * (0.1 + i * 0.27);
    ctx.beginPath();
    ctx.moveTo(bx, y + c);
    ctx.lineTo(bx + c * 0.13, y + c - hg);
    ctx.lineTo(bx + c * 0.26, y + c);
    ctx.fill();
  }
  if (on) {
    ctx.fillStyle = "#ef4444";
    for (let i = 0; i < 3; i++) ctx.fillRect(x + c * (0.1 + i * 0.27) + c * 0.1, y + c - hg, c * 0.06, c * 0.06);
  }
}
function drawMon(x, y, c, m, br, cur) {
  ctx.globalAlpha = cur ? 1 : br * 0.85;
  ctx.fillStyle = m.ch ? "#c026d3" : "#7c3aed";
  ctx.strokeStyle = "#2e1065";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x + c * 0.2, y + c * 0.1, c * 0.6, c * 0.9, c * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = m.ch ? "#ff3b3b" : "#fde68a";
  ctx.beginPath();
  ctx.arc(x + c * (0.5 + 0.12 * m.dir), y + c * 0.38, c * 0.1, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#1a0b2e";
  ctx.lineWidth = c * 0.06;
  ctx.beginPath();
  ctx.moveTo(x + c * (0.5 + 0.12 * m.dir - 0.12), y + c * 0.24);
  ctx.lineTo(x + c * (0.5 + 0.12 * m.dir + 0.12), y + c * (m.ch ? 0.3 : 0.22));
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function furn(t, x, y, c) {
  const f = (a, b, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + c * a, y + c * b, c * w, c * h);
  };
  if (t == 0) {
    f(0.08, 0.5, 0.84, 0.1, "#8b5e34");
    f(0.16, 0.6, 0.08, 0.4, "#6b4423");
    f(0.76, 0.6, 0.08, 0.4, "#6b4423");
    f(0.4, 0.38, 0.14, 0.12, "#e8e0c8");
  } else if (t == 1) {
    f(0.25, 0.55, 0.5, 0.1, "#a0522d");
    f(0.25, 0.65, 0.08, 0.35, "#7a3f1d");
    f(0.67, 0.65, 0.08, 0.35, "#7a3f1d");
    f(0.25, 0.2, 0.08, 0.4, "#a0522d");
  } else if (t == 2) {
    f(0.1, 0.04, 0.8, 0.96, "#5a3a22");
    for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) f(0.16 + k * 0.14, 0.1 + r * 0.29, 0.1, 0.22, COL[(r * 5 + k) % 8]);
  } else if (t == 5) {
    f(0.1, 0.04, 0.8, 0.96, "#6e4a2a");
    f(0.14, 0.08, 0.34, 0.88, "#8a6035");
    f(0.52, 0.08, 0.34, 0.88, "#8a6035");
    f(0.4, 0.5, 0.05, 0.12, "#e8c46a");
    f(0.55, 0.5, 0.05, 0.12, "#e8c46a");
  } else if (t == 3) {
    f(0.32, 0.72, 0.36, 0.28, "#b45f3a");
    ctx.fillStyle = "#3fae5a";
    ctx.beginPath();
    ctx.arc(x + c * 0.5, y + c * 0.5, c * 0.2, 0, 7);
    ctx.arc(x + c * 0.35, y + c * 0.6, c * 0.14, 0, 7);
    ctx.arc(x + c * 0.65, y + c * 0.6, c * 0.14, 0, 7);
    ctx.fill();
  } else {
    f(0.47, 0.3, 0.06, 0.7, "#444b60");
    f(0.3, 0.88, 0.4, 0.12, "#444b60");
    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath();
    ctx.moveTo(x + c * 0.28, y + c * 0.38);
    ctx.lineTo(x + c * 0.72, y + c * 0.38);
    ctx.lineTo(x + c * 0.6, y + c * 0.12);
    ctx.lineTo(x + c * 0.4, y + c * 0.12);
    ctx.fill();
  }
}
function item(id, x, y, cell, al) {
  ctx.globalAlpha = al;
  if (S.lad[id]) {
    ctx.strokeStyle = "#c9a86a";
    ctx.lineWidth = Math.max(1, cell * 0.07);
    ctx.beginPath();
    ctx.moveTo(x + cell * 0.25, y);
    ctx.lineTo(x + cell * 0.25, y + cell);
    ctx.moveTo(x + cell * 0.75, y);
    ctx.lineTo(x + cell * 0.75, y + cell);
    for (let k2 = 0; k2 < 4; k2++) {
      ctx.moveTo(x + cell * 0.25, y + cell * (k2 + 0.5) / 4);
      ctx.lineTo(x + cell * 0.75, y + cell * (k2 + 0.5) / 4);
    }
    ctx.stroke();
  }
  const dr = S.dm.get(id);
  if (S.dset.has(id)) doorf(x, y, cell, S.dtop.has(id), dr && !opened.has(dr.c));
  if (dr && !opened.has(dr.c) && id == dr.cells[1]) {
    if (dr.isDigital) {
      const cx = x + cell * 0.5, cy = y + cell * 0.4, w = cell * 0.4, h = cell * 0.5;
      ctx.fillStyle = "#223";
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.fillStyle = COL[dr.c];
      ctx.fillRect(cx - w / 2, cy + h / 2, w, cell * 0.07);
      ctx.fillStyle = "#0f0";
      ctx.fillRect(cx - w / 2 + cell * 0.05, cy - h / 2 + cell * 0.05, w - cell * 0.1, cell * 0.15);
      ctx.fillStyle = "#889";
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ctx.fillRect(cx - w / 2 + cell * 0.07 + i * cell * 0.1, cy - h / 2 + cell * 0.23 + j * cell * 0.08, cell * 0.06, cell * 0.05);
    } else lock(x, y + cell * 0.23, COL[dr.c], cell);
  }
  const hv = S.hz.get(id);
  if (hv) spk(x, y, cell, spikeOn(hv, performance.now() / 1e3));
  const k = S.kset.get(id);
  if (k && !k.isDigi && !got.has(k.c)) keyG(ctx, x, y, cell, COL[k.c], Math.sin(performance.now() / 300 + id) * cell * 0.04);
  const clue = S.clueMap.get(id);
  if (clue && gotClues[clue.d] && gotClues[clue.d][clue.idx] === null) {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(x + cell * 0.25, y + cell * 0.65, cell * 0.5, cell * 0.3);
    ctx.fillStyle = COL[clue.d];
    ctx.fillRect(x + cell * 0.25, y + cell * 0.62, cell * 0.5, cell * 0.05);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(x + cell * 0.38, y + cell * 0.77, cell * 0.24, cell * 0.03);
  }
  if (id == S.lantern && !hasL) {
    ctx.strokeStyle = "#9aa3b8";
    ctx.lineWidth = cell * 0.05;
    ctx.beginPath();
    ctx.arc(x + cell * 0.5, y + cell * 0.3, cell * 0.12, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "#3b3f52";
    ctx.fillRect(x + cell * 0.3, y + cell * 0.3, cell * 0.4, cell * 0.08);
    ctx.fillRect(x + cell * 0.3, y + cell * 0.78, cell * 0.4, cell * 0.08);
    ctx.fillStyle = "#ffd27a";
    ctx.fillRect(x + cell * 0.34, y + cell * 0.38, cell * 0.32, cell * 0.4);
    ctx.fillStyle = "#fff6d0";
    ctx.fillRect(x + cell * 0.44, y + cell * 0.48, cell * 0.12, cell * 0.2);
  }
  if (S.fur.has(id)) furn(S.fur.get(id), x, y, cell);
  if (id == S.exit) {
    ctx.fillStyle = "#fbbf24";
    ctx.font = cell * 0.9 + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", x + cell / 2, y + cell / 2);
  }
  ctx.globalAlpha = 1;
}
function draw() {
  requestAnimationFrame(draw);
  if (!S || !playing) return;
  const { w, h, cs } = view, { W, H, D, s, I, rid } = S, now = performance.now(), t = now / 1e3;
  F.x += (P.x - F.x) * 0.3;
  F.y += (P.y - F.y) * 0.3;
  F.z += (P.z - F.z) * 0.22;
  const hv0 = S.hz.get(I(P.x, P.y, P.z));
  if (hv0 && spikeOn(hv0, t)) hurt();
  let nm = [];
  for (const m of mon) {
    if (now >= m.nt) {
      m.nt = now + (m.ch ? 240 : 480);
      stepMon(m);
    }
    if (m.x == P.x && m.y == P.y && m.z == P.z) hurt("A monster got you!");
    else nm.push(m);
  }
  mon = nm;
  if (view.bgh != h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#141a2e");
    g.addColorStop(1, "#0a0d16");
    view.bg = g;
    view.bgh = h;
  }
  ctx.fillStyle = view.bg;
  ctx.fillRect(0, 0, w, h);
  const cx = F.x + 0.5, cy = F.y + 0.5;
  for (let zz = Math.min(D - 1, Math.floor(F.z) + 4); zz >= Math.max(0, Math.ceil(F.z - 0.45)); zz--) {
    const dz = zz - F.z, sc = 1 / (1 + 0.17 * dz), cell = cs * sc, br = Math.max(0.2, 1 - Math.max(0, dz) * 0.1), cur = Math.abs(dz) < 0.5, wc = [];
    for (let q = 0; q < 10; q++) wc.push(`hsl(${222 + (q >> 1)},${cur ? 20 : 16}%,${(cur ? 40 : 34) * br + (q & 1 ? 2 : 0)}%)`);
    const xa = Math.max(0, Math.floor(cx - w / 2 / cell) - 1), xb = Math.min(W - 1, Math.ceil(cx + w / 2 / cell) + 1);
    const ya = Math.max(0, Math.floor(cy - h / 2 / cell) - 1), yb = Math.min(H - 1, Math.ceil(cy + h / 2 / cell) + 1);
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
      const id = I(x, y, zz), px2 = w / 2 + (x - cx) * cell, py2 = h / 2 - (y + 1 - cy) * cell, v = s[id];
      if (v == 1) {
        ctx.fillStyle = wc[(x * 7 + zz * 13) % 5 * 2 + (x + y & 1)];
        ctx.fillRect(px2, py2, cell + 0.7, cell + 0.7);
        if (cur) {
          ctx.fillStyle = "#ffffff18";
          ctx.fillRect(px2, py2, cell, 2);
          ctx.fillStyle = "#0003";
          ctx.fillRect(px2, py2 + cell - 2, cell, 2);
        }
      } else if (v == 2) {
        ctx.fillStyle = `hsl(30,45%,${(cur ? 38 : 30) * br}%)`;
        ctx.fillRect(px2 + 1, py2 + 1, cell - 2, cell - 2);
        ctx.strokeStyle = `hsl(28,50%,${(cur ? 22 : 18) * br}%)`;
        ctx.lineWidth = Math.max(1, cell * 0.06);
        ctx.strokeRect(px2 + cell * 0.06, py2 + cell * 0.06, cell * 0.88, cell * 0.88);
        ctx.beginPath();
        ctx.moveTo(px2 + cell * 0.1, py2 + cell * 0.1);
        ctx.lineTo(px2 + cell * 0.9, py2 + cell * 0.9);
        ctx.moveTo(px2 + cell * 0.9, py2 + cell * 0.1);
        ctx.lineTo(px2 + cell * 0.1, py2 + cell * 0.9);
        ctx.stroke();
      } else if (v == 3) {
        ctx.fillStyle = `hsl(34,32%,${(cur ? 42 : 34) * br}%)`;
        ctx.fillRect(px2, py2, cell + 0.7, cell + 0.7);
        ctx.fillStyle = `hsl(36,45%,${(cur ? 58 : 44) * br}%)`;
        ctx.fillRect(px2, py2, cell + 0.7, Math.max(2, cell * 0.14));
      } else {
        if (cur && rid[id]) {
          ctx.fillStyle = S.tint[rid[id]] || (S.tint[rid[id]] = `hsla(${rid[id] * 47 % 360},35%,40%,.16)`);
          ctx.fillRect(px2, py2, cell + 0.7, cell + 0.7);
        }
        if (dz < 2.5 && (S.lad[id] || S.dset.has(id) || id == S.exit || S.kset.has(id) || S.clueMap.has(id) || S.fur.has(id) || S.hz.has(id) || id == S.lantern)) item(id, px2, py2, cell, cur ? 1 : br * 0.8);
        if (rid[id] && S.dkA[rid[id]]) {
          let a = 0.92;
          if (lanOn && cur) a = Math.min(0.92, Math.max(0, (Math.hypot(x - P.x, y - P.y) - 1.6) / 3.4) * 0.92);
          if (a > 0.02) {
            ctx.fillStyle = DK[Math.round(a * 10)];
            ctx.fillRect(px2, py2, cell + 0.7, cell + 0.7);
          }
        }
      }
    }
    for (const m of mon) {
      if (m.z != zz) continue;
      m.dx += (m.x - m.dx) * 0.3;
      m.dy += (m.y - m.dy) * 0.3;
      const mx = w / 2 + (m.dx - cx) * cell, my = h / 2 - (m.dy + 1 - cy) * cell;
      if (mx < -cell || mx > w || my < -cell || my > h) continue;
      if (S.dkA[rid[S.I(m.x, m.y, m.z)]] && !(lanOn && cur && Math.hypot(m.x - P.x, m.y - P.y) < 3.4)) continue;
      drawMon(mx, my, cell, m, br, cur);
    }
    if (cur) for (const l of S.lights) {
      if (zz < l.z0 || zz > l.z1 || l.x < xa || l.x > xb || l.y < ya || l.y > yb) continue;
      const px2 = w / 2 + (l.x - cx) * cell, py2 = h / 2 - (l.y + 1 - cy) * cell;
      const v = l.fl ? Math.sin(t * 31 + l.ph * 7) + Math.sin(t * 13.7 + l.ph) + Math.sin(t * 2.3 + l.ph * 3) > 1.7 ? 0.12 : 1 : 0.9 + 0.1 * Math.sin(t * 1.7 + l.ph);
      if (l.c) {
        ctx.fillStyle = "#2a2f40";
        ctx.fillRect(px2 + cell * 0.5 - 1, py2, 2, cell * 0.12);
        ctx.fillStyle = v > 0.5 ? "#ffe9a8" : "#6a6450";
        ctx.beginPath();
        ctx.moveTo(px2 + cell * 0.3, py2 + cell * 0.3);
        ctx.lineTo(px2 + cell * 0.7, py2 + cell * 0.3);
        ctx.lineTo(px2 + cell * 0.6, py2 + cell * 0.12);
        ctx.lineTo(px2 + cell * 0.4, py2 + cell * 0.12);
        ctx.fill();
      }
      const gx = px2 + cell * 0.5, gy = py2 + cell * (l.c ? 0.32 : 0.25), r = cell * l.r;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.4 * v;
      ctx.drawImage(GS, gx - r, gy - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }
  if (lanOn) {
    const r = cs * 4.2, fl = 0.85 + 0.15 * Math.sin(t * 9);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.32 * fl;
    ctx.drawImage(GS, w / 2 - r, h / 2 - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.fillStyle = "#fff3d0";
  for (const d of dust) {
    const dx = (d.x + Math.sin(t * 0.3 + d.p) * 0.02) * w, dy = ((d.y - t * 0.012 * d.s) % 1 + 1) % 1 * h;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(dx, dy, 1.2 * d.s + 0.4, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const jt = (now - J0) / 340, jo = jt < 1 ? Math.sin(jt * Math.PI) * cs * 0.5 : 0, bob = Math.sin(t * 3) * cs * 0.012;
  const px = w / 2 - cs / 2, py = h / 2 - cs / 2 - jo + bob;
  ctx.globalAlpha = hid() ? 0.3 : now < hurtT && Math.floor(now / 90) % 2 ? 0.35 : 1;
  ctx.fillStyle = "#7ed957";
  ctx.strokeStyle = "#2c6b1f";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(px + cs * 0.2, py + cs * 0.1, cs * 0.6, cs * 0.9, cs * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(px + cs * (0.5 + 0.1 * P.fx), py + cs * 0.38, cs * 0.11, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#1a2033";
  ctx.beginPath();
  ctx.arc(px + cs * (0.5 + 0.13 * P.fx), py + cs * 0.38, cs * 0.05, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (now < hurtT - 700) {
    ctx.fillStyle = `rgba(239,68,68,${(hurtT - 700 - now) / 500 * 0.3})`;
    ctx.fillRect(0, 0, w, h);
  }
}
