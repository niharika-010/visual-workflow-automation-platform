# Visual Workflow Automation Platform

A production-style, multi-tenant visual drag-and-drop workflow automation SaaS platform inspired by **n8n** and **Zapier**. Built with React, Vite, React Flow, Node.js, Express, PostgreSQL, Redis, and BullMQ background worker execution architecture.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client[React Flow Visual Editor & SaaS Dashboard] -->|REST APIs + JWT| Express[Express REST API Backend]
    Express -->|Read / Write| PG[(PostgreSQL Database)]
    Express -->|Enqueue Jobs| Queue[BullMQ Queue]
    Queue -->|State Persistence| Redis[(Redis 7)]
    Worker[Worker Execution Daemon] -->|Pull Jobs| Queue
    Worker -->|Fetch Workflows| PG
    Worker -->|Execute Nodes & Branching| Engine[Workflow Graph Executor]
    Engine -->|Record Step Logs| PG
    Engine -->|HTTP / Email / Slack / SQL| External[External APIs & Integrations]
```

---

## ✨ Key Features & Capabilities

- 🎨 **Visual Workflow Editor**: Interactive canvas with 12 node definitions, drag-and-drop catalog, custom handle routing, and node selection inspector.
- 🔐 **Multi-Tenant Authentication**: Secure user registration, password hashing (`bcryptjs`), JWT token authentication, and strict user ownership isolation (`WHERE user_id = $1`).
- ⚡ **Scalable Asynchronous Execution**: Non-blocking API execution dispatching background jobs to **BullMQ** queue on **Redis** with exponential backoff retries (`attempts: 3`).
- 🔄 **Workflow Versioning & Persistence**: JSON schema validation middleware, automated historical version snapshot tracking in `workflow_versions`, and 1-click Version Restoration.
- ⏱️ **Debounced Autosave & Live Badges**: Real-time canvas change detection with 2-second debounced autosave and live status badges (`Saved`, `Saving...`, `Unsaved`).
- 📊 **Execution Monitoring Dashboard**: Dedicated `/executions` dashboard and `/executions/:id` visual step log inspector with 2-second real-time polling.
- 🛡️ **Pre-Activation Workflow Validation**: Gatekeeper validation engine inspecting trigger presence, orphaned nodes, and required configuration schemas before activation.
- 🔑 **Secure Credential Store**: Decoupled credential management architecture (`credentials` table) ensuring raw API keys and database passwords are never stored in canvas JSON definitions.
- ⏰ **Server-Side Cron Scheduler**: Automated time-interval and cron expression scheduler (`node-cron`) triggering active workflows on demand.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS v4, React Flow (`@xyflow/react`), Zustand, React Router v6, Axios, Lucide Icons |
| **Backend API** | Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `pg` (PostgreSQL client), `axios`, `nodemailer`, `node-cron` |
| **Worker Engine** | Node.js Worker Daemon, BullMQ v5, `ioredis` |
| **Database & Cache** | PostgreSQL 16 (`uuid-ossp`, JSONB), Redis 7 |

---

## 📂 Project Structure

```text
workflow-automation-platform/
├── database/
│   └── init.sql                   # Complete PostgreSQL schema (users, workflows, versions, executions, credentials)
├── backend/
│   ├── src/
│   │   ├── config/                # Environment variables loader, pg Pool, ioredis, BullMQ queue
│   │   ├── controllers/           # Auth, Workflow CRUD, Execution, and Credential controllers
│   │   ├── middleware/            # JWT auth middleware & workflow JSON schema validation
│   │   ├── models/                # User, Workflow, Execution, and Credential repositories
│   │   ├── routes/                # Express API routes (/api/auth, /api/workflows, /api/credentials, /api/webhooks)
│   │   ├── services/              # Server-side Cron Scheduler service
│   │   ├── workflows/             # Execution engine: DAG graph executor & modular node handlers
│   │   │   ├── executor/          # Directed graph traversal engine
│   │   │   └── nodes/             # Handlers for Manual, Webhook, Schedule, HTTP, IF, Delay, Code, Email, Slack, SQL, Redis
│   │   ├── server.js              # Express backend server entry point (Port 5000)
│   │   └── test_full_suite.js     # Master test runner executing all 6 platform test suites
├── worker/
│   ├── src/
│   │   ├── config/                # Redis connection settings for BullMQ worker
│   │   ├── processors/            # Background job processor execution wrapper
│   │   └── index.js               # BullMQ Worker daemon entry point
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, Sidebar, ProtectedRoute, CreateWorkflowModal, Editor header & drawers
│   │   ├── nodes/                 # Standardized node definitions registry (12 node types & config schemas)
│   │   ├── pages/                 # Login, Register, Dashboard, WorkflowBuilder, Executions, ExecutionDetail, Settings
│   │   ├── services/              # Axios client with Bearer auth token interceptors
│   │   ├── store/                 # Zustand stores (useAuthStore, useWorkflowManagementStore, useWorkflowEditorStore)
│   │   └── utils/                 # Workflow graph validator (trigger check, orphaned node check, schema check)
│   └── vite.config.js             # Vite configuration with proxy settings
├── docker-compose.yml             # Docker services for PostgreSQL 16 (Port 5432) & Redis 7 (Port 6379)
├── .env.example                   # Centralized environment variable template
└── README.md                      # Comprehensive project documentation
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites

- Node.js v18+ & `npm`
- Docker Desktop (for running PostgreSQL & Redis containers)

### 2. Environment Setup

Copy `.env.example` to create `.env` in the root, backend, and worker directories:

```bash
cp .env.example .env
```

Default environment variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/workflow_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-jwt-key-workflow-automation
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Database & Redis via Docker

```bash
docker-compose up -d
```

### 4. Running Backend REST API

```bash
cd backend
npm install
npm run dev
```

*Backend server will start listening at `http://localhost:5000`.*

### 5. Running Worker Daemon

```bash
cd worker
npm install
npm run dev
```

*Worker process will start listening on BullMQ queue `workflow-execution-queue`.*

### 6. Running Frontend Application

```bash
cd frontend
npm install
npm run dev
```

*Frontend Web Application will be available at `http://localhost:3000`.*

---

## 🧪 Master Test Runner & Testing Checklist

Run the complete 6-module automated integration test suite:

```bash
cd backend
node src/test_full_suite.js
```

### Automated Scorecard Results

- ✅ **Phase 2: User Authentication & JWT Security** (`node src/test_auth.js`)
- ✅ **Phase 3: Workflows CRUD & Ownership Isolation** (`node src/test_workflows.js`)
- ✅ **Phase 6: Persistence, Schema Validation & Versioning** (`node src/test_persistence.js`)
- ✅ **Phase 7: Core Graph Execution Engine & IF Logic** (`node src/test_execution.js`)
- ✅ **Phase 8: BullMQ Worker Background Queue** (`node src/test_bullmq.js`)
- ✅ **Phase 9: Real-World Integrations & Credential Store** (`node src/test_integrations.js`)

---

## 📡 API Reference Documentation

### Authentication APIs

- `POST /api/auth/register` - Register new user account.
- `POST /api/auth/login` - Authenticate credentials and receive JWT.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Workflow Management APIs

- `POST /api/workflows` - Create a new workflow draft.
- `GET /api/workflows` - List authenticated user's workflows.
- `GET /api/workflows/:id` - Fetch workflow definition by ID.
- `PUT /api/workflows/:id` - Validate schema, save workflow, and create historical version snapshot.
- `DELETE /api/workflows/:id` - Delete workflow.
- `POST /api/workflows/:id/activate` - Activate workflow for automated triggers.
- `POST /api/workflows/:id/deactivate` - Deactivate workflow.

### Versioning & Execution APIs

- `GET /api/workflows/:id/versions` - List historical version snapshots.
- `POST /api/workflows/:id/versions/:versionId/restore` - Restore target version.
- `POST /api/workflows/:id/execute` - Enqueue asynchronous workflow execution job.
- `ALL /api/webhooks/*` - Dynamic webhook execution trigger.
- `GET /api/workflows/:id/executions` - List execution history runs.
- `GET /api/executions/:executionId` - Fetch execution detail with step-by-step node logs.

### Credential Management APIs

- `POST /api/credentials` - Store encrypted/isolated integration credential.
- `GET /api/credentials` - List user credentials (secrets masked).
- `DELETE /api/credentials/:id` - Delete credential.

---

## 🔮 Future Improvements

1. **Sub-workflows**: Allow invoking nested workflows as custom action nodes.
2. **WebSocket Real-Time Canvas Execution Animations**: Animate active node borders live on the React Flow canvas during execution.
3. **Advanced Expressions & Handlebars Templating**: Support `{{ $node["Webhook"].json.body.email }}` dynamic field mapping.

---

## 📄 License

MIT License. Designed and engineered for the Visual Workflow Automation Platform.
