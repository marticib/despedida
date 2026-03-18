import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './DrinkTracker.css'

const DRINKS = [
  { id: 'birra',   label: 'Birra',        emoji: '🍺', pts: 1 },
  { id: 'cubata',  label: 'Cubata',       emoji: '🍹', pts: 2 },
  { id: 'xupito',  label: 'Xupito',       emoji: '🥃', pts: 3 },
  { id: 'vi',      label: 'Copa de vi',   emoji: '🍷', pts: 1 },
  { id: 'cava',    label: 'Copa de cava', emoji: '🥂', pts: 1 },
  { id: 'whisky',  label: 'Whisky sol',   emoji: '🥃', pts: 2 },
]

// Dia actual: canvia a les 10:00 del matí
function getCurrentDay() {
  const now = new Date()
  if (now.getHours() < 10) now.setDate(now.getDate() - 1)
  return now.toISOString().split('T')[0] // 'YYYY-MM-DD'
}

function calcScore(counts) {
  return DRINKS.reduce((sum, d) => sum + ((counts?.[d.id] ?? 0) * d.pts), 0)
}

const HANGOVER_LEVELS = [
  { min: 0,  label: 'Sobri',            emoji: '😇' },
  { min: 1,  label: 'Calentant motors', emoji: '🍺' },
  { min: 5,  label: 'Animat',           emoji: '😄' },
  { min: 10, label: 'Torrat',           emoji: '🥴' },
  { min: 16, label: 'Molt torrat',      emoji: '😵' },
]

function getStatus(score) {
  return [...HANGOVER_LEVELS].reverse().find(l => score >= l.min) ?? HANGOVER_LEVELS[0]
}

