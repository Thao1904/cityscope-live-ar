// CityScope Live AR: an 8th Wall camera pipeline module.
// 1. A reticle follows the floor; tap to place the CityScope table.
// 2. Tap the table to drop a pin, then describe a change ("add trees here" / "thêm cây chỗ này").
// 3. Swipe the layer bar: Physical, Mine, Community, Overview.
import * as THREE from 'three'

const S = 12, HALF = S / 2
const GROUPS = ['Seniors', 'Families', 'Youth', 'Traders', 'Commuters']
const PERSONA = {name: 'You', g: 1, home: [8, 9], work: [8, 2]}
const LAYERS = [{k: 'phys', n: 'Physical', c: '#ffffff'}, {k: 'mine', n: 'Mine', c: '#ff8a3d'},
  {k: 'comm', n: 'Community', c: '#c9b3ff'}, {k: 'over', n: 'Overview', c: '#7fe0a8'}]
const SCALES = [{n: 'Table', s: 0.1}, {n: 'Room', s: 0.3}, {n: 'Walk-in', s: 1.0}]

// ---------- city layout (cell units) ----------
let seed = 11
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const city = []
for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
  let t
  if (x === 11) t = 'water'
  else if (z === 6 || x === 5) t = 'road'
  else if (x >= 1 && x <= 3 && z >= 7 && z <= 9) t = (x === 1 && z === 9) ? 'res' : 'open'
  else if (x >= 7 && x <= 8 && z >= 2 && z <= 3) t = 'open'
  else if (x === 10 && z >= 7) t = 'open'
  else if (x === 10) t = 'park'
  else if (z < 6 && x > 5) t = rnd() < 0.65 ? 'off' : 'res'
  else t = rnd() < 0.1 ? 'ame' : rnd() < 0.08 ? 'park' : 'res'
  city.push(t)
}
const T = (x, z) => (x < 0 || z < 0 || x >= S || z >= S) ? 'edge' : city[z * S + x]
const C = (x, z) => new THREE.Vector3(x - HALF + 0.5, 0, z - HALF + 0.5)
const TILE = {road: 0x3b3e41, water: 0x4f9cc0, open: 0xcdc6b8, park: 0x79a865, res: 0xd9d4ca, off: 0xd2cec7, ame: 0xd6d2ca}
const CAP = {res: 0xf0c95a, off: 0xe2685a, ame: 0x5b8fe0}

