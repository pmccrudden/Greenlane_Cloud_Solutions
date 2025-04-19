import { Request, Response } from 'express';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Create a customer in Stripe
export async function createCustomer(req: Request, res: Response) {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await stripe.customers.create({
      email,
      name: name || email,
    });

    res.status(200).json({ customerId: customer.id });
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create a subscription with a trial period
export async function createSubscription(req: Request, res: Response) {
  try {
    const { customerId, priceId, trialPeriodDays = 14 } = req.body;

    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required' });
    }

    // Create a subscription with a trial period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialPeriodDays,
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    res.status(200).json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating Stripe subscription:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create a setup intent for collecting payment details without charging
export async function createSetupIntent(req: Request, res: Response) {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.status(200).json({ 
      clientSecret: setupIntent.client_secret 
    });
  } catch (error: any) {
    console.error('Error creating Stripe setup intent:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get available price plans
export async function getPlans(req: Request, res: Response) {
  try {
    // Fetch active prices from Stripe
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });

    // Format the response for the frontend
    const plans = prices.data.map((price) => {
      const product = price.product as Stripe.Product;
      return {
        id: price.id,
        productId: product.id,
        name: product.name,
        description: product.description,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
      };
    });

    res.status(200).json(plans);
  } catch (error: any) {
    console.error('Error fetching Stripe plans:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create a payment intent for one-time payment
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency = 'usd', customerId } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
    };

    // Add customer if provided
    if (customerId) {
      paymentIntentOptions.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error: any) {
    console.error('Error creating Stripe payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}

// Create a checkout session for the free trial
export async function createFreeTrial(req: Request, res: Response) {
  try {
    const { 
      email,
      name,
      priceId,
      successUrl,
      cancelUrl,
      metadata = {}
    } = req.body;

    if (!email || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Email, price ID, success URL, and cancel URL are required' 
      });
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
      },
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        userName: name || '',
      },
    });

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}

// Cancel a subscription
export async function cancelSubscription(req: Request, res: Response) {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.status(200).json({ status: subscription.status });
  } catch (error: any) {
    console.error('Error canceling Stripe subscription:', error);
    res.status(500).json({ error: error.message });
  }
}