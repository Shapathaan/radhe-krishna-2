import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { RotateCcw, Play, Square, Orbit, X, ArrowLeft, MessageCircle } from 'lucide-react'
import { SITE_OUTLINE, ROAD, ROAD_CENTERLINES, PLOTS, COMMONS } from '../data/siteGeometry'
import { PLOT_DETAILS, COMMON_DETAILS, AVAILABILITY_CONNECTED } from '../data/plotDetails'
import { useLang } from '../lib/i18n'
import { prefersReduced } from '../lib/motion'

/* ───────────────────────── helpers ───────────────────────── */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const prog = (t, a, b) => clamp((t - a) / (b - a))
const ease = (x) => 1 - Math.pow(1 - x, 3)
const isMobile = () =>
  typeof window !== 'undefined' &&
  (window.innerWidth < 820 || window.matchMedia('(pointer: coarse)').matches)

function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], -p[1])))
  holes.forEach((h) => s.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2(p[0], -p[1])))))
  return s
}
// Extrude along +Y (up). Shape plane -> world XZ, with world z = original p[1].
function extrude(shape, depth, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 4,
  })
  g.rotateX(-Math.PI / 2)
  return g
}
const bounds = (pts) => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  pts.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) })
  return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, h: z1 - z0 }
}
// The source geometry is raster-traced and explicitly illustrative. These
// figures are visual estimates from its 1 scene-unit = 10 ft scale, not legal dimensions.
function polygonAreaSqft(points) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i]
    const [x2, z2] = points[(i + 1) % points.length]
    area += x1 * z2 - x2 * z1
  }
  return Math.round(Math.abs(area) * 50)
}
function inPoly(x, z, poly) {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}
function rng(seed) {
  let s = seed
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

/* ───────────────────────── layout constants ───────────────────────── */
const SITE = bounds(SITE_OUTLINE)
const GROUND_H = 0.3
const ROAD_H = 0.12
const PLOT_H = 0.45
const LAWN_H = 0.2
const ROAD_TOP = GROUND_H + ROAD_H

const ZONE_PTS = (key) => {
  if (key === 'commons') return COMMONS.flatMap((c) => c.p)
  if (key === 'eastCommons') return [...PLOTS.filter((p) => p.zone === 'east').flatMap((p) => p.p), ...COMMONS[1].p]
  return PLOTS.filter((p) => p.zone === key).flatMap((p) => p.p)
}
const ZONES = Object.fromEntries(['north', 'west', 'east', 'south', 'commons', 'eastCommons'].map((k) => [k, bounds(ZONE_PTS(k))]))

const overviewGoal = (mobile) => ({
  pos: mobile ? [6, 84, 100] : [14, 34, 46],
  target: [0, 0.4, 0],
})
function zoneGoal(key) {
  const z = ZONES[key]
  const d = Math.max(z.w * 0.62, z.h * 1.5) + 11
  return { pos: [z.cx + d * 0.12, d * 0.78, z.cz + d * 0.92], target: [z.cx, 0.5, z.cz] }
}
function plotGoal(c) {
  return { pos: [c[0] + 1.2, 8, c[1] + 9.5], target: [c[0], 0.5, c[1]] }
}

// timeline (seconds)
const T = { base: [0, 1.2], trace: 1.0, roadFill: [2.4, 3.4], plots: 3.0, lawns: [3.8, 4.7], trees: [4.9, 6.0], lamps: [5.3, 6.3], light: [5.0, 6.6], camera: 4.4, end: 7 }

/* ───────────────────────── scene pieces ───────────────────────── */
function Driver({ tl, active, reduced, onCamera }) {
  useFrame((_, dt) => {
    if (!active) return
    const d = Math.min(dt, 0.05)
    tl.current.t = reduced ? T.end + 1 : Math.min(tl.current.t + d, T.end + 1)
    if (!tl.current.camDone && tl.current.t >= T.camera) {
      tl.current.camDone = true
      onCamera()
    }
  })
  return null
}

const CameraRig = forwardRef(function CameraRig(_, ref) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  const goal = useRef(null)
  useImperativeHandle(ref, () => ({
    fly(g, speed = 3) {
      goal.current = { pos: new THREE.Vector3(...g.pos), target: new THREE.Vector3(...g.target), speed }
    },
    cancel() { goal.current = null },
  }), [])
  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * g.speed)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceTo(g.pos) < 0.05 && controls.target.distanceTo(g.target) < 0.05) goal.current = null
  })
  return null
})

