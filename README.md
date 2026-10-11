# CloudVault 🛡️☁️

**CloudVault** is an enterprise-grade cloud file storage and secure sharing platform inspired by Google Drive, built for the **Cloud Computing Major Mini-Project**.

The application features a decoupled cloud architecture that strictly isolates relational metadata and access authorization in **PostgreSQL** from immutable binary object storage in **Amazon S3** (using server-side encryption with AES-256).

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User([End User / Web Client]) -->|HTTPS / TLS| ReactApp["React 18 SPA (Vite + Tailwind CSS)"]
    ReactApp -->|REST API Requests (JWT Auth)| Backend["FastAPI Backend (Amazon EC2 / Python 3.13)"]
    
    Backend -->|IAM Role (STS Temp Credentials)| S3[("Amazon S3 (Private Bucket)\nAES-256 SSE-S3 Encrypted")]
    Backend -->|SQLAlchemy ORM + Psycopg 3| Postgres[("PostgreSQL / Amazon RDS\nMetadata, Shares & Users")]

    subgraph AWS Security Perimeter
        Backend
        S3
        Postgres
    end
```

---

## ✨ Core Features

* **Decoupled Cloud Object Storage:** Real Amazon S3 integration via Boto3 with private bucket controls, zero public access, and Server-Side Encryption (`SSE-S3 AES-256`).
* **Argon2id Password Security:** Passwords hashed with RFC 9106 memory-hard parameters resisting GPU/ASIC cracking.
* **Short-Lived Signed JWT Access:** Cryptographic Bearer token authorization on all protected routes.
* **Granular User-to-User Sharing:** Share files with registered users using read-only permissions.
* **Instant Permission Revocation:** Revoking a share immediately terminates file access across the backend.
* **IDOR & Path Traversal Immunity:** Multi-tenant isolation using UUIDv4 storage keys and server-side ownership enforcement.
* **SaaS Storage Dashboard:** Real-time quota metrics, file type distribution charts, and recent uploads.
* **Multi-Format Uploads:** Drag-and-drop upload manager with live progress bars and file size constraints (10 MB configurable).
* **Dual Storage Engines:** Configurable between Amazon S3 for production and Local Storage for offline zero-cost development/testing.

---

## 💻 Tech Stack

* **Frontend:** React 18, Vite, JavaScript, Tailwind CSS v3.4, React Router v7, Axios, Lucide React.
* **Backend:** Python 3.13, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0 ORM, Alembic Migrations, Psycopg 3.
* **Database:** PostgreSQL 16 (Amazon RDS for AWS Cloud / SQLite fallback for local testing).
* **Cloud Infrastructure (AWS):** Amazon S3, Amazon EC2, AWS IAM Instance Roles, CloudFront, Application Load Balancer.
* **Automated Testing:** Pytest, HTTPX, Vitest, React Testing Library.

---

## 📁 Repository Structure

```
ICC/
├── backend/                  # FastAPI REST Backend
│   ├── app/
│   │   ├── config.py         # Pydantic Settings & environment variables
│   │   ├── database.py       # SQLAlchemy engine & session dependency
│   │   ├── main.py           # FastAPI entrypoint, middleware & error handlers
│   │   ├── models/           # SQLAlchemy ORM models (User, File, FileShare)
│   │   ├── routers/          # API route controllers (auth, files, shares, dashboard, health)
│   │   ├── schemas/          # Pydantic request/response validation models
│   │   ├── services/         # Storage abstraction (AWS S3 & Local providers)
│   │   └── utils/            # Argon2id hasher, JWT encoder, filename validators
│   ├── alembic/              # Alembic database migration scripts
│   ├── tests/                # Pytest test suite (23 automated tests)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables template
├── frontend/                 # React 18 Single-Page Application
│   ├── src/
│   │   ├── api/              # Axios HTTP service layer
│   │   ├── components/       # Reusable UI widgets (Navbar, Sidebar, Modals, Cards)
│   │   ├── context/          # React AuthContext (JWT session management)
│   │   ├── pages/            # Views (Landing, Login, Register, Dashboard, Files, Shared, Profile)
│   │   └── __tests__/        # Vitest UI test suite (6 automated tests)
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite build & test configuration
│   └── tailwind.config.js    # SaaS styling system
├── docker/                   # Containerization configs
│   ├── Dockerfile.backend    # Multi-stage Python 3.13 production image
│   ├── Dockerfile.frontend   # Multi-stage Node/Nginx production image
│   ├── nginx.conf            # Nginx SPA reverse proxy configuration
│   └── docker-compose.yml    # Full-stack local Docker Compose setup
├── docs/                     # Comprehensive Academic Documentation
│   ├── REPORT.md             # 21-Section Academic Major Mini-Project Report
│   ├── deployment-aws.md     # Step-by-step AWS EC2/S3/RDS production guide & cost breakdown
│   ├── security-model.md     # Threat model, Argon2id parameters & IDOR mitigations
│   └── api-spec.md           # OpenAPI / REST endpoint specifications
├── alembic.ini               # Root Alembic configuration
├── .gitignore                # Production gitignore protecting all secrets
└── README.md                 # Master documentation
```

---

## 🚀 Quickstart: Local Development

### 1. Prerequisites
* Python 3.10+ (Python 3.13 recommended)
* Node.js v18+ and npm
* Git

### 2. Backend Setup
```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Create environment configuration
cp backend/.env.example backend/.env

