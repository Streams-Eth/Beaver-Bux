const ethers = require('ethers');

const PRESALE_ADDRESS = '0xb536cdfe594ab79569c8fd2055ff11db8566fc10';
const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/qSihHc_yL9QSYQ_Jwtdyq');

// Full presale ABI with common functions
const presaleABI = [
  'function owner() view returns (address)',
  'function stages(uint256) view returns (uint256 start, uint256 end, uint256 pricePerToken, uint256 allocation, uint256 sold)',
  'function getCurrentStage() view returns (uint256)',
  'function isPresaleActive() view returns (bool)',
  'function startPresale(uint256 stageIndex)',
  'function pausePresale()',
  'function resumePresale()',
  'function setStage(uint256 index, uint256 start, uint256 end, uint256 price, uint256 allocation)',
];

async function checkPresale() {
  const presale = new ethers.Contract(PRESALE_ADDRESS, presaleABI, provider);
  
  console.log('=== Presale Contract Status ===\n');
  console.log('Address:', PRESALE_ADDRESS);
  
  try {
    const owner = await presale.owner();
    console.log('Owner:', owner);
  } catch (e) {
    console.log('Owner: Could not fetch');
  }
  
  // Check if presale is active
  try {
    const isActive = await presale.isPresaleActive();
    console.log('Active:', isActive);
  } catch (e) {
    console.log('Active: Function not available');
  }
  
  // Check current stage
  try {
    const currentStage = await presale.getCurrentStage();
    console.log('Current Stage:', currentStage.toString());
  } catch (e) {
    console.log('Current Stage: Function not available');
  }
  
  // Check stages
  console.log('\n=== Stages ===');
  for (let i = 0; i < 5; i++) {
    try {
      const stage = await presale.stages(i);
      const now = Math.floor(Date.now() / 1000);
      const isActive = stage.start > 0 && now >= stage.start && now <= stage.end;
      
      console.log(`\nStage ${i}:`);
      console.log('  Start:', stage.start.toString(), stage.start > 0 ? `(${new Date(stage.start * 1000).toISOString()})` : '(not set)');
      console.log('  End:', stage.end.toString(), stage.end > 0 ? `(${new Date(stage.end * 1000).toISOString()})` : '(not set)');
      console.log('  Price:', ethers.utils.formatEther(stage.pricePerToken), 'ETH per token');
      console.log('  Allocation:', ethers.utils.formatEther(stage.allocation), 'BBUX');
      console.log('  Sold:', ethers.utils.formatEther(stage.sold), 'BBUX');
      console.log('  Active NOW:', isActive);
      
      if (stage.start.eq(0)) break; // No more stages configured
    } catch (e) {
      break;
    }
  }
  
  console.log('\n=== Actions Required ===');
  console.log('The presale needs to be activated by the owner.');
  console.log('Check Etherscan Write Contract tab:');
  console.log('https://sepolia.etherscan.io/address/' + PRESALE_ADDRESS + '#writeContract');
  console.log('\nLook for functions like:');
  console.log('  - startPresale(stageIndex)');
  console.log('  - setStage(index, start, end, price, allocation)');
  console.log('  - activatePresale()');
}

checkPresale().catch(console.error);
