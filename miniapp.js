/**
 * cbTARO - Farcaster Mini App Integration
 * 
 * Official Documentation:
 * - Getting Started: https://miniapps.farcaster.xyz/docs/getting-started
 * - Loading/Ready: https://miniapps.farcaster.xyz/docs/guides/loading
 * - Context: https://miniapps.farcaster.xyz/docs/sdk/context
 * - Wallet: https://miniapps.farcaster.xyz/docs/sdk/wallet
 * - Sharing: https://miniapps.farcaster.xyz/docs/guides/sharing
 * - composeCast: https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast
 * - sendToken: https://miniapps.farcaster.xyz/docs/sdk/actions/send-token
 * - Capabilities: https://miniapps.farcaster.xyz/docs/sdk/detecting-capabilities
 */

// Import SDK from ESM CDN
import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk@0.0.59';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Tip recipient EVM address (for eth_sendTransaction)
  TIP_ADDRESS: '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6',
  
  // Optional: Recipient FID for native sendToken (if known)
  // Set to null if unknown
  TIP_RECIPIENT_FID: null,
  
  // Default share URL
  SHARE_URL: 'https://0xagcheth.github.io/cbTARO/',
  SHARE_EXTENSION_URL: 'https://0xagcheth.github.io/cbTARO/share',
  
  // Base network
  CHAIN_ID: 8453, // Base mainnet
  
  // Example token for sendToken (Base USDC)
  // CAIP-19 format: eip155:{chainId}/erc20:{contractAddress}
  USDC_BASE_CAIP19: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

// =============================================================================
// STATE
// =============================================================================

const state = {
  inMiniApp: false,
  readyCalled: false,
  context: null,
  provider: null,
  address: null,
  capabilities: {}
};

// =============================================================================
// ENVIRONMENT DETECTION
// https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
// =============================================================================

/**
 * Detect if running in Farcaster Mini App
 */
async function detectEnvironment() {
  try {
    if (typeof sdk?.isInMiniApp === 'function') {
      state.inMiniApp = await sdk.isInMiniApp();
      console.log('[cbTARO] Environment:', state.inMiniApp ? '🚀 Farcaster Mini App' : '🌐 Standalone Web');
      return state.inMiniApp;
    }
    console.log('[cbTARO] isInMiniApp not available, assuming standalone');
    state.inMiniApp = false;
    return false;
  } catch (err) {
    console.error('[cbTARO] detectEnvironment error:', err);
    state.inMiniApp = false;
    return false;
  }
}

// =============================================================================
// READY SIGNAL (MANDATORY)
// https://miniapps.farcaster.xyz/docs/sdk/actions/ready
// https://miniapps.farcaster.xyz/docs/guides/loading
// =============================================================================

/**
 * Call sdk.actions.ready() exactly once when in Mini App
 * CRITICAL: Sets flag ONLY after success, retries if fails
 */
async function ready() {
  if (state.readyCalled) {
    console.log('[cbTARO] ready() already called');
    return { success: false, reason: 'already_called' };
  }

  try {
    await sdk.actions.ready();
    state.readyCalled = true; // ✅ ONLY after success
    console.log('[cbTARO] ✅ ready() called successfully');
    return { success: true };
  } catch (err) {
    console.warn('[cbTARO] ready() failed (will retry):', err);

    // ✅ Retry after 250ms (often fixes "too early" issue)
    setTimeout(() => {
      // Don't block retry: state.readyCalled still false
      ready().catch(() => {});
    }, 250);

    return { success: false, reason: err?.message || 'ready_failed' };
  }
}

// =============================================================================
// CONTEXT (Farcaster Identity/Session)
// https://miniapps.farcaster.xyz/docs/sdk/context
// =============================================================================

/**
 * Get Farcaster user context
 * Returns: { user: { fid, username, displayName, pfpUrl }, client, ... }
 */
async function getContext() {
  try {
    if (!sdk?.context) {
      console.warn('[cbTARO] sdk.context not available');
      return null;
    }
    
    const context = await sdk.context;
    console.log('[cbTARO] Context loaded:', {
      fid: context?.user?.fid,
      username: context?.user?.username,
      displayName: context?.user?.displayName
    });
    
    return context;
    
  } catch (err) {
    console.error('[cbTARO] getContext error:', err);
    return null;
  }
}

/**
 * Refresh context (re-read from SDK)
 */
async function refreshContext() {
  state.context = await getContext();
  return state.context;
}

// =============================================================================
// WALLET (EIP-1193 Provider)
// https://miniapps.farcaster.xyz/docs/sdk/wallet
// =============================================================================

/**
 * Get Ethereum provider (EIP-1193 compatible)
 */
async function getProvider() {
  if (state.provider) {
    return state.provider;
  }
  
  try {
    if (!sdk?.wallet?.getEthereumProvider) {
      console.warn('[cbTARO] sdk.wallet.getEthereumProvider not available');
      return null;
    }
    
    state.provider = await sdk.wallet.getEthereumProvider();
    console.log('[cbTARO] Ethereum provider loaded ✅');
    return state.provider;
    
  } catch (err) {
    console.error('[cbTARO] getProvider error:', err);
    return null;
  }
}

