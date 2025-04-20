import Stripe from 'stripe';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Stripe client
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is missing! Stripe functionality will not work.');
}

// Initialize Stripe with proper error handling
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY) : 
  {
    // Stub implementation to prevent crashes
    customers: { create: () => { throw new Error('Stripe API key not configured'); }},
    prices: { list: () => { throw new Error('Stripe API key not configured'); }},
    checkout: { sessions: { create: () => { throw new Error('Stripe API key not configured'); }}},
    subscriptions: { list: () => { throw new Error('Stripe API key not configured'); }}
  };

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
 * @param {number} params.users Number of users (minimum 1)
 * @param {Array<string>} params.addons Array of addon IDs
 * @param {string} params.billingCycle 'monthly' or 'annual'
 * @param {string} params.region Customer region (for price adjustment)
 * @param {Object} params.metadata Additional metadata to include in the checkout session
 * @returns {Promise<Object>} Subscription data including checkout session
 */
export async function createSubscriptionWithTrial({
  email,
  name,
  company,
  users = 3,
  addons = [],
  billingCycle = 'monthly',
  region = 'usa',
  metadata = {}
}) {
  try {
    // Check for Stripe API key
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set! Cannot create Stripe subscription.');
    }
    
    console.log(`Creating subscription for ${email} with ${users} users, addons: ${addons.join(', ')}, billing: ${billingCycle}, region: ${region}`);
    
    // No minimum user requirement anymore
    users = Math.max(1, users);
    
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
        region,
        ...metadata // Include any custom metadata
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
    
    // Only add addon products for module subscriptions, not Core CRM
    if (metadata && metadata.subscriptionType === 'module-addon') {
      console.log("This is a module subscription for an addon only");
      
      // For module subscriptions, we only need the add-on, not Core CRM
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
    } else {
      // This is a full subscription with Core CRM
      console.log("This is a full subscription including Core CRM");
      
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
      
      // Add selected addons (only for full subscriptions)
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
    }
    
    console.log("Preparing line items for checkout session:", JSON.stringify(lineItems, null, 2));
    
    // Create a checkout session for the subscription
    console.log("Creating Stripe checkout session...");
    
    // Verify we have valid line items
    if (!lineItems.length) {
      console.error("No line items available for checkout session");
      throw new Error("No line items available for checkout session");
    }
    
    // Extra validation for line items
    for (const item of lineItems) {
      if (!item.price) {
        console.error("Missing price ID in line item:", item);
        throw new Error("Missing price ID in line item");
      }
      console.log(`Validating line item with price ID: ${item.price}`);
    }
    
    // Set up success and cancel URLs with support for custom URLs from params
    let success_url = `${process.env.APP_URL || 'https://greenlane-crm.replit.app'}/trial-success?session_id={CHECKOUT_SESSION_ID}`;
    let cancel_url = `${process.env.APP_URL || 'https://greenlane-crm.replit.app'}/free-trial`;
    
    // Allow custom success and cancel URLs to be passed in params (for module subscriptions)
    if (params.success_url) {
      success_url = params.success_url;
      console.log("Using custom success URL:", success_url);
    }
    
    if (params.cancel_url) {
      cancel_url = params.cancel_url;
      console.log("Using custom cancel URL:", cancel_url);
    } else {
      console.log("Using default success URL:", success_url);
      console.log("Using default cancel URL:", cancel_url);
    }
    
    // Create the checkout session with detailed parameters
    const sessionParams = {
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
          region,
          ...metadata // Include any custom metadata
        }
      },
      metadata: {
        ...metadata // Include custom metadata at the session level too
      },
      success_url: success_url,
      cancel_url: cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      client_reference_id: company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() // Sanitized company name
    };
    
    console.log("Creating checkout session with params:", JSON.stringify(sessionParams, null, 2));
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
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
    
    // Log different types of Stripe errors with more details
    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe API Invalid Request Error details:', {
        message: error.raw?.message,
        param: error.raw?.param,
        code: error.code,
        type: error.type,
        requestId: error.requestId
      });
    } else if (error.type === 'StripeAuthenticationError') {
      console.error('Stripe API Authentication Error - Check your API keys');
    } else if (error.type === 'StripeRateLimitError') {
      console.error('Stripe API Rate Limit Error - Too many requests');
    } else if (error.type === 'StripeConnectionError') {
      console.error('Stripe API Connection Error - Network issue');
    } else if (error.type === 'StripeApiError') {
      console.error('Stripe API Error - Server error on Stripe side');
    } else {
      console.error('Unknown error type:', error.constructor.name);
    }
    
    // Re-throw the error for proper handling upstream
    // We're finding that returning error objects is causing issues with the checkout flow
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