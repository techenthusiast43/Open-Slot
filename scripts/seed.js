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
  console.log('--- OpenSlot Testnet Demo Seeder ---');

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Please provide PRIVATE_KEY to seed testnet data:');
    console.error('  $env:PRIVATE_KEY="0x..."');
    console.error('  node scripts/seed.js');
    process.exit(1);
  }

  const configPath = path.join(rootDir, 'src', 'config', 'contractAddress.json');
  const artifactPath = path.join(rootDir, 'src', 'artifacts', 'OpenSlot.json');

  if (!fs.existsSync(configPath) || !fs.existsSync(artifactPath)) {
    console.error('Missing artifacts or contractAddress.json. Deploy the contract first!');
    process.exit(1);
  }

  const { address } = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const { abi } = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const provider = new ethers.JsonRpcProvider(BOT_CHAIN_RPC, {
    chainId: CHAIN_ID,
    name: 'BOT Chain Testnet',
  });

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Using Wallet: ${wallet.address}`);
  console.log(`Connecting to OpenSlot at: ${address}`);

  const contract = new ethers.Contract(address, abi, wallet);

  // 1. Register business
  console.log('\n[1/2] Registering demo business...');
  const businessMetadata = JSON.stringify({
    name: 'BOT Chain Advisory Labs',
    category: 'Tech Consulting & Audits',
    description: 'Premier smart contract auditing and Web3 infrastructure advisory on BOT Chain.',
    image: `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet.address}`,
    email: 'contact@botchainadvisory.io',
    website: 'https://botchain.ai',
  });

  const regTx = await contract.registerBusiness(businessMetadata);
  console.log(`Register tx broadcasted: ${regTx.hash}`);
  await regTx.wait(1);
  console.log('Business registered successfully!');

  // 2. Create batch appointment slots for tomorrow
  console.log('\n[2/2] Generating batch appointment slots for tomorrow...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const startTimes = [];
  const duration = 1800; // 30 minutes

  for (let i = 0; i < 6; i++) {
    const slotTime = new Date(tomorrow.getTime() + i * 3600 * 1000); // every 1 hour
    startTimes.push(Math.floor(slotTime.getTime() / 1000));
  }

  const batchTx = await contract.createBatchSlots(startTimes, duration);
  console.log(`Batch creation tx broadcasted: ${batchTx.hash}`);
  await batchTx.wait(1);
  console.log(`Successfully created ${startTimes.length} appointment slots on BOT Chain!`);

  console.log('\n--- Seeding Complete! ---');
  console.log(`View on Explorer: https://scan.bohr.life/address/${address}`);
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
