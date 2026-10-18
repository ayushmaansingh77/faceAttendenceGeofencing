# FaceGate — Biometric Face Recognition & Geofenced Attendance System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![OpenCV](https://img.shields.io/badge/OpenCV-YuNet_%2B_SFace-5C3EE8?style=flat-square&logo=opencv&logoColor=white)](https://opencv.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet_%2B_OSM-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

An enterprise-grade, privacy-centric biometric attendance system combining **YuNet** face detection, **SFace** facial feature embedding, and **Haversine GPS geofencing**. 

FaceGate prevents buddy-punching and off-site spoofing by requiring employees to verify both their facial biometrics and physical presence inside an authorized workplace perimeter before checking in or out.

---

## Architecture Overview

```
                          ┌─────────────────────────────────────┐
                          │     FaceGate Client (React 18)      │
                          │   • WebCam Video Capture (Canvas)   │
                          │   • GPS Coordinates (Geolocation API│
                          │   • Interactive Leaflet Perimeter   │
                          └──────────────────┬──────────────────┘
                                             │ HTTP / JSON (Bearer JWT)
                                             ▼
                          ┌─────────────────────────────────────┐
                          │       FastAPI Gateway (Python)      │
                          │   • JWT Auth & Role-Based Access    │
                          │   • SlowAPI Rate Limiting (15/min)  │
                          │   • 8MB Request Payload Guard       │
                          └───────┬─────────────────────┬───────┘
                                  │                     │
                  ┌───────────────▼────────┐   ┌────────▼───────────────┐
                  │ Biometric Pipeline     │   │ Dual-Engine Storage    │
                  │ • YuNet Face Detector  │   │ • PostgreSQL via       │
                  │ • SFace Feature Extr.  │   │   SQLAlchemy ORM       │
                  │ • Cosine Similarity    │   │ • Flat-file JSON Store │
                  │ • Haversine Geofencer  │   │   (Zero-config dev)    │
                  └────────────────────────┘   └────────────────────────┘
```

---

## Key Features

* **Biometric Verification (YuNet + SFace):**
  * Sub-5ms face detection and 5-point facial landmark alignment running on pure CPU (no CUDA/GPU required).
  * 128-dimensional L2-normalized biometric embeddings.
  * Identity-bound cosine matching: captures are strictly verified against the authenticated user's stored biometric profile.
* **Geofenced Perimeter Validation:**
  * Admin-defined workplace perimeters using great-circle Haversine distance calculations.
  * Interactive map management powered by **Leaflet & OpenStreetMap** (zero external API keys needed).
  * Real-time distance feedback indicating distance to the nearest active zone.
* **Role-Gated Security:**
  * **Admin Console:** Staff management, biometric status tracking, visual geofence configuration, and filtered attendance audit logs.
  * **Staff Terminal:** One-click biometric enrollment, camera capture, GPS check-in/out, and personal punch history.
* **Production-Grade Architecture:**
  * Swappable storage engine: switch between lightweight flat `db.json` and production PostgreSQL via a single `.env` flag.
  * Custom styled 404 handler with contextual recovery navigation.
  * Dark / Light mode with hardware-accelerated SVG icons.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router 6, Leaflet & React-Leaflet, GSAP, Lenis |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SlowAPI, Python-Jose (JWT), Passlib (Bcrypt) |
| **Computer Vision** | OpenCV (`opencv-python-headless`), YuNet ONNX, SFace ONNX |
| **Database** | PostgreSQL 15+ (Production) or Flat JSON (Development) via SQLAlchemy |

---

## Quickstart Guide

