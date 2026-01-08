"use client"

import { useEffect, useRef, useCallback } from "react"

interface Pointer {
  id: number
  texcoordX: number
  texcoordY: number
  prevTexcoordX: number
  prevTexcoordY: number
  deltaX: number
  deltaY: number
  down: boolean
  moved: boolean
  color: { r: number; g: number; b: number }
}

interface Config {
  SIM_RESOLUTION: number
  DYE_RESOLUTION: number
  CAPTURE_RESOLUTION: number
  DENSITY_DISSIPATION: number
  VELOCITY_DISSIPATION: number
  PRESSURE: number
  PRESSURE_ITERATIONS: number
  CURL: number
  SPLAT_RADIUS: number
  SPLAT_FORCE: number
  SHADING: boolean
  COLORFUL: boolean
  COLOR_UPDATE_SPEED: number
  PAUSED: boolean
  BACK_COLOR: { r: number; g: number; b: number }
  TRANSPARENT: boolean
  BLOOM: boolean
  BLOOM_ITERATIONS: number
  BLOOM_RESOLUTION: number
  BLOOM_INTENSITY: number
  BLOOM_THRESHOLD: number
  BLOOM_SOFT_KNEE: number
  SUNRAYS: boolean
  SUNRAYS_RESOLUTION: number
  SUNRAYS_WEIGHT: number
}

