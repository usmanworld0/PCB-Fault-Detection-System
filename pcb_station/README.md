<div align="center">

# 🔬 PCB-Vision — Intelligent PCB Fault Detection System

**An end-to-end deep learning platform for automated printed circuit board defect inspection**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PySide6](https://img.shields.io/badge/PySide6-Qt6-41CD52?style=for-the-badge&logo=qt&logoColor=white)](https://doc.qt.io/qtforpython/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF6F00?style=for-the-badge&logo=yolo&logoColor=white)](https://docs.ultralytics.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Detect **open circuits, shorts, mouse bites, spurs, copper defects, and missing holes** with up to **92.8% mAP@50** — in real-time, from a desktop GUI or live camera feed.*

---

[Key Features](#-key-features) · [System Architecture](#-system-architecture) · [Model Performance](#-model-performance) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Training Pipeline](#-training-pipeline)

</div>

---

## 📌 Overview

**PCB-Vision** is a complete inspection platform that combines custom-trained deep learning models with a production-grade desktop application and cloud-synced backend. It was built to solve a real-world manufacturing problem: identifying microscopic defects on printed circuit boards that are invisible to the naked eye.

The system processes PCB images through multiple detection architectures (YOLOv8, Faster R-CNN, RetinaNet), classifies defects into **6 categories** with severity grading, and stores full inspection histories — all from a single desktop workstation that works **offline-first** and syncs results when connected.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🖥️ Desktop Inspection Station
- **Real-time camera feed** with live inference
- **Image & batch folder** inspection modes
- Side-by-side original vs. annotated view
- Adjustable confidence threshold slider
- **One-click model comparison** across all loaded architectures
- Defect table with class, confidence, severity, and bounding box
- Auto-save frames that contain defects

</td>
<td width="50%">

### ☁️ Cloud-Synced Backend
- **JWT-authenticated** REST API (FastAPI)
- Role-based access control (Admin / Engineer)
- Inspection ingestion with image upload to **Supabase Storage**
- Model metrics registry & dashboard statistics
- 30-day defect trend analytics
- CORS-ready for web frontend integration

</td>
</tr>
<tr>
<td>

### 🧠 Multi-Model AI Engine
- **YOLOv8** (Nano & Small) via ONNX Runtime
- **Faster R-CNN** (ResNet-50 FPN v2) via PyTorch
- **RetinaNet** (ResNet-50 FPN v2) via PyTorch
- Automatic **image tiling** for high-resolution boards
- Class-aware NMS for precise localization
- Severity classification (Critical / Moderate / Minor)

</td>
<td>

### 🛠️ Full ML Pipeline
- Dataset preparation scripts (DeepPCB → YOLO format)
- PKU-Market-PCB conversion & tiling pipeline
- Multi-dataset merging utility
- YOLOv8 training + ONNX export script
- Faster R-CNN / RetinaNet training script
- Unified model evaluation & benchmarking

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PCB-VISION PLATFORM                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐         ┌──────────────────┐  ┌─────────────┐  │
│   │  PySide6 Desktop │────────▶│  FastAPI Backend │◀─│ Flutter App │  │
│   │   Application    │  REST   │   (uvicorn)      │  │  (Mobile)   │  │
│   │                  │  + JWT  │                  │  │             │  │
│   │  • Camera feed   │         │  /auth/login     │  │ • Dashboard │  │
│   │  • Image input   │         │  /auth/register  │  │ • Charts    │  │
│   │  • Batch folders │         │  /inspections/*  │  │ • Details   │  │
│   │  • Model compare │         │  /models/*       │  │ • Models    │  │
│   │  • Offline store │         │  /stats          │  │ • Settings  │  │
│   └────────┬─────────┘         └────────┬─────────┘  └─────────────┘  │
│            │                            │                            │
│   ┌────────▼─────────┐         ┌────────▼──────────┐                 │
│   │   SQLite (local)  │         │ Supabase Postgres │                 │
│   │   Offline-first   │         │ + Supabase Storage│                 │
│   │   inspection log  │         │ (images/metadata) │                 │
│   └──────────────────┘         └───────────────────┘                 │
│                                                                      │
│   ┌──────────────────────────────────────────────────┐               │
│   │              Detection Engine (core/)             │               │
│   │                                                    │              │
│   │   OnnxYoloDetector ─── YOLOv8n / YOLOv8s (ONNX)  │              │
│   │   TorchvisionDetector ─ Faster R-CNN / RetinaNet  │              │
│   │   BaseDetector ──── Tiling · NMS · Severity       │               │
│   └──────────────────────────────────────────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Model Performance

All models were trained on the **DeepPCB** and **PKU-Market-PCB** datasets and evaluated on held-out test splits.

| Model | Architecture | mAP@50 | Precision | Recall | F1 Score | Inference (GPU) |
|:------|:-------------|:------:|:---------:|:------:|:--------:|:---------------:|
| **Faster R-CNN** | ResNet-50 FPN v2 | **92.77%** | 83.40% | **94.70%** | 88.69% | 114.2 ms |
| **RetinaNet** | ResNet-50 FPN v2 | 92.41% | 79.74% | 94.30% | 86.41% | 55.1 ms |
| **YOLOv8s** | YOLOv8-Small | 87.60% | **90.54%** | 89.56% | **90.05%** | 10.1 ms |
| **YOLOv8n** | YOLOv8-Nano | 86.68% | 86.38% | 89.98% | 88.14% | **3.7 ms** |

### Defect Classes Detected

| Defect Type | Description | Severity |
|:------------|:------------|:--------:|
| 🔴 **Open** | Broken trace / open circuit | Critical |
| 🔴 **Short** | Unintended copper bridge | Critical |
| 🟡 **Mouse Bite** | Irregular edge nibbling | Moderate |
| 🟡 **Spur** | Unwanted copper protrusion | Moderate |
| 🟢 **Copper** | Excess copper residue | Minor |
| 🟢 **Missing Hole** | Absent via / mounting hole | Minor |

> **Severity grading** is rule-based: `open` and `short` defects are classified as **Critical** (conf ≥ 0.6) or Moderate; all others are Moderate (conf ≥ 0.6) or Minor.

---

## 🚀 Quick Start

### Prerequisites

- Python **3.10+**
- Git LFS (for downloading model weights)

### 1. Clone & Install

```powershell
git clone https://github.com/usmanworld0/PCB-Fault-Detection-System.git
cd PCB-Fault-Detection-System
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> **Optional** — To enable Faster R-CNN and RetinaNet models:
> ```powershell
> pip install torch torchvision
> ```

### 2. Pull Model Weights

Model weights are tracked with **Git LFS**. If they weren't downloaded during clone:

```powershell
git lfs pull
```

### 3. Launch the Desktop App

```powershell
python app.py
```

The app opens the **PCB-Vision Inspection Station** — select a model from the dropdown, load an image or start the live camera feed, and inspect.

> Without any installed model, the app falls back to a built-in demo detector for UI exploration.

---

## ⚙️ Backend Setup

The FastAPI backend provides cloud persistence, user management, and dashboard analytics.

### 1. Configure Supabase

1. Create a [Supabase](https://supabase.com) project
2. Create a **public** Storage bucket named `pcb-vision`
3. Copy the Postgres connection URI, project URL, and service-role key

### 2. Install & Run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Fill DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET in .env
uvicorn app.main:app --reload
```

On first startup, the backend automatically:
- Creates all database tables
- Seeds an admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`

### 3. Connect Desktop App to Backend

```powershell
$env:PCB_API_URL = "http://localhost:8000"
$env:PCB_API_TOKEN = "<JWT from /auth/login>"
python app.py
```

### 4. Run Mobile Companion App (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

📖 See [`backend/README.md`](backend/README.md) for API docs and [`mobile/README.md`](mobile/README.md) for mobile app setup.

---

## 🧪 Training Pipeline

End-to-end scripts for dataset preparation, training, and evaluation are in the [`ml/`](ml/) directory.

### Dataset Preparation

```bash
# Convert DeepPCB dataset to YOLO format
python ml/prepare_data.py

# Convert PKU-Market-PCB with tiling
python ml/prepare_pku.py

# Merge multiple datasets
python ml/merge_datasets.py
```

### Model Training

```bash
# Train YOLOv8 + export to ONNX
python ml/train.py --model yolov8s.pt --name yolov8s --data pcb.yaml --epochs 50

# Train Faster R-CNN or RetinaNet
python ml/train_tv.py --arch fasterrcnn --data pcb_yolo/ --epochs 12
```

### Evaluation

```bash
# Benchmark all models side-by-side
python ml/evaluate_all.py
```

---

## 🔧 Tech Stack

| Layer | Technologies |
|:------|:-------------|
| **Desktop App** | PySide6 (Qt6), OpenCV, ONNX Runtime |
| **Mobile App** | Flutter 3, Dart 3, Material 3 Dark, fl_chart, Provider |
| **Detection Models** | YOLOv8 (Ultralytics), Faster R-CNN, RetinaNet (Torchvision) |
| **Backend API** | FastAPI, SQLAlchemy, Pydantic, PyJWT |
| **Database** | Supabase Postgres (cloud), SQLite (local offline) |
| **Storage** | Supabase Storage (cloud image bucket) |
| **ML Training** | Ultralytics, PyTorch, Torchvision |
| **Datasets** | DeepPCB, PKU-Market-PCB |


