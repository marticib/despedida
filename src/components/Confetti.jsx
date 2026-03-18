import { useEffect, useRef } from 'react'
import './Confetti.css'

const COLORS = ['#FFD700', '#FF1493', '#9B30FF', '#00FFFF', '#FF6B00', '#00FF99', '#FF4500']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

function createPiece() {
  return {
    x: randomBetween(0, 100),       // % across screen
    y: randomBetween(-20, -5),      // starts above viewport
    size: randomBetween(6, 14),
    speedY: randomBetween(1.5, 4),
    speedX: randomBetween(-1, 1),
    rotation: randomBetween(0, 360),
    rotationSpeed: randomBetween(-3, 3),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    opacity: randomBetween(0.7, 1),
  }
}

export default function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    let width  = window.innerWidth
    let height = window.innerHeight
    canvas.width  = width
    canvas.height = height

    const pieces = Array.from({ length: 120 }, createPiece)

    let raf
    let running = true

    function draw() {
      if (!running) return
      ctx.clearRect(0, 0, width, height)

      for (const p of pieces) {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate((p.x / 100) * width, (p.y / 100) * height)
        ctx.rotate((p.rotation * Math.PI) / 180)

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        // Update position
        p.y += p.speedY * 0.4
        p.x += p.speedX * 0.2
        p.rotation += p.rotationSpeed

        // Reset when fallen off screen
        if (p.y > 110) {
          p.y = randomBetween(-15, -2)
          p.x = randomBetween(0, 100)
        }
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

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />
}