// ---------- objects ----------
const geo = {
  trunk: new THREE.CylinderGeometry(0.025, 0.035, 0.2, 6), canopy: new THREE.IcosahedronGeometry(0.16, 0),
  canopy2: new THREE.ConeGeometry(0.15, 0.34, 7), seat: new THREE.BoxGeometry(0.3, 0.035, 0.1),
  leg: new THREE.BoxGeometry(0.03, 0.07, 0.08), pole: new THREE.CylinderGeometry(0.012, 0.015, 0.5, 6),
  bulb: new THREE.SphereGeometry(0.04, 10, 8), basin: new THREE.CylinderGeometry(0.28, 0.3, 0.08, 20),
  jet: new THREE.CylinderGeometry(0.03, 0.06, 0.3, 10, 1, true), bloom: new THREE.SphereGeometry(0.035, 6, 5),
  umb: new THREE.ConeGeometry(0.22, 0.1, 10), box: new THREE.BoxGeometry(1, 1, 1), ring: new THREE.RingGeometry(0.2, 0.26, 40),
}
const M = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({color, roughness: 0.75}, o))
const FACT = {
  tree() {
    const g = new THREE.Group(), tr = new THREE.Mesh(geo.trunk, M(0x6b4a2f)); tr.position.y = 0.1
    const green = new THREE.Color().setHSL(0.27 + rnd() * 0.07, 0.45, 0.32 + rnd() * 0.1).getHex()
    const c = new THREE.Mesh(rnd() < 0.5 ? geo.canopy : geo.canopy2, M(green, {flatShading: true}))
    c.position.y = 0.3; c.scale.setScalar(0.85 + rnd() * 0.5); g.add(tr, c); return g
  },
  bench() {
    const g = new THREE.Group(), s = new THREE.Mesh(geo.seat, M(0x9a6a43)); s.position.y = 0.07
    const l1 = new THREE.Mesh(geo.leg, M(0x333333)); l1.position.set(-0.12, 0.035, 0)
    const l2 = l1.clone(); l2.position.x = 0.12; g.add(s, l1, l2); g.rotation.y = rnd() * 3; return g
  },
  lamp() {
    const g = new THREE.Group(), p = new THREE.Mesh(geo.pole, M(0x2d3134)); p.position.y = 0.25
    const b = new THREE.Mesh(geo.bulb, M(0xfff1c2, {emissive: 0xffd27a, emissiveIntensity: 1.6})); b.position.y = 0.52
    g.add(p, b); return g
  },
  playground() {
    const g = new THREE.Group()
    const base = new THREE.Mesh(geo.box, M(0xe8a35a)); base.scale.set(0.6, 0.02, 0.6); base.position.y = 0.01
    const tower = new THREE.Mesh(geo.box, M(0x4f8fe0)); tower.scale.set(0.16, 0.3, 0.16); tower.position.set(-0.15, 0.15, 0)
    const slide = new THREE.Mesh(geo.box, M(0xf2d24b)); slide.scale.set(0.32, 0.03, 0.1); slide.position.set(0.05, 0.15, 0); slide.rotation.z = -0.6
    const sw = new THREE.Mesh(geo.box, M(0xe2554b)); sw.scale.set(0.03, 0.25, 0.3); sw.position.set(0.2, 0.12, 0.12)
    g.add(base, tower, slide, sw); return g
  },
  fountain() {
    const g = new THREE.Group(), b = new THREE.Mesh(geo.basin, M(0xbfb8ac)); b.position.y = 0.04
    const w = new THREE.Mesh(geo.jet, M(0x9fd6f0, {transparent: true, opacity: 0.7, roughness: 0.1})); w.position.y = 0.22; w.userData.jet = true
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.01, 20), M(0x5fb2d8, {roughness: 0.1})); pool.position.y = 0.085
    g.add(b, pool, w); return g
  },
  flowers() {
    const g = new THREE.Group(), cols = [0xf27aa6, 0xffd166, 0xf2f2f2, 0xb983ff, 0xff7b54]
    for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(geo.bloom, M(cols[i % 5])); f.position.set((rnd() - 0.5) * 0.4, 0.035, (rnd() - 0.5) * 0.4); g.add(f) }
    return g
  },
  shade() {
    const g = new THREE.Group(), p = new THREE.Mesh(geo.pole, M(0xdddddd)); p.scale.y = 0.6; p.position.y = 0.15
    const u = new THREE.Mesh(geo.umb, M(0xf4efe4)); u.position.y = 0.33; g.add(p, u); return g
  },
  bikelane() {
    const g = new THREE.Group(), s = new THREE.Mesh(geo.box, M(0x3bb273, {roughness: 0.6}))
    s.scale.set(0.9, 0.012, 0.22); s.position.y = 0.006; g.add(s); return g
  },
}
const LABEL = {tree: ['tree', 'trees'], bench: ['bench', 'benches'], lamp: ['street light', 'street lights'], playground: ['playground', 'playgrounds'],
  fountain: ['fountain', 'fountains'], flowers: ['flower bed', 'flower beds'], shade: ['shade umbrella', 'shade umbrellas'], bikelane: ['bike lane', 'bike lane segments']}
const DEFAULT_N = {tree: 5, bench: 3, lamp: 4, playground: 1, fountain: 1, flowers: 3, shade: 3, bikelane: 3}
const PREF = {tree: [0.9, 0.85, 0.8, 0.6, 0.75], bench: [0.95, 0.7, 0.55, 0.6, 0.6], lamp: [0.85, 0.85, 0.75, 0.7, 0.8], playground: [0.4, 0.95, 0.55, 0.45, 0.5],
  fountain: [0.7, 0.8, 0.75, 0.55, 0.6], flowers: [0.85, 0.7, 0.6, 0.6, 0.55], shade: [0.85, 0.75, 0.7, 0.8, 0.65], bikelane: [0.3, 0.6, 0.92, 0.28, 0.72]}

// ---------- request parsing (English + Vietnamese) ----------
const DICT = [
  ['tree', /\b(trees?|greenery|green)\b|cây|xanh/i], ['bench', /\bbench(es)?\b|ghế|chỗ ngồi/i],
  ['lamp', /\b(lamps?|lights?|lighting|street ?lights?)\b|đèn|sáng/i],
  ['playground', /\bplay ?ground|kids|children|swing|slide\b|sân chơi|trẻ em|cầu trượt/i],
  ['fountain', /\bfountain|water feature\b|đài phun|phun nước/i], ['flowers', /\bflowers?|garden|plants?\b|hoa|vườn/i],
  ['shade', /\bumbrellas?|canop(y|ies)|shelter\b|ô che|mái che|bóng mát/i], ['bikelane', /\bbike|bicycle|cycl(e|ing)\b|xe đạp/i],
]
const NUMW = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10, 'một': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'năm': 5, 'sáu': 6, 'mười': 10}
function parse(txt) {
  const lower = txt.toLowerCase(), items = []
  let qty = null
  const m = lower.match(/\b(\d{1,2})\b/)
  if (m) qty = +m[1]
  else for (const [w, v] of Object.entries(NUMW)) if (new RegExp(`(^|\\s)${w}(\\s|$)`).test(lower)) { qty = v; break }
  const many = /\b(more|lots|many|plenty)\b|nhiều/.test(lower), few = /\b(a few|some|couple)\b|vài|một ít/.test(lower)
  DICT.forEach(([t, re]) => {
    if (!re.test(lower)) return
    let n = qty ?? DEFAULT_N[t]
    if (qty === null) { if (many) n = Math.round(DEFAULT_N[t] * 1.6); if (few) n = Math.max(1, Math.round(DEFAULT_N[t] * 0.6)) }
    items.push({t, n: Math.min(n, t === 'tree' ? 14 : 8)})
  })
  return items
}
const titleFor = items => items.map(i => `${i.n} ${LABEL[i.t][i.n > 1 ? 1 : 0]}`).join(' + ')

