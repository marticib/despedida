import { useState, useEffect, useRef } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import './PhotoGallery.css'

export default function PhotoGallery() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showUploadSheet, setShowUploadSheet] = useState(false)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const username = user?.displayName ?? user?.email?.split('@')[0] ?? 'Anònim'

  useEffect(() => {
    const q = query(collection(db, 'photos'), orderBy('timestamp', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort by votes count descending, then by timestamp descending
      docs.sort((a, b) => {
        const vA = (a.votes || []).length
        const vB = (b.votes || []).length
        if (vB !== vA) return vB - vA
        const tA = a.timestamp?.seconds ?? 0
        const tB = b.timestamp?.seconds ?? 0
        return tB - tA
      })
      setPhotos(docs)
    })
    return () => unsub()
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Només imatges, campió 📸', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('La foto pesa massa (màx 10MB)', 'error')
      return
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setShowUploadSheet(true)
  }

  async function handleUpload() {
    if (!selectedFile || !user) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message ?? 'ImgBB error')
      const url = data.data.url
      await addDoc(collection(db, 'photos'), {
        url,
        uploadedBy: user.uid,
        username,
        caption: caption.trim(),
        timestamp: serverTimestamp(),
        votes: [],
      })
      showToast('Foto pujada! 🎉')
      setSelectedFile(null)
      setPreview(null)
      setCaption('')
      setShowUploadSheet(false)
      fileInputRef.current.value = ''
    } catch (err) {
      console.error(err)
      showToast('Error pujant la foto 😵', 'error')
    } finally {
      setUploading(false)
    }
  }

  function cancelUpload() {
    setSelectedFile(null)
    setPreview(null)
    setCaption('')
    setShowUploadSheet(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  async function toggleVote(photo) {
    if (!user) return
    const docRef = doc(db, 'photos', photo.id)
    const hasVoted = (photo.votes || []).includes(user.uid)
    try {
      await updateDoc(docRef, {
        votes: hasVoted ? arrayRemove(user.uid) : arrayUnion(user.uid),
      })
    } catch (err) {
      console.error(err)
      showToast('Error votant 😵', 'error')
    }
  }

  async function deletePhoto(photo) {
    if (!user || photo.uploadedBy !== user.uid) return
    setConfirmDelete(null)
    try {
      await deleteDoc(doc(db, 'photos', photo.id))
      showToast('Foto eliminada')
    } catch (err) {
      console.error(err)
      showToast('Error eliminant la foto 😵', 'error')
    }
  }

  const ranked = photos.map((p, i) => ({ ...p, rank: i + 1 }))

  return (
    <section className="photo-gallery">
      <div className="photo-gallery__header">
        <h2 className="photo-gallery__title">
          galeria <span>dels torrats</span>
        </h2>
        <p className="photo-gallery__subtitle">Penja fotos dels nuvis. Vota la millor.</p>
      </div>

      {/* FAB upload button */}
      {showFabMenu && (
        <div className="photo-gallery__fab-overlay" onClick={() => setShowFabMenu(false)} />
      )}
      <div className="photo-gallery__fab-group">
        {showFabMenu && (
          <>
            <button
              className="photo-gallery__fab-option"
              onClick={() => { setShowFabMenu(false); fileInputRef.current?.click() }}
              title="Triar de la galeria"
            >
              <span>🖼️</span>
              <span className="photo-gallery__fab-label">Galeria</span>
            </button>
            <button
              className="photo-gallery__fab-option"
              onClick={() => { setShowFabMenu(false); cameraInputRef.current?.click() }}
              title="Obrir càmera"
            >
              <span>📷</span>
              <span className="photo-gallery__fab-label">Càmera</span>
            </button>
          </>
        )}
        <button
          className={`photo-gallery__fab${showFabMenu ? ' photo-gallery__fab--open' : ''}`}
          onClick={() => setShowFabMenu((v) => !v)}
          title="Penjar foto"
        >
          {showFabMenu ? '✕' : '📸'}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="photo-gallery__empty">
          <p>Cap foto encara.</p>
          <p>Sigues el primer en penjar-ne una! 📸</p>
        </div>
      ) : (
        <div className="photo-gallery__grid">
          {ranked.map((photo) => {
            const hasVoted = (photo.votes || []).includes(user.uid)
            const voteCount = (photo.votes || []).length
            const isOwner = photo.uploadedBy === user.uid
            const medal = photo.rank === 1 ? '🥇' : photo.rank === 2 ? '🥈' : photo.rank === 3 ? '🥉' : null

            return (
              <div key={photo.id} className={`photo-card${photo.rank === 1 ? ' photo-card--winner' : ''}`}>
                {medal && <span className="photo-card__medal">{medal}</span>}
                <img
                  src={photo.url}
                  alt={photo.caption || `Foto de ${photo.username}`}
                  className="photo-card__img"
                  loading="lazy"
                />
                <div className="photo-card__info">
                  <span className="photo-card__uploader">@{photo.username}</span>
                  {photo.caption && (
                    <p className="photo-card__caption">{photo.caption}</p>
                  )}
                  <div className="photo-card__actions">
                    <button
                      className={`photo-card__vote${hasVoted ? ' photo-card__vote--voted' : ''}`}
                      onClick={() => toggleVote(photo)}
                    >
                      <span className="photo-card__vote-icon">{hasVoted ? '❤️' : '🤍'}</span>
                      <span className="photo-card__vote-count">{voteCount}</span>
                    </button>
                    {isOwner && (
                      <button
                        className="photo-card__delete"
                        onClick={() => setConfirmDelete(photo)}
                        title="Eliminar foto"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload bottom sheet */}
      {showUploadSheet && (
        <div className="photo-sheet-overlay" onClick={!uploading ? cancelUpload : undefined}>
          <div className="photo-sheet" onClick={(e) => e.stopPropagation()}>
            {uploading && (
              <div className="photo-sheet__loader">
                <div className="photo-sheet__spinner" />
                <span>Pujant foto...</span>
              </div>
            )}
            <div className="photo-sheet__handle" />
            <h3 className="photo-sheet__title">Penjar foto</h3>
            {preview && (
              <img src={preview} alt="preview" className="photo-sheet__preview" />
            )}
            <input
              type="text"
              className="photo-sheet__caption"
              placeholder="Afegeix un peu de foto... (opcional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={100}
              disabled={uploading}
            />
            <div className="photo-sheet__btns">
              <button
                className="photo-sheet__btn photo-sheet__btn--cancel"
                onClick={cancelUpload}
                disabled={uploading}
              >
                Cancel·lar
              </button>
              <button
                className="photo-sheet__btn photo-sheet__btn--upload"
                onClick={handleUpload}
                disabled={uploading}
              >
                Penjar 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="photo-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="photo-confirm" onClick={(e) => e.stopPropagation()}>
            <p className="photo-confirm__icon">🗑️</p>
            <h3 className="photo-confirm__title">Eliminar foto?</h3>
            <p className="photo-confirm__text">Aquesta acció no es pot desfer.</p>
            <div className="photo-confirm__btns">
              <button
                className="photo-confirm__btn photo-confirm__btn--cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel·lar
              </button>
              <button
                className="photo-confirm__btn photo-confirm__btn--delete"
                onClick={() => deletePhoto(confirmDelete)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`photo-toast photo-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </section>
  )
}
