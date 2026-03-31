import { useState, useEffect, useCallback } from 'react'
import { getLabels, createLabel, updateLabel, deleteLabel } from '../utils/api'

export function useLabels() {
    const [labels, setLabels] = useState([])
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        try {
            const data = await getLabels()
            setLabels(data)
        } catch (err) {
            console.error('Failed to load labels:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const addLabel = async (data) => {
        try {
            const label = await createLabel(data)
            setLabels(prev => [...prev, label])
            return label
        } catch (err) {
            console.error('Failed to create label:', err)
            throw err
        }
    }

    const editLabel = async (id, data) => {
        try {
            const updated = await updateLabel(id, data)
            setLabels(prev => prev.map(l => l.id === id ? updated : l))
        } catch (err) {
            console.error('Failed to update label:', err)
        }
    }

    const removeLabel = async (id) => {
        setLabels(prev => prev.filter(l => l.id !== id))
        try {
            await deleteLabel(id)
        } catch (err) {
            console.error('Failed to delete label:', err)
        }
    }

    return { labels, loading, addLabel, editLabel, removeLabel }
}