### Prerequisites
* **Python 3.10+**
* **Node.js 18+ & npm**
* A webcam and browser with Location/Camera permissions enabled.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/face_proto.git
cd face_proto
```

---

### Step 2: Backend Setup

1. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Configure your `backend/.env`:
   ```ini
   # Storage Mode: "json" (zero-setup) or "postgres"
   STORAGE_BACKEND=json

   # Secret Key for JWT Signing (Generate a long secure string)
   JWT_SECRET=super-secret-development-key-change-in-production

   # Default Admin Account (Auto-bootstrapped on first run)
   FIRST_ADMIN_NAME=Admin
   FIRST_ADMIN_EMAIL=admin@example.com
   FIRST_ADMIN_PASSWORD=admin123
   ```

   *(Optional) If using PostgreSQL:*
   ```ini
   STORAGE_BACKEND=postgres
   DATABASE_URL=postgresql://username:password@localhost:5432/face_attendance
   ```

4. **Start the FastAPI Server:**
   ```bash
   uvicorn app:app --reload --host 127.0.0.1 --port 8000
   ```
   *The lightweight ONNX models (~14 MB total) will be automatically downloaded and verified on first startup.*
   * Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 3: Frontend Setup

1. **Install dependencies:**
   ```bash
   # From the repository root
   cd frontend
   npm install
   ```

2. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open your browser at **`http://localhost:5173`**.

---

## Default Credentials

The system includes pre-seeded demo credentials for instant local evaluation:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | Geofence control, employee management, audit logs |
| **Staff** | `employee@example.com` | `employee123` | Face enrollment, check-in, check-out, history |

*Tip: The login terminal includes 1-click **"Fill Staff"** and **"Fill Admin"** buttons for rapid switching.*

---

## Workflow & Demonstration

1. **Log in as Admin** (`admin@example.com` / `admin123`).
2. **Define a Geofence Zone** (Admin → Geofencing):
   * Click on the Leaflet map to set your current location (or enter coordinates manually).
   * Specify a perimeter radius (e.g., `250` meters).
3. **Switch to Employee** (Click "Sign Out" or visit `/login` → "Sign Out to Switch Account").
4. **Log in as Employee** (`employee@example.com` / `employee123`).
5. **Enroll Face** (Staff → Enroll Face):
   * Look directly into your camera and click **Capture & Enroll**.
   * YuNet detects facial landmark bounds, and SFace computes your 128-D biometric vector.
6. **Check In**:
   * Navigate to **Check In**. Ensure your browser grants camera and location permissions.
   * Click **Check In**. The backend confirms that your facial cosine similarity satisfies the match threshold (`>= 0.36`) and your GPS falls inside the active zone.
7. **Check Out**:
   * Navigate to **Check Out** when concluding your shift to record departure timestamps.
8. **Audit Records** (Admin → Attendance):
   * Filter and inspect complete biometric match confidences, geofence names, and timestamps.

---

## Project Structure

```text
face_proto/
├── backend/
│   ├── app.py                 # FastAPI application, middleware & lifespan loader
│   ├── config.py              # Central settings, thresholds & paths
│   ├── schemas.py             # Pydantic request and response schemas
│   ├── rate_limit.py          # SlowAPI rate-limiting configuration
│   ├── db/
│   │   ├── database.py        # SQLAlchemy engine & session maker
│   │   ├── models.py          # PostgreSQL schema declarations
│   │   ├── records.py         # Uniform internal domain dataclasses
│   │   ├── store.py           # Swappable store contract interface
│   │   ├── sql_store.py       # PostgreSQL persistence implementation
│   │   ├── json_store.py      # Flat-file JSON persistence implementation
│   │   └── seed_admin.py      # First-admin initialization routine
│   ├── models/                # ONNX weights (YuNet face detector + SFace recognizer)
│   ├── routers/
│   │   ├── auth.py            # Authentication, registration & identity endpoints
│   │   ├── admin.py           # Employee management & geofence zone controls
│   │   ├── attendance.py      # Check-in, check-out & attendance queries
│   │   ├── face.py            # Face enrollment & verification routes
│   │   └── views.py           # Production SPA static fallback handler
│   ├── services/
│   │   ├── auth_service.py    # Passlib bcrypt hashing & PyJWT token handling
│   │   ├── face_service.py    # OpenCV YuNet/SFace inference engine
│   │   └── geo_service.py     # Haversine distance calculation
│   └── requirements.txt
│
└── frontend/
    ├── public/
    │   └── favicon.svg        # FaceGate biometric brand tab favicon
    ├── src/
    │   ├── api.js             # Fetch wrapper with Bearer token interceptor
    │   ├── geo.js             # HTML5 Geolocation API helper
    │   ├── App.jsx            # Application route definitions & guards
    │   ├── main.jsx           # React DOM root & providers
    │   ├── components/
    │   │   ├── CameraCapture.jsx   # Webcam stream & frame snapshot utility
    │   │   ├── FaceGateLogo.jsx    # SVG biometric brand mark
    │   │   ├── Layout.jsx          # Sidebar, header & theme layout shell
    │   │   ├── RequireAuth.jsx     # Route protection guard
    │   │   ├── RequireRole.jsx     # Role-based access control wrapper
    │   │   └── ui/                 # Reusable UI widgets (Button, Card, Badge, Icons)
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Authentication state & session manager
    │   │   └── ThemeContext.jsx    # Dark/light theme state
    │   └── pages/
    │       ├── LandingPage.jsx         # GSAP-animated marketing & product overview
    │       ├── Login.jsx               # Access terminal with demo quick-fill
    │       ├── Signup.jsx              # Employee account registration
    │       ├── EmployeeDashboard.jsx   # Staff actions & biometric status
    │       ├── AdminDashboard.jsx      # Security command center
    │       ├── CheckIn.jsx             # Biometric + GPS entry verification
    │       ├── CheckOut.jsx            # Biometric + GPS exit verification
    │       ├── EnrollFace.jsx          # Single-shot facial vector encoder
    │       ├── MyAttendance.jsx        # Personal punch history log
    │       ├── NotFound.jsx            # Custom 404 error page with auto-recovery
    │       └── admin/                  # Directory, Geofence & Attendance panels
    ├── package.json
    └── vite.config.js
```

