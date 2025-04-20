import Stripe from 'stripe';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  console.log("Setting up Stripe products and prices...");
  
  try {
    // Create Core CRM product
    console.log("Creating Core CRM product...");
    const coreCrmProduct = await stripe.products.create({
      name: "Greenlane Core CRM",
      description: "Contact Management, Deal Tracking, Task Management, Basic Analytics",
    });
    console.log(`Created Core CRM product with ID: ${coreCrmProduct.id}`);

    // Create Core CRM prices
    console.log("Creating Core CRM prices...");
    const coreCrmMonthlyPrice = await stripe.prices.create({
      product: coreCrmProduct.id,
      unit_amount: 2500, // $25 in cents
      currency: "usd",
      recurring: { interval: "month", usage_type: "licensed" },
      lookup_key: "core_crm_monthly",
    });
    console.log(`Created Core CRM monthly price with ID: ${coreCrmMonthlyPrice.id}`);

    const coreCrmAnnualPrice = await stripe.prices.create({
      product: coreCrmProduct.id,
      unit_amount: 27000, // $270/year in cents ($22.50/month)
      currency: "usd",
      recurring: { interval: "year", usage_type: "licensed" },
      lookup_key: "core_crm_annual",
    });
    console.log(`Created Core CRM annual price with ID: ${coreCrmAnnualPrice.id}`);

    // Create Community Add-On product
    console.log("Creating Community Add-On product...");
    const communityProduct = await stripe.products.create({
      name: "Community Add-On",
      description: "Discussion forums, user groups, engagement analytics",
    });
    console.log(`Created Community Add-On product with ID: ${communityProduct.id}`);

    // Create Community Add-On prices
    console.log("Creating Community Add-On prices...");
    const communityMonthlyPrice = await stripe.prices.create({
      product: communityProduct.id,
      unit_amount: 4000, // $40 in cents
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "community_monthly",
    });
    console.log(`Created Community monthly price with ID: ${communityMonthlyPrice.id}`);

    const communityAnnualPrice = await stripe.prices.create({
      product: communityProduct.id,
      unit_amount: 43200, // $432/year in cents ($36/month)
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "community_annual",
    });
    console.log(`Created Community annual price with ID: ${communityAnnualPrice.id}`);

    // Create Marketing Hub Add-On product
    console.log("Creating Marketing Hub Add-On product...");
    const marketingHubProduct = await stripe.products.create({
      name: "Marketing Hub Add-On",
      description: "Email campaigns, drip campaigns, marketing automation",
    });
    console.log(`Created Marketing Hub Add-On product with ID: ${marketingHubProduct.id}`);

    // Create Marketing Hub Add-On prices
    console.log("Creating Marketing Hub Add-On prices...");
    const marketingHubMonthlyPrice = await stripe.prices.create({
      product: marketingHubProduct.id,
      unit_amount: 6000, // $60 in cents
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "marketingHub_monthly",
    });
    console.log(`Created Marketing Hub monthly price with ID: ${marketingHubMonthlyPrice.id}`);

    const marketingHubAnnualPrice = await stripe.prices.create({
      product: marketingHubProduct.id,
      unit_amount: 64800, // $648/year in cents ($54/month)
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "marketingHub_annual",
    });
    console.log(`Created Marketing Hub annual price with ID: ${marketingHubAnnualPrice.id}`);

    // Create Support Centre Add-On product
    console.log("Creating Support Centre Add-On product...");
    const supportCentreProduct = await stripe.products.create({
      name: "Support Centre Add-On",
      description: "Ticketing system, live chat, knowledge base",
    });
    console.log(`Created Support Centre Add-On product with ID: ${supportCentreProduct.id}`);

    // Create Support Centre Add-On prices
    console.log("Creating Support Centre Add-On prices...");
    const supportCentreMonthlyPrice = await stripe.prices.create({
      product: supportCentreProduct.id,
      unit_amount: 3000, // $30 in cents
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "supportCentre_monthly",
    });
    console.log(`Created Support Centre monthly price with ID: ${supportCentreMonthlyPrice.id}`);

    const supportCentreAnnualPrice = await stripe.prices.create({
      product: supportCentreProduct.id,
      unit_amount: 32400, // $324/year in cents ($27/month)
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "supportCentre_annual",
    });
    console.log(`Created Support Centre annual price with ID: ${supportCentreAnnualPrice.id}`);

    // Save price IDs to a config file
    const config = {
      products: {
        coreCrm: {
          id: coreCrmProduct.id,
          name: coreCrmProduct.name,
          description: coreCrmProduct.description,
          prices: {
            monthly: {
              id: coreCrmMonthlyPrice.id,
              amount: 25,
              interval: "month",
              lookup_key: "core_crm_monthly"
            },
            annual: {
              id: coreCrmAnnualPrice.id,
              amount: 270,
              interval: "year",
              lookup_key: "core_crm_annual"
            }
          }
        },
        community: {
          id: communityProduct.id,
          name: communityProduct.name,
          description: communityProduct.description,
          prices: {
            monthly: {
              id: communityMonthlyPrice.id,
              amount: 40,
              interval: "month",
              lookup_key: "community_monthly"
            },
            annual: {
              id: communityAnnualPrice.id,
              amount: 432,
              interval: "year",
              lookup_key: "community_annual"
            }
          }
        },
        marketingHub: {
          id: marketingHubProduct.id,
          name: marketingHubProduct.name,
          description: marketingHubProduct.description,
          prices: {
            monthly: {
              id: marketingHubMonthlyPrice.id,
              amount: 60,
              interval: "month",
              lookup_key: "marketingHub_monthly"
            },
            annual: {
              id: marketingHubAnnualPrice.id,
              amount: 648,
              interval: "year",
              lookup_key: "marketingHub_annual"
            }
          }
        },
        supportCentre: {
          id: supportCentreProduct.id,
          name: supportCentreProduct.name,
          description: supportCentreProduct.description,
          prices: {
            monthly: {
              id: supportCentreMonthlyPrice.id,
              amount: 30,
              interval: "month",
              lookup_key: "supportCentre_monthly"
            },
            annual: {
              id: supportCentreAnnualPrice.id,
              amount: 324,
              interval: "year",
              lookup_key: "supportCentre_annual"
            }
          }
        }
      },
      regionMultipliers: {
        usa: 1.0,    // Base price
        canada: 1.05, // +5%
        uk: 1.10,    // +10%
        europe: 1.15, // +15%
        australia: 1.20 // +20%
      },
      currencyCodes: {
        usa: "USD", 
        canada: "CAD",
        uk: "GBP",
        europe: "EUR",
        australia: "AUD"
      }
    };

    const configPath = new URL('stripeConfig.json', import.meta.url).pathname;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Stripe products and prices created successfully!");
    console.log("Configuration saved to stripeConfig.json");
    
    return config;
  } catch (error) {
    console.error("Error setting up Stripe products:", error);
    throw error;
  }
}

setupStripeProducts().catch(console.error);