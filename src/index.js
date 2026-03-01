/**
 * StarBank - Main Entry Point
 * Portable SIM-less ISP Router
 */

const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '../config/config.yaml');
let config = {
  system: { name: 'StarBank', version: '1.0.0' },
  banking: { default_speed_mbps: 2 },
  wifi: { ap: {}, client: {} },
  network: { dhcp: {} },
  nat: {},
  scheduler: { auto_refill: {}, battery_monitoring: {}, power_save: {} },
  api: { port: 8080 }
};

// Try to load YAML config
try {
  if (fs.existsSync(configPath)) {
    const yaml = require('js-yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    config = yaml.load(fileContents);
    console.log('[Config] Loaded configuration from config.yaml');
  }
} catch (error) {
  console.log('[Config] Using default configuration');
}

// Import modules
const NetworkBank = require('./banking/bank');
const WiFiManager = require('./wifi/manager');
const NATEngine = require('./nat/engine');
const Scheduler = require('./scheduler/index');
const APIServer = require('./api/server');

// Simple battery simulator (for demo)
class BatterySimulator {
  constructor() {
    this.level = 75;
  }
  async getLevel() {
    return this.level;
  }
}

class StarBankApp {
  constructor() {
    this.bank = null;
    this.wifi = null;
    this.nat = null;
    this.scheduler = null;
    this.api = null;
    this.battery = new BatterySimulator();
    this.isRunning = false;
  }

  /**
   * Initialize all modules
   */
  async initialize() {
    console.log('═══════════════════════════════════════════');
    console.log('  StarBank - Portable SIM-less ISP Router');
    console.log(`  Version: ${config.system?.version || '1.0.0'}`);
    console.log('═══════════════════════════════════════════\n');

    // Initialize banking layer
    console.log('[App] Initializing modules...');
    this.bank = new NetworkBank(config);
    await this.bank.initialize();
    console.log('[App] ✓ Network Bank initialized');

    // Initialize Wi-Fi manager
    this.wifi = new WiFiManager(config);
    await this.wifi.initialize();
    console.log('[App] ✓ Wi-Fi Manager initialized');

    // Initialize NAT engine
    this.nat = new NATEngine(config);
    await this.nat.initialize();
    console.log('[App] ✓ NAT Engine initialized');

    // Initialize scheduler
    this.scheduler = new Scheduler(config, this.bank, this.wifi, this.battery);
    await this.scheduler.initialize();
    console.log('[App] ✓ Scheduler initialized');

    // Initialize API server
    this.api = new APIServer(config, this.bank, this.wifi, this.nat, this.scheduler);
    console.log('[App] ✓ API Server ready');

    // Setup event handlers
    this.setupEventHandlers();

    console.log('[App] All modules initialized successfully\n');
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Bank events
    this.bank.on('refill', (data) => {
      console.log(`[Event] Bank refilled: ${data.amount}MB from ${data.source}`);
    });

    this.bank.on('consume', (data) => {
      console.log(`[Event] Bank consumed: ${data.amount}MB, remaining: ${data.balance}MB`);
    });

    this.bank.on('insufficient_balance', (data) => {
      console.warn(`[Warning] Insufficient balance! Requested: ${data.requested}MB, Available: ${data.available}MB`);
    });

    // Wi-Fi events
    this.wifi.on('client_connected', (data) => {
      console.log(`[Event] Client connected to AP: ${data.ssid}`);
    });

    this.wifi.on('client_disconnected', (data) => {
      console.log(`[Event] Client disconnected: ${data.previousSSID}`);
    });

    // Scheduler events
    this.scheduler.on('auto_refill_complete', (data) => {
      console.log(`[Event] Auto-refill complete: ${data.amount}MB`);
    });

    this.scheduler.on('battery_low', (data) => {
      console.warn(`[Warning] Battery low: ${data.level}%`);
    });

    this.scheduler.on('battery_critical', (data) => {
      console.error(`[CRITICAL] Battery critical: ${data.level}%`);
    });
  }

  /**
   * Start the application
   */
  async start() {
    console.log('[App] Starting StarBank...\n');

    try {
      // Start NAT/routing
      await this.nat.start();

      // Start scheduler
      this.scheduler.start();

      // Start API server
      await this.api.start();

      this.isRunning = true;
      
      console.log('\n═══════════════════════════════════════════');
      console.log('  StarBank is now running!');
      console.log('═══════════════════════════════════════════');
      console.log('  API Server: http://localhost:8080');
      console.log('  Web Dashboard: http://localhost:8080');
      console.log('  LAN IP: 192.168.100.1');
      console.log('  Wi-Fi AP: StarBank-Default');
      console.log('═══════════════════════════════════════════\n');

      // Handle shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());

    } catch (error) {
      console.error('[App] Failed to start:', error.message);
      process.exit(1);
    }
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('\n[App] Shutting down StarBank...');

    try {
      if (this.scheduler) {
        this.scheduler.stop();
      }

      if (this.nat) {
        await this.nat.stop();
      }

      if (this.api) {
        await this.api.stop();
      }

      console.log('[App]Shutdown complete. Goodbye!');
      process.exit(0);
    } catch (error) {
      console.error('[App] Error during shutdown:', error.message);
      process.exit(1);
    }
  }
}

// Run the application
const app = new StarBankApp();

app.initialize()
  .then(() => app.start())
  .catch((error) => {
    console.error('[App] Fatal error:', error);
    process.exit(1);
  });

module.exports = StarBankApp;
