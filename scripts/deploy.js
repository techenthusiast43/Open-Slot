import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';

// Auto-load .env file if available
try {
  process.loadEnvFile();
} catch (e) {
  // If .env does not exist or already loaded
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BOT_CHAIN_RPC = process.env.RPC_URL || 'https://rpc.bohr.life';
const CHAIN_ID = 968;

async function main() {
  console.log('--- OpenSlot BOT Chain Testnet Deployer ---');
  console.log(`RPC Endpoint: ${BOT_CHAIN_RPC}`);
  console.log(`Chain ID: ${CHAIN_ID}`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('\n[ERROR] PRIVATE_KEY environment variable is not set!');
    console.error('Please set PRIVATE_KEY in your environment or .env file.');
    console.error('Example (PowerShell):');
    console.error('  $env:PRIVATE_KEY="0x..."');
    console.error('  node scripts/deploy.js');
    console.error('\nYou can fund your testnet wallet at https://faucet.botchain.ai');
    process.exit(1);
  }

  const artifactPath = path.join(rootDir, 'src', 'artifacts', 'OpenSlot.json');
  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found at ${artifactPath}. Run 'npm run compile' first!`);
    process.exit(1);
  }

  const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(BOT_CHAIN_RPC, {
    chainId: CHAIN_ID,
    name: 'BOT Chain Testnet',
  });

  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);

  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} BOT`);

  if (balance === 0n) {
    console.error('\n[ERROR] Account balance is 0 BOT! Fund your wallet with testnet tokens at:');
    console.error('  https://faucet.botchain.ai');
    process.exit(1);
  }

  console.log('\nDeploying OpenSlot contract...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();

  console.log(`Deployment transaction broadcasted: ${contract.deploymentTransaction()?.hash}`);
  console.log('Waiting for confirmation on BOT Chain...');

  await contract.waitForDeployment();
  const deployedAddress = await contract.getAddress();

  console.log('\n======================================================');
  console.log(`OpenSlot deployed successfully to: ${deployedAddress}`);
  console.log(`View on Explorer: https://scan.bohr.life/address/${deployedAddress}`);
  console.log('======================================================\n');

  // Save address for frontend
  const configDir = path.join(rootDir, 'src', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const addressConfig = {
    address: deployedAddress,
    chainId: CHAIN_ID,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://scan.bohr.life/address/${deployedAddress}`,
  };

  fs.writeFileSync(
    path.join(configDir, 'contractAddress.json'),
    JSON.stringify(addressConfig, null, 2),
    'utf8'
  );

  console.log(`Contract address saved to: ${path.join(configDir, 'contractAddress.json')}`);
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});

