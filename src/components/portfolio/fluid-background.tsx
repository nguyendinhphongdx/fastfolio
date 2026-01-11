"use client"

import { useEffect, useRef } from "react"

export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Track if WebGL is ready
    let webglReady = false

    import("webgl-fluid").then((WebGLFluid) => {
      WebGLFluid.default(canvas, {
        IMMEDIATE: false,
        TRIGGER: "hover",
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 1,
        VELOCITY_DISSIPATION: 0.99,
        PRESSURE: 0.7,
        PRESSURE_ITERATIONS: 10,
        CURL: 2,
        SPLAT_RADIUS: 0.3,
        SPLAT_FORCE: 3000,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 255, g: 255, b: 255 },
        TRANSPARENT: false,
        BLOOM: true,
        BLOOM_ITERATIONS: 12,
        BLOOM_RESOLUTION: 128,
        BLOOM_INTENSITY: 0.4,
        BLOOM_THRESHOLD: 0.3,
        BLOOM_SOFT_KNEE: 0.9,
        SUNRAYS: false,
        SUNRAYS_RESOLUTION: 196,
        SUNRAYS_WEIGHT: 0.5,
      })
      webglReady = true
    })

    // Forward mouse movements to canvas
    const handleMouseMove = (e: MouseEvent) => {
      if (!webglReady) return

      lastPosRef.current = { x: e.clientX, y: e.clientY }

      // Dispatch mousemove event to canvas
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: false,
        cancelable: true,
        view: window,
      })
      canvas.dispatchEvent(mouseEvent)
    }

    // Also handle mousedown/mouseup for click effects
    const handleMouseDown = (e: MouseEvent) => {
      if (!webglReady) return
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: false,
        cancelable: true,
        view: window,
      })
      canvas.dispatchEvent(mouseEvent)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!webglReady) return
      const mouseEvent = new MouseEvent("mouseup", {
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: false,
        cancelable: true,
        view: window,
      })
      canvas.dispatchEvent(mouseEvent)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ touchAction: "none" }}
    />
  )
}
