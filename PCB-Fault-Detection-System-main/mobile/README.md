# PCB-Vision Mobile

Flutter companion app for the PCB-Vision fault detection system. Connects to the FastAPI backend to provide a mobile inspection dashboard.

## Features

- **Dashboard** — Real-time stats, defect-by-class breakdown, severity pie chart, 30-day trend
- **Inspections** — Browse and filter inspection history, view original/annotated images
- **Models** — View registered model performance metrics (mAP, precision, recall, F1)
- **Settings** — Server connection info, profile, sign out

## Setup

```bash
cd mobile
flutter pub get
flutter run
```

Enter your backend server URL (e.g. `http://192.168.1.100:8000`) and credentials on the login screen.

## Requirements

- Flutter 3.32+
- Dart 3.8+
- A running PCB-Vision backend instance
