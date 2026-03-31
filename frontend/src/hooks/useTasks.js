import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../utils/api'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await getTasks()
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
      setTasks(prev) // rollback optimistic update
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
      setTasks(prev) // rollback optimistic update
      setError('Failed to delete task')
    }
  }

  return { tasks, loading, syncing, error, addTask, toggleDone, editTask, removeTask }
}
