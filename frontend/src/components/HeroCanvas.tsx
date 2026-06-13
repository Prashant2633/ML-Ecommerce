'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050816, 0.035)

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    camera.position.set(0, 0, 7)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const blueLight = new THREE.DirectionalLight(0x3b82f6, 1.2)
    blueLight.position.set(5, 5, 5)
    scene.add(blueLight)
    const purpleLight = new THREE.DirectionalLight(0x8b5cf6, 0.8)
    purpleLight.position.set(-5, -5, 3)
    scene.add(purpleLight)

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', onPointerMove)

    const BOX_DATA = [
      { pos: [-4.5, 1.5, -1], color: 0x3b82f6, speed: 0.8 },
      { pos: [-3, -1, -2], color: 0x8b5cf6, speed: 1.1 },
      { pos: [-1.5, 2, -1.5], color: 0x06b6d4, speed: 0.6 },
      { pos: [1.5, 1.8, -1], color: 0x3b82f6, speed: 1.3 },
      { pos: [3, -0.8, -2], color: 0x8b5cf6, speed: 0.9 },
      { pos: [4.5, 1.2, -1], color: 0x06b6d4, speed: 1.0 },
      { pos: [0, -2, -3], color: 0x3b82f6, speed: 0.7 },
      { pos: [-5, -0.5, -3], color: 0x8b5cf6, speed: 1.2 },
      { pos: [5.5, -1, -2], color: 0x06b6d4, speed: 0.85 },
    ]

    const boxes = BOX_DATA.map(({ pos, color, speed }) => {
      const group = new THREE.Group()
      group.position.set(pos[0], pos[1], pos[2])

      const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7)
      const mat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.12,
        metalness: 0.9,
        roughness: 0.1,
      })
      const mesh = new THREE.Mesh(geo, mat)
      group.add(mesh)

      const wireMat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.65 })
      const wireGeo = new THREE.BoxGeometry(0.73, 0.73, 0.73)
      group.add(new THREE.Mesh(wireGeo, wireMat))

      scene.add(group)

      return {
        group,
        speed,
        baseX: pos[0],
        baseY: pos[1],
        baseZ: pos[2],
        baseRX: Math.random() * Math.PI,
        baseRY: Math.random() * Math.PI,
      }
    })

    const COUNT = 640
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({ size: 0.03, color: 0x3b82f6, transparent: true, opacity: 0.7 })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    const ringGeo = new THREE.TorusGeometry(4, 0.012, 2, 120)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.22 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.z = -2
    scene.add(ring)

    const startTime = Date.now()
    let animId = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = (Date.now() - startTime) / 1000

      boxes.forEach(({ group, speed, baseX, baseY, baseZ, baseRX, baseRY }) => {
        const bob = Math.sin(t * speed * 0.8) * 0.25

        group.rotation.x = baseRX + pointer.y * 0.3 + t * 0.002 * speed
        group.rotation.y = baseRY + pointer.x * 0.35 + t * 0.003 * speed
        group.position.x = baseX + pointer.x * 0.35
        group.position.y = baseY + bob
        group.position.z = baseZ + pointer.y * 0.15
      })

      particles.rotation.y = t * 0.018 + pointer.x * 0.25
      particles.rotation.x = Math.sin(t * 0.02) * 0.09 + pointer.y * 0.08

      ring.rotation.x += 0.0014
      ring.rotation.z += 0.001

      camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.05
      camera.position.y += (pointer.y * 0.5 - camera.position.y) * 0.05
      camera.lookAt(0, 0, -1)

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', onPointerMove)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
