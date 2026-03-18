import { useState, useEffect, useRef } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './MessageWall.css'

export default function MessageWall({ open, onOpenChange }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const formRef = useRef(null)
  const lastSeenCount = useRef(0)

  const username = user?.displayName ?? user?.email?.split('@')[0] ?? 'Anònim'

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'), limit(200))
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setMessages(docs)
      if (!open) {
        const newCount = docs.length - lastSeenCount.current
        if (newCount > 0) setUnread((u) => u + newCount)
      }
    })
    return () => unsub()
  }, [open])

  useEffect(() => {
    if (open) {
      lastSeenCount.current = messages.length
      setUnread(0)
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      }, 50)
    }
  }, [open, messages.length])

  // visualViewport: push form up when iOS keyboard opens
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    function onViewport() {
      if (!formRef.current) return
      const offset = window.innerHeight - vv.height - vv.offsetTop
      formRef.current.style.transform = offset > 0 ? `translateY(-${offset}px)` : ''
    }
    vv.addEventListener('resize', onViewport)
    vv.addEventListener('scroll', onViewport)
    return () => {
      vv.removeEventListener('resize', onViewport)
      vv.removeEventListener('scroll', onViewport)
      if (formRef.current) formRef.current.style.transform = ''
    }
  }, [open])

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !user) return
    // Blur first so iOS keyboard closes and viewport resets before scroll
    inputRef.current?.blur()
    setSending(true)
    try {
      await addDoc(collection(db, 'messages'), {
        text: trimmed,
        uid: user.uid,
        username,
        timestamp: serverTimestamp(),
      })
      setText('')
      // Wait for keyboard to close + viewport to settle, then scroll
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      }, 350)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  function formatTime(ts) {
    if (!ts?.seconds) return ''
    const d = new Date(ts.seconds * 1000)
    return d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          className="msg-fab"
          onClick={() => onOpenChange(true)}
          title="Obrir mur de missatges"
        >
          💬
          {unread > 0 && <span className="msg-fab__badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
      )}

      {/* Overlay */}
      {open && <div className="msg-overlay" onClick={() => onOpenChange(false)} />}

      {/* Sidebar */}
      <aside className={`msg-sidebar${open ? ' msg-sidebar--open' : ''}`}>
        <div className="msg-sidebar__header">
          <h2 className="msg-sidebar__title">💬 Mur</h2>
          <button className="msg-sidebar__close" onClick={() => onOpenChange(false)}>✕</button>
        </div>

        <ul className="msg-list" ref={listRef}>
          {messages.length === 0 && (
            <li className="msg-list__empty">Cap missatge encara. Sigues el primer! 🎉</li>
          )}
          {messages.map((msg) => {
            const isMe = msg.uid === user?.uid
            return (
              <li key={msg.id} className={`msg-item${isMe ? ' msg-item--me' : ''}`}>
                <span className="msg-item__user">@{msg.username}</span>
                <div className="msg-item__bubble">{msg.text}</div>
                <span className="msg-item__time">{formatTime(msg.timestamp)}</span>
              </li>
            )
          })}
        </ul>

        <form className="msg-form" ref={formRef} onSubmit={handleSend}>
          <input
            ref={inputRef}
            className="msg-form__input"
            type="text"
            placeholder="Escriu un missatge..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            disabled={sending}
          />
          <button
            className="msg-form__send"
            type="submit"
            disabled={sending || !text.trim()}
          >
            ➤
          </button>
        </form>
      </aside>
    </>
  )
}
