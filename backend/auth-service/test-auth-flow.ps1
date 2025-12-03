Write-Host "Authentication Flow Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_GATEWAY = "http://localhost:3000/api/v1"
$EMAIL = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$PASSWORD = "TestPassword123!"

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "   API Gateway: $API_GATEWAY"
Write-Host "   Test Email: $EMAIL"
Write-Host "   Test Password: $PASSWORD"
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/health" -Method Get
    Write-Host "   Response: OK" -ForegroundColor Gray
    Write-Host "   PASSED" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 2: Signup
Write-Host "2. Testing User Signup..." -ForegroundColor Blue
$signupBody = @{
    fullName = "Test User"
    email = $EMAIL
    password = $PASSWORD
    phone = "+1234567890"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    $accessToken = $response.accessToken
    $refreshToken = $response.refreshToken
    $userId = $response.user.id
    
    if ($accessToken -and $refreshToken) {
        Write-Host "   ✓ Signup successful" -ForegroundColor Green
        Write-Host "   User ID: $userId" -ForegroundColor Gray
        Write-Host "   Access Token: $($accessToken.Substring(0, [Math]::Min(30, $accessToken.Length)))..." -ForegroundColor Gray
        Write-Host "   Refresh Token: $($refreshToken.Substring(0, [Math]::Min(30, $refreshToken.Length)))..." -ForegroundColor Gray
        $testsPassed++
    } else {
        throw "Missing tokens in response"
    }
} catch {
    Write-Host "   ✗ Signup failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $testsFailed++
    exit 1
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing User Login..." -ForegroundColor Blue
$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    $accessToken = $response.accessToken
    $refreshToken = $response.refreshToken
    
    if ($accessToken -and $refreshToken) {
        Write-Host "   ✓ Login successful" -ForegroundColor Green
        $testsPassed++
    } else {
        throw "Missing tokens in response"
    }
} catch {
    Write-Host "   ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $testsFailed++
}
Write-Host ""

# Test 4: Protected Endpoint
Write-Host "4. Testing Protected Endpoint (GET /users/me)..." -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/users/me" -Method Get -Headers $headers
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    if ($response.email -eq $EMAIL) {
        Write-Host "   ✓ Protected endpoint accessible and data matches" -ForegroundColor Green
        $testsPassed++
    } else {
        throw "Email mismatch in response"
    }
} catch {
    Write-Host "   ✗ Protected endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $testsFailed++
}
Write-Host ""

# Test 5: Token Refresh
Write-Host "5. Testing Token Refresh..." -ForegroundColor Blue
$oldRefreshToken = $refreshToken
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    $newAccessToken = $response.accessToken
    $newRefreshToken = $response.refreshToken
    
    if ($newAccessToken -and $newRefreshToken) {
        Write-Host "   ✓ Token refresh successful" -ForegroundColor Green
        Write-Host "   New Access Token: $($newAccessToken.Substring(0, [Math]::Min(30, $newAccessToken.Length)))..." -ForegroundColor Gray
        Write-Host "   New Refresh Token: $($newRefreshToken.Substring(0, [Math]::Min(30, $newRefreshToken.Length)))..." -ForegroundColor Gray
        
        # Update tokens
        $accessToken = $newAccessToken
        $refreshToken = $newRefreshToken
        
        # Verify tokens changed (rotation)
        if ($newRefreshToken -ne $oldRefreshToken) {
            Write-Host "   ✓ Token rotation verified (refresh token changed)" -ForegroundColor Green
            $testsPassed++
        } else {
            throw "Refresh token did not rotate"
        }
    } else {
        throw "Missing tokens in refresh response"
    }
} catch {
    Write-Host "   ✗ Token refresh failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $testsFailed++
}
Write-Host ""

# Test 6: Verify old refresh token is invalid
Write-Host "6. Testing Old Refresh Token Invalidation..." -ForegroundColor Blue
$oldTokenBody = @{
    refreshToken = $oldRefreshToken
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/refresh" -Method Post -Body $oldTokenBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✗ Old refresh token should be invalid!" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Old refresh token properly invalidated (401 Unauthorized)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}
Write-Host ""

# Test 7: Verify new access token works
Write-Host "7. Testing New Access Token..." -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/users/me" -Method Get -Headers $headers
    Write-Host "   ✓ New access token works for protected endpoints" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "   ✗ New access token failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Test 8: Logout
Write-Host "8. Testing Logout..." -ForegroundColor Blue
$logoutBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/logout" -Method Post -Body $logoutBody -ContentType "application/json" -Headers $headers
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    Write-Host "   ✓ Logout successful" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "   ✗ Logout failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $testsFailed++
}
Write-Host ""

# Test 9: Verify tokens are invalid after logout
Write-Host "9. Testing Token Invalidation After Logout..." -ForegroundColor Blue
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/users/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "   ✗ Access token should be invalid after logout!" -ForegroundColor Red
    $testsFailed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Access token properly invalidated after logout" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "   ✗ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $testsFailed++
    }
}
Write-Host ""

# Test 10: Login after logout
Write-Host "10. Testing Login After Logout..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$API_GATEWAY/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "   ✓ User can login again after logout" -ForegroundColor Green
    Write-Host "   New tokens issued successfully" -ForegroundColor Gray
    $testsPassed++
} catch {
    Write-Host "   ✗ Login after logout failed: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✅ All authentication flow tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
