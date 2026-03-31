import React, { useState, useMemo } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Sidebar from '../components/Sidebar'
import SearchBar from '../components/SearchBar'
import AddTaskForm from '../components/AddTaskForm'
import TaskItem from '../components/TaskItem'
import { useTasks } from '../hooks/useTasks'
import { useLabels } from '../hooks/useLabels'
import { format } from 'date-fns'

const FILTERS = ['All', 'Today', 'Pending', 'Done']

function SortableTask({ task, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} {...props} />
    </div>
  )
}

export default function HomePage({ user, onLogout }) {
  const {
    tasks, loading, syncing, error,
    addTask, toggleDone, editTask, removeTask, reorder,
    addSubtask, toggleSubtask, removeSubtask, search, searchQuery,
  } = useTasks()
  const { labels, addLabel, removeLabel } = useLabels()

  const [filter, setFilter] = useState('All')
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [toast, setToast] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleAdd = async (data) => {
    try {
      await addTask(data)
      showToast('Task added and synced to Google Calendar')
    } catch { }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    let result = tasks

    if (selectedLabel) {
      result = result.filter(t => (t.labels || []).some(l => l.id === selectedLabel))
    } else {
      if (filter === 'Today') result = result.filter(t => t.date === todayStr)
      if (filter === 'Pending') result = result.filter(t => !t.done)
      if (filter === 'Done') result = result.filter(t => t.done)
    }

    // Client-side search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [tasks, filter, selectedLabel, todayStr, searchQuery])

  const pending = filtered.filter(t => !t.done)
  const done = filtered.filter(t => t.done)

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = pending.findIndex(t => t.id === active.id)
      const newIndex = pending.findIndex(t => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(pending, oldIndex, newIndex)
        reorder([...reordered, ...done])
      }
    }
  }

  const todayLabel = format(new Date(), 'EEEE, d MMMM')
  const currentTitle = selectedLabel
    ? labels.find(l => l.id === selectedLabel)?.name || 'Label'
    : filter

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        onLogout={onLogout}
        filter={filter}
        onFilter={setFilter}
        tasks={tasks}
        labels={labels}
        onAddLabel={addLabel}
        onDeleteLabel={removeLabel}
        selectedLabel={selectedLabel}
        onSelectLabel={setSelectedLabel}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <div className="main-header">
          <div>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <h1 className="main-title">{currentTitle}</h1>
            <div className="main-date">{todayLabel}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          {[
            { label: 'Total', val: tasks.length },
            { label: 'Today', val: tasks.filter(t => t.date === todayStr).length },
            { label: 'Pending', val: tasks.filter(t => !t.done).length },
            { label: 'Done', val: tasks.filter(t => t.done).length },
          ].map((s, i) => (
            <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <SearchBar value={searchQuery} onChange={search} />

        {/* Add form */}
        <AddTaskForm onAdd={handleAdd} syncing={syncing} labels={labels} />

        {/* Error banner */}
        {error && (
          <div className="error-banner">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Filters */}
        {!selectedLabel && (
          <div className="filter-bar">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div>
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-task" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === 'Done' ? '🎉' : searchQuery ? '🔍' : '📝'}
            </div>
            <div className="empty-text">
              {searchQuery
                ? 'No tasks match your search'
                : filter === 'All'
                  ? 'No tasks yet — add one above'
                  : `No ${filter.toLowerCase()} tasks`
              }
            </div>
            {!searchQuery && filter === 'All' && (
              <div className="empty-sub">Your tasks will sync to Google Calendar automatically</div>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {pending.length > 0 && (
              <>
                <div className="section-label">Upcoming · {pending.length}</div>
                <SortableContext items={pending.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {pending.map(t => (
                    <SortableTask
                      key={t.id}
                      task={t}
                      onToggle={toggleDone}
                      onDelete={removeTask}
                      onEdit={editTask}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onDeleteSubtask={removeSubtask}
                    />
                  ))}
                </SortableContext>
              </>
            )}
            {done.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: '1.5rem' }}>Completed · {done.length}</div>
                {done.map(t => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onToggle={toggleDone}
                    onDelete={removeTask}
                    onEdit={editTask}
                    onAddSubtask={addSubtask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={removeSubtask}
                  />
                ))}
              </>
            )}
          </DndContext>
        )}

        {/* Toast */}
        {toast && <div className="toast">✓ {toast}</div>}
      </main>
    </div>
  )
}
