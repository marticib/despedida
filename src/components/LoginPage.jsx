import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './LoginPage.css'

const USERNAMES = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']

export default function LoginPage({ onBack }) {
  const [selected, setSelected] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleLogin(e) {
    e.preventDefault()
    if (!selected || !password) return
    setLoading(true)
    setError(null)
    const err = await login(selected, password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      onBack?.()
    }
  }

  return (
    <div className="login-page">
      {onBack && (
        <button className="login-back" onClick={onBack}>
          ← tornar
        </button>
      )}
      <div className="login-box">
        <p className="login-handle">@benvinguts_a_la_despedida</p>
        <h1 className="login-title">QUI ETS?</h1>
        <p className="login-hint">Escull el teu nom</p>

        <div className="login-users">
          {USERNAMES.map(name => (
            <button
              key={name}
              type="button"
              className={`login-user-btn ${selected === name ? 'login-user-btn--active' : ''}`}
              onClick={() => { setSelected(name); setError(null) }}
            >
              {name}
            </button>
          ))}
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-wrap">
            <input
              type="password"
              className="login-input"
              placeholder="contrasenya"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null) }}
              autoComplete="current-password"
              disabled={!selected}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button
            type="submit"
            className="login-submit"
            disabled={!selected || !password || loading}
          >
            {loading ? '...' : `ENTRAR COM A ${selected ?? '???'} →`}
          </button>
        </form>
      </div>
    </div>
  )
}
