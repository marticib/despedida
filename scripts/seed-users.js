#!/usr/bin/env node
// ================================================================
// SEED SCRIPT — Crea els 10 usuaris a Supabase Auth
//
// Ús:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SERVICE_ROLE_KEY=eyJ... \
//   node scripts/seed-users.js
//
// La SERVICE_ROLE_KEY la trobes a:
//   Supabase Dashboard → Settings → API → service_role (secret)
//
// IMPORTANT: Desactiva "Email Confirmation" abans d'executar:
//   Supabase → Authentication → Providers → Email → Confirm email → OFF
// ================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Cal definir SUPABASE_URL i SERVICE_ROLE_KEY com a variables d\'entorn')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = ['Barto', 'Nis', 'Kevin', 'Lobo', 'Llar', 'Llouas', 'Nil', 'Dai', 'Eric', 'Ti']
const PASSWORD = 'password'

async function seed() {
  console.log('Creant usuaris...\n')

  for (const name of USERS) {
    const email = `${name.toLowerCase()}@despedida.local`
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { username: name },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`⚠️  ${name} (${email}) — ja existeix, saltant`)
      } else {
        console.log(`❌ ${name}: ${error.message}`)
      }
    } else {
      console.log(`✅ ${name} (${email}) — creat`)
    }
  }

  console.log('\nFet! Ja pots fer login amb contrasenya "password".')
}

seed()
