# -*- coding: utf-8 -*-
"""Section 51 - 57: Code Breakdown, Authorship Defense, Troubleshooting, Scenarios, Cheat Sheet, Memorize Facts, Glossary."""

CONTENT = """## 51. 'Explain This Code' Master Breakdown

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
"""
