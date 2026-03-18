import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Confirmations.css'

const ALL_USERS = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']

export default function Confirmations({ onLoginClick }) {
  const { user, logout } = useAuth()
  const [confirmations, setConfirmations] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const username = user?.displayName
    ?? user?.email?.split('@')[0]?.replace(/^\w/, c => c.toUpperCase())

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'confirmations'), (snap) => {
      setConfirmations(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoaded(true)
    })
    return unsub
  }, [])

  async function setAttendance(attending) {
    setSaving(true)
    await setDoc(
      doc(db, 'confirmations', user.uid),
      { userId: user.uid, username, attending, updatedAt: serverTimestamp() },
      { merge: true }
    )
    setSaving(false)
  }

  const myRecord = loaded && user ? (confirmations.find(c => c.userId === user.uid) ?? null) : undefined
  const confirmed = confirmations.filter(c => c.attending === true).length

  return (
    <section className="confirmations">
      <div className="confirmations__header">
        <h2 className="confirmations__title">qui <span>ve</span>?</h2>
        <p className="confirmations__meta">
          {loaded ? `${confirmed}/${ALL_USERS.length} confirmats · temps real 🟢` : 'carregant...'}
        </p>
      </div>

      {/* Login CTA if not authenticated */}
      {!user && (
        <div className="conf-login-cta">
          <p>Inicia sessi\u00f3 per confirmar la teva assist\u00e8ncia</p>
          <button className="conf-btn conf-btn--yes" onClick={onLoginClick}>
            INICIAR SESSI\u00d3 →
          </button>
        </div>
      )}

      {/* My status — only when logged in */}
      {user && loaded && (
        <div className="conf-mine">
          {myRecord === null && (
            <>
              <p className="conf-mine__prompt">
                <strong>{username}</strong>, vens a la despedida? 🍾
              </p>
              <div className="conf-mine__actions">
                <button
                  className="conf-btn conf-btn--yes"
                  onClick={() => setAttendance(true)}
                  disabled={saving}
                >
                  VINC 🤙
                </button>
                <button
                  className="conf-btn conf-btn--no"
                  onClick={() => setAttendance(false)}
                  disabled={saving}
                >
                  NO VINC 😔
                </button>
              </div>
            </>
          )}

          {myRecord !== null && myRecord !== undefined && (
            <div className="conf-mine__status">
              <span className={`conf-mine__badge ${myRecord.attending ? 'conf-mine__badge--yes' : 'conf-mine__badge--no'}`}>
                {myRecord.attending ? '✓ VINC' : '✗ NO VINC'}
              </span>
              <button
                className="conf-mine__change"
                onClick={() => setAttendance(!myRecord.attending)}
                disabled={saving}
              >
                {saving ? '...' : 'canviar'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* All users grid */}
      <div className="conf-grid">
        {ALL_USERS.map(name => {
          const record = confirmations.find(c => c.username === name)
          const isMe = name === username
          const status = !loaded ? 'loading'
            : !record ? 'pending'
            : record.attending ? 'yes' : 'no'

          return (
            <div
              key={name}
              className={`conf-card conf-card--${status} ${isMe ? 'conf-card--me' : ''}`}
            >
              <span className="conf-card__icon">
                {status === 'yes' ? '✓' : status === 'no' ? '✗' : '?'}
              </span>
              <span className="conf-card__name">{name}</span>
              {isMe && <span className="conf-card__me-tag">tu</span>}
            </div>
          )
        })}
      </div>

      {user && (
        <button className="conf-logout" onClick={logout}>
          sortir ({username})
        </button>
      )}
    </section>
  )
}
