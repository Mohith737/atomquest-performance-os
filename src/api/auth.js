import api from './axios'

export const loginUser = ({ email, password }) =>
  api.post('/auth/login/', { email, password }).then((response) => response.data)

export const logoutUser = (refreshToken) =>
  api.post('/auth/logout/', { refresh: refreshToken }).then((response) => response.data)

export const getMe = () => api.get('/auth/me/').then((response) => response.data)
