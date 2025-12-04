# RangerBlock Smart Contracts - Deployment Guide

Deploy RangerBlock contracts to Ethereum and Solana testnets for testing.

---

## Quick Links

| Tool | URL | Purpose |
|------|-----|---------|
| **Remix IDE** | https://remix.ethereum.org | Ethereum contract deployment |
| **Solana Playground** | https://beta.solpg.io | Solana contract deployment |
| **Sepolia Faucet** | https://sepoliafaucet.com | Free test ETH |
| **Solana Devnet Faucet** | https://faucet.solana.com | Free test SOL |
| **Bitcoin Testnet Faucet** | https://coinfaucet.eu/en/btc-testnet | Free test BTC |

---

## Part 1: Browser IDE Deployment (No Install Needed)

### Ethereum - Remix IDE

**Step 1: Open Remix**
1. Go to https://remix.ethereum.org
2. Create new workspace or use default

**Step 2: Upload Contracts**
1. In File Explorer, click "Upload Files"
2. Upload from `Blockchain/contracts/`:
   - `RangerRegistration.sol`
   - `RangerBridge.sol`
   - `RangerFileTransfer.sol`

**Step 3: Compile**
1. Click "Solidity Compiler" tab (left sidebar)
2. Select compiler version `0.8.19` or higher
3. Click "Compile" for each contract

**Step 4: Deploy to Sepolia Testnet**
1. Click "Deploy & Run" tab
2. Environment: Select "Injected Provider - MetaMask"
3. Connect MetaMask to Sepolia testnet
4. Get free test ETH from https://sepoliafaucet.com
5. Select contract, click "Deploy"
6. Confirm in MetaMask

**Step 5: Save Contract Addresses**
After deployment, save the contract addresses:
```
RangerRegistration: 0x...
RangerBridge: 0x...
RangerFileTransfer: 0x...
```

---

### Solana - Solana Playground

**Step 1: Open Playground**
1. Go to https://beta.solpg.io
2. Connect Phantom wallet (or create playground wallet)

**Step 2: Create Project**
1. Click "New Project"
2. Select "Anchor" template
3. Name: "rangerblock"

**Step 3: Upload Contracts**
Replace `lib.rs` content with our contracts:
- `ranger_registration.rs`
- `ranger_bridge.rs`
- `ranger_file_transfer.rs`
- `ranger_token.rs`

**Step 4: Build & Deploy**
1. Click "Build" (compiles to BPF)
2. Switch to Devnet in wallet
3. Get free SOL from https://faucet.solana.com
4. Click "Deploy"

**Step 5: Save Program IDs**
After deployment:
```
ranger_registration: <PROGRAM_ID>
ranger_bridge: <PROGRAM_ID>
ranger_file_transfer: <PROGRAM_ID>
ranger_token: <PROGRAM_ID>
```

---

## Part 2: Local Hardhat Setup (Advanced)

### Prerequisites
```bash
node -v  # v18 or higher
npm -v   # v9 or higher
```

### Setup Hardhat Project

```bash
# Create new directory
mkdir rangerblock-hardhat
cd rangerblock-hardhat

# Initialize npm
npm init -y

# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat
npx hardhat init
# Select: "Create a JavaScript project"

# Copy contracts
cp ../Blockchain/contracts/*.sol contracts/

# Install OpenZeppelin (for imports)
npm install @openzeppelin/contracts
```

### Configure for Sepolia

Create/edit `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

// Get private key from environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

### Deploy Script

Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying RangerBlock contracts...");

  // Deploy RangerRegistration
  const Registration = await hre.ethers.getContractFactory("RangerRegistration");
  const registration = await Registration.deploy();
  await registration.waitForDeployment();
  console.log("RangerRegistration:", await registration.getAddress());

  // Deploy RangerBridge
  const Bridge = await hre.ethers.getContractFactory("RangerBridge");
  const bridge = await Bridge.deploy();
  await bridge.waitForDeployment();
  console.log("RangerBridge:", await bridge.getAddress());

  // Deploy RangerFileTransfer
  const FileTransfer = await hre.ethers.getContractFactory("RangerFileTransfer");
  const fileTransfer = await FileTransfer.deploy();
  await fileTransfer.waitForDeployment();
  console.log("RangerFileTransfer:", await fileTransfer.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Run Locally
```bash
# Start local node
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Sepolia
```bash
# Set environment variables
export PRIVATE_KEY="your-wallet-private-key"
export ALCHEMY_API_KEY="your-alchemy-api-key"

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Part 3: Testnet Faucets

### Ethereum Testnets

| Network | Faucet | Amount |
|---------|--------|--------|
| **Sepolia** | https://sepoliafaucet.com | 0.5 ETH/day |
| **Sepolia** | https://www.alchemy.com/faucets/ethereum-sepolia | 0.1 ETH (needs Alchemy account) |
| **Goerli** | https://goerlifaucet.com | Deprecated, use Sepolia |

### Solana Testnets

| Network | Faucet | Amount |
|---------|--------|--------|
| **Devnet** | https://faucet.solana.com | 2 SOL/request |
| **Devnet** | CLI: `solana airdrop 2` | 2 SOL/request |

### Bitcoin Testnet

| Network | Faucet | Amount |
|---------|--------|--------|
| **Testnet3** | https://coinfaucet.eu/en/btc-testnet | 0.001 BTC |
| **Testnet3** | https://testnet-faucet.mempool.co | 0.001 BTC |
| **Testnet3** | https://bitcoinfaucet.uo1.net | 0.0001 BTC |
| **Signet** | https://signet.bc-2.jp | 0.01 sBTC |

**Bitcoin Testnet Wallet Options:**
- Electrum (desktop): https://electrum.org - Enable testnet mode
- BlueWallet (mobile): Settings > Network > Bitcoin Testnet
- Sparrow (desktop): https://sparrowwallet.com - Connect to testnet

**Get Bitcoin Testnet Address:**
```bash
# Using Bitcoin Core (if installed)
bitcoin-cli -testnet getnewaddress

# Using Electrum
# File > New/Restore > Standard wallet > Use testnet
```

---

## Part 4: Verifying Contracts

### Etherscan Verification (Sepolia)

```bash
# Install plugin
npm install --save-dev @nomicfoundation/hardhat-verify

# Add to hardhat.config.js
require("@nomicfoundation/hardhat-verify");

module.exports = {
  // ... existing config
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

# Verify
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Solana Explorer
- Devnet Explorer: https://explorer.solana.com/?cluster=devnet
- Enter program ID to view deployed contract

---

## Contract Addresses (After Deployment)

Update this section after deploying:

### Ethereum Sepolia
```
RangerRegistration: <pending>
RangerBridge: <pending>
RangerFileTransfer: <pending>
```

### Solana Devnet
```
ranger_registration: <pending>
ranger_bridge: <pending>
ranger_file_transfer: <pending>
ranger_token: <pending>
```

---

## Security Notes

1. **NEVER commit private keys** - Use environment variables
2. **Testnets only** - These contracts are for testing, not mainnet
3. **Audit required** - Get security audit before mainnet deployment
4. **Rate limits** - Faucets have daily limits, plan accordingly

---

*Rangers lead the way!*
