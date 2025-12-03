# Billing Service - Payments & Subscriptions

Complete payment and subscription management microservice for the real estate platform.

## 🎯 Features

### Monetization Modes

1. **Pay Per Post** - $10 per property listing
   - One-time payment for single property upload
   - Instant publish after successful payment

2. **Subscription Plan** - $50 for 10 property uploads
   - Buy once, use 10 times
   - No expiration until credits are used
   - Automatic credit management

### Core Functionality

- ✅ Stripe payment integration
- ✅ Secure webhook handling
- ✅ Credit/subscription management
- ✅ Payment history tracking
- ✅ Automatic property publishing
- ✅ Real-time notifications
- ✅ Refund support

## 🏗️ Architecture

### Database Collections

**subscriptions**
```javascript
{
  userId: ObjectId,
  totalCredits: 10,
  remainingCredits: 7,
  price: 50,
  paymentId: "payment_id",
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

**payments**
```javascript
{
  userId: ObjectId,
  type: "single_post" | "subscription",
  amount: 10 | 50,
  status: "pending" | "success" | "failed",
  stripeSessionId: "cs_xxx",
  stripePaymentIntentId: "pi_xxx",
  propertyId: ObjectId | null,
  metadata: {},
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**user_credits**
```javascript
{
  userId: ObjectId,
  credits: 10,
  updatedAt: Date
}
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Update Stripe configuration:
- Get your Stripe secret key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- Create webhook endpoint and get webhook secret
- Create products and get price IDs

### 3. Run Service

Development:
```bash
npm run start:dev
```

Production:
```bash
npm run build
npm run start:prod
```

## 📡 API Endpoints

### Payments

#### Create Payment Session
```http
POST /billing/payments/session
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "type": "single_post",
  "propertyId": "507f1f77bcf86cd799439012"
}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

#### Get User Payment History
```http
GET /billing/payments/user/:userId?page=1&limit=20
```

#### Get Payment Details
```http
GET /billing/payments/:id
```

### Subscriptions

#### Get Subscription Status
```http
GET /billing/subscriptions/:userId
```

Response:
```json
{
  "hasSubscription": true,
  "remainingCredits": 7,
  "totalCredits": 10,
  "subscriptionId": "..."
}
```

#### Get Subscription History
```http
GET /billing/subscriptions/history/:userId
```

#### Get User Credits
```http
GET /billing/subscriptions/credits/:userId
```

#### Deduct Credit
```http
POST /billing/subscriptions/deduct
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "propertyId": "507f1f77bcf86cd799439012"
}
```

### Webhook

```http
POST /billing/webhook
Stripe-Signature: t=...,v1=...

[Stripe Event Payload]
```

## 🔐 Stripe Configuration

### 1. Create Products

In Stripe Dashboard:

1. **Single Property Upload**
   - Name: "Single Property Upload"
   - Price: $10
   - Type: One-time
   - Copy Price ID → `STRIPE_SINGLE_POST_PRICE_ID`

2. **10-Post Subscription**
   - Name: "10-Post Subscription"
   - Price: $50
   - Type: One-time
   - Copy Price ID → `STRIPE_SUBSCRIPTION_PRICE_ID`

### 2. Configure Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhook Locally

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3007/billing/webhook
```

## 🔗 Service Integration

### Property Service Integration

The billing service automatically publishes properties after successful payment:

```typescript
// Endpoint called by billing-service
PATCH /api/v1/properties/:id/publish
Headers: X-Internal-Key: xxx

Body: { draft: false }
```

### Notification Service Integration

Sends notifications for:
- Payment success
- Subscription activation
- Credit updates

```typescript
POST /api/v1/notifications
Headers: X-Internal-Key: xxx

Body: {
  userId: "xxx",
  type: "payment_success",
  title: "Payment Successful",
  message: "Your property has been published!",
  channel: ["inapp", "push"]
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing with Stripe

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t billing-service .
```

### Run Container
```bash
docker run -p 3007:3007 --env-file .env billing-service
```

### Docker Compose
```bash
docker-compose up billing-service
```

## 📊 Monitoring

Logs include:
- Payment session creation
- Webhook events
- Subscription creation/updates
- Credit deductions
- Property publishing
- Notification delivery

## 🔒 Security

- Webhook signature verification
- Internal API key authentication for service-to-service calls
- Input validation with class-validator
- MongoDB injection protection

## 🚨 Error Handling

- Payment failures are logged and status updated
- Webhook retry mechanism via Stripe
- Graceful degradation for notification failures
- Transaction-like behavior for subscription creation

## 📝 License

MIT

## 👥 Support

For issues or questions, contact the development team.
