// Cloudflare Worker for Greenlane CRM - Improved Version

// Define your base domain and Cloud Run URL
const BASE_DOMAIN = 'greenlanecloudsolutions.com';
// This will be updated with your service_hostname.txt file
const CLOUD_RUN_URL = 'greenlane-crm-frontend-fix-mx3osic2uq-uc.a.run.app';

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
  
  // Set up the target URL (Cloud Run service)
  const targetUrl = new URL(url);
  targetUrl.hostname = CLOUD_RUN_URL;
  
  // Create a new headers object with the original headers
  const headers = new Headers(request.headers);
  
  // Add the original hostname so the server can read it
  headers.set('X-Forwarded-Host', hostname);
  
  // Set host header to target hostname
  headers.set('Host', CLOUD_RUN_URL);
  
  // Direct handling for app subdomain
  if (hostname === `app.${BASE_DOMAIN}`) {
    console.log('App subdomain request, serving application');
    headers.set('X-App-Request', 'true');
  }
  
  // Direct handling for root domain
  if (hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`) {
    console.log('Root domain request, redirecting to app subdomain');
    
    // Simple redirect for root path
    if (path === '/' || path === '') {
      return Response.redirect(`https://app.${BASE_DOMAIN}/`, 302);
    }
    
    // For other paths on root domain, also redirect to app 
    return Response.redirect(`https://app.${BASE_DOMAIN}${path}`, 302);
  }
  
  // Handle API subdomain
  if (hostname === `api.${BASE_DOMAIN}`) {
    console.log('API subdomain request');
    headers.set('X-API-Request', 'true');
  }
  
  // Handle tenant subdomains
  if (hostname.endsWith(`.${BASE_DOMAIN}`) && 
      hostname !== `app.${BASE_DOMAIN}` && 
      hostname !== `api.${BASE_DOMAIN}` &&
      hostname !== `www.${BASE_DOMAIN}`) {
    const tenantId = hostname.replace(`.${BASE_DOMAIN}`, '');
    console.log(`Tenant subdomain request for: ${tenantId}`);
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
    
    // If we got a 404 and this is a route path, try to route to index.html
    // for SPA client-side routing
    if (response.status === 404 && !path.includes('.')) {
      console.log('Potential frontend route, redirecting to index');
      
      // Try to get the index.html
      const indexUrl = new URL(`https://${CLOUD_RUN_URL}/`);
      const indexHeaders = new Headers(headers);
      
      // Special app header to ensure proper handling
      indexHeaders.set('X-App-Request', 'true');
      indexHeaders.set('X-SPA-Route', 'true');
      
      const indexRequest = new Request(indexUrl.href, {
        method: 'GET', 
        headers: indexHeaders
      });
      
      return fetch(indexRequest);
    }
    
    return response;
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(`Error routing request: ${error.message}`, { status: 500 });
  }
}