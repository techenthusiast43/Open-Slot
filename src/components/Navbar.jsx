import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Calendar, 
  Wallet, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  ChevronDown, 
  LogOut, 
  Settings, 
  PlusCircle, 
  Compass,
  Check
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const {
    account,
    chainId,
    isBotChain,
    balance,
    isConnecting,
    isRegisteredBusiness,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    contractAddress,
    setContractAddress,
  } = useWeb3();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);

  const handleSaveContractAddress = (e) => {
    e.preventDefault();
    if (tempAddress && tempAddress.startsWith('0x') && tempAddress.length === 42) {
      setContractAddress(tempAddress);
      setShowSettingsModal(false);
    } else {
      alert('Invalid contract address format. Must be a 42-character 0x hex address.');
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => setActivePage('landing')}
                className="flex items-center gap-2.5 group focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    OpenSlot
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/80 -mt-1">
                    BOT Chain dApp
                  </span>
                </div>
              </button>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setActivePage('businesses')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activePage === 'businesses'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Browse Businesses
                </button>

                <button
                  onClick={() => setActivePage('my-bookings')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activePage === 'my-bookings'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  My Bookings
                </button>

                <button
                  onClick={() => setActivePage(isRegisteredBusiness ? 'dashboard' : 'register')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activePage === 'dashboard' || activePage === 'register' || activePage === 'create-slot'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {isRegisteredBusiness ? 'Business Hub' : 'List Business'}
                </button>
              </div>
            </div>

            {/* Right: Network & Wallet */}
            <div className="flex items-center gap-3">
              {/* Network Status Pill */}
              {account ? (
                isBotChain ? (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>BOT Testnet</span>
                  </div>
                ) : (
                  <button
                    onClick={switchNetwork}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors animate-bounce"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Switch to BOT Chain (968)</span>
                  </button>
                )
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Chain ID: 968</span>
                </div>
              )}

              {/* Wallet Button */}
              {account ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-sm font-medium transition-all shadow-sm"
                  >
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-slate-400">{balance} BOT</span>
                      <span className="font-semibold">{shortenAddress(account)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-800 text-xs">
                        <div className="text-slate-400">Connected Wallet</div>
                        <div className="font-mono text-slate-200 truncate mt-0.5">{account}</div>
                        {isRegisteredBusiness && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Registered Business
                          </div>
                        )}
                      </div>

                      {isRegisteredBusiness ? (
                        <>
                          <button
                            onClick={() => {
                              setActivePage('dashboard');
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4 text-blue-400" />
                            Business Dashboard
                          </button>
                          <button
                            onClick={() => {
                              setActivePage('create-slot');
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                          >
                            <PlusCircle className="w-4 h-4 text-indigo-400" />
                            Create New Slots
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setActivePage('register');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          Register as Business
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActivePage('my-bookings');
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4 text-amber-400" />
                        Customer Bookings
                      </button>

                      <button
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Contract Settings
                      </button>

                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            disconnectWallet();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Submenu Bar */}
        <div className="flex md:hidden border-t border-slate-800/60 bg-slate-900/60 px-4 py-2 overflow-x-auto gap-2">
          <button
            onClick={() => setActivePage('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activePage === 'landing' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActivePage('businesses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activePage === 'businesses' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActivePage('my-bookings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activePage === 'my-bookings' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActivePage(isRegisteredBusiness ? 'dashboard' : 'register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activePage === 'dashboard' || activePage === 'register' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            {isRegisteredBusiness ? 'Business' : 'Register'}
          </button>
        </div>
      </nav>

      {/* Contract Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">OpenSlot Contract Configuration</h3>
            <p className="text-xs text-slate-400 mb-4">
              View or update the deployed OpenSlot smart contract address pointing to BOT Chain Testnet (Chain ID 968).
            </p>

            <form onSubmit={handleSaveContractAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contract Address (EVM 0x)
                </label>
                <input
                  type="text"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div><span className="font-semibold text-slate-300">RPC Endpoint:</span> {BOT_CHAIN_CONFIG.rpcUrl}</div>
                <div><span className="font-semibold text-slate-300">Testnet Chain ID:</span> {BOT_CHAIN_CONFIG.chainId} ({BOT_CHAIN_CONFIG.chainIdHex})</div>
                <div>
                  <a
                    href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${contractAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    View active contract on BOTScan &rarr;
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

