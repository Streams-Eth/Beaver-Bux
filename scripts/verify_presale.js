const { ethers } = require('ethers');

const RPC = process.env.ETHEREUM_RPC_URL;
if (!RPC) {
  console.error('ETHEREUM_RPC_URL is not set in the environment. Export it and re-run.');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);

// normalize / checksum addresses to avoid "bad address checksum" errors
const tokenAddress = ethers.utils.getAddress('0x463ac39bE0acBF27BfBB7F7bF00829e708E2c5d1');
const presaleAddress = ethers.utils.getAddress('0x45482E0858689E2dDd8F4bAEB95d4Fd5f292c564');
const fundingTx = '0x263bc9870a3263c97096b564794d9069c87172bc935b812d20407affd446e508';

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

async function main() {
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    console.log('Fetching token.decimals()...');
    const decimals = await token.decimals();
    console.log('decimals:', decimals.toString());

    console.log('\nFetching presale balance...');
    const rawBalance = await token.balanceOf(presaleAddress);
    const human = ethers.utils.formatUnits(rawBalance, decimals);
    console.log('presale raw balance:', rawBalance.toString());
    console.log('presale balance (human):', human);

    console.log('\nFetching transaction details for', fundingTx);
    const tx = await provider.getTransaction(fundingTx);
    const receipt = await provider.getTransactionReceipt(fundingTx);

    if (!tx) {
      console.log('Transaction not found on node (null).');
    } else {
      console.log('tx.hash:', tx.hash);
      console.log('tx.from:', tx.from);
      console.log('tx.to:', tx.to);
      console.log('tx.blockNumber:', tx.blockNumber);
      console.log('tx.confirmations:', tx.confirmations);
      console.log('tx.value (wei):', tx.value.toString());
    }

    if (!receipt) {
      console.log('No receipt found for transaction.');
    } else {
      console.log('\nreceipt.status:', receipt.status);
      console.log('receipt.blockNumber:', receipt.blockNumber);
      console.log('receipt.logs.length:', receipt.logs.length);

      const iface = new ethers.utils.Interface(ERC20_ABI);
      const transfers = [];
      for (const log of receipt.logs) {
        // Try to parse logs for token's Transfer event
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'Transfer') {
            transfers.push({
              address: log.address,
              from: parsed.args.from,
              to: parsed.args.to,
              value: parsed.args.value.toString(),
            });
          }
        } catch (e) {
          // ignore
        }
      }

      if (transfers.length) {
        console.log('\nDecoded Transfer events in this tx:');
        for (const t of transfers) {
          let humanVal = t.value;
          try {
            humanVal = ethers.utils.formatUnits(t.value, decimals);
          } catch (e) {}
          console.log(`- token: ${t.address} | from: ${t.from} -> to: ${t.to} | value: ${t.value} (${humanVal})`);
        }
      } else {
        console.log('\nNo ERC20 Transfer events decoded with the simple ABI.');
      }

      console.log('\nFull receipt (summary):');
      console.log({
        transactionHash: receipt.transactionHash,
        status: receipt.status,
        gasUsed: receipt.gasUsed && receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice && receipt.effectiveGasPrice.toString(),
        logs: receipt.logs.length,
      });
    }

  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(2);
  }
}

main();
