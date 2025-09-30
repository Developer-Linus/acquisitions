# Acquisitions API - Dockerized with Neon

This repository includes Docker configurations for both development (using Neon Local) and production (using Neon Cloud).

## Prerequisites
- Docker and Docker Compose
- A Neon account (for API key, project ID, and production DB URL)

## Project structure
- Dockerfile — builds the Node.js app image
- docker-compose.dev.yml — runs Neon Local proxy + the app (development)
- docker-compose.prod.yml — runs the app only (production; connects to Neon Cloud)
- .env.development — app env for development (uses Neon Local)
- .env.production — app env for production (uses Neon Cloud)

## Environment variables
- DATABASE_URL switches automatically between dev and prod by using different env files:
  - Development: set to `postgres://neon:npg@neon-local:5432/appdb` (Neon Local)
  - Production: set to your Neon Cloud connection string
- NEON_LOCAL=1 enables Neon Local behavior in code (configures the Neon serverless driver to use the local proxy)

## Development (Neon Local)
Neon Local creates an ephemeral branch for your DB automatically when the container starts (if you set `PARENT_BRANCH_ID`), and deletes it when stopped.

1. Export Neon credentials in your shell (do not commit these):
   - NEON_API_KEY=your_neon_api_key
   - NEON_PROJECT_ID=your_neon_project_id
   - PARENT_BRANCH_ID=parent_branch_id_for_ephemeral  # optional but recommended

2. Copy `.env.development` and adjust values as needed.

3. Start services:

   ```sh
   docker compose -f docker-compose.dev.yml up --build
   ```

   - App listens on http://localhost:3000
   - Postgres is available via Neon Local on port 5432 (inside compose network as `neon-local:5432`)

> Note: The code automatically sets `neonConfig.fetchEndpoint = http://neon-local:5432/sql` and disables websockets when `NEON_LOCAL=1`.

### Persisting branches across runs
To keep a branch instead of deleting it after shutdown, set `DELETE_BRANCH=false` on the `neon-local` service. See `docker-compose.dev.yml` comments.

### Git-aware persistent branches
The compose file mounts `.git/HEAD` and `.neon_local` so Neon Local can maintain branch metadata per Git branch. Ensure `.neon_local/` is in `.gitignore`.

## Production (Neon Cloud)
No Neon Local is used in production.

1. Set up `.env.production` with production secrets, including:
   - `DATABASE_URL=postgres://...neon.tech.../dbname?sslmode=require`
   - `JWT_SECRET` and other secrets

2. Start the app container:

   ```sh
   docker compose -f docker-compose.prod.yml up --build -d
   ```

The app will connect directly to the Neon Cloud database using the `DATABASE_URL` you supply.

## Notes
- The app’s database configuration (src/config/database.js) detects `NEON_LOCAL=1` and routes Neon serverless driver traffic through the Neon Local proxy over HTTP fetch.
- Avoid committing real secrets. Use env files locally and inject secrets in CI/CD or your orchestrator for production.