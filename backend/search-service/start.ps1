# Search Service Quick Start Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Search Service Quick Start" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
$currentDir = Get-Location
if ($currentDir.Path -notlike "*search-service*") {
    Write-Host "Changing directory to search-service..." -ForegroundColor Yellow
    Set-Location "D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\search-service"
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with the following variables:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PORT=3007" -ForegroundColor Gray
    Write-Host "NODE_ENV=development" -ForegroundColor Gray
    Write-Host "MONGODB_URI=your_mongodb_atlas_uri" -ForegroundColor Gray
    Write-Host "REDIS_HOST=localhost" -ForegroundColor Gray
    Write-Host "REDIS_PORT=6379" -ForegroundColor Gray
    Write-Host "CACHE_TTL=60" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

# Check Redis
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
try {
    $redisCheck = redis-cli ping 2>&1
    if ($redisCheck -like "*PONG*") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Redis is not running!" -ForegroundColor Red
    Write-Host "Please start Redis before continuing." -ForegroundColor Yellow
    Write-Host "Run: docker run -d --name redis -p 6379:6379 redis:7-alpine" -ForegroundColor Gray
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

Write-Host ""
Write-Host "Starting Search Service on Port 3007..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT REMINDERS:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB Atlas Search index is created (see README.md)" -ForegroundColor Gray
Write-Host "2. Redis should be running" -ForegroundColor Gray
Write-Host "3. MongoDB connection string should be in .env" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

# Start the service
npm run start:dev
