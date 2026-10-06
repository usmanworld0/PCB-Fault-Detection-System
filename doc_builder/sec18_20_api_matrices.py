# -*- coding: utf-8 -*-
"""Section 18 - 20: Complete API Reference, Button-to-API Traceability Matrix, Button-to-Database Query Traceability."""

CONTENT = """## 18. Complete API Reference

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
"""
