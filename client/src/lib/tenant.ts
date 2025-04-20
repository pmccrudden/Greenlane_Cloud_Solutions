/**
 * Utility functions for dealing with multi-tenant functionality
 */

/**
 * Extract tenant ID from current URL
 * @returns Tenant ID (subdomain) or null if on main domain
 */
export function getTenantFromUrl(): string | null {
  const host = window.location.hostname;
  
  // For localhost development, use a custom header or query param
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Check URL query param ?tenant=name for local testing
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant');
  }

  // Handle Replit preview URLs which shouldn't be treated as tenant URLs
  if (host.includes('replit.dev') || host.includes('repl.co')) {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant');
  }

  // For production, check subdomain
  // e.g. facebook.greenlanecloudsolutions.com -> 'facebook'
  const parts = host.split('.');
  if (parts.length >= 3 && !host.startsWith('www.')) {
    return parts[0];
  }
  
  // Main domain without tenant
  return null;
}

/**
 * Get full tenant URL with specified protocol
 * @param tenantId The tenant ID (subdomain)
 * @param protocol The protocol (http or https)
 * @returns Full tenant URL
 */
export function getTenantUrl(tenantId: string, protocol: 'http' | 'https' = 'https'): string {
  // For local development
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
    return `${window.location.origin}?tenant=${tenantId}`;
  }
  
  // Base domain (e.g., greenlanecloudsolutions.com)
  const domainParts = window.location.hostname.split('.');
  const baseDomain = domainParts.length >= 2 
    ? domainParts.slice(-2).join('.') 
    : window.location.hostname;
  
  return `${protocol}://${tenantId}.${baseDomain}`;
}

/**
 * Check if current URL is a tenant URL
 * @returns boolean
 */
export function isTenantUrl(): boolean {
  return getTenantFromUrl() !== null;
}

/**
 * Redirect to the main domain
 */
export function redirectToMainDomain(): void {
  const currentHost = window.location.hostname;
  
  // If already on main domain, do nothing
  if (!isTenantUrl()) return;
  
  // Extract main domain
  const parts = currentHost.split('.');
  const mainDomain = parts.slice(1).join('.');
  
  // Redirect
  window.location.href = `${window.location.protocol}//${mainDomain}`;
}

/**
 * Set tenant ID in request headers for local development
 * @param headers Request headers
 * @returns Updated headers
 */
export function setTenantHeader(headers: Record<string, string> = {}): Record<string, string> {
  const tenantId = getTenantFromUrl();
  
  if (tenantId && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))) {
    return {
      ...headers,
      'X-Tenant-ID': tenantId
    };
  }
  
  return headers;
}

/**
 * Hook to get headers with tenant ID for API requests
 * @returns Headers object with tenant ID if applicable
 */
export function useTenantHeaders(): Record<string, string> {
  const tenantId = getTenantFromUrl();
  const headers: Record<string, string> = {};
  
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  return headers;
}