export default function DrinkTracker({ hideFab = false }) {
  const { user } = useAuth()
  const [allDrinks, setAllDrinks] = useState([])
  const [showSheet, setShowSheet] = useState(false)
  const [toast, setToast] = useState(null)
  const [view, setView] = useState('daily') // 'daily' | 'total'
  const username = user?.displayName

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drinks'), (snap) => {
      setAllDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function addDrink(drinkId, delta) {
    const myEntry = allDrinks.find(d => d.id === user.uid)
    if (delta < 0 && (myEntry?.total?.[drinkId] ?? 0) === 0) return

    const day = getCurrentDay()
    const ref = doc(db, 'drinks', user.uid)

    if (!myEntry) {
      await setDoc(ref, { userId: user.uid, username, total: {}, days: {} })
    }

    const updates = {
      userId: user.uid,
      username,
      [`total.${drinkId}`]: increment(delta),
      updatedAt: serverTimestamp(),
    }
    // Decrement daily only if there's count today, always increment
    if (delta > 0 || (myEntry?.days?.[day]?.[drinkId] ?? 0) > 0) {
      updates[`days.${day}.${drinkId}`] = increment(delta)
    }

    await updateDoc(ref, updates)

    if (delta > 0) {
      const drink = DRINKS.find(d => d.id === drinkId)
      setToast(`${drink.emoji} ${drink.label} afegit!`)
      setTimeout(() => setToast(null), 2500)
    }
  }

  async function addOneDrink(drinkId) {
    await addDrink(drinkId, 1)
    setShowSheet(false)
  }

  const day = getCurrentDay()
  const myEntry = allDrinks.find(d => d.id === user.uid) ?? {}
  const myCounts = view === 'daily' ? (myEntry.days?.[day] ?? {}) : (myEntry.total ?? {})

  const ranking = [...allDrinks]
    .map(entry => ({
      ...entry,
      _score: view === 'daily'
        ? calcScore(entry.days?.[day] ?? {})
        : calcScore(entry.total ?? {}),
      _counts: view === 'daily' ? (entry.days?.[day] ?? {}) : (entry.total ?? {}),
    }))
    .filter(e => e._score > 0)
    .sort((a, b) => b._score - a._score)

  return (
    <section className="drinks">
      <div className="drinks__header">
        <h2 className="drinks__title">ranking dels <span>més torrats</span></h2>
        <p className="drinks__sub">birra/vi/cava 1pt · cubata/whisky 2pt · xupito 3pt</p>
      </div>

      {/* Tab toggle */}
      <div className="drinks-tabs">
        <button
          className={`drinks-tab ${view === 'daily' ? 'drinks-tab--active' : ''}`}
          onClick={() => setView('daily')}
        >avui</button>
        <button
          className={`drinks-tab ${view === 'total' ? 'drinks-tab--active' : ''}`}
          onClick={() => setView('total')}
        >total despedida</button>
      </div>

      {/* Ranking */}
      <div className="drinks-ranking">
        {ranking.length === 0 ? (
          <p className="drinks-ranking__empty">
            {view === 'daily' ? 'ningú ha begut res avui 😇' : 'ningú ha begut res encara 😇'}
          </p>
        ) : (
          ranking.map((entry, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
            const breakdown = DRINKS
              .filter(d => (entry._counts[d.id] ?? 0) > 0)
              .map(d => `${entry._counts[d.id]}×${d.emoji}`)
              .join('  ')
            const status = getStatus(entry._score)
            return (
              <div
                key={entry.id}
                className={`drinks-rank-row ${entry.id === user.uid ? 'drinks-rank-row--me' : ''}`}
              >
                <span className="drinks-rank-row__pos">{medal}</span>
                <div className="drinks-rank-row__info">
                  <span className="drinks-rank-row__name">{entry.username}</span>
                  <span className="drinks-rank-row__status">{status.emoji} {status.label}</span>
                </div>
                <span className="drinks-rank-row__breakdown">{breakdown}</span>
                <span className="drinks-rank-row__score">{entry._score} pts</span>
              </div>
            )
          })
        )}
      </div>

      {/* My counters — desktop */}
      <div className="drinks-mine">
        <h3 className="drinks-mine__title">els teus drinks, <span>{username}</span></h3>
        <div className="drinks-mine__status">
          {(() => { const s = getStatus(calcScore(myCounts)); return <><span className="drinks-mine__status-emoji">{s.emoji}</span><span>{s.label}</span></> })()}
        </div>
        <div className="drinks-grid">
          {DRINKS.map(drink => (
            <div key={drink.id} className="drink-card">
              <span className="drink-card__emoji">{drink.emoji}</span>
              <span className="drink-card__label">{drink.label}</span>
              <div className="drink-card__counter">
                <button
                  className="drink-btn drink-btn--minus"
                  onClick={() => addDrink(drink.id, -1)}
                  disabled={(myEntry.total?.[drink.id] ?? 0) === 0}
                >−</button>
                <span className="drink-card__count">{myEntry.total?.[drink.id] ?? 0}</span>
                <button
                  className="drink-btn drink-btn--plus"
                  onClick={() => addDrink(drink.id, 1)}
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB — mobile only */}
      {!hideFab && (
        <button className="drinks-fab" onClick={() => setShowSheet(true)} aria-label="Afegir drink">
          🍺
        </button>
      )}

      {/* Toast */}
      {toast && <div className="drinks-toast">{toast}</div>}

      {/* Bottom sheet — mobile only */}
      {showSheet && (
        <>
          <div className="drinks-sheet-backdrop" onClick={() => setShowSheet(false)} />
          <div className="drinks-sheet">
            <p className="drinks-sheet__title">què has begut?</p>
            <div className="drinks-sheet__grid">
              {DRINKS.map(drink => (
                <button
                  key={drink.id}
                  className="drinks-sheet__btn"
                  onClick={() => addOneDrink(drink.id)}
                >
                  <span className="drinks-sheet__emoji">{drink.emoji}</span>
                  <span className="drinks-sheet__label">{drink.label}</span>
                  {(myEntry.total?.[drink.id] ?? 0) > 0 && (
                    <span className="drinks-sheet__count">{myEntry.total?.[drink.id]}</span>
                  )}
                </button>
              ))}
            </div>
            <button className="drinks-sheet__cancel" onClick={() => setShowSheet(false)}>cancel·lar</button>
          </div>
        </>
      )}
    </section>
  )
}

