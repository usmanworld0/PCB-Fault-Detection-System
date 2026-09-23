# PCB Vision Backend

This FastAPI service is the shared API for the PCB-Vision desktop station and a read-only website. It stores structured inspections and model metrics in Supabase Postgres, and inspection image files in the `pcb-vision` Supabase Storage bucket.

## Structure

```text
backend/
  app/                 FastAPI app, routes, auth, ORM, and storage client
  requirements.txt     pinned Python dependencies
  .env.example         required configuration template
```

## Prerequisites and Supabase setup

Create a Supabase project. In its SQL/database settings, copy a Postgres connection URI into `DATABASE_URL`. Create a **public** Storage bucket named `pcb-vision`, and copy the project URL and server-side service-role key. Do not expose the service-role key in the desktop client or website.

Copy `.env.example` to `.env` and fill every value. `CORS_ORIGINS` accepts a comma-separated list. Keep `.env` out of source control.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

On its first startup the service creates the tables and, only when there are no users, creates an admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Login returns a 24-hour bearer JWT by default; set `JWT_EXPIRE_HOURS` to change it. All routes except login require `Authorization: Bearer <TOKEN>`. Registration is admin-only.

Start the desktop app with its API values set before launching it:

```bash
set PCB_API_URL=http://localhost:8000
set PCB_API_TOKEN=<TOKEN>
cd ..\pcb_station
python app.py
```

For deployment, provide the same environment variables to a Python-capable host, run `pip install -r requirements.txt`, and start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Configure the host URL in the desktop `PCB_API_URL` and add the deployed website origin to `CORS_ORIGINS`.

## API examples

Set a token after login:

```bash
curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\",\"password\":\"changeme\"}"
# {"access_token":"<TOKEN>","token_type":"bearer","role":"admin"}
```

```bash
curl -X POST http://localhost:8000/auth/register -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"email\":\"engineer@example.com\",\"password\":\"safe-password\",\"role\":\"engineer\"}"
# {"id":"<uuid>","email":"engineer@example.com","role":"engineer","created_at":"..."}
```

```bash
curl -X POST http://localhost:8000/inspections/ingest -H "Authorization: Bearer <TOKEN>" -F "captured_at=2026-09-22T12:00:00+00:00" -F "source=board.jpg" -F "result={\"status\":\"FAIL\",\"model\":\"yolov8s\",\"inference_ms\":42.1,\"defects\":[{\"class\":\"short\",\"confidence\":0.91,\"box\":[10,20,50,80],\"severity\":\"Critical\"}]}" -F "image=@board.jpg" -F "annotated=@board_annotated.jpg"
# {"id":"<uuid>"}
```

```bash
curl "http://localhost:8000/inspections?status=FAIL&model=yolov8s&limit=50" -H "Authorization: Bearer <TOKEN>"
# {"total":1,"items":[{"id":"<uuid>","captured_at":"...","status":"FAIL","model":"yolov8s","defect_count":1,"image_url":"https://..."}]}

curl http://localhost:8000/inspections/<uuid> -H "Authorization: Bearer <TOKEN>"
# {"id":"<uuid>","source":"board.jpg","image_url":"https://...","annotated_url":"https://...","defects":[{"class":"short","confidence":0.91,"severity":"Critical","box_x1":10,"box_y1":20,"box_x2":50,"box_y2":80}]}
```

```bash
curl -X POST http://localhost:8000/models/ingest -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"name\":\"yolov8s\",\"arch\":\"yolov8\",\"dataset\":\"DeepPCB\",\"map50\":0.876,\"precision\":0.905,\"recall\":0.896}"
# {"id":"<uuid>","name":"yolov8s","arch":"yolov8","map50":0.876,"metrics_json":{"name":"yolov8s",...}}

curl http://localhost:8000/models -H "Authorization: Bearer <TOKEN>"
# [{"name":"yolov8s","map50":0.876,"metrics_json":{"name":"yolov8s",...}}]

curl http://localhost:8000/stats -H "Authorization: Bearer <TOKEN>"
# {"total_inspections":1,"pass_count":0,"fail_count":1,"total_defects":1,"defects_by_class":{"short":1},"defects_by_severity":{"Critical":1},"trend_last_30_days":[{"date":"2026-09-22","inspections":1,"defects":1}]}
```
