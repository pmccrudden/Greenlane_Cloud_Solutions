/**
 * Tenant Authentication Service for GreenLane CRM
 * Handles seamless SSO login between tenant subdomains
 */

import { signIn } from './auth';
import { getTenantFromUrl } from './tenant';
import { redirectAfterAuth } from './navigation';

/**
 * Initiate tenant login with credentials
 * This function starts the SSO process by logging in and storing tenant information
 * 
 * @param username The username for authentication
 * @param password The password for authentication
 * @param tenant The tenant ID/name (optional if already on tenant URL)
 * @returns Promise resolving when login process is complete
 */
export async function initiateMultiTenantLogin(
  username: string, 
  password: string, 
  tenant?: string
): Promise<void> {
  try {
    console.log(`Initiating multi-tenant login for ${username}${tenant ? ` on tenant ${tenant}` : ''}`);
    
    // Get current tenant from URL if available
    const currentTenant = getTenantFromUrl();
    
    // Determine which tenant we should be using
    const targetTenant = tenant || currentTenant;
    
    // If we don't have a tenant specified and we're not on a tenant URL,
    // we cannot proceed with the SSO login
    if (!targetTenant) {
      throw new Error('No tenant specified for multi-tenant login');
    }
    
    // Store credentials in session storage for SSO across tenants
    const tokenData = {
      username,
      password,
      timestamp: Date.now(),
      tenant: targetTenant
    };
    
    // Store the token in session storage with 30 minute expiry
    sessionStorage.setItem('tenant_sso_token', JSON.stringify(tokenData));
    
    // If we're already on the correct tenant URL, perform login directly
    if (currentTenant === targetTenant) {
      console.log('Already on correct tenant, performing direct login');
      const userData = await signIn(username, password);
      console.log('Login successful, redirecting to dashboard');
      redirectAfterAuth('/dashboard');
      return;
    }
    
    // If we need to switch to a different tenant URL
    console.log(`Need to switch to tenant ${targetTenant}, redirecting...`);
    
    // For local development or Replit preview environment
    if (window.location.hostname.includes('localhost') || 
        window.location.hostname.includes('127.0.0.1') ||
        window.location.hostname.includes('replit.dev') ||
        window.location.hostname.includes('repl.co')) {
      
      // Store the tenant in sessionStorage
      console.log('Storing tenant in sessionStorage:', targetTenant);
      sessionStorage.setItem('current_tenant', targetTenant);
      sessionStorage.setItem('auto_login', 'true');
      
      // Force refresh to trigger tenant detection from sessionStorage
      window.location.reload();
    } else {
      // Redirect to tenant subdomain in production
      sessionStorage.setItem('auto_login', 'true');
      const redirectUrl = `https://${targetTenant}.greenlanecloudsolutions.com/signin`;
      console.log('Production redirect to:', redirectUrl);
      window.location.href = redirectUrl;
    }
  } catch (error) {
    console.error('Multi-tenant login error:', error);
    throw error;
  }
}

/**
 * Check if there's a pending SSO login session
 * @returns {boolean} True if there's a valid pending SSO session
 */
export function hasPendingSsoSession(): boolean {
  const ssoTokenJson = sessionStorage.getItem('tenant_sso_token');
  if (!ssoTokenJson) return false;
  
  try {
    const ssoToken = JSON.parse(ssoTokenJson);
    
    // Check token expiry (30 minutes)
    const now = Date.now();
    const tokenAge = now - ssoToken.timestamp;
    const TOKEN_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (tokenAge > TOKEN_EXPIRY) {
      console.log('SSO token expired, removing');
      sessionStorage.removeItem('tenant_sso_token');
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error parsing SSO token:', e);
    sessionStorage.removeItem('tenant_sso_token');
    return false;
  }
}

/**
 * Complete tenant SSO login using stored credentials
 * This function completes the SSO process by using stored credentials
 * @returns Promise resolving to boolean indicating success
 */
export async function completeSsoLogin(): Promise<boolean> {
  const ssoTokenJson = sessionStorage.getItem('tenant_sso_token');
  if (!ssoTokenJson) {
    console.log('No SSO token found, cannot complete login');
    return false;
  }
  
  try {
    const ssoToken = JSON.parse(ssoTokenJson);
    const { username, password, tenant } = ssoToken;
    
    // Check that we're on the correct tenant
    const currentTenant = getTenantFromUrl();
    
    if (currentTenant !== tenant) {
      console.log(`Current tenant ${currentTenant} doesn't match SSO token tenant ${tenant}`);
      return false;
    }
    
    console.log('Completing SSO login with stored credentials');
    
    // Perform the login
    await signIn(username, password);
    
    // Clear tenant SSO token - one-time use only
    sessionStorage.removeItem('tenant_sso_token');
    
    // Mark auto login complete
    sessionStorage.removeItem('auto_login');
    
    // Redirect to dashboard
    redirectAfterAuth('/dashboard');
    
    return true;
  } catch (error) {
    console.error('Error completing SSO login:', error);
    // Clear invalid token
    sessionStorage.removeItem('tenant_sso_token');
    sessionStorage.removeItem('auto_login');
    return false;
  }
}