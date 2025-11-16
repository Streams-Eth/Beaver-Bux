# Base Deployment Guide

## Current Status
- ✅ Sepolia testnet token deployed: `0xfb5f69345ae3eac4dff2512e52e46739925fb2b3`
- ⏳ Sepolia presale: Deploy next
- 🎯 Base mainnet: Final deployment target

## Deployment Order

### 1. Complete Sepolia Testing
```bash
# Set Sepolia presale address after deployment
export NEXT_PUBLIC_SEPOLIA_PRESALE=0x<presale-address>
# Update .env.local with the address

# Switch to Sepolia
./scripts/switch-network.sh sepolia

# Test the presale
npm run dev
```

### 2. Deploy to Base Mainnet

#### Prerequisites
- Base RPC: `https://mainnet.base.org` (or use Alchemy Base endpoint)
- Base Chain ID: `8453`
- Basescan API key (for verification): https://basescan.org/myapikey

#### Deploy BBUX Token on Base
```bash
# Use your deployment script or Remix
# Token should be ERC-20 with:
# - Name: Beaver Bux
# - Symbol: BBUX
# - Decimals: 18
# - Supply: 1,000,000,000 (1 billion)

# Example with ethers:
node scripts/deploy-token.js --network base
```

#### Deploy Presale Contract on Base
```bash
# Deploy presale pointing to BBUX token
node scripts/deploy-presale.js --network base --token <base-token-address>

# Verify on Basescan
npx hardhat verify --network base <presale-address> <constructor-args>
```

#### Update Configuration
```bash
# Update .env.local
NEXT_PUBLIC_BASE_TOKEN=0x<your-base-token>
NEXT_PUBLIC_BASE_PRESALE=0x<your-base-presale>

# Switch to Base
./scripts/switch-network.sh base
```

### 3. Transfer Tokens to Presale
```bash
# Calculate amount to transfer (presale allocation)
# Example: 100M BBUX = 100000000 * 10^18

# Generate transfer calldata
node scripts/generate_safe_calldata.js <presale-address> \
  --amount 100000000 \
  --token <base-token-address>
```

## Network Configuration

### Sepolia (Current)
- Network: Sepolia Testnet
- Chain ID: 11155111
- Token: `0xfb5f69345ae3eac4dff2512e52e46739925fb2b3`
- Presale: (Deploy next)
- RPC: `https://eth-sepolia.g.alchemy.com/v2/<key>`
- Explorer: https://sepolia.etherscan.io

### Base (Target)
- Network: Base Mainnet
- Chain ID: 8453
- Token: (Deploy after Sepolia test)
- Presale: (Deploy after token)
- RPC: `https://mainnet.base.org` or `https://base-mainnet.g.alchemy.com/v2/<key>`
- Explorer: https://basescan.org
- Bridge from ETH: https://bridge.base.org

## Quick Commands

```bash
# Switch networks
./scripts/switch-network.sh sepolia   # Test on Sepolia
./scripts/switch-network.sh base      # Use Base mainnet
./scripts/switch-network.sh mainnet   # Back to ETH mainnet

# Update presale address after deployment
# Edit .env.local:
NEXT_PUBLIC_SEPOLIA_PRESALE=0x<address>  # For Sepolia
NEXT_PUBLIC_BASE_PRESALE=0x<address>     # For Base

# Restart dev server to apply changes
npm run dev
```

## Verification

After deploying to Base, verify contracts on Basescan:
```bash
# Verify token
npx hardhat verify --network base <token-address> \
  "Beaver Bux" "BBUX" 18 1000000000000000000000000000

# Verify presale (adjust constructor args based on your contract)
npx hardhat verify --network base <presale-address> \
  <token-address> <start-time> <end-time> <price>
```

## Important Notes

1. **Gas on Base**: Much cheaper than ETH mainnet (~1 gwei typical)
2. **Bridging**: Users will need to bridge ETH to Base via https://bridge.base.org
3. **Liquidity**: Plan to add DEX liquidity on Base (Uniswap V3 available)
4. **Faucets**: For Sepolia testing, use https://sepoliafaucet.com/

## Post-Deployment

After Base deployment:
1. Update website to point to Base network
2. Update WalletConnect to support Base (chain ID 8453)
3. Test presale purchases on Base testnet first (Base Sepolia)
4. Announce Base migration to community
5. Consider keeping ETH mainnet presale active alongside Base

## Rollback Plan

If issues arise on Base:
```bash
# Switch back to ETH mainnet
./scripts/switch-network.sh mainnet
npm run dev
```

The app supports multiple networks simultaneously via environment configuration.
