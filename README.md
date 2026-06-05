# TaskFlow - Scalable MERN Task Management Application

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Click_Here-brightgreen?style=for-the-badge)](https://frontend-olive-tau-15.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend_API-Render-blue?style=for-the-badge)](https://taskflow-api-wer0.onrender.com/health)
[![GitHub](https://img.shields.io/badge/Source_Code-GitHub-black?style=for-the-badge&logo=github)](https://github.com/codebynikhita/TaskFlow)

TaskFlow is a production-level, resume-worthy, full-stack task management application. It is engineered using modern software engineering patterns, showcasing a decoupled three-tier architecture, cookie-based token rotation, role-based access control (RBAC), and interactive UI experiences (such as native HTML5 drag-and-drop kanban pipelines and data visualizers).

### 🚀 Live Demo

| Service | URL | Platform |
|---------|-----|----------|
| **🌐 Frontend App** | [https://frontend-olive-tau-15.vercel.app](https://frontend-olive-tau-15.vercel.app) | Vercel |
| **⚡ Backend API** | [https://taskflow-api-wer0.onrender.com](https://taskflow-api-wer0.onrender.com/health) | Render |
| **🗄️ Database** | MongoDB Atlas (M0 Free Tier) | MongoDB Cloud |

> **Note**: The backend is hosted on Render's free tier and may take ~30 seconds to wake up on first visit. After that, it runs smoothly.

---

## Key Features

1. **Robust Authentication & Sessions**: Access and Refresh Token rotation using HttpOnly, secure cookies, preventing CSRF and XSS threats.
2. **Interactive Kanban Pipeline**: Smooth native HTML5 drag-and-drop columns (`Todo`, `In Progress`, `Completed`) with optimistic state updates.
3. **Advanced Query Engine**: Paginated, sorted, prioritized, searchable, and filtered task query lists with MongoDB indexes.
4. **Task Reporting & Exports**: Dynamic PDF report compilation using streamable `pdfkit` and CSV grid spreadsheets streaming.
5. **NoSQL Injection Defenses**: Custom sanitization middleware that strips out Mongo operators like `$` from requests.
6. **Due-Date Email Alerts**: Daily and 15-minute verification cron runs scanning pending actions to dispatch notifications.
7. **Premium Responsive UI**: Elegant layout featuring Light/Dark mode toggling, glassmorphism card panels, skeleton loaders, and celebration triggers.

---

## Folder Directory Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/       # MongoDB and Cloudinary setups
│   │   ├── controllers/  # Auth, Task, and Dashboard request logic
│   │   ├── middleware/   # Authentication, RBAC, Rate limiting, and Error catchers
│   │   ├── models/       # User, Task, and ActivityLog collections
│   │   ├── routes/       # Auth, Task, and Dashboard routes mappings
│   │   ├── services/     # Mailers and PDF/CSV compilers
│   │   ├── validators/   # Express-validator schemas
│   │   ├── utils/        # Loggers and customized ApiErrors
│   │   └── app.js        # Express configurations
│   ├── server.js         # Port boots and process error listening
│   ├── package.json
│   └── .env              # Environment config keys
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios wrappers with token interceptors
│   │   ├── components/   # Loaders, Modals, and Cards
│   │   ├── context/      # Auth, Task, and Theme state providers
│   │   ├── layouts/      # Sidebar and Auth routing containers
│   │   ├── pages/        # Dashboard, TaskManagement, and profile details
│   │   ├── routes/       # Route switches
│   │   ├── index.css     # CSS custom variables + Tailwind
│   │   ├── App.jsx       # Nested providers and entry structure
│   │   └── main.jsx      # DOM mounting point
│   ├── index.html        # Main HTML body
│   ├── package.json
│   ├── vite.config.js    # Proxy configs redirecting /api to port 5000
│   ├── tailwind.config.js
│   └── postcss.config.js
```

---

## Tech Stack & Libraries

### Backend
- **Node.js** & **Express.js** (Server frame)
- **MongoDB** & **Mongoose** (Database client)
- **jsonwebtoken** & **cookie-parser** (Auth & Sessions)
- **bcryptjs** (Password hashing)
- **express-validator** (Decoupled payload check validation)
- **helmet** & **cors** (HTTP headers & sharing security)
- **express-rate-limit** (DOS & brute-force limits)
- **node-cron** & **nodemailer** (Reminders scheduling)
- **pdfkit** & **csv-writer** (Reporting compilers)

### Frontend
- **React.js** & **Vite** (Framework & build server)
- **Tailwind CSS** (Styling structure)
- **React Router Dom (v6)** (Client routing)
- **Axios** (API requests)
- **lucide-react** (Visual indicators)
- **canvas-confetti** (User celebrations)

---

## Environment Configuration (`backend/.env`)

Ensure the following keys are specified inside your `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_ACCESS_SECRET=taskflow_jwt_access_super_secret_key_2026
JWT_REFRESH_SECRET=taskflow_jwt_refresh_super_secret_key_2026
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Nodemailer SMTP settings (optional fallback logs to console if empty)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_username
SMTP_PASS=your_password
EMAIL_FROM=noreply@taskflow.com

# Cloudinary credentials (optional fallback saves as base64 in Mongo)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Quick Setup & Start Guide

### Prerequisites
- Node.js installed (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Step 1: Install & Boot Backend
```bash
cd backend
npm install
npm run dev
```
*The server will boot on port `5000` and display `MongoDB Connected`.*

### Step 2: Install & Boot Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*The Vite bundler will start the application locally on `http://localhost:3000`.*

---

## API Endpoints Reference

### Authentication Routing (`/api/auth`)
- `POST /register` - Payload: `{ name, email, password }`. Generates user profile, access & refresh token.
- `POST /login` - Payload: `{ email, password }`. Verifies and updates session credentials.
- `POST /refresh` - Cookie header input. Returns new access token.
- `POST /logout` - Clears cookie headers and database session variables.
- `GET /me` - Protected. Returns profile user data.
- `POST /avatar` - Protected. Payload: `{ image: base64 }`. Updates user avatar.

### Tasks Routing (`/api/tasks`)
- `POST /` - Protected. Payload: `{ title, description, priority, status, dueDate, tags }`. Creates task.
- `GET /` - Protected. Returns paginated, sorted, filtered tasks list. Query parameters:
  - `page=1&limit=10&priority=High&status=Todo&search=project&sortBy=dueDate&order=desc`
- `GET /:id` - Protected. Returns specific task.
- `PUT /:id` - Protected. Payload: `{ ...updates }`. Performs task modifications.
- `DELETE /:id` - Protected. Sets `isDeleted: true` for soft-deletion.
- `GET /export/csv` - Protected. Returns attachment file stream for CSV task reports.
- `GET /export/pdf` - Protected. Returns attachment file stream for PDF reports.

### Dashboard Analytics (`/api/dashboard`)
- `GET /` - Protected. Aggregates and returns stats for task states and activity audits.

---

## Security Implementation Specifications
- **HTTP-Only Cookies**: JWT refresh tokens are saved in cookies with parameters `httpOnly: true`, `sameSite: 'Lax'`, and `secure: true` in production, blocking scripts from accessing session parameters.
- **Payload Validation**: Express Validator separates schemas from logic and prevents invalid types from hitting controller scopes.
- **NoSQL Injection Filter**: Custom request parameter crawler strips query expressions containing `$`.
- **IP Rate Limiter**: Express Rate Limit blocks abuse by capping requests to 200 items per 15 minutes, and authentication attempts to 30 items per 15 minutes.
