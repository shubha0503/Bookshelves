# MARGINS — An Interactive Personal Digital Library & Reflection Journal

> *"Read slowly. Think deeply. Keep what matters."*

Welcome to the backend repository of **Margins**, an elegant, personal digital reading library and reflection journal. Margins is architected with Node.js, Express, MySQL, and express-session to power a realistic bookshelf, reading progress tracking, editorial reflections, and highlight collections.

---

## 📚 Table of Contents

1. [Architecture & Features](#-architecture--features)
2. [Tech Stack](#-tech-stack)
3. [Folder Structure](#-folder-structure)
4. [Prerequisites & Quick Start](#-prerequisites--quick-start)
5. [Database Setup & Seeding](#-database-setup--seeding)
6. [Environment Variables](#-environment-variables)
7. [API Reference](#-api-reference)
8. [Connecting Your React Frontend](#-connecting-your-react-frontend)
9. [Postman Collection](#-postman-collection)
10. [Troubleshooting & Common Errors](#-troubleshooting--common-errors)

---

## 🏛 Architecture & Features

- **Strict Session Authentication**: Cookie-based sessions with `express-session`, password hashing via `bcryptjs` (10 rounds), and server-side user derivation (no trusting client-supplied user IDs).
- **Interactive Bookshelf API**:
  - Filter by reading status (`READING`, `COMPLETED`, `WANT_TO_READ`, `PAUSED`, `ALL`).
  - Search books by title and author.
  - Sort by title, author, rating, date added (`created_at`), or date completed (`completed_at`).
  - Automatic reading progress percentage calculations (`current_page / total_pages * 100`).
  - Progress updates with automatic date handling (marking books completed when target pages are reached).
- **Personal Reading Journal & Tagging**:
  - Normalized tags (`journal_tags` and `journal_entry_tags`).
  - Word count calculation helper.
  - Filter reflections by book or tag, and search entry contents.
- **Passages & Highlights**:
  - Save quotes, excerpts, page numbers, and personal interpretations.
  - Linked to individual books or independent.
- **Reading Goals & Editorial Dashboard**:
  - Real-time aggregation of total books, status breakdowns, total pages read, yearly goal completion rates, recently added/completed books, and monthly reading activity.
  - Random inspiration quote generator from the user's personal collection.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+ or v20+)
- **Framework**: Express.js
- **Database**: MySQL 5.7+ / 8.0+
- **Driver**: `mysql2` with parameterized prepared statements and connection pooling
- **Security & Session**: `bcryptjs`, `express-session`, `cors`
- **Configuration**: `dotenv`

---

## 📂 Folder Structure

```
Book_project/
├── server/
│   ├── config/
│   │   └── db.js                 # MySQL connection pool & connection test
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, Logout, Me
│   │   ├── bookController.js      # Bookshelf CRUD, search, filter, progress
│   │   ├── journalController.js   # Reflections, tagging, search
│   │   ├── highlightController.js # Saved passages & notes
│   │   ├── goalController.js      # Yearly reading goals & tracking
│   │   └── dashboardController.js # Editorial stats, monthly activity, quotes
│   ├── middleware/
│   │   ├── auth.js                # requireAuth session validator
│   │   └── errorHandler.js        # Global error & 404 handlers
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── journalRoutes.js
│   │   ├── highlightRoutes.js
│   │   ├── goalRoutes.js
│   │   └── dashboardRoutes.js
│   ├── scripts/
│   │   ├── initDb.js              # Automatic schema initialization
│   │   └── seedDb.js              # Curated read-shelf seeding
│   ├── .env.example
│   ├── .env
│   ├── app.js                     # Express app setup, CORS & session
│   ├── server.js                  # Entry point
│   ├── schema.sql                 # Complete MySQL schema
│   ├── seed.sql                   # Owner-curated books read so far
│   ├── Margins_API.postman_collection.json # Ready-to-import Postman tests
│   └── package.json
└── README.md
```

---

## 🚀 Prerequisites & Quick Start

### 1. Prerequisites
- **Node.js** (v18 or v20 recommended)
- **MySQL Server** (Running locally via MySQL Community Server, XAMPP, or Docker)

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Configure `.env`
Ensure `server/.env` matches your local MySQL credentials:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=margins_db
DB_PORT=3306

SESSION_SECRET=margins_super_secret_session_key_2026
CLIENT_URL=http://localhost:5173
```

---

## 🗄 Database Setup & Seeding

Initialize the schema, then load the curated shelf:

```bash
# Create database and tables from schema.sql
npm run init-db

# Replace the curated shelf with the books listed in server/seed.sql
npm run seed-db
```

The public café shelf reads completed books from the `curated_books` table. Cover images are looked up from Open Library and cached in the browser.

---

## 📡 API Reference

All requests accept and return JSON. Endpoints (except `/api/auth/register`, `/api/auth/login`, and `/api/health`) require an active session.

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/auth/register` | Register new user | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/login` | Log in user | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/auth/logout` | Destroy session & clear cookie | None |
| `GET` | `/api/auth/me` | Get current logged-in user profile | None |

### 2. Books (`/api/books`)
| Method | Endpoint | Description | Query / Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/books` | List books for shelf | Query params: `status`, `search`, `genre`, `sort`, `order` |
| `GET` | `/api/books/:id` | Get book detail + linked highlights & reflections | URL param: `id` |
| `POST` | `/api/books` | Add new book | `{ "title", "author", "cover_url", "genre", "publication_year", "isbn", "total_pages", "current_page", "status", "rating", "review" }` |
| `PUT` | `/api/books/:id` | Update book details | Full or partial book fields |
| `PATCH` | `/api/books/:id/progress` | Update current reading page | `{ "current_page": 150 }` |
| `DELETE`| `/api/books/:id` | Remove book from library | URL param: `id` |

### 3. Journal Reflections (`/api/journal`)
| Method | Endpoint | Description | Query / Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/journal` | List reflections | Query: `search`, `book_id`, `tag` |
| `GET` | `/api/journal/tags` | List all unique tags used | None |
| `GET` | `/api/journal/:id` | Get single reflection | URL param: `id` |
| `POST` | `/api/journal` | Create reflection | `{ "title", "content", "book_id", "tags": ["solitude", "habits"] }` |
| `PUT` | `/api/journal/:id` | Update reflection | `{ "title", "content", "book_id", "tags": [...] }` |
| `DELETE`| `/api/journal/:id` | Delete reflection | URL param: `id` |

### 4. Quotes & Highlights (`/api/highlights`)
| Method | Endpoint | Description | Query / Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/highlights` | List saved passages | Query: `search`, `book_id` |
| `GET` | `/api/highlights/:id` | Get single passage | URL param: `id` |
| `POST` | `/api/highlights` | Save passage | `{ "passage", "book_id", "page_number", "personal_note" }` |
| `PUT` | `/api/highlights/:id` | Update passage | `{ "passage", "page_number", "personal_note" }` |
| `DELETE`| `/api/highlights/:id` | Delete passage | URL param: `id` |

### 5. Reading Goals (`/api/goals`)
| Method | Endpoint | Description | Query / Body |
|--------|----------|-------------|--------------|
| `GET` | `/api/goals` | Get reading goal & progress | Query: `year` (defaults to current year) |
| `POST` | `/api/goals` | Set or update yearly target | `{ "year": 2026, "target_books": 25 }` |

### 6. Editorial Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregated reading stats: book counts by status, total pages read, yearly goal progress, recent additions, recent completions, monthly chart data, and random saved quote. |

---

## 🎨 Connecting Your React Frontend

When building your React application, ensure Axios is configured with **credentials enabled** so the session cookie (`margins.sid`) is automatically passed with each request:

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true // CRITICAL for session-based authentication
});

export default api;
```

### Example Usage in React:

```javascript
// 1. Login
export const login = (email, password) => api.post('/auth/login', { email, password });

// 2. Fetch Books for Bookshelf
export const fetchBooks = (status = 'ALL', search = '', sort = 'date_added') => 
  api.get('/books', { params: { status, search, sort } });

// 3. Update Reading Progress
export const updateProgress = (bookId, currentPage) => 
  api.patch(`/books/${bookId}/progress`, { current_page: currentPage });

// 4. Fetch Dashboard Statistics
export const fetchDashboardStats = () => api.get('/dashboard/stats');
```

---

## 📮 Postman Collection

Import `server/Margins_API.postman_collection.json` directly into Postman:
1. Open Postman.
2. Click **Import** > Select `server/Margins_API.postman_collection.json`.
3. In the collection variable, `baseUrl` defaults to `http://localhost:5000`.
4. Run `Login User` first to establish the cookie session in Postman, then freely test all Book, Journal, Highlight, and Dashboard endpoints!

---

## 💡 Troubleshooting & Common Errors

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL server is not running | Start MySQL service via Windows Services or XAMPP Control Panel. |
| `Access denied for user 'root'@'localhost'` | Wrong password in `.env` | Update `DB_PASSWORD` in `server/.env` with your actual MySQL password. |
| `401 Authentication required` | Session expired or cookie not sent | Call `/api/auth/login` and make sure your frontend client includes `withCredentials: true`. |
| `CORS Error in Browser` | React port doesn't match `CLIENT_URL` | Check your frontend port (e.g. Vite default `http://localhost:5173`) and set `CLIENT_URL` in `.env`. |
