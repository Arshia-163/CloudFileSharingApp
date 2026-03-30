# ☁️ CloudShare — MERN Cloud File Sharing Platform

A full-featured, self-hosted cloud file storage and sharing platform built with MongoDB, Express, React, and Node.js — fully containerized with Docker.

---

## ✨ Features

- **File Management** — Upload, download, rename, star, move to trash
- **Smart Organization** — Folder structure, categories (images, video, docs, audio)
- **Secure Sharing** — Generate shareable links with optional password & expiry
- **Storage Analytics** — Real-time dashboard with per-type usage breakdown
- **Auth System** — JWT-based register/login with rate limiting
- **Bulk Actions** — Select multiple files for batch operations
- **Two View Modes** — Grid or list view with right-click context menu
- **5 GB Free** per user (configurable)
- **Responsive UI** — Dark theme, clean minimal aesthetic

---

## 🏗️ Architecture

```
┌────────────┐     ┌──────────────┐     ┌───────────┐
│  React SPA │────▶│  Express API │────▶│  MongoDB  │
│  (Nginx)   │     │  (Node.js)   │     │           │
│  :80       │     │  :5000       │     │  :27017   │
└────────────┘     └──────────────┘     └───────────┘
       │                   │
       └─────── Docker Network ──────────┘
```

### Services
| Service    | Image           | Port  | Purpose                    |
|------------|-----------------|-------|----------------------------|
| `frontend` | Custom (Nginx)  | 80    | React SPA + reverse proxy  |
| `backend`  | Custom (Node)   | 5000  | REST API + file handling   |
| `mongo`    | mongo:7.0       | 27017 | Database (internal only)   |

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2

### 1. Clone & Configure

```bash
git clone <your-repo-url> cloud-share
cd cloud-share
cp .env

### 2. Start (Production)

```bash
docker compose up -d --build
```

Open **http://localhost** in your browser.

### 3. Start (Development)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

---

## 🔌 API Reference

### Auth
| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | `/api/auth/register` | Create account     |
| POST   | `/api/auth/login`    | Sign in → JWT      |
| GET    | `/api/auth/me`       | Get current user   |
| PUT    | `/api/auth/profile`  | Update profile     |

### Files (require `Authorization: Bearer <token>`)
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/files/upload`         | Upload files (multipart) |
| GET    | `/api/files`                | List files               |
| GET    | `/api/files/:id`            | Get file info            |
| GET    | `/api/files/:id/download`   | Download file            |
| PUT    | `/api/files/:id`            | Rename / star / move     |
| PATCH  | `/api/files/:id/trash`      | Toggle trash             |
| DELETE | `/api/files/:id`            | Permanently delete       |
| GET    | `/api/files/stats/storage`  | Storage analytics        |

### Sharing
| Method | Endpoint                      | Description               |
|--------|-------------------------------|---------------------------|
| POST   | `/api/share/:id`              | Create share link (auth)  |
| DELETE | `/api/share/:id`              | Revoke share link (auth)  |
| GET    | `/api/share/access/:token`    | Get shared file info      |
| POST   | `/api/share/download/:token`  | Download shared file      |

---

## 📂 Project Structure

```
cloud-share/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT auth middleware
│   │   │   └── upload.js      # Multer file upload
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── File.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── files.js
│   │   │   └── share.js
│   │   └── server.js
│   ├── uploads/               # Persistent volume mount
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileGrid.js    # Grid + list view + context menu
│   │   │   ├── Sidebar.js
│   │   │   ├── UploadModal.js
│   │   │   └── ShareModal.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   ├── DashboardPage.js
│   │   │   └── SharePage.js
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── format.js
│   │   ├── App.js
│   │   └── index.css
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

---

## ⚙️ Configuration

| Variable      | Default                           | Description                   |
|---------------|-----------------------------------|-------------------------------|
| `JWT_SECRET`  | `change_this_secret_in_prod`      | **Required** — sign JWT tokens |
| `PORT`        | `80`                              | Host port for frontend         |
| `CLIENT_URL`  | `http://localhost`                | URL for share links            |

---

## 🔒 Security Notes

- Change `JWT_SECRET` before deploying
- MongoDB is not exposed to the internet in production config
- Executables (.exe, .bat, .sh, etc.) are blocked from upload
- Rate limiting on login: 10 attempts per 15 minutes
- Helmet.js headers enabled

---

## 🛠️ Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build backend

# Connect to MongoDB shell
docker compose exec mongo mongosh cloudshare

# Stop everything
docker compose down

# Stop and remove volumes (wipes all data!)
docker compose down -v
```

---

## 📦 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router v6, Axios        |
| Styling   | Custom CSS (no framework)               |
| Backend   | Node.js, Express 4, Multer              |
| Database  | MongoDB 7 + Mongoose                    |
| Auth      | JWT (jsonwebtoken) + bcryptjs           |
| Container | Docker, Docker Compose, Nginx           |
