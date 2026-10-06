# -*- coding: utf-8 -*-
"""Section 10 - 13: Web, Backend, Desktop, and Mobile Platform Architectures."""

CONTENT = """## 10. Web Application Architecture

The web management portal (`web/`) is an enterprise-grade single-page application built on **Next.js 14** using the modern **App Router** paradigm (`web/src/app/`), written in **TypeScript 5**, and styled with **Tailwind CSS**.

```
web/
├── package.json                   # Web dependencies (Next.js 14, React 18, Lucide React, Supabase-js)
├── tsconfig.json                  # Strict TypeScript configuration
├── tailwind.config.js             # Tailwind design tokens and custom theme extensions
├── next.config.js                 # Next.js build and routing configuration
└── src/
    ├── app/                       # Next.js 14 App Router file-system routes
    │   ├── layout.tsx             # Root layout with AuthProvider and ThemeProvider wrappers
    │   ├── page.tsx               # Root redirect / landing logic
    │   ├── login/page.tsx         # User authentication login view
    │   ├── forgot-password/page.tsx# Password reset initiation view
    │   ├── reset-password/page.tsx# New password submission view (redirect target from Supabase email)
    │   ├── dashboard/page.tsx     # Executive quality dashboard (defect trends, pass/fail ratios)
    │   ├── inspections/           # Inspection management subsystem
    │   │   ├── page.tsx           # Paginated inspections table with status/class filters
    │   │   └── [id]/page.tsx      # Granular inspection inspection view with raw/annotated image viewer
    │   ├── models/page.tsx        # Deep learning model comparison and benchmarking dashboard
    │   ├── notifications/page.tsx # Notification feed and alert configuration
    │   ├── reports/page.tsx       # Compliance report generator, audit history, and CSV/JSON export
    │   ├── users/page.tsx         # User administration panel (Admin-only RBAC, user activation)
    │   ├── profile/page.tsx       # Current user settings, password updates, station metadata
    │   ├── 403/page.tsx           # Forbidden access boundary page for unauthorized role attempts
    │   └── api/                   # Server-side Next.js route handlers
    │       └── notifications/
    │           └── email/route.ts # Server-side SMTP email dispatch handler
    ├── components/                # Reusable UI component library
    │   ├── layout/                # Shell components: Sidebar, Header, MobileNav, Breadcrumbs
    │   ├── ui/                    # Base primitives: Button, Modal, Card, Input, Badge, Toast
    │   ├── inspections/           # InspectionCard, DefectTable, CanvasAnnotator, SeverityTag
    │   ├── dashboard/             # StatCard, DefectDistributionChart, YieldTrendChart
    │   └── reports/               # ReportFilterModal, ExportButton, ReportHistoryTable
    └── lib/                       # Core utility, state, and API integration services
        ├── supabase.ts            # Configured Supabase JavaScript client instance
        ├── context/
        │   └── AuthContext.tsx    # React Context managing session, active user, and role
        └── api/                   # Modular API client services
            ├── client.ts          # Axios/Fetch wrapper with JWT Bearer token auto-injection
            ├── auth.ts            # Supabase GoTrue authentication methods
            ├── inspections.ts     # Inspection CRUD, reviews, and manual overrides
            ├── reports.ts         # Report generation, querying, and CSV/JSON compilation
            ├── users.ts           # User list, activation, and role update handlers
            ├── notifications.ts   # Notification fetching and mark-as-read mutation
            ├── stats.ts           # Aggregated yield and defect frequency endpoints
            └── models.ts          # Model metadata and benchmark query endpoints
```

### State Management & React Context
- **Global Authentication State (`web/src/lib/context/AuthContext.tsx`)**:
  - Encapsulates the Supabase authentication listener (`supabase.auth.onAuthStateChange`).
  - Stores the current authenticated user object, session token, and verified role (`admin` or `inspector`).
  - Automatically redirects unauthenticated requests to `/login`, and redirects unauthorized non-admin attempts on `/users` to `/403`.
- **Local Component State**: Handled cleanly via React's `useState` and `useEffect` hooks for modal visibility, tabular filter selections, and image zoom levels.
- **Data Fetching Pattern**: Dual-layer architecture:
  1. *Direct Supabase Client*: High-frequency queries (e.g., loading inspections list) execute directly against Supabase PostgREST for minimum latency.
  2. *REST API Client*: Complex multi-table operations and email alerts execute via FastAPI or Next.js route handlers.

---

## 11. Backend Architecture

The backend (`backend/app/`) is an asynchronous REST microservice built with **FastAPI** running on top of **Uvicorn** (ASGI).

```
backend/
├── requirements.txt               # Backend dependencies (fastapi, uvicorn, pydantic, pyjwt, passlib, etc.)
└── app/
    ├── main.py                    # Application entry point, CORS middleware, router registrations
    ├── config.py                  # Pydantic BaseSettings loading environment configuration
    ├── auth.py                    # JWT generation, token verification, role dependencies, bcrypt hashing
    ├── db.py                      # SQLAlchemy database engine and session factory
    ├── models.py                  # SQLAlchemy ORM model definitions
    ├── schemas.py                 # Pydantic request/response data validation schemas
    ├── storage.py                 # Supabase Storage client wrapper for image persistence
    ├── services/
    │   └── email.py               # Asynchronous SMTP client broadcasting defect alert emails
    └── routers/                   # Modular FastAPI sub-routers
        ├── auth.py                # Endpoints: /api/auth (login, register, me, logout)
        ├── inspections.py         # Endpoints: /api/inspections (list, get, update, delete, detect)
        ├── models_router.py       # Endpoints: /api/models (list, load, benchmark)
        ├── reports.py             # Endpoints: /api/reports (generate, list, export)
        ├── notifications.py       # Endpoints: /api/notifications (list, mark-read)
        ├── reviews.py             # Endpoints: /api/reviews (manual override submission)
        ├── settings.py            # Endpoints: /api/settings (system configuration)
        ├── stats.py               # Endpoints: /api/stats (yield summary, defect trends)
        ├── users.py               # Endpoints: /api/users (user administration, role modification)
        └── audit.py               # Endpoints: /api/audit (system audit logs)
```

### Key Architectural Strengths of the FastAPI Backend
1. **Asynchronous Execution (ASGI)**: All route handlers are declared with `async def`, allowing non-blocking I/O during database transactions, remote file storage uploads, and SMTP network operations.
2. **Strict Request Validation**: Every inbound HTTP request body is validated against Pydantic schemas before executing route logic. Malformed payloads are automatically rejected with a `422 Unprocessable Entity` response.
3. **Dependency Injection**: FastAPI's `Depends()` pattern is utilized for authentication (`Depends(get_current_user)`) and role enforcement (`Depends(require_role("admin"))`), guaranteeing clean separation between routing and authorization logic.

---

## 12. Desktop Architecture

The desktop application (`ui/main_window.py`, `app.py`) is an industrial edge workstation program engineered with **PySide6 (Qt for Python)**.

```
Desktop Workstation Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                        GUI Thread (Main Event Loop)                    │
│                                                                        │
│  - MainWindow (`ui/main_window.py`)                                    │
│  - QCamera / OpenCV Video Capture Widget                               │
│  - Real-time QPainter Bounding Box Canvas Overlay                     │
│  - Operator Action Panel (Inspect, Capture, Select Model)              │
│  - Local Inspection History Table & Yield Summary Bar                  │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │ Signals / Slots                │ Signals / Slots
                    │                                │
┌───────────────────┴──────────────────┐  ┌──────────▼───────────────────┐
│     InferenceWorker (QThread)        │  │     SyncWorker (QThread)     │
│                                      │  │                              │
│ - Accepts frame from camera/folder   │  │ - Polls `core/store.py`      │
│ - Letterboxes image to 640x640       │  │ - Identifies unsynced records│
│ - Dynamic High-Res Grid Tiling       │  │ - Verifies internet connection│
│ - Executes ONNX / PyTorch Forward    │  │ - Uploads images to Supabase │
│ - Class-aware NMS & Coordinate Remap │  │ - Dispatches PostgREST SQL   │
│ - Commits record to SQLite           │  │ - Updates local status flag  │
│ - Emits `inspection_completed` signal│  │ - Emits `sync_status` signal │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Multithreading via `QThread`
Deep learning inference on a 4K industrial camera image requires significant computation. If executed on the main GUI thread, the user interface would freeze for 50-100 ms per frame, causing dropped frames and an unresponsive operator interface.
- To prevent this, the desktop client implements a strict multi-threaded architecture using `QThread` and Qt's asynchronous signal/slot mechanism.
- The `InferenceWorker` processes frames in the background and emits a signal containing detected bounding boxes and severity metrics back to the GUI thread for instantaneous rendering.

### Local SQLite Store (`core/store.py`)
To withstand intermittent factory Wi-Fi or Ethernet disconnects, the workstation implements a local, zero-configuration SQLite database (`station.db`):
- Schema includes: `inspections` (id, timestamp, status, defect_count, inference_time_ms, sync_status) and `defects` (inspection_id, defect_type, bbox, confidence, severity).
- When a board is inspected, it is immediately written to local SQLite with `sync_status = 'pending'`.
- The background `SyncWorker` thread continuously monitors the queue, pushing completed records to the cloud without blocking local production.

---

## 13. Mobile Architecture

The mobile application (`mobile/`) is a cross-platform companion monitoring app developed using **Flutter 3.x** and **Dart**.

```
mobile/
├── pubspec.yaml                   # Flutter dependencies (supabase_flutter, provider, flutter_spinkit)
└── lib/
    ├── main.dart                  # Mobile app entry point and Supabase initialization
    ├── providers/                 # State management via ChangeNotifier
    │   ├── auth_provider.dart     # Mobile session management and login state
    │   └── supabase_service.dart  # Data queries and realtime subscriptions
    ├── screens/                   # User interface screens
    │   ├── login_screen.dart      # Mobile authentication screen
    │   ├── dashboard_screen.dart  # Quality summary, yield percentage, defect counters
    │   ├── inspections_screen.dart# Searchable list of recent board inspections
    │   ├── inspection_detail_screen.dart # Visual defect detail with image zoom
    │   ├── alerts_screen.dart     # Critical defect alert notifications feed
    │   ├── models_screen.dart     # Active models and performance benchmarks
    │   └── settings_screen.dart   # Server URL configuration and user profile
    └── widgets/                   # Reusable mobile widgets (DefectBadge, StatCard, CustomAppBar)
```

### Companion Monitoring Model
- **Architectural Scope**: The mobile application is deliberately designed as a **read-only companion monitoring client** rather than an edge inspection station.
- **Why Mobile Does Not Run Local Inference**:
  1. Industrial PCB inspection requires high-magnification telecentric lenses and stable diffuse ring illumination that mobile cameras cannot provide.
  2. Running continuous high-throughput deep-learning inference on mobile chipsets causes rapid thermal throttling and battery depletion.
- **Mobile Value Proposition**: Plant managers, QA directors, and field engineers can monitor live factory yield, review defect trends, and receive push notifications on critical defects without being physically tied to an inspection terminal on the factory floor.
"""
