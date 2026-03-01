/**
 * StarBank - Scheduler
 * Manages auto-refill cycles, battery monitoring, and power optimization
 */

const EventEmitter = require('events');
const schedule = require('node-schedule');

class Scheduler extends EventEmitter {
  constructor(config, bank, wifi, battery) {
    super();
    this.config = config;
    this.bank = bank;
    this.wifi = wifi;
    this.battery = battery;
    this.schedulerConfig = config.scheduler || {};
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize scheduler
   */
  async initialize() {
    console.log('[Scheduler] Initializing Scheduler...');

    // Setup auto-refill job
    if (this.schedulerConfig.auto_refill?.enabled) {
      this.setupAutoRefill();
    }

    // Setup battery monitoring
    if (this.schedulerConfig.battery_monitoring?.enabled) {
      this.setupBatteryMonitoring();
    }

    // Setup power save mode
    if (this.schedulerConfig.power_save?.enabled) {
      this.setupPowerSave();
    }

    this.emit('initialized');
    return this.getStatus();
  }

  /**
   * Start scheduler
   */
  start() {
    console.log('[Scheduler] Starting...');
    this.isRunning = true;
    
    // Execute all scheduled jobs
    for (const [name, job] of this.jobs) {
      if (job.rule) {
        schedule.scheduleJob(name, job.rule, job.callback);
      }
    }
    
    this.emit('started');
    console.log('[Scheduler] Started');
    return { success: true };
  }

  /**
   * Stop scheduler
   */
  stop() {
    console.log('[Scheduler] Stopping...');
    this.isRunning = false;
    
    for (const [name, job] of this.jobs) {
      schedule.cancelJob(name);
    }
    
    this.emit('stopped');
    console.log('[Scheduler] Stopped');
    return { success: true };
  }

  /**
   * Setup auto-refill job
   */
  setupAutoRefill() {
    const interval = this.schedulerConfig.auto_refill.interval_minutes || 60;
    const preferredUpstream = this.schedulerConfig.auto_refill.preferred_upstream || 'wifi';

    console.log(`[Scheduler] Auto-refill every ${interval} minutes via ${preferredUpstream}`);

    this.jobs.set('auto_refill', {
      rule: new schedule.RecurrenceRule(),
      callback: async () => {
        await this.performAutoRefill(preferredUpstream);
      }
    });
  }

  /**
   * Perform auto-refill
   */
  async performAutoRefill(preferredUpstream) {
    console.log('[Scheduler] Performing auto-refill...');

    // Check if bank needs refill
    const threshold = this.config.banking?.refill_threshold_mb || 512;
    const bankStatus = this.bank.getStatus();

    if (bankStatus.availableMB >= threshold) {
      console.log('[Scheduler] Bank balance sufficient, skipping refill');
      return;
    }

    // Check upstream availability
    const wifiStatus = this.wifi.getStatus();
    const canRefill = preferredUpstream === 'wifi' && wifiStatus.client?.connected;

    if (canRefill) {
      console.log('[Scheduler] Refilling from Wi-Fi upstream...');
      // In production, this would pull data from the connected network
      const refillAmount = 2048; // 2GB refill
      await this.bank.refill(refillAmount, 'auto-wifi');
      this.emit('auto_refill_complete', { amount: refillAmount });
    } else {
      console.log('[Scheduler] Upstream not available for refill');
      this.emit('refill_failed', { reason: 'upstream_unavailable' });
    }
  }

  /**
   * Setup battery monitoring job
   */
  setupBatteryMonitoring() {
    const checkInterval = 5; // minutes

    this.jobs.set('battery_monitor', {
      rule: new schedule.RecurrenceRule(),
      callback: async () => {
        await this.checkBattery();
      }
    });
  }

  /**
   * Check battery status
   */
  async checkBattery() {
    const lowThreshold = this.schedulerConfig.battery_monitoring?.low_battery_threshold || 20;
    const criticalThreshold = this.schedulerConfig.battery_monitoring?.critical_threshold || 10;

    // Get battery status (simulated in production, use actual battery API)
    const batteryLevel = this.battery ? await this.battery.getLevel() : 75;

    console.log(`[Scheduler] Battery level: ${batteryLevel}%`);

    if (batteryLevel <= criticalThreshold) {
      console.warn('[Scheduler] CRITICAL: Battery very low!');
      this.emit('battery_critical', { level: batteryLevel });
      
      // Enable power save mode
      this.enablePowerSave();
    } else if (batteryLevel <= lowThreshold) {
      console.warn('[Scheduler] Battery low:', batteryLevel);
      this.emit('battery_low', { level: batteryLevel });
    }
  }

  /**
   * Setup power save mode
   */
  setupPowerSave() {
    const idleTimeout = this.schedulerConfig.power_save?.idle_timeout_minutes || 30;

    this.jobs.set('power_save', {
      rule: new schedule.RecurrenceRule(),
      callback: () => {
        this.checkIdleTime();
      }
    });
  }

  /**
   * Check for idle time and enable power save
   */
  async checkIdleTime() {
    // In production, check actual client activity
    const activeClients = 0; // Would check DHCP leases
    
    if (activeClients === 0) {
      console.log('[Scheduler] No active clients, enabling power save');
      this.enablePowerSave();
    }
  }

  /**
   * Enable power save mode
   */
  enablePowerSave() {
    console.log('[Scheduler] Power save mode enabled');
    this.emit('power_save_enabled');
    // Reduce Wi-Fi power, disable unused services
  }

  /**
   * Disable power save mode
   */
  disablePowerSave() {
    console.log('[Scheduler] Power save mode disabled');
    this.emit('power_save_disabled');
  }

  /**
   * Schedule a one-time job
   */
  scheduleOnce(name, date, callback) {
    schedule.scheduleJob(name, date, callback);
    console.log(`[Scheduler] Scheduled one-time job: ${name}`);
  }

  /**
   * Cancel a scheduled job
   */
  cancelJob(name) {
    schedule.cancelJob(name);
    this.jobs.delete(name);
    console.log(`[Scheduler] Cancelled job: ${name}`);
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      autoRefillEnabled: this.schedulerConfig.auto_refill?.enabled || false,
      batteryMonitoringEnabled: this.schedulerConfig.battery_monitoring?.enabled || false,
      powerSaveEnabled: this.schedulerConfig.power_save?.enabled || false
    };
  }
}

module.exports = Scheduler;
