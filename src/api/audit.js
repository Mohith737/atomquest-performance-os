import api from './axios'

export const getAuditLogs = () => api.get('/audit-logs/').then((response) => response.data)