function Compass({ el }) {
  const controls = useThree((s) => s.controls)
  useFrame(() => {
    if (!controls || !el.current) return
    const th = controls.getAzimuthalAngle()
    // North is +X in the model (as printed on the brochure plan, N points right).
    const deg = (Math.atan2(Math.cos(th), -Math.sin(th)) * 180) / Math.PI
    el.current.style.transform = `rotate(${deg.toFixed(1)}deg)`
  })
  return null
}

function Studio({ tl, mobile }) {
  const hemi = useRef()
  const sun = useRef()
  const fill = useRef()
  useFrame(() => {
    const k = ease(prog(tl.current.t, T.light[0], T.light[1]))
    if (hemi.current) hemi.current.intensity = 0.55 + 0.35 * k
    if (sun.current) sun.current.intensity = 0.35 + 1.85 * k
    if (fill.current) fill.current.intensity = 0.25 + 0.3 * k
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#e9efff', '#3b4a3a', 0.55]} />
      <directionalLight
        ref={sun}
        color="#fff0d2"
        position={[-30, 42, 24]}
        castShadow={!mobile}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-radius={4}
      />
      <directionalLight ref={fill} color="#bcd0ff" position={[30, 18, -26]} />
    </>
  )
}

function Base({ tl, geo }) {
  const ground = useRef()
  useFrame(() => {
    const s = ease(prog(tl.current.t, T.base[0], T.base[1]))
    if (ground.current) { ground.current.scale.y = Math.max(s, 0.0001); ground.current.visible = s > 0 }
  })
  const tw = SITE.w + 16, td = SITE.h + 16
  return (
    <>
      {/* display table / plinth */}
      <mesh position={[SITE.cx, -0.6, SITE.cz]} receiveShadow>
        <boxGeometry args={[tw, 1.2, td]} />
        <meshStandardMaterial color="#1a211d" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[SITE.cx, 0.005, SITE.cz]} receiveShadow>
        <boxGeometry args={[tw + 0.1, 0.02, td + 0.1]} />
        <meshStandardMaterial color="#b89b63" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[SITE.cx, 0.012, SITE.cz]} receiveShadow>
        <boxGeometry args={[tw - 0.5, 0.02, td - 0.5]} />
        <meshStandardMaterial color="#202824" roughness={0.6} />
      </mesh>
      {/* landscaped ground slab following the traced site outline */}
      <mesh ref={ground} geometry={geo.ground} position={[0, 0.02, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#667a55" roughness={0.95} />
      </mesh>
    </>
  )
}

function Roads({ tl, geo }) {
  const g = useRef()
  useFrame(() => {
    const s = ease(prog(tl.current.t, T.roadFill[0], T.roadFill[1]))
    if (g.current) { g.current.scale.y = Math.max(s, 0.0001); g.current.visible = s > 0 }
  })
  return (
    <mesh ref={g} geometry={geo.road} position={[0, GROUND_H, 0]} receiveShadow castShadow>
      <meshStandardMaterial color="#2c312e" roughness={0.92} />
    </mesh>
  )
}

// Road tracing follows the real road centrelines extracted from the plan.
function Tracers({ tl }) {
  const meshes = useRef([])
  const items = useMemo(
    () => ROAD_CENTERLINES.map((c) => {
      const dx = c.b[0] - c.a[0], dz = c.b[1] - c.a[1]
      return { id: c.id, a: c.a, len: Math.hypot(dx, dz), rot: -Math.atan2(dz, dx), w: c.w >= 40 ? 0.22 : 0.16 }
    }),
    [],
  )
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1)
    g.rotateX(-Math.PI / 2)
    g.translate(0.5, 0, 0)
    return g
  }, [])
  useFrame(() => {
    const t = tl.current.t
    items.forEach((it, i) => {
      const m = meshes.current[i]
      if (!m) return
      const s = ease(prog(t, T.trace + i * 0.45, T.trace + i * 0.45 + 1.5))
      m.scale.x = Math.max(it.len * s, 0.0001)
      m.visible = s > 0
      m.material.opacity = 1 - 0.5 * prog(t, 3.8, 4.8)
    })
  })
  return items.map((it, i) => (
    <mesh key={it.id} ref={(el) => (meshes.current[i] = el)} geometry={geo} position={[it.a[0], ROAD_TOP + 0.01, it.a[1]]} rotation={[0, it.rot, 0]} scale={[0.0001, 1, it.w]}>
      <meshBasicMaterial color="#e4cc94" transparent opacity={1} depthWrite={false} />
    </mesh>
  ))
}

