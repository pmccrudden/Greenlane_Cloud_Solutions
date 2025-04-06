import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';
import { User } from './types';

/**
 * Sign in with username and password
 * @param username User's username or email
 * @param password User's password
 * @returns User object if successful
 */
export async function signIn(username: string, password: string): Promise<User> {
  const response = await apiRequest('POST', '/api/auth/login', { username, password });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign in');
  }
  
  const data = await response.json();
  return data.user;
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
