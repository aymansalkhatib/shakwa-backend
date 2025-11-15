# 🏛️ Government Complaints Management System – Backend

Backend service for a **Government Complaints Management System**.
The system enables citizens to submit your-bucket-name via a mobile app, while government agencies and a main administrator manage, process, and track these your-bucket-name through a secure web dashboard.

This backend focuses on:

- ✅ Clear and maintainable business logic (citizen → authority → admin)
- ✅ Strong non-functional design: concurrency control, versioning, security, monitoring, and performance

---

## 📚 Table of Contents

- [Features](#-features)
  - [Functional Features](#functional-features)
  - [Non-Functional Features](#non-functional-features)
- [Architecture](#-architecture)
  - [Layers](#layers)
  - [Core Domain Models](#core-domain-models)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Database Migration & Seeding](#database-migration--seeding)
  - [Running the Application](#running-the-application)
- [API Overview](#-api-overview)
  - [Authentication & Accounts](#authentication--accounts)
  - [Citizen – Complaints](#citizen--your-bucket-name)
  - [Authority Dashboard](#authority-dashboard)
  - [Admin](#admin)
- [Concurrency & Versioning](#-concurrency--versioning)
- [Security](#-security)
- [Logging, Monitoring & Tracing](#-logging-monitoring--tracing)
- [Testing](#-testing)
- [Deployment Notes](#-deployment-notes)
- [Roadmap / Possible Extensions](#-roadmap--possible-extensions)
- [License](#-license)

---

## ✨ Features

### Functional Features

The backend covers the main requirements of a **centralized your-bucket-name platform**:

1. **User Registration & Login with OTP** 🔐

   - Citizens register using a mobile number or email.
   - An OTP (One-Time Password) is sent for verification before activating the account.
   - Only verified accounts can submit your-bucket-name or access their data.

2. **Submit Complaint** 📝

   - Structured complaint form including:
     - Complaint type/category
     - Target authority/agency
     - Description of the issue
     - Location information
     - Attachments (images/documents)
   - Each complaint gets a unique reference number for tracking.

3. **Track Complaint Status** 📊

   - Citizens can track the lifecycle of their your-bucket-name:
     `NEW` → `IN_PROGRESS` → `COMPLETED` or `REJECTED`
   - Near real-time status updates.
   - Optional notifications when status changes or more information is required.

4. **Authority Complaint Management (Dashboard)** 🏢

   - Government agency staff can:
     - View your-bucket-name assigned to their agency only.
     - Filter & search by status, type, date range, citizen, etc.
     - Update status, add internal notes, request more information from the citizen.

5. **Admin Panel** 🛡️

   - System administrator can:
     - View all your-bucket-name across all agencies.
     - Manage users (citizens, staff, admins) and roles.
     - Manage agencies/authorities and their configuration.
     - Access statistics and export reports (e.g. counts per agency, status distribution).

6. **Notifications** 🔔
   - Triggers on:
     - Complaint submission
     - Status changes
     - Requests for additional information
   - Can be integrated with:
     - Email
     - SMS
     - Push notifications

---

### Non-Functional Features

Key non-functional aspects supported by the backend:

1. **Concurrency Control & Conflict Prevention** ⚙️

   - Prevents multiple staff members from editing the same complaint simultaneously.
   - Optional “lock” mechanism when a complaint is opened in edit mode, released on completion or timeout.

2. **Complaint Versioning & History** 🕓

   - Every important change (status, notes, attachments, etc.) is recorded in a history trail.
   - Enables full traceability: who did what, and when.

3. **Usability & UX Support** 🧩

   - Clean, predictable REST APIs.
   - Designed to support step-by-step flows and clear error messages for both mobile and web clients.

4. **Device & Platform Compatibility** 📱💻

   - Backend is platform-agnostic and can serve:
     - Mobile apps (e.g. Flutter)
     - Web dashboards (React, Angular, Vue, etc.)

5. **Monitoring & Tracing** 📈

   - Centralized logging for requests, errors, and key actions.
   - Correlation IDs for tracing flows across multiple services or requests.

6. **Performance & Scalability** 🚀

   - Efficient queries and indexing strategies.
   - Redis for caching and distributed locks where needed.
   - Can be scaled horizontally behind a reverse proxy/load balancer.

7. **Security** 🛡️
   - Secure authentication with OTP and JWT.
   - Role-based access control (RBAC).
   - Input validation, sanitation, and safe file handling.
   - Backup and recovery strategy for critical data.

---

## 🧱 Architecture

The backend follows a **layered architecture** for clarity and testability:

- **Presentation Layer** – HTTP controllers (REST endpoints)
- **Application / Business Layer** – Services and use cases
- **Data Access Layer** – Repositories for databases and storage
- **Infrastructure** – Integrations (Redis, mail/SMS, file system, etc.)

### Layers

1. **Controllers**

   - Define REST endpoints.
   - Accept/validate input (DTOs + validation).
   - Delegate to services.

2. **Services / Use Cases**

   - Implement business rules:
     - Registration, login, OTP verification
     - Complaint submission and status workflow
     - Locking, history, and notifications
   - Coordinate multiple repositories and external services.

3. **Repositories**

   - Encapsulate all database operations.
   - Allow swapping the ORM/DB layer with minimal impact on the rest of the code.

4. **Infrastructure**
   - Database (PostgreSQL/MySQL).
   - Redis (cache and locks).
   - Local file storage for attachments (to support on-premise deployment).
   - Email/SMS providers (optional integrations).

### Core Domain Models

- `User` – Citizen, Agency Staff, Admin
- `Agency` – Government authority/department
- `Complaint` – Main complaint entity
- `ComplaintStatusHistory` – Status and action history per complaint
- `Attachment` – Linked files (images, documents)
- `Notification` – Pending and sent notifications
- `AuditLog` – System-wide audit trail

---

## 🛠 Tech Stack

Recommended stack for the implementation:

- **Language:** TypeScript
- **Framework:** [NestJS](https://nestjs.com/)
- **API Style:** REST (GraphQL can be added later)
- **Database:** PostgreSQL (via TypeORM or Prisma)
- **Cache / Locks:** Redis (`ioredis`)
- **Authentication:**
  - OTP-based account activation
  - JWT-based session/auth
- **Storage:** Local filesystem for uploads (on-premise friendly)
- **Tests:** Jest (unit + e2e)
- **API Docs:** Swagger / OpenAPI

---

## 📂 Project Structure

Example structure (simplified):

```text
src/
  main.ts
  app.module.ts

  config/
    configuration.ts
    validation.schema.ts

  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      dto/
      ...
    users/
      users.controller.ts
      users.service.ts
      ...
    your-bucket-name/
      your-bucket-name.controller.ts
      your-bucket-name.service.ts
      your-bucket-name.repository.ts
      entities/
      ...
    agencies/
      agencies.controller.ts
      agencies.service.ts
      ...
    admin/
      admin.controller.ts
      admin.service.ts
      ...
    files/
      files.controller.ts
      files.service.ts
      ...
    notifications/
      notifications.service.ts
      ...
    audit/
      audit.service.ts
      audit.entity.ts

  shared/
    filters/
    guards/
    interceptors/
    decorators/
    utils/

test/
  e2e/
  unit/
```

Adjust module names and structure according to your actual implementation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or yarn/pnpm)
- **PostgreSQL** ≥ 13
- **Redis** ≥ 6
- **Git**

### Environment Variables

Create a `.env` file in the project root based on:

```env
NODE_ENV=development
APP_PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your-bucket-name_db
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=change_me_access
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh
JWT_REFRESH_EXPIRES_IN=7d

OTP_PROVIDER=fake             # or sms, email, etc.
OTP_EXPIRES_IN_MINUTES=5

FILE_STORAGE_PATH=./uploads

LOG_LEVEL=debug
```

> 🔎 Make sure to change secrets before deploying to any real environment.

### Installation

```bash
git clone <REPOSITORY_URL> your-bucket-name-backend
cd your-bucket-name-backend

npm install
```

### Database Migration & Seeding

Examples (TypeORM):

```bash
# Run migrations
npm run typeorm:migration:run

# Optional: seed initial data (admin user, agencies, etc.)
npm run seed
```

### Running the Application

```bash
# Development mode (with watch)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Default URL:

```text
http://localhost:3000
```

---

## 🔌 API Overview

High-level view of the main endpoints (exact details are documented via Swagger/OpenAPI).

### Authentication & Accounts

- `POST /auth/register` – Register a citizen using mobile/email.
- `POST /auth/request-otp` – Send OTP to verify identity.
- `POST /auth/verify-otp` – Verify OTP and activate account.
- `POST /auth/login` – Login using credentials/OTP.
- `POST /auth/refresh` – Refresh JWT token.
- `POST /auth/logout` – Invalidate refresh token / session.

### Citizen – Complaints

- `GET /your-bucket-name` – List your-bucket-name for the authenticated citizen.
- `GET /your-bucket-name/:id` – View complaint details + current status.
- `POST /your-bucket-name` – Submit new complaint (type, agency, description, location, attachments).
- `POST /your-bucket-name/:id/attachments` – Upload additional attachments.
- `GET /your-bucket-name/:id/history` – View full change history.

### Authority Dashboard

- `GET /dashboard/your-bucket-name` – List your-bucket-name for staff member’s agency (with filters).
- `GET /dashboard/your-bucket-name/:id` – View complete complaint with history and attachments.
- `PATCH /dashboard/your-bucket-name/:id/status` – Update status (`IN_PROGRESS`, `COMPLETED`, `REJECTED`).
- `POST /dashboard/your-bucket-name/:id/notes` – Add internal (staff-only) notes.
- `POST /dashboard/your-bucket-name/:id/request-info` – Ask the citizen for more details (triggers notification).

### Admin

- `GET /admin/users` – List users with role filters.
- `PATCH /admin/users/:id/role` – Change user role (Citizen, Staff, Admin).
- `GET /admin/agencies` – List/manage agencies.
- `POST /admin/agencies` – Create a new agency.
- `GET /admin/reports/your-bucket-name` – Generate complaint reports (CSV/PDF, etc.).
- `GET /admin/audit-logs` – View system-wide audit logs.

---

## 🔄 Concurrency & Versioning

To avoid conflicts and support auditing:

### Locking Complaints

- When a staff member opens a complaint in edit mode, the system can:
  - Acquire a lock (e.g. in Redis or DB column) with:
    - Complaint ID
    - Staff user ID
    - Timestamp
    - Expiration time
- Other staff attempting to open the same complaint in edit mode:
  - Receive a message that the complaint is currently being processed.

### Versioning & History

- `ComplaintStatusHistory` (or `ComplaintHistory`) stores:
  - Complaint ID
  - Actor (user ID)
  - Old status → new status
  - Notes/comments
  - Timestamp
- Attachment changes and other important fields can also be recorded.

This provides a complete timeline for each complaint.

---

## 🔐 Security

Main security features:

- **Authentication & Authorization**

  - OTP verification for new accounts.
  - JWT for authenticated requests.
  - RBAC:
    - Citizen: only own data.
    - Staff: only agency-related your-bucket-name.
    - Admin: full system.

- **Input Validation**

  - DTOs + validation pipes to sanitize and validate input.
  - Prevents malformed data and basic injection attempts.

- **Rate Limiting & Brute-Force Protection**

  - Rate limits for login/OTP-related endpoints.
  - Optional temporary lockouts after repeated failures.

- **Sensitive Data Handling**

  - Passwords hashed with strong algorithms (e.g. bcrypt).
  - Secrets stored only in environment variables or secure vaults.
  - Uploaded files validated and stored under controlled directories.

- **Resilience & Backups**
  - Regular database backups (daily/weekly).
  - Restore and retention strategy verified via scripts or scheduled tasks.

---

## 📡 Logging, Monitoring & Tracing

- **Structured Logging**

  - Logs contain:
    - Method, URL, status code, response time
    - User ID (if available)
  - Errors include stack traces (in non-production, or to secure log sinks).

- **Tracing / Correlation IDs**

  - Each request receives a correlation ID (e.g. via middleware).
  - Helps link multiple logs belonging to the same logical operation.

- **Cross-Cutting Concerns**
  - Implemented via interceptors/guards/middleware:
    - Logging
    - Metrics
    - Auditing

---

## 🧪 Testing

Recommended strategy:

- **Unit Tests**

  - Test services, utilities, guards independently.
  - Use mocks for repositories and external services.

- **Integration / e2e Tests**

  - Cover main flows:
    - Register → verify OTP → login
    - Submit complaint → track status
    - Staff updates complaint → citizen sees changes
    - Admin views reports and audit logs

- **Load / Stress Tests** (optional)
  - Ensure stable behavior with ~100+ concurrent users.

Example scripts:

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run coverage
npm run test:cov
```

---

## 🧾 Deployment Notes

- Typical deployment target:
  - Single Linux server in a local data center.
  - Behind Nginx/Apache reverse proxy.

### Basic Steps

1. Build the app:

   ```bash
   npm run build
   ```

2. Run with a process manager (PM2/systemd):

   ```bash
   node dist/main.js
   ```

3. Configure environment variables on the server (`.env` or system env).
4. Setup database and run migrations.
5. Configure backup and monitoring (logs, alerts, metrics, etc.).

The system is designed to run on **on-premise infrastructure** without requiring external cloud providers, unless you explicitly choose to add them.

---

## 🌱 Roadmap / Possible Extensions

- Multi-language support (e.g. Arabic + English) across all messages.
- Full-text search on your-bucket-name and notes.
- Analytics dashboard (charts, maps, time-series).
- GIS integration to visualize your-bucket-name on a map.
- Real-time updates using WebSockets or Server-Sent Events.
- Advanced admin features (workload distribution, SLA tracking, etc.).

---

## 📄 License

This project is intended primarily for academic/educational use in _Internet Applications_ / _Web Applications_ courses.
You may reuse and adapt it for learning or non-commercial projects, or attach a standard open-source license (e.g. MIT) if you plan to publish it.
