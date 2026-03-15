<div align="center">
<b>⭐Bank - Portable SIM-less ISP Router</b>
    </div>

<p align="center">
    <img src="https://res.cloudinary.com/dqv8dlj2s/image/upload/v1772326350/favicon_z20pgw.png"/>
  <img src="https://res.cloudinary.com/dqv8dlj2s/image/upload/v1772376069/Screenshot_2026-03-01_173916_hfreov.png"/>
</p>

# 🌐 BankNet — Portable SIM-less ISP Router

![License](https://img.shields.io/badge/license-Apache%202.0-blue)
![Node](https://img.shields.io/badge/node-%3E=16-green)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi%20%7C%20Linux-orange)
![Status](https://img.shields.io/badge/status-Prototype-yellow)
![Networking](https://img.shields.io/badge/focus-Networking%20Systems-blue)

**BankNet** is a **battery-powered portable router that acts as a micro-ISP**, capable of **storing internet bandwidth ("network banking") and distributing it to connected devices** via Wi-Fi or LAN.

Inspired by satellite internet architectures like Starlink, BankNet explores the concept of **bandwidth storage and controlled distribution**, allowing devices to use internet access even when upstream connectivity is intermittent.

This project demonstrates **embedded networking, edge computing, and software-defined networking using Node.js and Linux networking tools.**

---

# 🚀 Project Goals

BankNet explores the idea of a **portable programmable ISP node**.

Objectives:

- Provide **internet access in disconnected environments**
- Enable **bandwidth banking and distribution**
- Build a **portable edge networking device**
- Demonstrate **software-defined networking on embedded hardware**
- Implement **traffic shaping and bandwidth management**

---

# ✨ Features

### 🌍 Upstream Internet Connectivity
BankNet can obtain internet through:

- Satellite modules (LEO / MEO)
- WiFi uplink networks
- Ethernet WAN
- LTE / 5G fallback (future support)

---

### 🏦 Network Banking

A unique concept where internet bandwidth is **stored locally and distributed as needed**.

Capabilities:

- Local bandwidth quota storage
- Usage accounting
- Adjustable supply rate
- Bandwidth conservation during outages

---

### 📡 Portable Mini-ISP

BankNet acts as a **local ISP hotspot** providing internet access to connected devices.

Supported interfaces:

- WiFi Access Point
- Ethernet LAN

Features:

- NAT routing
- DHCP service
- network isolation
- device monitoring

---

### ⚡ Supply Control

Dynamic bandwidth allocation.

```
1 Mbps → 1000 Mbps
```

Useful for:

- traffic throttling
- fair network usage
- bandwidth conservation

---

### 🔁 Auto Refill

Automatically reconnects to upstream sources to **recharge the network bank** when capacity is low.

---

### 🔌 LAN Refill

Administrators can **inject internet data via Ethernet** for offline mesh networks or edge deployments.

---

### 🔋 Battery Powered

Designed for **portable networking deployments**.

| Battery Capacity | Estimated Runtime |
|-----------------|------------------|
| 10,000 mAh | 4–6 hours |
| 20,000 mAh | 8–12 hours |

---

# 🏗 System Architecture

```
              Upstream Internet
        (Satellite / WiFi / WAN)
                    │
                    ▼
          ┌───────────────────┐
          │  WiFi Uplink      │
          │  Connection Mgmt  │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │   Network Bank    │
          │ Bandwidth Storage │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ NAT / Routing     │
          │ Traffic Control   │
          └─────────┬─────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Local Hotspot   │
           │ WiFi + Ethernet │
           └─────────┬───────┘
                     │
     ┌───────────────▼───────────────┐
     │ Connected Client Devices      │
     │ phones • laptops • IoT        │
     └───────────────────────────────┘
```

---

# 📂 Repository Structure

```
banknet/
│
├── config/                 # YAML configuration files
│
├── src/
│   ├── banking/            # Network bank management
│   ├── wifi/               # WiFi client/AP manager
│   ├── nat/                # NAT routing engine
│   ├── scheduler/          # Auto-refill scheduler
│   ├── api/                # REST API server
│   ├── web/                # Dashboard UI
│   └── cli/                # CLI tools
│
├── docs/                   # Project documentation
│
├── README.md
├── LICENSE
├── package.json
└── requirements.txt
```

---

# 🧰 Technology Stack

### Core

- Node.js
- Linux networking tools
- iptables / nftables
- Traffic Control (tc)

### Networking

- NAT routing
- DHCP server
- WiFi access point
- bandwidth shaping

### Optional Tools

- Python automation scripts

---

# ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/mwakidenis/banknet.git
cd banknet
```

---

### 2. Install Dependencies

```bash
npm install
```

Optional CLI tools:

```bash
pip install -r requirements.txt
```

---

### 3. Start Router Service

```bash
npm start
```

---

# 🔧 Configuration

Configuration file:

```
config/config.yaml
```

Example:

```yaml
wifi:
  ssid: BankNet
  password: securepass123

bank:
  capacity: 10000
  refill_threshold: 2000

network:
  max_speed: 200
```

---

# 🌐 REST API

| Endpoint | Method | Description |
|--------|--------|-------------|
| `/api/bank/status` | GET | Get network bank status |
| `/api/bank/refill` | POST | Refill bank |
| `/api/bank/speed` | POST | Adjust bandwidth supply |
| `/api/wifi/status` | GET | WiFi hotspot status |
| `/api/wifi/scan` | POST | Scan available networks |
| `/api/nat/start` | POST | Start NAT routing |
| `/api/scheduler/start` | POST | Start auto refill |

---

# 🖥 Web Dashboard

Access the router dashboard:

```
http://localhost:8080
```

Features:

- network bank visualization
- bandwidth control
- upstream network connection
- system monitoring

---

# 🖥 CLI Tools

Check system status:

```bash
node src/cli/status.js
```

Custom host/port:

```bash
STARBANK_HOST=192.168.1.100 STARBANK_PORT=8080 node src/cli/status.js
```

---

# 🧪 Hardware Requirements

| Component | Recommendation |
|----------|---------------|
| CPU | Raspberry Pi CM4 |
| RAM | 2GB+ |
| Storage | 16GB microSD |
| WiFi | Dual-band adapter |
| Battery | 10k–20k mAh |

---

# 🛣 Development Roadmap

### Phase 1 — Prototype
- dual-mode WiFi
- basic banking
- NAT routing

### Phase 2 — Core Software
- bandwidth accounting
- supply control
- scheduling system

### Phase 3 — Hardware Integration
- battery system
- LAN refill
- device display interface

### Phase 4 — Advanced Networking
- LTE / 5G fallback
- mesh networking
- network analytics

### Phase 5 — Production
- security hardening
- hardware design
- documentation

---

# 📊 Potential Applications

- rural connectivity
- disaster recovery networking
- edge computing nodes
- mobile research networks
- portable ISP infrastructure

---

# 🎓 Academic Context

This project is part of a **network systems engineering capstone** focusing on:

- distributed networking
- edge computing
- software-defined networking
- portable ISP architectures

---

# 📜 License

Apache 2.0 License

---

# 👤 Author

**Denis Mwaki**

GitHub  
https://github.com/mwakidenis
