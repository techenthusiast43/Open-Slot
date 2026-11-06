import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

// 1. Define BOT Chain Testnet for Viem / Wagmi
export const botChainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: 'https://scan.bohr.life',
    },
  },
  contracts: {
    multicall3: {
      address: '0x47FA21f684bBAD707A53a0f9BE59F1422F46C265',
    },
  },
  testnet: true,
});

// 2. Project ID from Reown Cloud (use placeholder or user env)
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

export const networks = [botChainTestnet];

// 3. Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// 4. Initialize Reown AppKit metadata
export const metadata = {
  name: 'OpenSlot',
  description: 'Decentralized Appointment-Booking Platform on BOT Chain',
  url: 'https://openslot.app',
  icons: ['https://scan.bohr.life/assets/favicon.ico'],
};

// 5. Initialize AppKit
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botChainTestnet],
  defaultNetwork: botChainTestnet,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
});

