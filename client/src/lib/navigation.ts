/**
 * Navigation utility functions for Greenlane CRM
 */

import { getTenantFromUrl } from './tenant';

/**
 * Navigate to a route with tenant context preserved
 * @param path Path to navigate to (e.g., '/dashboard')
 * @param useHardRedirect Whether to use hard redirection or client-side navigation
 */
export function navigateTo(path: string, useHardRedirect = true): void {
  // If this is a tenant URL, ensure we keep the context
  const tenantId = getTenantFromUrl();
  let fullPath = path;
  
  // For local development or Replit previews, append tenant query param if needed
  if (tenantId && (
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('replit.dev') || 
    window.location.hostname.includes('repl.co')
  )) {
    // If path already has query params, append tenant with &, otherwise with ?
    const separator = path.includes('?') ? '&' : '?';
    fullPath = `${path}${separator}tenant=${tenantId}`;
  }
  
  console.log(`Navigating to: ${fullPath} (hard redirect: ${useHardRedirect})`);
  
  if (useHardRedirect) {
    // Force a hard reload
    window.location.href = fullPath;
  } else {
    // Use history API for smoother navigation (Note: requires additional handling in the router)
    window.history.pushState({}, '', fullPath);
    // Dispatch an event to notify the router about the change
    window.dispatchEvent(new Event('popstate'));
  }
}

/**
 * Navigate to dashboard
 * @param useHardRedirect Whether to use hard redirection
 */
export function navigateToDashboard(useHardRedirect = true): void {
  // First check if auth is present, otherwise go to login
  const isAuthenticated = sessionStorage.getItem('auth_status') === 'authenticated';
  
  if (isAuthenticated) {
    navigateTo('/dashboard', useHardRedirect);
  } else {
    navigateTo('/signin', useHardRedirect);
  }
}

/**
 * Navigate to login page
 */
export function navigateToLogin(): void {
  navigateTo('/signin', true);
}

/**
 * Redirect after successful authentication
 * @param targetPath Optional path to redirect to after login
 */
export function redirectAfterAuth(targetPath?: string): void {
  // Clear any pending credentials
  sessionStorage.removeItem('pending_username');
  sessionStorage.removeItem('pending_password');
  
  // Mark as authenticated in session
  sessionStorage.setItem('auth_status', 'authenticated');
  
  // Navigate to target path or dashboard
  navigateTo(targetPath || '/dashboard', true);
}