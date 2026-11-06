import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { resolveMetadata } from '../utils/metadata';
import { shortenAddress } from '../utils/format';
import { BOT_CHAIN_CONFIG } from '../config/botChain';
import { 
  Building2, 
  Search, 
  Compass, 
  Calendar, 
  ExternalLink, 
  ArrowRight, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Tech Consulting & Audits',
  'Healthcare & Wellness',
  'Legal & Advisory',
  'Creative & Design',
  'Financial Advisory',
  'Education & Coaching',
  'Beauty & Barber',
  'General Services',
];

export default function BrowseBusinessesPage({ setActivePage, setSelectedBusiness }) {
  const { readContract } = useWeb3();

  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadBusinesses = async () => {
    if (!readContract) return;
    setIsLoading(true);
    try {
      const addresses = await readContract.getAllRegisteredBusinesses();
      
      const loaded = await Promise.all(
        addresses.map(async (addr) => {
          try {
            const bInfo = await readContract.businesses(addr);
            const meta = await resolveMetadata(addr, bInfo.metadataURI);
            const slotIds = await readContract.getBusinessSlotIds(addr);
            return {
              address: addr,
              slotCount: slotIds.length,
              ...meta,
            };
          } catch (err) {
            console.warn(`Error resolving business ${addr}:`, err);
            return {
              address: addr,
              slotCount: 0,
              name: `Business ${shortenAddress(addr)}`,
              category: 'General Services',
              description: 'Registered OpenSlot Provider on BOT Chain.',
              image: `https://api.dicebear.com/7.x/identicon/svg?seed=${addr}`,
            };
          }
        })
      );

      setBusinesses(loaded);
    } catch (err) {
      console.warn('Failed to load businesses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [readContract]);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesCategory =
      selectedCategory === 'All' || (b.category && b.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch =
      searchTerm === '' ||
      (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>Verified On-Chain Providers</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Browse Businesses</h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover service providers on BOT Chain and reserve open appointments.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business name, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Business Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
          Loading registered businesses from BOT Chain...
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No businesses found</h3>
          <p className="text-xs text-slate-400 mb-6">
            {searchTerm || selectedCategory !== 'All'
              ? 'Try modifying your search or category filter.'
              : 'Be the first service provider to register on BOT Chain!'}
          </p>
          <button
            onClick={() => setActivePage('register')}
            className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white"
          >
            Register as a Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((b) => (
            <div
              key={b.address}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                {/* Header: Avatar, Name, Category */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={b.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${b.address}`}
                    alt={b.name}
                    className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 object-cover shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                      {b.name}
                    </h3>
                    <div className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-1">
                      {b.category || 'General Services'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                  {b.description || 'No description provided.'}
                </p>

                {/* On-Chain Address */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between mb-4 font-mono">
                  <span>{shortenAddress(b.address, 6)}</span>
                  <a
                    href={`${BOT_CHAIN_CONFIG.blockExplorerUrl}/address/${b.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1 font-sans text-[11px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>BOTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setSelectedBusiness(b.address);
                  setActivePage('available-slots');
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600"
              >
                <Calendar className="w-4 h-4" />
                <span>View Schedule & Book ({b.slotCount} slots)</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

