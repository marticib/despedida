import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './Confirmations.css'

const ALL_USERS = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']

export default function Confirmations() {
  const { user, logout } = useAuth()
  const [confirmations, setConfirmations] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const username = user?.user_metadata?.username
    ?? user?.email?.split('@')[0]?.replace(/^\w/, c => c.toUpperCase())

  useEffect(() => {
    // Initial load
    supabase.from('confirmations').select('*').then(({ data }) => {
      if (data) setConfirmations(data)
      setLoaded(true)
    })

    // Real-time subscription
    const channel = supabase
      .channel('confirmations-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'confirmations' },
        (payload) => {
          setConfirmations(prev => {
            if (payload.eventType === 'INSERT') return [...prev, payload.new]
            if (payload.eventType === 'UPDATE') return prev.map(c => c.id === payload.new.id ? payload.new : c)
            if (payload.eventType === 'DELETE') return prev.filter(c => c.id !== payload.old.id)
            return prev
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function setAttendance(attending) {
    setSaving(true)
    const existing = confirmations.find(c => c.user_id === user.id)
    if (existing) {
      await supabase
        .from('confirmations')
        .update({ attending, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('confirmations')
        .insert({ user_id: user.id, username, attending })
    }
    setSaving(false)
  }

  const myRecord = loaded ? (confirmations.find(c => c.user_id === user.id) ?? null) : undefined
  const confirmed = confirmations.filter(c => c.attending === true).length

  return (
    <section className="confirmations">
      <div className="confirmations__header">
        <h2 className="confirmations__title">qui <span>ve</span>?</h2>
        <p className="confirmations__meta">
          {loaded ? `${confirmed}/${ALL_USERS.length} confirmats · temps real 🟢` : 'carregant...'}
        </p>
      </div>

      {/* My status */}
      {loaded && (
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

      <button className="conf-logout" onClick={logout}>
        sortir ({username})
      </button>
    </section>
  )
}
