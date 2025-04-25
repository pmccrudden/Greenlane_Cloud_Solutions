import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';
import { User } from './types';
import { getTenantFromUrl } from './tenant';

// Helper function to safely parse JSON from response
async function safeParseJson(response: Response) {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.warn('Non-JSON response received:', text);
    
    // If it's HTML, it might be a server error page
    if (text.includes('<html>')) {
      throw new Error('Received HTML instead of JSON. The server might be returning an error page.');
    }
    
    // Otherwise, return a simple object
    return { success: response.ok, message: text };
  }
  
  return response.json();
}

/**
 * Sign in with username and password
 * @param username User's username or email
 * @param password User's password
 * @returns User object if successful
 */
export async function signIn(username: string, password: string): Promise<User> {
  try {
    // Get tenant ID from URL
    const tenantId = getTenantFromUrl();
    console.log("Signing in with tenant:", tenantId);
    
    // Prepare login data
    const loginData: Record<string, string> = { 
      username, 
      password 
    };
    
    // Only add tenant to payload if not already in URL
    if (!tenantId) {
      const storedTenant = sessionStorage.getItem('current_tenant');
      if (storedTenant) {
        loginData.tenant = storedTenant;
      }
    }
    
    const response = await apiRequest('POST', '/api/auth/login', loginData);
    
    try {
      const data = await safeParseJson(response);
      console.log("Login response:", data); // Debug
      
      // Store tenant ID if provided in response
      if (data.tenant && data.tenant.id) {
        sessionStorage.setItem('current_tenant', data.tenant.id);
      }
      
      return data.user;
    } catch (parseError) {
      console.error("Error parsing login response:", parseError);
      throw new Error('Invalid response from server. Please try again.');
    }
  } catch (error) {
    console.error("Login error:", error); // Debug
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await apiRequest('POST', '/api/auth/logout');
  
  // Clear cache
  queryClient.clear();
  
  // Redirect to sign in page
  window.location.href = '/signin';
}

/**
 * Check if user is authenticated
 * @returns Promise resolving to authentication status and user object
 */
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user?: User }> {
  try {
    const response = await apiRequest('GET', '/api/auth/status');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Auth check error:", error); // Debug
    return { isAuthenticated: false };
  }
}

/**
 * Register a new user and company via Stripe
 * @param data Registration data
 * @returns Stripe client secret and tenant ID
 */
export async function registerWithStripe(data: {
  name: string;
  email: string;
  companyName: string;
  subdomain: string;
  planId: string;
}): Promise<{ clientSecret: string; tenantId: string }> {
  const response = await apiRequest('POST', '/api/create-subscription', data);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }
  
  return await response.json();
}

/**
 * Confirm Stripe payment
 * @param stripePromise Stripe promise from @stripe/react-stripe-js
 * @param clientSecret Stripe client secret
 * @returns Payment result
 */
export async function confirmStripePayment(stripePromise: any, clientSecret: string): Promise<any> {
  const stripe = await stripePromise;
  
  if (!stripe) {
    throw new Error('Stripe has not been initialized');
  }
  
  return await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: window.location.origin,
    },
  });
}
