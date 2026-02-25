import Stripe from 'stripe';

// Stripe client for server-side operations
// Only initialize if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null;

// Stripe price IDs for each plan
// These should be configured in the Stripe Dashboard and set as environment variables
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
  enterprise_monthly: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY || '',
  enterprise_yearly: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY || '',
} as const;

// Plan prices (in cents) for display purposes
// These should match the prices configured in Stripe
export const PLAN_PRICES = {
  pro: {
    monthly: 499, // $4.99/month
    yearly: 4788, // $39.90/year (equivalent to $3.99/month with 20% discount)
  },
  enterprise: {
    monthly: 1999, // $19.99/month
    yearly: 19188, // $159.90/year (equivalent to $13.32/month with ~20% discount)
  },
} as const;

// Helper to get the correct price ID based on plan and billing interval
export function getPriceId(
  plan: 'pro' | 'enterprise',
  interval: 'monthly' | 'yearly' = 'monthly'
): string {
  const key = `${plan}_${interval}` as keyof typeof STRIPE_PRICE_IDS;
  return STRIPE_PRICE_IDS[key];
}

// Helper to check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_ID_PRO_MONTHLY
  );
}
