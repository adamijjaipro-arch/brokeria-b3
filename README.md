# Broker IA Frontend

Next.js frontend for the Broker IA trading signal platform.

## Features

- User authentication and profile management
- Real-time trading signal display
- DCA simulator with interactive charts
- Strategy upload and management
- Performance reports and analytics
- Responsive design with Tailwind CSS
- Dark theme optimized for trading

## Prerequisites

- Node.js 16+
- npm or yarn

## Installation

```bash
npm install
```

## Environment Setup

```bash
cp .env.local.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running the Application

### Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

## Pages

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard with stats
- `/signals` - Signal list and filtering
- `/signals/[id]` - Signal detail page
- `/simulator` - DCA simulator
- `/strategies` - Strategy management
- `/strategies/new` - Upload new strategy
- `/reports` - Monthly performance reports
- `/profile` - User profile settings
- `/pricing` - Pricing plans

## Components

- Navigation/Header
- Signal Cards
- Stats Cards
- Forms (Login, Register, Strategy Upload)
- Charts and Analytics
- Dark theme components

## Styling

- Tailwind CSS for styling
- Custom dark theme (Slate colors)
- Responsive grid layouts
- Mobile-optimized design

## API Integration

All API calls are made to `http://localhost:3001` (configurable via `NEXT_PUBLIC_API_URL`).

Authentication uses JWT tokens stored in localStorage.

## Deployment

### Docker

```bash
docker build -t broker-ia-frontend .
docker run -p 3000:3000 broker-ia-frontend
```

### Vercel

```bash
npm install -g vercel
vercel
```

## Performance

- Next.js server-side rendering
- Automatic code splitting
- Image optimization
- CSS minification

## License

MIT
