# Broker IA - Complete Testing Guide
# PowerShell Script for Windows

Write-Host "=========================================="
Write-Host "Broker IA - Full Stack Testing"
Write-Host "=========================================="
Write-Host ""

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$warningColor = "Yellow"
$infoColor = "Cyan"

# Function to check installed software
function Check-Software {
    param([string]$Name, [string]$Command)
    
    try {
        $result = & $Command 2>&1
        Write-Host "✅ $Name installed" -ForegroundColor $successColor
        return $true
    }
    catch {
        Write-Host "❌ $Name not found" -ForegroundColor $errorColor
        return $false
    }
}

# Check prerequisites
Write-Host "PREREQUISITES CHECK" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$hasNode = Check-Software "Node.js" "node --version"
$hasPython = Check-Software "Python" "python --version"
$hasGit = Check-Software "Git" "git --version"
$hasDocker = Check-Software "Docker" "docker --version"

if (-not ($hasNode)) {
    Write-Host "⚠️  Node.js is required. Download from https://nodejs.org/" -ForegroundColor $warningColor
}

if (-not ($hasPython)) {
    Write-Host "⚠️  Python is required for AI module. Download from https://python.org/" -ForegroundColor $warningColor
}

Write-Host ""
Write-Host "TEST 1: AI Module" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$aiPath = ".\ai-module"
if (Test-Path $aiPath) {
    Write-Host "✅ AI module directory found"
    
    # Check Python files
    $pythonFiles = @(
        "candlestick_patterns.py",
        "indicators_calculator.py",
        "scoring_engine.py",
        "signal_generator.py",
        "dca_simulator.py"
    )
    
    foreach ($file in $pythonFiles) {
        $filePath = Join-Path $aiPath $file
        if (Test-Path $filePath) {
            Write-Host "✅ $file exists" -ForegroundColor $successColor
        }
        else {
            Write-Host "❌ $file missing" -ForegroundColor $errorColor
        }
    }
    
    Write-Host ""
    Write-Host "To test AI module:"
    Write-Host "1. Navigate to ai-module folder"
    Write-Host "2. Install Python dependencies:"
    Write-Host "   pip install -r requirements.txt"
    Write-Host "3. Run test script:"
    Write-Host "   python test_ai_module.py"
}
else {
    Write-Host "❌ AI module directory not found" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "TEST 2: Backend Setup" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$backendPath = ".\backend-code"
if (Test-Path $backendPath) {
    Write-Host "✅ Backend directory found"
    
    # Check package.json
    $packagePath = Join-Path $backendPath "package.json"
    if (Test-Path $packagePath) {
        Write-Host "✅ package.json found"
    }
    else {
        Write-Host "❌ package.json not found" -ForegroundColor $errorColor
    }
    
    # Check src files
    $srcPath = Join-Path $backendPath "src"
    if (Test-Path $srcPath) {
        Write-Host "✅ Source directory found"
        
        $mainFile = Join-Path $srcPath "main.ts"
        if (Test-Path $mainFile) {
            Write-Host "✅ main.ts found"
        }
    }
    else {
        Write-Host "❌ Source directory not found" -ForegroundColor $errorColor
    }
    
    Write-Host ""
    Write-Host "To set up backend:"
    Write-Host "1. Navigate to backend-code folder"
    Write-Host "2. Install dependencies:"
    Write-Host "   npm install"
    Write-Host "3. Create .env file:"
    Write-Host "   copy .env.example .env"
    Write-Host "4. Start development server:"
    Write-Host "   npm run start:dev"
    Write-Host ""
    Write-Host "Server will run on: http://localhost:3001"
}
else {
    Write-Host "❌ Backend directory not found" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "TEST 3: Frontend Setup" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$frontendPath = ".\frontend-web"
if (Test-Path $frontendPath) {
    Write-Host "✅ Frontend directory found"
    
    # Check package.json
    $packagePath = Join-Path $frontendPath "package.json"
    if (Test-Path $packagePath) {
        Write-Host "✅ package.json found"
    }
    
    # Check pages
    $pagesPath = Join-Path $frontendPath "pages"
    if (Test-Path $pagesPath) {
        Write-Host "✅ Pages directory found"
        
        $indexPage = Join-Path $pagesPath "index.tsx"
        if (Test-Path $indexPage) {
            Write-Host "✅ Home page found"
        }
    }
    
    Write-Host ""
    Write-Host "To set up frontend:"
    Write-Host "1. Navigate to frontend-web folder"
    Write-Host "2. Install dependencies:"
    Write-Host "   npm install"
    Write-Host "3. Create .env.local:"
    Write-Host "   copy .env.local.example .env.local"
    Write-Host "4. Start development server:"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "Frontend will run on: http://localhost:3000"
}
else {
    Write-Host "❌ Frontend directory not found" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "TEST 4: Mobile Setup" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$mobilePath = ".\mobile"
if (Test-Path $mobilePath) {
    Write-Host "✅ Mobile directory found"
    
    # Check package.json
    $packagePath = Join-Path $mobilePath "package.json"
    if (Test-Path $packagePath) {
        Write-Host "✅ package.json found"
    }
    
    # Check screens
    $screensPath = Join-Path $mobilePath "src\screens"
    if (Test-Path $screensPath) {
        Write-Host "✅ Screens directory found"
    }
    
    Write-Host ""
    Write-Host "To set up mobile:"
    Write-Host "1. Navigate to mobile folder"
    Write-Host "2. Install dependencies:"
    Write-Host "   npm install"
    Write-Host "3. Create .env:"
    Write-Host "   copy .env.example .env"
    Write-Host "4. Start Expo:"
    Write-Host "   npm start"
    Write-Host ""
    Write-Host "Then scan QR code with Expo app or start iOS/Android:"
    Write-Host "   npm run ios"
    Write-Host "   npm run android"
}
else {
    Write-Host "❌ Mobile directory not found" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "TEST 5: Docker Setup" -ForegroundColor $infoColor
Write-Host "===========================================" -ForegroundColor $infoColor
Write-Host ""

$dockerCompose = ".\docker-compose.yml"
if (Test-Path $dockerCompose) {
    Write-Host "✅ docker-compose.yml found"
    Write-Host ""
    Write-Host "To start all services with Docker:"
    Write-Host "1. Ensure Docker is running"
    Write-Host "2. Run:"
    Write-Host "   docker-compose up -d"
    Write-Host ""
    Write-Host "Services will be available at:"
    Write-Host "   Backend:   http://localhost:3001"
    Write-Host "   Frontend:  http://localhost:3000"
    Write-Host "   PostgreSQL: localhost:5432"
    Write-Host "   Redis:      localhost:6379"
}
else {
    Write-Host "❌ docker-compose.yml not found" -ForegroundColor $errorColor
}

Write-Host ""
Write-Host "=========================================="
Write-Host "QUICK START COMMANDS" -ForegroundColor $infoColor
Write-Host "=========================================="
Write-Host ""

Write-Host "Option 1: Test AI Module (Python)" -ForegroundColor $infoColor
Write-Host "cd ai-module"
Write-Host "pip install -r requirements.txt"
Write-Host "python test_ai_module.py"
Write-Host ""

Write-Host "Option 2: Start All Services with Docker" -ForegroundColor $infoColor
Write-Host "docker-compose up -d"
Write-Host ""

Write-Host "Option 3: Manual Setup (Development)" -ForegroundColor $infoColor
Write-Host "# Terminal 1 - Backend"
Write-Host "cd backend-code && npm install && npm run start:dev"
Write-Host ""
Write-Host "# Terminal 2 - Frontend"
Write-Host "cd frontend-web && npm install && npm run dev"
Write-Host ""
Write-Host "# Terminal 3 - Mobile"
Write-Host "cd mobile && npm install && npm start"
Write-Host ""

Write-Host "=========================================="
Write-Host "API TESTING EXAMPLES" -ForegroundColor $infoColor
Write-Host "=========================================="
Write-Host ""

Write-Host "1. Register User:" -ForegroundColor $infoColor
Write-Host 'curl -X POST http://localhost:3001/api/auth/register `'
Write-Host '  -H "Content-Type: application/json" `'
Write-Host '  -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"test123\"}"'
Write-Host ""

Write-Host "2. Login:" -ForegroundColor $infoColor
Write-Host 'curl -X POST http://localhost:3001/api/auth/login `'
Write-Host '  -H "Content-Type: application/json" `'
Write-Host '  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"'
Write-Host ""

Write-Host "3. Get Signals:" -ForegroundColor $infoColor
Write-Host 'curl -H "Authorization: Bearer YOUR_JWT_TOKEN" `'
Write-Host '  http://localhost:3001/api/signals'
Write-Host ""

Write-Host "=========================================="
Write-Host "Testing Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Choose a testing option above"
Write-Host "2. Install dependencies"
Write-Host "3. Configure environment variables"
Write-Host "4. Start the services"
Write-Host ""
Write-Host "For detailed documentation, see README_FULL_STACK.md"
