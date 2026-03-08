# ContentOS

AI-powered, creator-centric platform that supports the entire content lifecycle in one unified workflow.

## Architecture

ContentOS is built as a monorepo with two main workspaces:

- **Backend**: Node.js/Express API with TypeScript
- **Frontend**: React 18 with TypeScript, Redux Toolkit, and TailwindCSS

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL (relational data)
- Redis (caching)
- JWT authentication
- Jest + fast-check (testing)

### Frontend
- React 18
- TypeScript
- Redux Toolkit (state management)
- React Router (navigation)
- TailwindCSS (styling)
- Vite (build tool)
- Jest + fast-check (testing)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL and Redis)

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 2. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp packages/backend/.env.example packages/backend/.env

# Edit .env file with your configuration
# For local development, the defaults should work
```

### 4. Run Database Migrations

```bash
# Run migrations to create database schema
npm run migrate --workspace=backend
```

### 5. Start Development Servers

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:3000
```

## Project Structure

```
content-os/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/         # Configuration
│   │   │   ├── db/             # Database setup and migrations
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── cache/          # Redis client
│   │   │   ├── app.ts          # Express app setup
│   │   │   └── index.ts        # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       │   ├── api/            # API client
│       │   ├── store/          # Redux store
│       │   ├── App.tsx         # Main app component
│       │   └── main.tsx        # Entry point
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml          # PostgreSQL and Redis
├── package.json                # Root package.json
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all workspaces
- `npm run test` - Run tests in all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code with Prettier

### Backend
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend
- `npm run test --workspace=backend` - Run backend tests
- `npm run migrate --workspace=backend` - Run database migrations

### Frontend
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run test --workspace=frontend` - Run frontend tests

## Testing

The project uses Jest and fast-check for testing:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch --workspace=backend
npm run test:watch --workspace=frontend
```

## Database Management

### Run Migrations
```bash
npm run migrate --workspace=backend
```

### Connect to PostgreSQL
```bash
docker exec -it contentos-postgres psql -U postgres -d contentos
```

### Connect to Redis
```bash
docker exec -it contentos-redis redis-cli
```

## API Documentation

The backend API runs on `http://localhost:3001`

### Health Check
```
GET /health
```

### API Base
```
GET /api
```

More endpoints will be added as features are implemented.

## Development Workflow

1. Create a new branch for your feature
2. Make changes and write tests
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Format code: `npm run format`
6. Commit and push changes

## Environment Variables

### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `OPENAI_API_KEY` - OpenAI API key (for AI features)

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Port Already in Use
```bash
# Find process using port 3001 (backend)
lsof -i :3001

# Find process using port 3000 (frontend)
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## License

MIT
