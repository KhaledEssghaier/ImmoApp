export default () => ({
  port: parseInt(process.env.PORT, 10) || 3007,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/immobilier_billing',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    singlePostPriceId: process.env.STRIPE_SINGLE_POST_PRICE_ID,
    subscriptionPriceId: process.env.STRIPE_SUBSCRIPTION_PRICE_ID,
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    successUrl: process.env.SUCCESS_URL || 'http://localhost:3000/payment/success',
    cancelUrl: process.env.CANCEL_URL || 'http://localhost:3000/payment/cancel',
  },

  services: {
    property: {
      url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3002',
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    },
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    },
  },

  security: {
    internalApiKey: process.env.INTERNAL_API_KEY,
    notificationInternalKey: process.env.NOTIFICATION_INTERNAL_KEY,
  },

  pricing: {
    singlePost: 10,
    subscription: 50,
    subscriptionCredits: 10,
  },
});
