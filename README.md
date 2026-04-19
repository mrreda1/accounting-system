# accounting-system
Account system for a college project :)

## Run everything with Docker Compose

From the repository root:

```bash
docker compose up --build
```

Or with npm scripts:

```bash
npm run compose:up
```

Services started by compose:

- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:4001`
- Frontend (Vite): `http://localhost:5174`

Useful commands:

```bash
npm run compose:down   # stop containers
npm run compose:reset  # stop, remove volumes, rebuild, and start again
```
