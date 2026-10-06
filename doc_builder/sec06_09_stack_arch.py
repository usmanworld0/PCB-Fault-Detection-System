# -*- coding: utf-8 -*-
"""Section 06 - 09: Complete Technology Stack, Architectural Rationale, Overall Architecture, Complete System Flow."""

CONTENT = """## 6. Complete Technology Stack

The PCB Fault Detection System is engineered across multiple specialized runtime environments. Every technology in the table below was verified directly from the repository source code and configuration files.

| Technology | Repository Location | Primary Purpose in System | Realistic Alternative | Architectural Rationale for Selection |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js 14** | `web/package.json` | Web application framework (App Router, SSR, API routes) | Plain React (Vite / CRA), Nuxt.js | Production SSR/SSG, optimized asset bundling, unified routing, fast initial page loads |
| **React 18** | `web/package.json` | Component-driven user interface library | Vue.js, Svelte, Angular | Declarative UI, massive ecosystem, rich UI component primitives, robust state hooks |
| **TypeScript 5.x** | `web/package.json`, `web/tsconfig.json` | Strict type safety across the frontend codebase | Pure JavaScript (ES6+) | Compile-time defect elimination, auto-completion, strict contract binding with backend schemas |
| **Tailwind CSS** | `web/tailwind.config.js` | Utility-first styling and responsive UI design | Vanilla CSS, CSS Modules, Styled Components | High design velocity, zero runtime stylesheet overhead, compact production CSS bundle |
| **Lucide React** | `web/package.json` | Modern SVG iconography across web dashboard | FontAwesome, Material Icons | Tree-shakeable SVG icons, crisp industrial design, zero unnecessary font asset downloads |
| **FastAPI** | `backend/requirements.txt` | High-throughput asynchronous REST API backend | Flask, Django, Express.js | Asynchronous ASGI execution, native Pydantic schema validation, automatic OpenAPI/Swagger generation |
| **Uvicorn** | `backend/requirements.txt` | ASGI web server implementation | Gunicorn, Waitress, Hypercorn | Ultra-fast asyncio event loop implementation (uvloop) ideal for high-concurrency microservices |
| **Python 3.10+** | Root, `backend/`, `core/`, `ui/` | Core programming language for CV, edge, and backend | C++, C#, Node.js | Unmatched computer vision and deep learning library ecosystem (OpenCV, PyTorch, NumPy) |
| **PySide6 (Qt for Python)** | `requirements.txt` | Industrial edge workstation desktop GUI | PyQt5/6, Tkinter, Electron | Native OS rendering, native multithreaded GUI pipeline (`QThread`), commercial Qt license friendliness |
| **Flutter 3.x / Dart** | `mobile/pubspec.yaml` | Cross-platform companion mobile monitoring application | React Native, Kotlin Multiplatform | Single codebase for iOS and Android, 60fps Skia/Impeller rendering engine, native platform channels |
| **Supabase** | `web/`, `backend/`, `mobile/`, `core/` | Managed BaaS: PostgreSQL, GoTrue Auth, Storage | AWS Amplify, Firebase, Self-hosted Postgres | Full PostgreSQL power with built-in JWT authentication, S3-compatible storage, PostgREST instant APIs |
| **PostgreSQL 15** | Cloud Supabase instance | Primary relational database for all structured metadata | MySQL, MongoDB, SQLite (cloud) | ACID compliance, robust foreign key relational integrity, JSONB support, Row Level Security (RLS) |
| **SQLite3** | `core/store.py` (`station.db`) | Local offline-first edge workstation datastore | Local RocksDB, JSON flat files | Zero-configuration file-based SQL engine, zero network latency, rock-solid ACID reliability offline |
| **Supabase Storage** | `backend/app/storage.py`, `core/sync.py` | S3-compatible cloud object storage for PCB imagery | AWS S3, Cloudinary, Local Disk | Native integration with Supabase auth and RLS policies, CDN caching, direct secure URL generation |
| **PyTorch & Torchvision** | `requirements.txt`, `ml/` | Deep learning training and benchmark model inference | TensorFlow / Keras, JAX | De facto academic and industrial standard for computer vision research, dynamic computational graphs |
| **Ultralytics YOLOv8** | `core/detector.py`, `models/` | State-of-the-art one-stage real-time object detector | YOLOv5, YOLOv7, SSD, MobileNet | Superior speed-accuracy Pareto frontier, anchor-free detection head, optimized ONNX export |
| **ONNX Runtime / OpenCV DNN** | `core/detector.py` | Production edge inference engine (`cv2.dnn`) | TensorRT, OpenVINO, LibTorch | Portable cross-platform inference with zero heavy PyTorch runtime installation dependencies |
| **OpenCV (`cv2`)** | `core/detector.py`, `requirements.txt` | Image pre-processing, letterboxing, bounding box drawing | PIL/Pillow, scikit-image | High-performance C++ computer vision operations, SIMD optimizations, industrial camera capture support |
| **NumPy** | `requirements.txt`, `core/` | Array manipulation, coordinate math, tiling transformations | Pure Python lists | Vectorized C-level mathematical operations essential for low-latency bounding box coordinate math |
| **PyJWT** | `backend/requirements.txt`, `backend/app/auth.py` | Cryptographic JSON Web Token creation and verification | python-jose, Authlib | Standard compliant, lightweight, secure HMAC SHA-256 (HS256) signature verification |
| **Passlib (Bcrypt)** | `backend/requirements.txt`, `backend/app/auth.py` | Salted password hashing algorithm | Argon2, PBKDF2, SHA-256 | Resistant to brute-force and dictionary attacks via adaptive cryptographic cost factor |
| **smtplib / email** | `backend/app/services/email.py` | Native Python SMTP protocol client for automated alerts | SendGrid, Mailgun, Amazon SES | Zero external SaaS cost, direct connection to standard SMTP relays (Gmail App Password), zero vendor lock-in |
| **Git & GitHub** | Entire codebase | Distributed version control and source code management | GitLab, Bitbucket | Industry standard source code versioning, branch management, collaborative code review |
| **Vercel** | Web deployment target | Cloud serverless hosting platform for Next.js web portal | AWS Amplify, Netlify, Docker on VPS | Native Next.js optimization, edge caching, zero-config CI/CD deployments, instant HTTPS |

---

### In-Depth Technology Breakdown & Viva Answers

#### 1. Next.js 14
- **What it is**: A full-stack React framework providing hybrid static and server rendering, smart routing, and built-in optimizations.
- **What it does in THIS project**: Renders the complete web management portal located in `web/`, including dashboards, inspection lists, inspection detail inspectors, user management, and report generators.
- **Why selected**: Allows seamless React component reuse while eliminating client-side loading waterfalls through App Router server layouts and server-side route handlers.
- **What problem it solves**: Solves blank-screen flashes and slow initial page loads inherent to single-page applications (SPAs), while bundling TypeScript, routing, and Tailwind out of the box.
- **Alternatives**: Plain React (Vite/CRA), Vue/Nuxt, Angular.
- **Why alternative not chosen**: Plain React lacks unified server route handlers and built-in image/font optimization. Next.js offered superior developer velocity and effortless Vercel edge deployment.
- **Short Viva Answer**: *"We chose Next.js 14 because its App Router provides a production-grade full-stack architecture with fast server rendering, type-safe API routing, and seamless integration with our Supabase authentication layer."*

#### 2. FastAPI & Uvicorn
- **What it is**: A modern, high-performance web framework for Python based on standard Python type hints and ASGI.
- **What it does in THIS project**: Powers `backend/app/`, exposing RESTful API endpoints for user authentication, inspection reviews, report generation triggers, automated email dispatch, and model benchmarks.
- **Why selected**: It operates on Python's asynchronous event loop (asyncio) via Uvicorn, matches Node.js performance benchmarks, and provides automatic Pydantic request validation and Swagger documentation.
- **What problem it solves**: Eliminates repetitive manual request payload validation and provides an asynchronous API server capable of communicating directly with Python ML code without IPC bridges.
- **Alternatives**: Flask, Django, Express.js, NestJS.
- **Why alternative not chosen**: Flask is synchronous by default and lacks native schema validation. Django is excessively heavy and monolithic. Node.js (Express/NestJS) cannot natively execute Python computer vision models (OpenCV, PyTorch) in-process.
- **Short Viva Answer**: *"FastAPI was selected because it combines asynchronous ASGI speed with Pydantic type validation, while living in the native Python ecosystem required to communicate with our computer vision models."*

#### 3. PySide6 (Qt for Python)
- **What it is**: The official Python binding for the Qt cross-platform GUI framework, maintained by The Qt Company.
- **What it does in THIS project**: Powers the edge inspection workstation (`ui/main_window.py`), rendering the real-time camera/file inspection interface, bounding box overlay canvas, inspection logs, and sync status widgets.
- **Why selected**: Provides hardware-accelerated desktop rendering, robust multi-threading (`QThread`) to decouple GUI rendering from heavy deep learning inference, and seamless OpenCV NumPy array interoperability.
- **What problem it solves**: Solves the UI freezing problem that occurs when running computationally heavy AI inference on the main application thread.
- **Alternatives**: PyQt5/6, Tkinter, Electron.
- **Why alternative not chosen**: Tkinter is archaic and lacks modern styling or threading primitives. Electron has massive RAM/CPU overhead (~500MB idle). PySide6 is LGPL licensed, offering superior commercial licensing flexibility compared to GPL-restricted PyQt.
- **Short Viva Answer**: *"We used PySide6 because Qt's native C++ underpinnings and `QThread` event model allow us to run heavy computer vision inference in background worker threads without dropping UI frame rates on the factory floor."*

#### 4. Flutter & Dart
- **What it is**: Google's open-source UI software development kit for building cross-platform natively compiled applications.
- **What it does in THIS project**: Powers `mobile/`, providing QA supervisors with a companion mobile app to monitor live line yield, browse inspection history, and view defect alerts on iOS and Android devices.
- **Why selected**: Single Dart codebase compiling to native ARM machine code with a 60fps reactive rendering engine.
- **What problem it solves**: Prevents the need to maintain separate native Swift (iOS) and Kotlin (Android) codebases for mobile QA monitoring.
- **Alternatives**: React Native, Native Android/iOS, Progressive Web App (PWA).
- **Why alternative not chosen**: React Native relies on a JavaScript bridge that can introduce UI jitter. Flutter's self-contained rendering pipeline ensures consistent pixel-perfect UI across all mobile devices.
- **Short Viva Answer**: *"Flutter allowed us to build a high-performance cross-platform mobile companion app with a single Dart codebase, giving plant managers mobile visibility into factory line yield via Supabase."*

#### 5. Supabase & PostgreSQL
- **What it is**: An open-source Backend-as-a-Service (BaaS) built on top of enterprise-grade PostgreSQL.
- **What it does in THIS project**: Provides the cloud database (`inspections`, `defects`, `users`, `reports`, `notifications`), GoTrue user authentication, Row Level Security (RLS), and S3-compatible image bucket storage (`pcb-vision`).
- **Why selected**: Gives the power and relational integrity of PostgreSQL without requiring manual database server DevOps, while bundling an S3-compatible object store and secure authentication engine.
- **What problem it solves**: Eliminates the overhead of configuring separate database clusters, S3 buckets, and custom OAuth/auth microservices.
- **Alternatives**: Firebase, AWS Amplify, Raw Self-Hosted PostgreSQL + MinIO.
- **Why alternative not chosen**: Firebase is a NoSQL document database that lacks strict relational foreign keys and complex SQL aggregations needed for industrial defect analytics. Supabase provides raw PostgreSQL power with modern developer APIs.
- **Short Viva Answer**: *"Supabase provides the full relational power and ACID guarantees of PostgreSQL along with integrated S3 object storage and JWT authentication, perfectly bridging our edge stations and cloud web portal."*

#### 6. YOLOv8 & ONNX Runtime / OpenCV DNN
- **What it is**: State-of-the-art single-stage anchor-free convolutional object detection architecture developed by Ultralytics, executed via the Open Neural Network Exchange (ONNX) format.
- **What it does in THIS project**: Acts as the primary defect localization engine in `core/detector.py`, accepting 640x640 board image tensors and predicting bounding box coordinates, class IDs, and confidence scores.
- **Why selected**: Achieves an exceptional speed-to-accuracy ratio (87.6% mAP@0.5 at 10.1 ms inference latency), far outperforming older two-stage detectors in real-time edge environments.
- **What problem it solves**: Solves the trade-off between inspection throughput and detection precision on microscopic defects.
- **Alternatives**: YOLOv5, Faster R-CNN, SSD, RetinaNet.
- **Why alternative not chosen**: Faster R-CNN is 10x slower (114 ms), making it unviable for high-speed conveyor belts. YOLOv5 is older and uses anchor-based heads that struggle with varied micro-defect aspect ratios compared to YOLOv8's anchor-free design.
- **Short Viva Answer**: *"We deployed YOLOv8s in ONNX format because its anchor-free architecture provides outstanding localization on micro-defects at an inference speed of only 10 milliseconds per board."*

---

## 7. Why Each Technology?

### Deep-Dive: Why Next.js 14?

```
                     ┌────────────────────────────────────────┐
                     │          Next.js 14 Framework          │
                     └───────────────────┬────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ Server-Side     │             │ Client-Side     │             │ Built-In API    │
│ Rendering (SSR) │             │ React (CSR)     │             │ Routes          │
├─────────────────┤             ├─────────────────┤             ├─────────────────┤
│ Fast initial    │             │ Interactive     │             │ Direct proxy to │
│ page load,      │             │ inspection zoom,│             │ Supabase and    │
│ zero blank-page │             │ bounding box    │             │ SMTP email      │
│ flash           │             │ toggles, filters│             │ service         │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

#### Understanding Rendering Paradigms in Next.js
1. **Server-Side Rendering (SSR)**: Pages are dynamically generated on the server on each request. The client receives fully rendered HTML, eliminating the slow loading spinners typical of pure client-side React apps.
2. **Client-Side Rendering (CSR)**: Used for interactive components (marked with `'use client'`), such as the interactive inspection canvas, live filter dropdowns, and modal dialogs.
3. **Static Site Generation (SSG)**: Pre-renders pages at build time. Used for static documentation or landing pages to achieve zero-latency responses via CDN caching.

#### Why Next.js Instead of Plain React (Vite / CRA)?
- **Routing**: Plain React requires configuring external libraries like `react-router-dom`, maintaining separate route configuration files, and handling lazy loading manually. Next.js provides file-system-based routing via the App Router (`web/src/app/*`).
- **Server Route Handlers**: Next.js allows backend logic (such as `web/src/app/api/notifications/email/route.ts`) to execute securely on the server without exposing private environment variables (e.g., SMTP passwords) to the browser. Plain React cannot do this without a separate Node.js server.
- **Built-in Asset Optimization**: Automatic optimization for images (`next/image`), scripts, and Google fonts out of the box.

#### Why Next.js Instead of NestJS?
*Examiners frequently ask this to test architectural clarity!*
- **Fundamental Distinction**: **Next.js** is a **frontend and full-stack web framework** designed primarily for building rich user interfaces and web applications. **NestJS** is a **pure backend server framework** built on top of Express or Fastify with an Angular-inspired modular, dependency-injection architecture.
- **Why NestJS was NOT chosen**:
  - Our system already requires **Python** on the backend because deep learning frameworks (PyTorch, OpenCV, Ultralytics) are natively written in C++ with Python bindings.
  - Adding NestJS would introduce a third runtime (Node.js backend) between our Next.js frontend and Python ML engine, creating unnecessary network hops, duplicate data transfer overhead, and maintenance complexity.
  - **FastAPI** already provides the dependency injection, type safety, and modular routing that NestJS provides, but does so directly within the Python ecosystem.
- **Could Next.js alone replace FastAPI in this project?**:
  - Next.js *could* handle all database CRUD and authentication.
  - However, Next.js runs on a **Node.js JavaScript runtime**. Running deep learning computer vision inference (ONNX, PyTorch) inside Node.js is suboptimal, lacks native GPU acceleration bindings for custom C++ CV pipelines, and bloats the web server. Decoupling the frontend (Next.js) from the ML/API engine (FastAPI) is the industry-standard clean architecture.

---

### Deep-Dive: Why Python & FastAPI?

#### Why Python for Computer Vision?
Python is the undisputed global standard for artificial intelligence and computer vision due to its ecosystem:
- **PyTorch & Torchvision**: Advanced tensor computation with GPU acceleration and dynamic computation graphs.
- **OpenCV (`cv2`)**: Industry-standard optimized C++ computer vision primitives exposed via Python.
- **NumPy**: Vectorized C-speed matrix operations for bounding box manipulation and image transformations.

#### Why FastAPI Instead of Other Python Frameworks?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Framework Comparison Matrix                           │
├─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ Metric          │ FastAPI      │ Flask        │ Django       │ Express.js   │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Architecture    │ ASGI (Async) │ WSGI (Sync)  │ WSGI (Sync)  │ Event-driven │
│ Request Speed   │ Very Fast    │ Moderate     │ Slow/Heavy   │ Fast         │
│ Data Validation │ Native       │ Manual / Ext │ Manual Forms │ Manual / Joi │
│                 │ (Pydantic)   │              │              │              │
│ Auto API Docs   │ Native       │ None         │ None         │ None         │
│                 │ (Swagger)    │ (Requires 3rd│              │ (Requires    │
│                 │              │  party tools)│              │  Swagger UI) │
│ Python ML Fit   │ Native       │ Native       │ Native       │ None (Node)  │
└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

1. **FastAPI vs. Flask**: Flask is historically synchronous (WSGI). While recent versions support async, it lacks integrated data validation. FastAPI is built from the ground up on ASGI (Asynchronous Server Gateway Interface) and uses Pydantic for automated request parsing and error reporting.
2. **FastAPI vs. Django**: Django is a "batteries-included" monolithic web framework with an integrated ORM, admin panel, and template engine. For a microservice API backend communicating with edge stations and deep learning models, Django introduces immense overhead and rigid architectural conventions.
3. **FastAPI vs. Express.js / NestJS**: Express runs on Node.js. It cannot natively execute Python ML models (OpenCV, PyTorch) without invoking brittle child processes or HTTP inter-process communication.

#### Why Didn't We Put the ML Model Directly Inside Next.js?
1. **Runtime Incompatibility**: Next.js executes inside a Node.js V8 JavaScript engine. High-performance machine learning models require native C++/CUDA execution engines.
2. **Memory Footprint**: Loading an AI model into memory inside a serverless web host (e.g., Vercel) causes execution timeouts, cold starts of 10-30 seconds, and strict memory limit exhaustion (typically 1024MB on free/standard tiers).
3. **Decoupled Scalability**: Edge workstations inspect boards on the factory floor even when the internet is disconnected. Tying inference to a web server would completely break the offline-first requirement of industrial manufacturing lines.

---

## 8. Overall Architecture

The system operates across three decoupled physical tiers: **Edge Workstation Tier**, **Cloud Services Tier**, and **Management Client Tier**.

```
====================================================================================================
                                      PCB-VISION SYSTEM ARCHITECTURE
====================================================================================================

 [ TIER 1: INDUSTRIAL EDGE WORKSTATION ]
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │ Hardware: Industrial Camera Feed / High-Res Industrial Image Files             │
 │                                                                                 │
 │ Desktop App (Python 3.10 + PySide6 / Qt)                                        │
 │ ┌─────────────────────────┐      ┌────────────────────────────────────────────┐ │
 │ │   GUI Thread (PySide6)  │◄────►│   Worker Threads (QThread)                 │ │
 │ │  - Live Camera Preview  │      │  - Image Capture & Letterbox Normalization │ │
 │ │  - Defect Bounding Boxes│      │  - Local Inference (OpenCV DNN / ONNX)     │ │
 │ │  - Operator Controls    │      │  - Bounding Box Coordinate Remapping       │ │
 │ └────────────┬────────────┘      │  - Severity Classification Engine          │ │
 │              │                   └─────────────────────┬──────────────────────┘ │
 │              ▼                                         ▼                        │
 │  ┌───────────────────────┐               ┌────────────────────────────────────┐ │
 │  │ Local SQLite Database │◄──────────────┤ Offline-First Sync Worker (QThread)│ │
 │  │   (`station.db`)      │               │  - Connectivity Detection Loop     │ │
 │  │  - Inspections Queue  │               │  - Batch Record Dispatcher         │ │
 │  │  - Defect Logs (ACID) │               │  - Dual Image Uploader             │ │
 │  └───────────────────────┘               └─────────────────┬──────────────────┘ │
 └────────────────────────────────────────────────────────────┼────────────────────┘
                                                              │ HTTPS / PostgREST / S3
                                                              ▼
====================================================================================================
 [ TIER 2: CLOUD & BACKEND SERVICES ]
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ Supabase Hosted Cloud Infrastructure                                                            │
 │                                                                                                 │
 │ ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────────┐ │
 │ │ PostgreSQL 15 Relational  │  │ Supabase GoTrue Auth      │  │ Supabase Storage (S3 API)     │ │
 │ │  - `users` Table (RBAC)   │  │  - JWT HS256 Tokens       │  │  - Bucket: `pcb-vision`       │ │
 │ │  - `inspections` Table    │  │  - Email Verification     │  │  - Path: `raw/*.jpg`          │ │
 │ │  - `defects` Table        │  │  - Password Recovery Flow │  │  - Path: `annotated/*.jpg`    │ │
 │ │  - `reports` Table        │  │  - Role Verification      │  │  - Path: `reports/*.csv`      │ │
 │ └─────────────▲─────────────┘  └─────────────▲─────────────┘  └───────────────▲───────────────┘ │
 └───────────────┼──────────────────────────────┼────────────────────────────────┼─────────────────┘
                 │                              │                                │
                 │ REST / PostgREST             │ Bearer Token                   │ HTTPS S3 Upload
                 ▼                              ▼                                ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ FastAPI Microservice Server (`backend/app/`)                                                    │
 │  - Asynchronous ASGI Endpoints (`/api/inspections`, `/api/users`, `/api/reports`)               │
 │  - JWT Verification (`get_current_user`, `require_role`)                                       │
 │  - Automated Defect Alert Service -> SMTP Mailer (`backend/app/services/email.py`)             │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                ▲
                                                │ REST / Bearer Auth
                                                ▼
====================================================================================================
 [ TIER 3: MANAGEMENT & MONITORING CLIENTS ]
 ┌───────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
 │ QA Web Management Portal                      │  │ Companion Mobile App                         │
 │ (Next.js 14, React 18, TypeScript, Tailwind)  │  │ (Flutter 3.x, Dart, Supabase-Flutter)        │
 │                                               │  │                                              │
 │  - Live Line Quality Dashboard (`/dashboard`) │  │  - Floor Supervisor Dashboard                │
 │  - Detailed Inspection Viewer (`/inspections`)│  │  - Live Inspection Feeds                     │
 │  - Manual QA Override (`/inspections/[id]`)   │  │  - Push Defect Alerts                        │
 │  - Model Benchmark Comparisons (`/models`)    │  │  - Model Performance Viewer                  │
 │  - User & Role Administration (`/users`)      │  │  - Remote Settings Review                    │
 │  - Multi-Format Audit Reports (`/reports`)    │  │                                              │
 └───────────────────────────────────────────────┘  └──────────────────────────────────────────────┘
====================================================================================================
```

### Explanation of Architectural Boundaries & Protocols
1. **Edge-to-Cloud Decoupling**: The Edge Workstation does not make synchronous blocking network calls during inspection. If the network drops, `core/store.py` writes to local SQLite (`station.db`). The `core/sync.py` thread handles synchronization in the background without affecting the operator's frame rate.
2. **PostgREST Direct Data Access**: The Web Portal (`web/src/lib/supabase.ts`) talks directly to PostgreSQL via Supabase's auto-generated PostgREST APIs using secure JWT bearer tokens, drastically reducing round-trip latency for common queries.
3. **FastAPI Complementary Services**: For complex multi-step operations (such as compiling system-wide audit reports, triggering local model retraining/benchmarking, or dispatching administrative alert emails), the Web Portal invokes FastAPI endpoints.

---

## 9. Complete System Flow

### Flow 1: Edge Desktop Inspection & Offline-to-Cloud Sync Flow

```
[ Operator / Camera Feed ]
          │
          ▼
[ `ui/main_window.py`: on_inspect_clicked() ]
          │
          ▼
[ `core/detector.py`: PCBDetector.detect() ]
  ├── 1. Check Dimensions -> Apply Tiling if aspect ratio > 1.5
  ├── 2. Pre-process -> Letterbox 640x640, BGR-to-RGB, Normalize [0, 1]
  ├── 3. Forward Pass -> cv2.dnn.readNetFromONNX() / YOLOv8s.onnx
  ├── 4. Post-process -> Class-aware NMS (IoU=0.45, Conf=0.25)
  └── 5. Remap Coordinates -> Project tile coordinates to original canvas
          │
          ▼
[ `core/severity.py`: classify_severity() ]
  ├── Class in {'open', 'short'} -> 'Critical' (if conf >= 0.6)
  └── Class in {'mousebite', 'spur', 'copper', 'pinhole'} -> 'Moderate'/'Minor'
          │
          ▼
[ `core/store.py`: Local SQLite Store ]
  ├── INSERT into inspections (status='PASS'/'FAIL', defect_count, timestamp)
  └── INSERT into defects (type, bbox, confidence, severity)
          │
          ▼
[ Update UI Canvas ] -> Draw colored bounding boxes, display PASS/FAIL badge
          │
          ▼
[ `core/sync.py`: Background Sync Worker Thread ]
  ├── Check internet connectivity
  ├── IF offline: Retain in SQLite, set sync_status = 'pending'
  └── IF online:
        ├── Upload raw image to Supabase Storage ('pcb-vision/raw/*.jpg')
        ├── Upload annotated image to Storage ('pcb-vision/annotated/*.jpg')
        ├── POST metadata to Supabase 'inspections' table
        ├── POST defect bounding boxes to Supabase 'defects' table
        └── UPDATE local SQLite: set sync_status = 'synced'
```

---

### Flow 2: Web QA Review & Defect Override Flow

```
[ Quality Assurance Engineer ]
          │
          ▼
[ Opens Web Portal: `/inspections/[id]` ]
          │
          ▼
[ `web/src/app/inspections/[id]/page.tsx` ]
  ├── Fetches inspection metadata via Supabase client
  ├── Fetches associated defects list from `defects` table
  └── Renders side-by-side view: Raw PCB Image vs Annotated Defect View
          │
          ▼
[ QA Engineer Disagrees with AI Verdict (False Positive Detected) ]
  ├── Clicks "Override Verdict" Button
  ├── Changes Status from 'FAIL' to 'PASS'
  └── Enters mandatory audit note: "False positive: dust particle misidentified as spur"
          │
          ▼
[ `web/src/lib/api/inspections.ts`: updateInspection() ]
  ├── POST to `reviews` table (inspection_id, reviewer_id, original_status, reviewed_status, notes)
  └── PATCH `inspections` table: SET status = 'PASS'
          │
          ▼
[ Audit Log Created ] -> Timestamped action logged in `audit_logs` table
          │
          ▼
[ UI Updates ] -> Inspection badge updates to green 'PASS (Overridden)', audit banner displayed
```

---

### Flow 3: Critical Defect Alert & Email Notification Flow

```
[ Edge Station / Web Upload detects 'Critical' Defect (`open` or `short`) ]
          │
          ▼
[ Trigger Notification Logic ]
          │
          ▼
[ Query Active Administrators ]
  └── SELECT email, full_name FROM users WHERE role = 'admin' AND is_active = true
          │
          ▼
[ `backend/app/services/email.py` / `web/src/app/api/notifications/email/route.ts` ]
  ├── Construct HTML Alert Template:
  │     - Board Name / Inspection ID
  │     - Critical Defect Type (`short` / `open`)
  │     - Confidence Score & Detected Coordinates
  │     - Direct Link to Web Inspection Portal
  ├── Initialize Secure SMTP Connection (TLS / Port 587)
  ├── Authenticate via SMTP Credentials (Gmail App Password)
  └── Broadcast email to all active administrative recipients
          │
          ▼
[ Insert into `notifications` Table ]
  └── Record in-app notification entry for administrative dashboard bell icon
```

---

### Flow 4: Compliance Report Generation & Export Flow

```
[ Quality Manager opens `/reports` ]
          │
          ▼
[ Clicks "Generate Report" Button ]
          │
          ▼
[ Modal Form Submission: Select Date Range, Status Filters, Format (CSV / JSON) ]
          │
          ▼
[ `web/src/lib/api/reports.ts`: generateReport() ]
  ├── IF User Role is 'inspector':
  │     Query ONLY inspections WHERE user_id = current_user.id
  └── IF User Role is 'admin':
        Query ALL inspections across all users and production lines
          │
          ▼
[ Aggregate Statistics ]
  ├── Calculate total inspected boards, pass rate, fail rate
  ├── Compute defect frequency distribution across all 6 classes
  └── Format structured CSV string or JSON object
          │
          ▼
[ Persist Report Record ]
  └── INSERT INTO `reports` (user_id, title, format, summary_stats, created_at)
          │
          ▼
[ Client-Side Trigger ]
  └── Browser generates Blob URL -> Dispatches automatic download to user's local disk
```
"""
