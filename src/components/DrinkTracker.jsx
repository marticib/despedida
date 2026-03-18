import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc, increment, serverTimestamp } from 'firebase/firestore'
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

function calcScore(entry) {
  return DRINKS.reduce((sum, d) => sum + (entry[d.id] ?? 0) * d.pts, 0)
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

export default function DrinkTracker() {
  const { user } = useAuth()
  const [allDrinks, setAllDrinks] = useState([])
  const [showSheet, setShowSheet] = useState(false)
  const username = user?.displayName

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'drinks'), (snap) => {
      setAllDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function addDrink(drinkId, delta) {
    const myDoc = allDrinks.find(d => d.id === user.uid) ?? {}
    if (delta < 0 && (myDoc[drinkId] ?? 0) === 0) return
    await setDoc(
      doc(db, 'drinks', user.uid),
      { userId: user.uid, username, [drinkId]: increment(delta), updatedAt: serverTimestamp() },
      { merge: true }
    )
  }

  async function addOneDrink(drinkId) {
    await addDrink(drinkId, 1)
    setShowSheet(false)
  }

  const myDoc = allDrinks.find(d => d.id === user.uid) ?? {}
  const ranking = [...allDrinks]
    .filter(d => calcScore(d) > 0)
    .sort((a, b) => calcScore(b) - calcScore(a))

  return (
    <section className="drinks">
      <div className="drinks__header">
        <h2 className="drinks__title">ranking dels <span>més torrats</span></h2>
        <p className="drinks__sub">birra/vi/cava 1pt · cubata/whisky 2pt · xupito 3pt</p>
      </div>

      {/* Ranking */}
      <div className="drinks-ranking">
        {ranking.length === 0 ? (
          <p className="drinks-ranking__empty">ningú ha begut res encara 😇</p>
        ) : (
          ranking.map((entry, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
            const breakdown = DRINKS
              .filter(d => entry[d.id] > 0)
              .map(d => `${entry[d.id]}×${d.emoji}`)
              .join('  ')
            const status = getStatus(calcScore(entry))
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
                <span className="drinks-rank-row__score">{calcScore(entry)} pts</span>
              </div>
            )
          })
        )}
      </div>

      {/* My counters */}
      <div className="drinks-mine">
        <h3 className="drinks-mine__title">els teus drinks, <span>{username}</span></h3>
        <div className="drinks-mine__status">
          {(() => { const s = getStatus(calcScore(myDoc)); return <><span className="drinks-mine__status-emoji">{s.emoji}</span><span>{s.label}</span></> })()}
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
                  disabled={(myDoc[drink.id] ?? 0) === 0}
                >−</button>
                <span className="drink-card__count">{myDoc[drink.id] ?? 0}</span>
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
      <button className="drinks-fab" onClick={() => setShowSheet(true)} aria-label="Afegir drink">
        +
      </button>

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
                  {(myDoc[drink.id] ?? 0) > 0 && (
                    <span className="drinks-sheet__count">{myDoc[drink.id]}</span>
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
