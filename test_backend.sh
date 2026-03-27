#!/bin/bash

# Test Backend Setup
echo "=========================================="
echo "Broker IA - Backend Testing Guide"
echo "=========================================="
echo ""

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend-code" || exit

echo ""
echo "=========================================="
echo "Step 1: Installing Dependencies"
echo "=========================================="
echo ""

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "=========================================="
echo "Step 2: Environment Configuration"
echo "=========================================="
echo ""

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please update the following in .env:"
    echo "   - DATABASE_URL (PostgreSQL connection)"
    echo "   - JWT_SECRET (random secret key)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "=========================================="
echo "Step 3: TypeScript Compilation Check"
echo "=========================================="
echo ""

echo "Checking TypeScript compilation..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript errors found (may be warnings)"
fi

echo ""
echo "=========================================="
echo "Step 4: Database Setup"
echo "=========================================="
echo ""

echo "To set up the database, run:"
echo "  npx prisma migrate dev --name init"
echo "  npx prisma generate"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d postgres"
echo "  npx prisma migrate dev"

echo ""
echo "=========================================="
echo "Step 5: Starting Backend Server"
echo "=========================================="
echo ""

echo "To start the development server:"
echo "  npm run start:dev"
echo ""
echo "To start the production build:"
echo "  npm run build"
echo "  npm run start:prod"
echo ""
echo "Server will run on: http://localhost:3001"

echo ""
echo "=========================================="
echo "Testing Backend API"
echo "=========================================="
echo ""
echo "Once the server is running, test endpoints:"
echo ""
echo "1. Health check:"
echo "   curl http://localhost:3001/"
echo ""
echo "2. Register user:"
echo "   curl -X POST http://localhost:3001/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"password123\"}'"
echo ""
echo "3. Login:"
echo "   curl -X POST http://localhost:3001/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}'"
echo ""
echo "4. Create signal (requires token):"
echo "   curl -X POST http://localhost:3001/api/signals \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"asset\":\"BTC/USDT\",\"direction\":\"BUY\",\"entry_price\":45000,\"stop_loss\":44000,\"take_profit\":46000,\"confidence\":85}'"
echo ""
echo "5. Get signals:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     http://localhost:3001/api/signals"

echo ""
echo "=========================================="
echo "Troubleshooting"
echo "=========================================="
echo ""
echo "If you encounter issues:"
echo "1. Ensure PostgreSQL is running"
echo "2. Update DATABASE_URL in .env"
echo "3. Clear node_modules: rm -rf node_modules && npm install"
echo "4. Check logs: npm run start:dev"
echo ""
echo "For more details, see backend-code/README.md"
