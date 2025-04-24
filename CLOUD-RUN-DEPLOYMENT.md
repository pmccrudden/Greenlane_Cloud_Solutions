# Greenlane CRM Cloud Run Deployment Guide

## Identified Issues

After troubleshooting the Cloud Run deployment, we identified several key issues:

1. **Package.json Missing**: The `package.json` file wasn't being properly copied to the production stage of the Docker build, causing `npm start` to fail.

2. **Module System Mismatch**: The application is configured to use ES modules (`type: "module"` in package.json), but Cloud Run deployment was experiencing issues with ES module imports.

3. **Command Override**: Cloud Run was overriding the Dockerfile CMD instruction with its own command parameters, affecting how the application starts.

4. **Health Check Failures**: The application wasn't quickly binding to the PORT environment variable, causing Cloud Run health checks to fail.

## Solutions Implemented

We've developed a gradual approach to solving these issues:

### 1. Ultra-Minimal Server

The `deploy-ultra-minimal.sh` script deploys a basic Node.js server that:
- Uses CommonJS syntax
- Has no dependencies
- Reliably binds to the PORT environment variable
- Passes Cloud Run health checks

This confirms the Cloud Run environment is correctly configured.

### 2. Production Server (CommonJS)

We created `server.cjs` which:
- Uses CommonJS syntax for reliability
- Provides detailed diagnostic information
- Binds to the port immediately
- Handles health check requests
- Includes robust error handling

### 3. Improved Dockerfile

The `Dockerfile.production` improves on the original by:
- Explicitly copying package.json to production stage
- Using a direct `node server.js` command instead of npm
- Adding diagnostic logging
- Following multi-stage build best practices

### 4. Production Deployment Script

The `deploy-production.sh` script:
- Uses our CommonJS server
- Sets appropriate resource limits
- Configures proper environment variables
- Includes verification and testing

## Deployment Strategy

We recommend the following deployment strategy:

1. **Start with Ultra-Minimal**: First deploy the ultra-minimal server to verify Cloud Run configuration is correct.

2. **Deploy Production Version**: Use the production deployment script to deploy the full application with the optimized Dockerfile and server.

3. **Verify with Diagnostic Endpoints**: Use the `/debug` endpoint to check environment configuration.

4. **Review Logs**: Continuously monitor Cloud Run logs for startup issues.

## Future Improvements

Once the deployment is stable, consider:

1. **Migrate Back to ES Modules**: After establishing a reliable deployment, reintroduce ES module compatibility.

2. **Implement Graceful Startup**: Enhance the server startup process to handle more complex initialization.

3. **Add Health Check Probes**: Configure explicit health check endpoints for more reliable monitoring.

4. **Optimize Cold Start**: Tune the application for faster cold starts in serverless environments.

## Lessons Learned

- Cloud Run requires applications to quickly bind to the PORT environment variable
- Multi-stage Docker builds need careful management of file copying
- CommonJS is more reliable for initial server startup in cloud environments
- Diagnostic endpoints are invaluable for troubleshooting deployment issues