import os
from pathlib import Path
import psycopg2

def run_migration():
    env_file = Path(__file__).resolve().parent.parent / "backend" / ".env"
    db_url = None
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if k.strip() == "DATABASE_URL":
                    db_url = v.strip()
                    break

    if not db_url:
        db_url = os.environ.get("DATABASE_URL")

    if not db_url:
        print("DATABASE_URL not found!")
        return

    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()

    sql_statements = [
        "ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pcb_id TEXT;",
        "ALTER TABLE inspections ADD COLUMN IF NOT EXISTS image_index INTEGER NOT NULL DEFAULT 1;",
        "CREATE INDEX IF NOT EXISTS idx_inspections_pcb_id ON inspections (pcb_id);",
        "CREATE INDEX IF NOT EXISTS idx_inspections_pcb_image ON inspections (pcb_id, image_index);",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS summary_json JSONB;",
        "NOTIFY pgrst, 'reload schema';"
    ]

    for stmt in sql_statements:
        print(f"Executing: {stmt}")
        cursor.execute(stmt)

    cursor.execute("""
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'inspections'
          AND column_name IN ('pcb_id', 'image_index');
    """)
    rows = cursor.fetchall()
    print("Verification columns in inspections table:")
    for r in rows:
        print(" -", r)

    cursor.close()
    conn.close()
    print("Migration applied successfully and PostgREST schema cache reloaded!")

if __name__ == "__main__":
    run_migration()
