# SMCMS — Student Mentoring & Counseling Management System

A MERN-stack application for colleges to manage student–mentor relationships,
academic records, attendance, counseling sessions, remarks, and interventions.
Three roles are supported: **Admin**, **Mentor** (faculty), and **Student**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (cookie or bearer token), bcrypt password hashing |
| Email | Brevo API (verification, password reset) — falls back to console logging in development |

---

## Project structure

```
smcms/
├── backend/
│   ├── src/
│   │   ├── config/          # constants (roles, statuses, enums), DB connection
│   │   ├── controllers/     # request handlers, one per resource
│   │   ├── middleware/      # auth, access control, validation, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # helpers, email, seeding, tokens
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # entry point
│   ├── render.yaml           # Render.com deploy config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/              # Axios client + endpoint definitions
    │   ├── components/       # shared UI, including per-record panels
    │   ├── context/          # Auth and Toast providers
    │   ├── hooks/            # useApi, useDebounced
    │   ├── pages/             # route-level pages (admin, mentor, student, landing)
    │   └── utils/             # formatting, validation, constants
    ├── vercel.json            # Vercel deploy config
    └── .env.example
```

---

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env      # fill in MONGODB_URI and JWT_SECRET at minimum
npm install
npm run seed               # optional: creates a sample admin/mentor/student dataset
npm run dev                 # starts on http://localhost:5000
```

Key environment variables (`backend/.env`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs auth tokens — use a long random string |
| `CLIENT_URL` | Frontend origin, for CORS and email links |
| `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | Optional — without these, verification/reset emails are printed to the console instead of sent |

### 2. Frontend

```bash
cd frontend
cp .env.example .env       # set VITE_API_URL to your backend's /api URL
npm install
npm run dev                 # starts on http://localhost:5173
```

### 3. Log in

- Self-registration (`/register`) is **student-only**.
- Mentor and admin accounts are created by an existing admin (`POST /api/mentors`,
  `POST /api/admin/users`). Run `npm run seed` in the backend for a ready-made
  admin/mentor/student login to start with.

---

## Roles & what each one can do

### Admin
- Full CRUD on students, mentors, and other admins.
- Bulk-assign or unassign students to mentors (`/assignments`).
- Assign subjects to a specific mentor (`/subjects`), and can edit or delete
  any academic record regardless of subject.
- Approve, suspend, or reactivate mentor/admin accounts.

### Mentor (faculty)
- **My Students** — view assigned mentees, filterable by year, department, and section.
- **Choose Students** — browse *unassigned* students grouped by department →
  year → section, and select students to become their own mentees, up to
  their configured `maxStudents` capacity. Mentees can also be released back
  to the unassigned pool.
- **My Subjects & Marks** — register the subjects they personally teach for a
  given department/semester/section, and enter marks for the whole class in
  one screen. **A subject can only ever be handled by one mentor at a time**,
  so marks for CS301 can only be entered by whoever is registered as CS301's
  handler — not by every mentor, and not automatically by the student's
  personal mentor unless they are also the subject handler.
- Record counseling sessions, remarks, and interventions for their own mentees.
- View (but not edit) marks for subjects they don't handle, for students who
  are their mentees.

### Student
- View their own profile, academic records, attendance, counseling history,
  remarks, and interventions — read-only.

---

## Core domain model

```
User (auth identity: email, password, role)
 ├── Mentor (1:1)   — employeeId, department, maxStudents
 │      └── SubjectAllocation (many) — "this mentor handles this subject
 │                                       for this department/year/sem/section"
 └── Student (1:1)  — rollNumber, department, year, semester, section
        ├── mentor          → Mentor  (personal mentor, for counseling/remarks/etc.)
        ├── AcademicRecord  (marks per subject/exam, entered by the subject's handler)
        ├── Attendance
        ├── CounselingSession
        ├── MentorRemark
        └── Intervention
```

A student's **personal mentor** (who runs counseling sessions and writes
remarks) is independent from the **subject handler** (who enters marks for
one specific subject). The same mentor is often both, but doesn't have to be
— a subject handler who isn't the student's personal mentor can still see and
edit marks for the subjects they handle.

---

## API overview

All routes are prefixed with `/api`. Selected endpoints:

| Method & path | Who | Purpose |
|---|---|---|
| `POST /auth/register` | Public | Student self-registration |
| `POST /auth/login` | Public | Login (all roles) |
| `GET /students` | Admin, Mentor | List/search students |
| `POST /students/assign` | Admin | Bulk mentor assignment |
| `GET /mentors/me/available-students` | Mentor | Unassigned students, grouped and filterable |
| `POST /mentors/me/claim` | Mentor | Claim selected students as mentees |
| `POST /mentors/me/release` | Mentor | Release mentees back to the unassigned pool |
| `GET/POST /subjects` | Admin, Mentor | List / register subject handlers |
| `GET/PUT /subjects/:id/marks` | Mentor (handler only), Admin | Fetch class roster with marks / bulk-save marks |
| `GET/POST/PUT/DELETE /students/:studentId/academics` | Admin, Mentor (handler for POST/PUT/DELETE) | Academic records |
| `GET/POST/PUT/DELETE /students/:studentId/attendance` \| `/sessions` \| `/remarks` \| `/interventions` | Admin, Mentor (own mentees) | Other student records |
| `GET /dashboard` | All | Role-specific dashboard summary |

Run `GET /api/meta` for the full list of enums (exam types, session types,
remark categories, etc.) used across forms.

---

## Deployment

- **Backend**: `render.yaml` is preconfigured for [Render](https://render.com)
  (`rootDir: backend`, health check at `/api/health`).
- **Frontend**: `vercel.json` is preconfigured for [Vercel](https://vercel.com)
  with SPA rewrites to `index.html`.

Set the same environment variables listed above in each platform's dashboard
before deploying.

---

## Notes on the mentor/subject workflow

- A mentor's mentee **capacity** is `maxStudents` on their profile (admin-set,
  default 30). Claiming students beyond the remaining capacity is rejected.
- Claiming is race-safe: if two mentors try to claim an overlapping set of
  students at the same moment, only the first claim per student succeeds and
  the response reports how many were skipped.
- Registering a subject enforces **one handler per (subject code, department,
  semester, section)** — attempting to register an already-claimed subject
  returns an error naming the current handler.
- Deleting a subject allocation does **not** delete marks already entered
  under it; it only stops new marks from being entered against it until a new
  handler is registered.
