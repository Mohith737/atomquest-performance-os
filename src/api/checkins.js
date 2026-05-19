import api from './axios'

export const submitCheckin = (data) => api.post('/checkins/', data).then((response) => response.data)

export const addManagerComment = (checkinId, comment) =>
  api.patch(`/checkins/${checkinId}/comment/`, { manager_comment: comment }).then((response) => response.data)
