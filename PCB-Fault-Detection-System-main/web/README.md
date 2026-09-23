# 🖥️ PCB-Vision Web Management & Quality Control Platform

The **PCB-Vision Web Platform** is an enterprise-grade web management, monitoring, analytics, and quality-control interface designed to pair seamlessly with the existing Python inspection station and FastAPI backend.

---

## 🏗️ Architecture & Operational Flow

```text
                  PCB-VISION PLATFORM

       ┌─────────────────────────────┐
       │      PySide6 Station        │
       │                             │
       │ Camera / Image / Folder     │
       │          ↓                  │
       │    Detection Engine         │
       │  (YOLOv8 / Faster R-CNN)    │
       │          ↓                  │
       │       Save Local            │
       │          ↓                  │
       │     SQLite History          │
       │          ↓ Sync             │
       └──────────┬──────────────────┘
                  │
                  ▼
       ┌─────────────────────────────┐
       │       FastAPI Backend       │
       │                             │
       │ Auth / Inspections / Stats  │
       │ Reviews / Reports / Users   │
       │ Notifications / Audit Logs  │
       └──────────┬──────────────────┘
                  │
          ┌───────┴────────┐
          ▼                ▼
   Supabase Postgres   Supabase Storage
          │                │
          └───────┬────────┘
                  ▼
       ┌─────────────────────────────┐
       │       Next.js Web App       │
       │                             │
       │ Operations Dashboard        │
       │ Inspection Dual Viewer      │
       │ Quality Review Workspace    │
       │ Analytics & Trend Graphs    │
       │ Compliance Reports & Audit  │
       └─────────────────────────────┘
```

> [!IMPORTANT]
> **No Image Upload on Website**: The web platform is **not** an AI inference engine. Board inference is executed by the desktop inspection station. The web platform displays and governs results synchronized to the cloud.

---

## ✨ Features

- **Industrial Operations Dashboard**: 7 live KPI stat cards (Total Inspections, Pass Rate/Yield %, Failed Boards, Total Defects, Critical Defects, Pending Reviews, Active Alerts), 30-day inspection & defect trend area charts, pass/fail donut distribution, 6-class defect Pareto bar chart, and severity breakdown.
- **High-Resolution PCB Dual Viewer**: Side-by-side or toggled view of raw input PCB frames and AI-annotated defect localization images with interactive zoom (1x–4x) and fullscreen modal.
- **Human-in-the-Loop Quality Review**: Review queue for quality engineers and administrators with mandatory justification requirements for overriding automated verdicts.
- **Server-Side Compliance Reports**: Generate and download inspection summaries, defect distributions, and compliance audit certificates in CSV and printable formats.
- **Persistent Notification Center**: Instant critical alarm tracking on open and short circuit defects with read/unread tracking.
- **Admin Audit Trail**: Append-only log recording every authentication, user creation, review disposition override, and setting modification.
- **Model Registry & Benchmarks**: Real evaluation metrics across YOLOv8s, YOLOv8n, Faster R-CNN, and RetinaNet (mAP@50, mAP@50-95, Precision, Recall, F1, GPU latency).

---

## 👥 Role-Based Access Control (RBAC)

| Feature / Route | ADMIN | QUALITY ENGINEER | VIEWER |
|:----------------|:-----:|:----------------:|:------:|
| Dashboard (`/dashboard`) | ✅ Full | ✅ Full | ✅ Read-only |
| Inspection History (`/inspections`) | ✅ Full | ✅ Full | ✅ Read-only |
| Inspection Details (`/inspections/[id]`) | ✅ Full | ✅ Full | ✅ Read-only |
| Review Queue (`/reviews`, `/reviews/[id]`) | ✅ Full | ✅ Full | ❌ Restricted |
| Analytics (`/analytics`) | ✅ Full | ✅ Full | ✅ Read-only |
| Model Benchmarks (`/models`) | ✅ Full | ✅ Full | ✅ Read-only |
| Reports Generation (`/reports`) | ✅ Full | ✅ Full | ✅ Read-only (Download) |
| Notifications (`/notifications`) | ✅ Full | ✅ Full | ✅ Read-only |
| User Management (`/users`) | ✅ Full | ❌ Restricted | ❌ Restricted |
| Audit Trail (`/audit-logs`) | ✅ Full | ❌ Restricted | ❌ Restricted |
| System Settings (`/settings`) | ✅ Full | ❌ Restricted | ❌ Restricted |

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18.17+** or **20+**
- Running instance of the **PCB-Vision FastAPI Backend** (`http://localhost:8000`)

### Installation & Development

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Create `.env.local` in `web/`:

```env
NEXT_PUBLIC_APP_NAME=PCB-Vision
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production Build & Type Checking

```bash
# Type checking
npm run typecheck

# Unit tests
node --test tests/domain.test.mjs

# Production build
npm run build
npm run start
```
