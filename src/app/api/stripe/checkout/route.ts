import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId, isStripeConfigured } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { plan, interval = 'monthly' } = body as {
      plan: 'pro' | 'enterprise';
      interval?: 'monthly' | 'yearly';
    };

    // Validate plan
    if (!['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected.' },
        { status: 400 }
      );
    }

    // Get the price ID
    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan. Please contact support.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Create a new Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update the subscription record with the Stripe customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Get the locale from the request headers
    const locale = request.headers.get('x-locale') || 'en';

    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/${locale}/checkout/cancel`,
      metadata: {
        user_id: user.id,
        plan,
        interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
