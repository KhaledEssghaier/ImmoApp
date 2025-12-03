const Stripe = require('stripe');
require('dotenv').config();

async function createStripePrices() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });

  try {
    console.log('🔌 Creating Stripe products and prices...\n');

    // Create Single Post Product
    const singlePostProduct = await stripe.products.create({
      name: 'Single Property Post',
      description: '1 property listing credit',
    });
    console.log(`✅ Created product: ${singlePostProduct.name} (${singlePostProduct.id})`);

    // Create Single Post Price
    const singlePostPrice = await stripe.prices.create({
      product: singlePostProduct.id,
      unit_amount: 1000, // $10.00 in cents
      currency: 'usd',
      nickname: 'Single Post - $10',
    });
    console.log(`✅ Created price: $10.00 (${singlePostPrice.id})\n`);

    // Create Subscription Product
    const subscriptionProduct = await stripe.products.create({
      name: 'Property Subscription Package',
      description: '10 property listing credits',
    });
    console.log(`✅ Created product: ${subscriptionProduct.name} (${subscriptionProduct.id})`);

    // Create Subscription Price
    const subscriptionPrice = await stripe.prices.create({
      product: subscriptionProduct.id,
      unit_amount: 5000, // $50.00 in cents
      currency: 'usd',
      nickname: 'Subscription - $50 for 10 posts',
    });
    console.log(`✅ Created price: $50.00 (${subscriptionPrice.id})\n`);

    console.log('🎉 Setup complete!\n');
    console.log('📝 Update your .env file with these values:\n');
    console.log(`STRIPE_SINGLE_POST_PRICE_ID=${singlePostPrice.id}`);
    console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${subscriptionPrice.id}\n`);

    return {
      singlePostPriceId: singlePostPrice.id,
      subscriptionPriceId: subscriptionPrice.id,
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

createStripePrices()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