// ---------- easing / tweens ----------
const tweens = []
const tween = (dur, fn, delay = 0) => new Promise(res => tweens.push({t0: performance.now() + delay, dur, fn, res}))
const backOut = k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2) }
const cubicOut = k => 1 - Math.pow(1 - k, 3)
const bounceOut = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375 }

export const cityscopePipelineModule = () => {
  let scene, camera, renderer, canvas
  const root = new THREE.Group()        // the whole table; scaled to real-world meters
  const raycaster = new THREE.Raycaster(), center = new THREE.Vector2(0, 0)
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  let reticle, placed = false, scaleIdx = 0, layer = 0, wipe = null, pin = null
  let pinG, pinHead, beacon, hitPlane, ovTex, octx, waterMat
  const OV = 768, bufs = []
  const props = []; let pid = 0
  const residents = Array.from({length: 25}, (_, i) => ({g: i % 5, bias: (rnd() - 0.5) * 0.3}))
  const $ = id => document.getElementById(id)

  // ----- build the table -----
  function buildTable() {
    const wood = new THREE.MeshStandardMaterial({color: 0x7a5236, roughness: 0.7})
    const slab = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.5, 13.6), wood); slab.position.y = -0.25; slab.castShadow = slab.receiveShadow = true; root.add(slab)
    const plateG = new THREE.BoxGeometry(0.97, 0.08, 0.97), boxG = new THREE.BoxGeometry(0.8, 1, 0.8), capG = new THREE.BoxGeometry(0.8, 0.02, 0.8)
    const bMat = new THREE.MeshStandardMaterial({color: 0xefece6, roughness: 0.85})
    waterMat = new THREE.MeshStandardMaterial({color: TILE.water, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9})
    city.forEach((t, i) => {
      const x = i % S, z = (i / S) | 0, p = C(x, z)
      const plate = new THREE.Mesh(plateG, t === 'water' ? waterMat : new THREE.MeshStandardMaterial({color: TILE[t], roughness: 0.9}))
      plate.position.set(p.x, 0.04, p.z); plate.receiveShadow = true; root.add(plate)
      if (CAP[t]) {
        const h = t === 'off' ? 1.6 + rnd() * 1.6 : t === 'ame' ? 0.7 : 0.6 + rnd() * 0.9
        const b = new THREE.Mesh(boxG, bMat); b.scale.y = h; b.position.set(p.x, 0.08 + h / 2, p.z); b.castShadow = b.receiveShadow = true; root.add(b)
        const cap = new THREE.Mesh(capG, new THREE.MeshBasicMaterial({color: CAP[t]})); cap.position.set(p.x, 0.08 + h + 0.011, p.z); root.add(cap)
      }
    })
    // projection overlay
    const ov = document.createElement('canvas'); ov.width = ov.height = OV; octx = ov.getContext('2d')
    for (let i = 0; i < 2; i++) { const c = document.createElement('canvas'); c.width = c.height = OV; bufs.push(c) }
    ovTex = new THREE.CanvasTexture(ov); ovTex.colorSpace = THREE.SRGBColorSpace
    const ovMesh = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshBasicMaterial({map: ovTex, transparent: true, depthWrite: false}))
    ovMesh.rotation.x = -Math.PI / 2; ovMesh.position.y = 0.085; ovMesh.renderOrder = 2; root.add(ovMesh)
    // invisible hit plane for pin taps
    hitPlane = new THREE.Mesh(new THREE.PlaneGeometry(S, S), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false}))
    hitPlane.rotation.x = -Math.PI / 2; hitPlane.position.y = 0.09; root.add(hitPlane)
    // pin
    pinG = new THREE.Group()
    pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M(0xffd166, {emissive: 0xffb020, emissiveIntensity: 0.6})); pinHead.position.y = 0.55
    const stem = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 12), M(0xffd166)); stem.rotation.x = Math.PI; stem.position.y = 0.28
    pinG.add(pinHead, stem); pinG.visible = false; root.add(pinG)
    // home beacon for the Mine layer
    beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3, 24, 1, true),
      new THREE.MeshBasicMaterial({color: 0xff8a3d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}))
    const hp = C(...PERSONA.home); beacon.position.set(hp.x, 1.6, hp.z); root.add(beacon)
    root.visible = false
  }

  // ----- proposals -----
  function spots(cell, n, type) {
    const [cx, cz] = cell, out = []
    const ok = (x, z) => { const t = T(x, z); return t !== 'edge' && !CAP[t] && t !== 'water' }
    if (type === 'bikelane') {
      let rx = cx, rz = cz, horiz = true
      if (T(cx, cz) === 'road') horiz = T(cx - 1, cz) === 'road' || T(cx + 1, cz) === 'road'
      else if (Math.abs(cx - 5) < Math.abs(cz - 6)) { rx = 5; horiz = false } else { rz = 6 }
      for (let k = 0; k < n; k++) {
        const off = k - Math.floor(n / 2), x = horiz ? rx + off : rx, z = horiz ? rz : rz + off
        if (T(x, z) === 'road') out.push({p: C(x, z).add(new THREE.Vector3(horiz ? 0 : 0.3, 0, horiz ? 0.3 : 0)), rot: horiz ? 0 : Math.PI / 2})
      }
      return out
    }
    let tries = 0
    while (out.length < n && tries < 300) {
      tries++
      const r = Math.sqrt(rnd()) * (1.1 + n * 0.08), a = rnd() * 6.283
      const fx = cx + 0.5 + Math.cos(a) * r, fz = cz + 0.5 + Math.sin(a) * r, x = Math.floor(fx), z = Math.floor(fz)
      if (!ok(x, z)) continue
      if (T(x, z) === 'road' && type !== 'lamp' && type !== 'tree') continue
      const p = new THREE.Vector3(fx - HALF, 0, fz - HALF)
      const minD = (type === 'playground' || type === 'fountain') ? 0.7 : 0.22
      if (out.some(o => o.p.distanceTo(p) < minD)) continue
      out.push({p})
    }
    return out
  }
  function addProposal(items, text, cell, mine, preset) {
    const p = {id: ++pid, items, text, cell, mine, objs: [], mats: [], yes: [0, 0, 0, 0, 0], no: [0, 0, 0, 0, 0], barH: 0, fresh: !preset}
    props.unshift(p)
    let delay = 0
    items.forEach(it => {
      const pts = spots(cell, it.n, it.t)
      pts.forEach((s, k) => {
        const o = FACT[it.t](); o.position.copy(s.p).setY(0.08); if (s.rot !== undefined) o.rotation.y = s.rot
        o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.material = m.material.clone(); m.material.userData.base = m.material.opacity; p.mats.push(m.material) } })
        root.add(o); p.objs.push(o)
        if (preset) return
        o.scale.setScalar(0.001)
        const d = delay + k * 110
        tween(700, kk => o.scale.setScalar(Math.max(0.001, backOut(kk))), d)
        setTimeout(() => { ripple(o.position, 0x9fffb8); buzz(8) }, d)
      })
      delay += pts.length * 110 + 150
    })
    const bar = new THREE.Mesh(geo.box, new THREE.MeshStandardMaterial({color: 0x9b6bff, emissive: 0x5a2fd0, emissiveIntensity: 0.35, transparent: true, opacity: 0.85}))
    bar.scale.set(0.18, 0.001, 0.18); bar.position.copy(C(...cell)).add(new THREE.Vector3(0.38, 0, -0.38)); bar.visible = false; root.add(bar); p.bar = bar
    if (preset) residents.forEach(r => vote(p, r))
    else residents.forEach(r => setTimeout(() => { vote(p, r); renderIdeas() }, 1400 + rnd() * 5200))
    renderIdeas()
  }
  function supportProb(p, g) {
    let s = 0, n = 0; p.items.forEach(it => { s += PREF[it.t][g] * it.n; n += it.n })
    let v = n ? s / n : 0.5
    if (T(...p.cell) === 'road' && !p.items.some(i => i.t === 'bikelane')) v -= 0.15
    return v
  }
  const vote = (p, r) => { (rnd() < supportProb(p, r.g) + r.bias ? p.yes : p.no)[r.g]++ }
  function stats(p) {
    const ga = GROUPS.map((_, g) => { const n = p.yes[g] + p.no[g]; return n ? p.yes[g] / n : null })
    const Y = p.yes.reduce((a, b) => a + b, 0), tot = Y + p.no.reduce((a, b) => a + b, 0)
    const valid = ga.filter(v => v !== null), minG = valid.length ? Math.min(...valid) : 0, all = tot ? Y / tot : 0
    let st = 'collect'
    if (tot >= 8 && valid.length === 5) st = minG >= 0.5 ? 'good' : all >= 0.5 ? 'warn' : 'bad'
    return {tot, all, minG, minIdx: ga.indexOf(minG), st}
  }
  const ST = {collect: ['Collecting votes', '#8b98a0'], good: ['Common ground', '#2fb36f'], warn: ['Majority only', '#e7a321'], bad: ['Contested', '#e2554b']}

  // ----- feedback -----
  function ripple(pos, color = 0xffd166) {
    const r = new THREE.Mesh(geo.ring, new THREE.MeshBasicMaterial({color, transparent: true, side: THREE.DoubleSide, depthWrite: false}))
    r.rotation.x = -Math.PI / 2; r.position.copy(pos).setY(0.1); root.add(r)
    tween(900, k => { r.scale.setScalar(1 + k * 4); r.material.opacity = 1 - k }).then(() => root.remove(r))
  }
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms) } catch (e) {} }
  let ht
  function hint(m) { const h = $('hint'); h.textContent = m; h.style.opacity = 1; clearTimeout(ht); ht = setTimeout(() => { h.style.opacity = 0 }, 3800) }
  function status(m, ok) { const s = $('status'); s.querySelector('span').textContent = m; s.classList.toggle('ok', !!ok) }
  function renderIdeas() {
    $('ideas').innerHTML = props.slice(0, 3).map(p => {
      const s = stats(p), [lab, col] = ST[s.st]
      return `<div class="idea" style="--c:${col}"><b>${p.text}</b>${lab} · ${Math.round(s.all * 100)}% · ${s.tot} votes</div>`
    }).join('')
  }

  // ----- overlay drawing -----
  const px = c => c / S * OV
  function drawLayer(k, c, t) {
    const g = c.getContext('2d'); g.clearRect(0, 0, OV, OV)
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.setLineDash([10, 10])
    g.beginPath(); g.moveTo(0, px(6.5)); g.lineTo(px(11), px(6.5)); g.moveTo(px(5.5), 0); g.lineTo(px(5.5), OV); g.stroke(); g.setLineDash([])
    if (k === 'phys') {
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1
      for (let i = 1; i < S; i++) { g.beginPath(); g.moveTo(px(i), 0); g.lineTo(px(i), OV); g.moveTo(0, px(i)); g.lineTo(OV, px(i)); g.stroke() }
    }
    if (k === 'mine') {
      const [hx, hz] = PERSONA.home, cx = px(hx + 0.5), cz = px(hz + 0.5), R = px(3.2)
      const gr = g.createRadialGradient(cx, cz, 0, cx, cz, R)
      gr.addColorStop(0, 'rgba(255,138,61,.55)'); gr.addColorStop(0.75, 'rgba(255,138,61,.18)'); gr.addColorStop(1, 'rgba(255,138,61,0)')
      g.fillStyle = gr; g.fillRect(0, 0, OV, OV)
      g.strokeStyle = 'rgba(255,170,110,.95)'; g.lineWidth = 3; g.setLineDash([12, 9]); g.lineDashOffset = -t / 40
      g.beginPath(); g.arc(cx, cz, R * 0.92, 0, 7); g.stroke(); g.setLineDash([])
      const [wx, wz] = PERSONA.work
      const pts = [[hx, hz], [hx, 6], [5, 6], [5, wz], [wx, wz]].map(([x, z]) => [px(x + 0.5), px(z + 0.5)])
      g.lineWidth = 7; g.strokeStyle = 'rgba(255,138,61,.9)'; g.lineCap = 'round'; g.lineJoin = 'round'
      g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo(x, z) : g.moveTo(x, z)); g.stroke()
      const segs = []; let L = 0
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); L += d }
      let s = (t / 12) % L, i = 0
      while (i < segs.length && s > segs[i]) { s -= segs[i]; i++ }
      if (i < segs.length) { const a = pts[i], b = pts[i + 1], q = s / segs[i]; g.fillStyle = '#fff'; g.beginPath(); g.arc(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, 7, 0, 7); g.fill() }
      props.filter(p => p.mine).forEach(p => { g.strokeStyle = '#ff8a3d'; g.lineWidth = 4; g.beginPath(); g.arc(px(p.cell[0] + 0.5), px(p.cell[1] + 0.5), px(1.1), 0, 7); g.stroke() })
    }
    if (k === 'comm') {
      const wishes = [[2, 8, 0.8], [9, 9, 0.6], [1, 3, 0.5], [8, 1, 0.4]]
      ;[...wishes, ...props.map(p => { const s = stats(p); return [p.cell[0], p.cell[1], 0.3 + s.all * 0.9 * (s.tot / 25)] })].forEach(([x, z, w]) => {
        const cx = px(x + 0.5), cz = px(z + 0.5), R = px(2.2) * (0.9 + 0.08 * Math.sin(t / 500 + x))
        const gr = g.createRadialGradient(cx, cz, 0, cx, cz, R); gr.addColorStop(0, `rgba(155,107,255,${0.55 * w})`); gr.addColorStop(1, 'rgba(155,107,255,0)')
        g.fillStyle = gr; g.fillRect(cx - R, cz - R, 2 * R, 2 * R)
      })
      props.forEach(p => {
        const ph = (t / 900 + p.id * 0.3) % 1
        g.strokeStyle = `rgba(200,175,255,${1 - ph})`; g.lineWidth = 3; g.beginPath(); g.arc(px(p.cell[0] + 0.5), px(p.cell[1] + 0.5), px(0.4 + ph * 1.2), 0, 7); g.stroke()
      })
    }
    if (k === 'over') {
      props.forEach(p => {
        const col = ST[stats(p).st][1], cx = px(p.cell[0] + 0.5), cz = px(p.cell[1] + 0.5)
        const gr = g.createRadialGradient(cx, cz, px(0.3), cx, cz, px(1.5)); gr.addColorStop(0, col + '66'); gr.addColorStop(1, col + '00')
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cz, px(1.5), 0, 7); g.fill()
        g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.arc(cx, cz, px(1.2), 0, 7); g.stroke()
      })
    }
  }
  function composeOverlay(t) {
    if (wipe) {
      const k = Math.min(1, (t - wipe.t0) / 750), x = cubicOut(k) * (OV + 80) - 40
      drawLayer(LAYERS[wipe.from].k, bufs[0], t); drawLayer(LAYERS[wipe.to].k, bufs[1], t)
      octx.clearRect(0, 0, OV, OV)
      octx.save(); octx.beginPath(); octx.rect(Math.max(0, x), 0, OV, OV); octx.clip(); octx.drawImage(bufs[0], 0, 0); octx.restore()
      octx.save(); octx.beginPath(); octx.rect(0, 0, Math.max(0, x), OV); octx.clip(); octx.drawImage(bufs[1], 0, 0); octx.restore()
      const gr = octx.createLinearGradient(x - 40, 0, x + 6, 0); gr.addColorStop(0, 'rgba(255,209,102,0)'); gr.addColorStop(1, 'rgba(255,235,170,.95)')
      octx.fillStyle = gr; octx.fillRect(x - 40, 0, 46, OV)
      if (k >= 1) wipe = null
    } else { drawLayer(LAYERS[layer].k, bufs[0], t); octx.clearRect(0, 0, OV, OV); octx.drawImage(bufs[0], 0, 0) }
    ovTex.needsUpdate = true
  }

  // ----- 3D state per layer -----
  function apply3D(dt) {
    const L = LAYERS[layer].k, f = Math.min(1, dt * 5)
    beacon.material.opacity += ((L === 'mine' ? 0.35 : 0) - beacon.material.opacity) * f
    props.forEach(p => {
      const s = stats(p), target = L === 'comm' ? Math.max(0.02, s.all * (s.tot / 25) * 2.2) : 0
      p.barH += (target - p.barH) * f; p.bar.visible = p.barH > 0.01; p.bar.scale.y = Math.max(0.001, p.barH); p.bar.position.y = 0.08 + p.barH / 2
      const op = (L === 'over' && s.st === 'bad') ? 0.28 : (L === 'mine' && !p.mine) ? 0.55 : 1
      p.mats.forEach(m => {
        const goal = Math.min(op, m.userData.base), tr = goal < 1
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true }
        m.opacity += (goal - m.opacity) * f; m.depthWrite = m.opacity > 0.6
      })
    })
  }

  // ----- labels -----
  const labs = new Map()
  function updLabels() {
    const box = $('labels'), w = innerWidth, h = innerHeight, want = []
    if (placed) {
      const L = LAYERS[layer].k
      if (L === 'mine') {
        want.push({id: 'home', pos: C(...PERSONA.home).setY(1.2), html: 'Your home', c: '#ff8a3d'})
        want.push({id: 'work', pos: C(...PERSONA.work).setY(0.5), html: 'Daily destination', c: '#ffb27f'})
      }
      props.forEach(p => {
        const s = stats(p), pos = C(...p.cell).setY(L === 'comm' ? 0.4 + p.barH : 0.75)
        if (L === 'comm') want.push({id: 'p' + p.id, pos, html: `<b>${Math.round(s.all * 100)}%</b> support · ${s.tot} votes`, c: '#c9b3ff'})
        else if (L === 'over') want.push({id: 'p' + p.id, pos, html: ST[s.st][0], c: ST[s.st][1]})
        else if (L === 'mine' && p.mine) want.push({id: 'p' + p.id, pos, html: 'Your idea · ' + p.text, c: '#ff8a3d'})
        else if (L === 'phys' && p.fresh) want.push({id: 'p' + p.id, pos, html: p.text, c: '#ffffff'})
      })
    }
    const seen = new Set()
    want.forEach(o => {
      seen.add(o.id)
      let el = labs.get(o.id)
      if (!el) { el = document.createElement('div'); el.className = 'lab'; box.appendChild(el); labs.set(o.id, el) }
      if (el._h !== o.html) { el.innerHTML = o.html; el._h = o.html }
      el.style.borderColor = o.c; el.style.color = o.c
      const v = root.localToWorld(o.pos.clone()).project(camera)
      el.style.left = ((v.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - v.y) / 2 * h) + 'px'; el.style.opacity = v.z < 1 ? 1 : 0
    })
    labs.forEach((el, id) => { if (!seen.has(id)) { el.remove(); labs.delete(id) } })
  }

  // ----- layers UI -----
  function positionTrack() {
    const track = $('track'), b = track.children[layer]
    track.style.transform = `translateX(${-(b.offsetLeft + b.offsetWidth / 2)}px)`
    ;[...track.children].forEach((x, i) => x.setAttribute('aria-pressed', i === layer))
  }
  let lnT
  function setLayer(i) {
    i = Math.max(0, Math.min(LAYERS.length - 1, i)); if (i === layer) return
    wipe = {from: layer, to: i, t0: performance.now()}; layer = i; positionTrack(); buzz(12)
    const ln = $('layername'); ln.textContent = LAYERS[i].n; ln.style.color = LAYERS[i].c; ln.style.opacity = 1
    clearTimeout(lnT); lnT = setTimeout(() => { ln.style.opacity = 0 }, 700)
  }
  function setupUI() {
    $('hud').hidden = false
    const track = $('track')
    LAYERS.forEach((l, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = l.n; b.onclick = () => setLayer(i); track.appendChild(b) })
    requestAnimationFrame(positionTrack)
    const lb = $('layerbar'); let sx = null
    lb.addEventListener('pointerdown', e => { sx = e.clientX; lb.setPointerCapture(e.pointerId) })
    lb.addEventListener('pointermove', e => {
      if (sx === null) return
      const b = track.children[layer]; track.style.transition = 'none'
      track.style.transform = `translateX(${-(b.offsetLeft + b.offsetWidth / 2) + (e.clientX - sx)}px)`
    })
    lb.addEventListener('pointerup', e => {
      if (sx === null) return
      const dx = e.clientX - sx; sx = null; track.style.transition = ''
      if (Math.abs(dx) > 28) setLayer(layer + (dx < 0 ? 1 : -1))
      else { positionTrack(); const el = document.elementFromPoint(e.clientX, e.clientY); if (el && el.parentElement === track) setLayer([...track.children].indexOf(el)) }
    })
    lb.addEventListener('pointercancel', () => { sx = null; track.style.transition = ''; positionTrack() })
    window.addEventListener('resize', () => requestAnimationFrame(positionTrack))

    $('ask').addEventListener('submit', e => { e.preventDefault(); submit($('askin').value); $('askin').blur() })
    ;['Add trees here', 'Thêm cây chỗ này', 'A playground for kids', 'More street lights', 'Benches and shade', 'Bike lane here'].forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.onclick = () => submit(s); $('sugs').appendChild(b)
    })
    $('scaleBtn').onclick = () => {
      scaleIdx = (scaleIdx + 1) % SCALES.length; $('scaleBtn').textContent = 'Size: ' + SCALES[scaleIdx].n
      const from = root.scale.x, to = SCALES[scaleIdx].s
      tween(600, k => root.scale.setScalar(from + (to - from) * cubicOut(k)))
    }
    $('moveBtn').onclick = () => { placed = false; reticle.visible = true; hint('Point at the floor and tap to place the table again.'); status('Tap the floor to place the table') }
  }

  function submit(txt) {
    txt = (txt || '').trim(); if (!txt) return
    if (!placed) { hint('Place the table first: tap the floor.'); return }
    if (!pin) { hint('Tap a spot on the table first.'); $('askin').value = txt; return }
    const items = parse(txt)
    if (!items.length) { hint('Try trees, benches, lights, a playground, a fountain, flowers, shade or a bike lane.'); return }
    if (layer !== 0) setLayer(0)
    $('askin').value = ''
    addProposal(items, titleFor(items), pin.slice(), true, false)
    hint(`Added ${titleFor(items)}. Neighbors are voting. Swipe to Community to watch.`)
    pinG.visible = false; pin = null
  }

  // ----- taps -----
  function screenToNdc(x, y) { return new THREE.Vector2((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1) }
  function onTap(x, y) {
    if (!placed) {
      if (!reticle.visible) return
      root.position.copy(reticle.position); root.rotation.y = Math.atan2(camera.position.x - reticle.position.x, camera.position.z - reticle.position.z)
      root.visible = true; placed = true; reticle.visible = false
      const s = SCALES[scaleIdx].s; root.scale.setScalar(0.001)
      tween(900, k => root.scale.setScalar(Math.max(0.001, backOut(k) * s)))
      buzz(20); status('Table placed', true); hint('Tap a spot on the table, then describe what you want there.')
      return
    }
    raycaster.setFromCamera(screenToNdc(x, y), camera)
    const hit = raycaster.intersectObject(hitPlane)[0]
    if (!hit) return
    const local = root.worldToLocal(hit.point.clone()), cx = Math.floor(local.x + HALF), cz = Math.floor(local.z + HALF)
    if (cx < 0 || cz < 0 || cx >= S || cz >= S) return
    pin = [cx, cz]; const p = C(cx, cz); pinG.position.copy(p); pinG.visible = true
    tween(650, k => { pinG.position.y = 0.08 + (1 - bounceOut(k)) * 2.2 }); setTimeout(() => { ripple(p); buzz(10) }, 420)
    hint('Pinned. Now say what you want here, or tap a suggestion.')
  }

  return {
    name: 'cityscope',
    onStart: ({canvas: cv}) => {
      canvas = cv
      ;({scene, camera, renderer} = XR8.Threejs.xrScene())
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap

      scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2e25, 1.2))
      const sun = new THREE.DirectionalLight(0xffe2c0, 2.2); sun.position.set(2, 6, 1.5); sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left: -3, right: 3, top: 3, bottom: -3, near: 0.1, far: 20}); sun.shadow.bias = -0.0005
      scene.add(sun, sun.target)

      // shadow catcher on the real floor
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({opacity: 0.45}))
      floor.receiveShadow = true; scene.add(floor)

      reticle = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: 0xffd166, transparent: true, opacity: 0.9}))
      reticle.visible = false; scene.add(reticle)

      buildTable(); root.scale.setScalar(SCALES[0].s); scene.add(root)
      addProposal([{t: 'tree', n: 7}, {t: 'bench', n: 2}], 'Shady riverside walk', [10, 8], false, true)
      addProposal([{t: 'bikelane', n: 4}], 'Bike lane on Main Street', [8, 6], false, true)
      addProposal([{t: 'playground', n: 1}, {t: 'flowers', n: 2}], 'Playground on the market lot', [2, 8], false, true)

      camera.position.set(0, 1.4, 0)   // phone at roughly chest height
      XR8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion})

      setupUI()
      status('Move your phone slowly, then tap the floor')

      canvas.addEventListener('touchmove', e => e.preventDefault())
      let down = null
      canvas.addEventListener('pointerdown', e => { down = {x: e.clientX, y: e.clientY, t: performance.now()} })
      canvas.addEventListener('pointerup', e => {
        if (!down) return
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null
        if (moved < 10 && dt < 500) onTap(e.clientX, e.clientY)
      })
    },
    onUpdate: () => {
      if (!scene) return
      const t = performance.now(), dt = 1 / 60
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i]; if (t < tw.t0) continue
        const k = Math.min(1, (t - tw.t0) / tw.dur); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.res() }
      }
      if (!placed) {
        raycaster.setFromCamera(center, camera)
        const hit = new THREE.Vector3()
        if (raycaster.ray.intersectPlane(ground, hit) && hit.distanceTo(camera.position) < 6) {
          reticle.position.copy(hit); reticle.visible = true
          reticle.scale.setScalar(1 + 0.08 * Math.sin(t / 200))
        } else reticle.visible = false
      }
      root.traverse(o => { if (o.userData.jet) o.scale.y = 0.85 + 0.25 * Math.sin(t / 120 + o.id) })
      waterMat.color.setHSL(0.55, 0.45, 0.48 + 0.03 * Math.sin(t / 900))
      pinHead.position.y = 0.55 + 0.04 * Math.sin(t / 250)
      apply3D(dt); composeOverlay(t); updLabels()
    },
  }
}
