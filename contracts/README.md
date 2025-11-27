# 🎖️ RangerToken Smart Contract

A fully-featured ERC20-like token smart contract for the RangerBlock ecosystem.

## 📋 Features

✅ **Standard ERC20 Functions**:
- `transfer()` - Send tokens to another address
- `approve()` - Allow someone to spend your tokens
- `transferFrom()` - Transfer tokens on behalf of someone
- `balanceOf()` - Check token balance
- `totalSupply()` - Get total supply

✅ **Extended Features**:
- 🪙 **Minting** - Owner can create new tokens
- 🔥 **Burning** - Token holders can burn their own tokens
- ⏸️ **Pausable** - Owner can pause/unpause all transfers (emergency stop)
- 👑 **Ownership Management** - Transfer or renounce ownership
- 📊 **Event Logging** - All operations emit events for transparency

## 🚀 Quick Start with Remix IDE

### 1. Open Remix IDE
Go to https://remix.ethereum.org/

### 2. Create New File
- Click "+" icon in the File Explorer
- Name it: `RangerToken.sol`
- Copy/paste the contract code

### 3. Compile
- Click "Solidity Compiler" tab (left sidebar)
- Select compiler version: `0.8.20+`
- Click **"Compile RangerToken.sol"**
- ✅ You should see a green checkmark

### 4. Deploy
- Click "Deploy & Run Transactions" tab
- **Environment**: Select deployment target
  - `Remix VM (London)` - For testing (recommended for first time)
  - `Injected Provider - MetaMask` - For testnet/mainnet deployment
- **Contract**: Select `RangerToken`
- **Constructor Parameter**:
  - `initialSupply` - Enter number (e.g., `1000000` for 1 million tokens)
  - This will be multiplied by 10^18 (decimals) automatically
- Click **"Deploy"** (orange button)

## 🎮 Usage Examples

### Check Your Balance
```solidity
balanceOf(YOUR_ADDRESS)
```

### Transfer Tokens
```solidity
transfer(RECIPIENT_ADDRESS, 100000000000000000000)  // 100 tokens (with 18 decimals)
```

### Mint New Tokens (Owner Only)
```solidity
mint(RECIPIENT_ADDRESS, 1000000000000000000000)  // 1000 tokens
```

### Burn Tokens
```solidity
burn(500000000000000000000)  // Burn 500 tokens from your balance
```

### Pause Transfers (Owner Only)
```solidity
pause()  // Emergency stop
unpause()  // Resume operations
```

### Approve Spending
```solidity
approve(SPENDER_ADDRESS, 100000000000000000000)  // Allow spender to use 100 tokens
```

### Transfer On Behalf
```solidity
transferFrom(OWNER_ADDRESS, RECIPIENT_ADDRESS, 50000000000000000000)  // Transfer 50 tokens
```

## 📊 Contract Details

| Property | Value |
|----------|-------|
| **Name** | Ranger Token |
| **Symbol** | RANGER |
| **Decimals** | 18 |
| **Total Supply** | Set at deployment (initial supply * 10^18) |
| **Mintable** | Yes (owner only) |
| **Burnable** | Yes (token holders) |
| **Pausable** | Yes (owner only) |

## 🔐 Security Features

1. **Owner-Only Functions**:
   - `mint()` - Only owner can create new tokens
   - `pause()` / `unpause()` - Only owner can halt transfers
   - `transferOwnership()` - Only owner can transfer control

2. **Safety Checks**:
   - ✅ Cannot transfer to zero address
   - ✅ Cannot transfer more than balance
   - ✅ Cannot transfer when paused
   - ✅ Requires sufficient allowance for `transferFrom()`

3. **Emergency Features**:
   - ⏸️ Pause mechanism for security incidents
   - 👑 Ownership can be renounced (decentralization)

## 💡 Use Cases

1. **Rewards Token** - Mint tokens as rewards for RangerBlock nodes
2. **Governance** - Vote on blockchain proposals
3. **Payment** - Transfer value between peers
4. **Staking** - Lock tokens for network participation
5. **Trading** - Exchange on DEXs (when deployed on mainnet)

## 📝 Deployment Checklist

**Testnet Deployment (Recommended First)**:
- [ ] Compile contract successfully
- [ ] Deploy on Remix VM for testing
- [ ] Test all functions (transfer, mint, burn, pause)
- [ ] Deploy on testnet (e.g., Sepolia, Goerli)
- [ ] Verify contract on block explorer
- [ ] Test with real wallet transactions

**Mainnet Deployment** (⚠️ Real Money!):
- [ ] Complete all testnet testing
- [ ] Audit contract (if handling significant value)
- [ ] Review constructor parameters (initial supply)
- [ ] Deploy on Ethereum mainnet
- [ ] Verify contract on Etherscan
- [ ] Transfer ownership if needed

## 🧪 Testing in Remix

1. **Deploy** with 1,000,000 initial supply
2. **Check balance**: `balanceOf(YOUR_ADDRESS)` → Should return `1000000000000000000000000` (1M with 18 decimals)
3. **Transfer**: Send 100 tokens to another address
4. **Pause**: Call `pause()` as owner
5. **Try transfer**: Should fail with "Token transfers are paused"
6. **Unpause**: Call `unpause()`
7. **Mint**: Create 500 new tokens
8. **Burn**: Destroy 200 tokens
9. **Check total supply**: Should reflect mints and burns

## 🎖️ Rangers Lead The Way!

This smart contract is part of the **RangerBlock P2P Blockchain** ecosystem. Use it to create your own token economy on Ethereum or compatible blockchains!

---

**Created by**: RangerPlex AI Team
**License**: MIT
**Compatible**: Ethereum, Polygon, BSC, Avalanche, and all EVM-compatible chains
