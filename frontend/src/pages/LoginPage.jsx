import React from 'react'

export default function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-bg-orb orb1" />
      <div className="login-bg-orb orb2" />
      <div className="login-bg-orb orb3" />

      <div className="login-card">
        <div className="login-logo">✓</div>
        <h1 className="login-title">TaskFlow</h1>
        <p className="login-subtitle">
          Your to-do list, synced live to Google Calendar.<br />
          Add a task — it shows up instantly as an event.
        </p>

        <button className="btn-google" onClick={onLogin}>
          <GoogleIcon />
          Sign in with Google
        </button>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">📅</div>
            <div className="login-feature-text">Auto-sync to Google Calendar</div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">🏷️</div>
            <div className="login-feature-text">Labels, priorities &amp; subtasks</div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">🔒</div>
            <div className="login-feature-text">Encrypted &amp; secure storage</div>
          </div>
        </div>

        <p className="login-disclaimer">
          Requires Google Calendar access to create and manage events on your behalf.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
