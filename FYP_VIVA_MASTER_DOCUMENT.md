# PCB-Vision - Final Year Project (FYP) Viva Master Document & Technical Defense Manual

> **Project Name**: Automated Optical Inspection (AOI) System for Printed Circuit Board (PCB) Defect Localization and Quality Assurance  
> **Repository**: [https://github.com/usmanworld0/PCB-Fault-Detection-System](https://github.com/usmanworld0/PCB-Fault-Detection-System)  
> **System Architecture**: Multi-Platform Cloud-Synchronized AOI Suite (PySide6 Desktop Edge Workstation + Next.js 14 Web Portal + Flutter Mobile App + FastAPI Backend + Supabase PostgreSQL & Storage)  
> **Author / Maintainer**: Engineering FYP Candidate  
> **Target Audience**: FYP Viva Examiners (AI/ML Specialists, Software Engineers, Database Architects, Industrial Project Evaluators)

---

## Master Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. 30-Second Project Explanation](#2-30-second-project-explanation)
- [3. 2-Minute Project Explanation](#3-2-minute-project-explanation)
- [4. Problem Statement](#4-problem-statement)
- [5. Objectives](#5-objectives)
- [6. Complete Technology Stack](#6-complete-technology-stack)
- [7. Why Each Technology?](#7-why-each-technology)
- [8. Overall Architecture](#8-overall-architecture)
- [9. Complete System Flow](#9-complete-system-flow)
- [10. Web Application Architecture](#10-web-application-architecture)
- [11. Backend Architecture](#11-backend-architecture)
- [12. Desktop Architecture](#12-desktop-architecture)
- [13. Mobile Architecture](#13-mobile-architecture)
- [14. Authentication](#14-authentication)
- [15. JWT Deep Dive](#15-jwt-deep-dive)
- [16. Authorization / RBAC](#16-authorization--rbac)
- [17. API Architecture](#17-api-architecture)
- [18. Complete API Reference](#18-complete-api-reference)
- [19. Button-to-API Traceability](#19-button-to-api-traceability)
- [20. Button-to-Database Query Traceability](#20-button-to-database-query-traceability)
- [21. Database Architecture](#21-database-architecture)
- [22. Supabase Integration](#22-supabase-integration)
- [23. Storage Architecture](#23-storage-architecture)
- [24. Image Processing Pipeline](#24-image-processing-pipeline)
- [25. Computer Vision & Inference Pipeline](#25-computer-vision--inference-pipeline)
- [26. ML Models Deep Dive](#26-ml-models-deep-dive)
- [27. Model Evaluation & Benchmarking](#27-model-evaluation--benchmarking)
- [28. Defect Classes Deep Dive](#28-defect-classes-deep-dive)
- [29. Frontend Code Structure](#29-frontend-code-structure)
- [30. Backend Code Structure](#30-backend-code-structure)
- [31. Desktop Code Structure](#31-desktop-code-structure)
- [32. Mobile Code Structure](#32-mobile-code-structure)
- [33. Complete File Structure](#33-complete-file-structure)
- [34. File-to-File Dependency Map](#34-file-to-file-dependency-map)
- [35. Environment Variables Reference](#35-environment-variables-reference)
- [36. Security Architecture](#36-security-architecture)
- [37. Error Handling & Resilience](#37-error-handling--resilience)
- [38. Performance Optimization & Bottlenecks](#38-performance-optimization--bottlenecks)
- [39. Deployment Architecture](#39-deployment-architecture)
- [40. Development vs Production Environments](#40-development-vs-production-environments)
- [41. Architectural & Design Decisions](#41-architectural--design-decisions)
- [42. Technology Alternatives Considered](#42-technology-alternatives-considered)
- [43. System Trade-offs](#43-system-trade-offs)
- [44. Known Limitations](#44-known-limitations)
- [45. Future Improvements & Industrial Roadmap](#45-future-improvements--industrial-roadmap)
- [46. Basic Viva Questions (Q1 - Q50)](#46-basic-viva-questions)
- [47. Intermediate Viva Questions (Q51 - Q125)](#47-intermediate-viva-questions)
- [48. Advanced Viva Questions (Q126 - Q200)](#48-advanced-viva-questions)
- [49. Examiner Trap Questions](#49-examiner-trap-questions)
- [50. Rapid-Fire Viva (100 Questions)](#50-rapid-fire-viva)
- [51. 'Explain This Code' Master Breakdown](#51-explain-this-code-master-breakdown)
- [52. Individual Contribution & Authorship Defense](#52-individual-contribution--authorship-defense)
- [53. Live Troubleshooting & Debugging Scenarios](#53-live-troubleshooting--debugging-scenarios)
- [54. Industrial Case Studies & Production Scenarios](#54-industrial-case-studies--production-scenarios)
- [55. Final 1-Page Viva Cheat Sheet](#55-final-1-page-viva-cheat-sheet)
- [56. Must-Memorize Numbers, Metrics & Facts](#56-must-memorize-numbers-metrics--facts)
- [57. Comprehensive Technical Glossary](#57-comprehensive-technical-glossary)

---

## 1. Executive Summary

The **PCB Fault Detection System (PCB-Vision)** is an industrial-grade, multi-platform Automated Optical Inspection (AOI) software ecosystem engineered to identify, localize, categorize, and track microscopic manufacturing defects on Printed Circuit Boards in real-time.

Modern surface-mount technology (SMT) and PCB fabrication lines operate at micro-millimeter trace clearances. Manual human visual inspection suffers from high worker fatigue, variable subjective standards, and defect escape rates exceeding 15-20%. PCB-Vision replaces manual inspection with an offline-capable edge detection station integrated into a centralized cloud QA management and monitoring platform.

### Core System Attributes

1. **Edge-to-Cloud Distributed Architecture**:
   - **Industrial Edge Workstation (`ui/main_window.py`)**: Built with Python and PySide6 (Qt). Operates directly on the assembly line, interfacing with industrial camera feeds or directory watchers. Executes offline deep-learning inference using ONNX Runtime / OpenCV DNN (`cv2.dnn`), persisting inspection records locally in SQLite (`station.db`). When internet connectivity is available, an asynchronous background thread (`core/sync.py`) syncs metadata and board images to the cloud.
   - **Central QA Web Management Portal (`web/`)**: Built with Next.js 14 (React 18, TypeScript, Tailwind CSS). Provides plant managers and QA engineers with a secure, role-based dashboard for reviewing board inspections, overriding AI verdicts, generating CSV/JSON audit reports, tracking real-time line metrics, and managing users.
   - **Companion Mobile Monitoring App (`mobile/`)**: Built with Flutter & Dart (`supabase_flutter`). Allows quality supervisors and floor managers to view live inspection streams, receive defect alert push notifications, and monitor line yield from mobile devices.
   - **Backend API & Service Layer (`backend/app/`)**: Built with FastAPI (Python 3.10+, Uvicorn, Pydantic). Implements high-throughput asynchronous REST APIs, JWT authentication, automated SMTP email dispatch, model management, and database synchronization.
   - **Cloud Database & Object Storage (Supabase)**: Leverages hosted PostgreSQL 15 with Row Level Security (RLS), GoTrue identity management, and S3-compatible bucket storage (`pcb-vision`) for high-resolution raw and defect-annotated board imagery.

2. **Computer Vision & Deep Learning Engine**:
   - Deploys optimized one-stage and two-stage object detection architectures trained specifically on industrial PCB defect datasets.
   - Active production model: **YOLOv8s ONNX** achieving **87.6% mAP@0.5** with **10.1 ms** inference latency on standard hardware.
   - Lightweight edge model: **YOLOv8n ONNX** achieving **86.7% mAP@0.5** with **3.7 ms** inference latency.
   - Benchmark models: **Faster R-CNN ResNet-50** (**92.77% mAP@0.5**, 114.2 ms) and **RetinaNet ResNet-50** (**92.41% mAP@0.5**, 55.1 ms).
   - *(Architectural note: The redundant `yolov8m` model was removed from active deployment to minimize runtime memory footprint).*
   - **Multi-Defect Localization**: Detects 6 critical defect categories: `open` (open circuit), `short` (short circuit), `mousebite`, `spur`, `copper` (spurious copper), and `pinhole` (missing hole/void).
   - **Advanced CV Pipeline**: Incorporates letterbox aspect-ratio preserving resizing, dynamic high-resolution grid tiling (`TILE_TRIGGER = 1.5`, `TILE_OVERLAP = 0.2`) to detect micro-defects without downsampling artifacts, class-aware Non-Maximum Suppression (NMS), and automated rule-based severity scoring (`Critical`, `Moderate`, `Minor`).

---

## 2. 30-Second Project Explanation

> *"PCB-Vision is an industrial Automated Optical Inspection system that detects microscopic defects on printed circuit boards in real-time. We deployed an edge PySide6 desktop workstation running YOLOv8 ONNX models directly on the manufacturing floor at 10 milliseconds per board with zero cloud dependency. Inspection records and imagery are automatically synchronized to a Supabase cloud database, where QA managers use a Next.js 14 web portal to review inspections, generate compliance reports, and receive automated email alerts for critical defects like open circuits and shorts. A companion Flutter mobile app provides plant managers with real-time visibility into production line yield."*

---

## 3. 2-Minute Project Explanation

> *"In electronic manufacturing, printed circuit boards contain copper traces with clearances as narrow as 50 to 100 micrometers. A single microscopic short circuit or broken trace can render an entire multi-thousand-dollar electronic control unit useless. Historically, factories have relied on manual human visual inspection, which suffers from fatigue, high labor costs, and a defect escape rate of up to 20%.*
>
> *To solve this, we engineered PCB-Vision, a comprehensive, multi-platform AI quality assurance system.*
>
> *At the edge—right next to the SMT conveyor belt—we built a high-performance Python desktop application using PySide6. The workstation interfaces with the camera feed and executes deep-learning object detection locally using an optimized ONNX Runtime model. Because manufacturing plants experience network drops, the desktop application operates fully offline, writing inspection records to a local SQLite database (`station.db`).*
>
> *When connectivity is restored, an asynchronous worker automatically syncs records and uploads high-resolution images to a Supabase S3-compatible storage bucket and PostgreSQL database.*
>
> *On the cloud side, we built a modern enterprise web portal using Next.js 14 and TypeScript. It features role-based access control where operators can inspect boards and view only their own records, while administrators have system-wide visibility. Administrators can override false positives, generate and export multi-format CSV and JSON quality audit reports, and configure automated SMTP email notifications that immediately broadcast critical defect alerts to all registered admins.*
>
> *For management on the move, we built a Flutter mobile application that connects directly to the Supabase backend, enabling managers to review defect heatmaps and production yield in real-time.*
>
> *Our computer vision pipeline features high-resolution tiling to detect sub-millimeter defects without downsampling distortion, class-aware NMS, and an automated severity classifier that flags open circuits and shorts as Critical. Our YOLOv8s model achieves an 87.6% mAP50 at just 10.1 milliseconds per frame, outperforming human inspectors in speed, consistency, and traceability."*

### Explain My Project to a Non-Technical Examiner

> *"Think of a printed circuit board as a miniature highway system made of microscopic copper roads that carry electricity between computer chips. If there is a tiny scratch breaking a road (an open circuit), the device won't turn on. If two roads accidentally touch with stray copper (a short circuit), the device can catch fire or short-circuit.*
>
> *Right now, factories pay workers to sit with magnifying glasses for 8 hours a day staring at these boards. Naturally, people get tired, blink, and miss tiny defects.*
>
> *Our project replaces that tired human eye with an ultra-fast, intelligent robotic inspection station. A camera snaps a picture of the board on the conveyor belt. Our artificial intelligence scans the picture in one-hundredth of a second, puts red boxes around every defect, and rings an alarm if a dangerous defect is spotted. The factory manager can immediately see the bad board on their computer screen or smartphone, and an automated email is sent to quality engineers so defective boards never leave the factory."*

### Explain My Project to a Technical Examiner

> *"Architecturally, PCB-Vision is a distributed, offline-first Automated Optical Inspection (AOI) pipeline built to decouple low-latency edge inference from cloud-based QA reporting and device management.*
>
> *On the edge tier, the application is written in Python 3.10 with PySide6 for GUI threading. The inference engine leverages OpenCV's DNN module and ONNX Runtime to execute quantized/ONNX YOLOv8 architectures. To solve the problem of spatial downsampling on large high-density boards, we implemented an adaptive tiling algorithm: boards exceeding an aspect or resolution trigger are dynamically partitioned into overlapping tiles with a 20% stride overlap, inferred in batches, and re-mapped to original coordinate space using global offset projection and class-aware Non-Maximum Suppression (NMS).*
>
> *For operational reliability, the edge client adheres to an offline-first CQRS-like store pattern: inferences are committed synchronously to local SQLite (`station.db`), and an idempotent background `QThread` sync worker periodically pushes un-synced payloads to Supabase PostgREST endpoints and uploads raw/annotated images to Supabase Storage via signed HTTPS.*
>
> *The cloud tier utilizes Next.js 14 with App Router, server-rendered layouts, and client-side reactive components. Authentication is mediated via Supabase GoTrue with HS256 JWT tokens. We implemented strict Role-Based Access Control (RBAC): inspectors can view and generate reports exclusively for their assigned line inspections, while administrative users possess tenant-wide read/write capabilities, user lifecycle controls, and system setting adjustments. The FastAPI service layer provides complementary RESTful endpoints, Celery/SMTP asynchronous email dispatch, and automated model benchmarking across YOLOv8s, YOLOv8n, Faster R-CNN, and RetinaNet architectures."*

---

## 4. Problem Statement

### Industrial Context
The global electronics manufacturing industry produces billions of multi-layer PCBs annually for aerospace, automotive, medical, industrial automation, and consumer electronics. In high-reliability sectors (e.g., ISO 13485 medical devices, AS9100 aerospace, AEC-Q100 automotive electronics), the cost of a defective PCB escaping quality control follows the industrial **"Rule of Ten"**:
- Cost to detect and repair defect at bare-board fabrication: **$1.00**
- Cost to detect defect after component surface-mount soldering (SMT): **$10.00**
- Cost to detect defect during final system assembly: **$100.00**
- Cost of failure in the field (warranty recalls, product liability, catastrophic system failure): **$1,000.00 to $1,000,000+**

### Limitations of Traditional Solutions

1. **Manual Visual Inspection (MVI)**:
   - High Human Error: Studies indicate human defect detection accuracy degrades by 30-40% after just 45 minutes of continuous visual microscope work due to oculomotor fatigue.
   - Low Throughput: A trained technician requires between 30 and 120 seconds to thoroughly inspect a complex, high-density multi-trace bare board.
   - Zero Digital Auditability: Manual inspection results are traditionally logged on paper travelers or bulk batch sheets, eliminating granular defect coordinate tracking or historical yield analytics.

2. **Legacy Rule-Based Automated Optical Inspection (AOI)**:
   - Template Matching Sensitivity: Traditional AOI compares the test board against a golden reference image using pixel subtraction or normalized cross-correlation (NCC). Minute variations in lighting, PCB solder mask hue, or board rotation cause massive false alarm rates (often exceeding 60%), overwhelming floor engineers.
   - Rigid Rule Thresholding: Hardcoded geometric rules fail to generalize across varying trace widths, via diameters, and pad topologies.

3. **Existing Commercial Cloud-Only AI Tools**:
   - High Latency & Bandwidth Consumption: Uploading uncompressed 20-50 Megapixel industrial camera images to cloud servers creates network latency of several seconds per board, halting high-speed SMT lines running at 2-3 boards per second.
   - Line Downtime from Network Outages: If internet connectivity drops, cloud-dependent factory lines are forced to halt production.

### How PCB-Vision Addresses These Gaps
PCB-Vision provides an edge-native, deep-learning-driven AOI system that operates in under 15 milliseconds on the local machine without requiring internet access. It preserves digital auditability by queuing records locally and synchronizing them to the cloud for reporting, analytics, and instant alert dispatch.

---

## 5. Objectives

### Functional Objectives
1. **Real-Time Edge Defect Localization**: Execute object detection inference in under 15 ms per board using quantized ONNX models on local edge workstations.
2. **Multi-Class Defect Categorization**: Accurately classify and locate 6 industrial bare-board defect types (`open`, `short`, `mousebite`, `spur`, `copper`, `pinhole`).
3. **Adaptive Spatial Resolution Tiling**: Maintain sub-millimeter defect detection sensitivity on high-resolution boards without downsampling artifacts via dynamic overlapping grid tiling.
4. **Automated Severity Stratification**: Programmatically classify defect severity into `Critical`, `Moderate`, and `Minor` to prioritize urgent manufacturing intervention.
5. **Offline-First Data Integrity**: Persist all edge inspection records and defect bounding boxes in a local SQLite database (`station.db`) to ensure zero operational downtime during factory network disconnects.
6. **Automatic Cloud Synchronization**: Automatically upload inspection metadata and dual-state imagery (raw and annotated) to Supabase Cloud when connectivity is established.
7. **Role-Based Web Management Portal**: Provide a Next.js 14 administrative interface with strict RBAC ensuring inspectors access only their assigned inspections and reports, while admins maintain tenant-wide visibility and control.
8. **Automated Defect Alerting**: Broadcast instant SMTP emails to active administrators when critical defects (e.g., shorts, open circuits) are detected.
9. **Multi-Format Compliance Reporting**: Provide one-click generation and client-side browser export of inspection audit logs in structured CSV, JSON, and PDF formats.
10. **Companion Mobile Monitoring**: Deliver a responsive Flutter application for remote shop-floor yield tracking and alert visualization.

### Non-Functional Objectives
1. **Inference Latency**: Edge inference must complete in $\le 15$ ms on GPU and $\le 60$ ms on standard multi-core CPU.
2. **Detection Accuracy**: Achieve $\ge 85\%$ mAP@0.5 across all defect classes.
3. **Availability & Fault Tolerance**: Edge desktop workstation must maintain 100% operational availability during total cloud or network outages.
4. **Security & Data Privacy**: All remote API endpoints and database access must be guarded by cryptographic JWT tokens and PostgreSQL Row Level Security.
5. **Code Maintainability & Clean Architecture**: Strict separation of concerns between computer vision core (`core/`), desktop GUI (`ui/`), web frontend (`web/`), backend microservices (`backend/`), and mobile client (`mobile/`).


---

## 6. Complete Technology Stack

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


---

## 10. Web Application Architecture

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


---

## 14. Authentication

The system implements a dual-layer authentication model designed to support both modern serverless web workflows and decoupled microservice REST APIs.

```
                                  AUTHENTICATION FLOW
                                  
  ┌───────────────────────┐                  ┌──────────────────────────────────────┐
  │   User / Client UI    │                  │       Supabase GoTrue Service        │
  │   (Web or Mobile)     │                  │       (Managed Auth Provider)        │
  └──────────┬────────────┘                  └──────────────────┬───────────────────┘
             │                                                  │
             │ 1. POST /auth/v1/token (email, password)         │
             ├─────────────────────────────────────────────────►│
             │                                                  │
             │ 2. Validate Credentials & Issue GoTrue JWT       │
             │◄─────────────────────────────────────────────────┤
             │    { access_token, refresh_token, user: {...} }  │
             │                                                  │
             ▼                                                  ▼
  ┌───────────────────────┐                  ┌──────────────────────────────────────┐
  │ Client Local Storage  │                  │         FastAPI REST Backend         │
  │ `pcb_access_token`    │                  │         (`backend/app/auth.py`)      │
  └──────────┬────────────┘                  └──────────────────┬───────────────────┘
             │                                                  │
             │ 3. HTTP Request with Authorization Header        │
             │    `Bearer <JWT_TOKEN>`                          │
             ├─────────────────────────────────────────────────►│
             │                                                  │
             │                                                  │ 4. Verify Signature & Claims
             │                                                  │    - Check `exp` timestamp
             │                                                  │    - Extract `sub` & `role`
             │                                                  │    - Enforce RBAC permissions
             │                                                  │
             │ 5. Authorized HTTP JSON Response                 │
             │◄─────────────────────────────────────────────────┤
```

### 1. Web Portal Authentication Layer
- Managed via the official Supabase JavaScript SDK (`@supabase/supabase-js`) in `web/src/lib/api/auth.ts`.
- **Login**: `supabase.auth.signInWithPassword({ email, password })`. Upon successful authentication, Supabase issues an access token and refresh token.
- **Client-Side Token Persistence**: The access token is persisted in the browser's `localStorage` under the key `pcb_access_token` (configured in `web/src/lib/api/client.ts`).
- **Registration Flow**: `supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'inspector' } } })`. New users are registered with email verification enabled, requiring the user to confirm their email address before activation.
- **Forgot Password Flow**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://pcb-fault-detection-system.vercel.app/reset-password' })`. When the user clicks the reset link in their email, they are directed to the deployed production reset-password page rather than `localhost`.
- **De-authentication (Logout)**: `supabase.auth.signOut()`. Clears active sessions and purges the token from browser storage.

### 2. Backend REST API Authentication Layer
- Implemented in `backend/app/auth.py` using **PyJWT** and **FastAPI Security** (`HTTPBearer`).
- Provides fallback direct authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`).
- Password hashing is enforced via **Passlib** using the **Bcrypt** algorithm:
  ```python
  pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
  ```

---

## 15. JWT Deep Dive

Examiners frequently scrutinize JSON Web Tokens (JWT) to test a candidate's understanding of web security and stateless sessions.

### Precise Implementation Details from Source Code
- **Exact File Generating JWT**: `backend/app/auth.py`
- **Exact Function**: `create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str`
- **Underlying Cryptographic Library**: `PyJWT` (`import jwt`)
- **Signing Algorithm**: `HS256` (HMAC with SHA-256 symmetric signature)
- **Secret Key Source**: Loaded securely via Pydantic settings from `settings.jwt_secret` (environment variable `JWT_SECRET`).
- **Token Expiration Window**: Default configured to 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 60`), calculated as:
  ```python
  expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
  ```

### Anatomy of the Decoded Token Payload
The JWT token consists of three base64url-encoded parts separated by periods (`Header.Payload.Signature`):

```json
{
  "sub": "4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f",
  "email": "engineer@pcb-vision.com",
  "role": "admin",
  "iat": 1775440800,
  "exp": 1775444400
}
```

- `sub` (Subject): The unique UUID of the authenticated user in PostgreSQL.
- `email`: The verified email address of the account.
- `role`: The authorized Role-Based Access Control string (`admin` or `inspector`).
- `iat` (Issued At): Unix timestamp indicating when the token was generated.
- `exp` (Expiration): Unix timestamp after which the token is mathematically invalid.

### How the Backend Verifies the JWT
Verification occurs inside the FastAPI dependency function `get_current_user()` in `backend/app/auth.py`:
1. **Extraction**: The `HTTPBearer` security scheme extracts the raw token string from the inbound HTTP request header:
   ```http
   Authorization: Bearer <token_string>
   ```
2. **Cryptographic Validation**: `jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])` evaluates the digital signature against the server's private secret.
3. **Dual Verification Support**: To handle tokens issued directly by Supabase GoTrue, the verification logic in `auth.py` first attempts local HS256 validation with `settings.jwt_secret`. If the issuer is Supabase, it verifies against the Supabase JWT secret or fetches user details via the Supabase Admin API.
4. **Exception Handling**:
   - If the token signature is altered: raises `HTTPException(status_code=401, detail="Invalid token signature")`.
   - If `exp` has passed: raises `HTTPException(status_code=401, detail="Token has expired")`.
   - If `sub` is missing: raises `HTTPException(status_code=401, detail="Could not validate credentials")`.

### Storage Security Evaluation
- In the current web implementation, tokens are stored in the browser's `localStorage` under `pcb_access_token`.
- **Viva Defense Point**: While `localStorage` is vulnerable to Cross-Site Scripting (XSS) if untrusted third-party scripts are injected, it was selected here to facilitate direct client-side PostgREST calls to Supabase. In a future enterprise hardening phase, tokens can be migrated to `HttpOnly`, `Secure`, `SameSite=Strict` browser cookies to eliminate XSS token exfiltration risks.

---

## 16. Authorization / RBAC

The system enforces strict **Role-Based Access Control (RBAC)** to ensure industrial data isolation and governance.

```
                    ROLE-BASED ACCESS CONTROL MATRIX
                    
  Capability / Route              Inspector / Operator        Administrator
  ─────────────────────────────────────────────────────────────────────────────
  Execute Local Edge Inspection           YES                      YES
  View Own Line Inspections               YES                      YES
  View All Other Users' Inspections        NO                      YES
  Override AI Defect Verdict (QA)         YES                      YES
  Generate Personal Line Reports          YES                      YES
  Generate System-Wide Audit Reports       NO                      YES
  Export Inspection CSV / JSON            YES (Own data only)      YES (All data)
  View Deep Learning Model Metrics        YES                      YES
  Change Active AI Model Thresholds        NO                      YES
  Access User Administration Panel         NO (Redirects /403)     YES
  Deactivate Other Users                   NO                      YES
  Deactivate Self                          NO                      NO (Blocked)
  Receive Automated Critical Alert Emails  NO                      YES (All active admins)
```

### Implementation & Enforcement Across the Codebase

#### 1. Preventing Admin Self-Deactivation
In `backend/app/routers/users.py` and `web/src/lib/api/users.ts`:
To prevent catastrophic administrative lockout, the system enforces a strict programmatic check:
```python
if target_user_id == current_user.id and updated_data.is_active is False:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Administrators cannot deactivate their own account."
    )
```

#### 2. Isolation of Inspections by User Role
In `web/src/lib/api/inspections.ts` and `backend/app/routers/inspections.py`:
- When an `inspector` requests the inspection list:
  ```sql
  SELECT * FROM inspections WHERE user_id = :current_user_id ORDER BY created_at DESC;
  ```
- When an `admin` requests the inspection list:
  ```sql
  SELECT * FROM inspections ORDER BY created_at DESC;
  ```
This ensures operators can never view or tamper with inspections performed by other operators or lines.

#### 3. Isolation of Report Generation by User Role
In `web/src/lib/api/reports.ts`:
- Inspectors can generate reports summarizing only their own inspections.
- Administrators can generate plant-wide compliance reports aggregating records across all production lines and operators.

#### 4. Frontend Route Guards (`web/src/app/users/page.tsx`)
If an authenticated user with role `inspector` attempts to navigate directly to `/users`:
The `AuthContext` detects that `user.role !== 'admin'` and immediately redirects the browser to `/403` (Forbidden).

---

## 17. API Architecture

The system utilizes a modern, RESTful API architecture built on HTTP/1.1 and JSON.

### Core Architectural Principles
1. **Stateless Communication**: Every HTTP request is entirely self-contained, transmitting the authorization credential inside the `Authorization: Bearer <token>` header. The server maintains no server-side HTTP session state.
2. **Semantic HTTP Verbs**:
   - `GET`: Safe, idempotent retrieval of resource representations.
   - `POST`: Creation of new subordinate resources (inspections, reports, reviews, users).
   - `PATCH`: Partial updates to existing records (updating inspection status, deactivating user).
   - `DELETE`: Removal of resources (deleting inspection, removing user).
3. **Uniform Error Structure**: Errors return standard RFC 7807-compliant HTTP status codes paired with structured JSON payloads:
   ```json
   {
     "detail": "Descriptive error message explaining the failure."
   }
   ```
4. **Interactive OpenAPI Documentation**: The FastAPI backend automatically generates interactive Swagger UI documentation at `/docs` and ReDoc documentation at `/redoc`.
5. **CORS Configuration**: In `backend/app/main.py`, CORS middleware is configured to allow secure cross-origin requests from the Next.js web portal (`http://localhost:3000` and production Vercel domains):
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.allowed_origins,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```


---

## 18. Complete API Reference

Below is the exhaustive inventory of all REST endpoints exposed by the FastAPI backend (`backend/app/`) and the Next.js server route handlers (`web/src/app/api/`).

### Endpoint Inventory Table

| Method | Endpoint Route | Router / Implementation File | Auth / Role Required | Primary Request Payload / Query Params | Expected Success Response | HTTP Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | `backend/app/routers/auth.py` | None (Public) | `{ "email": "...", "password": "..." }` | `{ "access_token": "...", "token_type": "bearer", "user": {...} }` | `200 OK` |
| **POST** | `/api/auth/register` | `backend/app/routers/auth.py` | None (Public) | `{ "email": "...", "password": "...", "full_name": "..." }` | `{ "message": "Verification link dispatched", "user_id": "..." }` | `201 Created` |
| **GET** | `/api/auth/me` | `backend/app/routers/auth.py` | Bearer Token (Any) | None | `{ "id": "...", "email": "...", "role": "admin", "full_name": "..." }` | `200 OK` |
| **POST** | `/api/auth/logout` | `backend/app/routers/auth.py` | Bearer Token (Any) | None | `{ "message": "Successfully logged out" }` | `200 OK` |
| **GET** | `/api/inspections` | `backend/app/routers/inspections.py` | Bearer Token (Any) | `?status=FAIL&limit=50&offset=0` | `[ { "id": "...", "board_name": "...", "status": "FAIL", ... } ]` | `200 OK` |
| **POST** | `/api/inspections` | `backend/app/routers/inspections.py` | Bearer Token (Any) | Multipart Form (Image file, board_name, station_id) | `{ "id": "...", "status": "FAIL", "defect_count": 2, "defects": [...] }` | `201 Created` |
| **GET** | `/api/inspections/{id}`| `backend/app/routers/inspections.py` | Bearer Token (Any) | Path param: `id` (UUID) | `{ "id": "...", "raw_image_url": "...", "defects": [...] }` | `200 OK` |
| **PATCH**| `/api/inspections/{id}`| `backend/app/routers/inspections.py` | Bearer Token (Any) | `{ "status": "PASS", "notes": "..." }` | `{ "id": "...", "status": "PASS", "reviewed_at": "..." }` | `200 OK` |
| **DELETE**| `/api/inspections/{id}`| `backend/app/routers/inspections.py` | Bearer Token (`admin` only) | Path param: `id` (UUID) | `{ "message": "Inspection record deleted successfully" }` | `200 OK` |
| **POST** | `/api/inspections/detect`| `backend/app/routers/inspections.py`| Bearer Token (Any) | Multipart Form (Image file) | `{ "defects": [ { "type": "short", "bbox": [...] } ], "inference_ms": 10.2 }` | `200 OK` |
| **GET** | `/api/models` | `backend/app/routers/models_router.py`| Bearer Token (Any) | None | `[ { "name": "yolov8s", "mAP50": 87.6, "latency_ms": 10.1, "active": true } ]` | `200 OK` |
| **POST** | `/api/models/load` | `backend/app/routers/models_router.py`| Bearer Token (`admin` only) | `{ "model_name": "yolov8n" }` | `{ "message": "Model loaded successfully into memory" }` | `200 OK` |
| **GET** | `/api/models/metrics` | `backend/app/routers/models_router.py`| Bearer Token (Any) | None | `{ "precision": 0.89, "recall": 0.84, "f1_score": 0.864, ... }` | `200 OK` |
| **GET** | `/api/reports` | `backend/app/routers/reports.py` | Bearer Token (Any) | `?format=csv&limit=20` | `[ { "id": "...", "title": "...", "format": "csv", "summary": {...} } ]` | `200 OK` |
| **POST** | `/api/reports/generate`| `backend/app/routers/reports.py`| Bearer Token (Any) | `{ "title": "...", "start_date": "...", "format": "csv" }` | `{ "id": "...", "report_url": "...", "stats": {...} }` | `201 Created` |
| **GET** | `/api/reports/{id}/export`| `backend/app/routers/reports.py`| Bearer Token (Any) | Path param: `id` (UUID) | Binary Stream / Text CSV Content-Disposition attachment | `200 OK` |
| **GET** | `/api/notifications` | `backend/app/routers/notifications.py`| Bearer Token (Any) | `?unread_only=true` | `[ { "id": "...", "title": "Critical Defect Alert", "is_read": false } ]` | `200 OK` |
| **PATCH**| `/api/notifications/{id}/read`| `backend/app/routers/notifications.py`| Bearer Token (Any) | Path param: `id` (UUID) | `{ "id": "...", "is_read": true }` | `200 OK` |
| **POST** | `/api/notifications/email`| `web/src/app/api/notifications/email/route.ts`| Server-side Auth | `{ "inspection_id": "...", "defects": [...] }` | `{ "success": true, "recipients_count": 3 }` | `200 OK` |
| **POST** | `/api/reviews` | `backend/app/routers/reviews.py` | Bearer Token (Any) | `{ "inspection_id": "...", "reviewed_status": "PASS", "notes": "..." }` | `{ "id": "...", "inspection_id": "...", "created_at": "..." }` | `201 Created` |
| **GET** | `/api/stats/summary` | `backend/app/routers/stats.py` | Bearer Token (Any) | `?timeframe=7d` | `{ "total_inspected": 1420, "pass_rate": 93.4, "critical_defects": 12 }` | `200 OK` |
| **GET** | `/api/stats/defect-trends`| `backend/app/routers/stats.py`| Bearer Token (Any) | None | `{ "open": 24, "short": 18, "mousebite": 31, "spur": 12, ... }` | `200 OK` |
| **GET** | `/api/users` | `backend/app/routers/users.py` | Bearer Token (`admin` only) | `?role=inspector` | `[ { "id": "...", "email": "...", "role": "inspector", "is_active": true } ]` | `200 OK` |
| **PATCH**| `/api/users/{id}` | `backend/app/routers/users.py` | Bearer Token (`admin` only) | `{ "is_active": false }` | `{ "id": "...", "is_active": false, "updated_at": "..." }` | `200 OK` |
| **GET** | `/api/settings` | `backend/app/routers/settings.py`| Bearer Token (`admin` only) | None | `{ "confidence_threshold": 0.25, "iou_threshold": 0.45, ... }` | `200 OK` |
| **PATCH**| `/api/settings` | `backend/app/routers/settings.py`| Bearer Token (`admin` only) | `{ "confidence_threshold": 0.30 }` | `{ "confidence_threshold": 0.30, "updated_at": "..." }` | `200 OK` |
| **GET** | `/api/audit/logs` | `backend/app/routers/audit.py` | Bearer Token (`admin` only) | `?limit=100` | `[ { "id": "...", "user_id": "...", "action": "OVERRIDE_VERDICT", ... } ]` | `200 OK` |

---

## 19. Button-to-API Traceability Matrix

This table maps every primary button and user action across the web and desktop user interfaces directly through the complete software stack.

| Button / UI Action | Page / Window | Component / File | Handler Function | API Endpoint / Client Method | HTTP Method | Backend Router Function | Database Table Touched | Storage Action | ML / Core Operation | UI Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **"Sign In"** | `/login` | `web/src/app/login/page.tsx` | `handleSubmit()` | `supabase.auth.signInWithPassword()` | `POST` | Supabase GoTrue Auth | `auth.users` | None | None | JWT saved to `localStorage`, redirect to `/dashboard` |
| **"Send Reset Link"** | `/forgot-password` | `web/src/app/forgot-password/page.tsx` | `handleReset()` | `supabase.auth.resetPasswordForEmail()` | `POST` | Supabase GoTrue Auth | `auth.users` | None | None | Toast: "Password reset email sent", redirect to login |
| **"Update Password"** | `/reset-password` | `web/src/app/reset-password/page.tsx` | `handleUpdate()` | `supabase.auth.updateUser()` | `POST` | Supabase GoTrue Auth | `auth.users` | None | None | Toast: "Password updated successfully", redirect to login |
| **"Sign Out"** | Header / Nav | `web/src/components/layout/Header.tsx` | `handleSignOut()` | `supabase.auth.signOut()` | `POST` | Supabase GoTrue Auth | `auth.sessions` | None | None | Clear `pcb_access_token`, redirect to `/login` |
| **"Filter by Status"** | `/inspections` | `web/src/app/inspections/page.tsx` | `setFilter()` | `fetchInspections(filter)` | `GET` | PostgREST / `get_inspections()` | `inspections` | None | None | Inspections table re-renders with filtered records |
| **"View Details"** | `/inspections` | `web/src/app/inspections/page.tsx` | `router.push()` | Client Navigation (`/inspections/[id]`) | None | None | `inspections`, `defects` | Load signed URLs | None | Detail viewer renders raw and annotated images side-by-side |
| **"Override Verdict"** | `/inspections/[id]` | `web/src/app/inspections/[id]/page.tsx` | `handleOverride()` | `updateInspection()` | `PATCH` | `backend/routers/reviews.py` | `reviews`, `inspections` | None | None | Status badge toggles, audit record created, toast displayed |
| **"Delete Inspection"** | `/inspections/[id]` | `web/src/app/inspections/[id]/page.tsx` | `handleDelete()` | `deleteInspection(id)` | `DELETE` | `backend/routers/inspections.py` | `inspections`, `defects` | Delete raw & annotated blobs | None | Record removed, redirect back to `/inspections` |
| **"Generate Report"** | `/reports` | `web/src/app/reports/page.tsx` | `handleGenerateReport()` | `generateReport(payload)` | `POST` | `backend/routers/reports.py` | `reports`, `inspections` | None | Statistical aggregation | New report added to history table with download icon |
| **"Export CSV"** | `/reports` | `web/src/app/reports/page.tsx` | `handleDownloadCSV()` | `exportReportAsCSV(reportId)` | `GET` | `backend/routers/reports.py` | `reports` | None | CSV String Serialization | Browser downloads file: `PCB_Inspection_Report_<Date>.csv` |
| **"Toggle User Active"**| `/users` | `web/src/app/users/page.tsx` | `handleToggleActive()` | `updateUserStatus(id, active)` | `PATCH` | `backend/routers/users.py` | `users` | None | None | Badge switches to Active/Inactive; self-toggle blocked |
| **"Change User Role"** | `/users` | `web/src/app/users/page.tsx` | `handleChangeRole()` | `updateUserRole(id, role)` | `PATCH` | `backend/routers/users.py` | `users` | None | None | User's role updated; table reflects new privileges |
| **"Mark as Read"** | `/notifications` | `web/src/app/notifications/page.tsx` | `handleMarkRead()` | `markNotificationRead(id)` | `PATCH` | `backend/routers/notifications.py` | `notifications` | None | None | Notification badge counter decrements by 1 |
| **"Inspect Board"** | Desktop App | `ui/main_window.py` | `on_inspect_clicked()` | Local worker execution | Internal | None (Local execution) | `station.db` (local SQLite) | Queued for cloud upload | `core/detector.py`: ONNX inference + NMS + Tiling | Colored bounding boxes rendered on live canvas overlay |
| **"Sync Now"** | Desktop App | `ui/main_window.py` | `on_sync_clicked()` | `core/sync.py`: `run_sync()` | `POST` (HTTPS) | PostgREST / Storage S3 | `inspections`, `defects` | Upload images to `pcb-vision` bucket | None | Sync status badge updates from "Pending (N)" to "Synced" |

---

## 20. Button-to-Database Query Traceability

This section documents the precise database queries executed when key UI actions are triggered.

### 1. When User Clicks "Sign In"
- **UI Trigger**: `web/src/app/login/page.tsx` -> `handleSubmit()`
- **Executed Query (Supabase Auth)**:
  ```sql
  SELECT id, email, encrypted_password, email_confirmed_at, raw_user_meta_data
  FROM auth.users
  WHERE email = 'engineer@pcb-vision.com' AND deleted_at IS NULL;
  ```
- **Session Lookup (Public User Profile)**:
  ```sql
  SELECT id, email, full_name, role, is_active
  FROM public.users
  WHERE id = '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f';
  ```

---

### 2. When User Views "/inspections" List
- **UI Trigger**: `web/src/app/inspections/page.tsx` (Component Mount / Filter Change)
- **Executed Query if User is `inspector`**:
  ```sql
  SELECT id, board_name, status, defect_count, confidence, inference_time_ms, image_url, processed_image_url, created_at
  FROM public.inspections
  WHERE user_id = '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f'
  ORDER BY created_at DESC
  LIMIT 25 OFFSET 0;
  ```
- **Executed Query if User is `admin`**:
  ```sql
  SELECT i.id, i.board_name, i.status, i.defect_count, i.confidence, i.inference_time_ms, i.image_url, i.created_at, u.full_name as inspector_name
  FROM public.inspections i
  LEFT JOIN public.users u ON i.user_id = u.id
  ORDER BY i.created_at DESC
  LIMIT 25 OFFSET 0;
  ```

---

### 3. When User Clicks "Override Verdict" on `/inspections/[id]`
- **UI Trigger**: `web/src/app/inspections/[id]/page.tsx` -> `handleOverride()`
- **Executed Queries (Transaction)**:
  ```sql
  -- Step 1: Insert review record
  INSERT INTO public.reviews (
    id, inspection_id, reviewer_id, original_status, reviewed_status, notes, created_at
  ) VALUES (
    gen_random_uuid(), 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f',
    'FAIL', 'PASS', 'False positive: glare on copper pad misidentified as spur', NOW()
  );

  -- Step 2: Update the inspection status
  UPDATE public.inspections
  SET status = 'PASS', updated_at = NOW()
  WHERE id = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0';

  -- Step 3: Insert system audit trail
  INSERT INTO public.audit_logs (
    id, user_id, action, resource, details, timestamp
  ) VALUES (
    gen_random_uuid(), '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f', 'OVERRIDE_VERDICT',
    'inspection:a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    '{"old": "FAIL", "new": "PASS", "reason": "glare on copper pad"}', NOW()
  );
  ```

---

### 4. When User Clicks "Generate Report" on `/reports`
- **UI Trigger**: `web/src/app/reports/page.tsx` -> `handleGenerateReport()`
- **Executed Query (Statistical Aggregation)**:
  ```sql
  -- If Inspector:
  SELECT 
    COUNT(*) AS total_inspections,
    COUNT(CASE WHEN status = 'PASS' THEN 1 END) AS pass_count,
    COUNT(CASE WHEN status = 'FAIL' THEN 1 END) AS fail_count,
    ROUND((COUNT(CASE WHEN status = 'PASS' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) AS yield_percentage
  FROM public.inspections
  WHERE user_id = '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f'
    AND created_at >= '2026-10-01 00:00:00';

  -- Insert report entry
  INSERT INTO public.reports (
    id, user_id, title, format, summary_stats, created_at
  ) VALUES (
    gen_random_uuid(), '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f',
    'Shift Quality Report - Line 1', 'csv',
    '{"total": 120, "pass": 112, "fail": 8, "yield": 93.33}', NOW()
  );
  ```

---

### 5. When Desktop Application Syncs Completed Inspection
- **UI / Worker Trigger**: `core/sync.py` -> `SyncWorker.run()`
- **Executed Queries (PostgREST over HTTPS)**:
  ```sql
  -- Step 1: Insert inspection record
  INSERT INTO public.inspections (
    id, board_name, status, defect_count, confidence, inference_time_ms,
    image_url, processed_image_url, user_id, created_at
  ) VALUES (
    'b2c3d4e5-f6a7-8901-2345-6789abcdef01', 'PCB_REV2_SERIAL_8849', 'FAIL',
    2, 0.89, 10.4,
    'https://[ref].supabase.co/storage/v1/object/public/pcb-vision/raw/b2c3d4e5.jpg',
    'https://[ref].supabase.co/storage/v1/object/public/pcb-vision/annotated/b2c3d4e5.jpg',
    '4f1c9d2e-8b3a-4e2c-9a1f-3d5b7a9c1e0f', NOW()
  );

  -- Step 2: Insert individual defect records
  INSERT INTO public.defects (
    id, inspection_id, defect_type, confidence, x_min, y_min, x_max, y_max, severity
  ) VALUES
  (gen_random_uuid(), 'b2c3d4e5-f6a7-8901-2345-6789abcdef01', 'short', 0.92, 142, 318, 178, 345, 'Critical'),
  (gen_random_uuid(), 'b2c3d4e5-f6a7-8901-2345-6789abcdef01', 'mousebite', 0.86, 420, 510, 442, 532, 'Moderate');
  ```


---

## 21. Database Architecture

The centralized cloud database is powered by **PostgreSQL 15** hosted on Supabase, enforcing relational data integrity, foreign key constraints, cascading deletions, and ACID compliance.

```
                           ENTITY RELATIONSHIP DIAGRAM (ERD)
                           
  ┌─────────────────────────┐               ┌─────────────────────────┐
  │         users           │               │       audit_logs        │
  ├─────────────────────────┤               ├─────────────────────────┤
  │ PK id (UUID)            │◄──────┐       │ PK id (UUID)            │
  │    email (VARCHAR)      │       │       │ FK user_id (UUID)───────┼──┐
  │    role (VARCHAR)       │       │       │    action (VARCHAR)     │  │
  │    full_name (VARCHAR)  │       │       │    resource (VARCHAR)   │  │
  │    is_active (BOOLEAN)  │       │       │    details (JSONB)      │  │
  │    created_at (TIMESTMP)│       │       │    timestamp (TIMESTMP) │  │
  └───────────┬─────────────┘       │       └─────────────────────────┘  │
              │ 1                   │                                    │
              │                     │                                    │
              │ has many            │                                    │
              ▼ *                   │                                    │
  ┌─────────────────────────┐       │       ┌─────────────────────────┐  │
  │       inspections       │       │       │         reviews         │  │
  ├─────────────────────────┤       │       ├─────────────────────────┤  │
  │ PK id (UUID)            │       │       │ PK id (UUID)            │  │
  │ FK user_id (UUID)───────┼───────┘       │ FK inspection_id (UUID)─┼──┤
  │    board_name (VARCHAR) │◄──────────────┤ FK reviewer_id (UUID)───┼──┘
  │    status (VARCHAR)     │ 1             │    original_status (VAR)│
  │    defect_count (INT)   │               │    reviewed_status (VAR)│
  │    confidence (FLOAT)   │ has many      │    notes (TEXT)         │
  │    inference_ms (FLOAT) │               │    created_at (TIMESTMP)│
  │    image_url (TEXT)     │               └─────────────────────────┘
  │    proc_img_url (TEXT)  │
  │    created_at (TIMESTMP)│
  └───────────┬─────────────┘
              │ 1
              │
              │ has many (ON DELETE CASCADE)
              ▼ *
  ┌─────────────────────────┐       ┌─────────────────────────┐
  │         defects         │       │         reports         │
  ├─────────────────────────┤       ├─────────────────────────┤
  │ PK id (UUID)            │       │ PK id (UUID)            │
  │ FK inspection_id (UUID) │       │ FK user_id (UUID)───────┼──┐
  │    defect_type (VARCHAR)│       │    title (VARCHAR)      │  │
  │    confidence (FLOAT)   │       │    format (VARCHAR)     │  │
  │    x_min (INT)          │       │    summary_stats (JSONB)│  │
  │    y_min (INT)          │       │    created_at (TIMESTMP)│  │
  │    x_max (INT)          │       └─────────────────────────┘  │
  │    y_max (INT)          │                                    │
  │    severity (VARCHAR)   │       ┌─────────────────────────┐  │
  └─────────────────────────┘       │      notifications      │  │
                                    ├─────────────────────────┤  │
  ┌─────────────────────────┐       │ PK id (UUID)            │  │
  │     system_settings     │       │ FK user_id (UUID)───────┼──┘
  ├─────────────────────────┤       │    title (VARCHAR)      │
  │ PK key (VARCHAR)        │       │    message (TEXT)       │
  │    value (JSONB/TEXT)   │       │    type (VARCHAR)       │
  │    updated_at (TIMESTMP)│       │    is_read (BOOLEAN)    │
  └─────────────────────────┘       │    created_at (TIMESTMP)│
                                    └─────────────────────────┘
```

### Table Schema Definitions

#### 1. `public.users`
Stores user profile information linked to Supabase GoTrue identities.
- `id` (UUID, Primary Key): Mirrors `auth.users.id`.
- `email` (VARCHAR(255), Unique, Not Null): Verified corporate email.
- `role` (VARCHAR(50), Default `'inspector'`): Access level (`admin` or `inspector`).
- `full_name` (VARCHAR(255)): Display name of the operator or engineer.
- `is_active` (BOOLEAN, Default `TRUE`): Soft-delete / account lock flag.
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`).

#### 2. `public.inspections`
Primary registry for all automated board scans.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`): Unique scan ID.
- `user_id` (UUID, Foreign Key -> `users.id`, Nullable for anonymous workstation scans).
- `board_name` (VARCHAR(255), Not Null): Identifier or batch barcode for the PCB.
- `status` (VARCHAR(50), Not Null): Overall inspection verdict (`PASS` or `FAIL`).
- `defect_count` (INTEGER, Default 0): Total defects detected on board.
- `confidence` (FLOAT, Nullable): Mean confidence across detected defects.
- `inference_time_ms` (FLOAT, Not Null): Model forward pass execution time in milliseconds.
- `image_url` (TEXT, Not Null): Public/signed URL to the raw captured board image.
- `processed_image_url` (TEXT, Nullable): URL to the image annotated with defect bounding boxes.
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`).
- **Indexes**: `CREATE INDEX idx_inspections_user_id ON inspections(user_id);`, `CREATE INDEX idx_inspections_status ON inspections(status);`, `CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);`.

#### 3. `public.defects`
Granular bounding box coordinates and classification for every localized flaw.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`).
- `inspection_id` (UUID, Foreign Key -> `inspections.id` ON DELETE CASCADE, Not Null).
- `defect_type` (VARCHAR(50), Not Null): One of 6 classes (`open`, `short`, `mousebite`, `spur`, `copper`, `pinhole`).
- `confidence` (FLOAT, Not Null): Model confidence score ($0.0 \le c \le 1.0$).
- `x_min` (INTEGER, Not Null): Left coordinate on original image canvas.
- `y_min` (INTEGER, Not Null): Top coordinate on original image canvas.
- `x_max` (INTEGER, Not Null): Right coordinate on original image canvas.
- `y_max` (INTEGER, Not Null): Bottom coordinate on original image canvas.
- `severity` (VARCHAR(50), Not Null): Rule-based severity level (`Critical`, `Moderate`, `Minor`).
- **Indexes**: `CREATE INDEX idx_defects_inspection_id ON defects(inspection_id);`, `CREATE INDEX idx_defects_type ON defects(defect_type);`.

#### 4. `public.reviews`
Audit log of manual quality assurance overrides.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`).
- `inspection_id` (UUID, Foreign Key -> `inspections.id` ON DELETE CASCADE, Not Null).
- `reviewer_id` (UUID, Foreign Key -> `users.id`, Not Null).
- `original_status` (VARCHAR(50), Not Null): Status prior to override (`FAIL`).
- `reviewed_status` (VARCHAR(50), Not Null): Status post override (`PASS`).
- `notes` (TEXT, Not Null): Engineering justification explaining the override.
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`).

#### 5. `public.reports`
Registry of compiled shift, line, and compliance quality reports.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`).
- `user_id` (UUID, Foreign Key -> `users.id`, Not Null).
- `title` (VARCHAR(255), Not Null): Descriptive report title.
- `format` (VARCHAR(20), Not Null): File serialization type (`csv`, `json`, `pdf`).
- `summary_stats` (JSONB, Not Null): Snapshot of total scans, pass rate, and defect frequencies.
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`).

#### 6. `public.notifications`
In-app notification feed for alerts and administrative events.
- `id` (UUID, Primary Key, Default `gen_random_uuid()`).
- `user_id` (UUID, Foreign Key -> `users.id`, Not Null): Target recipient.
- `title` (VARCHAR(255), Not Null): Notification header.
- `message` (TEXT, Not Null): Detailed body text.
- `type` (VARCHAR(50), Default `'alert'`): Category (`alert`, `warning`, `info`).
- `is_read` (BOOLEAN, Default `FALSE`): Unread indicator flag.
- `created_at` (TIMESTAMP WITH TIME ZONE, Default `NOW()`).

---

## 22. Supabase Integration

Supabase serves as the managed cloud foundation, eliminating the operational overhead of running independent database clusters, object storage daemons, and authentication microservices.

### Architectural Services Provided by Supabase
1. **Managed PostgreSQL**: Hosted on AWS (ap-south-1 region), providing automatic connection pooling (pgbouncer on port 6543 / session mode on port 5432), automated point-in-time recovery, and SSL/TLS encryption in transit.
2. **GoTrue Identity Engine**: Handles cryptographically secure user signups, bcrypt password hashing, magic link dispatch, password reset workflows, and RFC 7519 JSON Web Token issuance.
3. **PostgREST HTTP Gateway**: Automatically maps PostgreSQL schemas to secure RESTful endpoints. When the Next.js web portal invokes `supabase.from('inspections').select('*')`, PostgREST converts this into an optimized parameterized SQL query, eliminating ORM latency.
4. **Row Level Security (RLS)**: Enforces database security directly inside the PostgreSQL kernel:
   ```sql
   -- Allow users to read only their own inspections unless they have the admin role
   CREATE POLICY "User isolation policy" ON public.inspections
   FOR SELECT USING (
     auth.uid() = user_id OR 
     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
   );
   ```

---

## 23. Storage Architecture

High-resolution industrial board imagery is stored in **Supabase Storage**, an S3-compatible cloud object storage service.

```
Supabase Storage Bucket: `pcb-vision`
├── raw/                           # Original uncompressed camera captures
│   ├── b2c3d4e5-f6a7.jpg          # Named deterministically using inspection UUID
│   └── c3d4e5f6-a7b8.jpg
├── annotated/                     # Post-inference imagery with visual defect overlays
│   ├── b2c3d4e5-f6a7.jpg          # Bounding boxes, class tags, confidence labels burned in
│   └── c3d4e5f6-a7b8.jpg
└── reports/                       # Persisted compliance reports
    └── shift_report_20261006.csv
```

### Dual-State Image Storage Strategy
Why store both raw and annotated images?
1. **Raw Images (`raw/`)**: Essential for training data continuous improvement (Active Learning). Raw images allow re-running newer model checkpoints or custom computer vision filters against historical production runs without visual artifacts.
2. **Annotated Images (`annotated/`)**: Essential for instantaneous web rendering. When a QA engineer opens `/inspections/[id]`, the annotated image loads instantly without requiring the browser or backend to recompute bounding box drawing operations.

---

## 24. Image Processing Pipeline

Before an image enters the deep learning neural network, it passes through an image pre-processing pipeline in `core/detector.py`.

```
Raw Camera Image (e.g., 3000 x 1800 px BGR)
                    │
                    ▼
       Aspect Ratio / Dimension Check
       Is Aspect Ratio > 1.5 or Resolution > 2000px?
                    │
         ┌──────────┴──────────┐
         │ YES                 │ NO
         ▼                     ▼
┌──────────────────┐  ┌──────────────────────────────────┐
│  Adaptive High-  │  │ Letterbox Preprocessing          │
│  Resolution      │  │  - Preserve exact aspect ratio   │
│  Grid Tiling     │  │  - Resize longer side to 640px   │
│  - 20% Overlap   │  │  - Grey pad (114, 114, 114)      │
│  - Batch Tiles   │  │  - Convert BGR to RGB            │
└────────┬─────────┘  │  - Normalize uint8 [0, 255] to   │
         │            │    float32 [0.0, 1.0]            │
         │            └────────────────┬─────────────────┘
         │                             │
         └──────────────┬──────────────┘
                        ▼
           Input Tensor: [1, 3, 640, 640]
```

### 1. Letterbox Preprocessing
Standard resizing directly to $640 	imes 640$ distorts rectangular circuit boards, stretching circular vias into ovals and distorting microscopic trace geometry.
- **Our Implementation**: The `letterbox()` algorithm in `core/detector.py` calculates the scaling ratio:
  $$r = \min\left(rac{640}{H}, rac{640}{W}ight)$$
- The image is scaled by $r$, and the remaining margins are filled with neutral grey padding (`rgb(114, 114, 114)`), preserving trace aspect ratios and geometric integrity.

### 2. High-Resolution Adaptive Grid Tiling
Industrial circuit boards often have dimensions of $3000 	imes 2000$ pixels or higher, while microscopic defects like pinholes or spurs may measure only $8 	imes 8$ pixels.
- **The Downsampling Problem**: If a $3000 	imes 2000$ image is downsampled directly to $640 	imes 640$, an $8 	imes 8$ defect shrinks to less than $1.7 	imes 1.7$ pixels, falling below the receptive field threshold of convolutional feature maps and causing false negatives.
- **Our Tiling Solution**:
  - `TILE_TRIGGER = 1.5`: When an image exceeds the aspect ratio threshold or minimum resolution limit, the adaptive tiling engine activates.
  - The image is sliced into overlapping sub-tiles with a `TILE_OVERLAP = 0.2` (20% overlap). The 20% overlap ensures that defects situated directly on tile boundaries are never sliced in half.
  - Each tile is inferred independently.
  - **Coordinate Remapping**: Detected bounding boxes on sub-tiles are projected back to the global coordinate space using the tile's horizontal and vertical offsets:
    $$x_{	ext{global}} = x_{	ext{tile}} + 	ext{offset}_x, \quad y_{	ext{global}} = y_{	ext{tile}} + 	ext{offset}_y$$
  - Global Class-Aware Non-Maximum Suppression (NMS) is applied to eliminate redundant overlapping detections in the tile seam zones.


---

## 25. Computer Vision & Inference Pipeline

The core inference engine (`core/detector.py`) executes an optimized, end-to-end computer vision pipeline from raw image ingestion to the final board pass/fail verdict.

```
====================================================================================================
                             INFERENCE PIPELINE ARCHITECTURE
====================================================================================================

 [ STAGE 1: INGESTION ]
   Raw PCB Image (Industrial Camera / File)
          │
          ▼
 [ STAGE 2: ADAPTIVE PRE-PROCESSING ]
   ├── Dimensions Analysis -> Dynamic Tiling if Aspect Ratio > 1.5
   ├── Letterbox Resize -> 640 x 640 px (aspect ratio preserved)
   ├── Color Space Conversion -> BGR to RGB
   └── Normalization -> Division by 255.0 to float32 [0.0, 1.0]
          │
          ▼
 [ STAGE 3: FORWARD PASS INFERENCE ]
   Input Tensor [1, 3, 640, 640]
          │
          ▼
   OpenCV DNN Engine (`cv2.dnn.readNetFromONNX`) / ONNX Runtime
   Model Weights: `models/yolov8s.onnx`
          │
          ▼
   Output Raw Predictions: Tensor [1, 10, 8400]
   (8400 candidate anchor boxes: 4 bbox coordinates [cx, cy, w, h] + 6 class probabilities)
          │
          ▼
 [ STAGE 4: POST-PROCESSING & FILTERING ]
   ├── Transpose & Reshape -> [8400, 10]
   ├── Confidence Thresholding -> Discard predictions where max(class_prob) < 0.25
   ├── Class-Aware Non-Maximum Suppression (NMS) -> `cv2.dnn.NMSBoxes()`
   │     - IoU Threshold: 0.45
   │     - Class Isolation: Multi-class offset projection ensures bounding boxes of different
   │       defect classes do not suppress each other
   └── Coordinate Remapping -> Un-pad & scale normalized coordinates back to original image size
          │
          ▼
 [ STAGE 5: SEVERITY CLASSIFICATION (`core/severity.py`) ]
   For each localized defect:
   ├── IF class in {'open', 'short'}:
   │     severity = 'Critical' if confidence >= 0.60 else 'Moderate'
   ├── IF class in {'mousebite', 'spur'}:
   │     severity = 'Moderate' if confidence >= 0.60 else 'Minor'
   └── IF class in {'copper', 'pinhole'}:
         severity = 'Moderate' if confidence >= 0.70 else 'Minor'
          │
          ▼
 [ STAGE 6: FINAL BOARD VERDICT ]
   ├── Total Defect Count = len(defects)
   ├── Overall Verdict = 'FAIL' if Total Defect Count > 0 else 'PASS'
   └── Persistence -> Commit to SQLite (`station.db`) and emit UI signals
====================================================================================================
```

### Class-Aware Non-Maximum Suppression (NMS)
In standard NMS, if two bounding boxes with different predicted classes overlap with an IoU exceeding 0.45, the box with lower confidence is eliminated.
- **The Defect Co-Occurrence Problem**: In PCB manufacturing, complex defects often appear together. For instance, a `mousebite` (edge notch) may co-occur directly adjacent to a `spur` or broken trace (`open`). Standard NMS would erroneously suppress one of these real defects.
- **Our Solution**: We implement class-aware NMS by adding a large spatial offset ($C 	imes 4096$) to each bounding box's coordinates based on its class ID $C$ before running `cv2.dnn.NMSBoxes()`. This ensures candidate boxes of different defect classes occupy distinct coordinate spaces, guaranteeing that NMS suppresses only duplicate detections of the *same* defect.

---

## 26. ML Models Deep Dive

The repository contains implementations and evaluation benchmarks for four distinct deep-learning object detection architectures:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Model Comparison Matrix                                   │
├────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬───────────┤
│ Architecture       │ Framework   │ mAP@0.5 (%) │ Latency(ms) │ Params (M)  │ Role      │
├────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼───────────┤
│ **YOLOv8s**        │ ONNX/PyTorch│ **87.60%**  │ **10.1 ms** │ 11.2 M      │ Primary   │
│ **YOLOv8n**        │ ONNX/PyTorch│ **86.70%**  │ **3.7 ms**  │ 3.2 M       │ Edge Light│
│ **Faster R-CNN**   │ PyTorch     │ **92.77%**  │ **114.2 ms**│ 41.5 M      │ Benchmark │
│ **RetinaNet**      │ PyTorch     │ **92.41%**  │ **55.1 ms** │ 34.0 M      │ Benchmark │
└────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴───────────┘
```

### 1. YOLOv8s (Small) — Primary Production Model
- **Why it is the Default**: Delivers the best balance between speed (10.1 ms $pprox$ 99 FPS) and accuracy (87.60% mAP50). It easily meets the real-time requirements of SMT conveyor lines moving at 2-3 boards per second while maintaining high localization accuracy on micro-defects.
- **Architecture**: Single-stage anchor-free detector with a modified CSPDarknet53 backbone, C2f (Cross-Stage Partial with 2 convolutions) feature aggregation blocks, and a decoupled head separating classification and bounding box regression.

### 2. YOLOv8n (Nano) — Ultra-Lightweight Edge Model
- **Role**: Engineered for constrained edge hardware (e.g., Raspberry Pi 4/5, low-power industrial IPCs lacking dedicated GPUs).
- **Attributes**: Minimal 3.2M parameter footprint, 3.7 ms forward pass, retaining an impressive 86.70% mAP50.

### 3. Faster R-CNN (ResNet-50-FPN) — Academic Benchmark
- **Role**: High-precision reference model.
- **Attributes**: Two-stage detector utilizing a Region Proposal Network (RPN) and RoI Align. Achieves the highest mAP50 (92.77%), but its 114.2 ms latency (less than 9 FPS) causes conveyor belt bottlenecks, making it unsuitable for real-time edge deployment.

### 4. RetinaNet (ResNet-50-FPN) — Dense Detector Benchmark
- **Role**: Dense single-stage reference model utilizing **Focal Loss** to handle extreme class imbalance between foreground defects and background copper ground planes.
- **Attributes**: 92.41% mAP50 at 55.1 ms latency.

### Architectural Note: Removal of YOLOv8m
*During recent codebase optimization, `yolov8m` (medium) was formally deprecated and removed from active model registries. YOLOv8m provided only a marginal accuracy gain over YOLOv8s (+0.8% mAP) while doubling parameter count (25.9M) and doubling inference latency (22 ms). Removing YOLOv8m streamlined deployment containers and reduced runtime memory consumption.*

---

## 27. Model Evaluation & Benchmarking

### Core Evaluation Metrics

1. **Intersection over Union (IoU)**:
   $$	ext{IoU} = rac{	ext{Area of Overlap}}{	ext{Area of Union}} = rac{B_p \cap B_{gt}}{B_p \cup B_{gt}}$$
   Measures the spatial overlap between predicted bounding box $B_p$ and ground truth annotation $B_{gt}$. An IoU threshold of 0.5 is the industrial standard for evaluating true positives.

2. **Precision & Recall**:
   $$	ext{Precision} = rac{	ext{TP}}{	ext{TP} + 	ext{FP}}, \quad 	ext{Recall} = rac{	ext{TP}}{	ext{TP} + 	ext{FN}}$$
   - **Precision**: Percentage of detected defects that are actual defects (low precision = high false alarms).
   - **Recall**: Percentage of actual defects successfully detected (low recall = escaped defects entering customer devices).

3. **Mean Average Precision (mAP@0.5)**:
   The mean area under the Precision-Recall curve across all 6 defect classes evaluated at an IoU threshold of 0.5:
   $$	ext{mAP} = rac{1}{N} \sum_{k=1}^N 	ext{AP}_k$$

### Industrial Confusion Matrix Analysis
In industrial PCB manufacturing, the cost of errors is asymmetric:

```
                      Industrial Cost Matrix
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Metric                  │ Actual Defect (Positive)│ Actual Good (Negative)  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ **Predicted Defect**    │ **True Positive (TP)**  │ **False Positive (FP)** │
│                         │ Correctly rejected      │ Unnecessary manual QA   │
│                         │ board. Cost: $0.        │ reinspection. Cost: $0.5│
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ **Predicted Good**      │ **False Negative (FN)** │ **True Negative (TN)**  │
│                         │ CATASTROPHIC ESCAPE!    │ Correctly passed board. │
│                         │ Field failure: $1000+   │ Cost: $0.               │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

- **Why We Prioritize Recall in Industrial AOI**: A False Positive costs a quality engineer 5 seconds to glance at the board and confirm it's clean. A False Negative (an undetected open circuit or short) escapes to an automotive or medical customer, causing catastrophic field failure and warranty liabilities. Our model confidence threshold is calibrated to 0.25 to maximize recall and eliminate defect escapes.

---

## 28. Defect Classes Deep Dive

The system is trained and calibrated to localize and classify the six fundamental bare-board manufacturing defect classes defined by the IPC-A-600 standard.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Defect Classes Taxonomy                                   │
├─────────────┬──────────────┬───────────────────────────────┬───────────────────────────┤
│ Defect Class│ Severity     │ Physical Mechanism / Cause    │ Electrical Impact         │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **open**    │ **Critical** │ Complete break in copper trace│ Total circuit failure,    │
│             │              │ from dust, scratch, over-etch │ open loop, dead device    │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **short**   │ **Critical** │ Unintended copper bridge      │ Power-to-ground short,    │
│             │              │ between traces from under-etch│ burned IC, fire hazard    │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│**mousebite**│ **Moderate** │ Irregular bite-like notch at  │ Increased current density,│
│             │              │ trace edge from rough breakout│ localized trace burnout   │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **spur**    │ **Moderate** │ Pointed copper protrusion     │ High electric field,      │
│             │              │ extending outward from trace  │ arc-over, potential short │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **copper**  │ **Moderate** │ Isolated stray copper flake   │ High risk of shorting if  │
│             │              │ or residual un-etched island  │ solder bridges during SMT │
├─────────────┼──────────────┼───────────────────────────────┼───────────────────────────┤
│ **pinhole** │ **Minor**    │ Microscopic circular void in  │ High resistance via,      │
│             │              │ copper ground plane or via    │ cracked barrel in thermal │
└─────────────┴──────────────┴───────────────────────────────┴───────────────────────────┘
```

### Detailed Fabrication Root Causes

1. **Open Circuit (`open`)**:
   - **Root Cause**: Airborne airborne dust particles landing on photoresist before UV exposure, deep physical scratches from mechanical handling, or over-etching in the acid cupric chloride bath.
   - **Visual Profile**: Discontinuous copper line with clear substrate exposed between trace endpoints.

2. **Short Circuit (`short`)**:
   - **Root Cause**: Contaminated developer chemistry leaving residual un-polymerized photoresist, inadequate chemical etching time, or mechanical copper burrs dragged across traces.
   - **Visual Profile**: Abnormal copper bridge connecting two traces that should maintain dielectric clearance.

3. **Mousebite (`mousebite`)**:
   - **Root Cause**: Excessive router feed rate during panel break-away de-paneling, or air bubbles trapped under dry film resist during lamination.
   - **Visual Profile**: Concave indentation into the sidewall of a conductor trace.

4. **Spur (`spur`)**:
   - **Root Cause**: Pinhole defects in the photoresist artwork film, allowing UV light bleed that polymerizes unwanted copper spurs extending out from traces.
   - **Visual Profile**: Pointed triangular or horn-like protrusion extending into trace isolation channels.

5. **Spurious Copper (`copper`)**:
   - **Root Cause**: Incomplete etching in low-fluidity stagnant zones of the spray etching chamber, or detached resist flakes redepositing onto the board surface.
   - **Visual Profile**: Isolated islands of conductor metal sitting on bare dielectric laminate.

6. **Pinhole (`pinhole` / `missing_hole`)**:
   - **Root Cause**: Minute gas bubbles trapped during copper electroplating baths, or drilling anomalies resulting in missed hole drilling operations.
   - **Visual Profile**: Microscopic circular void exposing substrate laminate inside a solid copper ground plane or via pad.


---

## 29. Frontend Code Structure

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


---

## 35. Environment Variables Reference

Below is the exhaustive inventory of all environment variables utilized across the codebase:

### Web Portal (`web/.env.local`)
| Variable Name | Required? | Example / Default Value | Purpose & Architectural Context |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://[ref].supabase.co` | Public HTTPS endpoint for the Supabase project instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `eyJhbGciOiJIUzI1Ni...` | Public anonymous key for client-side PostgREST and Auth calls |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Base URL pointing to the FastAPI backend REST microservice |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | Outbound mail server hostname for server-side alert dispatch |
| `SMTP_PORT` | Yes | `587` | Port for TLS authenticated SMTP communication |
| `SMTP_USER` | Yes | `world.usman.business@gmail.com` | Authenticated email sender account |
| `SMTP_PASSWORD` | Yes | *(16-character App Password)* | Secure Gmail App Password (never use raw account password) |

### Backend Service (`backend/.env`)
| Variable Name | Required? | Example / Default Value | Purpose & Architectural Context |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `postgresql://postgres:[pw]@...:5432/postgres` | PostgreSQL connection URI for SQLAlchemy ORM engine |
| `JWT_SECRET` | Yes | `super-secret-hex-key-minimum-32-chars` | Secret key used to cryptographically sign and verify HS256 JWTs |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Lifespan of issued JSON Web Tokens before requiring refresh |
| `SUPABASE_URL` | Yes | `https://[ref].supabase.co` | Server-side Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbGciOiJIUzI1Ni...` | Privileged master service key for administrative database bypass |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,https://...` | Comma-separated list of permitted origins for CORS middleware |
| `ACTIVE_MODEL_PATH` | No | `models/yolov8s.onnx` | Relative path to the default deep learning weights file |

### Edge Desktop Station (`.env` or Config)
| Variable Name | Required? | Example / Default Value | Purpose & Architectural Context |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | Yes | `https://[ref].supabase.co` | Cloud target for background synchronization |
| `SUPABASE_ANON_KEY` | Yes | `eyJhbGciOiJIUzI1Ni...` | Anonymous API key used by `core/sync.py` to push records |
| `LOCAL_DB_PATH` | No | `station.db` | Relative path to the local SQLite database file |
| `CONFIDENCE_THRESHOLD` | No | `0.25` | Minimum detection confidence score for bounding boxes |
| `IOU_THRESHOLD` | No | `0.45` | Intersection-over-Union threshold for Non-Maximum Suppression |

---

## 36. Security Architecture

1. **Authentication & Cryptographic Integrity**:
   - Industry-standard **Bcrypt** password hashing with an adaptive cryptographic work factor protects credentials against dictionary and rainbow-table attacks.
   - Stateless **JSON Web Tokens (JWT)** signed via **HS256** guarantee payload integrity. Tampering with claims (such as altering `role: "inspector"` to `"admin"`) invalidates the signature and triggers an immediate `401 Unauthorized`.
2. **Role-Based Access Control (RBAC) Enforcement**:
   - Enforced across three separate layers: UI navigation guards, FastAPI endpoint dependencies (`Depends(require_role("admin"))`), and database queries.
   - Self-deactivation prevention: Administrators cannot deactivate their own accounts, eliminating accidental tenant lockout.
3. **SQL Injection Prevention**:
   - The web client queries the database via **PostgREST**, which uses parameterized SQL statements internally.
   - The FastAPI backend accesses PostgreSQL via **SQLAlchemy ORM** and parameterized queries, completely neutralizing SQL injection vectors.
4. **Cross-Origin Resource Sharing (CORS)**:
   - Configured via FastAPI's `CORSMiddleware` to whitelist only authorized frontend domains, preventing unauthorized cross-origin API abuse.
5. **Secrets Management**:
   - All sensitive credentials (SMTP app passwords, JWT secrets, Supabase service keys) are isolated inside `.env` files excluded from version control via `.gitignore`.

---

## 37. Error Handling & Resilience

### 1. Edge Desktop Offline Resilience
- **Failure Mode**: Factory Wi-Fi or Ethernet cable disconnects during production.
- **System Response**:
  - The detection loop in `ui/main_window.py` never makes synchronous cloud calls.
  - Inferences are committed locally to SQLite (`station.db`) with `sync_status = 'pending'`.
  - The background `SyncWorker` thread (`core/sync.py`) catches network connection errors, logs the retry interval, and resumes data synchronization automatically once network connectivity is restored.

### 2. Backend REST API Resilience
- **Input Validation**: FastAPI automatically validates inbound JSON requests using Pydantic schemas, returning structured `422 Unprocessable Entity` payloads with precise field-level diagnostics.
- **Graceful Error Translation**: Database constraint violations and unexpected exceptions are caught and mapped to standard HTTP exceptions (`400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).

### 3. Web Portal Resilience
- **Toast Notifications**: User actions provide immediate visual feedback (success confirmations or actionable error messages).
- **Graceful API Fallbacks**: The web portal implements a hybrid data layer: if the FastAPI backend is temporarily unreachable, read-only queries seamlessly fall back to direct Supabase PostgREST queries.

---

## 38. Performance Optimization & Bottlenecks

### 1. Real-Time Edge Inference Optimization
- **Problem**: Running raw PyTorch models on CPU introduces 150-250 ms latency per frame, causing conveyor line bottlenecks.
- **Solution**: We convert trained models to the **ONNX** format and execute them via **OpenCV DNN** (`cv2.dnn.readNetFromONNX`). OpenCV DNN utilizes optimized C++ AVX2 and SIMD instructions, cutting YOLOv8s inference latency down to **10.1 ms** (a 15x speedup over unoptimized Python frameworks).

### 2. High-Resolution Board Tiling Optimization
- **Trade-off**: Slicing an image into 4 sub-tiles increases computation time by approximately 3.5x.
- **Optimization**: The adaptive tiling engine uses a dynamic trigger (`TILE_TRIGGER = 1.5`). Standard square boards or low-resolution images bypass tiling entirely and execute via single-pass letterbox inference.

### 3. Database Connection Pooling
- Supabase provides **Supabase Pooler** (powered by PgBouncer) operating on port 6543 in transaction pooling mode. This prevents PostgreSQL process starvation under high concurrent read loads from multiple web and mobile clients.

---

## 39. Deployment Architecture

The complete system is engineered for distributed hybrid deployment:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Deployment Topography                             │
├───────────────────┬───────────────────────────┬─────────────────────────────┤
│ Component         │ Target Infrastructure     │ Hosting & Runtime Model     │
├───────────────────┼───────────────────────────┼─────────────────────────────┤
│ **Web Portal**    │ **Vercel**                │ Serverless Edge CDN         │
│                   │                           │ (Node.js 18+ App Router)    │
├───────────────────┼───────────────────────────┼─────────────────────────────┤
│ **Backend API**   │ **Railway / Render**      │ Docker Container            │
│                   │                           │ (Uvicorn ASGI, Python 3.10) │
├───────────────────┼───────────────────────────┼─────────────────────────────┤
│ **Database & S3** │ **Supabase Cloud (AWS)**  │ Managed PostgreSQL 15 &     │
│                   │                           │ S3-compatible Object Storage│
├───────────────────┼───────────────────────────┼─────────────────────────────┤
│ **Desktop App**   │ **Industrial Workstation**│ Native Windows/Linux Binary │
│                   │                           │ (PyInstaller standalone)    │
├───────────────────┼───────────────────────────┼─────────────────────────────┤
│ **Mobile App**    │ **iOS & Android**         │ Native ARM compiled APK /   │
│                   │                           │ TestFlight Bundle           │
└───────────────────┴───────────────────────────┴─────────────────────────────┘
```

---

## 40. Development vs Production Environments

| Characteristic | Local Development Environment | Production Cloud Deployment |
| :--- | :--- | :--- |
| **Web Host** | `localhost:3000` (Next.js Dev Server) | `https://pcb-fault-detection-system.vercel.app` |
| **Backend Host** | `localhost:8000` (Uvicorn `--reload`) | Containerized ASGI behind reverse proxy |
| **Database** | Supabase Cloud dev branch or local Postgres | Production Supabase instance with connection pooler |
| **Desktop DB** | Local SQLite (`station.db` in repo directory) | SQLite in `%APPDATA%/PCBVision/station.db` |
| **Password Reset** | Historically defaulted to `localhost:3000` | Configured redirect: `https://...vercel.app/reset-password`|
| **CORS Policy** | Permissive (`*` or `localhost:*`) | Strict origin whitelist (production domain only) |
| **Model Weights** | Local disk file paths (`models/*.onnx`) | Packaged inside desktop binary or fetched on init |

---

## 41. Architectural & Design Decisions

1. **Why Decouple the Edge Desktop from the Cloud Web App?**  
   Manufacturing environments cannot tolerate cloud downtime. Decoupling edge inference (PySide6 + ONNX) from cloud management (Next.js + Supabase) ensures production lines run continuously even during internet outages.
2. **Why Use an Offline-First SQLite Queue (`station.db`) on the Edge?**  
   If the edge workstation uploaded records synchronously, network latency spikes would block the camera capture thread. Local SQLite persistence ensures sub-millisecond write times with zero impact on inspection throughput.
3. **Why Use ONNX Format for Edge Deployment?**  
   PyTorch has a massive disk and memory footprint (~2GB install) and runs through Python bytecode. ONNX provides a streamlined runtime representation executed via optimized C++ backends (`cv2.dnn`), reducing runtime memory to under 150MB.

---

## 42. Technology Alternatives Considered

| Component | Chosen Technology | Evaluated Alternatives | Why Alternatives Were Not Chosen |
| :--- | :--- | :--- | :--- |
| **Object Detection** | YOLOv8s | Faster R-CNN, SSD, YOLOv5 | Faster R-CNN is too slow (114ms); YOLOv5 has inferior anchor-based heads |
| **Desktop GUI** | PySide6 | Electron, Tkinter, PyQt5 | Electron has high RAM overhead; Tkinter is outdated; PyQt5 has GPL restrictions |
| **Web Framework**| Next.js 14 | Vite React SPA, Angular | Vite lacks built-in server route handlers and SSR optimizations |
| **Backend API** | FastAPI | Flask, Django, NestJS | Flask is synchronous; Django is heavy; NestJS cannot natively execute Python ML |
| **Database** | PostgreSQL / Supabase | MongoDB, Firebase | Document NoSQL databases lack relational integrity and SQL aggregations |

---

## 43. System Trade-offs

1. **Inference Latency vs. Detection Accuracy**:
   - *Choice*: We selected YOLOv8s (87.60% mAP, 10.1 ms) over Faster R-CNN (92.77% mAP, 114.2 ms).
   - *Trade-off*: We accepted a 5.17% lower mAP to achieve an 11x throughput increase, which is essential for real-time assembly line speeds.
2. **Single-Pass Inference vs. High-Resolution Tiling**:
   - *Choice*: Adaptive tiling activates only for large boards.
   - *Trade-off*: Slicing boards increases compute time for high-resolution images, but guarantees sub-millimeter micro-defects are not lost to downsampling artifacts.
3. **Client `localStorage` vs. `HttpOnly` Cookies**:
   - *Choice*: JWT tokens are persisted in `localStorage` for simplified Supabase SDK client usage.
   - *Trade-off*: `localStorage` is vulnerable to XSS if malicious scripts are injected, whereas `HttpOnly` cookies provide superior XSS immunity but complicate direct client-side PostgREST calls.

---

## 44. Known Limitations

1. **Lighting & Illumination Sensitivity**: Deep learning models are sensitive to extreme specular glare on exposed shiny copper pads. Diffuse industrial dome lighting is recommended.
2. **Defect Dataset Imbalance**: Severe defects like `pinhole` and `spur` have lower occurrence frequencies in raw fabrication runs than `open` circuits, requiring synthetic augmentation.
3. **Panelized Board Layouts**: The current detection pipeline is calibrated for single bare-board units. Inspecting large multi-board panel arrays requires pre-segmenting boards before inference.

---

## 45. Future Improvements & Industrial Roadmap

1. **Hardware Acceleration via Edge TPUs**: Compile YOLOv8s models to INT8 quantized formats for deployment on Google Coral Edge TPUs or NVIDIA Jetson Orin modules, cutting edge power consumption below 15 Watts.
2. **Automated Active Learning Pipeline**: When a QA engineer overrides an AI verdict on the web portal, the raw board image and corrected annotations should automatically be queued for the next scheduled model fine-tuning run.
3. **CAD / Gerber Layer Reference Comparison**: Combine AI object detection with automated Gerber (RS-274X) vector file alignment to cross-reference detected traces against the original electrical layout.


---

## 46. Basic Viva Questions

### Q1: What is the main objective of this Final Year Project?
**Answer**: To engineer a multi-platform, cloud-synchronized Automated Optical Inspection (AOI) system that detects, localizes, and classifies microscopic manufacturing defects on printed circuit boards in real-time.

### Q2: Why is PCB fault detection necessary in industry?
**Answer**: Manual human inspection is slow, subjective, and prone to fatigue. Undetected micro-defects (like broken traces or shorts) cause expensive field failures, product recalls, and safety hazards in aerospace, medical, and automotive electronics.

### Q3: What programming languages did you use in this project?
**Answer**: Python (for computer vision, deep learning inference, PySide6 desktop GUI, and FastAPI backend), TypeScript/JavaScript (for the Next.js 14 web portal), and Dart (for the Flutter mobile application).

### Q4: Which deep learning model is currently the primary detector in production?
**Answer**: YOLOv8s in ONNX format, which achieves an 87.60% mAP@0.5 with a 10.1 millisecond inference latency per board.

### Q5: How many defect classes does the system detect?
**Answer**: Six classes: Open Circuit (`open`), Short Circuit (`short`), Mousebite (`mousebite`), Spur (`spur`), Spurious Copper (`copper`), and Pinhole (`pinhole`).

### Q6: What is the difference between an open circuit and a short circuit?
**Answer**: An open circuit is a break or gap in a conductive copper trace preventing electrical current flow. A short circuit is an unintended conductive copper connection bridging two adjacent traces.

### Q7: What desktop GUI framework did you select and why?
**Answer**: PySide6 (Qt for Python). It provides native operating system rendering, multi-threaded worker pipelines (`QThread`) that prevent UI freezing during AI inference, and flexible LGPL licensing.

### Q8: What web framework did you use for the management portal?
**Answer**: Next.js 14 with the App Router, React 18, TypeScript, and Tailwind CSS.

### Q9: What database is used in the cloud and what is used on the edge desktop?
**Answer**: In the cloud, PostgreSQL 15 hosted on Supabase. On the edge desktop, a local SQLite database (`station.db`) to enable offline-first operation.

### Q10: Where are high-resolution board images stored?
**Answer**: In Supabase Storage, an S3-compatible cloud object storage service, organized into `raw/`, `annotated/`, and `reports/` directories within the `pcb-vision` bucket.

### Q11: What is JWT?
**Answer**: JSON Web Token. A compact, URL-safe standard (RFC 7519) for transmitting claims securely between a client and server as a signed JSON object.

### Q12: Which algorithm signs your JWT tokens in the backend?
**Answer**: HMAC SHA-256 (`HS256`), signed using a secret key loaded from environment variables (`JWT_SECRET`).

### Q13: What roles exist in your Role-Based Access Control (RBAC)?
**Answer**: Two roles: `admin` (administrative access to all users, inspections, settings, and reports) and `inspector` (operator access limited to running inspections and viewing their own data).

### Q14: Can an administrator deactivate their own account?
**Answer**: No. The system programmatically blocks administrators from deactivating themselves to prevent accidental administrative lockout.

### Q15: What is the input resolution expected by your YOLOv8 model?
**Answer**: $640 	imes 640$ pixels with 3 RGB color channels (`[1, 3, 640, 640]`).

### Q16: What is letterboxing in computer vision?
**Answer**: Resizing an image while preserving its original aspect ratio, filling the remaining margins with a neutral solid color (grey padding `114, 114, 114`) to prevent geometric distortion.

### Q17: What is Non-Maximum Suppression (NMS)?
**Answer**: A post-processing technique that filters out redundant, overlapping candidate bounding boxes, retaining only the single bounding box with the highest confidence score for each detected object.

### Q18: What IoU threshold is used for NMS in your system?
**Answer**: An IoU threshold of 0.45, paired with a confidence threshold of 0.25.

### Q19: What does mAP stand for?
**Answer**: Mean Average Precision. It is the mean of Average Precision (AP) scores calculated across all evaluated object detection classes.

### Q20: What is the difference between mAP@0.5 and mAP@0.5:0.95?
**Answer**: mAP@0.5 calculates average precision at a fixed IoU overlap threshold of 0.50. mAP@0.5:0.95 averages precision across multiple IoU thresholds from 0.50 to 0.95 in steps of 0.05, providing a stricter measure of bounding box localization accuracy.

### Q21: What is ONNX?
**Answer**: Open Neural Network Exchange. An open-standard format for representing machine learning models, enabling trained models to run on high-performance inference engines like OpenCV DNN and ONNX Runtime without requiring the original training framework (PyTorch).

### Q22: Why did you not use Flask for the backend?
**Answer**: Flask is historically synchronous and lacks built-in request validation. FastAPI supports asynchronous ASGI execution, automatic Pydantic request validation, and auto-generated Swagger documentation.

### Q23: What web server runs your FastAPI backend?
**Answer**: Uvicorn, an ASGI web server built on `uvloop` and `httptools`.

### Q24: What is the companion mobile app used for?
**Answer**: Built with Flutter, it serves as a companion monitoring dashboard for quality supervisors to monitor real-time production yield, review recent inspections, and receive critical defect alerts.

### Q25: Does the mobile app run deep learning models locally?
**Answer**: No. The mobile app is a lightweight monitoring client. Running heavy AI models on phones causes thermal throttling, and smartphone cameras lack the industrial telecentric optics needed for microscopic PCB inspection.

### Q26: What happens if the edge workstation loses internet connectivity?
**Answer**: The desktop station continues inspecting boards normally. Inferences and bounding boxes are saved to local SQLite (`station.db`). When connectivity returns, a background worker automatically syncs records to Supabase.

### Q27: How are critical defect alerts sent via email?
**Answer**: Using Python's native `smtplib` and a Next.js server route handler, connecting over TLS (Port 587) with an authenticated Gmail App Password to broadcast HTML alert emails to active administrators.

### Q28: What is Supabase GoTrue?
**Answer**: Supabase's open-source authentication microservice that manages user signups, logins, email verifications, password resets, and JWT issuance.

### Q29: What is Tailwind CSS?
**Answer**: A utility-first CSS framework that provides low-level utility classes directly in HTML/JSX, eliminating large external CSS stylesheets and speeding up UI development.

### Q30: What is TypeScript and why use it over JavaScript?
**Answer**: TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript. It catches bugs at compile time and enforces data contracts between backend schemas and frontend components.

### Q31: What is a Pydantic schema in FastAPI?
**Answer**: A Python class defining data structure and types for request payloads and responses. FastAPI uses Pydantic to validate inbound JSON, automatically rejecting invalid requests with a `422 Unprocessable Entity` status.

### Q32: What is SQLAlchemy?
**Answer**: A Python SQL toolkit and Object-Relational Mapper (ORM) that maps Python classes to database tables and provides a type-safe query interface.

### Q33: What is CORS?
**Answer**: Cross-Origin Resource Sharing. A browser security mechanism that restricts web applications from making HTTP requests to a domain different from the one that served the web page.

### Q34: What is Bcrypt?
**Answer**: A salted password hashing function based on the Blowfish cipher that incorporates an adaptive cryptographic work factor to resist brute-force cracking.

### Q35: Where are JWT tokens stored in the browser?
**Answer**: In the browser's `localStorage` under the key `pcb_access_token`.

### Q36: What is the rule-of-ten in PCB manufacturing quality control?
**Answer**: The cost of finding and fixing a defect increases by approximately 10x at each subsequent production stage ($1 at bare board, $10 after SMT component assembly, $100 in final product assembly, $1,000+ if it fails in the customer's hands).

### Q37: What is an SMT line?
**Answer**: Surface-Mount Technology assembly line, where automated pick-and-place machines mount electronic components directly onto bare PCBs before reflow soldering.

### Q38: What is a mousebite defect?
**Answer**: An irregular mechanical notch or tearing along the edge of a board or trace, typically caused by breakout routing during panel separation.

### Q39: What is a spur defect?
**Answer**: A pointed, unwanted copper protrusion extending outward from a conductive trace into an isolation channel.

### Q40: What is spurious copper?
**Answer**: An isolated island of unwanted copper left on the substrate laminate due to incomplete chemical etching.

### Q41: What is a pinhole defect?
**Answer**: A tiny circular void or hole penetrating a copper trace, pad, or ground plane, often caused by gas bubbles trapped during electroplating.

### Q42: What is the difference between single-stage and two-stage object detectors?
**Answer**: Single-stage detectors (like YOLO) predict bounding boxes and class probabilities in a single forward pass, optimizing for speed. Two-stage detectors (like Faster R-CNN) first generate region proposals and then classify them, trading speed for higher precision.

### Q43: Why was YOLOv8m removed from the active model registry?
**Answer**: YOLOv8m offered only a marginal 0.8% mAP improvement over YOLOv8s while doubling memory requirements and latency (22ms vs 10ms). It was removed to streamline runtime footprint and container size.

### Q44: What is the purpose of the `/reports` module?
**Answer**: Allows operators and managers to generate, filter, and export shift and line quality audit records into downloadable CSV and JSON formats.

### Q45: Can an inspector view another inspector's inspections?
**Answer**: No. Strict Role-Based Access Control filters inspections so that users with the `inspector` role only see their own records. Administrators can view all inspections.

### Q46: How does the system determine whether an inspected board is a PASS or FAIL?
**Answer**: If the total detected defect count is 0, the board receives a `PASS`. If one or more defects are detected, it receives a `FAIL`.

### Q47: Can an operator override an AI verdict?
**Answer**: Yes. In the inspection detail view, an authorized user can submit a review with an explanatory note to override a false positive from `FAIL` to `PASS`.

### Q48: What is the purpose of the `station.db` SQLite database?
**Answer**: It acts as a local, offline-first datastore on the edge workstation, queuing inspection results safely when the factory network is down.

### Q49: What is the typical inference speed of your YOLOv8s model?
**Answer**: Approximately 10.1 milliseconds per board on standard hardware.

### Q50: What is PostgREST?
**Answer**: A standalone web server provided by Supabase that automatically turns a PostgreSQL database schema into a RESTful API.

---

## 47. Intermediate Viva Questions

### Q51: Explain how your dynamic grid tiling algorithm works for high-resolution images.
**Answer**: When an image's aspect ratio or resolution exceeds `TILE_TRIGGER = 1.5`, the image is sliced into overlapping sub-tiles with a `TILE_OVERLAP = 0.2` (20% overlap). Each tile is inferred independently, and predicted bounding box coordinates are remapped back to global coordinates using tile offsets before running class-aware NMS.

### Q52: Why is the 20% tile overlap necessary?
**Answer**: Without overlap, defects located on tile boundaries would be cut in half, causing the model to miss them or misclassify them. The 20% overlap ensures boundary defects appear fully intact in at least one tile.

### Q53: Explain class-aware NMS and why it is critical for PCB inspection.
**Answer**: Standard NMS suppresses all overlapping bounding boxes regardless of class. In PCB manufacturing, different defect types (like a `mousebite` right next to an `open` circuit) can co-occur. Class-aware NMS adds an offset ($C 	imes 4096$) based on class ID $C$, ensuring boxes of different classes do not suppress each other.

### Q54: How does your rule-based severity classifier work in `core/severity.py`?
**Answer**: Defect classes `open` and `short` are categorized as `Critical` if confidence $\ge 0.60$, otherwise `Moderate`. Classes `mousebite` and `spur` are categorized as `Moderate` if confidence $\ge 0.60$, otherwise `Minor`. Classes `copper` and `pinhole` are categorized as `Moderate` or `Minor`.

### Q55: How does the edge desktop application communicate with the cloud database?
**Answer**: Via `core/sync.py`, an asynchronous `QThread` that periodically checks network connectivity, uploads images to Supabase Storage over HTTPS, and executes PostgREST HTTP inserts into the `inspections` and `defects` tables.

### Q56: What happens during a database transaction when a QA engineer overrides an inspection verdict?
**Answer**: A new record is inserted into the `reviews` table documenting the reviewer ID, original status, new status, and notes; the status in `inspections` is updated to `PASS`; and an audit entry is created in `audit_logs`.

### Q57: How do you prevent SQL injection in your FastAPI backend?
**Answer**: By using SQLAlchemy ORM and parameterized queries, which treat user input as data parameters rather than executable SQL code.

### Q58: How do you prevent SQL injection on the Next.js web portal when querying Supabase?
**Answer**: The `@supabase/supabase-js` client communicates via PostgREST, which uses parameterized queries internally, neutralizing SQL injection vectors.

### Q59: Explain the difference between Authentication and Authorization in your system.
**Answer**: Authentication verifies *who* the user is (e.g., verifying email and password to issue a JWT). Authorization verifies *what permissions* the authenticated user has (e.g., verifying `role === 'admin'` before allowing access to user management or plant-wide reports).

### Q60: Explain how password reset works in your web portal.
**Answer**: The user submits their email on `/forgot-password`. Supabase GoTrue dispatches a password recovery email containing a secure redirect URL (`https://pcb-fault-detection-system.vercel.app/reset-password`). When clicked, the user enters a new password, which is updated via `supabase.auth.updateUser()`.

### Q61: What is the purpose of the `audit_logs` table?
**Answer**: To maintain an immutable, chronological record of critical system actions (such as QA verdict overrides, user role modifications, and system setting changes) for ISO 9001 quality compliance.

### Q62: Why did you choose SQLite for the edge workstation rather than local PostgreSQL?
**Answer**: SQLite is a zero-configuration, serverless, file-based database that requires no background daemon, zero setup on factory IPCs, and provides sub-millisecond local write performance with full ACID guarantees.

### Q63: What is the purpose of the `QThread` in PySide6?
**Answer**: `QThread` executes heavy workloads (such as image capture, deep learning inference, and cloud synchronization) in background threads, keeping the main GUI event loop responsive and preventing interface freezing.

### Q64: How do PySide6 worker threads communicate with the GUI thread?
**Answer**: Using Qt's thread-safe **Signals and Slots** mechanism. Worker threads emit signals containing data payloads, which the main GUI thread receives to update UI widgets.

### Q65: What is the role of `uvloop` in Uvicorn?
**Answer**: `uvloop` is an ultra-fast, C-based drop-in replacement for Python's default `asyncio` event loop, allowing Uvicorn to achieve throughput comparable to Node.js and Go web servers.

### Q66: Explain the structure and purpose of the `defects` database table.
**Answer**: Each row represents an individual detected defect on a board, storing `inspection_id` (foreign key with `ON DELETE CASCADE`), `defect_type`, `confidence`, bounding box coordinates (`x_min`, `y_min`, `x_max`, `y_max`), and `severity`.

### Q67: What is the cascade delete rule on your `defects` table?
**Answer**: `ON DELETE CASCADE`. If an inspection record is deleted from the `inspections` table, all associated defect records in `defects` are automatically deleted by the database engine, preventing orphaned rows.

### Q68: Why do you store both raw and annotated board images in cloud storage?
**Answer**: Raw images preserve untouched original data for future model retraining and active learning pipelines. Annotated images enable instant rendering of defect overlays in the web browser without recomputing bounding box drawings.

### Q69: Explain the difference between Precision and Recall in the context of PCB defect detection.
**Answer**: Precision measures the proportion of detected defects that were real flaws (avoiding false alarms). Recall measures the proportion of all actual defects that were successfully identified (avoiding defect escapes).

### Q70: Why is Recall more important than Precision in safety-critical PCB inspection?
**Answer**: A false alarm (low precision) costs a few seconds of human reinspection time. A missed defect (low recall) means a bad circuit board escapes to an automotive or medical customer, causing catastrophic failures and liability.

### Q71: How does your system handle user account activation?
**Answer**: When a user registers, their account is created with email confirmation required. Administrators can also toggle user status (`is_active: false`) in the `/users` panel to deactivate departing personnel.

### Q72: What does the `/api/stats/summary` endpoint return?
**Answer**: Key performance indicators: total inspected boards, pass rate percentage, fail rate percentage, and critical defect counts over a specified time window.

### Q73: How does the web portal export inspection reports as CSV?
**Answer**: The client queries inspection records, formats them into a structured comma-separated string, creates a client-side Blob URL (`text/csv`), and triggers an automatic browser download.

### Q74: What is the advantage of using OpenCV's DNN module (`cv2.dnn`) over running PyTorch directly on the edge?
**Answer**: `cv2.dnn` is a lightweight, highly optimized C++ inference engine with minimal disk and memory footprint. It avoids installing heavy PyTorch packages (~2GB) on edge factory machines and executes ONNX models with SIMD/AVX2 acceleration.

### Q75: How does the system handle email notifications when a critical defect is detected?
**Answer**: When a defect classified as `Critical` (`open` or `short`) is detected, the system queries all active users with `role = 'admin'` and dispatches an HTML alert email containing the board ID, defect type, and web portal link via SMTP.

---

## 48. Advanced Viva Questions

### Q126: Explain the anchor-free architecture of YOLOv8 compared to the anchor-based design of YOLOv5.
**Answer**: YOLOv5 uses pre-defined anchor boxes of fixed aspect ratios and predicts offsets relative to them. YOLOv8 uses an anchor-free task-aligned assigner that directly predicts the distance from the cell center to the four bounding box edges. This eliminates anchor hyperparameter tuning and improves localization for micro-defects with irregular shapes.

### Q127: Explain the loss functions used during YOLOv8 model training.
**Answer**: YOLOv8 uses a combination of **Complete IoU (CIoU)** loss and **Distribution Focal Loss (DFL)** for bounding box regression, paired with **Binary Cross-Entropy (BCE)** loss for multi-label classification. DFL models box edge coordinates as continuous probability distributions, improving sub-pixel localization accuracy.

### Q128: Why does RetinaNet perform well on dense PCB defect benchmarks?
**Answer**: RetinaNet uses **Focal Loss**:
$$	ext{FL}(p_t) = -lpha_t (1 - p_t)^\gamma \log(p_t)$$
The modulating factor $(1 - p_t)^\gamma$ dynamically down-weights easy background examples (the vast area of normal green solder mask) and focuses gradients on rare, hard micro-defects.

### Q129: Explain the Region Proposal Network (RPN) in Faster R-CNN and why its latency is higher.
**Answer**: Faster R-CNN is a two-stage detector. The RPN slides a mini-network over the convolutional feature map to generate candidate region proposals. In stage two, RoI Align crops feature vectors for each proposal, which pass through fully connected layers for classification and box refinement. This two-stage process yields high accuracy (92.77% mAP50) but requires 114.2 ms per frame.

### Q130: Why is OpenCV DNN faster on CPU than running PyTorch native inference?
**Answer**: OpenCV DNN is implemented in pure C++ with minimal runtime overhead, compiled with AVX-512/AVX2 and FMA SIMD instruction sets, and implements aggressive layer fusion (combining Convolution, Batch Normalization, and ReLU into a single execution kernel).

### Q131: Explain how you prevent race conditions during edge database synchronization.
**Answer**: The local SQLite database (`station.db`) uses Write-Ahead Logging (WAL) mode. When the sync worker reads records, it uses a transaction: it selects records with `sync_status = 'pending'`, uploads them, and marks them `synced` inside an atomic transaction.

### Q132: What is Row Level Security (RLS) in PostgreSQL and how is it used in your project?
**Answer**: RLS is an access control mechanism enforced by the PostgreSQL database engine. Policies inspect the executing role and session attributes (such as `auth.uid()`) to restrict which rows a user can SELECT, INSERT, UPDATE, or DELETE, guaranteeing database-level tenant isolation.

### Q133: What is the difference between asymmetric (RS256) and symmetric (HS256) JWT signing?
**Answer**: HS256 uses a single shared secret key for both signing and verifying tokens. RS256 uses an asymmetric key pair: the private key signs the token, and the public key verifies it. Our backend currently uses HS256 for fast symmetric verification against `JWT_SECRET`.

### Q134: How does Next.js 14 App Router differ from the legacy Pages Router?
**Answer**: The App Router uses React Server Components by default, supports nested layouts without re-rendering parent shells, provides streaming SSR via React Suspense, and uses directory-based routing (`page.tsx`, `layout.tsx`, `route.ts`).

### Q135: Explain how the Next.js Server Route Handler protects email alert credentials.
**Answer**: In `web/src/app/api/notifications/email/route.ts`, the handler executes exclusively on the server runtime. Environment variables like `SMTP_PASSWORD` are never bundled into client-side JavaScript, protecting credentials from browser inspection.

### Q136: How would you scale the edge desktop architecture to 50 concurrent SMT lines?
**Answer**: Each SMT line runs an independent PySide6 edge workstation with its own local SQLite database. All 50 stations push data asynchronously to a centralized Supabase PostgreSQL instance via connection pooling (PgBouncer), decoupling edge inspection throughput from database load.

### Q137: What is INT8 quantization and what benefits would it bring to this system?
**Answer**: Quantization converts 32-bit floating-point weights (FP32) to 8-bit integers (INT8). This reduces model size by ~75% and enables deployment on hardware accelerators (like Google Coral Edge TPUs or NVIDIA TensorRT INT8 engines), reducing inference latency to under 3 ms.

### Q138: Explain how you would implement an Active Learning loop in this system.
**Answer**: When a QA engineer overrides an AI verdict on the web portal, the override event is logged in `reviews`. A pipeline flags that board image, fetches the raw image from Supabase Storage, and queues it in an annotation pool for model retraining, closing the continuous improvement loop.

### Q139: Why is specular reflection a challenge in PCB optical inspection and how can it be mitigated?
**Answer**: Exposed copper traces and solder pads act like mirrors, creating bright glare spots that wash out camera sensors and cause false defect detections. This is mitigated in hardware using diffuse dome illumination or polarizing cross-filters, and in software via data augmentation (color jitter, brightness variation, and glare simulation).

### Q140: Explain the mathematical relationship between IoU and Non-Maximum Suppression.
**Answer**: Given candidate bounding boxes sorted by confidence, NMS takes the highest-confidence box $B_{	ext{max}}$ and computes its IoU with every other overlapping candidate $B_i$:
$$	ext{IoU}(B_{	ext{max}}, B_i) = rac{	ext{Area}(B_{	ext{max}} \cap B_i)}{	ext{Area}(B_{	ext{max}} \cup B_i)}$$
If $	ext{IoU} > 	ext{threshold}$ (e.g., 0.45), $B_i$ is suppressed as a redundant detection.

---

## 49. Examiner Trap Questions

Examiners use these questions to test whether you genuinely built and understand your project or simply memorized high-level concepts.

### Trap 1: "Which exact file generates your JWT token?"
- **The Trap**: Claiming the frontend generates the JWT, or naming a generic library.
- **The Bulletproof Answer**: *"In our FastAPI backend, JWTs are created in `backend/app/auth.py` by the function `create_access_token()`. On the web portal, user authentication tokens are issued by the Supabase GoTrue service when the user signs in via `web/src/lib/api/auth.ts`."*

### Trap 2: "Why didn't you just run your YOLO model inside Next.js using Node.js?"
- **The Trap**: Thinking Next.js can easily handle heavy Python deep learning pipelines.
- **The Bulletproof Answer**: *"Next.js runs on a Node.js V8 JavaScript runtime. Deep learning models rely on C++ and CUDA libraries (PyTorch, OpenCV) that are native to Python. Furthermore, running heavy inference inside a serverless web host causes memory exhaustion and execution timeouts, and fails the requirement for offline-capable edge inspection on the factory floor."*

### Trap 3: "Is your desktop app using cloud AI or local AI?"
- **The Trap**: Claiming the desktop app calls a cloud API to detect defects.
- **The Bulletproof Answer**: *"Our desktop application performs 100% local, offline inference using OpenCV's DNN module and local ONNX model files. It only connects to the cloud in the background to synchronize completed inspection records and imagery."*

### Trap 4: "Why did you delete YOLOv8m if it had higher accuracy?"
- **The Trap**: Being unaware of why model options were removed or changed.
- **The Bulletproof Answer**: *"YOLOv8m achieved an 88.4% mAP50 compared to 87.6% for YOLOv8s—a gain of only 0.8%. However, YOLOv8m doubled the parameter count from 11.2M to 25.9M and more than doubled latency from 10.1 ms to 22 ms. In an industrial high-speed inspection context, this minor accuracy gain did not justify the 2x latency penalty."*

### Trap 5: "What prevents an operator from deleting an inspection record?"
- **The Trap**: Assuming all users have equal access.
- **The Bulletproof Answer**: *"Role-Based Access Control. In `backend/app/routers/inspections.py`, the `DELETE /api/inspections/{id}` endpoint is protected by `Depends(require_role('admin'))`. An inspector who attempts to invoke this endpoint receives a `403 Forbidden` response."*

### Trap 6: "What happens to the bounding boxes when an image is resized for inference?"
- **The Trap**: Forgetting that model output coordinates must be mapped back to the original image dimensions.
- **The Bulletproof Answer**: *"The model outputs bounding box coordinates normalized to the 640x640 letterboxed input. In `core/detector.py`, we subtract the letterbox padding offsets and divide by the scaling ratio $r$ to remap the coordinates precisely back to the original camera image resolution."*

### Trap 7: "If an admin deactivates themselves, how do they log back in?"
- **The Trap**: Falling for the premise of the question.
- **The Bulletproof Answer**: *"They cannot deactivate themselves in the first place. In `backend/app/routers/users.py`, we implemented an explicit check that rejects self-deactivation with a `400 Bad Request`, preventing accidental administrative lockout."*

---

## 50. Rapid-Fire Viva (100 Questions)

1. **What is AOI?** Automated Optical Inspection.
2. **What is SMT?** Surface-Mount Technology.
3. **What is PCB?** Printed Circuit Board.
4. **What is IPC-A-600?** The international acceptability standard for bare printed circuit boards.
5. **What is an open circuit?** A broken conductive trace causing an electrical discontinuity.
6. **What is a short circuit?** An unintended copper bridge connecting two traces.
7. **What is a mousebite?** An irregular notch along a board or trace edge.
8. **What is a spur?** A pointed copper protrusion extending outward from a trace.
9. **What is spurious copper?** Unwanted residual copper flakes left on the board laminate.
10. **What is a pinhole?** A tiny void penetrating a copper ground plane or trace.
11. **What is the primary production model?** YOLOv8s in ONNX format.
12. **What is the mAP50 of YOLOv8s?** 87.60%.
13. **What is the latency of YOLOv8s?** 10.1 milliseconds.
14. **What is the lightweight edge model?** YOLOv8n in ONNX format.
15. **What is the mAP50 of YOLOv8n?** 86.70%.
16. **What is the latency of YOLOv8n?** 3.7 milliseconds.
17. **What is the mAP50 of Faster R-CNN?** 92.77%.
18. **What is the latency of Faster R-CNN?** 114.2 milliseconds.
19. **What is the mAP50 of RetinaNet?** 92.41%.
20. **What is the latency of RetinaNet?** 55.1 milliseconds.
21. **What input size does the model expect?** $640 	imes 640$ pixels.
22. **What color format does OpenCV load images in?** BGR (Blue, Green, Red).
23. **What color format does YOLO expect?** RGB (Red, Green, Blue).
24. **What is the letterbox padding color?** Grey (`rgb(114, 114, 114)`).
25. **What is the confidence threshold?** 0.25.
26. **What is the IoU threshold for NMS?** 0.45.
27. **What is the tiling aspect ratio trigger?** `TILE_TRIGGER = 1.5`.
28. **What is the tile overlap percentage?** `TILE_OVERLAP = 0.2` (20%).
29. **What framework powers the desktop GUI?** PySide6 (Qt for Python).
30. **What local database is used on the edge?** SQLite (`station.db`).
31. **What file handles cloud syncing on the desktop?** `core/sync.py`.
32. **What thread class is used for Qt concurrency?** `QThread`.
33. **What cloud database is used?** PostgreSQL 15 on Supabase.
34. **What is Supabase?** An open-source Backend-as-a-Service built on PostgreSQL.
35. **What web framework is used?** Next.js 14 with App Router.
36. **What UI component library is used?** React 18 with TypeScript.
37. **What CSS framework is used?** Tailwind CSS.
38. **What icon library is used in the web portal?** Lucide React.
39. **What mobile framework is used?** Flutter 3.x with Dart.
40. **What mobile state management pattern is used?** Provider (`ChangeNotifier`).
41. **What backend framework is used?** FastAPI.
42. **What ASGI server runs FastAPI?** Uvicorn.
43. **What library validates FastAPI requests?** Pydantic.
44. **What ORM is used in the backend?** SQLAlchemy.
45. **What library creates JWTs in the backend?** PyJWT.
46. **What JWT signing algorithm is used?** HMAC SHA-256 (`HS256`).
47. **What password hashing algorithm is used?** Bcrypt via Passlib.
48. **Where is the JWT stored in the browser?** In `localStorage` under `pcb_access_token`.
49. **What roles exist in the system?** `admin` and `inspector`.
50. **Can inspectors view other users' inspections?** No, only their own.
51. **Can admins view all inspections?** Yes.
52. **Can admins deactivate themselves?** No, blocked programmatically.
53. **What email protocol is used for alerts?** SMTP over TLS (Port 587).
54. **Who receives critical defect alert emails?** All active administrative users.
55. **What defects trigger critical email alerts?** `open` and `short` circuits.
56. **What is the cloud storage bucket name?** `pcb-vision`.
57. **What formats can reports be exported in?** CSV and JSON.
58. **What does IoU stand for?** Intersection over Union.
59. **What is precision?** True Positives / (True Positives + False Positives).
60. **What is recall?** True Positives / (True Positives + False Negatives).
61. **What is F1-score?** Harmonic mean of Precision and Recall.
62. **What is an anchor-free detector?** A model that predicts box boundaries directly without predefined anchor templates.
63. **What is C2f in YOLOv8?** Cross-Stage Partial bottleneck with two convolutions for feature aggregation.
64. **What is Focal Loss?** A loss function that down-weights easy background examples to address class imbalance.
65. **What is RoI Align?** A region feature extraction layer in Faster R-CNN that avoids quantization errors.
66. **What is an ASGI server?** Asynchronous Server Gateway Interface.
67. **What is WSGI?** Web Server Gateway Interface (synchronous predecessor to ASGI).
68. **What is RLS?** Row Level Security in PostgreSQL.
69. **What is PostgREST?** A tool that generates REST APIs directly from a PostgreSQL schema.
70. **What is GoTrue?** Supabase's open-source authentication microservice.
71. **What is a letterbox transform?** Aspect-ratio preserving image resize with padding.
72. **What is SIMD?** Single Instruction, Multiple Data CPU vectorization.
73. **What is AVX2?** Advanced Vector Extensions 2 (x86 CPU instruction set).
74. **What is ONNX Runtime?** A high-performance inference engine for ONNX models.
75. **What is an epoch?** One complete pass through the entire training dataset.
76. **What is batch size?** The number of training samples processed in one forward/backward pass.
77. **What is learning rate?** The step size taken by the optimizer during gradient descent.
78. **What is AdamW?** An adaptive learning rate optimizer with decoupled weight decay.
79. **What is CIoU?** Complete IoU loss, incorporating overlap area, aspect ratio, and center point distance.
80. **What is DFL?** Distribution Focal Loss for bounding box regression.
81. **What is a telecentric lens?** An optical lens with parallel chief rays that eliminates perspective distortion.
82. **What is diffuse dome lighting?** Omnidirectional illumination that eliminates specular glare on shiny copper.
83. **What is an escape rate?** The percentage of defective units that bypass quality control unnoticed.
84. **What is yield?** The percentage of manufactured units that pass quality inspection on the first pass.
85. **What is an audit log?** A chronological, immutable record of system events and user actions.
86. **What is CORS?** Cross-Origin Resource Sharing.
87. **What is a 401 HTTP status?** Unauthorized (authentication required or invalid).
88. **What is a 403 HTTP status?** Forbidden (authenticated, but lacking required role/permissions).
89. **What is a 422 HTTP status?** Unprocessable Entity (Pydantic validation failure).
90. **What is a 201 HTTP status?** Created (new resource successfully created).
91. **What is a Blob in JavaScript?** Binary Large Object representing raw file data in memory.
92. **What is SWR?** Stale-While-Revalidate data-fetching strategy.
93. **What is a React Hook?** A function allowing functional components to use state and lifecycle methods.
94. **What is `QPainter`?** A PySide6 class for performing low-level vector rendering on widgets.
95. **What is `station.db`?** The edge workstation's local SQLite database.
96. **What is WAL mode in SQLite?** Write-Ahead Logging mode for faster concurrent reads and writes.
97. **What is the password reset URL in production?** `https://pcb-fault-detection-system.vercel.app/reset-password`.
98. **How are passwords stored?** Bcrypt-hashed strings with salt.
99. **How long do JWT tokens remain valid?** 60 minutes by default.
100. **What is the ultimate goal of PCB-Vision?** Zero-defect escape rate in industrial electronics manufacturing.


---

## 51. 'Explain This Code' Master Breakdown

Examiners frequently point to specific files and ask: *"Walk me through this function line-by-line."* Below are the detailed breakdowns of the 8 most critical code segments in the repository.

---

### Code Segment 1: The Core Detection Engine (`core/detector.py`)

```python
def detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
    h, w = image.shape[:2]
    # Check if image dimensions trigger adaptive tiling
    if max(h, w) / min(h, w) > self.TILE_TRIGGER or max(h, w) > 2000:
        return self._detect_tiled(image)
    
    # 1. Letterbox Preprocessing
    input_img, ratio, (pad_w, pad_h) = self._letterbox(image, (640, 640))
    blob = cv2.dnn.blobFromImage(
        input_img, scalefactor=1.0/255.0, size=(640, 640),
        swapRB=True, crop=False
    )
    
    # 2. Forward Pass Inference
    self.net.setInput(blob)
    outputs = self.net.forward() # Shape: [1, 10, 8400]
    
    # 3. Post-processing & Class-Aware NMS
    predictions = np.squeeze(outputs).T # Transpose to [8400, 10]
    boxes, confidences, class_ids = [], [], []
    
    for row in predictions:
        classes_scores = row[4:]
        max_score = np.amax(classes_scores)
        if max_score >= self.conf_threshold:
            class_id = np.argmax(classes_scores)
            cx, cy, bw, bh = row[0:4]
            # Remap from letterbox space back to original image
            x_min = int((cx - bw / 2 - pad_w) / ratio)
            y_min = int((cy - bh / 2 - pad_h) / ratio)
            bw_orig = int(bw / ratio)
            bh_orig = int(bh / ratio)
            
            # Offset by class ID for class-aware NMS
            boxes.append([x_min + class_id * 4096, y_min + class_id * 4096, bw_orig, bh_orig])
            confidences.append(float(max_score))
            class_ids.append(class_id)
            
    indices = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_threshold, self.iou_threshold)
    return self._format_results(indices, boxes, confidences, class_ids)
```

#### Line-by-Line Viva Explanation:
1. **Adaptive Tiling Trigger**: Checks if the aspect ratio exceeds `TILE_TRIGGER = 1.5` or if image dimensions exceed 2000 pixels. If so, redirects execution to `_detect_tiled()` to prevent downsampling artifacts on micro-defects.
2. **`_letterbox()`**: Scales the image preserving its aspect ratio, fills margins with neutral grey padding (`114, 114, 114`), and returns the scaling `ratio` and padding offsets `(pad_w, pad_h)`.
3. **`cv2.dnn.blobFromImage()`**: Normalizes uint8 pixels $[0, 255]$ to float32 $[0.0, 1.0]$, converts BGR to RGB via `swapRB=True`, and shapes the tensor into NCHW format `[1, 3, 640, 640]`.
4. **`self.net.forward()`**: Executes the forward pass through the ONNX model using OpenCV's compiled C++ DNN engine, outputting tensor `[1, 10, 8400]` (8400 candidate anchor boxes with 4 coordinate offsets and 6 class probabilities).
5. **Coordinate Remapping**: Subtracts the letterbox padding offsets and divides by the scaling ratio $r$ to map predicted box coordinates from the 640x640 canvas back to the original camera image resolution.
6. **Class-Aware NMS Offset**: Adds `class_id * 4096` to bounding box coordinates before calling `cv2.dnn.NMSBoxes()`, ensuring candidate boxes of different defect classes occupy distinct coordinate spaces and do not suppress each other.

---

### Code Segment 2: Rule-Based Severity Classification (`core/severity.py`)

```python
def classify_severity(defect_type: str, confidence: float) -> str:
    defect_type = defect_type.lower().strip()
    
    # Critical defects: Direct functional circuit failure
    if defect_type in {"open", "short"}:
        return "Critical" if confidence >= 0.60 else "Moderate"
        
    # Moderate defects: High risk of trace burnout or solder bridging
    if defect_type in {"mousebite", "spur"}:
        return "Moderate" if confidence >= 0.60 else "Minor"
        
    # Minor defects: Cosmetic or non-critical ground plane voids
    if defect_type in {"copper", "pinhole", "missing_hole"}:
        return "Moderate" if confidence >= 0.70 else "Minor"
        
    return "Minor"
```

#### Line-by-Line Viva Explanation:
1. **`open` and `short`**: Electrical opens break current flow completely; shorts create unintended connections that can burn components. Because of their severe functional impact, they are classified as `Critical` when confidence exceeds 0.60.
2. **`mousebite` and `spur`**: Physical notches reduce trace cross-sectional area (increasing resistance and heat), while spurs risk arcing or bridging. These are classified as `Moderate`.
3. **`copper` and `pinhole`**: Isolated copper flakes on non-conductive laminate or pinholes in solid ground planes generally carry lower immediate risk, categorizing them as `Minor` unless high detection confidence warrants `Moderate` review.

---

### Code Segment 3: JWT Token Creation (`backend/app/auth.py`)

```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm="HS256")
    return encoded_jwt
```

#### Line-by-Line Viva Explanation:
1. **`to_encode = data.copy()`**: Creates a shallow copy of the claims dictionary (typically containing `sub` user UUID, `email`, and `role`).
2. **`expire` Calculation**: Sets token lifetime using `datetime.utcnow()` plus `access_token_expire_minutes` (default 60 minutes), writing standard RFC 7519 `exp` (expiration) and `iat` (issued at) claims.
3. **`jwt.encode()`**: Cryptographically signs the payload with HMAC SHA-256 (`HS256`) using the private `settings.jwt_secret`, producing the compact three-part JWT string returned to the client.

---

### Code Segment 4: Preventing Admin Self-Deactivation (`backend/app/routers/users.py`)

```python
@router.patch("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: UUID,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("admin"))
):
    if user_id == current_user.id and user_update.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot deactivate their own account."
        )
    # Proceed with updating target user record in database
    return updated_user
```

#### Line-by-Line Viva Explanation:
1. **Role Enforcement**: `Depends(require_role("admin"))` verifies the caller holds the `admin` role, rejecting other users with a `403 Forbidden`.
2. **Self-Deactivation Guard**: Compares `user_id` with `current_user.id`. If an administrator attempts to set `is_active = False` on their own account, the request is rejected with `400 Bad Request`, preventing accidental administrative lockout.

---

### Code Segment 5: Automated Email Alert Broadcaster (`web/src/app/api/notifications/email/route.ts`)

```python
// Conceptual Python representation of backend/app/services/email.py
def broadcast_critical_alert(board_name: str, defect_type: str, confidence: float, db: Session):
    # Query all active administrators
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    if not admins:
        return
        
    recipient_emails = [admin.email for admin in admins]
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"CRITICAL DEFECT ALERT: {defect_type.upper()} on {board_name}"
    msg["From"] = settings.smtp_user
    msg["To"] = ", ".join(recipient_emails)
    
    html_content = render_alert_template(board_name, defect_type, confidence)
    msg.attach(MIMEText(html_content, "html"))
    
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_user, recipient_emails, msg.as_string())
```

#### Line-by-Line Viva Explanation:
1. **Active Admin Query**: Queries all users where `role == 'admin'` and `is_active == True`, ensuring alerts reach all administrators while excluding deactivated accounts.
2. **Email Formatting**: Constructs a multi-part MIME message with subject, sender, and recipient headers.
3. **Secure SMTP Handshake**: Connects to the mail relay via `smtplib.SMTP()`, upgrades the connection to encrypted TLS via `server.starttls()`, authenticates with app credentials, and dispatches the alert.

---

## 52. Individual Contribution & Authorship Defense

Examiners evaluate whether you truly understand the engineering decisions across your project. Use these talking points to articulate your role and architectural contributions:

### How to Present Your Work Confidently
1. **System Integration & Pipeline Engineering**:
   - *"My core contribution was designing the end-to-end architecture connecting edge inference with cloud quality management. Rather than building an isolated ML model in a notebook, I engineered an edge-to-cloud system featuring local ONNX inference, offline-first SQLite persistence, automatic cloud synchronization, and a role-based Next.js web portal."*
2. **Overcoming Spatial Downsampling on Micro-Defects**:
   - *"A major engineering challenge was detecting sub-millimeter defects on high-resolution boards. When a 3000x2000 image is downsampled directly to 640x640, micro-defects shrink below the model's receptive field. To solve this, I designed and implemented an adaptive grid tiling algorithm with a 20% stride overlap and coordinate remapping, ensuring micro-defects remain detectable."*
3. **Industrial Data Isolation & Role-Based Access Control**:
   - *"I implemented strict RBAC across the entire stack. Inspectors can only view their own inspections and reports, while administrators have plant-wide visibility. I also added critical safety checks, such as preventing administrator self-deactivation to avoid accidental tenant lockout."*

---

## 53. Live Troubleshooting & Debugging Scenarios

### Scenario 1: The desktop app inspects boards, but records aren't appearing on the web portal.
**Diagnostic Procedure**:
1. Check the desktop status bar: Is the sync status showing *"Pending (N)"*?
2. If pending count is increasing: Check network connectivity between the desktop machine and Supabase.
3. Verify Supabase credentials: Are `SUPABASE_URL` and `SUPABASE_ANON_KEY` configured correctly in the desktop environment?
4. Inspect local SQLite: Run `SELECT * FROM inspections WHERE sync_status = 'pending';` in `station.db` to verify local persistence is functioning.
5. Check Supabase Storage permissions: Verify that the `pcb-vision` bucket exists and has appropriate RLS policies allowing uploads.

### Scenario 2: A user cannot log into the web portal.
**Diagnostic Procedure**:
1. Check the browser console and network tab on `/login`: Look for the response from `supabase.auth.signInWithPassword()`.
2. If `400 Bad Request / Invalid login credentials`: Confirm email and password. Verify whether the user confirmed their email verification link.
3. If `is_active: false`: Check the `public.users` table. The account may have been deactivated by an administrator.
4. Verify environment variables: Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are defined in `.env.local`.

### Scenario 3: Inference speed drops on high-resolution images.
**Diagnostic Procedure**:
1. Check image dimensions: Large boards or high aspect ratios trigger the adaptive tiling pipeline (`TILE_TRIGGER = 1.5`), slicing the image into multiple sub-tiles.
2. Each tile undergoes an independent forward pass, increasing overall execution time from ~10 ms to ~35-50 ms.
3. This is expected behavior: the system dynamically trades a small latency increase to ensure microscopic defects are not missed due to downsampling distortion.

---

## 54. Industrial Case Studies & Production Scenarios

### Case Study 1: High-Speed SMT Conveyor Line (3 Boards per Second)
- **Challenge**: The conveyor moves at 3 boards per second, giving an inspection budget of approximately 330 ms per board.
- **System Solution**: Our primary model (YOLOv8s ONNX) executes in **10.1 ms** per board on standard GPU hardware and ~35 ms on CPU, well within the 330 ms budget. Inspection records are committed to local SQLite in under 1 ms, and cloud synchronization runs in a decoupled background thread, ensuring the inspection pipeline never bottlenecks the conveyor line.

### Case Study 2: Factory Network Outage During Night Shift
- **Challenge**: The factory's primary internet connection drops for 4 hours during a production run.
- **System Solution**: The edge desktop workstation operates completely offline. Every inspection is stored locally in `station.db`. When the network is restored, the `SyncWorker` thread detects connectivity and automatically pushes the queued records and images to Supabase with zero data loss or operator intervention.

### Case Study 3: Addressing Specular Glare from Exposed Copper
- **Challenge**: Fresh copper traces and tin-plated solder pads act like mirrors, creating bright specular glare spots that can be misclassified as `spur` or `copper` defects.
- **System Solution**: In hardware, the inspection station uses diffuse dome LED illumination to provide uniform, shadow-free lighting. In software, when false positives occur, QA engineers use the web portal's review workflow to override verdicts with explanatory notes, creating audited records for future model fine-tuning.

---

## 55. Final 1-Page Viva Cheat Sheet

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PCB-VISION — FYP VIVA CHEAT SHEET                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • CORE GOAL: Real-time Automated Optical Inspection (AOI) for PCB micro-defects.       │
│ • DEFECT CLASSES (6): open, short, mousebite, spur, copper, pinhole.                   │
│                                                                                        │
│ • ML MODELS BENCHMARKED:                                                               │
│   - YOLOv8s (Primary): 87.60% mAP50 | 10.1 ms latency | 11.2M params | ONNX format     │
│   - YOLOv8n (Edge):    86.70% mAP50 |  3.7 ms latency |  3.2M params | ONNX format     │
│   - Faster R-CNN:      92.77% mAP50 | 114.2 ms latency| 41.5M params | Academic Ref    │
│   - RetinaNet:         92.41% mAP50 |  55.1 ms latency| 34.0M params | Dense Ref       │
│   * (YOLOv8m removed: doubled parameters & latency for only +0.8% mAP gain).           │
│                                                                                        │
│ • COMPUTER VISION PIPELINE:                                                            │
│   - Letterbox resize: 640x640 with grey padding (114, 114, 114) preserving aspect ratio│
│   - Adaptive Tiling: Triggers at aspect ratio > 1.5; 20% overlap avoids split defects  │
│   - Class-Aware NMS: IoU threshold 0.45, Confidence threshold 0.25                    │
│   - Severity: open/short = Critical; mousebite/spur = Moderate; copper/pinhole = Minor │
│                                                                                        │
│ • PLATFORM ARCHITECTURE:                                                               │
│   - Desktop (PySide6): Edge workstation, local ONNX inference, offline SQLite store    │
│   - Web Portal (Next.js 14): Full-stack management, QA overrides, CSV/JSON reports     │
│   - Mobile (Flutter): Read-only companion monitoring app for line yield & alerts       │
│   - Backend (FastAPI): Asynchronous REST API, Pydantic schemas, Swagger docs at /docs  │
│   - Cloud DB & Storage: PostgreSQL 15 & S3 storage on Supabase (`pcb-vision` bucket)   │
│                                                                                        │
│ • SECURITY & RBAC:                                                                     │
│   - JWT tokens: HS256 algorithm, 60-minute expiry, stored in localStorage              │
│   - Passwords: Salted Bcrypt hashing via Passlib                                       │
│   - Roles: admin (full access) and inspector (isolated to own inspections/reports)     │
│   - Safety Guard: Administrators cannot deactivate their own accounts                  │
│   - Critical Alerts: Automated SMTP HTML emails dispatched to active admins on shorts  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 56. Must-Memorize Numbers, Metrics & Facts

| Parameter / Metric | Exact Value | Where Used |
| :--- | :--- | :--- |
| **YOLOv8s mAP@0.5** | **87.60%** | Production model accuracy |
| **YOLOv8s Latency** | **10.1 ms** (~99 FPS) | Production model forward pass |
| **YOLOv8n mAP@0.5** | **86.70%** | Lightweight edge model accuracy |
| **YOLOv8n Latency** | **3.7 ms** (~270 FPS) | Lightweight edge model forward pass |
| **Faster R-CNN mAP50** | **92.77%** (114.2 ms) | Academic two-stage benchmark |
| **RetinaNet mAP50** | **92.41%** (55.1 ms) | Focal Loss benchmark |
| **Model Input Resolution**| **640 x 640 px** | Neural network tensor dimension |
| **Confidence Threshold**| **0.25** | Minimum score for bounding box acceptance |
| **NMS IoU Threshold** | **0.45** | Overlap threshold for box deduplication |
| **Tiling Aspect Trigger**| **1.5** | Ratio threshold activating high-res tiling |
| **Tile Stride Overlap** | **20%** (`TILE_OVERLAP = 0.2`) | Overlap between adjacent tiles |
| **Supported Defect Types**| **6 Classes** | `open`, `short`, `mousebite`, `spur`, `copper`, `pinhole` |
| **JWT Algorithm** | **HS256** | HMAC SHA-256 token signature |
| **JWT Default Expiration**| **60 Minutes** | Access token validity window |
| **Cloud Storage Bucket**| `pcb-vision` | Supabase S3-compatible image bucket |
| **Local Desktop Database**| `station.db` | SQLite database on edge workstation |
| **SMTP Alert Relay Port**| **587** | Encrypted TLS port for alert email dispatch |
| **Production Web URL** | `https://pcb-fault-detection-system.vercel.app` | Production deployment host |

---

## 57. Comprehensive Technical Glossary

- **AOI (Automated Optical Inspection)**: Automated visual inspection of printed circuit boards using cameras and computer vision to identify defects.
- **Bare Board**: A printed circuit board with etched copper traces and vias before electronic components are mounted or soldered.
- **Bcrypt**: A salted, adaptive cryptographic password hashing algorithm designed to resist brute-force attacks.
- **CIoU (Complete Intersection over Union)**: A bounding box regression loss function accounting for overlap area, aspect ratio, and center-point distance.
- **CSR (Client-Side Rendering)**: A web rendering pattern where JavaScript in the browser dynamically renders the user interface.
- **DFL (Distribution Focal Loss)**: A loss function modeling bounding box coordinates as continuous distributions to improve sub-pixel localization.
- **FastAPI**: A high-performance Python web framework based on standard type hints and ASGI.
- **GoTrue**: Supabase's open-source authentication microservice managing users, signups, and JWT issuance.
- **IoU (Intersection over Union)**: The ratio of overlap area to union area between two bounding boxes.
- **JWT (JSON Web Token)**: An open standard (RFC 7519) for transmitting claims securely as a digitally signed JSON object.
- **Letterbox**: An image transformation that resizes an image to target dimensions while preserving aspect ratio by adding neutral padding margins.
- **mAP (Mean Average Precision)**: The average of Average Precision scores across all evaluated object detection classes.
- **NMS (Non-Maximum Suppression)**: A computer vision technique that eliminates duplicate overlapping bounding boxes for detected objects.
- **ONNX (Open Neural Network Exchange)**: An open-standard format representing machine learning models for portable, optimized cross-platform execution.
- **PostgREST**: A web server that automatically turns a PostgreSQL database schema into a RESTful API.
- **PySide6**: The official Python binding for the Qt GUI framework, maintained by The Qt Company.
- **RBAC (Role-Based Access Control)**: An access control model restricting system features based on assigned user roles (`admin`, `inspector`).
- **RLS (Row Level Security)**: A PostgreSQL database feature that restricts which rows a query returns based on the executing user's session attributes.
- **SMT (Surface-Mount Technology)**: An electronics assembly method where components are mounted directly onto the surface of printed circuit boards.
- **SSR (Server-Side Rendering)**: A web rendering pattern where HTML is generated on the server on each request and sent to the client.
- **Supabase**: An open-source Backend-as-a-Service providing PostgreSQL, GoTrue authentication, PostgREST APIs, and S3-compatible storage.
- **Uvicorn**: A lightning-fast ASGI web server for Python based on `uvloop` and `httptools`.
- **YOLO (You Only Look Once)**: A family of single-stage convolutional object detection models known for high real-time inference speeds.
