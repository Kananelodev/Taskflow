import React, { useState } from 'react'
import AddTaskForm from '../components/AddTaskForm'
import TaskItem from '../components/TaskItem'
import { useTasks } from '../hooks/useTasks'
import { format } from 'date-fns'

const FILTERS = ['All', 'Today', 'Pending', 'Done']

export default function HomePage({ user, onLogout }) {
  const { tasks, loading, syncing, error, addTask, toggleDone, editTask, removeTask } = useTasks()
  const [filter, setFilter] = useState('All')
  const [toast, setToast] = useState(null)

  const todayStr = new Date().toISOString().split('T')[0]

  const handleAdd = async (data) => {
    await addTask(data)
    showToast('Task added and synced to Google Calendar')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = tasks.filter(t => {
    if (filter === 'Today') return t.date === todayStr
    if (filter === 'Pending') return !t.done
    if (filter === 'Done') return t.done
    return true
  })

  const pending = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  const todayLabel = format(new Date(), 'EEEE, d MMMM')

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '2rem 1rem', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'var(--accent-text)'
          }}>✓</div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.2px' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{todayLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.picture && (
            <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          )}
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.given_name}</span>
          <button onClick={onLogout} style={{
            background: 'none', border: '0.5px solid var(--border)', borderRadius: 6,
            color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: '4px 10px'
          }}>Sign out</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', val: tasks.length },
          { label: 'Today', val: tasks.filter(t => t.date === todayStr).length },
          { label: 'Pending', val: tasks.filter(t => !t.done).length },
          { label: 'Done', val: tasks.filter(t => t.done).length },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 20, fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text)' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AddTaskForm onAdd={handleAdd} syncing={syncing} />

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(255, 92, 92, 0.1)', border: '0.5px solid var(--danger)',
          borderRadius: 'var(--radius)', padding: '9px 14px', marginBottom: '1rem',
          fontSize: 13, color: 'var(--danger)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>⚠ {error}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 20,
            border: '0.5px solid var(--border)',
            background: filter === f ? 'var(--accent)' : 'transparent',
            color: filter === f ? 'var(--accent-text)' : 'var(--text2)',
            cursor: 'pointer', fontWeight: filter === f ? 500 : 400,
            transition: 'all 0.12s'
          }}>{f}</button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontSize: 13 }}>
          {filter === 'All' ? 'No tasks yet — add one above' : `No ${filter.toLowerCase()} tasks`}
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)' }}>
                Upcoming · {pending.length}
              </div>
              {pending.map(t => (
                <TaskItem key={t.id} task={t} onToggle={toggleDone} onDelete={removeTask} onEdit={editTask} />
              ))}
            </>
          )}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '1rem 0 8px', fontFamily: 'var(--mono)' }}>
                Completed · {done.length}
              </div>
              {done.map(t => (
                <TaskItem key={t.id} task={t} onToggle={toggleDone} onDelete={removeTask} onEdit={editTask} />
              ))}
            </>
          )}
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--accent)', color: 'var(--accent-text)',
          padding: '9px 18px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100
        }}>✓ {toast}</div>
      )}
    </div>
  )
}
