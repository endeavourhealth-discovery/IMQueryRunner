# Repository Guidelines

## Project Structure & Module Organization
This is a **Nuxt 3** (Full-stack) application utilizing a producer-consumer architecture for Information Model (IM) query execution.

- **[./app/](./app/)**: Frontend (Vue 3, Pinia, PrimeVue). Follows standard Nuxt structure.
- **[./server/](./server/)**: Backend (Nitro). Contains API endpoints, Drizzle ORM configurations, and RabbitMQ integration.
- **[./models/](./models/)**: Shared Zod schemas and TypeScript interfaces for both frontend and backend validation.
- **[./docker/](./docker/)**: Infrastructure setup for local development (MySQL, PostgreSQL, RabbitMQ, Casdoor).

The application uses **RabbitMQ** to handle long-running query jobs. The producer logic is typically in `server/api/queue/` while consumers are in `server/rabbitmq/`.

## Build, Test, and Development Commands
Use `pnpm` as the package manager.

- **Dev**: `pnpm dev`
- **Build**: `pnpm build`
- **Tests**: `pnpm test:unit`
- **Type Check**: `npx vue-tsc`
- **Database Schema Sync**:
  - `pnpm drizzle-pull`: Pulls both Postgres and MySQL schemas.
  - `pnpm drizzle-pull-postgres`: Pulls only Postgres.
  - `pnpm drizzle-pull-mysql`: Pulls only MySQL.

## Coding Style & Naming Conventions
- **TypeScript**: Strictly enforced; `typescript.typeCheck` is enabled in `nuxt.config.ts`.
- **Validation**: Use **Zod** for all API request/response validation.
- **UI**: Components use **PrimeVue** with **Tailwind CSS** for styling.
- **State Management**: Use **Pinia** stores in `app/stores/`.
- **Database**: Use **Drizzle ORM** for database interactions.

## Testing Guidelines
- **Framework**: **Vitest** is used for unit testing.
- **Location**: Tests are located in `tests/unit/`.
- **Run all tests**: `pnpm test:unit`

## Commit & Pull Request Guidelines
- **Commit Messages**: Follow conventional commits (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
- **Patterns**: Recent history shows a preference for concise messages and merging via Pull Requests (e.g., `Merge pull request #XX from ...`).
