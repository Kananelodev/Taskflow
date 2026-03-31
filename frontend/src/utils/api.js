import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export const getMe = () => api.get('/auth/me').then(r => r.data)
export const getLoginUrl = () => api.get('/auth/login').then(r => r.data.auth_url)
export const logout = () => api.post('/auth/logout')

export const getTasks = () => api.get('/tasks').then(r => r.data)
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data)
