#!/usr/bin/env node
const { ethers } = require('ethers');
const fs = require('fs');

// Usage:
// Preview (default): node scripts/trace-bbux.js
// Full run: node scripts/trace-bbux.js --full
// Environment variables:
//   ETHERSCAN_API_KEY or ALCHEMY_API_KEY (recommended for full runs)
//   TOKEN (token contract address) - defaults to the provided BBUX contract
//   TARGET (address to summarize) - defaults to the sender address provided

const DEFAULT_TOKEN = '0xa7372d8409805D0D3F0Eb774B9bC8b7975340682';
const DEFAULT_TARGET = '0x356751e81EBD7234C966f0a755d983F667e43e8A';

async function main() {
  const args = process.argv.slice(2);
  const full = args.includes('--full');
  const token = (process.env.TOKEN || DEFAULT_TOKEN).trim();
  const target = (process.env.TARGET || DEFAULT_TARGET).toLowerCase().trim();

  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  const RPC_URL = process.env.RPC_URL;
  const useEtherscanApi = !!ETHERSCAN_API_KEY && !RPC_URL;

  // If the user asked for Etherscan usage (and provided an API key), prefer using
  // the Etherscan REST API which can return all ERC20 transfers for a specific
  // address+contract efficiently (paging supported). This avoids heavy getLogs
  // scanning and is ideal when tracing a single account.

  // Prefer an explicit JSON-RPC URL if provided (e.g. QuickNode/Alchemy RPC URL).
  // This avoids provider-specific rate limits and is the most reliable for getLogs.
  let provider;
  if (RPC_URL) {
    console.log('Using JSON-RPC provider from RPC_URL');
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  } else {
    const useEtherscanApi = !!ETHERSCAN_API_KEY;
    if (useEtherscanApi) {
      // Use authenticated EtherscanProvider so metadata and block calls succeed.
      provider = new ethers.providers.EtherscanProvider('homestead', ETHERSCAN_API_KEY);
    } else {
      if (ALCHEMY_API_KEY) {
        provider = new ethers.providers.AlchemyProvider('homestead', ALCHEMY_API_KEY);
      } else if (ETHERSCAN_API_KEY) {
        provider = new ethers.providers.EtherscanProvider('homestead', ETHERSCAN_API_KEY);
      } else {
        console.warn('No provider API key detected (ALCHEMY_API_KEY or ETHERSCAN_API_KEY or RPC_URL). Falling back to default provider which may be rate-limited. For full history, set an API key or RPC_URL.');
        provider = ethers.getDefaultProvider('homestead');
      }
    }
  }

  // Ensure provider is defined for metadata calls / fallback behaviour.
  if (!provider) {
    provider = ethers.getDefaultProvider('homestead');
  }

  const iface = new ethers.utils.Interface([
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ]);

  console.log('Token:', token);
  let name = 'unknown', symbol = 'unknown', decimals = 18;
  let latest = null;

  if (!useEtherscanApi) {
    // only instantiate contract and call the provider when not using Etherscan REST fast-path
    const tokenContract = new ethers.Contract(token, [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ], provider);
    try {
      name = await tokenContract.name();
      symbol = await tokenContract.symbol();
      decimals = await tokenContract.decimals();
    } catch (e) {
      console.warn('Could not read token metadata:', e.message || e);
    }
    try {
      latest = await provider.getBlockNumber();
      console.log('Latest block:', latest);
    } catch (e) {
      console.warn('Could not fetch latest block (provider):', e.message || e);
      latest = null;
    }
    console.log(`Token metadata: ${name} (${symbol}), decimals=${decimals}`);
  } else {
    console.log('Using Etherscan REST fast-path; token metadata will be inferred from transfer records if present.');
  }

  // Build topic for Transfer
  const transferTopic = ethers.utils.id('Transfer(address,address,uint256)');

  // Preview mode scans just the last N blocks (default 10k). Full mode scans from block 0 in chunks.
  const previewBlocks = 10000;
  const chunkSize = 20000; // blocks per chunk for getLogs

  const results = {
    totalLogs: 0,
    transfers: [],
    summary: {
      sentCount: 0,
      receivedCount: 0,
      sentAmount: ethers.BigNumber.from(0),
      receivedAmount: ethers.BigNumber.from(0),
    }
  };

  // If ETHERSCAN_API_KEY is present, use Etherscan's token transfer API to fetch
  // all transfers for this address + token. This is much faster and paginates.
  if (useEtherscanApi) {
    console.log('ETHERSCAN_API_KEY detected — using Etherscan API for transfers (fast path).');
    const fetchPage = (page = 1, offset = 10000) => {
      return new Promise((resolve, reject) => {
        const https = require('https');
        const q = `module=account&action=tokentx&contractaddress=${token}&address=${target}&page=${page}&offset=${offset}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
        const url = `https://api.etherscan.io/api?${q}`;
        https.get(url, (res) => {
          let raw = '';
          res.on('data', (chunk) => raw += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.status === '0' && parsed.message === 'No transactions found') return resolve([]);
              if (parsed.status === '0' && parsed.message !== 'OK') return reject(new Error(parsed.result || parsed.message || 'Etherscan error'));
              resolve(parsed.result || []);
            } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
    };

    let page = 1;
    const offset = 10000;
    while (true) {
      console.log(`Fetching Etherscan tokentx page ${page}...`);
      let txs;
      try {
        txs = await fetchPage(page, offset);
      } catch (err) {
        console.error('Etherscan API error:', err.message || err);
        break;
      }
      if (!txs || txs.length === 0) break;
      for (const t of txs) {
        // each t has: from, to, value (string), tokenDecimal
        const value = ethers.BigNumber.from(t.value);
        results.totalLogs += 1;
        if (t.from.toLowerCase() === target) {
          results.summary.sentCount += 1;
          results.summary.sentAmount = results.summary.sentAmount.add(value);
        }
        if (t.to.toLowerCase() === target) {
          results.summary.receivedCount += 1;
          results.summary.receivedAmount = results.summary.receivedAmount.add(value);
        }
      }
      if (txs.length < offset) break;
      page += 1;
    }

  } else {
    if (!full) {
      const from = Math.max(0, latest - previewBlocks);
      const to = latest;
      console.log(`Preview mode: fetching Transfer logs from ${from} to ${to} (token address filtered)`);
      const logs = await provider.getLogs({ address: token, fromBlock: from, toBlock: to, topics: [transferTopic] });
      console.log('Logs fetched:', logs.length);
      for (const log of logs) {
        const parsed = iface.parseLog(log);
        const { from, to, value } = parsed.args;
        results.totalLogs += 1;
        if (from.toLowerCase() === target) {
          results.summary.sentCount += 1;
          results.summary.sentAmount = results.summary.sentAmount.add(value);
        }
        if (to.toLowerCase() === target) {
          results.summary.receivedCount += 1;
          results.summary.receivedAmount = results.summary.receivedAmount.add(value);
        }
      }
    } else {
      // Full scan: chunk across blocks from 0 to latest
      console.log('Full mode: scanning entire chain in chunks. This can take a long time and may be rate limited. Use an API key for reliability.');
      let from = 0;
      // allow dynamic chunk size reduction on providers that limit range (e.g. Alchemy free tier)
      let currentChunkSize = chunkSize;
      while (from <= latest) {
        const to = Math.min(latest, from + currentChunkSize - 1);
        process.stdout.write(`Fetching logs ${from}..${to} ... `);
        try {
          const logs = await provider.getLogs({ address: token, fromBlock: from, toBlock: to, topics: [transferTopic] });
          console.log(logs.length);
          for (const log of logs) {
            const parsed = iface.parseLog(log);
            const { from: f, to: t, value } = parsed.args;
            results.totalLogs += 1;
            if (f.toLowerCase() === target) {
              results.summary.sentCount += 1;
              results.summary.sentAmount = results.summary.sentAmount.add(value);
            }
            if (t.toLowerCase() === target) {
              results.summary.receivedCount += 1;
              results.summary.receivedAmount = results.summary.receivedAmount.add(value);
            }
          }
          // successful chunk, optionally increase chunk size for next iteration up to original chunkSize
          if (currentChunkSize < chunkSize) {
            currentChunkSize = Math.min(chunkSize, currentChunkSize * 2);
          }
          from = to + 1;
        } catch (err) {
          console.error('\nError fetching logs for chunk', from, to, err.message || err);
          console.error('You may need to add an ETHERSCAN_API_KEY/ALCHEMY_API_KEY or reduce chunk size.');
          // If provider complains about block range (e.g. Alchemy free tier), reduce chunk size and retry the same range.
          if (currentChunkSize > 10) {
            currentChunkSize = 10;
            console.log('Lowering chunk size to', currentChunkSize, 'and retrying chunk...');
            continue; // retry same from..to with smaller range
          } else if (currentChunkSize > 1) {
            currentChunkSize = 1;
            console.log('Lowering chunk size to 1 and retrying...');
            continue;
          } else {
            console.log('Unable to fetch logs for this chunk; skipping to next to avoid infinite loop.');
            from = to + 1;
          }
        }
      }
    }
  }

  // Print summary
  const format = (bn) => {
    try {
      return ethers.utils.formatUnits(bn, decimals);
    } catch { return bn.toString(); }
  };

  console.log('\nSummary for target', target);
  console.log('Total Transfer logs scanned (token):', results.totalLogs);
  console.log('Sent: ', results.summary.sentCount, 'amount:', format(results.summary.sentAmount));
  console.log('Received: ', results.summary.receivedCount, 'amount:', format(results.summary.receivedAmount));
  const net = results.summary.receivedAmount.sub(results.summary.sentAmount);
  console.log('Net (received - sent):', format(net));

  // Save to file in case of long runs
  const out = {
    token, name, symbol, decimals, target, latest, summary: {
      totalLogs: results.totalLogs,
      sentCount: results.summary.sentCount,
      receivedCount: results.summary.receivedCount,
      sentAmount: results.summary.sentAmount.toString(),
      receivedAmount: results.summary.receivedAmount.toString(),
      net: net.toString()
    }
  };
  const outPath = `./data/trace-bbux-${Date.now()}.json`;
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Saved summary to', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
