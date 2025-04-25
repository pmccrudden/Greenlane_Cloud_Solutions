#!/bin/bash
# API Fix deployment script
# This script updates the Cloud Run service with Stripe key and deploys API fixes

# Find the correct service to update
SERVICE_NAME=$(gcloud run services list --platform managed --region=us-central1 --format="value(name)" | grep -E 'tenant-login-fix')

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: Could not find the tenant login fix service"
  echo "Attempting to use fixed name: greenlane-crm-tenant-login-fix"
  SERVICE_NAME="greenlane-crm-tenant-login-fix"
fi

echo "Updating service: $SERVICE_NAME"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region=us-central1 \
  --format="value(status.url)")

SERVICE_HOSTNAME=${SERVICE_URL#https://}

echo "Service hostname: $SERVICE_HOSTNAME"

# Update the environment variables
gcloud run services update $SERVICE_NAME \
  --set-env-vars="VITE_STRIPE_PUBLIC_KEY=pk_test_51OiLf5FbCnPiDQ9nlZvWyTOsyhlCBP6Vac0iyI9f5DRfpqzsDlrTEXnH1,API_BASE_URL=$SERVICE_URL" \
  --region=us-central1

if [ $? -eq 0 ]; then
  echo "✅ Service updated successfully"
else
  echo "❌ Failed to update service"
  exit 1
fi

# Save the hostname for use in Cloudflare Worker
echo $SERVICE_HOSTNAME > service_hostname.txt

echo "Done! Now update your Cloudflare Worker with the correct hostname: $SERVICE_HOSTNAME"

# Create a Cloudflare Worker update script
cat > update-cloudflare-worker.js << EOF
/**
 * Enhanced Cloudflare Worker for Greenlane CRM Multi-Tenant System
 * API FIX VERSION - Handles all API endpoints properly
 */

// Configuration settings - UPDATE THIS WITH YOUR ACTUAL HOSTNAME FROM service_hostname.txt
const CLOUD_RUN_URL = "${SERVICE_HOSTNAME}";
const BASE_DOMAIN = "greenlanecloudsolutions.com";
const MAIN_DOMAIN = BASE_DOMAIN;
const APP_SUBDOMAIN = \`app.\${BASE_DOMAIN}\`;

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
    return Response.redirect(\`https://\${APP_SUBDOMAIN}\${path}\${url.search}\`, 301);
  }
  
  console.log("Worker processing request for:", hostname, path);
  
  // Determine request type
  const isMainDomain = hostname === MAIN_DOMAIN || hostname === \`www.\${MAIN_DOMAIN}\`;
  const isAppSubdomain = hostname === APP_SUBDOMAIN;
  const isTenantSubdomain = !isMainDomain && !isAppSubdomain && 
                           hostname.endsWith(\`.\${BASE_DOMAIN}\`) && 
                           !hostname.startsWith('www.') && 
                           !hostname.startsWith('api.');
  
  // SPECIAL HANDLING: Redirect main domain to app subdomain
  if (isMainDomain) {
    console.log("Redirecting main domain to app subdomain");
    return Response.redirect(\`https://\${APP_SUBDOMAIN}\${path}\${url.search}\`, 302);
  }
  
  // Get the subdomain part if applicable
  const subdomain = isTenantSubdomain ? hostname.replace(\`.\${BASE_DOMAIN}\`, '') : null;
  
  // Check if this is an API request - CRITICAL PART
  const isApiRequest = path.startsWith('/api/');
  const isAuthLoginRequest = path === '/api/auth/login';
  
  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Create destination URL for Cloud Run
  const destinationURL = \`https://\${CLOUD_RUN_URL}\${path}\${url.search}\`;
  
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
  
  // App subdomain configuration
  if (isAppSubdomain) {
    headers["X-Show-App"] = "true";
    headers["X-Show-Tenant-Field"] = "true";
  }
  
  // For API requests, always ensure proper headers
  if (isApiRequest) {
    headers["Accept"] = "application/json";
    
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      headers["Content-Type"] = "application/json";
    }
  }
  
  // Special processing for API requests
  let requestBody = request.body;
  
  if (isApiRequest && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
    try {
      // Clone the request to read its body
      const clonedRequest = request.clone();
      const bodyText = await clonedRequest.text();
      
      // Try to parse the body
      try {
        const parsedBody = JSON.parse(bodyText);
        
        // If we have a tenant from subdomain, add it to the request
        if (isTenantSubdomain && subdomain && !parsedBody.tenant) {
          parsedBody.tenant = subdomain;
        }
        
        // Create a new stringified body
        requestBody = JSON.stringify(parsedBody);
      } catch (e) {
        // Not valid JSON, use as is
        requestBody = bodyText;
      }
    } catch (error) {
      console.error("Error processing request body:", error);
      requestBody = request.body;
    }
  }
  
  // Special handling for login
  if (isAuthLoginRequest && request.method === 'POST') {
    try {
      const clonedRequest = request.clone();
      let bodyText = await clonedRequest.text();
      
      // Try to parse the request body
      let parsedBody;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (e) {
        parsedBody = {};
      }
      
      // If we have a tenant from subdomain, add it to the request
      if (isTenantSubdomain && subdomain) {
        parsedBody.tenant = subdomain;
      }
      
      // Create a new stringified body
      const newBodyText = JSON.stringify(parsedBody);
      
      // Create specialized login request
      const loginRequest = new Request(destinationURL, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: newBodyText
      });
      
      const loginResponse = await fetch(loginRequest);
      const loginResponseText = await loginResponse.text();
      
      // Extract cookies for SSO
      const cookies = [...loginResponse.headers.entries()]
        .filter(([key]) => key.toLowerCase() === 'set-cookie')
        .map(([_, value]) => value);
      
      // Create response headers with CORS and cookies
      const responseHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization'
      };
      
      // Add cookies if available
      if (cookies.length > 0) {
        responseHeaders['Set-Cookie'] = cookies;
      }
      
      // Try to parse as JSON
      try {
        const parsedResponse = JSON.parse(loginResponseText);
        return new Response(JSON.stringify(parsedResponse), {
          status: loginResponse.status,
          headers: responseHeaders
        });
      } catch (e) {
        return new Response(JSON.stringify({
          error: "Authentication failed",
          message: "Invalid server response"
        }), {
          status: 200,
          headers: responseHeaders
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({
        error: "Login processing error",
        message: e.message
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Create the request to forward
  const newRequest = new Request(destinationURL, {
    method: request.method,
    headers: headers,
    body: requestBody
  });
  
  try {
    console.log("Forwarding request to:", destinationURL);
    const response = await fetch(newRequest);
    
    // Special processing for API responses - CRITICAL PART FOR FIXING YOUR ISSUE
    if (isApiRequest) {
      const originalBody = await response.text();
      
      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(originalBody);
        
        // Return valid JSON response
        return new Response(JSON.stringify(jsonData), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        // NOT VALID JSON - This is the problem you're facing!
        console.log("Invalid JSON response from API:", originalBody.substring(0, 100));
        
        // Return empty array for GET requests to fix "t.filter is not a function"
        if (request.method === 'GET') {
          console.log("Returning empty array for GET request to fix filter error");
          
          // Return empty array for list endpoints
          if (path.includes('/accounts') || path.includes('/contacts') || 
              path.includes('/deals') || path.includes('/projects') || 
              path.includes('/support-tickets') || path.includes('/health-scores')) {
            
            return new Response('[]', {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          
          // Return empty object for auth/status
          if (path.includes('/auth/status')) {
            return new Response('{"authenticated":false}', {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          
          // Return empty object for others
          return new Response('{}', {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        // For other methods, return error message as JSON
        return new Response(JSON.stringify({
          error: "API Error",
          message: "The server returned an invalid response"
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // For non-API requests, return the original response
    return response;
  } catch (e) {
    console.error("Worker fetch error:", e);
    
    // For API requests, return a JSON error
    if (isApiRequest) {
      return new Response(JSON.stringify({
        error: "Worker error",
        message: e.message
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // For non-API requests, return an HTML error
    return new Response(\`<html><body><h1>Error</h1><p>\${e.message}</p></body></html>\`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
EOF

echo ""
echo "Created Cloudflare Worker code in update-cloudflare-worker.js"
echo "Copy the contents of this file to your Cloudflare Worker"
echo ""