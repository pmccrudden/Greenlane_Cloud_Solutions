/**
 * Enhanced Cloudflare Worker for Greenlane CRM Multi-Tenant System
 * With special handling for auth login API requests
 * 
 * IMPORTANT: Replace CLOUD_RUN_URL with your actual Cloud Run service URL
 */

// Configuration settings
const CLOUD_RUN_URL = "greenlane-crm-tenant-login-fix-mx3osic2uq-uc.a.run.app"
const BASE_DOMAIN = "greenlanecloudsolutions.com";
const MAIN_DOMAIN = BASE_DOMAIN;
const APP_SUBDOMAIN = `app.${BASE_DOMAIN}`;

/**
 * Handle incoming requests and route them appropriately
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const path = url.pathname;
  
  // Handle direct IP access to Cloudflare
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return Response.redirect(`https://${MAIN_DOMAIN}${path}${url.search}`, 301);
  }
  
  console.log("Worker processing request for:", hostname, path);
  
  // Determine request type
  const isMainDomain = hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
  const isAppSubdomain = hostname === APP_SUBDOMAIN;
  const isTenantSubdomain = !isMainDomain && !isAppSubdomain && 
                           hostname.endsWith(`.${BASE_DOMAIN}`) && 
                           !hostname.startsWith('www.') && 
                           !hostname.startsWith('api.');
  
  // Get the subdomain part if applicable
  const subdomain = isTenantSubdomain ? hostname.replace(`.${BASE_DOMAIN}`, '') : null;
  
  console.log("Request type:", isMainDomain ? "Main" : isAppSubdomain ? "App" : isTenantSubdomain ? `Tenant: ${subdomain}` : "Other");
  
  // Check if this is an API request
  const isApiRequest = path.startsWith('/api/');
  const isAuthLoginRequest = path === '/api/auth/login';
  
  console.log("API request:", isApiRequest ? "Yes" : "No");
  if (isAuthLoginRequest) {
    console.log("AUTH LOGIN REQUEST DETECTED!");
  }
  
  // Create destination URL for Cloud Run
  let destinationURL = `https://${CLOUD_RUN_URL}${path}${url.search}`;
  
  // Extract and modify headers
  let headers = Object.fromEntries(request.headers);
  
  // Forward original host for proper routing on the server
  headers["X-Forwarded-Host"] = hostname;
  headers["X-Original-URL"] = request.url;
  
  // Add tenant header for subdomain requests
  if (isTenantSubdomain && subdomain) {
    headers["X-Tenant-ID"] = subdomain;
    console.log("Setting tenant header for:", subdomain);
  }
  
  // Add marketing site header for main domain
  if (isMainDomain) {
    headers["X-Force-Marketing"] = "true";
    console.log("Setting marketing site header");
  }
  
  // App subdomain configuration
  if (isAppSubdomain) {
    headers["X-Show-App"] = "true";
    headers["X-Show-Tenant-Field"] = "true";
    console.log("Setting app header and tenant field header");
  }
  
  // For API requests, ensure correct content type headers
  if (isApiRequest) {
    // For API responses, ensure proper JSON content type
    headers["Accept"] = "application/json";
    console.log("Setting JSON accept header for API request");
    
    // Special handling for auth login endpoint
    if (isAuthLoginRequest) {
      headers["Content-Type"] = "application/json";
      console.log("Setting Content-Type: application/json for login request");
    }
  }
  
  // Special processing for the login request body
  let requestBody = request.body;
  
  // For auth login POST requests, ensure proper JSON formatting
  if (isAuthLoginRequest && request.method === 'POST') {
    try {
      // Clone the request to read its body
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      
      // Handle login request specifically
      console.log("Processing auth login request body");
      
      // Parse the request body
      const parsedBody = JSON.parse(bodyText);
      
      // If we have a tenant from subdomain, add it to the request
      if (isTenantSubdomain && subdomain && !parsedBody.tenant) {
        parsedBody.tenant = subdomain;
        console.log("Added tenant to login request body:", subdomain);
      }
      
      // Create a new stringified body
      const newBodyText = JSON.stringify(parsedBody);
      
      // Create a new request with the modified body
      requestBody = newBodyText;
    } catch (error) {
      console.error("Error processing login request body:", error);
      // If there's an error, continue with the original body
      requestBody = request.body;
    }
  }
  
  // Create the request to forward
  const newRequest = new Request(destinationURL, {
    method: request.method,
    headers: headers,
    body: requestBody,
    redirect: "follow"
  });
  
  try {
    console.log("Forwarding request to:", destinationURL);
    const response = await fetch(newRequest);
    
    // Process the response
    let newResponse = response;
    
    // For API requests, ensure the content type is correct
    if (isApiRequest) {
      const originalBody = await response.text();
      
      // Try to parse the body as JSON to validate
      try {
        JSON.parse(originalBody);
        console.log("Response is valid JSON, ensuring correct content type");
        
        // Create a new response with the correct content type
        newResponse = new Response(originalBody, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers),
            "Content-Type": "application/json"
          }
        });
      } catch (e) {
        console.log("Response is not JSON, might be an HTML error page");
        
        // If it's the auth login endpoint and we got an HTML response, 
        // return a proper JSON error instead
        if (isAuthLoginRequest) {
          console.log("Converting HTML error to JSON for auth login endpoint");
          const errorJson = JSON.stringify({
            error: "Authentication failed",
            message: "The server returned an HTML error page instead of JSON",
            details: "Please check your server configuration"
          });
          
          newResponse = new Response(errorJson, {
            status: 500,
            headers: {
              "Content-Type": "application/json"
            }
          });
        } else {
          // For other APIs, just return the original response
          newResponse = new Response(originalBody, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      }
    } else {
      // For non-API requests, return the original response
      newResponse = response;
    }
    
    return newResponse;
  } catch (e) {
    console.error("Worker fetch error:", e);
    
    // If the error is for the auth login endpoint, return a proper JSON error
    if (isAuthLoginRequest) {
      return new Response(JSON.stringify({
        error: "Authentication failed",
        message: "Worker error: " + e.message
      }), { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    
    // Otherwise return an HTML error
    return new Response(`Worker error: ${e.message}`, { 
      status: 500,
      headers: {
        "Content-Type": "text/html"
      }
    });
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});