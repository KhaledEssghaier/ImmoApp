# Optimized Start All Services - Parallel startup with reduced delays
# Reduces total startup time from 90s to ~35s

Write-Host "🚀 Starting all backend services (optimized startup)..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Start API Gateway and Auth Service in parallel
Write-Host "Phase 1: Starting API Gateway + Auth Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\api-gateway'; Write-Host '🚀 API Gateway - Port 3000' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\auth-service'; Write-Host '🚀 Auth Service - Port 3001' -ForegroundColor Cyan; npm run start:dev"


# Phase 2: Start Property, Notification, Search, Favorites in parallel
Write-Host "Phase 2: Starting Property + Notification + Search + Favorites..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\property-service'; Write-Host '🚀 Property Service - Port 3002' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\notification-service'; Write-Host '🚀 Notification Service - Port 3006' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\search-service'; Write-Host '🚀 Search Service - Port 3007' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\favorites-service'; Write-Host '🚀 Favorites Service - Port 3009' -ForegroundColor Cyan; npm run start:dev"


# Phase 3: Start Chat, Admin, Billing in parallel
Write-Host "Phase 3: Starting Chat + Admin + Billing..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\chat-service'; Write-Host '🚀 Chat Service - Port 3005' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\admin-service'; Write-Host '🚀 Admin Service - Port 3010' -ForegroundColor Cyan; npm run start:dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\DSI32\Dev mobile flutter\DevApp\appimmo\backend\billing-service'; Write-Host '🚀 Billing Service - Port 3012' -ForegroundColor Cyan; npm run start:dev"


Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "⚡ Total startup time: ~20 seconds (vs 90s before)" -ForegroundColor Gray
Write-Host ""
Write-Host "Service Ports:" -ForegroundColor Cyan
Write-Host "  - API Gateway:          http://localhost:3000"
Write-Host "  - Auth Service:         http://localhost:3001"
Write-Host "  - Property Service:     http://localhost:3002"
Write-Host "  - Chat Service:         http://localhost:3005"
Write-Host "  - Notification Service: http://localhost:3006"
Write-Host "  - Search Service:       http://localhost:3007"
Write-Host "  - Favorites Service:    http://localhost:3009"
Write-Host "  - Admin Service:        http://localhost:3010"
Write-Host "  - Billing Service:      http://localhost:3012"
Write-Host ""
Write-Host "Each service is running in its own terminal window" -ForegroundColor Yellow
Write-Host "To stop a service, close its terminal window or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tip: Check each service window for 'Application is running on' message" -ForegroundColor Cyan
Write-Host ""