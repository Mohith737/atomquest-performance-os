import api from './axios'

export const getAuditLogs = (params = {}) => api.get('/audit-logs/', { params }).then((response) => response.data)
