/**
 * Utility functions for dealing with multi-tenant functionality
 */

/**
 * Extract tenant ID from current URL
 * @returns Tenant ID (subdomain) or null if on main domain
 */
export function getTenantFromUrl(): string | null {
  const host = window.location.hostname;
  const search = window.location.search;
  
  console.log('getTenantFromUrl - host:', host, 'search:', search);
  
  // For localhost development or Replit, use query param or sessionStorage
  if (host.includes('localhost') || host.includes('127.0.0.1') || 
      host.includes('replit.dev') || host.includes('repl.co')) {
    
    // First check URL query param ?tenant=name
    const params = new URLSearchParams(search);
    const tenantFromQuery = params.get('tenant');
    
    if (tenantFromQuery) {
      console.log('Tenant from query param:', tenantFromQuery);
      // Persist to sessionStorage for subsequent requests
      sessionStorage.setItem('current_tenant', tenantFromQuery);
      return tenantFromQuery;
    }
    
    // If no query param, check sessionStorage
    const tenantFromSession = sessionStorage.getItem('current_tenant');
    
    if (tenantFromSession) {
      console.log('Tenant from sessionStorage:', tenantFromSession);
      return tenantFromSession;
    }
    
    console.log('No tenant found in query param or sessionStorage');
    return null;
  }

  // For production, check subdomain
  // e.g. facebook.greenlanecloudsolutions.com -> 'facebook'
  const parts = host.split('.');
  
  // Reserved subdomains that aren't tenants
  const reservedSubdomains = ['www', 'app', 'api', 'admin', 'auth'];
  
  if (parts.length >= 3 && !reservedSubdomains.includes(parts[0])) {
    console.log('Production subdomain detected:', parts[0]);
    return parts[0];
  }
  
  // Main domain without tenant
  console.log('No tenant detected in URL');
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
 * Set tenant ID in request headers for local development or Replit environment
 * @param headers Request headers
 * @returns Updated headers
 */
export function setTenantHeader(headers: Record<string, string> = {}): Record<string, string> {
  const tenantId = getTenantFromUrl();
  
  if (tenantId && (
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('replit.dev') || 
    window.location.hostname.includes('repl.co')
  )) {
    console.log('Setting X-Tenant-ID header:', tenantId);
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
    console.log('useTenantHeaders setting X-Tenant-ID:', tenantId);
    headers['X-Tenant-ID'] = tenantId;
  } else {
    console.log('useTenantHeaders: No tenant ID available');
  }
  
  return headers;
}
