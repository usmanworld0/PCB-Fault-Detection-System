# -*- coding: utf-8 -*-
"""Section 01 - 05: Overview, Elevator Pitches, Problem Statement, Objectives."""

CONTENT = """# PCB-Vision - Final Year Project (FYP) Viva Master Document & Technical Defense Manual

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
"""
