/**
 * Deploy a multi-tenant configuration of Greenlane CRM for ESM (Enhanced)
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';

/**
 * Load environment variables from a file
 * @param {string} file - Path to the environment file
 * @returns {Object} - Environment variables
 */
function loadEnvFromFile(file) {
  try {
    if (fsSync.existsSync(file)) {
      const content = fsSync.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const result = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Remove quotes if present
            const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
            process.env[key.trim()] = cleanValue;
            result[key.trim()] = cleanValue;
          }
        }
      }
      console.log(`Loaded environment variables from ${file}`);
      return result;
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${file}: ${error.message}`);
  }
  return {};
}

// Load environment variables
loadEnvFromFile('.env.deploy');
loadEnvFromFile('.env.production');

/**
 * Execute a shell command
 * @param {string} command - Command to execute
 * @returns {Promise<{stdout: string, stderr: string}>} - Output of the command
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        console.error(`Command stderr: ${stderr}`);
        reject(error);
        return;
      }
      
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Deploy the multi-tenant application to Cloud Run 
 */
async function deployMultiTenant() {
  try {
    console.log('Starting multi-tenant deployment (ESM Enhanced)...');
    
    // Step 1: Deploy the ESM enhanced application
    const deployResult = await executeCommand('./deploy-esm-enhanced.sh');
    console.log('ESM Enhanced deployment completed.');
    console.log(deployResult.stdout);
    
    // Get the service hostname from the file
    let serviceHostname;
    try {
      serviceHostname = await fs.readFile('service_hostname.txt', 'utf8');
      serviceHostname = serviceHostname.trim();
      console.log(`Service hostname: ${serviceHostname}`);
    } catch (error) {
      console.error('Failed to read service hostname:', error.message);
      throw new Error('Service hostname not found. Deployment may have failed.');
    }
    
    // Step 2: Configure DNS with Cloudflare
    console.log('Setting up Cloudflare DNS...');
    await executeCommand('node setup-cloudflare-dns.js');
    
    console.log('\n===== Multi-Tenant Deployment Complete =====');
    console.log(`App URL: https://app.greenlanecloudsolutions.com`);
    console.log(`API URL: https://api.greenlanecloudsolutions.com`);
    console.log(`Tenant URL pattern: https://<tenant-id>.greenlanecloudsolutions.com`);
    console.log('\nYou can create a tenant with:');
    console.log('  node create-tenant.js');
    console.log('\nOr create and verify DNS for an existing tenant with:');
    console.log('  node add-tenant-subdomain.js <tenant-id>');
    
    return { success: true };
  } catch (error) {
    console.error('Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Execute if this file is run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  deployMultiTenant();
}

// Export for use in other modules
export { deployMultiTenant };