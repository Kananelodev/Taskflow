import React, { useState } from 'react'

const PRIORITIES = [
  { value: 1, label: 'Low', cls: 'p1' },
  { value: 2, label: 'Med', cls: 'p2' },
  { value: 3, label: 'High', cls: 'p3' },
  { value: 4, label: 'Urgent', cls: 'p4' },
]

const today = () => new Date().toISOString().split('T')[0]

export default function AddTaskForm({ onAdd, syncing, labels }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState(0)
  const [selectedLabels, setSelectedLabels] = useState([])
  const [subtaskInputs, setSubtaskInputs] = useState([''])
  const [open, setOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const subtasks = subtaskInputs.filter(s => s.trim())
    await onAdd({
      title: title.trim(),
      notes: notes.trim(),
      date,
      time,
      priority,
      label_ids: selectedLabels,
      subtasks,
    })
    setTitle(''); setNotes(''); setDate(today()); setTime('')
    setPriority(0); setSelectedLabels([]); setSubtaskInputs(['']); setOpen(false)
  }

  const toggleLabel = (id) => {
    setSelectedLabels(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  const updateSubtask = (i, val) => {
    const updated = [...subtaskInputs]
    updated[i] = val
    // Auto-add new row if typing in last field
    if (i === updated.length - 1 && val.trim()) {
      updated.push('')
    }
    setSubtaskInputs(updated)
  }

  return (
    <form className="add-form" onSubmit={submit}>
      <div className="add-form-row">
        <input
          className="add-input"
          value={title}
          onChange={e => { setTitle(e.target.value); if (!open && e.target.value) setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Add a task..."
        />
        <button
          type="submit"
          className="btn-add"
          disabled={syncing || !title.trim()}
        >
          {syncing ? 'Syncing...' : '+ Add'}
        </button>
      </div>

      {open && (
        <div className="add-extras">
          <textarea
            className="add-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
          />

          <div className="add-meta-row">
            <div>
              <div className="add-meta-label">Date</div>
              <input type="date" className="meta-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <div className="add-meta-label">Time</div>
              <input type="time" className="meta-input" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="add-meta-label">Priority</div>
            <div className="priority-selector">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  className={`priority-btn ${p.cls} ${priority === p.value ? 'active' : ''}`}
                  onClick={() => setPriority(priority === p.value ? 0 : p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {labels && labels.length > 0 && (
            <div>
              <div className="add-meta-label">Labels</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {labels.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    className="task-label-tag"
                    style={{
                      background: selectedLabels.includes(l.id) ? l.color + '30' : 'var(--surface2)',
                      color: selectedLabels.includes(l.id) ? l.color : 'var(--text3)',
                      border: `1px solid ${selectedLabels.includes(l.id) ? l.color : 'var(--border)'}`,
                      cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: 11,
                    }}
                    onClick={() => toggleLabel(l.id)}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="add-meta-label">Subtasks</div>
            {subtaskInputs.map((val, i) => (
              <input
                key={i}
                className="subtask-add-input"
                value={val}
                onChange={e => updateSubtask(i, e.target.value)}
                placeholder={i === 0 ? 'Add a subtask...' : 'Add another...'}
              />
            ))}
          </div>

          <div className="sync-hint">
            <span className="check">✓</span> Will be added to your Google Calendar
          </div>
        </div>
      )}
    </form>
  )
}
