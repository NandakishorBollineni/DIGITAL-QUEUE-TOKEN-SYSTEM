# Digital Queue Token System

An intelligent, centralized, and concurrency-safe queue management web application built using **MongoDB (NoSQL)**, **Python Flask**, and **React.js (Vite)**.

---

## 1. Academic Project Information

- **Project Title:** Digital Queue Token System
- **Student Name:** Bollineni Nanda Kishor
- **Registration Number:** `12321100`
- **Roll Number:** `11`
- **Section / Program:** K23DF / B.Tech Computer Science & Engineering
- **Course Code & Title:** CSE494 — Intelligent NoSQL Databases
- **Faculty Guide:** Shaik Sana Begum (Assistant Professor)
- **University:** Lovely Professional University, Phagwara, Punjab
- **Academic Year:** 2026–2027

---

## 2. MongoDB Compass Connection Link

To inspect the database, collections, JSON schema validators, compound indexes, and live documents in **MongoDB Compass**, connect using:

```text
mongodb://127.0.0.1:27017/digital_queue
```

*Or for standard local host:*
```text
mongodb://localhost:27017/digital_queue
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | MongoDB Community Server (v7+) / MongoDB Atlas | Primary document-oriented NoSQL database |
| **Python Driver** | PyMongo (v4.19.0) | High-performance MongoDB driver with atomic operators |
| **Backend API** | Python (v3.13) + Flask (v3.1) + Flask-CORS | REST API, lifecycle validation, and aggregation endpoints |
| **Frontend UI** | React.js (v18.3) + Vite (v5.4) + Lucide React | Responsive SaaS dashboard, queue board, and staff console |
| **Styling** | Vanilla CSS3 (Custom Design System) | Modern Indigo/Navy surfaces, glassmorphism, micro-animations |
| **Testing** | Automated Suite (`run_tests.py`) + Pytest | 17 verified test cases covering CRUD, concurrency & indexes |

---

## 4. Key System Features

1. **Executive Queue Dashboard**: Real-time KPI counters (Total, Waiting, Serving, Completed, Cancelled), service-wise progress bars, recent activity feed, and date selector.
2. **Visitor Token Kiosk**: Input validation, double-submission lock, atomic number allocation, and printable token slips.
3. **Live Public Queue Board**: "Now Serving" counter spotlight, deterministic queue positioning (`#1`, `#2`, etc.), search/filter, and auto-refresh polling (every 5 seconds).
4. **Token Status Tracking**: Self-service lookup by Token Number & Service or MongoDB `ObjectId`, complete with an interactive 3-step lifecycle timeline.
5. **Staff Counter Console**: Demo staff dashboard with atomic `Call Next` claiming, `Mark Completed`, and `Cancel Token` with confirmation modals.
6. **Analytics & Aggregation Reports**: Grouped by status, service, and daily trends using native MongoDB aggregation pipelines (`$match`, `$group`, `$sort`).

---

## 5. The Six Core NoSQL Concepts Implemented

### 1. CRUD Operations & Non-Destructive Cancellation
- **Create**: Inserts token document via `insert_one` after atomic sequence increment.
- **Read**: Reads queue and tokens via `find` and `find_one` with deterministic sorting and projections.
- **Update**: Conditional updates via `find_one_and_update` matching both `_id` and expected `status`.
- **Delete / Retention**: Normal cancellations update status to `cancelled` with `cancelled_at` timestamp rather than physical deletion, preserving audit history.

### 2. Querying & Filtering
- Scoped lookups by `service`, `service_date`, and `status`.
- Sorted deterministically by `[("token_number", 1), ("_id", 1)]`.
- Search support for visitor name regex and token integers.

### 3. Native Aggregation Pipelines
Status counts and daily analytics run directly inside the database engine:
```python
pipeline = [
    {"$match": {"service_date": "2026-10-27"}},
    {
        "$group": {
            "_id": {"service": "$service", "status": "$status"},
            "token_count": {"$sum": 1}
        }
    },
    {"$sort": {"_id.service": 1, "_id.status": 1}}
]
tokens.aggregate(pipeline)
```

