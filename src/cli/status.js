/**
 * StarBank - CLI Status Tool
 * Check bank status from command line
 */

const http = require('http');

const API_HOST = process.env.STARBANK_HOST || 'localhost';
const API_PORT = process.env.STARBANK_PORT || 8080;

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${API_HOST}:${API_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function showStatus() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  StarBank - Status Monitor');
  console.log('═══════════════════════════════════════════\n');

  try {
    const status = await httpGet('/api/system/status');
    
    // Bank Status
    console.log('💰 NETWORK BANK');
    console.log(`   Available:  ${status.bank.availableMB} MB`);
    console.log(`   Used:        ${status.bank.usedMB} MB`);
    console.log(`   Capacity:   ${status.bank.totalMB} MB`);
    console.log(`   Supply:      ${status.bank.supplySpeedMbps} Mbps`);
    console.log(`   Est. Time:   ${status.bank.estimatedHoursRemaining.toFixed(1)} hours`);
    console.log(`   Refills:     ${status.bank.refillCount}`);
    console.log('');

    // Wi-Fi Status
    console.log('📶 WI-FI STATUS');
    console.log(`   AP SSID:     ${status.wifi.ap.ssid}`);
    console.log(`   AP Status:   ${status.wifi.ap.running ? 'Running' : 'Stopped'}`);
    console.log(`   Client:      ${status.wifi.client.connected ? status.wifi.client.ssid : 'Not connected'}`);
    console.log('');

    // NAT Status
    console.log('⚙️  NAT/ROUTING');
    console.log(`   Status:      ${status.nat.running ? 'Active' : 'Inactive'}`);
    console.log(`   LAN IP:      ${status.nat.lanIP}`);
    console.log(`   DHCP:        ${status.nat.dhcpEnabled ? 'Enabled' : 'Disabled'}`);
    console.log('');

    // Scheduler
    console.log('⏰ SCHEDULER');
    console.log(`   Status:      ${status.scheduler.running ? 'Running' : 'Stopped'}`);
    console.log(`   Auto-Refill:  ${status.scheduler.autoRefillEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Battery Mon: ${status.scheduler.batteryMonitoringEnabled ? 'Enabled' : 'Disabled'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error connecting to StarBank:', error.message);
    console.log('\nMake sure StarBank is running and the API is accessible.');
  }

  console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'status';

if (command === 'status') {
  showStatus();
} else if (command === 'bank') {
  httpGet('/api/bank/status').then(console.log).catch(console.error);
} else if (command === 'wifi') {
  httpGet('/api/wifi/status').then(console.log).catch(console.error);
} else if (command === 'help') {
  console.log('StarBank CLI Commands:');
  console.log('  status    - Show system status');
  console.log('  bank      - Show bank details');
  console.log('  wifi      - Show Wi-Fi status');
  console.log('  help      - Show this help');
} else {
  console.log('Unknown command:', command);
  console.log('Use "help" for available commands');
}