function Plots({ tl, geo, mobile, selected, hovered, zoneHL, onHover, onPick }) {
  const refs = useRef([])
  const faceRefs = useRef([])
  const order = useMemo(() => {
    const idx = PLOTS.map((p, i) => [p.c[0], i]).sort((a, b) => a[0] - b[0])
    const r = new Array(PLOTS.length)
    idx.forEach(([, i], rank) => (r[i] = rank))
    return r
  }, [])
  const mats = useMemo(() => ({
    base: new THREE.MeshStandardMaterial({ color: '#e9e2cf', roughness: 0.82 }),
    zone: new THREE.MeshStandardMaterial({ color: '#dfe8c8', roughness: 0.7, emissive: '#3c5a2e', emissiveIntensity: 0.25 }),
    hover: new THREE.MeshStandardMaterial({ color: '#d9c18a', roughness: 0.55, emissive: '#6b5522', emissiveIntensity: 0.35 }),
    sel: new THREE.MeshStandardMaterial({ color: '#c8ad78', roughness: 0.45, emissive: '#8a6c2a', emissiveIntensity: 0.55 }),
  }), [])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  useFrame((_, dt) => {
    const t = tl.current.t
    PLOTS.forEach((plot, i) => {
      const root = refs.current[i]
      const face = faceRefs.current[i]
      if (!root || !face) return
      const s = ease(prog(t, T.plots + order[i] * 0.018, T.plots + order[i] * 0.018 + 0.7))
      face.scale.y = Math.max(s, 0.0001)
      root.visible = s > 0
      // Premium hover/select response: lift and subtly enlarge without changing geometry.
      const active = selected === plot.id
      const over = hovered === plot.id
      const targetY = active ? GROUND_H + 0.34 : over ? GROUND_H + 0.16 : GROUND_H
      const targetXZ = active ? 1.035 : over ? 1.018 : 1
      const k = 1 - Math.exp(-Math.min(dt, 0.05) * 13)
      root.position.y += (targetY - root.position.y) * k
      root.scale.x += (targetXZ - root.scale.x) * k
      root.scale.z += (targetXZ - root.scale.z) * k
    })
  })
  const matFor = (p) => (selected === p.id ? mats.sel : hovered === p.id ? mats.hover : zoneHL && zoneHL === p.zone ? mats.zone : mats.base)
  return PLOTS.map((p, i) => (
    <group key={p.id} ref={(el) => (refs.current[i] = el)} position={[0, GROUND_H, 0]}>
    <mesh
      ref={(el) => (faceRefs.current[i] = el)}
      geometry={geo.plots[i]}
      material={matFor(p)}
      position={[0, 0, 0]}
      scale={[1, 0.0001, 1]}
      castShadow={!mobile}
      receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); onHover(p.id); window.dispatchEvent(new CustomEvent('rkr-cursor', { detail: 'plot' })) }}
      onPointerOut={() => { onHover(null); window.dispatchEvent(new CustomEvent('rkr-cursor', { detail: 'drag' })) }}
      onClick={(e) => { e.stopPropagation(); if (e.delta < 6) onPick(p.id) }}
    />
      <Text
        position={[p.c[0], PLOT_H + 0.035, p.c[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color={selected === p.id || hovered === p.id ? '#493719' : '#354238'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#f4eddb"
        depthOffset={-2}
        raycast={() => null}
      >
        {p.id}
      </Text>
    </group>
  ))
}

function Lawns({ tl, geo, selected, hovered, zoneHL, onHover, onPick }) {
  const refs = useRef([])
  const mat = useMemo(() => ({
    base: new THREE.MeshStandardMaterial({ color: '#3f7347', roughness: 0.95 }),
    hi: new THREE.MeshStandardMaterial({ color: '#58a062', roughness: 0.85, emissive: '#1f4a2a', emissiveIntensity: 0.4 }),
  }), [])
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat])
  useFrame(() => {
    const s = ease(prog(tl.current.t, T.lawns[0], T.lawns[1]))
    refs.current.forEach((m) => { if (m) { m.scale.y = Math.max(s, 0.0001); m.visible = s > 0 } })
  })
  return COMMONS.map((c, i) => (
    <mesh
      key={c.id}
      ref={(el) => (refs.current[i] = el)}
      geometry={geo.lawns[i]}
      material={selected === c.id || hovered === c.id || zoneHL === 'commons' ? mat.hi : mat.base}
      position={[0, GROUND_H, 0]}
      scale={[1, 0.0001, 1]}
      receiveShadow
      castShadow
      onPointerOver={(e) => { e.stopPropagation(); onHover(c.id); window.dispatchEvent(new CustomEvent('rkr-cursor', { detail: 'plot' })) }}
      onPointerOut={() => { onHover(null); window.dispatchEvent(new CustomEvent('rkr-cursor', { detail: 'drag' })) }}
      onClick={(e) => { e.stopPropagation(); if (e.delta < 6) onPick(c.id) }}
    />
  ))
}

