#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { ethers } = require('ethers')

// Usage:
// node scripts/generate_safe_calldata.js <recipient> [--claim=CLAIM_TOKEN] [--email=EMAIL]
// Example:
// node scripts/generate_safe_calldata.js 0xYourAddress --claim=bbux-claim-sara-0003

const DEFAULT_TOKEN = '0xa7372d8409805D0D3F0Eb774B9bC8b7975340682'
const DEFAULT_DECIMALS = 18

function usage() {
  console.log('Usage: node scripts/generate_safe_calldata.js <recipient> [--claim=CLAIM_TOKEN] [--email=EMAIL]')
  process.exit(1)
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.length === 0) usage()
  const recipient = argv[0]
  if (!recipient || !ethers.utils.isAddress(recipient)) {
    console.error('Invalid recipient address')
    usage()
  }

  const argMap = {}
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      argMap[k] = v || true
    }
  }

  const claimToken = argMap.claim || 'bbux-claim-sara-0003'
  const email = argMap.email || null

  const filePath = path.join(process.cwd(), 'data', 'payments.json')
  if (!fs.existsSync(filePath)) {
    console.error('data/payments.json not found')
    process.exit(1)
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  const arr = JSON.parse(raw)

  // Filter payments by claim token or email
  let matches = []
  if (claimToken) {
    matches = arr.filter(p => p.claim_token === claimToken)
  }
  if (matches.length === 0 && email) {
    matches = arr.filter(p => p.buyer_email && p.buyer_email.toLowerCase() === email.toLowerCase())
  }
  if (matches.length === 0) {
    console.error('No payments found for claim token or email')
    process.exit(1)
  }

  // Sum tokens
  let totalTokens = matches.reduce((s, p) => s + (Number(p.tokens) || 0), 0)

  console.log('Found', matches.length, 'payment(s). Total tokens (human):', totalTokens)

  const decimals = DEFAULT_DECIMALS
  const amountRaw = ethers.utils.parseUnits(totalTokens.toString(), decimals)

  // encode ERC-20 transfer calldata
  const iface = new ethers.utils.Interface(['function transfer(address to, uint256 amount) returns (bool)'])
  const data = iface.encodeFunctionData('transfer', [recipient, amountRaw])

  const tx = {
    to: DEFAULT_TOKEN,
    value: '0',
    data,
  }

  console.log('\nGnosis Safe transaction payload:')
  console.log(JSON.stringify(tx, null, 2))

  console.log('\nCalldata hex:')
  console.log(data)

  console.log('\nNotes:')
  console.log('- This payload calls ERC-20 transfer(to, amount) on the token contract.')
  console.log('- Paste `to`, `value`, and `data` into the Gnosis Safe "New Transaction" form (or use the Safe API).')
  console.log('- Verify the recipient address and token amount (human):', totalTokens)
  console.log('- For large amounts, require multisig approvals before executing.')
}

main().catch(e => { console.error(e); process.exit(1) })
