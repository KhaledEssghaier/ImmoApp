Write-Host "Authentication Flow Test" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

$API = "http://localhost:3000/api/v1"
$EMAIL = "test$(Get-Date -Format 'HHmmss')@test.com"
$PASS = "Test123456!"

Write-Host "Config: $API | $EMAIL" -ForegroundColor Yellow
Write-Host ""

$passed = 0
$failed = 0

# Test 1: Signup
Write-Host "1. Signup..." -ForegroundColor Blue
$body = @{ fullName="Test User"; email=$EMAIL; password=$PASS } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$API/auth/signup" -Method Post -Body $body -ContentType "application/json"
    $token = $r.accessToken
    $refresh = $r.refreshToken
    Write-Host "   PASSED - Got tokens" -ForegroundColor Green
    $passed++
}
catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 2: Login
Write-Host "2. Login..." -ForegroundColor Blue
$body = @{ email=$EMAIL; password=$PASS } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$API/auth/login" -Method Post -Body $body -ContentType "application/json"
    $token = $r.accessToken
    $refresh = $r.refreshToken
    Write-Host "   PASSED - Got new tokens" -ForegroundColor Green
    $passed++
}
catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 3: Protected Endpoint
Write-Host "3. Protected Endpoint..." -ForegroundColor Blue
try {
    $h = @{ Authorization = "Bearer $token" }
    $r = Invoke-RestMethod -Uri "$API/users/me" -Method Get -Headers $h
    Write-Host "   PASSED - Got user profile" -ForegroundColor Green
    $passed++
}
catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 4: Refresh Token
Write-Host "4. Refresh Token..." -ForegroundColor Blue
$oldRefresh = $refresh
$body = @{ refreshToken=$refresh } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$API/auth/refresh" -Method Post -Body $body -ContentType "application/json"
    $token = $r.accessToken
    $refresh = $r.refreshToken
    
    if ($refresh -ne $oldRefresh) {
        Write-Host "   PASSED - Token rotated" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "   FAILED - Token did not rotate" -ForegroundColor Red
        $failed++
    }
}
catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 5: Old Token Invalid
Write-Host "5. Old Token Invalid..." -ForegroundColor Blue
$body = @{ refreshToken=$oldRefresh } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri "$API/auth/refresh" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   FAILED - Old token still works" -ForegroundColor Red
    $failed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   PASSED - Old token rejected" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "   FAILED - Unexpected error" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Test 6: Logout
Write-Host "6. Logout..." -ForegroundColor Blue
$body = @{ refreshToken=$refresh } | ConvertTo-Json
try {
    $h = @{ Authorization = "Bearer $token" }
    $r = Invoke-RestMethod -Uri "$API/auth/logout" -Method Post -Body $body -ContentType "application/json" -Headers $h
    Write-Host "   PASSED - Logged out" -ForegroundColor Green
    $passed++
}
catch {
    Write-Host "   FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 7: Token Invalid After Logout
Write-Host "7. Token Invalid After Logout..." -ForegroundColor Blue
try {
    $h = @{ Authorization = "Bearer $token" }
    $r = Invoke-RestMethod -Uri "$API/users/me" -Method Get -Headers $h -ErrorAction Stop
    Write-Host "   FAILED - Token still works" -ForegroundColor Red
    $failed++
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   PASSED - Token invalidated" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "   FAILED - Unexpected error" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Summary
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "SUCCESS!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "FAILED!" -ForegroundColor Red
    exit 1
}
