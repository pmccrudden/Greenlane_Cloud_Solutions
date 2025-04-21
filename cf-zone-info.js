// A simplified script to get Cloudflare Zone ID for a domain
async function getZoneInfo() {
  const domain = 'greenlanecloudsolutions.com';
  const cfToken = 'wtHMV0-iQdDYQq0UQgXZbO_D';
  
  try {
    console.log(`Fetching zone information for domain: ${domain}`);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare API error:', data.errors);
      return;
    }
    
    if (data.result.length === 0) {
      console.error(`No zone found for domain: ${domain}`);
      console.error('Make sure the domain is registered with Cloudflare and your API token has access to it.');
      return;
    }
    
    const zone = data.result[0];
    
    console.log('\n===== Cloudflare Zone Information =====');
    console.log(`Domain: ${zone.name}`);
    console.log(`Zone ID: ${zone.id}`);
    console.log(`Status: ${zone.status}`);
    
    console.log('\n===== Environment Variable Setup =====');
    console.log('Add the following to your .env.deploy file:');
    console.log(`CLOUDFLARE_ZONE_ID=${zone.id}`);
    console.log(`BASE_DOMAIN=${zone.name}`);
    
    return zone.id;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Execute the function
getZoneInfo();