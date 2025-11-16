#!/bin/bash
# Switch between networks (sepolia, base, mainnet)
# Usage: ./scripts/switch-network.sh <network>

NETWORK=${1:-sepolia}

case $NETWORK in
  sepolia)
    echo "Switching to Sepolia testnet..."
    sed -i 's/^NEXT_PUBLIC_NETWORK=.*/NEXT_PUBLIC_NETWORK=sepolia/' .env.local
    echo "✓ Network set to sepolia"
    echo "Token: $(grep NEXT_PUBLIC_SEPOLIA_TOKEN .env.local | cut -d'=' -f2)"
    echo "Presale: $(grep NEXT_PUBLIC_SEPOLIA_PRESALE .env.local | cut -d'=' -f2)"
    ;;
  base)
    echo "Switching to Base mainnet..."
    sed -i 's/^NEXT_PUBLIC_NETWORK=.*/NEXT_PUBLIC_NETWORK=base/' .env.local
    echo "✓ Network set to base"
    echo "Token: $(grep NEXT_PUBLIC_BASE_TOKEN .env.local | cut -d'=' -f2)"
    echo "Presale: $(grep NEXT_PUBLIC_BASE_PRESALE .env.local | cut -d'=' -f2)"
    ;;
  mainnet|eth)
    echo "Switching to Ethereum mainnet..."
    sed -i 's/^NEXT_PUBLIC_NETWORK=.*/NEXT_PUBLIC_NETWORK=mainnet/' .env.local
    echo "✓ Network set to mainnet"
    echo "Token: $(grep NEXT_PUBLIC_ETH_TOKEN .env.local | cut -d'=' -f2)"
    echo "Presale: $(grep NEXT_PUBLIC_ETH_PRESALE .env.local | cut -d'=' -f2)"
    ;;
  *)
    echo "Unknown network: $NETWORK"
    echo "Usage: $0 {sepolia|base|mainnet}"
    exit 1
    ;;
esac

echo ""
echo "Remember to restart the dev server for changes to take effect:"
echo "  npm run dev"
