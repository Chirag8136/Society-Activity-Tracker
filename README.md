# Society Activity Tracker

A complete, data-driven internal engagement and attendance management platform for university societies, clubs, and student organizations.

---

## Project Overview
The Society Activity Tracker replaces manual paper attendance sheets and subjective activity evaluations with an automated, data-driven engagement system.

Members can check in to meetings, workshops, events, and submit project tasks via dynamic QR codes or 6-character codes. Admins can log custom member contributions, award points, monitor live attendance, and view real-time leaderboards. The platform automatically aggregates participation into an Activity Score and continuously runs an Inactivity Detection Engine to flag members whose participation has dropped.

---

## 1. Project Setup Instructions

### Prerequisites
- Node.js: v18.0.0 or higher
- npm: v9.0.0 or higher
- MongoDB Atlas database connection string (or local MongoDB URI)

### Installation
Clone or navigate to the project directory:

```bash
cd "SOCIETY TRACKER"
```

#### Install Backend Dependencies:
```bash
npm install
```

#### Install Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 2. Environment Variables Required

### Backend Environment Variables
Create or verify a `.env` file in the root directory (`SOCIETY TRACKER/.env`):

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.cvzkyaf.mongodb.net/society-tracker?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_society_tracker_2026
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Frontend Environment Variables
Create or verify a `.env` file in the `frontend/` directory (`SOCIETY TRACKER/frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 3. Steps to Run Frontend and Backend

### Step A: Seed the Database with Mock Data
To populate the database with 2 sample societies, 5 realistic member accounts, past meetings, attendance records, and contributions, run:

```bash
npm run seed
```

### Step B: Start the Backend Server
```bash
npm run dev
```
- Server starts on: `http://localhost:5000`
- API health check: `http://localhost:5000/api/health`

### Step C: Start the React Frontend Application
Open a second terminal window:
```bash
cd frontend
npm run dev
```
- Frontend application opens at: `http://localhost:5173`

---

## Mock Data Reference

The seed script (`npm run seed`) populates the database with realistic sample data across multiple societies:

### Pre-Configured Societies
1. **Developer & Coding Club** (Join Code: `DEV123`, Category: Technical)
2. **Robotics & AI Society** (Join Code: `ROB456`, Category: Technical)

### Pre-Configured Accounts

| User | Email | Password | Role in Dev Club | Role in Robotics Society |
|---|---|---|---|---|
| **Alex Morgan** | `admin@society.com` | `Admin@123` | Admin (President · Executive) | Member (Embedded Dev · Firmware) |
| **Priya Sharma** | `priya.sharma@society.com` | `Member@123` | Member (Lead Dev · Full Stack) | Admin (Team Captain · Hardware) |
| **James Chen** | `james.chen@society.com` | `Member@123` | Member (UI/UX Designer · Design) | Member (CAD Designer · Mechanical) |
| **Fatima Al-Farsi** | `fatima.alfarsi@society.com` | `Member@123` | Member (Technical Writer · Content) | — |
| **Daniel Okafor** | `daniel.okafor@society.com` | `Member@123` | Member (Community Manager · Outreach) | Member (Circuit Specialist · Electronics) |

### Sample Events & Tasks
- **Workshop**: Fullstack Web Workshop (+10 pts)
- **Weekly Meeting**: Sprint Planning & Demo #1 (+5 pts)
- **Task**: API Documentation & Testing (+10 pts)
- **Live Active Event**: Hackathon Kickoff Sync (Check-in Code: `HACK99`)
- **Robotics Session**: Robot Arm Calibration Session (+5 pts)

### Sample Contributions Logged
- "Built the Society Activity Tracker frontend" (+15 pts, Technical)
- "Designed Club Logo and UI Mockups" (+15 pts, Design)
- "Programmed motor driver firmware" (+15 pts, Technical)

---

## 4. Important Assumptions Made During Development

1. **Multi-Tenancy & Global User Identity:**
   - A user registers once with their email and password.
   - Roles (`Admin` vs `Member`), departments, positions, points, and attendance records are scoped per society via a `Membership` entity. A user can be an Admin in Society A and a Member in Society B.

2. **Activity Score Calculation:**
   $$\text{Activity Score} = \sum \text{Attendance Points} + \sum \text{Contribution Points}$$
   - Points are derived directly from database records through MongoDB aggregation pipelines to prevent client-side score manipulation.

3. **Event Point Presets & Admin Customization:**
   - Default point allocations:
     - `Weekly Meeting`: 5 pts
     - `Project Meeting`: 5 pts
     - `Orientation`: 5 pts
     - `Workshop`: 10 pts
     - `Task`: 10 pts
     - `Event`: 15 pts
   - Admins can override the point value to any custom integer when creating an event or logging a contribution.

4. **Inactivity Detection Rule Engine:**
   - Inactivity is calculated over a rolling window of the last 3 closed/past events in the active society:
     - **ACTIVE**: Attended >= 2 events in the window OR logged a major contribution (>= 15 pts) OR logged >= 2 minor contributions.
     - **LOW ACTIVITY**: Attended 1 event in the window OR logged 1 minor contribution.
     - **INACTIVE**: 0 attendance and 0 contributions during the 3-event window.

5. **Grace Period & Check-In Window Expiry:**
   - Events have a configurable expiration window (`windowExpiresAt`). Check-ins after the window are rejected with `400 Bad Request`.
   - Check-ins completed within 15 minutes of scheduled start time are labeled `present`; check-ins after 15 minutes are labeled `late`. Task submissions are labeled `submitted`.
   - Admins can extend the deadline of any task/event or close windows early at any time.

6. **Race-Condition Safe Duplicate Prevention:**
   - Database-level compound unique index `{ user: 1, event: 1 }` on the `Attendance` collection ensures a member can never check in twice for the same event, even under concurrent requests.

7. **DNS Resolution for MongoDB Atlas on Windows:**
   - Public DNS fallback (`8.8.8.8`, `1.1.1.1`) is configured in the database connector to prevent Windows ISP DNS resolvers from dropping SRV queries (`querySrv ECONNREFUSED`).

---

## Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, Lucide Icons, Recharts, `qrcode.react`, `html5-qrcode`, Axios
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, Zod (schema validation), JWT, bcryptjs, CORS
