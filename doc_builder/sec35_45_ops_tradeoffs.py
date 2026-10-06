# -*- coding: utf-8 -*-
"""Section 35 - 45: Environment Variables, Security, Error Handling, Performance, Deployment, Decisions, Trade-offs, Limitations, Future Work."""

CONTENT = """## 35. Environment Variables Reference

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
"""
