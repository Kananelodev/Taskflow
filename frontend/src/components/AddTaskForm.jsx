import React, { useState } from 'react'

const today = () => new Date().toISOString().split('T')[0]

export default function AddTaskForm({ onAdd, syncing }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [open, setOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    await onAdd({ title: title.trim(), notes: notes.trim(), date, time })
    setTitle(''); setNotes(''); setDate(today()); setTime(''); setOpen(false)
  }

  const inp = {
    background: 'var(--surface2)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)', padding: '9px 12px',
    outline: 'none', width: '100%', transition: 'border-color 0.15s',
  }

  return (
    <form onSubmit={submit} style={{
      background: 'var(--surface)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1.25rem'
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: open ? 12 : 0 }}>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); if (!open && e.target.value) setOpen(true) }}
          placeholder="Add a task..."
          style={{ ...inp, flex: 1, fontSize: 15 }}
          onFocus={e => { setOpen(true); e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <button type="submit" disabled={syncing || !title.trim()} style={{
          background: title.trim() ? 'var(--accent)' : 'var(--surface2)',
          color: title.trim() ? 'var(--accent-text)' : 'var(--text3)',
          border: 'none', borderRadius: 'var(--radius)', padding: '9px 18px',
          cursor: title.trim() ? 'pointer' : 'default', fontWeight: 500,
          fontSize: 13, transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap'
        }}>
          {syncing ? 'Syncing...' : '+ Add'}
        </button>
      </div>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            style={{ ...inp, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: 'var(--accent)' }}>✓</span> Will be added to your Google Calendar
          </p>
        </div>
      )}
    </form>
  )
}