// Pop-in instanced props (trees, lamp poles) — conceptual landscaping.
function PopInstances({ tl, items, geometry, material, window: win, mobile }) {
  const ref = useRef()
  const done = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // Start collapsed so nothing renders at the origin before the timeline reaches it.
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z)
      dummy.scale.setScalar(0.0001)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    done.current = false
  }, [items, dummy])
  useFrame(() => {
    const m = ref.current
    if (!m || done.current) return
    const t = tl.current.t
    if (t < win[0]) return
    const span = win[1] - win[0]
    items.forEach((it, i) => {
      const a = win[0] + (i / items.length) * span * 0.6
      const s = ease(prog(t, a, a + span * 0.4))
      dummy.position.set(it.x, it.y, it.z)
      dummy.scale.setScalar(Math.max(s * it.s, 0.0001))
      dummy.rotation.y = it.r || 0
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    if (t >= win[1]) done.current = true
  })
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={!mobile} frustumCulled={false} />
}

function Landscape({ tl, mobile }) {
  const trees = useMemo(() => {
    const out = []
    const rand = rng(7)
    const per = mobile ? 9 : 22
    COMMONS.forEach((c) => {
      const b = bounds(c.p)
      let tries = 0, n = 0
      while (n < per && tries < 600) {
        tries++
        const x = b.x0 + rand() * b.w, z = b.z0 + rand() * b.h
        if (!inPoly(x, z, c.p)) continue
        // keep clear of the polygon edge and of other trees
        let ok = true
        for (let k = 0; k < c.p.length; k++) {
          const q = c.p[k]
          if (Math.hypot(q[0] - x, q[1] - z) < 0.5) { ok = false; break }
        }
        if (ok && out.every((o) => Math.hypot(o.x - x, o.z - z) > 1.25)) {
          out.push({ x, z, y: GROUND_H + LAWN_H, s: 0.8 + rand() * 0.7, r: rand() * 6 })
          n++
        }
      }
    })
    return out
  }, [mobile])
  const lamps = useMemo(() => {
    const out = []
    const step = mobile ? 11 : 7
    ROAD_CENTERLINES.forEach((c) => {
      const dx = c.b[0] - c.a[0], dz = c.b[1] - c.a[1]
      const len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len
      const half = c.w / 20
      let k = 0
      for (let d = 4; d < len - 2; d += step, k++) {
        const side = k % 2 ? 1 : -1
        out.push({ x: c.a[0] + ux * d - uz * (half - 0.28) * side, z: c.a[1] + uz * d + ux * (half - 0.28) * side, y: ROAD_TOP, s: 1, r: 0 })
      }
    })
    return out
  }, [mobile])
  const g = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.05, 0.08, 0.5, 5).translate(0, 0.25, 0),
    canopy: new THREE.IcosahedronGeometry(0.42, 0).translate(0, 0.85, 0),
    pole: new THREE.CylinderGeometry(0.022, 0.03, 1.15, 5).translate(0, 0.575, 0),
    head: new THREE.BoxGeometry(0.32, 0.05, 0.1).translate(0.12, 1.16, 0),
  }), [])
  const m = useMemo(() => ({
    trunk: new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 1 }),
    canopy: new THREE.MeshStandardMaterial({ color: '#2f5f3b', roughness: 0.9, flatShading: true }),
    pole: new THREE.MeshStandardMaterial({ color: '#cfd2cc', roughness: 0.5, metalness: 0.4 }),
    head: new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffd58a', emissiveIntensity: 0 }),
  }), [])
  useEffect(() => () => { Object.values(g).forEach((x) => x.dispose()); Object.values(m).forEach((x) => x.dispose()) }, [g, m])
  useFrame(() => { m.head.emissiveIntensity = 2.2 * ease(prog(tl.current.t, T.lamps[0] + 0.4, T.lamps[1] + 0.6)) })
  return (
    <>
      <PopInstances tl={tl} items={trees} geometry={g.trunk} material={m.trunk} window={T.trees} mobile={mobile} />
      <PopInstances tl={tl} items={trees} geometry={g.canopy} material={m.canopy} window={T.trees} mobile={mobile} />
      <PopInstances tl={tl} items={lamps} geometry={g.pole} material={m.pole} window={T.lamps} mobile={mobile} />
      <PopInstances tl={tl} items={lamps} geometry={g.head} material={m.head} window={T.lamps} mobile={mobile} />
    </>
  )
}

