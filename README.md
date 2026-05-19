# AtomQuest — Enterprise Performance Operating System

AtomQuest is an enterprise-grade performance management platform designed to streamline organizational execution workflows through structured goal tracking, manager approvals, operational analytics, audit visibility, and role-based dashboards.

Built with a strong focus on workflow integrity, enterprise UX, and operational realism, AtomQuest simulates how modern organizations manage performance execution across employees, managers, and administrators.

---

# 🚀 Key Features

## 🔐 Authentication & Access Control
- JWT Authentication
- Protected Routes
- Role-Based Access Control
- Employee / Manager / Admin Dashboards

---

## 🎯 Goal Workflow Engine
- Draft → Pending → Approved / Rejected lifecycle
- Goal locking after approval
- Explicit workflow transitions
- Weightage validation
- Status-driven enterprise workflows

---

## 👨‍💼 Manager Approval System
- Pending approval queue
- Approve / Reject workflows
- Rejection comments
- Real-time approval badge updates
- Operational workflow visibility

---

## 📈 Check-ins & Progress Tracking
- Quarterly check-ins
- Progress updates
- Manager comments
- Timeline-style workflow history
- Animated progress bars

---

## 📊 Executive Analytics
- KPI cards
- Completion metrics
- Goal distribution by status
- Quarter concentration insights
- CSV export support

---

## 🛡️ Audit & Governance
- Full audit log tracking
- Action history
- Actor visibility
- Timestamped workflow events
- Admin-only governance visibility

---

## ⚡ Productivity & UX
- Cmd + K command palette
- Mobile-responsive sidebar
- Loading skeletons
- Empty/error states
- Toast feedback system
- Enterprise-grade layout system

---

# 🏗️ Workflow Architecture

```text
Employee
   ↓
Create Goal
   ↓
Submit for Approval
   ↓
Manager Review
   ↓
Approve / Reject
   ↓
Approved Goals Become Locked
   ↓
Quarterly Check-ins & Progress Updates
   ↓
Admin Analytics + Audit Visibility
```

---

# 🧠 Why AtomQuest Stands Out

AtomQuest was built as a realistic enterprise workflow platform rather than a simple CRUD dashboard.

The project focuses heavily on:

- Explicit workflow state management
- Approval-driven operational flows
- Locked-state enterprise behavior
- Audit-driven architecture
- Role-aware platform experiences
- Executive-facing analytics
- Operational UX discipline
- Keyboard-first productivity interactions

Unlike traditional hackathon projects, AtomQuest prioritizes:
- workflow integrity
- enterprise realism
- organizational structure
- operational visibility
- premium UX consistency

---

# 🛠️ Tech Stack

## Frontend
- React
- Vite
- Tailwind CSS
- shadcn/ui
- React Query
- Axios
- Recharts
- cmdk
- Sonner

---

## Backend
- Django
- Django REST Framework
- PostgreSQL
- JWT Authentication

---

# 📱 Platform Features

## Employee Experience
- Personal dashboard
- Goal creation
- Progress tracking
- Quarterly check-ins
- Timeline visibility

---

## Manager Experience
- Approval queue
- Team visibility
- Team analytics
- Operational oversight
- Workflow approvals

---

## Admin Experience
- Organization analytics
- Audit logs
- Export systems
- Governance visibility

---

# 🖼️ Screenshots

## Login Page
_Add screenshot here_

## Employee Dashboard
_Add screenshot here_

## Manager Approval Queue
_Add screenshot here_

## Goal Detail Workflow
_Add screenshot here_

## Analytics Dashboard
_Add screenshot here_

## Audit Logs
_Add screenshot here_

## Mobile Sidebar
_Add screenshot here_

---

# 🧪 Demo Credentials

## Employee
```text
priya.menon@northstarops.com
Password: AtomQuest@2026
```

## Manager
```text
marcus.reed@northstarops.com
Password: AtomQuest@2026
```

## Admin
```text
anika.shah@northstarops.com
Password: AtomQuest@2026
```

---

# ⚙️ Local Setup

## Clone Repository

```bash
git clone https://github.com/Mohith737/atomquest-performance-os.git
cd atomquest-performance-os
```

---

## Backend Setup

```bash
python -m venv venv
```

### Windows
```bash
venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run Migrations
```bash
python manage.py migrate
```

### Seed Demo Data
```bash
python manage.py seed_demo_data
```

### Start Backend Server
```bash
python manage.py runserver
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# 📦 Demo Seed Data

The platform includes:
- realistic enterprise users
- reporting hierarchy
- approval workflows
- quarterly check-ins
- audit history
- operational analytics

The seeded organization simulates a real operational environment for demo and evaluation purposes.

---

# 🧭 Architecture Overview

```text
React Frontend
│
├── Auth Layer
├── Dashboard Layer
├── Workflow Pages
├── Analytics Layer
├── Audit Layer
│
↓ Axios / JWT
│
Django REST API
│
├── Authentication Service
├── Goals Workflow Engine
├── Approval System
├── Check-ins Service
├── Analytics APIs
├── Audit Logging
│
↓
PostgreSQL Database
```

---

# 🎯 Demo Flow

## Employee
- Login
- Create goal
- Submit for approval

## Manager
- Review approval queue
- Approve / Reject goals
- View team operational insights

## Employee
- Observe locked approved goal
- Submit check-ins
- Track progress timeline

## Admin
- Access analytics
- Review audit logs
- Export operational data

---

# 🏆 Enterprise UX Philosophy

AtomQuest follows a restrained enterprise UX approach inspired by:
- Linear
- Stripe Dashboard
- Notion
- Jira modern UI

Design principles:
- Slate + Indigo visual system
- Border-based layouts
- Operational clarity
- Calm whitespace
- Workflow-first interaction design

---

# 📄 License

This project was built for AtomQuest Hackathon 2026.

---