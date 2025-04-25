/**
 * Enhanced tenant authentication service with error handling
 * This fixes the TypeError: Cannot read properties of undefined (reading 'match')
 */

/**
 * Get tenant from URL
 * @returns {string|null} The tenant ID or null if not found
 */
export function getTenantFromUrl() {
  try {
    const host = window.location.hostname || '';
    const search = window.location.search || '';

    // For debugging
    console.log('getTenantFromUrl - host:', host, 'search:', search);

    // Handle localhost development
    if (host === 'localhost' || host.includes('replit.dev')) {
      const searchParams = new URLSearchParams(search);
      const tenant = searchParams.get('tenant');
      
      if (tenant) {
        console.log('Development tenant from query:', tenant);
        return tenant;
      }
      return null;
    }

    // Safety check for host - the main error was here
    if (!host || typeof host !== 'string') {
      console.error('Host is not available or not a string:', host);
      return null;
    }

    // Handle production subdomain
    const parts = host.split('.');
    
    // Handle app subdomain
    if (parts[0] === 'app') {
      return null;
    }

    // Production checks - assuming greenlanecloudsolutions.com domain
    if (host.includes('greenlanecloudsolutions.com') && parts.length > 1) {
      const subdomain = parts[0];
      
      // Skip for main domain
      if (subdomain === 'greenlanecloudsolutions' || subdomain === 'www') {
        return null;
      }
      
      console.log('Production subdomain detected:', subdomain);
      return subdomain;
    }

    return null;
  } catch (error) {
    console.error('Error in getTenantFromUrl:', error);
    return null;
  }
}

/**
 * Get current tenant
 * @returns {string|null} The current tenant or null if not set
 */
export function getCurrentTenant() {
  try {
    // First check URL
    const tenantFromUrl = getTenantFromUrl();
    if (tenantFromUrl) {
      console.log('Current tenant detected:', tenantFromUrl);
      return tenantFromUrl;
    }

    // Then try session storage
    const sessionTenant = sessionStorage.getItem('current_tenant');
    if (sessionTenant) {
      return sessionTenant;
    }

    return null;
  } catch (error) {
    console.error('Error in getCurrentTenant:', error);
    return null;
  }
}

/**
 * Set current tenant
 * @param {string} tenant The tenant ID
 */
export function setCurrentTenant(tenant) {
  try {
    if (tenant) {
      sessionStorage.setItem('current_tenant', tenant);
    } else {
      sessionStorage.removeItem('current_tenant');
    }
  } catch (error) {
    console.error('Error in setCurrentTenant:', error);
  }
}

/**
 * Clear tenant from session
 */
export function clearTenant() {
  try {
    sessionStorage.removeItem('current_tenant');
    console.log('Clearing tenant from session to show tenant field');
  } catch (error) {
    console.error('Error in clearTenant:', error);
  }
}

/**
 * Safe version of fetch that adds tenant headers if needed
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function tenantFetch(url, options = {}) {
  try {
    const tenant = getCurrentTenant();
    if (!tenant) {
      return fetch(url, options);
    }

    // Clone options and add tenant headers
    const tenantOptions = { ...options };
    tenantOptions.headers = { ...tenantOptions.headers };
    tenantOptions.headers['X-Tenant-ID'] = tenant;

    // For POST requests to authentication endpoints, ensure we have tenant in body
    if (options.method === 'POST' && (url.includes('/api/auth/') || url.includes('/auth/'))) {
      if (tenantOptions.body) {
        try {
          const body = JSON.parse(tenantOptions.body);
          body.tenant = tenant;
          tenantOptions.body = JSON.stringify(body);
        } catch (e) {
          console.error('Error updating request body with tenant:', e);
        }
      }
    }

    return fetch(url, tenantOptions);
  } catch (error) {
    console.error('Error in tenantFetch:', error);
    return fetch(url, options);
  }
}