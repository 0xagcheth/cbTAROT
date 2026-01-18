/**
 * cbTARO - Farcaster Mini App SDK Integration
 * 
 * Provides a clean global API for Farcaster features:
 * - Environment detection
 * - Ready signal (dismiss splash)
 * - Wallet connection (EIP-1193 provider)
 * - Payments (sendToken + fallback to eth_sendTransaction)
 * - Social sharing (composeCast)
 * 
 * Docs: https://miniapps.farcaster.xyz/
 */

// Import SDK from ESM CDN with pinned version for stability
import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk@0.0.59';

// =============================================================================
// STATE
// =============================================================================

const state = {
  initialized: false,
  readyCalled: false,
  inMiniApp: false,
  context: null,
  provider: null,
  address: null
};

// =============================================================================
// READY SIGNAL (dismiss splash screen)
// =============================================================================

/**
 * Call sdk.actions.ready() exactly once when in Mini App
 * Per docs: https://miniapps.farcaster.xyz/docs/sdk/actions/ready
 */
async function callReady() {
  if (state.readyCalled) {
    console.log('[cbTARO] ready() already called, skipping');
    return;
  }
  
  state.readyCalled = true;
  
  try {
    if (!sdk?.actions?.ready) {
      console.warn('[cbTARO] sdk.actions.ready not available');
      return;
    }
    
    // Wait for UI to render (2 RAF ticks)
    await new Promise(resolve => 
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    
    await sdk.actions.ready();
    console.log('[cbTARO] ✅ sdk.actions.ready() called successfully');
  } catch (err) {
    console.error('[cbTARO] ready() failed:', err);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize Farcaster SDK features
 * - Detect environment
 * - Call ready() if in Mini App
 * - Load context
 * - Setup wallet provider
 */
async function init() {
  if (state.initialized) {
    console.log('[cbTARO] Already initialized');
    return state;
  }
  
  console.log('[cbTARO] Initializing Farcaster Mini App SDK...');
  
  try {
    // Detect environment
    if (typeof sdk?.isInMiniApp === 'function') {
      state.inMiniApp = await sdk.isInMiniApp();
      console.log('[cbTARO] Environment:', state.inMiniApp ? 'Farcaster Mini App ✅' : 'Standalone Web');
    } else {
      console.log('[cbTARO] isInMiniApp not available, assuming standalone web');
      state.inMiniApp = false;
    }
    
    // Call ready() if in Mini App
    if (state.inMiniApp) {
      await callReady();
      
      // Load context (user info)
      if (sdk?.context) {
        try {
          state.context = await sdk.context;
          console.log('[cbTARO] Context loaded:', {
            fid: state.context?.user?.fid,
            username: state.context?.user?.username,
            displayName: state.context?.user?.displayName
          });
        } catch (err) {
          console.warn('[cbTARO] Failed to load context:', err);
        }
      }
      
      // Setup wallet provider
      if (sdk?.wallet?.getEthereumProvider) {
        try {
          state.provider = await sdk.wallet.getEthereumProvider();
          console.log('[cbTARO] Ethereum provider loaded ✅');
        } catch (err) {
          console.warn('[cbTARO] Failed to load wallet provider:', err);
        }
      }
    }
    
    state.initialized = true;
    console.log('[cbTARO] Initialization complete ✅');
    
    // Dispatch custom event for UI
    window.dispatchEvent(new CustomEvent('farcaster-ready', { 
      detail: { 
        inMiniApp: state.inMiniApp,
        context: state.context 
      }
    }));
    
    return state;
    
  } catch (err) {
    console.error('[cbTARO] Initialization failed:', err);
    throw err;
  }
}

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Check if running inside Farcaster Mini App
 * Docs: https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
 */
async function isInMiniApp() {
  if (!state.initialized) {
    await init();
  }
  return state.inMiniApp;
}

// =============================================================================
// CONTEXT (user info)
// =============================================================================

/**
 * Get Farcaster user context (fid, username, displayName, pfpUrl)
 */
function getContext() {
  return state.context;
}

// =============================================================================
// WALLET
// =============================================================================

/**
 * Get Ethereum provider (EIP-1193)
 * Docs: https://miniapps.farcaster.xyz/docs/sdk/wallet
 */
function getEthereumProvider() {
  if (!state.provider) {
    console.warn('[cbTARO] Provider not available. Are you in a Mini App?');
  }
  return state.provider;
}

/**
 * Connect wallet (request accounts)
 */
async function connectWallet() {
  if (!state.provider) {
    console.error('[cbTARO] No provider available');
    return { success: false, error: 'Provider not available' };
  }
  
  try {
    const accounts = await state.provider.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts && accounts.length > 0) {
      state.address = accounts[0];
      console.log('[cbTARO] Wallet connected:', state.address);
      return { success: true, address: state.address };
    } else {
      return { success: false, error: 'No accounts returned' };
    }
  } catch (err) {
    console.error('[cbTARO] connectWallet failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get current wallet address
 */
async function getAddress() {
  if (state.address) return state.address;
  
  if (!state.provider) return null;
  
  try {
    const accounts = await state.provider.request({ 
      method: 'eth_accounts' 
    });
    if (accounts && accounts.length > 0) {
      state.address = accounts[0];
      return state.address;
    }
  } catch (err) {
    console.warn('[cbTARO] getAddress failed:', err);
  }
  
  return null;
}

// =============================================================================
// PAYMENTS
// =============================================================================

const TIP_RECIPIENT = '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6';
const BASE_CHAIN_ID = 8453; // Base mainnet

/**
 * Send tip (ETH on Base)
 * Docs: https://miniapps.farcaster.xyz/docs/sdk/actions/send-token
 * 
 * @param {string} amountEth - Amount in ETH (e.g. "0.0001")
 */
async function sendTip(amountEth) {
  console.log('[cbTARO] sendTip:', amountEth, 'ETH to', TIP_RECIPIENT);
  
  // Try native sendToken first
  if (sdk?.actions?.sendToken) {
    try {
      // CAIP-19 format: eip155:8453/slip44:60
      const tokenId = `eip155:${BASE_CHAIN_ID}/slip44:60`;
      
      const result = await sdk.actions.sendToken({
        recipient: TIP_RECIPIENT,
        tokenId: tokenId,
        amount: amountEth
      });
      
      if (result.success) {
        console.log('[cbTARO] sendToken success:', result.transactionHash);
        return { 
          success: true, 
          txHash: result.transactionHash,
          method: 'sendToken'
        };
      } else {
        console.warn('[cbTARO] sendToken rejected:', result.reason);
        return { 
          success: false, 
          error: result.reason || 'rejected_by_user',
          method: 'sendToken'
        };
      }
    } catch (err) {
      console.warn('[cbTARO] sendToken failed, trying fallback:', err);
      // Fall through to EIP-1193 fallback
    }
  }
  
  // Fallback to eth_sendTransaction
  if (!state.provider) {
    return { 
      success: false, 
      error: 'No wallet provider available' 
    };
  }
  
  try {
    const fromAddress = await getAddress();
    if (!fromAddress) {
      return { 
        success: false, 
        error: 'Wallet not connected' 
      };
    }
    
    // Convert ETH to Wei hex
    const valueWei = BigInt(Math.floor(parseFloat(amountEth) * 1e18));
    const valueHex = '0x' + valueWei.toString(16);
    
    const txHash = await state.provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: TIP_RECIPIENT,
        value: valueHex,
        chainId: '0x' + BASE_CHAIN_ID.toString(16)
      }]
    });
    
    console.log('[cbTARO] eth_sendTransaction success:', txHash);
    return { 
      success: true, 
      txHash: txHash,
      method: 'eth_sendTransaction'
    };
    
  } catch (err) {
    console.error('[cbTARO] Payment failed:', err);
    return { 
      success: false, 
      error: err.message || 'Transaction failed',
      method: 'eth_sendTransaction'
    };
  }
}

// =============================================================================
// SHARING
// =============================================================================

/**
 * Open Farcaster composer with pre-filled cast
 * Docs: https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast
 * 
 * @param {string} text - Cast text
 * @param {string[]} embeds - Array of URLs to embed
 */
async function composeCast(text, embeds = []) {
  if (!state.inMiniApp) {
    console.warn('[cbTARO] composeCast only works in Mini App');
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text + '\n\n' + embeds.join('\n'));
      return { success: true, fallback: 'clipboard' };
    } catch (err) {
      console.error('[cbTARO] Clipboard fallback failed:', err);
      return { success: false, error: 'Not in Mini App and clipboard failed' };
    }
  }
  
  if (!sdk?.actions?.composeCast) {
    console.error('[cbTARO] composeCast not available');
    return { success: false, error: 'composeCast not available' };
  }
  
  try {
    // Ensure embeds are absolute URLs
    const validEmbeds = embeds.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        console.warn('[cbTARO] Invalid embed URL:', url);
        return false;
      }
    });
    
    await sdk.actions.composeCast({
      text: text,
      embeds: validEmbeds
    });
    
    console.log('[cbTARO] composeCast opened ✅');
    return { success: true };
    
  } catch (err) {
    console.error('[cbTARO] composeCast failed:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// GLOBAL API
// =============================================================================

window.fc = {
  // Core
  init,
  ready: callReady,
  isInMiniApp,
  getContext,
  
  // Wallet
  connectWallet,
  getAddress,
  getEthereumProvider,
  
  // Payments
  sendTip,
  
  // Sharing
  composeCast,
  
  // State (read-only)
  get state() { return { ...state }; }
};

// =============================================================================
// AUTO-INIT
// =============================================================================

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => {
      console.error('[cbTARO] Auto-init failed:', err);
    });
  });
} else {
  // DOM already loaded
  init().catch(err => {
    console.error('[cbTARO] Auto-init failed:', err);
  });
}

console.log('[cbTARO] miniapp.js loaded, window.fc API available');
