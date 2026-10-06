# -*- coding: utf-8 -*-
"""Section 46 - 50: Viva Questions & Answers (Basic, Intermediate, Advanced, Traps, Rapid-Fire)."""

CONTENT = """## 46. Basic Viva Questions

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
**Answer**: $640 \times 640$ pixels with 3 RGB color channels (`[1, 3, 640, 640]`).

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
**Answer**: Standard NMS suppresses all overlapping bounding boxes regardless of class. In PCB manufacturing, different defect types (like a `mousebite` right next to an `open` circuit) can co-occur. Class-aware NMS adds an offset ($C \times 4096$) based on class ID $C$, ensuring boxes of different classes do not suppress each other.

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
$$\text{FL}(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$$
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
**Answer**: Given candidate bounding boxes sorted by confidence, NMS takes the highest-confidence box $B_{\text{max}}$ and computes its IoU with every other overlapping candidate $B_i$:
$$\text{IoU}(B_{\text{max}}, B_i) = \frac{\text{Area}(B_{\text{max}} \cap B_i)}{\text{Area}(B_{\text{max}} \cup B_i)}$$
If $\text{IoU} > \text{threshold}$ (e.g., 0.45), $B_i$ is suppressed as a redundant detection.

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
21. **What input size does the model expect?** $640 \times 640$ pixels.
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
"""
