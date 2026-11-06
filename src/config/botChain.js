/**
 * Official BOT Chain Network Configuration
 */

export const BOT_CHAIN_CONFIG = {
  chainId: 968,
  chainIdHex: '0x3c8',
  name: 'BOT Chain Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  blockExplorerUrl: 'https://scan.bohr.life',
  faucetUrl: 'https://faucet.botchain.ai',
  multicall3: '0x47FA21f684bBAD707A53a0f9BE59F1422F46C265',
  totalSupply: '150 Million',
};

export const BOT_CHAIN_METAMASK_PARAMS = {
  chainId: '0x3c8',
  chainName: 'BOT Chain Testnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.bohr.life'],
  blockExplorerUrls: ['https://scan.bohr.life/'],
};

/**
 * Switch or add BOT Chain Testnet to user's wallet
 */
export async function switchToBotChain() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum wallet detected. Please install MetaMask.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BOT_CHAIN_METAMASK_PARAMS.chainId }],
    });
    return true;
  } catch (switchError) {
    // 4902 means the chain has not been added to MetaMask yet
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BOT_CHAIN_METAMASK_PARAMS],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add BOT Chain Testnet:', addError);
        throw addError;
      }
    }
    console.error('Failed to switch to BOT Chain Testnet:', switchError);
    throw switchError;
  }
}
