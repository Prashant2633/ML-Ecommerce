'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function GlobeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.set(0, 0, 4.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const bl = new THREE.PointLight(0x3b82f6, 1.5)
    bl.position.set(4, 4, 4)
    scene.add(bl)
    const pl = new THREE.PointLight(0x8b5cf6, 0.8)
    pl.position.set(-4, -4, 2)
    scene.add(pl)

    const group = new THREE.Group()
    scene.add(group)

    // Outer wireframe globe
    const globeGeo = new THREE.SphereGeometry(1.6, 32, 32)
    const globeMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.22 })
    group.add(new THREE.Mesh(globeGeo, globeMat))

    // Solid dark inner sphere
    const innerGeo = new THREE.SphereGeometry(1.54, 24, 24)
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.92, roughness: 0.2, metalness: 0.8 })
    group.add(new THREE.Mesh(innerGeo, innerMat))

    // Latitude rings
    const R = 1.6
    ;[-0.8, 0, 0.8].forEach(y => {
      const r = Math.sqrt(R ** 2 - y ** 2)
      const tGeo = new THREE.TorusGeometry(r, 0.008, 2, 80)
      const tMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.45 })
      const torus = new THREE.Mesh(tGeo, tMat)
      torus.rotation.x = Math.PI / 2
      torus.position.y = y
      group.add(torus)
    })

    // Outer orbit glow ring
    const orbitGeo = new THREE.TorusGeometry(2.1, 0.015, 2, 100)
    const orbitMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.28 })
    const orbit = new THREE.Mesh(orbitGeo, orbitMat)
    orbit.rotation.x = Math.PI / 2
    scene.add(orbit)

    let animId: number
    const startTime = Date.now()
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = (Date.now() - startTime) / 1000
      group.rotation.y  += 0.004
      group.rotation.x   = Math.sin(t * 0.3) * 0.08
      orbit.rotation.z   = t * 0.15
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!mount) return
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
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
}
