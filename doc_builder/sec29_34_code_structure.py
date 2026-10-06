# -*- coding: utf-8 -*-
"""Section 29 - 34: Frontend, Backend, Desktop, Mobile Code Structures, Complete Project Tree, Dependency Map."""

CONTENT = """## 29. Frontend Code Structure

The web application (`web/`) is organized strictly adhering to the Next.js 14 App Router specifications:

```
web/src/
├── app/
│   ├── layout.tsx                 # Root HTML shell, font declarations, AuthContext provider
│   ├── page.tsx                   # Client-side route redirect based on auth status
│   ├── login/page.tsx             # Login form with email/password and Supabase signInWithPassword
│   ├── forgot-password/page.tsx   # Password reset initiation form with Supabase resetPasswordForEmail
│   ├── reset-password/page.tsx    # Password update landing page with Supabase updateUser
│   ├── dashboard/page.tsx         # Dashboard metrics: Total Inspected, Pass Rate, Defect Breakdown
│   ├── inspections/
│   │   ├── page.tsx               # Paginated table with status, date, and inspector filters
│   │   └── [id]/page.tsx          # Dynamic route: Inspection details, defect zoom, verdict override
│   ├── models/page.tsx            # Deep learning model comparison table and performance metrics
│   ├── notifications/page.tsx     # In-app notifications list and mark-as-read triggers
│   ├── reports/page.tsx           # Compliance reports page: Generate modal, report table, CSV export
│   ├── users/page.tsx             # User administration (Admin-only RBAC): Deactivate/activate, change role
│   ├── profile/page.tsx           # User settings, current session details, station metadata
│   ├── 403/page.tsx               # Access forbidden boundary page
│   └── api/
│       └── notifications/
│           └── email/route.ts     # Next.js Server Route Handler: Direct SMTP alert broadcaster
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Top navigation, user profile avatar, unread notification bell
│   │   ├── Sidebar.tsx            # Navigation links with role-based visibility toggles
│   │   └── MobileNav.tsx          # Responsive slide-out navigation drawer
│   ├── ui/
│   │   ├── Button.tsx             # Standard styled button with loading spinner state
│   │   ├── Modal.tsx              # Accessible dialog overlay primitive
│   │   ├── Card.tsx               # Consistent dashboard card container
│   │   ├── Badge.tsx              # Colored status badges (PASS=Green, FAIL=Red, PENDING=Amber)
│   │   └── Toast.tsx              # Floating toast notification system
│   ├── inspections/
│   │   ├── DefectOverlayCanvas.tsx# Canvas overlay drawing defect bounding boxes over board image
│   │   ├── InspectionTable.tsx    # Tabular list of inspections with sorting and pagination
│   │   └── OverrideModal.tsx      # Modal for entering QA notes and overriding AI verdict
│   └── dashboard/
│       ├── StatCards.tsx          # Metric cards for yield, total scans, and critical defect counts
│       └── DefectCharts.tsx       # Recharts visualization of defect frequency by class
└── lib/
    ├── supabase.ts                # Supabase JavaScript client initialized with env credentials
    ├── context/
    │   └── AuthContext.tsx        # React Context providing session, current user, role, and logout
    └── api/
        ├── client.ts              # Fetch wrapper injecting `Authorization: Bearer <token>`
        ├── auth.ts                # Supabase auth wrappers (login, register, forgot-password)
        ├── inspections.ts         # PostgREST and FastAPI inspection fetching, filtering, and overrides
        ├── reports.ts             # Report generation, CSV string compilation, and file download trigger
        ├── users.ts               # User list retrieval, active status toggle, role modification
        ├── notifications.ts       # Notifications list and status update handlers
        ├── stats.ts               # Summary statistics and defect trend aggregation
        └── models.ts              # Model metadata retrieval and benchmark data fetching
```

---

## 30. Backend Code Structure

The FastAPI microservice (`backend/app/`) follows a clean, modular router-and-service architecture:

```
backend/app/
├── main.py                        # Entry point: FastAPI app, CORS middleware, router mounts, startup events
├── config.py                      # Pydantic BaseSettings loading .env configuration
├── auth.py                        # Security core: PyJWT token creation/verification, get_current_user, RBAC
├── db.py                          # SQLAlchemy engine setup, sessionmaker, get_db dependency
├── models.py                      # SQLAlchemy ORM models: User, Inspection, Defect, Review, Report
├── schemas.py                     # Pydantic validation models for all request bodies and responses
├── storage.py                     # Supabase Storage client wrapper for uploading and signed URLs
├── services/
│   └── email.py                   # SMTP client service broadcasting critical defect alert emails
└── routers/
    ├── auth.py                    # /api/auth endpoints: login, register, me, logout
    ├── inspections.py             # /api/inspections endpoints: list, get, update, delete, detect
    ├── models_router.py           # /api/models endpoints: list models, load model, metrics
    ├── reports.py                 # /api/reports endpoints: generate, list, export CSV
    ├── notifications.py           # /api/notifications endpoints: list, mark read
    ├── reviews.py                 # /api/reviews endpoints: submit QA review override
    ├── settings.py                # /api/settings endpoints: get/update system thresholds
    ├── stats.py                   # /api/stats endpoints: yield summary, defect distribution
    ├── users.py                   # /api/users endpoints: list users, update status/role (Admin only)
    └── audit.py                   # /api/audit endpoints: system audit log retrieval
```

---

## 31. Desktop Code Structure

The edge desktop workstation combines PySide6 GUI elements with core computer vision modules:

```
PCB-Fault-Detection-System/
├── app.py                         # Desktop application launcher script
├── ui/
│   ├── main_window.py             # PySide6 main window: camera feed, detection canvas, controls
│   ├── components/
│   │   ├── video_widget.py        # Video/image display widget with QPainter overlay
│   │   ├── inspection_panel.py    # Right-hand panel: defect list, severity tags, PASS/FAIL badge
│   │   └── sync_status_bar.py     # Status bar widget displaying pending sync queue count
│   └── styles.py                  # Dark-themed industrial Qt style sheets (QSS)
└── core/
    ├── detector.py                # Primary PCBDetector class: OpenCV DNN / ONNX inference, tiling, NMS
    ├── severity.py                # Rule-based severity classifier (Critical, Moderate, Minor)
    ├── store.py                   # Local SQLite store (station.db): local ACID persistence
    ├── sync.py                    # Background QThread sync worker: cloud synchronization to Supabase
    └── camera.py                  # Industrial camera interface (USB, GenICam, RTSP, folder watch)
```

---

## 32. Mobile Code Structure

The companion Flutter mobile app (`mobile/lib/`) uses the **Provider** state management pattern:

```
mobile/lib/
├── main.dart                      # Application root: Supabase.initialize(), MultiProvider, MaterialApp
├── providers/
│   ├── auth_provider.dart         # ChangeNotifier: login, logout, current user session state
│   └── supabase_service.dart      # Data provider: inspections stream, notifications, stats
├── screens/
│   ├── login_screen.dart          # Mobile authentication screen
│   ├── dashboard_screen.dart      # Production summary cards, yield percentage, defect counters
│   ├── inspections_screen.dart    # Infinite scrolling list of recent board inspections
│   ├── inspection_detail_screen.dart # High-res image viewer with interactive defect zoom
│   ├── alerts_screen.dart         # Critical defect alert notification stream
│   ├── models_screen.dart         # Model registry and accuracy benchmark metrics
│   └── settings_screen.dart       # Supabase URL/Key configuration and user profile display
└── widgets/
    ├── defect_badge.dart          # Colored badge component for defect types and severities
    ├── metric_card.dart           # Dashboard KPI statistic card widget
    └── loading_indicator.dart     # Consistent animated loading spinner
```

---

## 33. Complete File Structure

Below is the verified structural directory tree of the repository:

```
PCB-Fault-Detection-System/
├── .gitignore                     # Git ignore rules for node_modules, .venv, *.onnx, *.db
├── README.md                      # General repository overview and quickstart guide
├── FYP_VIVA_MASTER_DOCUMENT.md    # Master FYP viva defense and technical manual (This Document)
├── app.py                         # Desktop PySide6 workstation entry point
├── requirements.txt               # Root Python dependencies (PySide6, OpenCV, PyTorch, NumPy)
├── backend/                       # FastAPI REST API Backend
│   ├── requirements.txt           # Backend-specific dependencies (FastAPI, Uvicorn, PyJWT, Passlib)
│   ├── .env.example               # Example backend environment variables template
│   └── app/
│       ├── main.py                # FastAPI main application and middleware
│       ├── config.py              # Configuration loader via Pydantic BaseSettings
│       ├── auth.py                # JWT security and password hashing
│       ├── db.py                  # Database connection and session management
│       ├── models.py              # SQLAlchemy database ORM models
│       ├── schemas.py             # Pydantic data schemas
│       ├── storage.py             # Supabase Storage client wrapper
│       ├── services/
│       │   └── email.py           # SMTP critical defect alert mailer
│       └── routers/
│           ├── auth.py            # Authentication routes
│           ├── inspections.py     # Inspection CRUD and inference routes
│           ├── models_router.py   # Model metadata and benchmarking routes
│           ├── reports.py         # Compliance reporting routes
│           ├── notifications.py   # Notification routes
│           ├── reviews.py         # QA override review routes
│           ├── settings.py        # System threshold routes
│           ├── stats.py           # Production yield analytics routes
│           ├── users.py           # User management and RBAC routes
│           └── audit.py           # Audit logging routes
├── web/                           # Next.js 14 Full-Stack Web Management Portal
│   ├── package.json               # Node dependencies (Next.js 14, React 18, Tailwind, Lucide)
│   ├── tsconfig.json              # TypeScript configuration
│   ├── tailwind.config.js         # Tailwind utility styling configuration
│   ├── next.config.js             # Next.js bundler and routing options
│   ├── .env.local.example         # Web environment variables template
│   └── src/
│       ├── app/                   # App Router pages and server route handlers
│       ├── components/            # Reusable React UI component library
│       └── lib/                   # API clients, Supabase SDK, AuthContext
├── core/                          # Computer Vision and Edge Persistence Core
│   ├── detector.py                # PCBDetector: ONNX/PyTorch inference, tiling, NMS
│   ├── severity.py                # Rule-based defect severity classification
│   ├── store.py                   # Local SQLite store (`station.db`)
│   ├── sync.py                    # Cloud synchronization background thread
│   └── camera.py                  # Video capture and industrial camera abstraction
├── ui/                            # Desktop PySide6 Graphical User Interface
│   ├── main_window.py             # Main Qt window and event orchestration
│   ├── components/                # Modular Qt widgets (video canvas, inspection table)
│   └── styles.py                  # Dark-mode industrial Qt style sheets
├── mobile/                        # Cross-Platform Flutter Mobile Companion App
│   ├── pubspec.yaml               # Flutter package dependencies
│   └── lib/                       # Flutter Dart source code (screens, providers, widgets)
├── models/                        # Deep Learning Model Weights & Benchmarks
│   ├── yolov8s.onnx               # Primary production ONNX model
│   ├── yolov8n.onnx               # Lightweight edge ONNX model
│   └── model_registry.json        # Metadata and evaluation benchmarks registry
├── ml/                            # Machine Learning Research & Benchmarking Scripts
│   ├── train.py                   # Model training script
│   ├── evaluate.py                # Evaluation script computing mAP, precision, recall
│   ├── export_onnx.py             # PyTorch-to-ONNX optimization exporter
│   └── benchmark.py               # Latency and throughput benchmarking tool
├── data/                          # Dataset schemas and sample test boards
│   └── samples/                   # Sample raw PCB images for test inference
└── scripts/                       # DevOps, migration, and database initialization scripts
    ├── init_db.sql                # Complete PostgreSQL / Supabase schema creation script
    └── seed_data.py               # Database seeding script for development
```

---

## 34. File-to-File Dependency Map

```
====================================================================================================
                                  INTERNAL DEPENDENCY GRAPH
====================================================================================================

 [ DESKTOP EDGE TIER ]
   app.py ────────────────────────► ui/main_window.py
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
          core/detector.py          core/store.py           core/sync.py
                  │                       │                       │
                  ▼                       ▼                       ▼
          core/severity.py           station.db        Supabase Storage / PostgREST
                  │                                               ▲
                  ▼                                               │
          models/yolov8s.onnx                                     │
                                                                  │
==================================================================│=================================
 [ BACKEND SERVICES TIER ]                                        │
   backend/app/main.py ───────────────────────────────────────────┤
          │                                                       │
          ├────────► backend/app/routers/inspections.py ──────────┤
          │                 │                                     │
          │                 ├─► backend/app/storage.py ───────────┘
          │                 └─► backend/app/services/email.py
          │
          ├────────► backend/app/routers/auth.py ────────► backend/app/auth.py
          │                                                       │
          ├────────► backend/app/routers/reports.py               ▼
          │                                              backend/app/models.py
          ├────────► backend/app/routers/users.py                 │
          │                                                       ▼
          └────────► backend/app/routers/stats.py        backend/app/db.py (PostgreSQL)

====================================================================================================
 [ WEB PORTAL TIER ]
   web/src/app/layout.tsx ────────► web/src/lib/context/AuthContext.tsx
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
   web/src/app/dashboard/page.tsx                                 web/src/app/inspections/page.tsx
                  │                                                               │
                  ▼                                                               ▼
   web/src/lib/api/stats.ts                                       web/src/lib/api/inspections.ts
                  │                                                               │
                  ├───────────────────────────────┬───────────────────────────────┘
                  ▼                               ▼
       web/src/lib/supabase.ts           web/src/lib/api/client.ts
                  │                               │
                  ▼                               ▼
       Supabase PostgREST Gateway        FastAPI REST Endpoints
```
"""
