#!/usr/bin/env node
// Crea els 10 usuaris via Firebase Auth REST API (no cal service account)

const API_KEY = 'AIzaSyAXUxO19W6DFNBRi_l_XkYkQB_qEql6IjM'
const USERS = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']
const PASSWORD = 'password'

async function createUser(name) {
  const email = `${name.toLowerCase()}@despedida.local`

  // 1. Crear l'usuari
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
    }
  )
  const signUpData = await signUpRes.json()

  if (signUpData.error) {
    if (signUpData.error.message === 'EMAIL_EXISTS') {
      console.log(`⚠️  ${name} (${email}) — ja existeix, saltant`)
    } else {
      console.log(`❌ ${name}: ${signUpData.error.message}`)
    }
    return
  }

  // 2. Posar el displayName
  const updateRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: signUpData.idToken, displayName: name }),
    }
  )
  const updateData = await updateRes.json()

  if (updateData.error) {
    console.log(`⚠️  ${name} creat però displayName fallat: ${updateData.error.message}`)
  } else {
    console.log(`✅ ${name} (${email}) — creat`)
  }
}

async function seed() {
  console.log('Creant usuaris...\n')
  for (const name of USERS) {
    await createUser(name)
  }
  console.log('\nFet! Ja pots fer login amb contrasenya "password".')
}

seed()
