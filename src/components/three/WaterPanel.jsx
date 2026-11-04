import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { vertex, waterFragment } from './waterShader'
import { src } from '../../lib/images'
import { dprRange } from '../../lib/env'

function makeSpriteTexture() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,240,215,0.5)')
  grad.addColorStop(1, 'rgba(255,240,215,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Pollen and spray caught in the low sun. Deliberately few, deliberately slow. */
function Motes({ count = 150 }) {
  const ref = useRef()
  const { viewport } = useThree()
  const sprite = useMemo(makeSpriteTexture, [])

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9
      positions[i * 3 + 2] = Math.random() * 3 - 1
      speeds[i] = 0.05 + Math.random() * 0.14
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const geo = ref.current?.geometry
    if (!geo) return
    const arr = geo.attributes.position.array
    const top = viewport.height / 2 + 0.5
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      arr[i * 3] += Math.sin(t * 0.3 + i) * delta * 0.05
      if (arr[i * 3 + 1] > top) arr[i * 3 + 1] = -top
    }
    geo.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        map={sprite}
        transparent
        opacity={0.45}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function Surface({ texture, texAspect, tuning, introDelay }) {
  const { viewport, size } = useThree()
  const mouse = useRef({ x: 0.5, y: 0.55, tx: 0.5, ty: 0.55, strength: 0 })
  const intro = useRef(0)
  const start = useRef(0)

  const uniforms = useMemo(
    () => ({
      uTex: { value: texture },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.55) },
      uMouseStrength: { value: 0 },
      uCover: { value: new THREE.Vector2(1, 1) },
      uAspect: { value: 1 },
      uIntro: { value: 0 },
      uScroll: { value: 0 },
      uScale: { value: tuning.scale },
      uRefract: { value: tuning.refract },
      uCaustic: { value: tuning.caustic },
      uShade: { value: tuning.shade },
      uVignette: { value: tuning.vignette },
      uExposure: { value: tuning.exposure },
      uFoam: { value: new THREE.Color(tuning.foam) },
      uSun: { value: new THREE.Color(tuning.sun) },
    }),
    // tuning is a stable object from the parent
    [texture, tuning],
  )

  useFrame((state, delta) => {
    const u = uniforms
    const now = state.clock.elapsedTime
    if (!start.current) start.current = now + introDelay

    u.uTime.value = now

    const planeAspect = size.width / size.height
    u.uAspect.value = planeAspect
    if (texAspect > planeAspect) u.uCover.value.set(planeAspect / texAspect, 1)
    else u.uCover.value.set(1, texAspect / planeAspect)

    const p = state.pointer
    const tx = p.x * 0.5 + 0.5
    const ty = p.y * 0.5 + 0.5
    const moved = Math.abs(tx - mouse.current.x) + Math.abs(ty - mouse.current.y)
    mouse.current.x += (tx - mouse.current.x) * Math.min(1, delta * 6)
    mouse.current.y += (ty - mouse.current.y) * Math.min(1, delta * 6)
    mouse.current.strength = THREE.MathUtils.lerp(
      mouse.current.strength,
      Math.min(1.5, moved * 30),
      Math.min(1, delta * 2.2),
    )
    u.uMouse.value.set(mouse.current.x, mouse.current.y)
    u.uMouseStrength.value = mouse.current.strength

    if (now >= start.current) intro.current = Math.min(1, intro.current + delta * 0.7)
    u.uIntro.value = intro.current

    const host = state.gl.domElement.parentElement
    if (host) {
      const r = host.getBoundingClientRect()
      u.uScroll.value = THREE.MathUtils.clamp(
        1 - (r.top + r.height / 2) / Math.max(1, window.innerHeight),
        -1,
        1,
      )
    }
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertex}
        fragmentShader={waterFragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}

const DEFAULTS = {
  scale: 6.5,
  refract: 0.05,
  caustic: 0.35,
  shade: 0.4,
  vignette: 0.8,
  exposure: 1,
  foam: '#a9c2b2',
  sun: '#d9a05b',
}

/**
 * A photograph of water, resurfaced in WebGL. The image underneath it in the
 * DOM is the same frame, so if this never mounts nothing is lost but movement.
 */
export default function WaterPanel({
  photo,
  active = true,
  motes = false,
  introDelay = 0,
  onReady,
  ...overrides
}) {
  const [tex, setTex] = useState(null)
  const [aspect, setAspect] = useState(1.5)
  const tuning = useMemo(() => ({ ...DEFAULTS, ...overrides }), [JSON.stringify(overrides)])

  useEffect(() => {
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      src(photo, 1600),
      (t) => {
        if (!alive) return
        t.colorSpace = THREE.SRGBColorSpace
        t.minFilter = THREE.LinearFilter
        t.magFilter = THREE.LinearFilter
        t.generateMipmaps = false
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
        setAspect(t.image.width / t.image.height)
        setTex(t)
        onReady?.()
      },
      undefined,
      () => {},
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.src])

  if (!tex) return null

  return (
    <Canvas
      dpr={dprRange}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Surface texture={tex} texAspect={aspect} tuning={tuning} introDelay={introDelay} />
      {motes && <Motes />}
    </Canvas>
  )
}
