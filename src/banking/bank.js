/**
 * StarBank - Core Banking Layer
 * Manages network quota storage and supply
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class NetworkBank extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.bankData = {
      totalMB: 0,
      usedMB: 0,
      availableMB: 0,
      refillCount: 0,
      lastRefill: null,
      transactions: []
    };
    this.supplySpeedMbps = config.banking?.default_speed_mbps || 2;
    this.isActive = false;
    this.storagePath = config.banking?.storage_path || '/var/lib/starbank/bank.json';
    this.maxCapacityMB = config.banking?.max_capacity_mb || 10240;
  }

  /**
   * Initialize the network bank
   */
  async initialize() {
    console.log('[Bank] Initializing Network Bank...');
    await this.loadBank();
    this.isActive = true;
    this.emit('initialized', this.getStatus());
    return this.getStatus();
  }

  /**
   * Load bank data from storage
   */
  async loadBank() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(data);
        this.bankData = { ...this.bankData, ...parsed };
        console.log(`[Bank] Loaded bank data: ${this.bankData.availableMB}MB available`);
      }
    } catch (error) {
      console.error('[Bank] Error loading bank data:', error.message);
    }
  }

  /**
   * Save bank data to storage
   */
  async saveBank() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storagePath, JSON.stringify(this.bankData, null, 2));
    } catch (error) {
      console.error('[Bank] Error saving bank data:', error.message);
    }
  }

  /**
   * Add data to the bank (refill)
   * @param {number} mb - Amount in MB to add
   * @param {string} source - Source of refill (satellite, lan, wifi)
   */
  async refill(mb, source = 'manual') {
    if (mb <= 0) {
      throw new Error('Invalid refill amount');
    }

    const previousAvailable = this.bankData.availableMB;
    this.bankData.availableMB = Math.min(
      this.bankData.availableMB + mb,
      this.maxCapacityMB
    );
    
    const actualAdded = this.bankData.availableMB - previousAvailable;
    
    this.bankData.refillCount++;
    this.bankData.lastRefill = new Date().toISOString();
    
    const transaction = {
      type: 'refill',
      amount: actualAdded,
      source,
      timestamp: new Date().toISOString(),
      balanceAfter: this.bankData.availableMB
    };
    
    this.bankData.transactions.push(transaction);
    await this.saveBank();
    
    console.log(`[Bank] Refilled ${actualAdded}MB from ${source}. Total: ${this.bankData.availableMB}MB`);
    this.emit('refill', { amount: actualAdded, source, balance: this.bankData.availableMB });
    
    return {
      added: actualAdded,
      balance: this.bankData.availableMB,
      transaction
    };
  }

  /**
   * Consume data from the bank
   * @param {number} mb - Amount in MB to consume
   */
  async consume(mb) {
    if (mb <= 0) {
      throw new Error('Invalid consumption amount');
    }

    if (this.bankData.availableMB < mb) {
      console.warn('[Bank] Insufficient balance!');
      this.emit('insufficient_balance', { requested: mb, available: this.bankData.availableMB });
      return {
        success: false,
        consumed: 0,
        balance: this.bankData.availableMB,
        error: 'Insufficient balance'
      };
    }

    this.bankData.availableMB -= mb;
    this.bankData.usedMB += mb;
    
    const transaction = {
      type: 'consume',
      amount: mb,
      timestamp: new Date().toISOString(),
      balanceAfter: this.bankData.availableMB
    };
    
    this.bankData.transactions.push(transaction);
    await this.saveBank();
    
    this.emit('consume', { amount: mb, balance: this.bankData.availableMB });
    
    return {
      success: true,
      consumed: mb,
      balance: this.bankData.availableMB
    };
  }

  /**
   * Set supply speed (Mbps)
   * @param {number} speedMbps - Speed in Mbps
   */
  setSupplySpeed(speedMbps) {
    if (speedMbps <= 0 || speedMbps > 1000) {
      throw new Error('Invalid speed. Must be between 1-1000 Mbps');
    }
    
    this.supplySpeedMbps = speedMbps;
    console.log(`[Bank] Supply speed set to ${speedMbps} Mbps`);
    this.emit('speed_changed', { speed: speedMbps });
    
    return { speed: this.supplySpeedMbps };
  }

  /**
   * Calculate estimated usage time at current speed
   * @returns {number} Estimated hours remaining
   */
  getEstimatedTimeRemaining() {
    if (this.supplySpeedMbps <= 0) return 0;
    
    // Calculate MB per hour at current speed
    const mbPerHour = this.supplySpeedMbps * 125; // 1 Mbps = 125 MB/hour
    return this.bankData.availableMB / mbPerHour;
  }

  /**
   * Get current bank status
   */
  getStatus() {
    return {
      totalMB: this.maxCapacityMB,
      usedMB: this.bankData.usedMB,
      availableMB: this.bankData.availableMB,
      refillCount: this.bankData.refillCount,
      lastRefill: this.bankData.lastRefill,
      supplySpeedMbps: this.supplySpeedMbps,
      isActive: this.isActive,
      estimatedHoursRemaining: this.getEstimatedTimeRemaining(),
      usagePercentage: ((this.bankData.usedMB / this.maxCapacityMB) * 100).toFixed(2)
    };
  }

  /**
   * Get transaction history
   * @param {number} limit - Number of recent transactions to return
   */
  getTransactions(limit = 50) {
    return this.bankData.transactions.slice(-limit);
  }

  /**
   * Reset bank (for testing)
   */
  async reset() {
    this.bankData = {
      totalMB: 0,
      usedMB: 0,
      availableMB: 0,
      refillCount: 0,
      lastRefill: null,
      transactions: []
    };
    await this.saveBank();
    this.emit('reset');
    console.log('[Bank] Bank reset complete');
    return this.getStatus();
  }
}

module.exports = NetworkBank;
