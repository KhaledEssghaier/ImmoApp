# Search Service - Automated Setup Script

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Search Service Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js 20+" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Installing Dependencies" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Install dependencies
Write-Host "Running npm install..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Checking Configuration" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check .env file
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check required variables
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @(
        "PORT",
        "MONGODB_URI",
        "REDIS_HOST",
        "REDIS_PORT"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠ Missing environment variables:" -ForegroundColor Yellow
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✓ All required environment variables present" -ForegroundColor Green
    }
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env file with:" -ForegroundColor Yellow
    Write-Host "PORT=3007" -ForegroundColor Gray
    Write-Host "NODE_ENV=development" -ForegroundColor Gray
    Write-Host "MONGODB_URI=your_mongodb_atlas_uri" -ForegroundColor Gray
    Write-Host "REDIS_HOST=localhost" -ForegroundColor Gray
    Write-Host "REDIS_PORT=6379" -ForegroundColor Gray
    Write-Host "CACHE_TTL=60" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Checking Redis" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Redis
try {
    $redisCheck = redis-cli ping 2>&1
    if ($redisCheck -like "*PONG*") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis not responding" -ForegroundColor Red
        Write-Host "Start Redis with: docker run -d --name redis -p 6379:6379 redis:7-alpine" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Redis not running" -ForegroundColor Red
    Write-Host "Start Redis with: docker run -d --name redis -p 6379:6379 redis:7-alpine" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Ensure MongoDB Atlas Search index is created (see DEPLOYMENT.md)" -ForegroundColor White
Write-Host "2. Start Redis if not running" -ForegroundColor White
Write-Host "3. Configure .env file" -ForegroundColor White
Write-Host "4. Run: npm run start:dev" -ForegroundColor White
Write-Host ""

Write-Host "To start the service now:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor Green
Write-Host ""
