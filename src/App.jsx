import { useState } from 'react'
import Countdown from './components/Countdown.jsx'
import Particles from './components/Particles.jsx'
import LoginPage from './components/LoginPage.jsx'
import DrinkTracker from './components/DrinkTracker.jsx'
import PhotoGallery from './components/PhotoGallery.jsx'
import MessageWall from './components/MessageWall.jsx'
import { useAuth } from './context/AuthContext.jsx'
import './App.css'

function SiteHeader({ onLoginClick }) {
  const { user, logout } = useAuth()
  const username = user?.displayName ?? user?.email?.split('@')[0]

  return (
    <header className="site-header">
      <img src="/logo.png" alt="logo" className="site-header__logo" />
      <div className="site-header__auth">
        {user ? (
          <>
            <span className="site-header__user">{username}</span>
            <button className="site-header__btn site-header__btn--out" onClick={logout}>
              No sóc jo (vaig torrat)
            </button>
          </>
        ) : (
          <button className="site-header__btn" onClick={onLoginClick}>
            INICIAR SESSIÓ
          </button>
        )}
      </div>
    </header>
  )
}

function getNextThursday() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntil = dayOfWeek === 4 ? 7 : (4 - dayOfWeek + 7) % 7
  const target = new Date(now)
  target.setDate(now.getDate() + daysUntil)
  target.setHours(20, 0, 0, 0)
  return target
}

export default function App() {
  const { user } = useAuth()
  const [targetDate] = useState(() => new Date(2026, 6, 17, 20, 0, 0, 0))
  const [showLogin, setShowLogin] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)

  if (user === undefined) return <div className="app-loading" />
  if (showLogin && !user) return <LoginPage onBack={() => setShowLogin(false)} />

  const formattedDate = targetDate.toLocaleDateString('ca-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="app">
      <SiteHeader onLoginClick={() => setShowLogin(true)} />
      <Particles />

      <main className="main">
        {user ? (
          <>
            <DrinkTracker hideFab={msgOpen} />
            <PhotoGallery hideFab={msgOpen} />
            <MessageWall open={msgOpen} onOpenChange={setMsgOpen} />
          </>
        ) : (
          <>
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

            {/* Countdown */}
            <section className="countdown-section">
              <h2 className="countdown-section__title">
                compte <span>enrere</span>
              </h2>
              <p className="countdown-section__date">{formattedDate}</p>
              <Countdown targetDate={targetDate} />
            </section>

            {/* Footer */}
            <footer className="footer">
              <p>🍾 prepara't. la llegenda comença aviat. 🍾</p>
            </footer>
          </>
        )}
      </main>
    </div>
  )
}
