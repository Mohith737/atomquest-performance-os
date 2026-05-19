import api from './axios'

export const getGoals = (params = {}) => api.get('/goals/', { params }).then((response) => response.data)
export const getTeamGoals = () => api.get('/goals/team/').then((response) => response.data)
export const getGoal = (id) => api.get(`/goals/${id}/`).then((response) => response.data)
export const createGoal = (data) => api.post('/goals/', data).then((response) => response.data)
export const updateGoal = (id, data) => api.patch(`/goals/${id}/`, data).then((response) => response.data)
export const submitGoal = (id) => api.post(`/goals/${id}/submit/`).then((response) => response.data)
export const getCheckins = () => api.get('/checkins/').then((response) => response.data)
export const getGoalCheckins = (id) => api.get(`/checkins/?goal=${id}`).then((response) => response.data)
export const createGoalCheckin = (data) => api.post('/checkins/', data).then((response) => response.data)
export const addCheckinManagerComment = (id, manager_comment) =>
  api.patch(`/checkins/${id}/comment/`, { manager_comment }).then((response) => response.data)
