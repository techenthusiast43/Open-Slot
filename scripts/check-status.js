import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Auto-load .env
try {
  process.loadEnvFile();
} catch (e) {}

const BOT_CHAIN_RPC = process.env.RPC_URL || 'https://rpc.bohr.life';
const CHAIN_ID = 968;

const STATUS_NAMES = ['Available', 'Booked', 'Confirmed', 'Cancelled'];

async function main() {
  console.log('==================================================');
  console.log('       OpenSlot On-Chain Testnet Status');
  console.log('==================================================');

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

  const blockNumber = await provider.getBlockNumber();
  console.log(`RPC Endpoint:    ${BOT_CHAIN_RPC}`);
  console.log(`Current Block:   ${blockNumber}`);
  console.log(`Contract:        ${address}`);
  console.log(`Explorer:        https://scan.bohr.life/address/${address}\n`);

  const contract = new ethers.Contract(address, abi, provider);

  // 1. Registered Businesses
  const businessCount = await contract.getRegisteredBusinessesCount();
  console.log(`[Registered Businesses]: ${businessCount}`);

  const businesses = await contract.getAllRegisteredBusinesses();
  for (let i = 0; i < businesses.length; i++) {
    const bAddr = businesses[i];
    const bInfo = await contract.businesses(bAddr);
    const slotIds = await contract.getBusinessSlotIds(bAddr);
    let name = 'Unnamed';
    try {
      const parsed = JSON.parse(bInfo.metadataURI);
      name = parsed.name || 'Unnamed';
    } catch (e) {}

    console.log(`  #${i + 1} ${name}`);
    console.log(`     Address:    ${bAddr}`);
    console.log(`     Slots:      ${slotIds.length} slot(s) published`);
  }

  // 2. Slots
  const nextSlotId = await contract.nextSlotId();
  const totalSlots = Number(nextSlotId) - 1;
  console.log(`\n[Total Published Slots]: ${totalSlots}`);

  if (totalSlots > 0) {
    const slotIdsToQuery = Array.from({ length: totalSlots }, (_, i) => BigInt(i + 1));
    const batch = await contract.getSlotsBatch(slotIdsToQuery);

    console.log('\n--- Slot Summary Table ---');
    batch.forEach((s, idx) => {
      const id = idx + 1;
      const status = STATUS_NAMES[Number(s.status)] || 'Unknown';
      const startDate = new Date(Number(s.startTime) * 1000);
      const isPast = startDate.getTime() < Date.now();
      const durationMins = Math.floor(Number(s.duration) / 60);

      console.log(
        `  Slot #${id}: [${status}${isPast && status === 'Available' ? ' (Expired)' : ''}] ` +
        `Time: ${startDate.toLocaleString()} (${durationMins}m) | Customer: ${s.customer === ethers.ZeroAddress ? 'None' : s.customer.slice(0, 8) + '...'}`
      );
    });
  }

  console.log('\n==================================================');
}

main().catch((err) => {
  console.error('Error fetching on-chain status:', err);
  process.exit(1);
});
