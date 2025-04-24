/**
 * Production server entrypoint
 * Loads the compiled application from dist/index.js
 */

// Import and run the compiled application
import('./dist/index.js')
  .then(() => {
    console.log('Application started successfully');
  })
  .catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });