import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../lib/firebase.js'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = loading, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return unsub
  }, [])

  async function login(username, password) {
    const email = `${username.toLowerCase()}@despedida.local`
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return null
    } catch {
      return 'Contrasenya incorrecta. Prova amb "password".'
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
