const { ethers } = require('ethers');

async function main(){
  const RPC = process.env.RPC_URL;
  if(!RPC){
    console.error('RPC_URL not set in env');
    process.exit(1);
  }
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const token = '0x7056daC6EEe25bd724b6254A661b946c1cC16E6d';
  const presale = '0xF479063E290E85e1470a11821128392F6063790B';
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
