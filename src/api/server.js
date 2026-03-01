/**
 * StarBank - REST API Server
 * Provides HTTP API for bank management and monitoring
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');

class APIServer {
  constructor(config, bank, wifi, nat, scheduler) {
    this.config = config;
    this.bank = bank;
    this.wifi = wifi;
    this.nat = nat;
    this.scheduler = scheduler;
    this.app = express();
    this.server = null;
    this.io = null;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    const apiConfig = this.config.api || {};
    
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    
    // Settings storage (in-memory, could be persisted to file)
    this.settings = {
      darkMode: false,
      fontSize: '12px',
      sectionColors: {
        bank: '#28a745',
        speed: '#0066cc',
        wifi: '#9b59b6',
        system: '#ffc107',
        transactions: '#e74c3c'
      },
      refreshInterval: 5
    };
    
    if (apiConfig.cors_enabled) {
      this.app.use(cors());
    }
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Serve static files (dashboard)
    this.app.use(express.static(path.join(__dirname, '../web')));

    // Catch-all for SPA - serve index.html
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../web/dashboard.html'));
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      const start = Date.now();
      // Calculate latency by measuring response time
      setImmediate(() => {
        const latency = Date.now() - start;
        res.json({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          latency: latency,
          services: {
            bank: this.bank.getStatus().availableMB > 0 ? 'active' : 'idle',
            wifi: this.wifi.getStatus().ap?.enabled ? 'active' : 'idle',
            nat: this.nat.getStatus().running ? 'active' : 'stopped',
            scheduler: this.scheduler.getStatus().running ? 'active' : 'stopped'
          }
        });
      });
    });

    // Bank endpoints
    this.app.get('/api/bank/status', (req, res) => {
      res.json(this.bank.getStatus());
    });

    this.app.post('/api/bank/refill', async (req, res) => {
      try {
        const { amount, source } = req.body;
        const result = await this.bank.refill(amount, source || 'api');
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/bank/consume', async (req, res) => {
      try {
        const { amount } = req.body;
        const result = await this.bank.consume(amount);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/bank/speed', async (req, res) => {
      try {
        const { speed } = req.body;
        const result = this.bank.setSupplySpeed(speed);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.get('/api/bank/transactions', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json(this.bank.getTransactions(limit));
    });

    // Wi-Fi endpoints
    this.app.get('/api/wifi/status', (req, res) => {
      res.json(this.wifi.getStatus());
    });

    this.app.post('/api/wifi/scan', async (req, res) => {
      try {
        const result = await this.wifi.scanNetworks();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/wifi/connect', async (req, res) => {
      try {
        const { ssid, password } = req.body;
        const result = await this.wifi.connectClient(ssid, password);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    this.app.post('/api/wifi/disconnect', async (req, res) => {
      try {
        const result = await this.wifi.disconnectClient();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // NAT endpoints
    this.app.get('/api/nat/status', (req, res) => {
      res.json(this.nat.getStatus());
    });

    this.app.post('/api/nat/start', async (req, res) => {
      try {
        const result = await this.nat.start();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/nat/stop', async (req, res) => {
      try {
        const result = await this.nat.stop();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Scheduler endpoints
    this.app.get('/api/scheduler/status', (req, res) => {
      res.json(this.scheduler.getStatus());
    });

    this.app.post('/api/scheduler/start', (req, res) => {
      const result = this.scheduler.start();
      res.json(result);
    });

    this.app.post('/api/scheduler/stop', (req, res) => {
      const result = this.scheduler.stop();
      res.json(result);
    });

    // System endpoints
    this.app.get('/api/system/status', (req, res) => {
      res.json({
        bank: this.bank.getStatus(),
        wifi: this.wifi.getStatus(),
        nat: this.nat.getStatus(),
        scheduler: this.scheduler.getStatus()
      });
    });

    // Settings endpoints
    this.app.get('/api/settings', (req, res) => {
      res.json(this.settings);
    });

    this.app.post('/api/settings', (req, res) => {
      try {
        const newSettings = req.body;
        this.settings = { ...this.settings, ...newSettings };
        res.json({ success: true, settings: this.settings });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Logs endpoint
    this.app.get('/api/logs', (req, res) => {
      res.json({
        events: this.bank.getTransactions(50),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  /**
   * Start the API server
   */
  async start() {
    const apiConfig = this.config.api || {};
    const port = apiConfig.port || 8080;
    const host = apiConfig.host || '0.0.0.0';

    return new Promise((resolve, reject) => {
      this.server = http.createServer(this.app);
      
      // Setup Socket.IO for real-time updates
      this.io = require('socket.io')(this.server, {
        cors: { origin: '*' }
      });

      this.setupSocketEvents();

      this.server.listen(port, host, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[API] Server running on http://${host}:${port}`);
          resolve({ host, port });
        }
      });
    });
  }

  /**
   * Setup Socket.IO events
   */
  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('[API] Client connected:', socket.id);

      // Send periodic status updates
      const interval = setInterval(() => {
        socket.emit('status_update', {
          bank: this.bank.getStatus(),
          wifi: this.wifi.getStatus(),
          timestamp: new Date().toISOString()
        });
      }, 5000);

      socket.on('disconnect', () => {
        console.log('[API] Client disconnected:', socket.id);
        clearInterval(interval);
      });
    });

    // Forward bank events to clients
    this.bank.on('refill', (data) => {
      this.io.emit('bank_refill', data);
    });

    this.bank.on('consume', (data) => {
      this.io.emit('bank_consume', data);
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[API] Server stopped');
          resolve();
        });
      });
    }
  }
}

module.exports = APIServer;