# 4. Run database migrations
PYTHONPATH=. alembic upgrade head

# 5. Start the FastAPI development server
PYTHONPATH=. python3 -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`
Interactive Swagger Docs: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev
```
Frontend web application will be running at: `http://localhost:5173`

---

## 🐳 Running via Docker Compose

To spin up the entire multi-container stack (PostgreSQL + FastAPI + React + Nginx) with one command:

```bash
docker-compose -f docker/docker-compose.yml up --build
```
* Frontend: `http://localhost`
* Backend API: `http://localhost:8000`

---

## 🧪 Running Automated Tests

### Backend Automated Tests (pytest)
Runs 23 automated tests verifying Argon2id hashing, short-lived JWT tokens, IDOR isolation, S3 upload/download flows, file size limits, and instant share revocation:
```bash
source .venv/bin/activate
PYTHONPATH=. pytest -v backend/tests
```
**Result:** `23 passed in ~2.8s` (100% Passing)

### Frontend Automated Tests (Vitest)
Runs 6 automated component tests verifying login/register forms, live password strength meters, upload modals, and card interactions:
```bash
cd frontend
npm test
```
**Result:** `6 passed in ~1.16s` (100% Passing)

---

## 🔒 Security & Threat Defense Summary

| Security Layer | Mechanism | Details |
| :--- | :--- | :--- |
| **Passwords** | Argon2id | Memory-hard (RFC 9106), 64 MB RAM, 2 iterations. Resists GPU/ASIC attacks. |
| **Tokens** | PyJWT | Signed HS256 JWT access tokens with 60-minute expiration. |
| **S3 Storage** | Private + SSE-S3 | Block Public Access strictly enabled; encrypted with AES-256 before disk write. |
| **IDOR Protection** | Authorization Matrix | Ownership verified on every file read, download, delete, and share attempt. |
| **Path Traversal** | Sanitization & UUIDs | Filenames stripped of `../` and control chars; S3 keys use isolated UUID prefixes. |
| **AWS Credentials** | IAM Instance Roles | Zero hardcoded AWS secrets in source code; uses STS temporary rotating tokens. |

---

## ☁️ AWS Cloud Deployment Summary

* **Frontend:** Hosted via **Amazon S3 Static Website** + **Amazon CloudFront** for global CDN caching and HTTPS.
* **Compute:** **Amazon EC2** running FastAPI/Uvicorn managed by systemd or Docker with an attached IAM Instance Profile.
* **Database:** **Amazon RDS PostgreSQL 16** deployed in a private VPC subnet.
* **Object Storage:** **Amazon S3** private bucket with AES-256 server-side encryption.

For detailed infrastructure setup steps, IAM JSON policies, security group configurations, and cost estimates, see:
📖 [AWS Production Deployment Manual](docs/deployment-aws.md)

---

## 📦 GitHub Publishing Instructions

To initialize Git and publish this repository to a new GitHub repository:

```bash
# 1. Initialize git
git init

# 2. Stage all project files (secrets and node_modules are safely excluded by .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete CloudVault full-stack cloud storage platform"

# 4. Set main branch
git branch -M main

# 5. Link to your remote GitHub repository
git remote add origin https://github.com/<your-username>/CloudVault.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📄 License
Academic Mini-Project for Cloud Computing. Developed for educational, research, and demonstration purposes.
