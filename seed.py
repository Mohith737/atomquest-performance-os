import os
from datetime import date, datetime, timedelta, time
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

import django

django.setup()

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import CustomUser
from apps.approvals.models import GoalApproval
from apps.audit.models import AuditLog
from apps.checkins.models import CheckIn
from apps.goals.models import Goal


PASSWORD = 'Demo@123'


def aware_datetime(day):
    return timezone.make_aware(datetime.combine(day, time(hour=10, minute=30)))


def set_created_at(instance, value):
    instance.created_at = value
    instance.save(update_fields=['created_at'])


def set_timestamp(instance, value):
    instance.timestamp = value
    instance.save(update_fields=['timestamp'])


def upsert_user(email, full_name, role, department='', **flags):
    user, _ = CustomUser.objects.get_or_create(
        email=email,
        defaults={
            'full_name': full_name,
            'role': role,
            'department': department,
            'is_active': True,
            **flags,
        },
    )
    user.full_name = full_name
    user.role = role
    user.department = department
    user.is_active = True
    for key, value in flags.items():
        setattr(user, key, value)
    user.set_password(PASSWORD)
    user.save()
    return user


def upsert_goal(owner, title, description, start_date, end_date, status, progress, weightage, is_locked=False):
    goal, _ = Goal.objects.update_or_create(
        owner=owner,
        title=title,
        defaults={
            'description': description,
            'goal_type': Goal.GoalType.INDIVIDUAL,
            'start_date': start_date,
            'end_date': end_date,
            'status': status,
            'is_locked': is_locked,
            'progress': progress,
            'weightage': Decimal(weightage),
        },
    )
    return goal


def create_checkin(goal, submitted_by, created_on, progress, notes, manager_comment=''):
    checkin = CheckIn.objects.create(
        goal=goal,
        submitted_by=submitted_by,
        progress_value=progress,
        notes=notes,
        manager_comment=manager_comment,
    )
    set_created_at(checkin, aware_datetime(created_on))
    return checkin


def create_approval(goal, reviewed_by, action, comment, days_ago):
    approval = GoalApproval.objects.create(
        goal=goal,
        reviewed_by=reviewed_by,
        action=action,
        comment=comment,
    )
    set_created_at(approval, timezone.now() - timedelta(days=days_ago))
    return approval


def create_audit(actor, action, goal, old_value, new_value, days_ago):
    audit = AuditLog.objects.create(
        actor=actor,
        action=action,
        target_model='Goal',
        target_id=str(goal.id),
        old_value=old_value,
        new_value=new_value,
        ip_address='127.0.0.1',
    )
    set_timestamp(audit, timezone.now() - timedelta(days=days_ago))
    return audit


