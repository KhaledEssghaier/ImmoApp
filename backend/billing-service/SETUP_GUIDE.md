# Billing Service - Complete Setup Guide

## 🎯 What's Been Created

### Backend (NestJS)
✅ **billing-service** - Complete payment microservice
  - Stripe integration
  - Payment session creation
  - Webhook handling  
  - Subscription management
  - Credit system
  - MongoDB schemas
  - Docker configuration

### Frontend (Flutter)
✅ **Flutter Integration Guide** - See `FLUTTER_PAYMENT_INTEGRATION.md`
  - Payment selection screen
  - Success/failure screens
  - Subscription management UI
  - Property creation integration
  - Payment history display

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd backend/billing-service
npm install
```

### Step 2: Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from **Developers → API Keys**
3. Create two products:
   - **Single Property Upload** - $10 (one-time)
   - **10-Post Subscription** - $50 (one-time)
4. Copy the Price IDs

### Step 3: Set Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here  # Get this in Step 4
STRIPE_SINGLE_POST_PRICE_ID=price_xxxxx
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxx

# MongoDB (use your existing connection)
MONGO_URI=mongodb://khaledessghaier01_db_user:NzloQ2m8x5wbXhWy@ac-a0dglpx-shard-00-00.kygzqup.mongodb.net:27017,ac-a0dglpx-shard-00-01.kygzqup.mongodb.net:27017,ac-a0dglpx-shard-00-02.kygzqup.mongodb.net:27017/immobilier_billing?authSource=admin&replicaSet=atlas-x27dth-shard-0&readPreference=primary&ssl=true
```

### Step 4: Configure Webhook (Local Testing)

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local service
stripe listen --forward-to localhost:3007/billing/webhook

# Copy the webhook secret (whsec_...) to your .env file
```

### Step 5: Start the Service

```bash
npm run start:dev
```

Service will run on: **http://localhost:3007**

Webhook endpoint: **http://localhost:3007/billing/webhook**

### Step 6: Test with Swagger

Open: **http://localhost:3007/api** (if Swagger is configured)

Or test with curl:

```bash
# Create payment session
curl -X POST http://localhost:3007/billing/payments/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "type": "subscription"
  }'
```

## 🔧 Integration Steps

### 1. Update API Gateway

The docker-compose has been updated. If you need to manually add routes:

```typescript
// api-gateway/src/app.controller.ts or routes config

@All('billing/*')
async billingProxy(@Req() req: Request, @Res() res: Response) {
  const billingUrl = `http://localhost:3007/billing${req.url.replace('/billing', '')}`;
  // Proxy request to billing-service
}
```

### 2. Update Property Service

Add endpoint to publish property from billing-service:

```typescript
// property-service/src/properties/properties.controller.ts

@Patch(':id/publish')
@UseGuards(InternalApiKeyGuard)
async publishProperty(@Param('id') id: string) {
  return this.propertiesService.updateProperty(id, { draft: false });
}
```

### 3. Flutter Setup

See detailed guide in: `FLUTTER_PAYMENT_INTEGRATION.md`

Quick summary:
1. Add dependencies to `pubspec.yaml`
2. Create payment screens
3. Update property creation flow
4. Test payment flow end-to-end

## 🧪 Testing

### Test Cards (Stripe Test Mode)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### Test Flow

1. **Create User** (if not exists)
2. **Check Credits**: GET `/billing/subscriptions/:userId`
3. **Create Payment**: POST `/billing/payments/session`
4. **Complete Payment** in Stripe Checkout
5. **Webhook Fires** → Subscription created
6. **Check Credits Again** → Should show 10 credits
7. **Create Property** (as draft)
8. **Publish Property** → Deducts 1 credit
9. **Check Credits** → Should show 9 credits

## 📊 Database Structure

Three collections will be created:

```
immobilier_billing/
├── subscriptions       # User subscriptions
├── payments           # Payment records
└── user_credits       # Credit balances
```

## 🐳 Docker Deployment

### Development

```bash
# From backend folder
docker-compose up billing-service
```

### Production

1. Update `.env` with production Stripe keys
2. Configure production webhook URL in Stripe Dashboard
3. Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Security Checklist

- [x] Stripe webhook signature verification
- [x] Internal API key for service-to-service calls
- [x] Input validation with class-validator
- [x] MongoDB injection protection
- [ ] Rate limiting (add if needed)
- [ ] API authentication for public endpoints

## 📱 Flutter Deployment

### iOS

1. Configure URL schemes in `Info.plist` for payment callbacks
2. Test with TestFlight before production
3. Update bundle ID in Stripe Dashboard

### Android  

1. Configure intent filters in `AndroidManifest.xml`
2. Test with internal testing track
3. Update package name in Stripe Dashboard

## 🎓 How It Works

### Payment Flow

```
User → Choose Payment → Create Session → Stripe Checkout → Payment Success
                                                    ↓
                                             Webhook Event
                                                    ↓
                                         Update Payment Status
                                                    ↓
                          [subscription] → Create Sub + Add Credits
                          [single_post] → Publish Property
                                                    ↓
                                            Send Notification
```

### Credit Deduction Flow

```
User Publishes Property → Check Credits → Has Credits?
                                              ↓
                                             YES
                                              ↓
                                        Deduct 1 Credit
                                              ↓
                                        Publish Property
                                              ↓
                                          Success

                                              NO
                                              ↓
                                    Redirect to Payment
```

## 🆘 Troubleshooting

### Webhook Not Receiving Events

```bash
# Check Stripe CLI is running
stripe listen --forward-to localhost:3007/billing/webhook

# Check service logs
npm run start:dev
```

### Payment Session Creation Fails

1. Verify Stripe keys are correct
2. Check Price IDs exist in Stripe Dashboard
3. Verify MongoDB connection

### Credits Not Updating

1. Check webhook logs for errors
2. Verify subscription was created in database
3. Check user_credits collection

## 📚 API Documentation

Full API docs in: `billing-service/README.md`

Key endpoints:
- POST `/billing/payments/session` - Create payment
- GET `/billing/subscriptions/:userId` - Get subscription status
- POST `/billing/subscriptions/deduct` - Deduct credit
- GET `/billing/payments/user/:userId` - Payment history
- POST `/billing/webhook` - Stripe webhook (Stripe only)

## 🎉 You're Done!

Your billing system is now complete with:
- ✅ Stripe payment integration
- ✅ Subscription management
- ✅ Credit system
- ✅ Automatic property publishing
- ✅ Payment history
- ✅ Webhook handling
- ✅ Notifications
- ✅ Docker deployment
- ✅ Flutter integration guide

## 📞 Need Help?

1. Check logs: `docker logs billing-service`
2. Review Stripe Dashboard for payment details
3. Check MongoDB for data consistency
4. Verify webhook events in Stripe Dashboard

## 🚀 Next Steps

1. Configure production Stripe account
2. Set up proper domain for webhooks
3. Add analytics tracking
4. Implement promotional codes (optional)
5. Add receipt generation (optional)
6. Set up monitoring (Sentry, etc.)
