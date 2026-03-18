#!/usr/bin/env node
// ================================================================
// SEED SCRIPT — Crea els 10 usuaris a Firebase Auth
//
// Ús:
//   FIREBASE_SERVICE_ACCOUNT=/path/to/service-account.json \
//   node scripts/seed-users.js
//
// El service account JSON el trobes a:
//   Firebase Console → Project Settings → Service accounts
//   → Generate new private key
// ================================================================

import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT
if (!serviceAccountPath) {
  console.error('Cal definir FIREBASE_SERVICE_ACCOUNT apuntant al JSON del service account')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const USERS = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']
const PASSWORD = 'password'

async function seed() {
  console.log('Creant usuaris...\n')

  for (const name of USERS) {
    const email = `${name.toLowerCase()}@despedida.local`
    try {
      await admin.auth().createUser({
        email,
        password: PASSWORD,
        displayName: name,
        emailVerified: true,
      })
      console.log(`✅ ${name} (${email}) — creat`)
    } catch (e) {
      if (e.code === 'auth/email-already-exists') {
        console.log(`⚠️  ${name} (${email}) — ja existeix, saltant`)
      } else {
        console.log(`❌ ${name}: ${e.message}`)
      }
    }
  }

  console.log('\nFet! Ja pots fer login amb contrasenya "password".')
}

seed()
