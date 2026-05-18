from django.db.models import Avg, Count

from apps.goals.models import Goal


STATUS_KEYS = ['draft', 'pending', 'approved', 'rejected', 'completed']
QUARTER_KEYS = ['Q1', 'Q2', 'Q3', 'Q4']


def scoped_goals_for(user):
    if user.role == 'admin':
        return Goal.objects.all()
    if user.role == 'manager':
        return Goal.objects.filter(owner__manager=user)
    return Goal.objects.filter(owner=user)


def build_dashboard_stats(user):
    goals = scoped_goals_for(user)

    summary = goals.aggregate(
        total_goals=Count('id'),
        avg_progress=Avg('progress'),
    )

    status_rows = goals.values('status').annotate(total=Count('id'))
    by_status = {key: 0 for key in STATUS_KEYS}
    for row in status_rows:
        by_status[row['status']] = row['total']

    quarter_rows = goals.values('quarter').annotate(total=Count('id'))
    by_quarter = {key: 0 for key in QUARTER_KEYS}
    for row in quarter_rows:
        quarter_suffix = row['quarter'][-2:]
        if quarter_suffix in by_quarter:
            by_quarter[quarter_suffix] = row['total']

    total_goals = summary['total_goals'] or 0
    approved_count = by_status['approved']
    completed_count = by_status['completed']
    completion_rate = round((completed_count / total_goals) * 100, 2) if total_goals else 0.0

    return {
        'total_goals': total_goals,
        'by_status': by_status,
        'avg_progress': float(round(summary['avg_progress'] or 0, 2)),
        'completion_rate': completion_rate,
        'by_quarter': by_quarter,
        'pending_count': by_status['pending'],
        'approved_count': approved_count,
    }
