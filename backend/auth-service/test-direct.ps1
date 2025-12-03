Write-Host "Direct Auth Service Test" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$API = "http://localhost:3001"
$EMAIL = "direct$(Get-Date -Format 'HHmmss')@test.com"
$PASS = "Test123456!"

Write-Host "Testing: $API | $EMAIL" -ForegroundColor Yellow
Write-Host ""

# Test Signup
Write-Host "Testing Signup..." -ForegroundColor Blue
$body = @{ fullName="Test User"; email=$EMAIL; password=$PASS; phone="+1234567890" } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$API/auth/signup" -Method Post -Body $body -ContentType "application/json"
    $token = $r.accessToken
    $refresh = $r.refreshToken
    Write-Host "SUCCESS - Got tokens" -ForegroundColor Green
    Write-Host "Access Token: $($token.Substring(0,30))..." -ForegroundColor Gray
    Write-Host "Refresh Token: $($refresh.Substring(0,30))..." -ForegroundColor Gray
}
catch {
    Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
