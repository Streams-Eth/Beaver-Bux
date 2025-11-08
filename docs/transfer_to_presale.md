# Transfer BBUX tokens to the Presale contract

If you need to fund the Presale contract with BBUX (for example, transfer 300,000,000 BBUX), follow these steps.

Requirements
- Node.js installed
- `npm install` run in the project root (this will install `ethers`)
- Environment variables set:
  - ETHEREUM_RPC_URL — JSON-RPC endpoint (Infura/Alchemy or your node)
  - ADMIN_PRIVATE_KEY — private key of the wallet holding BBUX tokens

Script
Use the provided script `scripts/transfer_to_presale.js`.

Example (transfer 30,000,000 tokens):

```bash
export ETHEREUM_RPC_URL="https://polygon-mainnet.infura.io/v3/YOUR_KEY"
export ADMIN_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
node scripts/transfer_to_presale.js 0x7056daC6EEe25bd724b6254A661b946c1cC16E6d 0xF479063E290E85e1470a11821128392F6063790B 30000000
```

Notes
- The script reads token decimals from the token contract. If that call fails it assumes 18 decimals.
- This will transfer tokens from the admin key's account to the presale contract address. Make sure the admin wallet is funded with the token balance and enough native ETH for gas.
- For safety, consider testing on a testnet or smaller amount first.
