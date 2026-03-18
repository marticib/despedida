import { useState, useEffect } from 'react'
import './Countdown.css'

function pad(n) {
  return String(n).padStart(2, '0')
}

function getTimeLeft(target) {
  const diff = target - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  const hours   = Math.floor((diff / 1000 / 60 / 60) % 24)
  const days    = Math.floor(diff / 1000 / 60 / 60 / 24)

  return { days, hours, minutes, seconds, done: false }
}

export default function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (timeLeft.done) {
    return (
      <div className="countdown-done">
        <span>És avui. Ja hi som.</span>
      </div>
    )
  }

  const units = [
    { label: 'Dies',    value: pad(timeLeft.days) },
    { label: 'Hores',   value: pad(timeLeft.hours) },
    { label: 'Minuts',  value: pad(timeLeft.minutes) },
    { label: 'Segons',  value: pad(timeLeft.seconds) },
  ]

  return (
    <div className="countdown">
      {units.map(({ label, value }, i) => (
        <>
          <div key={label} className="countdown__unit">
            <div className="countdown__box">
              <span className="countdown__value">{value}</span>
            </div>
            <span className="countdown__label">{label}</span>
          </div>
          {i < units.length - 1 && (
            <span key={`sep-${i}`} className="countdown__sep" aria-hidden="true">·</span>
          )}
        </>
      ))}
    </div>
  )
}
