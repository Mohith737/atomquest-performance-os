from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import CustomUser
from apps.approvals.models import GoalApproval
from apps.audit.models import AuditLog
from apps.checkins.models import CheckIn
from apps.goals.models import Goal


DEMO_PASSWORD = 'AtomQuest@2026'


class Command(BaseCommand):
    help = 'Seed a realistic AtomQuest enterprise demo organization.'

    def handle(self, *args, **options):
        with transaction.atomic():
            users = self.seed_users()
            self.clear_demo_workflow(users)
            self.seed_goals(users)

        self.stdout.write(self.style.SUCCESS('Seeded AtomQuest demo organization.'))
        self.stdout.write('Demo credentials:')
        for email in [
            'priya.menon@northstarops.com',
            'marcus.reed@northstarops.com',
            'anika.shah@northstarops.com',
            'jonathan.park@northstarops.com',
        ]:
            self.stdout.write(f'  {email} / {DEMO_PASSWORD}')

    def seed_users(self):
        user_specs = [
            {
                'email': 'priya.menon@northstarops.com',
                'full_name': 'Priya Menon',
                'role': CustomUser.Role.ADMIN,
                'department': 'People Operations',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'marcus.reed@northstarops.com',
                'full_name': 'Marcus Reed',
                'role': CustomUser.Role.MANAGER,
                'department': 'Revenue Operations',
            },
            {
                'email': 'sofia.alvarez@northstarops.com',
                'full_name': 'Sofia Alvarez',
                'role': CustomUser.Role.MANAGER,
                'department': 'Customer Success',
            },
            {
                'email': 'anika.shah@northstarops.com',
                'full_name': 'Anika Shah',
                'role': CustomUser.Role.EMPLOYEE,
                'department': 'Revenue Operations',
                'manager_email': 'marcus.reed@northstarops.com',
            },
            {
                'email': 'jonathan.park@northstarops.com',
                'full_name': 'Jonathan Park',
                'role': CustomUser.Role.EMPLOYEE,
                'department': 'Revenue Operations',
                'manager_email': 'marcus.reed@northstarops.com',
            },
            {
                'email': 'meera.iyer@northstarops.com',
                'full_name': 'Meera Iyer',
                'role': CustomUser.Role.EMPLOYEE,
                'department': 'Customer Success',
                'manager_email': 'sofia.alvarez@northstarops.com',
            },
            {
                'email': 'daniel.kim@northstarops.com',
                'full_name': 'Daniel Kim',
                'role': CustomUser.Role.EMPLOYEE,
                'department': 'Customer Success',
                'manager_email': 'sofia.alvarez@northstarops.com',
            },
        ]

        users = {}
        for spec in user_specs:
            manager_email = spec.pop('manager_email', None)
            user, _ = CustomUser.objects.update_or_create(
                email=spec['email'],
                defaults={
                    'full_name': spec['full_name'],
                    'role': spec['role'],
                    'department': spec['department'],
                    'is_staff': spec.get('is_staff', False),
                    'is_superuser': spec.get('is_superuser', False),
                    'is_active': True,
                },
            )
            user.set_password(DEMO_PASSWORD)
            user.save()
            users[spec['email']] = user
            spec['manager_email'] = manager_email

        for spec in user_specs:
            manager_email = spec.get('manager_email')
            if manager_email:
                user = users[spec['email']]
                user.manager = users[manager_email]
                user.save(update_fields=['manager'])

        return users

    def clear_demo_workflow(self, users):
        demo_users = list(users.values())
        Goal.objects.filter(owner__in=demo_users).delete()
        AuditLog.objects.filter(actor__in=demo_users).delete()

    def seed_goals(self, users):
        marcus = users['marcus.reed@northstarops.com']
        sofia = users['sofia.alvarez@northstarops.com']
        anika = users['anika.shah@northstarops.com']
        jonathan = users['jonathan.park@northstarops.com']
        meera = users['meera.iyer@northstarops.com']
        daniel = users['daniel.kim@northstarops.com']

        approved_pipeline = self.create_goal(
            owner=anika,
            title='Reduce enterprise opportunity handoff delays',
            description='Cut the median sales-to-implementation handoff time from 4.8 business days to 2.5 business days by standardizing qualification fields, owner routing, and escalation SLAs for strategic accounts.',
            status='approved',
            progress=68,
            weightage='35.00',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 28),
            is_locked=True,
        )
        self.approve(approved_pipeline, marcus, 'Approved with the SLA metric as the primary success measure. Keep implementation blockers visible in weekly check-ins.')
        self.checkin(
            approved_pipeline,
            anika,
            35,
            'Mapped the current handoff path across sales engineering, implementation, and customer success. Biggest delay is missing procurement context.',
            'Good diagnosis. Please separate process gaps from tooling gaps in the next update.',
        )
        self.checkin(
            approved_pipeline,
            anika,
            68,
            'Launched the required handoff checklist for strategic deals and added routing rules for implementation owner assignment.',
            'This is tracking well. Bring one before/after example to the revenue ops review.',
        )

        pending_forecast = self.create_goal(
            owner=anika,
            title='Improve Q2 forecast hygiene for strategic accounts',
            description='Increase forecast field completeness for top-tier opportunities from 72% to 95% and reduce manager follow-up cycles before weekly pipeline inspection.',
            status='pending',
            progress=0,
            weightage='25.00',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 30),
        )
        self.audit(anika, 'GOAL_SUBMITTED', pending_forecast, {'status': 'draft'}, {'status': 'pending'})

        completed_retention = self.create_goal(
            owner=jonathan,
            title='Complete renewal risk review for top 40 accounts',
            description='Deliver a structured renewal risk review for the top 40 ARR accounts, with executive owner, risk driver, mitigation plan, and next customer action recorded for each account.',
            status='completed',
            progress=100,
            weightage='30.00',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 5, 15),
            is_locked=True,
        )
        self.approve(completed_retention, marcus, 'Strong operational goal. Completion criteria are specific enough for leadership review.')
        self.checkin(
            completed_retention,
            jonathan,
            55,
            'Completed risk classification for 24 accounts and aligned mitigation owners with customer success leadership.',
            'Make sure expansion-sensitive accounts are flagged separately from churn-risk accounts.',
        )
        self.checkin(
            completed_retention,
            jonathan,
            100,
            'Finished all 40 account reviews and handed the mitigation tracker to customer success directors for weekly inspection.',
            'Complete. This is ready for the QBR operating packet.',
        )

        rejected_enablement = self.create_goal(
            owner=jonathan,
            title='Launch partner enablement operating rhythm',
            description='Create a recurring partner enablement cadence for implementation partners supporting enterprise rollouts.',
            status='rejected',
            progress=0,
            weightage='15.00',
            start_date=date(2026, 4, 8),
            end_date=date(2026, 6, 20),
        )
        self.reject(rejected_enablement, marcus, 'Please resubmit with measurable adoption criteria, target partner segment, and an owner for post-session follow-up.')

        approved_health = self.create_goal(
            owner=meera,
            title='Increase executive business review coverage',
            description='Raise completed executive business reviews for high-value customers from 61% to 85%, prioritizing accounts with renewal dates before August.',
            status='approved',
            progress=42,
            weightage='35.00',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 30),
            is_locked=True,
        )
        self.approve(approved_health, sofia, 'Approved. Keep the renewal-window prioritization visible in each progress update.')
        self.checkin(
            approved_health,
            meera,
            42,
            'Completed scheduling for 18 of 43 target accounts and created executive briefing templates for regional directors.',
            'Good start. Add a risk note for accounts that decline an executive review.',
        )

        pending_onboarding = self.create_goal(
            owner=daniel,
            title='Stabilize implementation readiness for new enterprise launches',
            description='Reduce launch readiness exceptions by ensuring every enterprise implementation has confirmed data owner, success criteria, integration scope, and go-live risk rating before kickoff.',
            status='pending',
            progress=0,
            weightage='40.00',
            start_date=date(2026, 4, 1),
            end_date=date(2026, 6, 30),
        )
        self.audit(daniel, 'GOAL_SUBMITTED', pending_onboarding, {'status': 'draft'}, {'status': 'pending'})

        self.create_goal(
            owner=daniel,
            title='Document customer escalation response standards',
            description='Publish a concise escalation response standard for P1 and P2 customer issues, including ownership, update cadence, and executive visibility thresholds.',
            status='draft',
            progress=0,
            weightage='20.00',
            start_date=date(2026, 5, 1),
            end_date=date(2026, 6, 25),
        )

    def create_goal(self, **kwargs):
        return Goal.objects.create(
            title=kwargs['title'],
            description=kwargs['description'],
            owner=kwargs['owner'],
            goal_type=Goal.GoalType.INDIVIDUAL,
            status=kwargs['status'],
            is_locked=kwargs.get('is_locked', False),
            start_date=kwargs['start_date'],
            end_date=kwargs['end_date'],
            progress=kwargs['progress'],
            weightage=Decimal(kwargs['weightage']),
        )

    def approve(self, goal, manager, comment):
        GoalApproval.objects.create(goal=goal, reviewed_by=manager, action='approved', comment=comment)
        self.audit(manager, 'GOAL_APPROVED', goal, {'status': 'pending'}, {'status': goal.status, 'is_locked': goal.is_locked})

    def reject(self, goal, manager, comment):
        GoalApproval.objects.create(goal=goal, reviewed_by=manager, action='rejected', comment=comment)
        self.audit(manager, 'GOAL_REJECTED', goal, {'status': 'pending'}, {'status': 'rejected'})

    def checkin(self, goal, employee, progress, notes, manager_comment=''):
        CheckIn.objects.create(
            goal=goal,
            submitted_by=employee,
            progress_value=progress,
            notes=notes,
            manager_comment=manager_comment,
        )
        self.audit(employee, 'CHECKIN_CREATED', goal, None, {'progress': progress})

    def audit(self, actor, action, goal, old_value, new_value):
        AuditLog.objects.create(
            actor=actor,
            action=action,
            target_model='Goal',
            target_id=str(goal.id),
            old_value=old_value,
            new_value=new_value,
            ip_address='127.0.0.1',
        )
