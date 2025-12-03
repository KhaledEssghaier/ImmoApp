# PowerShell startup script for Windows

Write-Host "🚀 Starting Billing Service Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Navigate to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
    Write-Host ""
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please update .env with your Stripe keys!" -ForegroundColor Yellow
    Write-Host "   1. STRIPE_SECRET_KEY" -ForegroundColor White
    Write-Host "   2. STRIPE_WEBHOOK_SECRET" -ForegroundColor White
    Write-Host "   3. STRIPE_SINGLE_POST_PRICE_ID" -ForegroundColor White
    Write-Host "   4. STRIPE_SUBSCRIPTION_PRICE_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 See SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter when you've updated the .env file"
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    Write-Host ""
}

# Check if Stripe CLI is available
try {
    $stripeVersion = stripe --version
    Write-Host "✅ Stripe CLI is installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 To test webhooks locally, run in a separate terminal:" -ForegroundColor Cyan
    Write-Host "   stripe listen --forward-to localhost:3007/billing/webhook" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "⚠️  Stripe CLI not found (optional for local webhook testing)" -ForegroundColor Yellow
    Write-Host "   Install: https://stripe.com/docs/stripe-cli" -ForegroundColor White
    Write-Host ""
}

# Start the service
Write-Host "🎬 Starting Billing Service..." -ForegroundColor Cyan
Write-Host ""
npm run start:dev
