// Special Cloud Run startup script
import('./dist/index.js').catch(error => {
  console.error('Failed to start application:');
  console.error(error);
  process.exit(1);
});
