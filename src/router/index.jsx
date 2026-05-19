import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/layout/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import ApprovalsPage from '@/pages/approvals/ApprovalsPage'
import AuditLogPage from '@/pages/audit/AuditLogPage'
import LoginPage from '@/pages/auth/LoginPage'
import CheckInPage from '@/pages/checkins/CheckInPage'
import AdminDashboard from '@/pages/dashboard/AdminDashboard'
import EmployeeDashboard from '@/pages/dashboard/EmployeeDashboard'
import ManagerDashboard from '@/pages/dashboard/ManagerDashboard'
import GoalCreatePage from '@/pages/goals/GoalCreatePage'
import GoalDetailPage from '@/pages/goals/GoalDetailPage'
import GoalListPage from '@/pages/goals/GoalListPage'
import ProtectedRoute from '@/router/ProtectedRoute'
import RoleRoute from '@/router/RoleRoute'

function PlaceholderPage({ breadcrumb, title, subtitle }) {
  return <PageHeader breadcrumb={breadcrumb} title={title} subtitle={subtitle} />
}

function DashboardRouter() {
  const { user } = useAuth()

  if (user?.role === 'admin') return <AdminDashboard />
  if (user?.role === 'manager') return <ManagerDashboard />
  return <EmployeeDashboard />
}

function TeamGoalsPage() {
  return <PlaceholderPage breadcrumb="Goals" title="Team Goals" subtitle="Team goal visibility will be implemented next." />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardRouter />} />
            <Route path="/goals" element={<GoalListPage />} />
            <Route path="/goals/new" element={<GoalCreatePage />} />
            <Route path="/goals/:id" element={<GoalDetailPage />} />
            <Route element={<RoleRoute allowedRoles={['manager', 'admin']} />}>
              <Route path="/team-goals" element={<TeamGoalsPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/audit" element={<AuditLogPage />} />
            </Route>
            <Route path="/checkins" element={<CheckInPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

