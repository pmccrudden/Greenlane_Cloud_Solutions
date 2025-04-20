import Stripe from 'stripe';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Load Stripe configuration
let stripeConfig;
try {
  const configPath = join(__dirname, '..', 'stripeConfig.json');
  stripeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Failed to load Stripe configuration:', error);
  stripeConfig = {
    products: {},
    regionMultipliers: {
      usa: 1.0,
      canada: 1.05,
      uk: 1.10,
      europe: 1.15,
      australia: 1.20
    },
    currencyCodes: {
      usa: "USD",
      canada: "CAD",
      uk: "GBP",
      europe: "EUR",
      australia: "AUD"
    }
  };
}

/**
 * Create a subscription with a trial period
 * @param {Object} params Subscription parameters
 * @param {string} params.email Customer email
 * @param {string} params.name Customer name
 * @param {string} params.company Company name
 * @param {number} params.users Number of users (minimum 3)
 * @param {Array<string>} params.addons Array of addon IDs
 * @param {string} params.billingCycle 'monthly' or 'annual'
 * @param {string} params.region Customer region (for price adjustment)
 * @returns {Promise<Object>} Subscription data including checkout session
 */
export async function createSubscriptionWithTrial({
  email,
  name,
  company,
  users = 3,
  addons = [],
  billingCycle = 'monthly',
  region = 'usa'
}) {
  try {
    console.log(`Creating subscription for ${email} with ${users} users, addons: ${addons.join(', ')}, billing: ${billingCycle}, region: ${region}`);
    
    // Ensure minimum of 3 users
    users = Math.max(3, users);
    
    // Get multiplier for region
    const multiplier = stripeConfig.regionMultipliers[region] || 1.0;
    const currencyCode = stripeConfig.currencyCodes[region] || 'USD';
    
    // Create customer
    console.log("Creating Stripe customer...");
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        company,
        region
      }
    });
    console.log(`Created Stripe customer with ID: ${customer.id}`);
    
    // Calculate line items for the subscription
    const lineItems = [];
    
    // First, verify all price IDs exist in Stripe
    console.log("Fetching all active prices from Stripe...");
    const allPrices = await stripe.prices.list({
      active: true,
      limit: 100
    });
    console.log(`Found ${allPrices.data.length} active prices in Stripe`);
    
    // Map of price IDs to their full price objects
    const priceMap = {};
    allPrices.data.forEach(price => {
      priceMap[price.id] = price;
    });
    
    // Add core CRM product (per user)
    const coreCrmPriceId = stripeConfig.products.coreCrm.prices[billingCycle].id;
    console.log(`Using Core CRM price ID: ${coreCrmPriceId}`);
    
    if (!priceMap[coreCrmPriceId]) {
      console.error(`Core CRM price ID ${coreCrmPriceId} not found in Stripe`);
      throw new Error(`Invalid price ID for Core CRM: ${coreCrmPriceId}`);
    }
    
    // Check if the price is metered
    const isMetered = priceMap[coreCrmPriceId]?.recurring?.usage_type === 'metered';
    console.log(`Price ${coreCrmPriceId} is metered: ${isMetered}`);
    
    lineItems.push({
      price: coreCrmPriceId,
      // Only include quantity if not metered
      ...(isMetered ? {} : { quantity: users })
    });
    
    // Add selected addons
    for (const addon of addons) {
      if (stripeConfig.products[addon]) {
        const addonPriceId = stripeConfig.products[addon].prices[billingCycle].id;
        console.log(`Using ${addon} addon price ID: ${addonPriceId}`);
        
        if (!priceMap[addonPriceId]) {
          console.error(`Addon price ID ${addonPriceId} for ${addon} not found in Stripe`);
          throw new Error(`Invalid price ID for ${addon}: ${addonPriceId}`);
        }
        
        // Check if the addon price is metered
        const isAddonMetered = priceMap[addonPriceId]?.recurring?.usage_type === 'metered';
        console.log(`Addon price ${addonPriceId} for ${addon} is metered: ${isAddonMetered}`);
        
        lineItems.push({
          price: addonPriceId,
          // Only include quantity if not metered
          ...(isAddonMetered ? {} : { quantity: 1 })
        });
      }
    }
    
    console.log("Preparing line items for checkout session:", JSON.stringify(lineItems, null, 2));
    
    // Create a checkout session for the subscription
    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          users,
          addons: addons.join(','),
          billingCycle,
          region
        }
      },
      success_url: `${process.env.APP_URL || 'https://greenlane-crm.replit.app'}/trial-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://greenlane-crm.replit.app'}/free-trial`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() // Sanitized company name
    });
    
    console.log(`Created checkout session with ID: ${session.id}`);
    console.log(`Checkout URL: ${session.url}`);
    
    return {
      customer: customer.id,
      session: session.id,
      url: session.url,
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe API error details:', {
        message: error.raw?.message,
        param: error.raw?.param,
        code: error.code,
        type: error.type,
        requestId: error.requestId
      });
    }
    throw error;
  }
}

/**
 * Get available products and pricing information
 * @param {string} region Customer region for price adjustment
 * @returns {Object} Products and pricing information
 */
export function getProductsAndPricing(region = 'usa') {
  // Get multiplier for region
  const multiplier = stripeConfig.regionMultipliers[region] || 1.0;
  const currencyCode = stripeConfig.currencyCodes[region] || 'USD';
  
  // Format products with adjusted pricing
  const products = {};
  
  for (const [productId, product] of Object.entries(stripeConfig.products)) {
    products[productId] = {
      id: product.id,
      name: product.name,
      description: product.description,
      prices: {
        monthly: {
          id: product.prices.monthly.id,
          amount: Math.round(product.prices.monthly.amount * multiplier * 100) / 100,
          currency: currencyCode,
          interval: 'month',
          lookup_key: product.prices.monthly.lookup_key
        },
        annual: {
          id: product.prices.annual.id,
          amount: Math.round(product.prices.annual.amount * multiplier * 100) / 100,
          currency: currencyCode,
          interval: 'year',
          lookup_key: product.prices.annual.lookup_key
        }
      }
    };
  }
  
  return {
    products,
    region,
    currency: currencyCode,
    multiplier
  };
}

/**
 * Get subscription details for a customer
 * @param {string} customerId Stripe customer ID
 * @returns {Promise<Object>} Subscription details
 */
export async function getSubscriptionDetails(customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });
    
    if (subscriptions.data.length === 0) {
      return null;
    }
    
    return subscriptions.data[0];
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw error;
  }
}

/**
 * Get checkout session details
 * @param {string} sessionId Checkout session ID
 * @returns {Promise<Object>} Session details
 */
export async function getCheckoutSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    throw error;
  }
}

/**
 * Update tenant Stripe information after successful checkout
 * @param {string} tenantId Tenant ID
 * @param {string} stripeCustomerId Stripe customer ID
 * @param {string} stripeSubscriptionId Stripe subscription ID
 */
export async function updateTenantStripeInfo(tenantId, stripeCustomerId, stripeSubscriptionId) {
  try {
    await storage.updateTenant(tenantId, {
      stripeCustomerId,
      stripeSubscriptionId
    });
  } catch (error) {
    console.error('Error updating tenant Stripe info:', error);
    throw error;
  }
}

export default {
  createSubscriptionWithTrial,
  getProductsAndPricing,
  getSubscriptionDetails,
  getCheckoutSession,
  updateTenantStripeInfo,
  stripe
};