/**
 * Connect wallet (request accounts)
 */
async function connectWallet() {
  console.log('[cbTARO] Connecting wallet...');
  
  const provider = await getProvider();
  if (!provider) {
    return {
      success: false,
      error: 'Provider not available. Are you in a Farcaster Mini App?'
    };
  }
  
  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts && accounts.length > 0) {
      state.address = accounts[0];
      console.log('[cbTARO] Wallet connected:', state.address);
      return { success: true, address: state.address };
    }
    
    return { success: false, error: 'No accounts returned' };
    
  } catch (err) {
    console.error('[cbTARO] connectWallet error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get current wallet address (if already connected)
 */
async function getAddress() {
  if (state.address) {
    return state.address;
  }
  
  const provider = await getProvider();
  if (!provider) {
    return null;
  }
  
  try {
    const accounts = await provider.request({
      method: 'eth_accounts'
    });
    
    if (accounts && accounts.length > 0) {
      state.address = accounts[0];
      return state.address;
    }
    
    return null;
    
  } catch (err) {
    console.error('[cbTARO] getAddress error:', err);
    return null;
  }
}

// =============================================================================
// PAYMENTS TO EVM ADDRESS (PRIMARY METHOD)
// Uses EIP-1193 eth_sendTransaction
// =============================================================================

/**
 * Send tip to EVM address using eth_sendTransaction
 * 
 * @param {string} amountEth - Amount in ETH (e.g., "0.001")
 */
async function sendTipToAddress(amountEth) {
  console.log('[cbTARO] Sending tip:', amountEth, 'ETH to', CONFIG.TIP_ADDRESS);
  
  const provider = await getProvider();
  if (!provider) {
    return {
      success: false,
      error: 'Wallet provider not available. Are you in a Farcaster Mini App?'
    };
  }
  
  try {
    // Get from address
    const fromAddress = await getAddress();
    if (!fromAddress) {
      return {
        success: false,
        error: 'Wallet not connected. Please connect wallet first.'
      };
    }
    
    // Convert ETH to Wei (as hex string)
    const amountWei = BigInt(Math.floor(parseFloat(amountEth) * 1e18));
    const valueHex = '0x' + amountWei.toString(16);
    
    console.log('[cbTARO] Transaction params:', {
      from: fromAddress,
      to: CONFIG.TIP_ADDRESS,
      value: valueHex,
      amount: amountEth + ' ETH'
    });
    
    // Send transaction via EIP-1193
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: CONFIG.TIP_ADDRESS,
        value: valueHex,
        chainId: '0x' + CONFIG.CHAIN_ID.toString(16)
      }]
    });
    
    console.log('[cbTARO] ✅ Transaction sent:', txHash);
    return {
      success: true,
      txHash: txHash,
      method: 'eth_sendTransaction'
    };
    
  } catch (err) {
    console.error('[cbTARO] sendTipToAddress error:', err);
    return {
      success: false,
      error: err.message || 'Transaction failed',
      method: 'eth_sendTransaction'
    };
  }
}

// =============================================================================
// OPTIONAL: NATIVE FARCASTER SEND TOKEN (FID-based)
// https://miniapps.farcaster.xyz/docs/sdk/actions/send-token
// =============================================================================

/**
 * Send token using native Farcaster send sheet
 * NOTE: Only works with recipientFid, NOT EVM addresses
 * 
 * @param {Object} params
 * @param {string} params.token - CAIP-19 token identifier
 * @param {string} params.amount - Amount to send
 * @param {number} params.recipientFid - Recipient Farcaster FID
 */
