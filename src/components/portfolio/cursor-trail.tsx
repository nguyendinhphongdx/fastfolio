"use client"

import { useEffect, useRef } from "react"

interface TrailPoint {
  x: number
  y: number
  age: number
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trailRef = useRef<TrailPoint[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)

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

    const maxAge = 50 // Trail length
    const colors = [
      "rgba(147, 51, 234, 0.8)", // Purple
      "rgba(59, 130, 246, 0.8)", // Blue
      "rgba(16, 185, 129, 0.8)", // Green
      "rgba(245, 158, 11, 0.8)", // Amber
      "rgba(239, 68, 68, 0.8)",  // Red
    ]

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }

      // Add new point
      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        age: 0,
      })

      // Limit trail length
      if (trailRef.current.length > 100) {
        trailRef.current = trailRef.current.slice(-100)
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw trail
      trailRef.current = trailRef.current.filter((point) => {
        point.age++
        return point.age < maxAge
      })

      // Draw trail with gradient
      for (let i = 0; i < trailRef.current.length; i++) {
        const point = trailRef.current[i]
        const progress = point.age / maxAge
        const alpha = 1 - progress
        const size = (1 - progress) * 12 + 2

        // Color based on position in trail
        const colorIndex = Math.floor((i / trailRef.current.length) * colors.length)
        const color = colors[colorIndex] || colors[0]

        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        ctx.fillStyle = color.replace("0.8", String(alpha * 0.8))
        ctx.fill()
      }

      // Draw main cursor dot
      if (trailRef.current.length > 0) {
        const lastPoint = trailRef.current[trailRef.current.length - 1]
        ctx.beginPath()
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          lastPoint.x, lastPoint.y, 0,
          lastPoint.x, lastPoint.y, 8
        )
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
        gradient.addColorStop(0.5, "rgba(147, 51, 234, 0.8)")
        gradient.addColorStop(1, "rgba(147, 51, 234, 0)")
        ctx.fillStyle = gradient
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
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
