# Test script for billing service
# Run this after starting the service

Write-Host "🧪 Testing Billing Service..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3007/billing"
$userId = "507f1f77bcf86cd799439011"  # Test user ID

# Test 1: Health Check (if you add health endpoint)
Write-Host "1️⃣  Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/../health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Service is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Health endpoint not found (optional)" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Get Subscription Status
Write-Host "2️⃣  Get Subscription Status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/subscriptions/$userId" -Method GET
    Write-Host "✅ Subscription Status:" -ForegroundColor Green
    Write-Host "   Has Subscription: $($response.hasSubscription)" -ForegroundColor White
    Write-Host "   Remaining Credits: $($response.remainingCredits)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Payment Session (Subscription)
Write-Host "3️⃣  Create Payment Session (Subscription)..." -ForegroundColor Yellow
try {
    $body = @{
        userId = $userId
        type = "subscription"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/payments/session" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Payment Session Created:" -ForegroundColor Green
    Write-Host "   Session ID: $($response.sessionId)" -ForegroundColor White
    Write-Host "   Checkout URL: $($response.url)" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Open this URL to complete payment:" -ForegroundColor Cyan
    Write-Host "   $($response.url)" -ForegroundColor Blue
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Create Payment Session (Single Post)
Write-Host "4️⃣  Create Payment Session (Single Post)..." -ForegroundColor Yellow
try {
    $body = @{
        userId = $userId
        type = "single_post"
        propertyId = "507f1f77bcf86cd799439012"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/payments/session" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Payment Session Created:" -ForegroundColor Green
    Write-Host "   Session ID: $($response.sessionId)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Payment History
Write-Host "5️⃣  Get Payment History..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/payments/user/$userId" -Method GET
    Write-Host "✅ Payment History:" -ForegroundColor Green
    Write-Host "   Total Payments: $($response.total)" -ForegroundColor White
    if ($response.data.Count -gt 0) {
        Write-Host "   Latest Payment:" -ForegroundColor White
        Write-Host "     Type: $($response.data[0].type)" -ForegroundColor Gray
        Write-Host "     Amount: `$$($response.data[0].amount)" -ForegroundColor Gray
        Write-Host "     Status: $($response.data[0].status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get User Credits
Write-Host "6️⃣  Get User Credits..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/subscriptions/credits/$userId" -Method GET
    Write-Host "✅ User Credits: $($response.credits)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Complete a payment using the checkout URL above" -ForegroundColor White
Write-Host "   2. Check webhook logs for events" -ForegroundColor White
Write-Host "   3. Verify subscription was created in MongoDB" -ForegroundColor White
Write-Host "   4. Run this script again to see updated credits" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Check these in MongoDB Compass:" -ForegroundColor Yellow
Write-Host "   Database: immobilier_billing" -ForegroundColor White
Write-Host "   Collections: payments, subscriptions, user_credits" -ForegroundColor White
