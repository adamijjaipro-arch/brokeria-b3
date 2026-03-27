# Broker IA Backend

NestJS backend for the Broker IA trading signal platform.

## Features

- User authentication with JWT
- Trading signal management (CRUD)
- DCA simulator with compound interest calculations
- Integration with Python AI modules
- RESTful API with comprehensive endpoints
- Prisma ORM for database abstraction
- PostgreSQL database
- Redis caching support

## Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Python 3.8+ (for AI modules)
- npm or yarn

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brokeria
JWT_SECRET=your_secret_key
JWT_EXPIRATION=15m
PORT=3001
```

## Database Setup

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Signals
- `GET /api/signals` - List all signals
- `GET /api/signals/recent` - Get recent signals
- `POST /api/signals` - Create new signal
- `GET /api/signals/statistics` - Get signal statistics

### Simulator
- `POST /api/simulator/dca` - Run DCA simulation

### AI
- `POST /api/ai/analyze-strategy` - Analyze trading strategy
- `POST /api/ai/detect-patterns` - Detect chart patterns
- `POST /api/ai/generate-signal` - Generate trading signal
- `GET /api/ai/health` - Check AI module health

## Testing

```bash
npm run test
npm run test:watch
npm run test:e2e
```

## Deployment

### Docker

```bash
docker build -t broker-ia-backend .
docker run -p 3001:3001 broker-ia-backend
```

### Docker Compose

```bash
docker-compose up -d backend
```

## Troubleshooting

- Ensure PostgreSQL is running
- Check database URL in `.env`
- Verify JWT secrets are set correctly
- Python AI modules should be in `/ai-module` directory

## Architecture

```
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
├── app.controller.ts    # Root controller
├── auth/                # Authentication module
├── signals/             # Signals management module
├── simulator/           # DCA simulator module
├── ai/                  # AI integration module
├── database/            # Database configuration
├── users/               # User management
├── strategies/          # Strategy management
├── reports/             # Report generation
└── payments/            # Payment processing
```

## License

MIT
