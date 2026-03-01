#              ⭐Bank - Portable SIM-less ISP Router

<p align="center">
    <img src="https://res.cloudinary.com/dqv8dlj2s/image/upload/v1772326350/favicon_z20pgw.png"/>
  <img src="https://res.cloudinary.com/dqv8dlj2s/image/upload/v1772376069/Screenshot_2026-03-01_173916_hfreov.png"/>
</p>

**StarBank** is a battery-powered, SIM-less portable router that stores ISP/satellite internet access in a "network bank" and serves connected devices as a mini-ISP. Inspired by Starlink, it allows offline internet usage, supply throttling, and LAN refill.

## Features

- **Satellite Internet Access** - Receives internet via satellite module (LEO/MEO)
- **ISP Banking** - Stores usable network quota locally
- **Mini-ISP Hotspot** - Provides Wi-Fi or LAN access to devices
- **Supply Control** - Adjustable speeds (1-1000 Mbps)
- **Auto Refill** - Automatically reconnects to recharge the bank
- **LAN Refill Support** - Inject data directly via Ethernet
- **Battery Powered** - Portable operation for several hours

## Quick Start

### Prerequisites

- Node.js 16+ 
- Raspberry Pi (recommended) or Linux-based system
- Wi-Fi adapter supporting AP mode

### Installation

```bash
# Clone and navigate to project
cd starbank

# Install Node.js dependencies
npm install

# Install Python dependencies (optional, for CLI tools)
pip install -r requirements.txt

# Start the application
npm start
```

### Configuration

Edit `config/config.yaml` to customize:

- Network settings
- Wi-Fi AP credentials
- Banking parameters
- Scheduler options

## Architecture

```
starbank/
├── config/           # Configuration files
├── src/
│   ├── banking/      # Network bank management
│   ├── wifi/         # Wi-Fi client/AP manager
│   ├── nat/          # NAT/routing engine
│   ├── scheduler/    # Auto-refill scheduler
│   ├── api/          # REST API server
│   ├── web/          # Dashboard UI
│   └── cli/          # CLI tools
└── docs/             # Documentation
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bank/status` | GET | Get bank status |
| `/api/bank/refill` | POST | Refill bank |
| `/api/bank/speed` | POST | Set supply speed |
| `/api/wifi/status` | GET | Get Wi-Fi status |
| `/api/wifi/scan` | POST | Scan networks |
| `/api/nat/start` | POST | Start NAT |
| `/api/scheduler/start` | POST | Start scheduler |

## Web Dashboard

Access the dashboard at `http://localhost:8080` to:

- View bank balance and usage
- Adjust supply speed
- Connect to upstream networks
- Monitor system status

## CLI Usage

```bash
# Check system status
node src/cli/status.js

# With custom host/port
STARBANK_HOST=192.168.1.100 STARBANK_PORT=8080 node src/cli/status.js
```

## Hardware Requirements

- **CPU**: Raspberry Pi CM4 or ESP32-S2
- **Storage**: 2GB+ microSD
- **Wi-Fi**: Dual-band adapter
- **Battery**: 10,000-20,000mAh Li-ion

## Development Phases

1. **Phase 1** - Prototype: Dual-mode Wi-Fi, basic bank storage
2. **Phase 2** - Core Software: Virtual routing, speed management
3. **Phase 3** - Hardware Integration: Battery, LAN, display
4. **Phase 4** - Advanced Features: LTE/5G fallback, analytics
5. **Phase 5** - Documentation & Launch

## License

Apache License
