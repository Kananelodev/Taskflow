import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Auth
export const getMe = () => api.get('/auth/me').then(r => r.data)
export const getLoginUrl = () => api.get('/auth/login').then(r => r.data.auth_url)
export const logout = () => api.post('/auth/logout')

// Tasks
export const getTasks = (params = {}) => api.get('/tasks', { params }).then(r => r.data)
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data)
export const reorderTasks = (task_ids) => api.post('/tasks/reorder', { task_ids }).then(r => r.data)

// Labels
export const getLabels = () => api.get('/labels').then(r => r.data)
export const createLabel = (data) => api.post('/labels', data).then(r => r.data)
export const updateLabel = (id, data) => api.patch(`/labels/${id}`, data).then(r => r.data)
export const deleteLabel = (id) => api.delete(`/labels/${id}`).then(r => r.data)

// Subtasks
export const createSubtask = (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data).then(r => r.data)
export const updateSubtask = (taskId, subtaskId, data) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data).then(r => r.data)
export const deleteSubtask = (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`).then(r => r.data)
