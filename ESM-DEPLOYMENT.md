# ES Module Deployment for Cloud Run

This document outlines the approach for deploying applications using ES Modules to Google Cloud Run.

## Background

Modern Node.js applications often use ES Modules (ESM) format, which is different from the traditional CommonJS format. Cloud Run expects servers to start quickly and bind to the PORT environment variable, but ES Modules can sometimes have complications with dynamic imports and environment setup that cause deployment failures.

## Deployment Strategies

We've created three different approaches for ESM deployments:

### 1. Minimal ESM Server (app-minimal.mjs)

- **Files**: `app-minimal.mjs`, `Dockerfile.esm-app`, `deploy-esm-app.sh`
- **Purpose**: A barebones diagnostic server to validate ESM functionality in Cloud Run
- **Features**: 
  - Just 20-30 lines of code
  - No dependencies
  - Immediately binds to PORT
  - Returns a simple JSON response with timestamp

This minimal server can be used to verify that ES Module syntax and Node.js configuration are working correctly in the Cloud Run environment.

### 2. Standard ESM Deployment (server-esm.js)

- **Files**: `server-esm.js`, `Dockerfile.esm`, `deploy-esm.sh`
- **Purpose**: Deploy the full application using ES Module imports
- **Features**:
  - Uses standard ES Module imports
  - Attempts to load the main application bundle
  - Minimal error handling

This approach is suitable for applications that have been confirmed to work with ES Modules and have straightforward import structures.

### 3. Enhanced ESM Deployment

- **Files**: `server-esm.js` (enhanced version), `Dockerfile.esm-enhanced`, `deploy-esm-enhanced.sh`
- **Purpose**: Provides comprehensive diagnostics and error reporting for ESM applications
- **Features**:
  - Detailed environment information
  - File system checking and reporting
  - Diagnostic HTTP endpoints
  - Graceful error handling for import failures
  - Debug dashboard for troubleshooting

This approach is recommended for complex applications or when troubleshooting deployment issues, as it provides rich diagnostic information.

## Recommended Approach for Production

1. **First Deployment**: Start with the minimal ESM app to confirm basic ESM functionality in your Cloud Run environment.
2. **Troubleshooting**: If the full app deployment fails, use the enhanced ESM deployment to diagnose issues.
3. **Production**: Once issues are resolved, use the standard ESM deployment for production.

## Troubleshooting Common ESM Deployment Issues

### 1. Module Resolution Problems

**Symptoms**:
- Error messages containing "Cannot find module" or "Error [ERR_MODULE_NOT_FOUND]"
- Server fails to start with import-related errors

**Solutions**:
- Ensure package.json has `"type": "module"` specified
- Update import statements to use file extensions (e.g., `import x from './y.js'` instead of `import x from './y'`)
- For CommonJS modules, use dynamic imports: `const cjsModule = await import('cjs-module')`

### 2. Startup Timing Issues

**Symptoms**:
- Cloud Run reports that the container failed to start within the allocated time
- No obvious errors in the logs

**Solutions**:
- Ensure the HTTP server binds to the port immediately, not after async operations
- Move non-critical initialization after server startup
- Increase the startup timeout in Cloud Run configuration

### 3. Environment and File System Issues

**Symptoms**:
- Files reported as missing or inaccessible
- Unexpected environment variable values

**Solutions**:
- Verify Docker build copies all necessary files to the production image
- Check file paths are correct for the production environment
- Ensure environment variables are being passed correctly to the Cloud Run service

## Deployment Commands

For the enhanced ESM deployment:

```bash
# Manual deployment
./deploy-esm-enhanced.sh

# CI/CD with Cloud Build
gcloud builds submit --config=cloudbuild.esm-enhanced.yaml
```