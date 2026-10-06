# -*- coding: utf-8 -*-
"""Section 21 - 24: Database Architecture, Supabase Integration, Storage Architecture, Image Processing Pipeline."""

CONTENT = """## 21. Database Architecture

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
Standard resizing directly to $640 \times 640$ distorts rectangular circuit boards, stretching circular vias into ovals and distorting microscopic trace geometry.
- **Our Implementation**: The `letterbox()` algorithm in `core/detector.py` calculates the scaling ratio:
  $$r = \min\left(\frac{640}{H}, \frac{640}{W}\right)$$
- The image is scaled by $r$, and the remaining margins are filled with neutral grey padding (`rgb(114, 114, 114)`), preserving trace aspect ratios and geometric integrity.

### 2. High-Resolution Adaptive Grid Tiling
Industrial circuit boards often have dimensions of $3000 \times 2000$ pixels or higher, while microscopic defects like pinholes or spurs may measure only $8 \times 8$ pixels.
- **The Downsampling Problem**: If a $3000 \times 2000$ image is downsampled directly to $640 \times 640$, an $8 \times 8$ defect shrinks to less than $1.7 \times 1.7$ pixels, falling below the receptive field threshold of convolutional feature maps and causing false negatives.
- **Our Tiling Solution**:
  - `TILE_TRIGGER = 1.5`: When an image exceeds the aspect ratio threshold or minimum resolution limit, the adaptive tiling engine activates.
  - The image is sliced into overlapping sub-tiles with a `TILE_OVERLAP = 0.2` (20% overlap). The 20% overlap ensures that defects situated directly on tile boundaries are never sliced in half.
  - Each tile is inferred independently.
  - **Coordinate Remapping**: Detected bounding boxes on sub-tiles are projected back to the global coordinate space using the tile's horizontal and vertical offsets:
    $$x_{\text{global}} = x_{\text{tile}} + \text{offset}_x, \quad y_{\text{global}} = y_{\text{tile}} + \text{offset}_y$$
  - Global Class-Aware Non-Maximum Suppression (NMS) is applied to eliminate redundant overlapping detections in the tile seam zones.
"""
