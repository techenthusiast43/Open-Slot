import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const contractPath = path.join(rootDir, 'contracts', 'OpenSlot.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'OpenSlot.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode'],
      },
    },
  },
};

console.log('Compiling OpenSlot.sol with solc...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasErrors = false;
if (output.errors) {
  for (const err of output.errors) {
    if (err.severity === 'error') {
      console.error(err.formattedMessage);
      hasErrors = true;
    } else {
      console.warn(err.formattedMessage);
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

const contract = output.contracts['OpenSlot.sol']['OpenSlot'];
const abi = contract.abi;
const bytecode = contract.evm.bytecode.object;

const artifactsDir = path.join(rootDir, 'src', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const artifactData = {
  contractName: 'OpenSlot',
  abi,
  bytecode,
};

fs.writeFileSync(
  path.join(artifactsDir, 'OpenSlot.json'),
  JSON.stringify(artifactData, null, 2),
  'utf8'
);

console.log(`Successfully compiled OpenSlot.sol!`);
console.log(`Artifact saved to: ${path.join(artifactsDir, 'OpenSlot.json')}`);

