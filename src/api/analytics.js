import api from './axios'

export const getDashboard = () => api.get('/analytics/dashboard/').then((response) => response.data)

export const exportCSV = () =>
  api.get('/analytics/export/', { responseType: 'blob' }).then((response) => {
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'goals_export.csv'
    link.click()
    URL.revokeObjectURL(url)
  })
