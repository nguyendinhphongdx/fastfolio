"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

export function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const lastEmitRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const colors = [
      "#9333EA", // Purple
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#EC4899", // Pink
      "#6366F1", // Indigo
    ]

    const createParticle = (x: number, y: number): Particle => {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 3 + 1
      const maxLife = Math.random() * 40 + 20

      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife,
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }

      const now = Date.now()
      // Emit particles every 16ms (60fps)
      if (now - lastEmitRef.current > 16) {
        // Create 3-5 particles per movement
        const count = Math.floor(Math.random() * 3) + 3
        for (let i = 0; i < count; i++) {
          particlesRef.current.push(createParticle(e.clientX, e.clientY))
        }
        lastEmitRef.current = now
      }

      // Limit particles
      if (particlesRef.current.length > 200) {
        particlesRef.current = particlesRef.current.slice(-200)
      }
    }

    const handleClick = (e: MouseEvent) => {
      // Burst of particles on click
      for (let i = 0; i < 20; i++) {
        const particle = createParticle(e.clientX, e.clientY)
        particle.vx *= 2
        particle.vy *= 2
        particle.size *= 1.5
        particlesRef.current.push(particle)
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.life++
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.05 // Gravity
        particle.vx *= 0.99 // Friction
        particle.vy *= 0.99
        particle.alpha = 1 - particle.life / particle.maxLife

        if (particle.life >= particle.maxLife) return false

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * particle.alpha, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, "0")
        ctx.fill()

        // Glow effect
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * particle.alpha * 2, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * particle.alpha * 2
        )
        gradient.addColorStop(0, particle.color + Math.floor(particle.alpha * 100).toString(16).padStart(2, "0"))
        gradient.addColorStop(1, particle.color + "00")
        ctx.fillStyle = gradient
        ctx.fill()

        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
      style={{ touchAction: "none" }}
    />
  )
}