function Scene({ tl, geo, mobile, ui, rig, controlsEnabled, autoRotate, compassEl, active, reduced }) {
  const gl = useThree((s) => s.gl)
  const controls = useThree((st) => st.controls)
  useEffect(() => { gl.domElement.style.touchAction = controlsEnabled ? 'none' : 'pan-y' }, [gl, controlsEnabled])
  // drei only updates enabled controls each frame; keep auto-rotate alive while idle.
  useFrame(() => { if (autoRotate && !controlsEnabled && controls) controls.update() })
  return (
    <>
      <Driver tl={tl} active={active} reduced={reduced} onCamera={() => rig.current?.fly(overviewGoal(mobile), reduced ? 50 : 1.15)} />
      <Studio tl={tl} mobile={mobile} />
      <Base tl={tl} geo={geo} />
      <Roads tl={tl} geo={geo} />
      <Tracers tl={tl} />
      <Plots tl={tl} geo={geo} mobile={mobile} {...ui} />
      <Lawns tl={tl} geo={geo} {...ui} />
      <Landscape tl={tl} mobile={mobile} />
      <CameraRig ref={rig} />
      <Compass el={compassEl} />
      <OrbitControls
        makeDefault
        enabled={controlsEnabled}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
        minDistance={6}
        maxDistance={150}
        minPolarAngle={0.18}
        maxPolarAngle={1.27}
        autoRotate={autoRotate}
        autoRotateSpeed={0.55}
        onStart={() => rig.current?.cancel()}
      />
    </>
  )
}

/* ───────────────────────── UI overlay + canvas host ───────────────────────── */
function describe(id, t) {
  const plot = PLOTS.find((p) => p.id === id)
  if (plot) {
    const stored = PLOT_DETAILS[id] || {}
    const box = bounds(plot.p)
    const d = {
      ...stored,
      modelAreaSqft: polygonAreaSqft(plot.p),
      modelWidthFt: Math.round(box.w * 10),
      modelDepthFt: Math.round(box.h * 10),
    }
    return { kind: 'plot', title: d.number ? `${t.plan.plot} ${d.number}` : `${t.plan.plot} · ${plot.id}`, zone: t.plan.zones[plot.zone], d, c: plot.c, verified: !!d.number, geometryId: plot.id }
  }
  const com = COMMONS.find((c) => c.id === id)
  if (com) return { kind: 'common', title: COMMON_DETAILS[id]?.name || t.plan.commonPlot, zone: t.plan.zones.commons, d: { areaSqft: COMMON_DETAILS[id]?.areaSqft }, c: com.c, verified: true }
  return null
}

