# Shakwa - Complaints Management System

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)

**University of Damascus - Internet Applications Course Project**

</div>

---

## Tech Stack

**Backend:** NestJS 11, TypeScript 5, Node.js 22
**Database:** PostgreSQL 16, TypeORM, Redis 7 (caching & sessions)
**DevOps:** Docker, Kubernetes, GitLab CI/CD
**Testing:** Jest, K6, JMeter

---

## Key Features & Technologies

### Authentication & Security
- JWT Authentication (Access + Refresh Tokens)
- Password hashing with bcrypt
- Rate Limiting (@nestjs/throttler) - DDoS protection
- Helmet - HTTP security headers
- Input validation (class-validator, Zod)
- File validation using Magic Bytes

### Audit & Logging System
- Complete audit trail with automatic logging interceptor
- Activity tracking for all CRUD operations
- Winston logger with daily rotation
- Structured JSON logs for production

### Backup System
- Scheduled automated backups (@nestjs/schedule)
- Cloud storage integration (Supabase)
- Backup restoration capabilities

### Notifications
- Push notifications via Firebase Admin SDK
- Email notifications using Resend API
- Multi-channel notification support

### File Management
- Image compression with Sharp
- File type validation (magic-bytes.js)
- Local & cloud storage providers (Supabase)

### Internationalization (i18n)
- Multi-language support (Arabic/English)
- nestjs-i18n integration
- Translated validation messages

### API Features
- API Versioning (URI-based)
- Request/Response transformation (snake_case ↔ camelCase)
- Global exception handlingwith error strategies
- Pagination utilities

---

## DevOps & Infrastructure

### Docker
- Multi-stage Dockerfile (builder + runner)
- Docker Compose with PostgreSQL, Redis, pgAdmin
- Optimized production images

### Kubernetes (Production-Ready)
- **Deployment:** 5 replicas with rolling updates
- **HPA:** Auto-scaling (3-15 pods) based on CPU/Memory
- **Health Probes:** Startup, Liveness, Readiness
- **Security:** Non-root containers, seccomp profiles
- **Pod Anti-Affinity:** Distribution across nodes/zones
- **PDB:** Pod Disruption Budget for HA
- **Network Policies:** Traffic restriction
- **Resource Management:** Guaranteed QoS
- **Prometheus:** Metrics annotations

### Load Testing
- **K6:** Performance testing (100 concurrent users, thresholds: p95<500ms)
- **JMeter:** Load testing scenarios

---

## Architecture Highlights

| Component | Technology |
|-----------|------------|
| Framework | NestJS 11 (Modular Architecture) |
| ORM | TypeORM with Repository Pattern |
| Caching | Redis (ioredis) |
| Validation | class-validator, Zod |
| Logging | Winston + Daily Rotate |
| Auth | Passport JWT |
| Storage | Local + Supabase |
| Notifications | Firebase Admin |
| Email | Resend |

---

## Quick Start

```bash
# Development
npm install
npm run start:dev

# Docker
docker-composeup -d

# Production Build
npm run build
npm run start:prod
```

---

## Available Scripts

```bash
npm run start:dev      # Development mode
npm run start:prod     # Production mode
npm run build          # Build project
npm run lint           # ESLint
npm run test           # Jest tests
npm run seed:dev       # Database seeding
```

---

<div align="center">

**Built with NestJS**

</div>
