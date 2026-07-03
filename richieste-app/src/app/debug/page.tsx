"use client"

function mask(value: string | undefined, keepStart = 6, keepEnd = 4): string {
  if (!value) return '❌ NON IMPOSTATA (undefined)'
  if (value.length <= keepStart + keepEnd) return value
  return `${value.slice(0, keepStart)}...${value.slice(-keepEnd)}  (lunghezza: ${value.length})`
}

export default function DebugPage() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', background: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'orange' }}>🔍 Debug Firebase Config (PRODUZIONE)</h1>
      <p style={{ color: '#888' }}>Questa pagina mostra cosa carica davvero l&apos;app online. Cancellala dopo il debug.</p>
      <br />
      <div>apiKey: {mask(config.apiKey)}</div>
      <div>authDomain: {config.authDomain || '❌ NON IMPOSTATA'}</div>
      <div>projectId: {config.projectId || '❌ NON IMPOSTATA'}</div>
      <div>storageBucket: {config.storageBucket || '❌ NON IMPOSTATA'}</div>
      <div>messagingSenderId: {config.messagingSenderId || '❌ NON IMPOSTATA'}</div>
      <div>appId: {mask(config.appId, 10, 6)}</div>
    </div>
  )
}