@transaction.atomic
def seed():
    alice = upsert_user(
        'alice@atomquest.com',
        'Alice Chen',
        CustomUser.Role.EMPLOYEE,
        department='Revenue Operations',
    )
    marcus = upsert_user(
        'marcus@atomquest.com',
        'Marcus Lee',
        CustomUser.Role.EMPLOYEE,
        department='Customer Success',
    )
    bob = upsert_user(
        'bob@atomquest.com',
        'Bob Kumar',
        CustomUser.Role.MANAGER,
        department='Commercial Operations',
    )
    admin = upsert_user(
        'admin@atomquest.com',
        'Admin User',
        CustomUser.Role.ADMIN,
        department='People Operations',
        is_staff=True,
        is_superuser=True,
    )

    alice.manager = bob
    marcus.manager = bob
    alice.save(update_fields=['manager'])
    marcus.save(update_fields=['manager'])

    demo_users = [alice, marcus, bob, admin]

    goals = [
        upsert_goal(
            alice,
            'Increase Pipeline Revenue by 20%',
            'Improve qualified pipeline contribution by expanding enterprise account coverage, tightening follow-up cadence, and increasing late-stage conversion visibility.',
            date(2024, 1, 1),
            date(2024, 3, 31),
            'approved',
            75,
            '35.00',
            is_locked=True,
        ),
        upsert_goal(
            alice,
            'Complete Salesforce Certification',
            'Complete the Salesforce administrator certification path and apply the workflow automation learnings to revenue operations hygiene.',
            date(2024, 1, 1),
            date(2024, 3, 31),
            'completed',
            100,
            '20.00',
            is_locked=True,
        ),
        upsert_goal(
            alice,
            'Build 50 New Client Relationships',
            'Develop 50 new named-account relationships across priority enterprise segments with clear next steps logged for each contact.',
            date(2024, 4, 1),
            date(2024, 6, 30),
            'pending',
            0,
            '25.00',
        ),
        upsert_goal(
            marcus,
            'Reduce Customer Response Time',
            'Lower average first-response time for priority customer requests by improving triage ownership and escalation routing.',
            date(2024, 1, 1),
            date(2024, 3, 31),
            'approved',
            60,
            '40.00',
            is_locked=True,
        ),
        upsert_goal(
            marcus,
            'Launch Product Demo Library',
            'Publish a reusable library of product demos mapped to high-frequency customer use cases and onboarding scenarios.',
            date(2024, 4, 1),
            date(2024, 6, 30),
            'draft',
            0,
            '30.00',
        ),
    ]

    GoalApproval.objects.filter(goal__in=goals).delete()
    CheckIn.objects.filter(goal__in=goals).delete()
    AuditLog.objects.filter(actor__in=demo_users, target_id__in=[str(goal.id) for goal in goals]).delete()

    pipeline_goal = goals[0]
    create_checkin(
        pipeline_goal,
        alice,
        date(2024, 1, 15),
        25,
        'Started pipeline outreach, initial meetings scheduled',
    )
    create_checkin(
        pipeline_goal,
        alice,
        date(2024, 1, 22),
        50,
        'On track. 3 enterprise calls completed.',
        manager_comment='Great progress, focus on enterprise segment',
    )
    create_checkin(
        pipeline_goal,
        alice,
        date(2024, 1, 29),
        75,
        'Closing 2 deals, ahead of schedule',
    )

    create_approval(
        goals[0],
        bob,
        GoalApproval.Action.APPROVED,
        'Approved. Pipeline growth target is measurable and manager-visible.',
        12,
    )
    create_approval(
        goals[1],
        bob,
        GoalApproval.Action.APPROVED,
        'Approved as a capability-building goal with clear completion evidence.',
        10,
    )
    create_approval(
        goals[3],
        bob,
        GoalApproval.Action.APPROVED,
        'Approved. Response-time metric should be reviewed weekly.',
        9,
    )

    audit_events = [
        (alice, 'GOAL_CREATED', goals[0], None, {'status': 'draft'}, 14),
        (alice, 'GOAL_SUBMITTED', goals[0], {'status': 'draft'}, {'status': 'pending'}, 13),
        (bob, 'GOAL_APPROVED', goals[0], {'status': 'pending'}, {'status': 'approved', 'is_locked': True}, 12),
        (alice, 'CHECKIN_CREATED', goals[0], None, {'progress': 25}, 11),
        (alice, 'CHECKIN_CREATED', goals[0], {'progress': 25}, {'progress': 50}, 8),
        (alice, 'CHECKIN_CREATED', goals[0], {'progress': 50}, {'progress': 75}, 5),
        (alice, 'GOAL_COMPLETED', goals[1], {'status': 'approved'}, {'status': 'completed'}, 4),
        (alice, 'GOAL_SUBMITTED', goals[2], {'status': 'draft'}, {'status': 'pending'}, 3),
        (bob, 'GOAL_APPROVED', goals[3], {'status': 'pending'}, {'status': 'approved', 'is_locked': True}, 2),
        (marcus, 'GOAL_CREATED', goals[4], None, {'status': 'draft'}, 1),
    ]
    for actor, action, goal, old_value, new_value, days_ago in audit_events:
        create_audit(actor, action, goal, old_value, new_value, days_ago)

    print('Seed data ready.')
    print(f'Login: alice@atomquest.com / {PASSWORD}')
    print(f'Users: {CustomUser.objects.filter(email__endswith="@atomquest.com").count()}')
    print(f'Goals: {Goal.objects.filter(owner__email__endswith="@atomquest.com").count()}')
    print(f'Check-ins: {CheckIn.objects.filter(goal__owner__email__endswith="@atomquest.com").count()}')


if __name__ == '__main__':
    seed()
