import React from 'react'

export default function LoginPage({ onLogin }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      background: 'var(--bg)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', fontSize: 26
        }}>✓</div>

        <h1 style={{
          fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 500,
          letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: 10
        }}>TaskFlow</h1>

        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6, marginBottom: '2.5rem' }}>
          Your to-do list, synced live to Google Calendar.
          Add a task — it shows up instantly as an event.
        </p>

        <button onClick={onLogin} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '0.5px solid var(--border2)',
          borderRadius: 'var(--radius)', padding: '12px 24px',
          color: 'var(--text)', cursor: 'pointer', fontSize: 14,
          fontWeight: 500, margin: '0 auto', transition: 'border-color 0.15s, background 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: '2rem', lineHeight: 1.6 }}>
          Requires Google Calendar access to create and manage events on your behalf.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
