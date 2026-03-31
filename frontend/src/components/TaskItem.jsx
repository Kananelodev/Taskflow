import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'

function fmtDate(date, time) {
  if (!date) return null
  try {
    const d = parseISO(date)
    const dateStr = format(d, 'EEE d MMM')
    return time ? `${dateStr} · ${time}` : dateStr
  } catch { return date }
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [hover, setHover] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editNotes, setEditNotes] = useState(task.notes)

  const saveEdit = () => {
    if (editTitle.trim()) {
      onEdit(task.id, { title: editTitle.trim(), notes: editNotes.trim() })
    }
    setEditing(false)
  }

  const dateStr = fmtDate(task.date, task.time)

  if (editing) {
    return (
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--accent)',
        borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 6
      }}>
        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
          style={{
            width: '100%', background: 'var(--surface2)', border: '0.5px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', padding: '7px 10px', fontSize: 14,
            marginBottom: 6, outline: 'none'
          }}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
        />
        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
          style={{
            width: '100%', background: 'var(--surface2)', border: '0.5px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', padding: '7px 10px', fontSize: 13,
            marginBottom: 8, resize: 'none', outline: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveEdit} style={{
            background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
            borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer'
          }}>Save</button>
          <button onClick={() => setEditing(false)} style={{
            background: 'var(--surface2)', color: 'var(--text2)', border: '0.5px solid var(--border)',
            borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer'
          }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'var(--surface)' : 'transparent',
        border: `0.5px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 6,
        display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all 0.12s'
      }}
    >
      <div style={{ marginTop: 2 }}>
        <input type="checkbox" checked={task.done} onChange={e => onToggle(task.id, e.target.checked)}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 400, color: task.done ? 'var(--text3)' : 'var(--text)',
          textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4
        }}>{task.title}</div>
        {task.notes && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3, lineHeight: 1.5 }}>
            {task.notes}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {dateStr && (
            <span style={{
              fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)',
              background: 'var(--surface2)', padding: '2px 7px', borderRadius: 4
            }}>{dateStr}</span>
          )}
          {task.synced && (
            <span style={{
              fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)',
              padding: '2px 7px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3
            }}>
              <span style={{ fontSize: 10 }}>✓</span> Calendar
            </span>
          )}
        </div>
      </div>
      {hover && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setEditing(true)} style={{
            background: 'none', border: '0.5px solid var(--border)', borderRadius: 6,
            color: 'var(--text2)', cursor: 'pointer', padding: '3px 8px', fontSize: 11
          }}>Edit</button>
          <button onClick={() => onDelete(task.id)} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1
          }}>×</button>
        </div>
      )}
    </div>
  )
}