### 4. Indexing Strategy
- **Compound Unique Index**: `[("service", 1), ("service_date", 1), ("token_number", 1)]` (`uq_service_day_token`). Enforces service-day sequence uniqueness.
- **Queue Lookup Index**: `[("service", 1), ("service_date", 1), ("status", 1), ("token_number", 1)]` (`ix_queue_lookup`). Accelerates waiting queue queries.
- **Date Status Index**: `[("service_date", 1), ("status", 1), ("token_number", 1)]` (`ix_date_status_token`).

### 5. Dual-Layer Validation
- **Application Level**: Validates visitor name (2–100 chars), allowed services, and permitted state transitions in Flask.
- **Database Level**: Strict MongoDB `$jsonSchema` validator enforced directly on the `tokens` collection.

### 6. Query Optimization & Execution Plans
- Script `backend/scripts/explain_queries.py` executes `.explain()` and records:
  - `IXSCAN` index traversal vs `COLLSCAN`
  - `totalKeysExamined` vs `nReturned` (achieving optimal 1:1 ratio)
  - Execution times in milliseconds (0–2 ms).

---

## 6. Directory Structure

```text
nanda_nosql/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory, CORS & error handlers
│   │   ├── config.py                # Environment configurations
│   │   ├── database.py              # MongoClient singleton & BSON serializer
│   │   ├── routes/
│   │   │   ├── health.py            # /api/health
│   │   │   ├── tokens.py            # /api/tokens, /api/tokens/<id>
│   │   │   ├── queue.py             # /api/queue, /api/queue/call-next
│   │   │   └── analytics.py         # /api/analytics/summary, /api/analytics/daily
│   │   ├── services/
│   │   │   ├── token_service.py     # Concurrency-safe atomic token generator
│   │   │   └── analytics_service.py # Aggregation pipelines
│   │   └── validators/
│   │       └── token_validator.py   # State transitions & input sanitization
│   ├── scripts/
│   │   ├── init_db.py               # Applies schema validation & indexes
│   │   ├── seed_demo_data.py        # Populates realistic test documents
│   │   └── explain_queries.py       # MongoDB explain executionStats analyzer
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api_and_db.py       # T01-T15 validation and functional test cases
│   │   ├── test_concurrency.py      # T16 multithreaded allocation & race condition tests
│   │   └── run_tests.py             # Automated test reporter
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   └── run.py                       # Backend server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Header with active tabs & MongoDB status dot
│   │   │   ├── StatusBadge.jsx      # Accessible status badge with pulse indicator
│   │   │   ├── ConfirmModal.jsx     # Action confirmation dialogs
│   │   │   └── Toast.jsx            # Alert toasts
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Summary KPI cards & service breakdown
│   │   │   ├── GenerateToken.jsx    # Visitor token kiosk & printable slips
│   │   │   ├── LiveQueue.jsx        # Public queue board with auto-refresh polling
│   │   │   ├── TrackToken.jsx       # Self-service status & lifecycle timeline
│   │   │   ├── StaffQueue.jsx       # Staff counter control console
│   │   │   ├── Analytics.jsx        # MongoDB aggregation charts & explanations
│   │   │   └── About.jsx            # Academic credits & Compass connect link
│   │   ├── services/
│   │   │   └── api.js               # Async fetch client for backend endpoints
│   │   ├── App.jsx                  # Root application layout
│   │   ├── index.css                # Polished design system stylesheet
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── .env
├── README.md
└── .gitignore
```

---

## 7. Local Setup & Execution Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm (tested on Node v22.16)
- MongoDB Community Server running locally on `localhost:27017`
- MongoDB Compass (optional, for graphical inspection)

---

### Step 1: Initialize Database & Indexes
In PowerShell / terminal from project root:
```powershell
python backend/scripts/init_db.py
```
*Creates the `digital_queue` database, JSON Schema validation, and all compound indexes.*

---

### Step 2: Seed Demo Data (Optional)
```powershell
python backend/scripts/seed_demo_data.py
```
*Inserts realistic tokens across Admissions, Billing, Document Verification, and General Enquiry.*

---

### Step 3: Run MongoDB Query Optimization & Execution Plan Analysis
```powershell
python backend/scripts/explain_queries.py
```
*Demonstrates `IXSCAN` index traversal on compound indexes with execution statistics.*

---

### Step 4: Run the Automated Test Suite
```powershell
python backend/tests/run_tests.py
```
*Executes all 17 automated tests, including multithreaded concurrency tests for token allocation and race conditions.*

