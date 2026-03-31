import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'

const PRIORITY_LABELS = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent' }
const PRIORITY_COLORS = { 1: 'var(--priority-low)', 2: 'var(--priority-med)', 3: 'var(--priority-high)', 4: 'var(--priority-urgent)' }

function fmtDate(date, time) {
  if (!date) return null
  try {
    const d = parseISO(date)
    const dateStr = format(d, 'EEE d MMM')
    return time ? `${dateStr} · ${time}` : dateStr
  } catch { return date }
}

export default function TaskItem({
  task, onToggle, onDelete, onEdit,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editNotes, setEditNotes] = useState(task.notes)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')

  const saveEdit = () => {
    if (editTitle.trim()) {
      onEdit(task.id, { title: editTitle.trim(), notes: editNotes.trim() })
    }
    setEditing(false)
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return
    await onAddSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }

  const dateStr = fmtDate(task.date, task.time)
  const subtasks = task.subtasks || []
  const subtasksDone = subtasks.filter(s => s.done).length
  const subtaskProgress = subtasks.length > 0 ? (subtasksDone / subtasks.length) * 100 : 0

  if (editing) {
    return (
      <div className="task-edit">
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          style={{ fontSize: 14 }}
        />
        <textarea
          value={editNotes}
          onChange={e => setEditNotes(e.target.value)}
          rows={2}
        />
        <div className="edit-actions">
          <button className="btn-save" onClick={saveEdit}>Save</button>
          <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`task-item ${task.priority > 0 ? `priority-${task.priority}` : ''}`}
      style={{ animationDelay: '0s' }}
    >
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.done}
        onChange={e => onToggle(task.id, e.target.checked)}
      />

      <div className="task-body">
        <div className={`task-title ${task.done ? 'done' : ''}`}>{task.title}</div>

        {task.notes && <div className="task-notes">{task.notes}</div>}

        <div className="task-meta">
          {dateStr && (
            <span className="task-tag task-date-tag">{dateStr}</span>
          )}
          {task.synced && (
            <span className="task-tag task-sync-tag">
              <span style={{ fontSize: 10 }}>✓</span> Calendar
            </span>
          )}
          {task.priority > 0 && (
            <span
              className="task-priority-tag"
              style={{
                color: PRIORITY_COLORS[task.priority],
                background: PRIORITY_COLORS[task.priority] + '20',
              }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {(task.labels || []).map(l => (
            <span
              key={l.id}
              className="task-label-tag"
              style={{ color: l.color, background: l.color + '20' }}
            >
              {l.name}
            </span>
          ))}
        </div>

        {subtasks.length > 0 && (
          <div
            className="subtask-progress"
            onClick={() => setShowSubtasks(!showSubtasks)}
            style={{ cursor: 'pointer' }}
          >
            <div className="subtask-progress-bar">
              <div className="subtask-progress-fill" style={{ width: `${subtaskProgress}%` }} />
            </div>
            <span className="subtask-count">{subtasksDone}/{subtasks.length} subtasks</span>
          </div>
        )}

        {(showSubtasks || subtasks.length === 0) && (
          <div className="subtask-list" onClick={e => e.stopPropagation()}>
            {subtasks.map(s => (
              <div key={s.id} className="subtask-item">
                <input
                  type="checkbox"
                  className="subtask-checkbox"
                  checked={s.done}
                  onChange={e => onToggleSubtask(task.id, s.id, e.target.checked)}
                />
                <span className={`subtask-title ${s.done ? 'done' : ''}`}>{s.title}</span>
                <button className="subtask-delete" onClick={() => onDeleteSubtask(task.id, s.id)}>×</button>
              </div>
            ))}
            <input
              className="subtask-add-input"
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
            />
          </div>
        )}
      </div>

      <div className="task-actions">
        <button className="btn-task-action" onClick={() => { setEditing(true); setEditTitle(task.title); setEditNotes(task.notes) }}>Edit</button>
        <button className="btn-task-delete" onClick={() => onDelete(task.id)}>×</button>
      </div>
    </div>
  )
}
