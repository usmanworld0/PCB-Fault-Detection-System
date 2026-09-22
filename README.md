# PCB Fault Detection System

PCB-Vision is a desktop inspection station for detecting PCB defects, backed by a FastAPI service. The desktop app accepts images or a camera feed, runs available YOLO or Torchvision models, displays annotated defects, saves work locally for offline use, and syncs inspections and model metrics to the backend.

## Architecture

```text
PySide6 desktop app  →  FastAPI backend  →  Supabase Postgres
                                      →  Supabase Storage
Next.js frontend     →  FastAPI backend only
```

Supabase Postgres stores users, inspections, defects, and model metrics. Supabase Storage stores original and annotated inspection images; the database stores their URLs, never image bytes.

## Run the desktop app

Prerequisite: Python 3.10 or newer.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Optional, to run Faster R-CNN and RetinaNet models as well:

```powershell
pip install torch torchvision
```

With no installed model, the app falls back to a demo detector. Large images are automatically tiled before inference. The app also includes **Sync models** and **Compare all models** controls.

## Run the backend

The backend is in `backend/`. It exposes JWT authentication, inspection ingestion/list/detail, model metrics ingestion/listing, and dashboard statistics.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Fill in the Supabase and JWT values in .env.
uvicorn app.main:app --reload
```

Create a Supabase project, create a public Storage bucket named `pcb-vision`, then fill `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `JWT_SECRET` in `backend/.env`. On first startup, the backend creates tables and seeds the configured admin account.

To connect the desktop app to the local backend after logging in:

```powershell
$env:PCB_API_URL = "http://localhost:8000"
$env:PCB_API_TOKEN = "<JWT returned by /auth/login>"
cd ..
python app.py
```

See [backend/README.md](backend/README.md) for every API endpoint, request example, and deployment guidance.

## Model folders

Each immediate `models/<name>/` directory represents one model:

- YOLO: `model.onnx`, `classes.txt`, `metrics.json`
- Faster R-CNN / RetinaNet: `model.pt`, `config.json`, `classes.txt`, `metrics.json`

Large model weights are stored with Git LFS. Clone normally, then run `git lfs pull` if the weights are not downloaded automatically.

## Training utilities

- `ml/prepare_data.py` — DeepPCB to YOLO data conversion
- `ml/prepare_pku.py` — PKU-Market-PCB conversion and tiling
- `ml/merge_datasets.py` — dataset merging
- `ml/train.py` — YOLOv8 training and ONNX export
- `ml/train_tv.py` — Faster R-CNN / RetinaNet training
- `ml/evaluate_all.py` — model evaluation
