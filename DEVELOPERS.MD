# Developer Overview - IMQueryRunner

Welcome to the **IMQueryRunner** development documentation. This document provides a structural and technical overview of the project to help developers get started quickly.

## Project Overview

IMQueryRunner is a full-stack application built with **Nuxt 3** designed to manage, execute, and monitor Information Model (IM) queries. It integrates with an external IMAPI for SQL generation and uses a queue-based system for job execution.

## Tech Stack

- **Framework**: [Nuxt 3](https://nuxt.com/) (Vue 3, Nitro)
- **Frontend**:
  - **UI Components**: [PrimeVue](https://primevue.org/)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  - **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Backend**:
  - **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (MySQL & PostgreSQL support)
  - **Queue**: [RabbitMQ](https://www.rabbitmq.com/) via `rabbitmq-client`
  - **API**: Nitro (built into Nuxt)
- **Validation**: [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Authentication**: Casdoor & AWS Cognito

## Directory Structure

| Directory | Description |
|-----------|-------------|
| [./app/](./app/) | Frontend source code (components, pages, stores, layouts). |
| [./server/](./server/) | Backend source code (API endpoints, DB config, RabbitMQ logic, middleware). |
| [./models/](./models/) | Shared TypeScript interfaces and Zod schemas. |
| [./enums/](./enums/) | Project-wide enumerations (e.g., JobStatus, Resource). |
| [./docker/](./docker/) | Infrastructure setup scripts for MySQL, PostgreSQL, RabbitMQ, and Casdoor. |
| [./shared/](./shared/) | Common utilities like loggers and global type definitions. |
| [./tests/](./tests/) | Unit and integration tests. |
| [./docs/](./docs/) | Project documentation and specifications. |

## Key Architectural Patterns

### 1. Job Queue System
The application uses a producer-consumer pattern for long-running queries:
- **Producer**: API endpoints in [./server/api/queue/job/add.post.ts](./server/api/queue/job/add.post.ts) add jobs to RabbitMQ.
- **Consumer**: Background tasks/plugins in `server/rabbitmq/` or `server/tasks/` process these jobs.
- **Status Tracking**: Job states are updated in the database and can be monitored via [./server/api/queue/index.get.ts](./server/api/queue/index.get.ts).

### 2. Database Layer
The project uses **Drizzle ORM** with support for multiple database engines. 
- Schemas are defined in [./models/](./models/) (often using `drizzle-zod` for validation).
- Connection configurations are located in [./server/db/](./server/db/).

### 3. API Integration (IMAPI)
Integration with the core Information Model API is handled in [./server/api/imapi/](./server/api/imapi/). This includes:
- Converting IMQ (Information Model Query) to SQL.
- Fetching query metadata and children.

## Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm
- Docker (for local database and RabbitMQ setup)

### Setup Commands
- **Install dependencies**: `pnpm install`
- **Start infrastructure**: Use scripts in `./docker/` to spin up required containers.
- **Development mode**: `pnpm dev`
- **Run tests**: `pnpm test:unit`

## Useful Links
- [Specification](./Specification.md) - Functional requirements and TODOs.
- [Drizzle Kit](./package.json) - Check scripts for `drizzle-pull` to sync DB schemas.
