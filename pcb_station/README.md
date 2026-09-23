# PCB-Vision Inspection Station

This folder contains the PCB inspection desktop application and its FastAPI backend. It is one component of the repository: the companion `mobile/` folder is a separate client application.

## Architecture

```text
PySide6 desktop station  ──REST + JWT──┐
                                       │
Flutter mobile app       ──REST + JWT──┼──> FastAPI backend ──> Supabase Postgres
                                       │                         Supabase Storage
Future web app           ──REST + JWT──┘
```

The desktop station runs detection locally. It saves inspections to local SQLite first, so it can work offline, then synchronizes pending records to the API when a connection is available.

## Data ownership — important

| Data | System | Who accesses it |
|---|---|---|
| Desktop offline queue and cached images | Local SQLite (`data/station.db`) | Desktop app only |
| Users, inspections, defects, and model metrics | Supabase Postgres | FastAPI backend only |
| Original and annotated inspection images | Supabase Storage bucket `pcb-vision` | FastAPI backend only |

Mobile and web clients **must never connect directly** to Supabase Postgres or Storage. They call the FastAPI API over HTTPS. Supabase service keys must stay only in `backend/.env` and must never be placed in Flutter, JavaScript, or desktop source code.

## Folder layout

```text
pcb_station/
├── app.py                 Desktop app entry point
├── core/                  Detection, local storage, sync, comparison logic
├── ui/                    PySide6 desktop interface
├── models/                Detection model files and their metrics
├── data/                  Local SQLite inspection queue and saved images
├── ml/                    Dataset preparation, training, and evaluation scripts
└── backend/               FastAPI API service
```

## Run the desktop station

Prerequisite: Python 3.10 or later. Run these commands from the repository root:

### 1. Clone the repository with Git LFS — do not use “Download ZIP”

The trained `.onnx` and `.pt` model weights are large files stored with **Git LFS**. A normal GitHub ZIP download contains only small LFS pointer files, not the actual weights, so the application will open but cannot load its detection models.

Install [Git LFS](https://git-lfs.com/) once, then clone the repository and retrieve the weights:

```powershell
git lfs install
git clone https://github.com/usmanworld0/PCB-Fault-Detection-System.git
cd PCB-Fault-Detection-System
git lfs pull
```

After `git lfs pull` completes, the real model files are present under `pcb_station/models/`. If a file such as `models/yolov8s/model.onnx` begins with `version https://git-lfs.github.com/spec/v1`, it is only an LFS pointer and `git lfs pull` has not completed successfully.

### 2. Create the Python environment and start the app

```powershell
cd pcb_station
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

For Faster R-CNN and RetinaNet support as well:

```powershell
pip install torch torchvision
```

The desktop app can run with images, folders, or a compatible USB camera. **Save result** writes an inspection locally. **Sync to server** sends pending inspections once backend access is configured. **Sync models** uploads each immediate model folder’s metrics. **Compare all models** runs every available non-demo detector against the current image.

## Run the backend

The backend requires a Supabase project before it can persist/sync data.

1. Create a Supabase project.
2. Create a **public** Storage bucket named `pcb-vision`.
3. Copy the Postgres connection string, project URL, and service-role key from Supabase project settings.
4. Run:

```powershell
cd pcb_station\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` with real values:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-server-only-service-role-key
SUPABASE_BUCKET=pcb-vision
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRE_HOURS=24
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-this-before-use
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Start the API:

```powershell
uvicorn app.main:app --reload
```

On the first start, the backend creates its tables and seeds one admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Detailed endpoint documentation and curl examples are in [backend/README.md](backend/README.md).

## Connect the desktop app

First log in through `POST /auth/login` to receive a JWT. Then, in the terminal used to launch the desktop app:

```powershell
$env:PCB_API_URL = "http://localhost:8000"
$env:PCB_API_TOKEN = "<JWT returned by /auth/login>"
cd pcb_station
python app.py
```

For deployment, replace `http://localhost:8000` with the HTTPS API URL.

## Build future mobile or web clients

Mobile and web apps are **read-only consumers for now**. They should:

1. Log in with `POST /auth/login` and retain the JWT in secure storage.
2. Send `Authorization: Bearer <token>` on every API request after login.
3. Use these routes:
   - `GET /stats` — dashboard counts, defect breakdowns, 30-day trend
   - `GET /inspections` — paginated inspection list with filters
   - `GET /inspections/{id}` — inspection details, image URLs, and defects
   - `GET /models` — model metrics and full metrics JSON
4. Display `image_url` and `annotated_url` returned by the API; do not build Supabase Storage URLs yourself.
5. Use a configurable API base URL. Local development uses `http://localhost:8000`; deployed clients use the API’s HTTPS URL.

When a browser frontend is deployed, add its origin to `CORS_ORIGINS` in the backend environment. Do not add client secrets to this repository.

## Authentication and roles

The backend uses JWT bearer tokens. Login is public; every other API endpoint requires a valid token. Roles are `admin`, `engineer`, and `viewer`. Registration is admin-only. The current mobile/web reading endpoints can be used by every authenticated role.

## Model folders

Each immediate `models/<name>/` folder represents one available model:

- YOLO: `model.onnx`, `classes.txt`, `metrics.json`
- Faster R-CNN / RetinaNet: `model.pt`, `config.json`, `classes.txt`, `metrics.json`

Training and evaluation utilities live in `ml/`. They are separate from normal desktop/backend startup.
