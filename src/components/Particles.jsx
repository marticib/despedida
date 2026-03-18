import { useEffect, useRef } from 'react'

// Subtle floating gold dust particles
function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

function createParticle() {
  return {
    x: randomBetween(0, 100),
    y: randomBetween(0, 100),
    size: randomBetween(1, 2.5),
    speedY: randomBetween(-0.06, -0.18),
    speedX: randomBetween(-0.04, 0.04),
    opacity: randomBetween(0.1, 0.5),
    opacityDir: Math.random() > 0.5 ? 1 : -1,
  }
}

export default function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let width  = window.innerWidth
    let height = window.innerHeight
    canvas.width  = width
    canvas.height = height

    const particles = Array.from({ length: 55 }, createParticle)

    let raf
    let running = true

    function draw() {
      if (!running) return
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(
          (p.x / 100) * width,
          (p.y / 100) * height,
          p.size,
          0,
          Math.PI * 2,
        )
        ctx.fillStyle = `rgba(245, 196, 0, ${p.opacity})`
        ctx.fill()

        // Drift
        p.y += p.speedY
        p.x += p.speedX

        // Breathe
        p.opacity += p.opacityDir * 0.003
        if (p.opacity > 0.55 || p.opacity < 0.05) p.opacityDir *= -1

        // Wrap
        if (p.y < -2) p.y = 102
        if (p.x < -2) p.x = 102
        if (p.x > 102) p.x = -2
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width  = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
