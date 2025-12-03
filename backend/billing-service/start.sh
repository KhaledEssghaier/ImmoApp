#!/bin/bash

echo "🚀 Starting Billing Service Setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Navigate to billing-service directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please update .env with your Stripe keys!"
    echo "   1. STRIPE_SECRET_KEY"
    echo "   2. STRIPE_WEBHOOK_SECRET"
    echo "   3. STRIPE_SINGLE_POST_PRICE_ID"
    echo "   4. STRIPE_SUBSCRIPTION_PRICE_ID"
    echo ""
    echo "📚 See SETUP_GUIDE.md for detailed instructions"
    echo ""
    read -p "Press Enter when you've updated the .env file..."
else
    echo "✅ .env file exists"
    echo ""
fi

# Check if Stripe CLI is available
if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI is installed"
    echo ""
    echo "🔗 To test webhooks locally, run in a separate terminal:"
    echo "   stripe listen --forward-to localhost:3007/billing/webhook"
    echo ""
else
    echo "⚠️  Stripe CLI not found (optional for local webhook testing)"
    echo "   Install: https://stripe.com/docs/stripe-cli"
    echo ""
fi

# Start the service
echo "🎬 Starting Billing Service..."
echo ""
npm run start:dev
