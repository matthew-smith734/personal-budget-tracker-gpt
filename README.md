# Personal Budget Tracker

A self-hosted personal budget tracker with envelope budgeting, CSV/XLSX import, and a responsive light/dark UI. Designed for deployment on a Proxmox VM via Docker Compose with ZFS-mounted volume persistence.

## Architecture

```
├── backend/          # FastAPI + SQLAlchemy + SQLite
├── frontend/         # React + Vite + Tailwind CSS
├── docker-compose.yml
└── README.md
```

- **Backend**: FastAPI (Python), SQLAlchemy ORM, SQLite (default), Alembic migrations
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Deployment**: Docker Compose with named volume for DB persistence

## Features

| Feature | Status |
|---|---|
| Envelope budget system (assign funds, track available) | ✅ |
| Multiple accounts (checking, savings, credit, cash, etc.) | ✅ |
| Transaction CRUD (manual entry, date/amount/description/status) | ✅ |
| Category system tied to envelopes | ✅ |
| CSV & XLSX import with preview before commit | ✅ |
| Duplicate detection (date + amount + description matching) | ✅ |
| CSV & XLSX export | ✅ |
| Dashboard overview (summary stats, envelope balances, recent transactions) | ✅ |
| Light/dark theme toggle with localStorage persistence | ✅ |
| Responsive layout with collapsible sidebar | ✅ |
| Health check endpoint | ✅ |
| Alembic database migrations | ✅ |
| Docker Compose deployment | ✅ |
| Unit tests (import parser, deduplication) | ✅ |
| Integration tests (API + DB) | ✅ |

## Quick Start

### With Docker Compose (recommended)

```bash
# Clone the repository
git clone <repo-url>
cd personal-budget-tracker-gpt

# (Optional) Set a custom DB path — defaults to ./data
export DB_VOLUME_PATH=/mnt/zfs/budget

# Build and start
docker compose up -d

# The app will be available at:
# Frontend: http://localhost
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
mkdir -p data

# Run migrations
python -m alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:3000
```

## Deployment on Proxmox VM

1. Install Docker and Docker Compose on the VM
2. Clone the repository to the VM
3. Set `DB_VOLUME_PATH` to your ZFS dataset mount point:
   ```bash
   export DB_VOLUME_PATH=/mnt/zfs-pool/budget
   ```
4. Run `docker compose up -d`

The SQLite database will be stored at `$DB_VOLUME_PATH/budget.db` on the ZFS mount.

## CSV/XLSX Import Format

The importer normalizes column names across different bank export formats:

| Standard Column | Accepted Names |
|---|---|
| Date | date, transaction date, trans date, posting date, value date |
| Amount | amount, transaction amount, debit, credit, value |
| Description | description, memo, payee, narrative, details, merchant |

**Amount formats supported:** `$1,234.56`, `-50.00`, `(50.00)` (parentheses = negative)

## API Reference

Interactive API docs are available at `http://localhost:8000/docs` (Swagger UI).

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET/POST | `/api/accounts/` | List / create accounts |
| PUT/DELETE | `/api/accounts/{id}` | Update / delete account |
| GET/POST | `/api/transactions/` | List / create transactions |
| GET | `/api/transactions/summary` | Income/expense summary |
| GET/POST | `/api/envelopes/` | List / create envelopes |
| POST | `/api/envelopes/{id}/assign` | Assign funds to envelope |
| GET/POST | `/api/categories/` | List / create categories |
| POST | `/api/imports/preview` | Preview CSV/XLSX import |
| POST | `/api/imports/commit` | Commit import to DB |
| GET | `/api/exports/transactions/csv` | Export as CSV |
| GET | `/api/exports/transactions/xlsx` | Export as XLSX |

## Testing

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

**Test coverage:**
- `test_health.py` — health endpoint
- `test_accounts.py` — account CRUD
- `test_transactions.py` — transaction CRUD + summary
- `test_dedup.py` — duplicate detection logic
- `test_imports.py` — CSV/XLSX parsing
- `test_integration.py` — API + DB integration (envelopes, export, etc.)

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./data/budget.db` | Database connection URL |
| `DB_VOLUME_PATH` | `./data` | Host path for Docker volume mount |

## License

MIT