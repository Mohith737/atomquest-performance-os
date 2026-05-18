export const QUERY_KEYS = {
  GOALS: ['goals'],
  GOAL: (id) => ['goals', id],
  PENDING_APPROVALS: ['approvals', 'pending'],
  CHECKINS: (goalId) => ['checkins', goalId],
  DASHBOARD: ['analytics', 'dashboard'],
  AUDIT_LOGS: ['audit-logs'],
}
