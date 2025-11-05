#!/usr/bin/env node
"use strict"
const { ethers } = require('ethers')
const fs = require('fs')

// Usage: node scripts/transfer_to_presale.js <tokenAddress> <toAddress> <amount>
// Example: node scripts/transfer_to_presale.js 0x7056... 0xF47906... 300000000

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: node scripts/transfer_to_presale.js <tokenAddress> <toAddress> <amount>')
    process.exit(1)
  }

  const [tokenAddress, toAddress, amountStr] = args
  const rpc = process.env.ETHEREUM_RPC_URL
  const pk = process.env.ADMIN_PRIVATE_KEY
  if (!rpc || !pk) {
    console.error('Please set ETHEREUM_RPC_URL and ADMIN_PRIVATE_KEY env vars')
    process.exit(1)
  }

  const provider = new ethers.providers.JsonRpcProvider(rpc)
  const wallet = new ethers.Wallet(pk, provider)

  const erc20 = new ethers.Contract(tokenAddress, [
    'function decimals() view returns (uint8)',
    'function transfer(address to, uint256 amount) returns (bool)'
  ], wallet)

  let decimals = 18
  try { decimals = await erc20.decimals() } catch (e) { console.warn('Failed to read decimals, defaulting to 18') }

  // parse amount (human) into units
  const amount = ethers.utils.parseUnits(amountStr, decimals)

  console.log(`Sending ${amountStr} tokens (units: ${amount.toString()}) to ${toAddress} from ${wallet.address} ...`)

  const tx = await erc20.transfer(toAddress, amount)
  console.log('Tx sent:', tx.hash)
  const receipt = await tx.wait(1)
  console.log('Tx confirmed:', receipt.transactionHash)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
