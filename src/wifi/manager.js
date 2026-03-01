/**
 * StarBank - Wi-Fi Manager
 * Handles dual-mode Wi-Fi: Client + Access Point
 */

const EventEmitter = require('events');
const { exec } = require('child_process');
const fs = require('fs');

class WiFiManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.wifiConfig = config.wifi || {};
    this.mode = 'ap'; // 'ap', 'client', 'dual'
    this.isAPRunning = false;
    this.isClientConnected = false;
    this.connectedSSID = null;
    this.apInterface = 'wlan0';
    this.clientInterface = 'wlan1';
  }

  /**
   * Initialize Wi-Fi manager
   */
  async initialize() {
    console.log('[WiFi] Initializing Wi-Fi Manager...');
    
    // Check available interfaces
    await this.checkInterfaces();
    
    // Start AP by default
    await this.startAP();
    
    this.emit('initialized');
    return this.getStatus();
  }

  /**
   * Check available Wi-Fi interfaces
   */
  async checkInterfaces() {
    try {
      const interfaces = await this.execCommand('iw dev');
      if (interfaces.includes(this.apInterface)) {
        console.log(`[WiFi] Interface ${this.apInterface} available`);
      }
    } catch (error) {
      console.warn('[WiFi] Interface check failed:', error.message);
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
   * Start Access Point
   */
  async startAP() {
    const apConfig = this.wifiConfig.ap || {};
    const ssid = apConfig.ssid || 'StarBank';
    const password = apConfig.password || 'starbank123';
    const channel = apConfig.channel || 6;

    console.log(`[WiFi] Starting AP: ${ssid} on channel ${channel}`);

    try {
      // Create hostapd config
      const hostapdConfig = this.generateHostapdConfig(ssid, password, channel);
      fs.writeFileSync('/tmp/hostapd.conf', hostapdConfig);

      // Bring up interface
      await this.execCommand(`ip link set ${this.apInterface} up`);
      
      // Set IP for AP
      await this.execCommand(`ip addr add 192.168.100.1/24 dev ${this.apInterface}`);

      // Start hostapd (in production, use actual hostapd)
      // await this.execCommand(`hostapd /tmp/hostapd.conf &`);
      
      this.isAPRunning = true;
      this.emit('ap_started', { ssid, channel });
      console.log(`[WiFi] AP started: ${ssid}`);
      
      return { success: true, ssid, channel };
    } catch (error) {
      console.error('[WiFi] Failed to start AP:', error.message);
      this.emit('ap_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop Access Point
   */
  async stopAP() {
    try {
      await this.execCommand(`ip addr del 192.168.100.1/24 dev ${this.apInterface}`);
      // await this.execCommand('killall hostapd');
      this.isAPRunning = false;
      this.emit('ap_stopped');
      console.log('[WiFi] AP stopped');
      return { success: true };
    } catch (error) {
      console.error('[WiFi] Failed to stop AP:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to Wi-Fi network as client
   * @param {string} ssid - Network SSID
   * @param {string} password - Network password
   */
  async connectClient(ssid, password) {
    console.log(`[WiFi] Connecting to: ${ssid}`);

    try {
      // Create wpa_supplicant config
      const wpaConfig = this.generateWPAConfig(ssid, password);
      fs.writeFileSync('/tmp/wpa_supplicant.conf', wpaConfig);

      // Connect to network
      // await this.execCommand(`wpa_supplicant -B -i ${this.clientInterface} -c /tmp/wpa_supplicant.conf`);
      // await this.execCommand(`dhclient ${this.clientInterface}`);
      
      this.isClientConnected = true;
      this.connectedSSID = ssid;
      this.emit('client_connected', { ssid });
      console.log(`[WiFi] Connected to: ${ssid}`);
      
      return { success: true, ssid };
    } catch (error) {
      console.error('[WiFi] Failed to connect:', error.message);
      this.emit('client_error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from Wi-Fi network
   */
  async disconnectClient() {
    try {
      // await this.execCommand(`wpa_cli disconnect`);
      const previousSSID = this.connectedSSID;
      this.isClientConnected = false;
      this.connectedSSID = null;
      this.emit('client_disconnected', { previousSSID });
      console.log('[WiFi] Disconnected from network');
      return { success: true };
    } catch (error) {
      console.error('[WiFi] Failed to disconnect:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scan for available networks
   */
  async scanNetworks() {
    try {
      // await this.execCommand('wpa_cli scan');
      // await this.execCommand('wpa_cli scan_results');
      
      // Demo networks for testing
      const demoNetworks = [
        { ssid: 'Starlink-Office', signal: -45, security: 'WPA2' },
        { ssid: 'SatNet-5G', signal: -55, security: 'WPA2' },
        { ssid: 'Home-WiFi', signal: -60, security: 'WPA2' }
      ];
      
      this.emit('scan_complete', { networks: demoNetworks });
      return { success: true, networks: demoNetworks };
    } catch (error) {
      console.error('[WiFi] Scan failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate hostapd configuration
   */
  generateHostapdConfig(ssid, password, channel) {
    return `interface=${this.apInterface}
driver=nl80211
ssid=${ssid}
hw_mode=g
channel=${channel}
wpa=2
wpa_passphrase=${password}
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
macaddr_acl=0
ignore_broadcast_ssid=0
`;
  }

  /**
   * Generate wpa_supplicant configuration
   */
  generateWPAConfig(ssid, password) {
    return `ctrl_interface=/var/run/wpa_supplicant
ap_scan=1
network={
    ssid="${ssid}"
    psk="${password}"
    key_mgmt=WPA-PSK
}
`;
  }

  /**
   * Get current Wi-Fi status
   */
  getStatus() {
    return {
      mode: this.mode,
      ap: {
        running: this.isAPRunning,
        ssid: this.wifiConfig.ap?.ssid || 'StarBank',
        interface: this.apInterface
      },
      client: {
        connected: this.isClientConnected,
        ssid: this.connectedSSID,
        interface: this.clientInterface
      }
    };
  }

  /**
   * Switch between AP and Client mode
   */
  async setMode(mode) {
    if (mode === 'ap' && !this.isAPRunning) {
      await this.startAP();
    } else if (mode === 'client' && !this.isClientConnected) {
      console.log('[WiFi] No saved networks to connect to');
    }
    
    this.mode = mode;
    this.emit('mode_changed', { mode });
    return { success: true, mode };
  }
}

module.exports = WiFiManager;