export default function MasterPlanExperience({ onEnquire, onReady }) {
  const { t, lang } = useLang()
  const mobile = useMemo(isMobile, [])
  const reduced = useMemo(prefersReduced, [])
  const tl = useRef({ t: 0, camDone: false })
  const rig = useRef(null)
  const wrap = useRef(null)
  const compassEl = useRef(null)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [zoneHL, setZoneHL] = useState(null)
  const [rotate, setRotate] = useState(false)
  const [tour, setTour] = useState(-1)
  const touchDevice = useMemo(() => window.matchMedia('(pointer: coarse)').matches, [])

  // Geometry is built once and disposed on unmount.
  const geo = useMemo(() => ({
    ground: extrude(shapeFrom(SITE_OUTLINE), GROUND_H, 0.04),
    road: extrude(shapeFrom(ROAD.outer, ROAD.holes), ROAD_H),
    plots: PLOTS.map((p) => extrude(shapeFrom(p.p), PLOT_H, mobile ? 0 : 0.02)),
    lawns: COMMONS.map((c) => extrude(shapeFrom(c.p), LAWN_H)),
  }), [mobile])
  useEffect(() => () => {
    geo.ground.dispose(); geo.road.dispose(); geo.plots.forEach((g) => g.dispose()); geo.lawns.forEach((g) => g.dispose())
  }, [geo])

  // Render only while on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 })
    wrap.current && io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  // Disengage when clicking outside (touch) or leaving (mouse); Escape too.
  useEffect(() => {
    const down = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setEngaged(false) }
    const key = (e) => { if (e.key === 'Escape') { setEngaged(false); setSelected(null) } }
    document.addEventListener('pointerdown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key) }
  }, [])

  const flyOverview = () => rig.current?.fly(overviewGoal(mobile), 2.6)
  const pick = (id) => {
    setSelected(id); setZoneHL(null); setTour(-1); setRotate(false)
    const d = describe(id, t)
    if (d) rig.current?.fly(plotGoal(d.c), 3)
  }
  const reset = () => { setSelected(null); setZoneHL(null); setTour(-1); setRotate(false); flyOverview() }
  const goZone = (key) => {
    setTour(-1); setSelected(null); setRotate(false)
    if (key === 'all') { setZoneHL(null); flyOverview(); return }
    setZoneHL(key === 'eastCommons' ? 'east' : key)
    rig.current?.fly(zoneGoal(key), 2.6)
  }

  // Guided tour
  const TOUR = ['all', 'north', 'west', 'eastCommons', 'south']
  useEffect(() => {
    if (tour < 0) return
    goZoneNoReset(TOUR[tour])
    const id = setTimeout(() => (tour + 1 < TOUR.length ? setTour(tour + 1) : (setTour(-1), setZoneHL(null), flyOverview())), 4800)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour])
  function goZoneNoReset(key) {
    setSelected(null)
    if (key === 'all') { setZoneHL(null); flyOverview(); return }
    setZoneHL(key === 'eastCommons' ? 'east' : key)
    rig.current?.fly(zoneGoal(key), 1.4)
  }

  const shown = describe(selected || hovered, t)
  const ui = { selected, hovered, zoneHL, onHover: setHovered, onPick: pick }
  const controlsEnabled = engaged

  return (
    <div
      ref={wrap}
      className={`mp-stage ${ready ? 'is-ready' : ''} ${engaged ? 'is-engaged' : ''}`}
      data-lenis-prevent={engaged ? '' : undefined}
      data-cursor="drag"
      onPointerDown={() => setEngaged(true)}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setEngaged(false) }}
    >
      <Canvas
        className="mp-canvas"
        shadows={!mobile}
        dpr={mobile ? 1 : [1, 1.75]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 110, 34], fov: mobile ? 42 : 36, near: 0.5, far: 420 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          setReady(true)
          onReady && onReady()
        }}
      >
        <Scene
          tl={tl} geo={geo} mobile={mobile} ui={ui} rig={rig}
          controlsEnabled={controlsEnabled} autoRotate={rotate && !selected} compassEl={compassEl}
          active={visible} reduced={reduced}
        />
      </Canvas>

      {/* overlay UI */}
      <div className="mp-zones" role="tablist" aria-label={t.plan.eyebrow}>
        {['all', 'north', 'west', 'east', 'south', 'commons'].map((k) => (
          <button key={k} className={`chip ${(k === 'all' ? !zoneHL && !selected : zoneHL === k) ? 'on' : ''}`} onClick={() => goZone(k)} type="button">
            {t.plan.zones[k]}
          </button>
        ))}
      </div>

      <div className="mp-tools">
        <div className="mp-compass" title="North" aria-label="North">
          <span ref={compassEl} className="needle"><i /></span>
          <b>{t.plan.north}</b>
        </div>
        <button className="tool" type="button" onClick={reset} aria-label={t.plan.reset} title={t.plan.reset}><RotateCcw size={16} /><span>{t.plan.reset}</span></button>
        <button className={`tool ${tour >= 0 ? 'on' : ''}`} type="button" onClick={() => (tour >= 0 ? (setTour(-1), setZoneHL(null)) : (setSelected(null), setTour(0)))} aria-label={tour >= 0 ? t.plan.stopTour : t.plan.tour}>
          {tour >= 0 ? <Square size={15} /> : <Play size={15} />}<span>{tour >= 0 ? t.plan.stopTour : t.plan.tour}</span>
        </button>
        <button className={`tool ${rotate ? 'on' : ''}`} type="button" onClick={() => { setRotate((r) => !r); setSelected(null) }} aria-pressed={rotate} aria-label={t.plan.rotate}>
          <Orbit size={16} /><span>{t.plan.rotate}</span>
        </button>
      </div>

      {tour >= 0 && <div className="mp-tourcap" key={`${tour}-${lang}`}><em>{tour + 1}/{TOUR.length}</em> {t.plan.tourSteps[tour]}</div>}

      {!engaged && ready && (
        <div className="mp-hint" aria-hidden="true">{touchDevice ? 'Tap to explore' : 'Click to explore'} · {t.plan.hint}</div>
      )}
      {engaged && touchDevice && (
        <button className="mp-done" type="button" onClick={() => setEngaged(false)}><X size={16} /> {t.nav.close}</button>
      )}
      <div className="mp-legend">{t.plan.legend} — {t.plan.trees}</div>

      {shown && (
        <aside className={`mp-panel ${selected ? 'pinned' : ''}`} aria-live="polite">
          <header>
            <small>{shown.kind === 'common' ? t.plan.commonPlot : t.plan.plot}</small>
            <h3>{shown.title}</h3>
            <span className="zone">{shown.zone}</span>
            {shown.kind === 'plot' && !shown.d.number && <span className="zone mp-model-ref">{t.plan.modelRef}: {shown.geometryId}</span>}
          </header>
          <dl>
            {shown.kind === 'plot' && (
              <div><dt>{t.plan.number}</dt><dd className={shown.d.number ? '' : 'muted'}>{shown.d.number || t.plan.pending}</dd></div>
            )}
            <div>
              <dt>{t.plan.area}</dt>
              <dd className={shown.d.areaSqft ? '' : 'estimate'}>{shown.d.areaSqft ? `${shown.d.areaSqft.toLocaleString('en-IN')} ${t.plan.sqft}` : `~${shown.d.modelAreaSqft.toLocaleString('en-IN')} ${t.plan.sqft}`}</dd>
            </div>
            {shown.kind === 'plot' && (
              <div><dt>{t.plan.dims}</dt><dd className={shown.d.widthFt ? '' : 'muted'}>{shown.d.widthFt ? `${shown.d.widthFt} × ${shown.d.depthFt} ft` : t.plan.pending}</dd></div>
            )}
            {shown.kind === 'plot' && (
              <div><dt>{t.plan.status}</dt><dd className="muted">{AVAILABILITY_CONNECTED && shown.d.status ? shown.d.status : t.plan.notConnected}</dd></div>
            )}
          </dl>
          {shown.kind === 'plot' && <p className="mp-estimate-note">{t.plan.modelEstimateNote}</p>}
          {selected && (
            <footer>
              <button type="button" className="btn-solid sm" onClick={() => onEnquire && onEnquire(`${shown.zone}${shown.d.number ? ' · ' + shown.d.number : ''} (3D model)`)}>
                <MessageCircle size={15} /> {t.plan.enquirePlot}
              </button>
              <button type="button" className="btn-ghost sm" onClick={reset}><ArrowLeft size={15} /> {t.plan.back}</button>
            </footer>
          )}
        </aside>
      )}
    </div>
  )
}
