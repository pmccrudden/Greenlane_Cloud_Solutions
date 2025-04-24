# ES Modules Deployment for Greenlane CRM

## Overview

The Greenlane CRM application is configured to use ES Modules (`"type": "module"` in package.json). To ensure consistent deployment to Cloud Run, we've created a pure ES Module deployment approach that eliminates the use of CommonJS modules, which were causing module system mismatches and deployment failures.

## Implementation Strategy

We've created a progressive deployment strategy with two main options:

### 1. Minimal ESM App (Recommended First Step)

The minimal ESM app deployment provides a simple, reliable baseline that:
- Uses a pure ES Module server (app-minimal.mjs)
- Requires no dependencies
- Reliably binds to the Cloud Run PORT environment variable
- Provides basic health checks and diagnostics

To deploy the minimal ESM app:
```bash
./deploy-esm-app.sh
```

This is recommended as the first step to ensure your Cloud Run configuration is working correctly with ES Modules.

### 2. Full ESM Deployment

Once the minimal app is confirmed working, you can deploy the full application with:
```bash
./deploy-esm.sh
```

This deployment:
- Builds the complete application
- Uses a proper multi-stage Docker build
- Maintains ES Module compatibility with Node.js flags
- Includes all application functionality

## Key Files

1. **app-minimal.mjs**: Ultra-minimal ES Module server with no dependencies
2. **Dockerfile.esm-app**: Dockerfile for the minimal ES Module server
3. **Dockerfile.esm**: Complete Dockerfile for the full application using ES Modules
4. **cloudbuild.esm.yaml**: Cloud Build configuration for CI/CD deployment
5. **cloudbuild.esm-app.yaml**: Cloud Build configuration for the minimal app

## Technical Implementation

### Module System Consistency

- The application is configured with `"type": "module"` in package.json
- All server files use ES Module import/export syntax
- The Docker CMD uses appropriate Node.js flags for ES Module compatibility
- No CommonJS-specific syntax (require, module.exports) is used in server files

### Production Considerations

When deploying to production, ensure:

1. All necessary environment variables are set
2. The --experimental-specifier-resolution=node flag is included for Node.js
3. Database connections are properly configured
4. Health check endpoints respond within the timeout period

## Benefits of ES Modules

- Modern JavaScript syntax with import/export
- Top-level await support
- Better tree-shaking and code optimization
- Consistency with the existing codebase
- Compatible with modern Node.js versions

## Troubleshooting

If you encounter issues:

1. Check the Cloud Run logs for specific errors
2. Verify that the minimal ESM app deploys successfully
3. Ensure all required environment variables are properly set
4. Confirm that package.json is correctly copied to the production container