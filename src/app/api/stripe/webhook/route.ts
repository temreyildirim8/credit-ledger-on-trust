import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Webhook secret for verifying Stripe signatures
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    // Get the raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return NextResponse.json(
        { error: 'Webhook configuration error' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle checkout.session.completed event
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan as 'pro' | 'enterprise' | undefined;

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Create Supabase admin client for privileged operations
  const supabase = await createClient();

  // Update the subscription in our database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // Approximate, will be updated by subscription event
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update subscription after checkout:', error);
    throw error;
  }

  console.log(`Subscription activated for user ${userId}, plan: ${plan}`);
}

// Handle subscription updated event
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const plan = subscription.metadata?.plan as
    | 'free'
    | 'basic'
    | 'pro'
    | 'enterprise'
    | undefined;

  if (!userId) {
    console.error('Missing user_id in subscription metadata:', subscription.id);
    return;
  }

  // Determine plan from price if not in metadata
  let determinedPlan = plan;
  if (!determinedPlan && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    // Map price ID back to plan
    if (priceId.includes('pro')) {
      determinedPlan = 'pro';
    } else if (priceId.includes('enterprise')) {
      determinedPlan = 'enterprise';
    }
  }

  const supabase = await createClient();

  // Get period dates - handle both old and new Stripe API formats
  // In newer API versions, these are accessed via current_period object
  const periodStart = (subscription as Stripe.Subscription & { current_period?: { start: number; end: number } }).current_period?.start
    || (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start;
  const periodEnd = (subscription as Stripe.Subscription & { current_period?: { start: number; end: number } }).current_period?.end
    || (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: determinedPlan || 'free',
      status: subscription.status === 'active' ? 'active' : subscription.status,
      stripe_subscription_id: subscription.id,
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription updated for user ${userId}`);
}

// Handle subscription deleted event
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error(
      'Missing user_id in deleted subscription metadata:',
      subscription.id
    );
    return;
  }

  const supabase = await createClient();

  // Revert to free plan
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to handle subscription deletion:', error);
    throw error;
  }

  console.log(`Subscription canceled for user ${userId}, reverted to free`);
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // In newer Stripe API, subscription is accessed via subscription field
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;
  const customerId = invoice.customer as string;

  if (!subscriptionId) {
    console.log('Invoice without subscription, skipping');
    return;
  }

  console.log(
    `Payment succeeded for subscription ${subscriptionId}, customer ${customerId}`
  );
  // The subscription.updated event will handle the database update
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;
  const customerId = invoice.customer as string;

  if (!subscriptionId) {
    console.log('Invoice without subscription, skipping');
    return;
  }

  console.log(
    `Payment failed for subscription ${subscriptionId}, customer ${customerId}`
  );

  // Stripe will automatically retry and send dunning emails
  // The subscription.updated event will update status to 'past_due' if applicable
}
