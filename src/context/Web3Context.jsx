import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { BOT_CHAIN_CONFIG, switchToBotChain } from '../config/botChain';
import { appKit } from '../config/wagmi';
import contractAddressConfig from '../config/contractAddress.json';
import openSlotArtifact from '../artifacts/OpenSlot.json';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegisteredBusiness, setIsRegisteredBusiness] = useState(false);
  const [contractAddress, setContractAddress] = useState(
    import.meta.env.VITE_CONTRACT_ADDRESS || contractAddressConfig.address
  );
  const [txStatus, setTxStatus] = useState({
    state: 'idle', // 'idle' | 'pending' | 'confirming' | 'success' | 'error'
    message: '',
    hash: '',
  });

  // Read-only provider pointing directly to BOT Chain Testnet
  const readProvider = useMemo(() => {
    return new ethers.JsonRpcProvider(BOT_CHAIN_CONFIG.rpcUrl, {
      chainId: BOT_CHAIN_CONFIG.chainId,
      name: BOT_CHAIN_CONFIG.name,
    });
  }, []);

  // Read-only contract instance
  const readContract = useMemo(() => {
    if (!contractAddress || !openSlotArtifact.abi) return null;
    return new ethers.Contract(contractAddress, openSlotArtifact.abi, readProvider);
  }, [contractAddress, readProvider]);

  // Signer & writable contract
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const isBotChain = chainId === BOT_CHAIN_CONFIG.chainId;

  // Update balance
  const updateBalance = useCallback(async (addr) => {
    if (!addr) return;
    try {
      const bal = await readProvider.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    }
  }, [readProvider]);

  // Check if wallet is a registered business on-chain
  const checkBusinessStatus = useCallback(async (addr) => {
    if (!addr || !readContract) {
      setIsRegisteredBusiness(false);
      return false;
    }
    try {
      const businessInfo = await readContract.businesses(addr);
      const isReg = businessInfo.isRegistered;
      setIsRegisteredBusiness(isReg);
      return isReg;
    } catch (err) {
      console.warn('Error checking business registration:', err);
      setIsRegisteredBusiness(false);
      return false;
    }
  }, [readContract]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      if (appKit && typeof appKit.open === 'function') {
        appKit.open();
        return;
      }
      alert('No Web3 wallet detected! Please install MetaMask or another EVM wallet.');
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (accounts.length > 0) {
        const userAccount = accounts[0];
        setAccount(userAccount);

        const network = await browserProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);

        // Auto prompt switch if not BOT Chain
        if (currentChainId !== BOT_CHAIN_CONFIG.chainId) {
          try {
            await switchToBotChain();
            const updatedNetwork = await browserProvider.getNetwork();
            setChainId(Number(updatedNetwork.chainId));
          } catch (switchErr) {
            console.warn('Could not switch to BOT Chain:', switchErr);
          }
        }

        const userSigner = await browserProvider.getSigner();
        setSigner(userSigner);

        if (contractAddress && openSlotArtifact.abi) {
          const userContract = new ethers.Contract(contractAddress, openSlotArtifact.abi, userSigner);
          setContract(userContract);
        }

        await updateBalance(userAccount);
        await checkBusinessStatus(userAccount);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [contractAddress, updateBalance, checkBusinessStatus]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setIsRegisteredBusiness(false);
    setBalance('0');
  }, []);

  // Switch network
  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchToBotChain();
      if (typeof window !== 'undefined' && window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (err) {
      alert(`Failed to switch network: ${err.message}`);
    }
  }, []);

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddr = accounts[0];
        setAccount(newAddr);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await browserProvider.getSigner();
        setSigner(newSigner);
        if (contractAddress && openSlotArtifact.abi) {
          setContract(new ethers.Contract(contractAddress, openSlotArtifact.abi, newSigner));
        }
        updateBalance(newAddr);
        checkBusinessStatus(newAddr);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto-detect if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then(async (accounts) => {
      if (accounts && accounts.length > 0) {
        const userAccount = accounts[0];
        setAccount(userAccount);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
        const userSigner = await browserProvider.getSigner();
        setSigner(userSigner);
        if (contractAddress && openSlotArtifact.abi) {
          setContract(new ethers.Contract(contractAddress, openSlotArtifact.abi, userSigner));
        }
        updateBalance(userAccount);
        checkBusinessStatus(userAccount);
      }
    }).catch(console.warn);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [contractAddress, disconnectWallet, updateBalance, checkBusinessStatus]);

  // Execute on-chain transaction helper
  const executeTransaction = useCallback(async (actionName, txPromiseCallback) => {
    if (!account) {
      throw new Error('Please connect your wallet first.');
    }
    if (!isBotChain) {
      await handleSwitchNetwork();
    }

    setTxStatus({
      state: 'pending',
      message: `Initiating ${actionName}... Please confirm in your wallet.`,
      hash: '',
    });

    try {
      const tx = await txPromiseCallback();
      setTxStatus({
        state: 'confirming',
        message: `Broadcasting ${actionName} to BOT Chain... Waiting for confirmation.`,
        hash: tx.hash,
      });

      const receipt = await tx.wait(1);

      setTxStatus({
        state: 'success',
        message: `${actionName} confirmed in block ${receipt.blockNumber}!`,
        hash: tx.hash,
      });

      // Refresh balance & business status
      updateBalance(account);
      checkBusinessStatus(account);

      return receipt;
    } catch (err) {
      console.error(`Transaction failed (${actionName}):`, err);
      const errMsg = err.reason || err.data?.message || err.shortMessage || err.message || 'Transaction failed.';
      setTxStatus({
        state: 'error',
        message: errMsg,
        hash: err.transaction?.hash || '',
      });
      throw err;
    }
  }, [account, isBotChain, handleSwitchNetwork, updateBalance, checkBusinessStatus]);

  const clearTxStatus = useCallback(() => {
    setTxStatus({ state: 'idle', message: '', hash: '' });
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isBotChain,
        balance,
        isConnecting,
        isRegisteredBusiness,
        contractAddress,
        setContractAddress,
        readProvider,
        readContract,
        signer,
        contract,
        connectWallet,
        openAppKitModal: () => appKit?.open?.(),
        disconnectWallet,
        switchNetwork: handleSwitchNetwork,
        checkBusinessStatus,
        executeTransaction,
        txStatus,
        clearTxStatus,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