---

### Step 5: Start the Flask Backend Server
```powershell
python backend/run.py
```
*Starts the API on `http://127.0.0.1:5050`.*

---

### Step 6: Start the React Frontend Application
In a separate terminal tab:
```powershell
cd frontend
npm install
npm run dev
```
*Access the user interface in your browser at `http://localhost:5173/` or `http://localhost:5174/`.*

---

## 8. Automated Test Execution Results

All 17 automated test cases were executed directly against the local MongoDB instance:

| Test ID | Test Description | Target | Result |
| :--- | :--- | :--- | :--- |
| **T01** | Health endpoint & valid token creation | `/api/health`, `/api/tokens` | **PASSED** (201, waiting) |
| **T02** | Retrieve queue for service | `/api/queue?service=Admissions` | **PASSED** (deterministic sort) |
| **T03** | Search token by ID and scoped number | `/api/tokens/<id>`, `/api/tokens/number` | **PASSED** (matched document) |
| **T04** | State transition: `waiting` &rarr; `serving` | `/api/tokens/<id>/call` | **PASSED** (`called_at` set) |
| **T05** | State transition: `serving` &rarr; `completed` | `/api/tokens/<id>/complete` | **PASSED** (`completed_at` set) |
| **T06** | Token cancellation & audit preservation | `/api/tokens/<id>/cancel` | **PASSED** (`status=cancelled`, record preserved) |
| **T07** | Native aggregation summary pipeline | `/api/analytics/summary` | **PASSED** (matched counts) |
| **T08** | Duplicate scoped token number rejection | Compound unique index | **PASSED** (`DuplicateKeyError` raised) |
| **T09** | Disallowed status rejection | Request validator | **PASSED** (invalid status blocked) |
| **T10** | Empty visitor name rejection | Request validator | **PASSED** (HTTP 400 bad request) |
| **T11** | Skip serving transition conflict | State machine validator | **PASSED** (HTTP 409 conflict returned) |
| **T12** | Direct write schema violation rejection | MongoDB `$jsonSchema` | **PASSED** (`WriteError` raised by engine) |
| **T13** | Verify index information | `tokens.index_information()` | **PASSED** (unique & lookup indexes verified) |
| **T14** | Query executionStats inspection | `tokens.find().explain()` | **PASSED** (`IXSCAN` plan verified) |
| **T15** | Pagination limit clamping | `/api/tokens?limit=9999` | **PASSED** (clamped to &le; 100) |
| **T16** | 10 concurrent threads token allocation | Multithreaded test | **PASSED** (100% unique sequence numbers) |
| **T17** | Concurrent staff `call-next` race safety | `find_one_and_update` | **PASSED** (zero double-claims) |

**Test Execution Summary:**
- **Tests Implemented:** 17
- **Tests Executed:** 17
- **Tests Passed:** 17
- **Tests Failed:** 0
- **Execution Time:** ~0.25 seconds

---

## 9. Deployment Strategy

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. In Vercel, import the repository and set the Root Directory to `frontend`.
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. Configure Environment Variable: `VITE_API_BASE_URL` pointing to the deployed Flask backend URL.

### Backend Deployment (Render / Railway / AWS / VPS)
1. Configure Python 3.10+ runtime with `backend/requirements.txt`.
2. Set Environment Variables:
   - `MONGODB_URI`: MongoDB Atlas connection URI (`mongodb+srv://<user>:<pwd>@cluster.mongodb.net/digital_queue?retryWrites=true&w=majority`)
   - `DATABASE_NAME`: `digital_queue`
   - `CORS_ORIGINS`: Deployed frontend Vercel domain (e.g. `https://digital-queue.vercel.app`)
   - `PORT`: Server port (e.g. `5050` or dynamic host port)
3. Run command: `gunicorn -w 4 -b 0.0.0.0:$PORT "app:create_app()"` or `python run.py`.

---

## 10. Student Declaration

This project was developed by **Bollineni Nanda Kishor** (`12321100`, Roll No: `11`) for the **CSE494: Intelligent NoSQL Databases** academic coursework at **Lovely Professional University** under the guidance of **Shaik Sana Begum**. All database operations, concurrency guards, indexes, schema validations, and test results represent authentic implementations and verified executions.
