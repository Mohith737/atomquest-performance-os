import api from './axios'

export const getPendingApprovals = () => api.get('/approvals/pending/').then((response) => response.data)

export const approveGoal = (goalId, comment = '') =>
  api.post(`/approvals/${goalId}/approve/`, { comment }).then((response) => response.data)

export const rejectGoal = (goalId, comment) =>
  api.post(`/approvals/${goalId}/reject/`, { comment }).then((response) => response.data)