// Simplified WebGL Fluid Background
// Inspired by https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
export function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const pointersRef = useRef<Pointer[]>([])

  const config: Config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0.98, g: 0.98, b: 0.98 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
  }

  const generateColor = useCallback(() => {
    // Pastel colors similar to fastfol.io
    const colors = [
      { r: 0.95, g: 0.85, b: 0.90 }, // Light pink
      { r: 0.85, g: 0.95, b: 0.90 }, // Light green
      { r: 0.90, g: 0.90, b: 0.98 }, // Light blue
      { r: 0.98, g: 0.95, b: 0.85 }, // Light yellow
      { r: 0.95, g: 0.88, b: 0.95 }, // Light purple
      { r: 0.88, g: 0.95, b: 0.95 }, // Light cyan
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check if we're on mobile
    const isMobile = window.matchMedia("(max-width: 768px)").matches

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false
    }) as WebGL2RenderingContext | null

    if (!gl) {
      // Fallback for browsers without WebGL2
      return
    }

    // Resize canvas
    const resizeCanvas = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Pointer helpers - defined before use
    function createPointer(): Pointer {
      return {
        id: -1,
        texcoordX: 0,
        texcoordY: 0,
        prevTexcoordX: 0,
        prevTexcoordY: 0,
        deltaX: 0,
        deltaY: 0,
        down: false,
        moved: false,
        color: generateColor()
      }
    }

    // Initialize pointers
    pointersRef.current = [createPointer()]

    // Shader sources
    const baseVertexShader = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `

    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
      }
    `

    const splatShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `

    const advectionShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
      vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;
        vec2 iuv = floor(st);
        vec2 fuv = fract(st);
        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
      }
      void main () {
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `

    const divergenceShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `

    const curlShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `

    const vorticityShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `

    const pressureShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `

    const gradientSubtractShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `

    // Compile shaders and create programs
    function compileShader(type: number, source: string) {
      const shader = gl!.createShader(type)!
      gl!.shaderSource(shader, source)
      gl!.compileShader(shader)
      return shader
    }

    function createProgram(vertexSource: string, fragmentSource: string) {
      const program = gl!.createProgram()!
      const vertexShader = compileShader(gl!.VERTEX_SHADER, vertexSource)
      const fragmentShader = compileShader(gl!.FRAGMENT_SHADER, fragmentSource)
      gl!.attachShader(program, vertexShader)
      gl!.attachShader(program, fragmentShader)
      gl!.linkProgram(program)
      return program
    }

    // Create programs
    const displayProgram = createProgram(baseVertexShader, displayShaderSource)
    const splatProgram = createProgram(baseVertexShader, splatShader)
    const advectionProgram = createProgram(baseVertexShader, advectionShader)
    const divergenceProgram = createProgram(baseVertexShader, divergenceShader)
    const curlProgram = createProgram(baseVertexShader, curlShader)
    const vorticityProgram = createProgram(baseVertexShader, vorticityShader)
    const pressureProgram = createProgram(baseVertexShader, pressureShader)
    const gradientSubtractProgram = createProgram(baseVertexShader, gradientSubtractShader)

    // Create vertex buffer
    const blit = (() => {
      const quadVertices = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1])
      const quadIndices = new Uint16Array([0, 1, 2, 0, 2, 3])

      const vertexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

      const indexBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW)

      return (target: WebGLFramebuffer | null) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target)
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
      }
    })()

    // Create framebuffers
    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
      gl!.activeTexture(gl!.TEXTURE0)
      const texture = gl!.createTexture()!
      gl!.bindTexture(gl!.TEXTURE_2D, texture)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

      const fbo = gl!.createFramebuffer()!
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0)
      gl!.viewport(0, 0, w, h)
      gl!.clear(gl!.COLOR_BUFFER_BIT)

      return {
        texture,
        fbo,
        width: w,
        height: h,
        attach(id: number) {
          gl!.activeTexture(gl!.TEXTURE0 + id)
          gl!.bindTexture(gl!.TEXTURE_2D, texture)
          return id
        }
      }
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, filter)
      let fbo2 = createFBO(w, h, internalFormat, format, type, filter)
      return {
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        get read() { return fbo1 },
        set read(value) { fbo1 = value },
        get write() { return fbo2 },
        set write(value) { fbo2 = value },
        swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp }
      }
    }

    // Resolution helpers
    function getResolution(resolution: number) {
      let aspectRatio = gl!.canvas.width / gl!.canvas.height
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio
      const min = Math.round(resolution)
      const max = Math.round(resolution * aspectRatio)
      return gl!.canvas.width > gl!.canvas.height ? { width: max, height: min } : { width: min, height: max }
    }

    // Initialize FBOs
    const simRes = getResolution(config.SIM_RESOLUTION)
    const dyeRes = getResolution(config.DYE_RESOLUTION)

    const halfFloat = gl.getExtension("EXT_color_buffer_half_float")
    const formatRGBA = { internalFormat: gl.RGBA16F, format: gl.RGBA }
    const formatRG = { internalFormat: gl.RG16F, format: gl.RG }
    const formatR = { internalFormat: gl.R16F, format: gl.RED }
    const halfFloatType = gl.HALF_FLOAT

    let dye = createDoubleFBO(dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, halfFloatType, gl.LINEAR)
    let velocity = createDoubleFBO(simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, halfFloatType, gl.LINEAR)
    let divergence = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, gl.NEAREST)
    let curl = createFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, gl.NEAREST)
    let pressure = createDoubleFBO(simRes.width, simRes.height, formatR.internalFormat, formatR.format, halfFloatType, gl.NEAREST)

    function updatePointerMoveData(pointer: Pointer, posX: number, posY: number) {
      pointer.prevTexcoordX = pointer.texcoordX
      pointer.prevTexcoordY = pointer.texcoordY
      pointer.texcoordX = posX / canvas!.width
      pointer.texcoordY = 1.0 - posY / canvas!.height
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX)
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY)
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0
    }

    function correctDeltaX(delta: number) {
      const aspectRatio = canvas!.width / canvas!.height
      if (aspectRatio < 1) delta *= aspectRatio
      return delta
    }

    function correctDeltaY(delta: number) {
      const aspectRatio = canvas!.width / canvas!.height
      if (aspectRatio > 1) delta /= aspectRatio
      return delta
    }

    // Splat function
    function splat(x: number, y: number, dx: number, dy: number, color: { r: number; g: number; b: number }) {
      gl!.useProgram(splatProgram)
      gl!.uniform1i(gl!.getUniformLocation(splatProgram, "uTarget"), velocity.read.attach(0))
      gl!.uniform1f(gl!.getUniformLocation(splatProgram, "aspectRatio"), canvas!.width / canvas!.height)
      gl!.uniform2f(gl!.getUniformLocation(splatProgram, "point"), x, y)
      gl!.uniform3f(gl!.getUniformLocation(splatProgram, "color"), dx, dy, 0.0)
      gl!.uniform1f(gl!.getUniformLocation(splatProgram, "radius"), correctRadius(config.SPLAT_RADIUS / 100.0))
      blit(velocity.write.fbo)
      velocity.swap()

      gl!.uniform1i(gl!.getUniformLocation(splatProgram, "uTarget"), dye.read.attach(0))
      gl!.uniform3f(gl!.getUniformLocation(splatProgram, "color"), color.r, color.g, color.b)
      blit(dye.write.fbo)
      dye.swap()
    }

    function correctRadius(radius: number) {
      const aspectRatio = canvas!.width / canvas!.height
      if (aspectRatio > 1) radius *= aspectRatio
      return radius
    }

    function multipleSplats(amount: number) {
      for (let i = 0; i < amount; i++) {
        const color = generateColor()
        const x = Math.random()
        const y = Math.random()
        const dx = 1000 * (Math.random() - 0.5)
        const dy = 1000 * (Math.random() - 0.5)
        splat(x, y, dx, dy, color)
      }
    }

    // Step function
    function step(dt: number) {
      gl!.disable(gl!.BLEND)

      // Curl
      gl!.useProgram(curlProgram)
      gl!.uniform2f(gl!.getUniformLocation(curlProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(curlProgram, "uVelocity"), velocity.read.attach(0))
      blit(curl.fbo)

      // Vorticity
      gl!.useProgram(vorticityProgram)
      gl!.uniform2f(gl!.getUniformLocation(vorticityProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(vorticityProgram, "uVelocity"), velocity.read.attach(0))
      gl!.uniform1i(gl!.getUniformLocation(vorticityProgram, "uCurl"), curl.attach(1))
      gl!.uniform1f(gl!.getUniformLocation(vorticityProgram, "curl"), config.CURL)
      gl!.uniform1f(gl!.getUniformLocation(vorticityProgram, "dt"), dt)
      blit(velocity.write.fbo)
      velocity.swap()

      // Divergence
      gl!.useProgram(divergenceProgram)
      gl!.uniform2f(gl!.getUniformLocation(divergenceProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(divergenceProgram, "uVelocity"), velocity.read.attach(0))
      blit(divergence.fbo)

      // Pressure
      gl!.useProgram(pressureProgram)
      gl!.uniform2f(gl!.getUniformLocation(pressureProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(pressureProgram, "uDivergence"), divergence.attach(0))
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(gl!.getUniformLocation(pressureProgram, "uPressure"), pressure.read.attach(1))
        blit(pressure.write.fbo)
        pressure.swap()
      }

      // Gradient subtract
      gl!.useProgram(gradientSubtractProgram)
      gl!.uniform2f(gl!.getUniformLocation(gradientSubtractProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(gradientSubtractProgram, "uPressure"), pressure.read.attach(0))
      gl!.uniform1i(gl!.getUniformLocation(gradientSubtractProgram, "uVelocity"), velocity.read.attach(1))
      blit(velocity.write.fbo)
      velocity.swap()

      // Advection
      gl!.useProgram(advectionProgram)
      gl!.uniform2f(gl!.getUniformLocation(advectionProgram, "texelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform2f(gl!.getUniformLocation(advectionProgram, "dyeTexelSize"), velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(advectionProgram, "uVelocity"), velocity.read.attach(0))
      gl!.uniform1i(gl!.getUniformLocation(advectionProgram, "uSource"), velocity.read.attach(0))
      gl!.uniform1f(gl!.getUniformLocation(advectionProgram, "dt"), dt)
      gl!.uniform1f(gl!.getUniformLocation(advectionProgram, "dissipation"), config.VELOCITY_DISSIPATION)
      blit(velocity.write.fbo)
      velocity.swap()

      gl!.uniform2f(gl!.getUniformLocation(advectionProgram, "dyeTexelSize"), dye.texelSizeX, dye.texelSizeY)
      gl!.uniform1i(gl!.getUniformLocation(advectionProgram, "uVelocity"), velocity.read.attach(0))
      gl!.uniform1i(gl!.getUniformLocation(advectionProgram, "uSource"), dye.read.attach(1))
      gl!.uniform1f(gl!.getUniformLocation(advectionProgram, "dissipation"), config.DENSITY_DISSIPATION)
      blit(dye.write.fbo)
      dye.swap()
    }

    // Render function
    function render() {
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
      gl!.enable(gl!.BLEND)

      gl!.useProgram(displayProgram)
      gl!.uniform1i(gl!.getUniformLocation(displayProgram, "uTexture"), dye.read.attach(0))
      blit(null)
    }

    // Event handlers
    function handleMouseMove(e: MouseEvent) {
      const pointer = pointersRef.current[0]
      if (!pointer.down) return

      const rect = canvas!.getBoundingClientRect()
      const posX = e.clientX - rect.left
      const posY = e.clientY - rect.top
      updatePointerMoveData(pointer, posX, posY)
    }

    function handleMouseDown(e: MouseEvent) {
      const pointer = pointersRef.current[0]
      const rect = canvas!.getBoundingClientRect()
      const posX = e.clientX - rect.left
      const posY = e.clientY - rect.top
      updatePointerMoveData(pointer, posX, posY)
      pointer.down = true
      pointer.color = generateColor()
    }

    function handleMouseUp() {
      pointersRef.current[0].down = false
    }

    function handleTouchStart(e: TouchEvent) {
      const touches = e.targetTouches
      const pointer = pointersRef.current[0]
      const rect = canvas!.getBoundingClientRect()

      for (let i = 0; i < touches.length; i++) {
        const posX = touches[i].clientX - rect.left
        const posY = touches[i].clientY - rect.top
        updatePointerMoveData(pointer, posX, posY)
        pointer.down = true
        pointer.color = generateColor()
      }
    }

    function handleTouchMove(e: TouchEvent) {
      const touches = e.targetTouches
      const pointer = pointersRef.current[0]
      const rect = canvas!.getBoundingClientRect()

      for (let i = 0; i < touches.length; i++) {
        const posX = touches[i].clientX - rect.left
        const posY = touches[i].clientY - rect.top
        updatePointerMoveData(pointer, posX, posY)
      }
      e.preventDefault()
    }

    function handleTouchEnd() {
      pointersRef.current[0].down = false
    }

    // Add event listeners
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("touchstart", handleTouchStart)
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd)

    // Initial splats
    multipleSplats(isMobile ? 3 : 5)

    // Animation loop
    let lastTime = Date.now()
    let colorUpdateTimer = 0

    function update() {
      const now = Date.now()
      let dt = (now - lastTime) / 1000
      dt = Math.min(dt, 0.016666)
      lastTime = now

      // Random splats over time
      colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer -= 1
        const pointer = pointersRef.current[0]
        pointer.color = generateColor()
      }

      // Add random splats occasionally
      if (Math.random() < 0.01) {
        multipleSplats(1)
      }

      // Process pointer movements
      for (const pointer of pointersRef.current) {
        if (pointer.moved) {
          pointer.moved = false
          splat(pointer.texcoordX, pointer.texcoordY, pointer.deltaX * config.SPLAT_FORCE, pointer.deltaY * config.SPLAT_FORCE, pointer.color)
        }
      }

      step(dt)
      render()

      animationRef.current = requestAnimationFrame(update)
    }

    // Enable vertex attrib
    const positionLocation = gl.getAttribLocation(displayProgram, "aPosition")
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    update()

    return () => {
      cancelAnimationFrame(animationRef.current!)
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
    }
  }, [generateColor])

  return (
    <>
      {/* CSS fallback gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-blue-50 to-green-100 opacity-50" />

      {/* WebGL canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      />
    </>
  )
}
