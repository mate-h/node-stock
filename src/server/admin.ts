import admin from 'firebase-admin'
import config from './config.js'

export function initFirebase() {
  const c = config as admin.ServiceAccount
  c['private_key'] = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n')
  c['private_key_id'] = process.env.PRIVATE_KEY_ID

  admin.initializeApp({
    credential: admin.credential.cert(config as admin.ServiceAccount),
  })
}
