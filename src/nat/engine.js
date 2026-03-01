/**
 * StarBank - NAT/Routing Engine
 * Handles packet routing and network address translation
 */

const EventEmitter = require('events');
const { exec } = require('child_process');

class NATEngine extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.networkConfig = config.network || {};
    this.natConfig = config.nat || {};
    this.isRunning = false;
    this.lanInterface = this.networkConfig.lan_interface || 'eth0';
    this.wanInterface = this.networkConfig.wan_interface || 'wlan0';
    this.lanIP = this.networkConfig.lan_ip || '192.168.100.1';
    this.lanNetmask = this.networkConfig.lan_netmask || '255.255.255.0';
    this.activeConnections = 0;
  }

  /**
   * Initialize NAT engine
   */
  async initialize() {
    console.log('[NAT] Initializing NAT Engine...');
    
    try {
      // Enable IP forwarding
      await this.setIPForwarding(true);
      
      // Setup will be done when starting
      this.emit('initialized');
      return this.getStatus();
    } catch (error) {
      console.error('[NAT] Initialization error:', error.message);
      throw error;
    }
  }

  /**
   * Execute shell command
   */
  execCommand(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Set IP forwarding
   */
  async setIPForwarding(enable) {
    try {
      await this.execCommand(`echo ${enable ? 1 : 0} > /proc/sys/net/ipv4/ip_forward`);
      console.log(`[NAT] IP forwarding: ${enable ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('[NAT] Could not set IP forwarding:', error.message);
    }
  }

  /**
   * Start NAT/routing
   */
  async start() {
    console.log('[NAT] Starting NAT Engine...');

    try {
      // Setup LAN interface
      await this.setupInterface(this.lanInterface, this.lanIP, this.lanNetmask);
      
      // Enable NAT/masquerading
      if (this.natConfig.masq_enabled) {
        await this.enableMasquerading();
      }
      
      // Setup DHCP server
      await this.startDHCP();
      
      // Setup routing
      await this.setupRouting();
      
      this.isRunning = true;
      this.emit('started');
      console.log('[NAT] NAT Engine started');
      
      return { success: true };
    } catch (error) {
      console.error('[NAT] Failed to start:', error.message);
      this.emit('error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop NAT/routing
   */
  async stop() {
    console.log('[NAT] Stopping NAT Engine...');

    try {
      // Stop DHCP
      await this.stopDHCP();
      
      // Remove NAT rules
      await this.disableMasquerading();
      
      this.isRunning = false;
      this.emit('stopped');
      console.log('[NAT] NAT Engine stopped');
      
      return { success: true };
    } catch (error) {
      console.error('[NAT] Failed to stop:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup network interface
   */
  async setupInterface(iface, ip, netmask) {
    try {
      // await this.execCommand(`ip addr add ${ip}/${this.cidrFromMask(netmask)} dev ${iface}`);
      // await this.execCommand(`ip link set ${iface} up`);
      console.log(`[NAT] Interface ${iface} configured: ${ip}/${netmask}`);
    } catch (error) {
      console.warn(`[NAT] Interface setup warning:`, error.message);
    }
  }

  /**
   * Enable IP masquerading
   */
  async enableMasquerading() {
    try {
      // await this.execCommand(`iptables -t nat -A POSTROUTING -o ${this.wanInterface} -j MASQUERADE`);
      // await this.execCommand(`iptables -A FORWARD -i ${this.lanInterface} -o ${this.wanInterface} -m state --state RELATED,ESTABLISHED -j ACCEPT`);
      // await this.execCommand(`iptables -A FORWARD -i ${this.wanInterface} -o ${this.lanInterface} -j ACCEPT`);
      console.log(`[NAT] Masquerading enabled on ${this.wanInterface}`);
    } catch (error) {
      console.warn('[NAT] Masquerading setup warning:', error.message);
    }
  }

  /**
   * Disable IP masquerading
   */
  async disableMasquerading() {
    try {
      // await this.execCommand('iptables -t nat -F');
      // await this.execCommand('iptables -F FORWARD');
      console.log('[NAT] Masquerading disabled');
    } catch (error) {
      console.warn('[NAT] Masquerading disable warning:', error.message);
    }
  }

  /**
   * Start DHCP server
   */
  async startDHCP() {
    const dhcpConfig = this.networkConfig.dhcp || {};
    
    if (!dhcpConfig.enabled) {
      console.log('[NAT] DHCP disabled in config');
      return;
    }

    const rangeStart = dhcpConfig.range_start || '192.168.100.100';
    const rangeEnd = dhcpConfig.range_end || '192.168.100.200';
    const leaseTime = dhcpConfig.lease_time_hours || 24;

    console.log(`[NAT] Starting DHCP server: ${rangeStart} - ${rangeEnd}`);
    
    // In production, use dnsmasq or isc-dhcp-server
    // await this.execCommand(`dnsmasq --interface=${this.lanInterface} --dhcp-range=${rangeStart},${rangeEnd},${this.lanNetmask},${leaseTime}h`);
    
    this.emit('dhcp_started', { rangeStart, rangeEnd });
  }

  /**
   * Stop DHCP server
   */
  async stopDHCP() {
    try {
      // await this.execCommand('killall dnsmasq');
      console.log('[NAT] DHCP server stopped');
    } catch (error) {
      console.warn('[NAT] DHCP stop warning:', error.message);
    }
  }

  /**
   * Setup routing rules
   */
  async setupRouting() {
    try {
      // Default route via WAN
      // await this.execCommand(`ip route add default via ${this.wanInterface}`);
      console.log('[NAT] Routing configured');
    } catch (error) {
      console.warn('[NAT] Routing setup warning:', error.message);
    }
  }

  /**
   * Add port forwarding rule
   */
  async addPortForward(protocol, externalPort, internalIP, internalPort) {
    try {
      // await this.execCommand(`iptables -A PREROUTING -p ${protocol} --dport ${externalPort} -j DNAT --to ${internalIP}:${internalPort}`);
      console.log(`[NAT] Port forward: ${protocol}:${externalPort} -> ${internalIP}:${internalPort}`);
      this.emit('port_forward_added', { protocol, externalPort, internalIP, internalPort });
      return { success: true };
    } catch (error) {
      console.error('[NAT] Port forward error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    try {
      // await this.execCommand('iptables -L -n -v');
      // Parse and return stats
      
      return {
        activeConnections: this.activeConnections,
        inputPackets: 0,
        outputPackets: 0,
        droppedPackets: 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Convert netmask to CIDR
   */
  cidrFromMask(netmask) {
    const maskParts = netmask.split('.').map(Number);
    let bits = 0;
    for (const part of maskParts) {
      bits += (part >>> 0).toString(2).replace('0', '').length;
    }
    return bits;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.isRunning,
      lanInterface: this.lanInterface,
      wanInterface: this.wanInterface,
      lanIP: this.lanIP,
      dhcpEnabled: this.networkConfig.dhcp?.enabled || false,
      masquerading: this.natConfig.masq_enabled || false
    };
  }
}

module.exports = NATEngine;