async function sendTokenToFid_optional({ token, amount, recipientFid }) {
  console.log('[cbTARO] sendToken (optional):', { token, amount, recipientFid });
  
  if (!sdk?.actions?.sendToken) {
    console.warn('[cbTARO] sdk.actions.sendToken not available');
    return {
      success: false,
      error: 'sendToken not available in this client'
    };
  }
  
  if (!recipientFid) {
    return {
      success: false,
      error: 'recipientFid is required for sendToken'
    };
  }
  
  try {
    const result = await sdk.actions.sendToken({
      token: token,
      amount: amount,
      recipientFid: recipientFid
    });
    
    if (result && typeof result === 'object') {
      if (result.success) {
        console.log('[cbTARO] ✅ sendToken success:', result.transactionHash);
        return {
          success: true,
          txHash: result.transactionHash,
          method: 'sendToken'
        };
      } else {
        console.warn('[cbTARO] sendToken rejected:', result.reason);
        return {
          success: false,
          error: result.reason || 'Transaction rejected',
          method: 'sendToken'
        };
      }
    }
    
    return { success: false, error: 'Unexpected response' };
    
  } catch (err) {
    console.error('[cbTARO] sendTokenToFid_optional error:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// SHARING (Compose Cast)
// https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast
// https://miniapps.farcaster.xyz/docs/guides/sharing
// =============================================================================

/**
 * Open Farcaster composer with pre-filled cast
 * 
 * @param {Object} params
 * @param {string} params.text - Cast text
 * @param {string} params.embedUrl - URL to embed (default: app URL)
 */
async function shareReading({ text, embedUrl = CONFIG.SHARE_URL }) {
  console.log('[cbTARO] Opening Farcaster composer...');
  
  if (!state.inMiniApp) {
    console.warn('[cbTARO] Not in Mini App, trying clipboard fallback');
    try {
      const fullText = text + '\n\n' + embedUrl;
      await navigator.clipboard.writeText(fullText);
      console.log('[cbTARO] ✅ Copied to clipboard');
      return { success: true, fallback: 'clipboard' };
    } catch (err) {
      console.error('[cbTARO] Clipboard fallback failed:', err);
      return { success: false, error: 'Not in Mini App and clipboard failed' };
    }
  }
  
  if (!sdk?.actions?.composeCast) {
    console.error('[cbTARO] sdk.actions.composeCast not available');
    return { success: false, error: 'composeCast not available' };
  }
  
  try {
    // Validate embed URL
    let validEmbeds = [];
    if (embedUrl) {
      try {
        new URL(embedUrl);
        validEmbeds = [embedUrl];
      } catch {
        console.warn('[cbTARO] Invalid embedUrl:', embedUrl);
      }
    }
    
    await sdk.actions.composeCast({
      text: text,
      embeds: validEmbeds
    });
    
    console.log('[cbTARO] ✅ Composer opened');
    return { success: true };
    
  } catch (err) {
    console.error('[cbTARO] shareReading error:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// CAPABILITY DETECTION
// https://miniapps.farcaster.xyz/docs/sdk/detecting-capabilities
// =============================================================================

/**
 * Check available capabilities
 */
function detectCapabilities() {
  const caps = {
    isInMiniApp: typeof sdk?.isInMiniApp === 'function',
    ready: typeof sdk?.actions?.ready === 'function',
    context: !!sdk?.context,
    wallet: typeof sdk?.wallet?.getEthereumProvider === 'function',
    composeCast: typeof sdk?.actions?.composeCast === 'function',
    sendToken: typeof sdk?.actions?.sendToken === 'function'
  };
  
  state.capabilities = caps;
  console.log('[cbTARO] Capabilities:', caps);
  return caps;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize Farcaster Mini App
 * @param {boolean} callReady - Whether to call ready() automatically (default: false)
 */
async function init(callReady = false) {
  console.log('[cbTARO] Initializing Farcaster Mini App SDK...');
  
  try {
    // 1. Detect capabilities
    detectCapabilities();
    
    // 2. Detect environment
    await detectEnvironment();
    
    // 3. Call ready() if in Mini App (MANDATORY) - but only if explicitly requested
    if (state.inMiniApp && callReady) {
      await ready();
    }
    
    // 4. Load context
    if (state.inMiniApp) {
      state.context = await getContext();
    }
    
    // 5. Setup provider (lazy loaded on first use)
    // Provider will be loaded on-demand by getProvider()
    
    console.log('[cbTARO] Initialization complete ✅');
    
    // Dispatch event for UI
    window.dispatchEvent(new CustomEvent('farcaster-ready', {
      detail: {
        inMiniApp: state.inMiniApp,
        context: state.context,
        capabilities: state.capabilities
      }
    }));
    
    return {
      inMiniApp: state.inMiniApp,
      context: state.context,
      capabilities: state.capabilities
    };
    
  } catch (err) {
    console.error('[cbTARO] Initialization failed:', err);
    throw err;
  }
}

// =============================================================================
// GLOBAL API
// =============================================================================

/**
 * Expose global bridge for UI
 */
window.fc = {
  // Environment
  inMiniApp: () => state.inMiniApp,
  
  // Context (Farcaster identity/session)
  context: () => state.context,
  refreshContext,
  
  // Core
  ready,
  
  // Wallet
  connectWallet,
  getAddress,
  getProvider,
  
  // Payments (PRIMARY: to EVM address)
  sendTipToAddress,
  
  // Sharing
  shareReading,
  
  // Optional: native sendToken (FID-based)
  sendTokenToFid_optional,
  
  // Capabilities
  capabilities: () => state.capabilities,
  
  // Config (read-only)
  config: {
    TIP_ADDRESS: CONFIG.TIP_ADDRESS,
    TIP_RECIPIENT_FID: CONFIG.TIP_RECIPIENT_FID,
    SHARE_URL: CONFIG.SHARE_URL,
    SHARE_EXTENSION_URL: CONFIG.SHARE_EXTENSION_URL
  }
};

// =============================================================================
// AUTO-INIT
// =============================================================================

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[cbTARO] DOM ready, starting initialization');
    init().catch(err => {
      console.error('[cbTARO] Auto-init failed:', err);
    });
  });
} else {
  console.log('[cbTARO] DOM already loaded, starting initialization');
  init().catch(err => {
    console.error('[cbTARO] Auto-init failed:', err);
  });
}

console.log('[cbTARO] miniapp.js loaded ✅ window.fc API available');
