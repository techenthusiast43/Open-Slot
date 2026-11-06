import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { saveLocalMetadata, getLocalMetadata } from '../utils/metadata';
import { Building2, Sparkles, Check, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Tech Consulting & Audits',
  'Healthcare & Wellness',
  'Legal & Advisory',
  'Creative & Design',
  'Financial Advisory',
  'Education & Coaching',
  'Beauty & Barber',
  'General Services',
];

export default function BusinessRegistrationPage({ setActivePage }) {
  const {
    account,
    contract,
    isBotChain,
    connectWallet,
    switchNetwork,
    executeTransaction,
    isRegisteredBusiness,
    readContract,
    checkBusinessStatus,
  } = useWeb3();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(account || 'openslot');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate avatar if account changes
  useEffect(() => {
    if (account) {
      setAvatarSeed(account);
      // Pre-fill if already cached or registered
      const cached = getLocalMetadata(account);
      if (cached) {
        setName(cached.name || '');
        setCategory(cached.category || CATEGORIES[0]);
        setDescription(cached.description || '');
        setEmail(cached.email || '');
        setWebsite(cached.website || '');
        if (cached.image && !cached.image.includes('dicebear')) {
          setCustomAvatarUrl(cached.image);
        }
      }
    }
  }, [account]);

  const activeAvatar = customAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!account) {
      await connectWallet();
      return;
    }

    if (!isBotChain) {
      await switchNetwork();
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter your business name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const metadataObject = {
        name: name.trim(),
        category,
        description: description.trim(),
        email: email.trim(),
        website: website.trim(),
        image: activeAvatar,
        updatedAt: new Date().toISOString(),
      };

      // Save off-chain first
      saveLocalMetadata(account, metadataObject);

      // JSON encoded string as metadataURI (stored off-chain or lightweight on-chain pointer)
      const metadataURI = JSON.stringify(metadataObject);

      // Call on-chain registerBusiness
      await executeTransaction('Register Business', async () => {
        return await contract.registerBusiness(metadataURI);
      });

      await checkBusinessStatus(account);
      setActivePage('dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage(err.reason || err.message || 'Registration transaction failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isRegisteredBusiness ? 'Update Business Profile' : 'Register Your Business'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Publish your appointment services on BOT Chain. Descriptions and media remain off-chain for zero gas waste.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar / Profile Image */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Business Avatar / Branding
            </label>
            <div className="flex items-center gap-4">
              <img
                src={activeAvatar}
                alt="Business Preview"
                className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 object-cover shadow-inner"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  placeholder="Custom image URL (optional)"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAvatarUrl('');
                      setAvatarSeed(Math.random().toString(36).substring(7));
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Randomize Identicon</span>
                  </button>
                  <span className="text-[11px] text-slate-500">Stored off-chain</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Web3 Advisory, Dr. Miller Clinic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Category / Industry *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Description & Services (Off-Chain)
            </label>
            <textarea
              rows={4}
              placeholder="Describe your appointment offerings, what clients should prepare, or service details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                placeholder="contact@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Website / Social URL
              </label>
              <input
                type="url"
                placeholder="https://business.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Connected Wallet Info */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Registering with Connected Wallet:</span>
            <span className="font-mono text-blue-400 font-semibold">
              {account ? account : 'Wallet Not Connected'}
            </span>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            {!account ? (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all"
              >
                Connect Wallet to Register
              </button>
            ) : !isBotChain ? (
              <button
                type="button"
                onClick={switchNetwork}
                className="w-full py-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white transition-all"
              >
                Switch to BOT Chain Testnet
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Submitting to BOT Chain...'
                    : isRegisteredBusiness
                    ? 'Save Updated Profile'
                    : 'Register Business on BOT Chain'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

