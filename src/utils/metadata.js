/**
 * Off-Chain Business Metadata Utilities
 * Keeps heavy business descriptions, categories, and images off-chain to minimize gas and storage costs.
 */

const LOCAL_STORAGE_KEY_PREFIX = 'openslot_business_meta_';

export function saveLocalMetadata(businessAddress, metadata) {
  if (!businessAddress) return;
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${businessAddress.toLowerCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(metadata));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

export function getLocalMetadata(businessAddress) {
  if (!businessAddress) return null;
  const key = `${LOCAL_STORAGE_KEY_PREFIX}${businessAddress.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Parse metadata URI or string.
 * Supports:
 * 1. Raw JSON string or encoded JSON
 * 2. ipfs:// URI
 * 3. data:application/json URI
 * 4. Local fallback
 */
export async function resolveMetadata(businessAddress, metadataURI) {
  // Check local override first
  const cached = getLocalMetadata(businessAddress);
  if (cached && cached.name) {
    return cached;
  }

  if (!metadataURI || metadataURI.trim() === '') {
    return getDefaultBusinessMetadata(businessAddress);
  }

  try {
    if (metadataURI.startsWith('{')) {
      const parsed = JSON.parse(metadataURI);
      saveLocalMetadata(businessAddress, parsed);
      return parsed;
    }

    if (metadataURI.startsWith('data:application/json')) {
      const base64Data = metadataURI.split(',')[1];
      const jsonStr = atob(base64Data);
      const parsed = JSON.parse(jsonStr);
      saveLocalMetadata(businessAddress, parsed);
      return parsed;
    }

    if (metadataURI.startsWith('ipfs://')) {
      const cid = metadataURI.replace('ipfs://', '');
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      const parsed = await response.json();
      saveLocalMetadata(businessAddress, parsed);
      return parsed;
    }

    if (metadataURI.startsWith('http')) {
      const response = await fetch(metadataURI);
      const parsed = await response.json();
      saveLocalMetadata(businessAddress, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn(`Could not resolve metadataURI "${metadataURI}":`, err);
  }

  return getDefaultBusinessMetadata(businessAddress);
}

export function getDefaultBusinessMetadata(address) {
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unnamed';
  return {
    name: `Business ${shortAddr}`,
    category: 'General Services',
    description: 'Decentralized appointment provider registered on BOT Chain.',
    image: `https://api.dicebear.com/7.x/identicon/svg?seed=${address || 'botchain'}`,
    email: '',
    phone: '',
    address: 'On-Chain',
  };
}