---

## API Reference

### Authentication
* `POST /api/auth/login` — Authenticate user and receive Bearer JWT.
* `POST /api/auth/signup` — Register a new staff account.
* `GET /api/auth/me` — Retrieve current authenticated profile and enrollment status.

### Biometrics & Attendance
* `POST /api/face/enroll` — Submit webcam capture to compute & store biometric embedding.
* `POST /api/face/recognize` — Compare webcam capture against enrolled identity.
* `POST /api/attendance/check-in` — Validate face match & GPS geofence; open attendance session.
* `POST /api/attendance/check-out` — Validate face match & GPS geofence; close active attendance session.
* `GET /api/attendance/me` — Query personal historical attendance punches.

### Administration
* `GET /api/admin/employees` — List all registered staff with active & enrollment status.
* `POST /api/admin/employees` — Create new staff profile with temporary password.
* `GET /api/admin/geofence-zones` — List all active and inactive geographical boundaries.
* `POST /api/admin/geofence-zones` — Create a new geofence perimeter (lat, lng, radius, name).
* `GET /api/admin/attendance` — Query aggregated attendance records with date & staff filters.

---

## Security & Browser Requirements

> [!IMPORTANT]
> **HTTPS is Required for Public Deployment:**
> Modern web browsers restrict access to `navigator.mediaDevices.getUserMedia` (Webcam) and `navigator.geolocation` (GPS) to secure origins (`https://`) and `localhost`. When deploying to staging or production, ensure valid SSL certificates are configured.

* **Anti-Spoofing & Privacy:** Raw facial images are **never stored on disk**. The system extracts compact mathematical vectors (embeddings) and discards the image immediately following inference.
* **Identity Isolation:** Facial comparisons operate strictly as **1:1 verification** against the authenticated employee's profile, eliminating identity collision across large user bases.
* **Rate Limiting:** Authentication and biometric verification routes are guarded by SlowAPI rate limits to prevent brute-force attacks.
* **Memory Protection:** Request payload middleware limits incoming HTTP request bodies to 8MB to protect against heap exhaustion.

---

## Deployment Recommendations

| Component | Recommended Hosts | Notes |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/), [Cloudflare Pages](https://pages.cloudflare.com/) | Provides instant global CDN and automatic free SSL. |
| **Backend** | [Render](https://render.com/), [Railway](https://railway.app/), [Fly.io](https://fly.io/), or VPS (Hetzner / DigitalOcean) | Minimum 512MB RAM recommended for CPU ONNX inference. |
| **Database** | [Neon](https://neon.tech/) or [Supabase](https://supabase.com/) | Free managed PostgreSQL avoids data loss on container restarts. |

---

## License

This project is licensed under the [MIT License](LICENSE).
OpenCV YuNet and SFace models are distributed under the [Apache-2.0 License](https://github.com/opencv/opencv_zoo).
