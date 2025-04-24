// Cloudflare Worker for Greenlane CRM - Fixed Version for Frontend

// Define your base domain and Cloud Run URL
const BASE_DOMAIN = 'greenlanecloudsolutions.com';
// This value will come from service_hostname.txt after deploying with deploy-simple-fix.sh
const CLOUD_RUN_URL = 'greenlane-crm-simple-fix-mx3osic2uq-uc.a.run.app';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests and route them appropriately
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response
 */
async function handleRequest(request) {
  // Get the hostname and URL from the request
  const url = new URL(request.url);
  const hostname = url.hostname;
  const path = url.pathname;
  
  console.log(`Handling request for: ${hostname}${path}`);
  
  // Direct handling for root domain - always redirect to app subdomain
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    console.log('Root domain request, redirecting to app subdomain');
    const redirectUrl = `https://app.${BASE_DOMAIN}${path}`;
    return Response.redirect(redirectUrl, 302);
  }
  
  // Set up the target URL (Cloud Run service)
  const targetUrl = new URL(url);
  targetUrl.hostname = CLOUD_RUN_URL;
  
  // Create a new headers object with the original headers
  const headers = new Headers(request.headers);
  
  // Add the original hostname so the server can read it
  headers.set('X-Forwarded-Host', hostname);
  
  // Set host header to target hostname
  headers.set('Host', CLOUD_RUN_URL);
  
  // Handle specific subdomains
  if (hostname === `app.${BASE_DOMAIN}`) {
    // App subdomain - add special header
    console.log('App subdomain detected, setting app request header');
    headers.set('X-App-Request', 'true');
  } else if (hostname === `api.${BASE_DOMAIN}`) {
    // API subdomain
    console.log('API subdomain detected');
    headers.set('X-API-Request', 'true');
  } else if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
    // Tenant subdomain
    const tenantId = hostname.replace(`.${BASE_DOMAIN}`, '');
    console.log(`Tenant subdomain request: ${tenantId}`);
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
    const response = await fetch(modifiedRequest);
    
    // If we got a 404 and this might be an SPA route
    if (response.status === 404 && !path.includes('.')) {
      console.log('Path not found, might be an SPA route, serving index.html');
      
      // Create a new request for the root path
      const indexUrl = new URL(`https://${CLOUD_RUN_URL}/`);
      const indexHeaders = new Headers(headers);
      indexHeaders.set('X-SPA-Route', 'true');
      
      const indexRequest = new Request(indexUrl.href, {
        method: 'GET',
        headers: indexHeaders
      });
      
      // Try fetching the index page instead
      return fetch(indexRequest);
    }
    
    // Return the original response
    return response;
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(`Error routing request: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
}