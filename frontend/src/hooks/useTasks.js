import { useState, useEffect, useCallback } from 'react'
import {
  getTasks, createTask, updateTask, deleteTask, reorderTasks,
  createSubtask, updateSubtask, deleteSubtask,
} from '../utils/api'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async (params = {}) => {
    try {
      const data = await getTasks(params)
      setTasks(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const search = useCallback(async (q) => {
    setSearchQuery(q)
    if (q.trim()) {
      await load({ q })
    } else {
      await load()
    }
  }, [load])

  const addTask = async (data) => {
    setSyncing(true)
    try {
      const task = await createTask(data)
      setTasks(prev => [task, ...prev])
      setError(null)
      return task
    } catch (err) {
      console.error('Failed to add task:', err)
      setError('Failed to add task — check your connection')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  const toggleDone = async (id, done) => {
    const prev = tasks
    setTasks(t => t.map(item => item.id === id ? { ...item, done } : item))
    try {
      await updateTask(id, { done })
    } catch (err) {
      console.error('Failed to toggle task:', err)
      setTasks(prev)
      setError('Failed to update task')
    }
  }

  const editTask = async (id, data) => {
    setSyncing(true)
    try {
      const updated = await updateTask(id, data)
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
      setError(null)
    } catch (err) {
      console.error('Failed to edit task:', err)
      setError('Failed to update task')
    } finally {
      setSyncing(false)
    }
  }

  const removeTask = async (id) => {
    const prev = tasks
    setTasks(t => t.filter(item => item.id !== id))
    try {
      await deleteTask(id)
    } catch (err) {
      console.error('Failed to delete task:', err)
      setTasks(prev)
      setError('Failed to delete task')
    }
  }

  const reorder = async (newOrder) => {
    setTasks(newOrder)
    try {
      await reorderTasks(newOrder.map(t => t.id))
    } catch (err) {
      console.error('Failed to reorder tasks:', err)
      setError('Failed to reorder tasks')
    }
  }

  // Subtask operations
  const addSubtask = async (taskId, title) => {
    try {
      const subtask = await createSubtask(taskId, { title })
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
      ))
      return subtask
    } catch (err) {
      console.error('Failed to add subtask:', err)
      setError('Failed to add subtask')
    }
  }

  const toggleSubtask = async (taskId, subtaskId, done) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? {
        ...t,
        subtasks: (t.subtasks || []).map(s => s.id === subtaskId ? { ...s, done } : s)
      } : t
    ))
    try {
      await updateSubtask(taskId, subtaskId, { done })
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
    }
  }

  const removeSubtask = async (taskId, subtaskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? {
        ...t,
        subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId)
      } : t
    ))
    try {
      await deleteSubtask(taskId, subtaskId)
    } catch (err) {
      console.error('Failed to delete subtask:', err)
    }
  }

  return {
    tasks, loading, syncing, error, searchQuery,
    addTask, toggleDone, editTask, removeTask, reorder, search,
    addSubtask, toggleSubtask, removeSubtask,
  }
}
