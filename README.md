# EduOps — Facilities & Materials Management Platform

Full-stack school and campus operations platform for managing facilities, storage materials, IT support, cleaning, and maintenance requests with persistent SQLite database storage.

**Live Demo**: [https://nurassyl2006.github.io/material-ticket-platform](https://nurassyl2006.github.io/material-ticket-platform)

---

## Key Features

- **Bidirectional Ticket Translator**: Real-time translation between English-speaking teachers and Russian/Kazakh-speaking maintenance engineers (auto-translation, 0ms school terminology dictionary, and neural translation API).
- **Trilingual Departments & Subcategories**: Localized in English (`EN`), Russian (`RU`), and Kazakh (`KK`).
- **Resolution Notes Translator**: Engineers can write notes in Russian/Kazakh and translate them into English for teachers with 1 click.
- **Role-Based Workflows**: Custom views for Teacher, IT Support, Cleaning Staff, Storage Manager, Facilities Manager, Director, and Maintenance Engineer.

---

## Architecture Overview

- **Frontend**: React 19 + Vite (Tailored dark UI, multi-language EN/RU/KK, role-based workflows)
- **Backend**: Node.js + Express 5 (`server/index.js`)
- **Database**: SQLite via `better-sqlite3` (`server/data/platform.db`) with WAL mode
- **Translation API**: Built-in `/api/translate` endpoint with multi-tier caching and client fallback
- **Real-Time Sync**: Automatic background polling (every 3 seconds), focus-reconnect, and seamless offline-first local storage caching

---

## Database Entities

The SQLite database (`server/data/platform.db`) stores:

1. **Tickets (`tickets`)**:
   - Stores all maintenance, supply, and facilities requests.
   - Fields: `id`, `department`, `itemTitle`, `category`, `quantity`, `unit`, `urgency`, `roomNumber`, `moveDetails`, `description`, `photos`, `completionPhotos`, `teacherName`, `teacherPhone`, `status`, `assignedWorker`, `assignedRole`, `handledAction`, `purchaseCost`, `supplier`, `notes`, `createdAt`, `updatedAt`.

2. **Storage List of Goods (`inventory`)**:
   - Stores warehouse assets, stock quantities, minimum stock alerts, and storage locations.
   - Fields: `id`, `name`, `category`, `quantity`, `unit`, `minLevel`, `location`, `createdAt`, `updatedAt`.
   - Automatically synchronizes stock deduction when items are issued directly from warehouse stock.

3. **Users (`users`)**:
   - Stores profiles for all staff roles (Teacher, IT Support, Cleaning Staff, Storage Manager, Facilities Manager, Director, Engineer).
   - Fields: `roleKey`, `id`, `name`, `role`, `department`, `email`, `phone`, `avatar`, `createdAt`, `updatedAt`.

4. **Notifications (`notifications`)**:
   - Real-time updates delivered to users when requests are assigned, issued, or resolved.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Backend & Frontend Concurrently (Recommended)
```bash
npm run dev
```
- **Vite Web App**: http://localhost:5173/material-ticket-platform/
- **API Server & DB**: http://localhost:5001/api/

### 3. Separate Execution Commands
- Start only the Express API Server:
  ```bash
  npm run server
  ```
- Start only the Vite Dev Client:
  ```bash
  npm run client
  ```
- Build for Production:
  ```bash
  npm run build
  ```
- Run Production Server (serves API and built client):
  ```bash
  npm start
  ```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check database connectivity and item counts |
| `GET` | `/api/tickets` | Retrieve all tickets (newest first) |
| `POST` | `/api/tickets` | Create a new ticket request |
| `PATCH` | `/api/tickets/:id` | Update ticket details, status, or assignment |
| `DELETE` | `/api/tickets/:id` | Delete a ticket |
| `POST` | `/api/tickets/bulk` | Bulk upsert tickets for data sync / migration |
| `GET` | `/api/inventory` | Retrieve storage list of goods |
| `POST` | `/api/inventory` | Add a new good/item to warehouse storage |
| `PATCH` | `/api/inventory/:id` | Update item details (name, category, minLevel) |
| `PATCH` | `/api/inventory/:id/quantity` | Adjust stock quantity (`quantity` or `delta`) |
| `DELETE` | `/api/inventory/:id` | Delete an item from storage |
| `GET` | `/api/users` | Retrieve all user profiles |
| `PATCH` | `/api/users/:roleKey` | Update user profile (name, phone, avatar) |
| `GET` | `/api/notifications` | Retrieve user notifications |
| `POST` | `/api/translate` | Translate text between English, Russian, and Kazakh |
| `POST` | `/api/reset` | Reset database to clean default seed data |
