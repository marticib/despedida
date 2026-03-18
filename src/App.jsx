import { useState } from 'react'
import Countdown from './components/Countdown.jsx'
import Particles from './components/Particles.jsx'
import LoginPage from './components/LoginPage.jsx'
import Confirmations from './components/Confirmations.jsx'
import { useAuth } from './context/AuthContext.jsx'
import './App.css'

function getNextThursday() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntil = dayOfWeek === 4 ? 7 : (4 - dayOfWeek + 7) % 7
  const target = new Date(now)
  target.setDate(now.getDate() + daysUntil)
  target.setHours(20, 0, 0, 0)
  return target
}

// 🔧 Canvia els noms i descripcions aquí
const CHARACTERS = [
  {
    id: 1,
    name: 'Personatge 1',
    quote: '"Jo controlo"',
    desc: 'Arribarà a casa caminant. Sol. A les 6 del matí. Però arribarà.',
    icon: '🧍',
  },
  {
    id: 2,
    name: 'Personatge 2',
    quote: '"Un últim i marxem"',
    desc: 'Caigut al segon cubata. Perdut al tercer bar. Millor personatge de la nit.',
    icon: '🥴',
  },
  {
    id: 3,
    name: 'Personatge 3',
    quote: '"Jo estic bé, juro"',
    desc: "Hi ha fotos. Moltes. Que no veuràs mai a la llum del dia.",
    icon: '😵',
  },
]

export default function App() {
  const { user } = useAuth()
  const [targetDate] = useState(getNextThursday)

  if (user === undefined) return <div className="app-loading" />
  if (user === null) return <LoginPage />

  const formattedDate = targetDate.toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="app">
      <Particles />

      <main className="main">
        {/* Instagram-style profile header */}
        <header className="profile">
          <p className="profile__handle">@benvinguts_a_la_despedida</p>
          <h1 className="profile__title">
            BENVINGUTS<br />A LA VOSTRA<br /><em>DESPEDIDA</em>
          </h1>
          <div className="profile__bio">
            <p>3 nuvis.</p>
            <p>Un compte enrere.</p>
            <p>Moltes decisions dubtoses.</p>
            <p className="profile__bio-accent">🗓️ compte enrere activat.</p>
          </div>
        </header>

        {/* Choose your character */}
        <section className="characters">
          <div className="characters__header">
            <h2 className="characters__title">choose your character</h2>
            <p className="characters__sub">com d'torrat anirás a la despedida?</p>
          </div>
          <div className="characters__grid">
            {CHARACTERS.map((c) => (
              <div key={c.id} className="char-card">
                <div className="char-card__icon">{c.icon}</div>
                <p className="char-card__name">{c.name}</p>
                <p className="char-card__quote">{c.quote}</p>
                <p className="char-card__desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Countdown */}
        <section className="countdown-section">
          <h2 className="countdown-section__title">
            compte <span>enrere</span>
          </h2>
          <p className="countdown-section__date">{formattedDate}</p>
          <Countdown targetDate={targetDate} />
        </section>

        {/* Confirmations — real-time */}
        <Confirmations />

        {/* Footer */}
        <footer className="footer">
          <p>🍾 prepara't. la llegenda comença aviat. 🍾</p>
        </footer>
      </main>
    </div>
  )
}
