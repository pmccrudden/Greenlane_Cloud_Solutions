// Cloudflare Worker script to route custom domains to Cloud Run
// Deploy this script at the Cloudflare dashboard: https://dash.cloudflare.com

// Replace this with your Cloud Run service URL
const CLOUD_RUN_URL = 'greenlane-crm-esm-enhanced-mx3osic2uq-uc.a.run.app';

// Replace with your base domain
const BASE_DOMAIN = 'greenlanecloudsolutions.com';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
  // Log the incoming request for debugging
  console.log(`Handling request for: ${hostname}${url.pathname}`);
  
  // Create a new URL pointing to the Cloud Run service
  const targetUrl = new URL(url.href);
  
  // Replace the hostname with the Cloud Run URL
  targetUrl.hostname = CLOUD_RUN_URL;
  
  // Keep the original path and query string
  // targetUrl.pathname = url.pathname;
  // targetUrl.search = url.search;
  
  console.log(`Forwarding to: ${targetUrl.href}`);
  
  // Clone the request headers
  const headers = new Headers(request.headers);
  
  // Add the original hostname as a header so the application can determine tenant
  headers.set('X-Forwarded-Host', hostname);
  
  // Remove the default Host header and set it to the target hostname
  headers.set('Host', CLOUD_RUN_URL);
  
  // Handle special cases
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    // Root domain should show the marketing site
    console.log('Root domain request, showing marketing site');
  } else if (hostname === `app.${BASE_DOMAIN}`) {
    // App subdomain should show the main application
    console.log('App subdomain request, showing main application');
  } else if (hostname === `api.${BASE_DOMAIN}`) {
    // API subdomain should route to API endpoints
    console.log('API subdomain request, routing to API');
  } else if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    // Extract tenant ID from subdomain
    const tenantId = hostname.replace(`.${BASE_DOMAIN}`, '');
    console.log(`Tenant subdomain request for: ${tenantId}`);
    
    // Add tenant ID header
    headers.set('X-Tenant-ID', tenantId);
  }
  
  // Create a new request with the appropriate URL and headers
  const modifiedRequest = new Request(targetUrl.href, {
    method: request.method,
    headers: headers,
    body: request.body,
    redirect: 'follow'
  });
  
  try {
    // Fetch from the Cloud Run service
    return await fetch(modifiedRequest);
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(`Error routing request: ${error.message}`, { status: 500 });
  }
}