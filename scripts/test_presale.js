const ethers = require('ethers');

const PRESALE_ADDRESS = '0xb536cdfe594ab79569c8fd2055ff11db8566fc10';
const TOKEN_ADDRESS = '0xfb5f69345ae3eac4dff2512e52e46739925fb2b3';
const BUYER_ADDRESS = '0xAB55b59566266D3e27e5d619ed8276b034edaf97';

const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/qSihHc_yL9QSYQ_Jwtdyq');

async function testPresale() {
  console.log('=== Presale Contract Diagnosis ===\n');
  
  // Check if contract exists
  const code = await provider.getCode(PRESALE_ADDRESS);
  console.log('Contract deployed:', code !== '0x');
  
  if (code === '0x') {
    console.log('ERROR: No contract at this address!');
    return;
  }
  
  // Check token balance
  const tokenABI = ['function balanceOf(address) view returns (uint256)'];
  const token = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);
  const balance = await token.balanceOf(PRESALE_ADDRESS);
  console.log('Presale BBUX balance:', ethers.utils.formatEther(balance), 'BBUX');
  
  if (balance.isZero()) {
    console.log('ERROR: Presale has no tokens!');
    return;
  }
  
  console.log('\nTesting purchase methods...\n');
  
  // Test 1: Direct ETH transfer (receive/fallback)
  try {
    await provider.call({
      to: PRESALE_ADDRESS,
      value: ethers.utils.parseEther('0.01'),
      from: BUYER_ADDRESS
    });
    console.log('✓ Direct ETH transfer works (has receive/fallback)');
  } catch (e) {
    console.log('✗ Direct ETH transfer failed:', e.reason || e.code);
  }
  
  // Test 2: buyTokens() function
  const buyTokensABI = ['function buyTokens() payable'];
  const iface = new ethers.utils.Interface(buyTokensABI);
  try {
    await provider.call({
      to: PRESALE_ADDRESS,
      value: ethers.utils.parseEther('0.01'),
      data: iface.encodeFunctionData('buyTokens', []),
      from: BUYER_ADDRESS
    });
    console.log('✓ buyTokens() function works');
  } catch (e) {
    console.log('✗ buyTokens() failed:', e.reason || e.code);
  }
  
  // Test 3: buy() function
  const buyABI = ['function buy() payable'];
  const iface2 = new ethers.utils.Interface(buyABI);
  try {
    await provider.call({
      to: PRESALE_ADDRESS,
      value: ethers.utils.parseEther('0.01'),
      data: iface2.encodeFunctionData('buy', []),
      from: BUYER_ADDRESS
    });
    console.log('✓ buy() function works');
  } catch (e) {
    console.log('✗ buy() failed:', e.reason || e.code);
  }
  
  console.log('\n=== Recommendation ===');
  console.log('Check the "Write Contract" tab on Etherscan to see available payable functions:');
  console.log('https://sepolia.etherscan.io/address/' + PRESALE_ADDRESS + '#writeContract');
}

testPresale().catch(console.error);
