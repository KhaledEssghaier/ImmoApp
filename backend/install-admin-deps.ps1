Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Installing Admin Service Dependencies" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to admin-service
Set-Location "admin-service"

Write-Host "[1/2] Installing backend dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "[2/2] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "..\admin-ui"
npm install

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "✓ Installation Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Configure .env in admin-service/" -ForegroundColor Gray
Write-Host "2. Configure .env.local in admin-ui/" -ForegroundColor Gray
Write-Host "3. Run: cd admin-service && npm run start:dev" -ForegroundColor Gray
Write-Host "4. Run: cd admin-ui && npm run dev" -ForegroundColor Gray

Set-Location ".."
