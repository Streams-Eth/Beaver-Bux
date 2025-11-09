const { ethers } = require('ethers');

async function main(){
  const RPC = process.env.RPC_URL;
  if(!RPC){
    console.error('RPC_URL not set in env');
    process.exit(1);
  }
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const token = '0xa7372d8409805D0D3F0Eb774B9bC8b7975340682';
  const presale = '0x45482E0858689E2dDd8F4bAEB95d4Fd5f292c564';
  const abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
  ];
  const c = new ethers.Contract(token, abi, provider);
  try{
    const [name, sym, dec, bal] = await Promise.all([
      c.name(), c.symbol(), c.decimals(), c.balanceOf(presale)
    ]);
    console.log('token:', token, name, sym, 'decimals:', dec.toString());
    console.log('presale:', presale);
    console.log('balance:', ethers.utils.formatUnits(bal, dec));
  }catch(e){
    console.error('error:', e.message || e);
    process.exit(1);
  }
}

main();
