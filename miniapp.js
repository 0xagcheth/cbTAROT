/**
 * Farcaster Mini App SDK Integration Module
 * 
 * This module handles all Farcaster Mini App functionality including:
 * - Environment detection (isInMiniApp)
 * - SDK initialization and ready signal
 * - User identity/context
 * - Authentication (signIn / quickAuth)
 * - Wallet integration (EIP-1193 provider)
 * - Payments (sendToken)
 * - Social sharing (composeCast)
 * 
 * Documentation: https://miniapps.farcaster.xyz/docs
 */

// Import SDK statically at module top for immediate availability
import { sdk, isInMiniApp } from 'https://esm.sh/@farcaster/miniapp-sdk';

// Global state for Farcaster Mini App
window.FarcasterMiniApp = {
  isInitialized: false,
  isInMiniApp: false,
  sdk: sdk,
  context: null,
  user: null,
  authToken: null,
  walletProvider: null,
  walletAddress: null,
  readyCalled: false
};

/**
 * Initialize the Farcaster Mini App SDK
 * SDK is already imported statically at module top
 */
async function initFarcasterMiniApp() {
  if (window.FarcasterMiniApp.isInitialized) {
    console.log('[cbTARO miniapp] Already initialized');
    return window.FarcasterMiniApp;
  }

  try {
    // SDK is already available from static import
    // Check if we're running inside a Farcaster Mini App environment
    const inMiniApp = await isInMiniApp();
    window.FarcasterMiniApp.isInMiniApp = inMiniApp;
    
    console.log('[cbTARO miniapp] Environment detected:', inMiniApp ? 'Mini App ✓' : 'Standalone Browser');
    
    if (inMiniApp) {
      // Get context (viewer info, cast context if any)
      try {
        const context = sdk.context;
        window.FarcasterMiniApp.context = context;
        
        if (context && context.user) {
          window.FarcasterMiniApp.user = {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl
          };
          console.log('[cbTARO miniapp] User context:', window.FarcasterMiniApp.user);
        }
      } catch (contextErr) {
        console.warn('[cbTARO miniapp] Could not get context:', contextErr);
      }
    }
    
    window.FarcasterMiniApp.isInitialized = true;
    console.log('[cbTARO miniapp] SDK initialized ✓');
    
    // Dispatch custom event for React components to listen to
    window.dispatchEvent(new CustomEvent('farcaster-miniapp-ready', {
      detail: window.FarcasterMiniApp
    }));
    
    return window.FarcasterMiniApp;
    
  } catch (error) {
    console.warn('[cbTARO miniapp] SDK initialization failed (normal in standalone browser):', error);
    window.FarcasterMiniApp.isInitialized = true;
    window.FarcasterMiniApp.isInMiniApp = false;
    return window.FarcasterMiniApp;
  }
}

/**
 * Signal to Farcaster client that the app is ready
 * Call this AFTER your UI is fully rendered
 * Only calls ready() once to prevent issues
 * 
 * NOTE: This is now called automatically by failsafeReadyFlow()
 * but can still be called manually if needed (it will be idempotent)
 * 
 * @param {string} reason - Optional reason for logging
 */
async function signalReady(reason = 'manual call') {
  // Check if HEAD bootstrap already called it
  if (window.__cbTARO_ready_called || window.FarcasterMiniApp.readyCalled) {
    console.log('[cbTARO miniapp] Ready already called, skipping (' + reason + ')');
    return { success: false, reason: 'already_called' };
  }
  
  if (!window.FarcasterMiniApp.isInMiniApp) {
    console.log('[cbTARO miniapp] Not in Mini App, skipping ready signal (' + reason + ')');
    return { success: false, reason: 'not_in_miniapp' };
  }
  
  if (!window.FarcasterMiniApp.sdk) {
    console.log('[cbTARO miniapp] SDK not initialized, skipping ready signal (' + reason + ')');
    return { success: false, reason: 'sdk_not_initialized' };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  // Check if actions.ready exists before calling
  if (!sdk.actions || typeof sdk.actions.ready !== 'function') {
    console.warn('[cbTARO miniapp] sdk.actions.ready not available (' + reason + ')');
    return { success: false, reason: 'ready_not_available' };
  }
  
  try {
    console.log('[cbTARO miniapp] Calling ready() - ' + reason);
    await sdk.actions.ready();
    window.FarcasterMiniApp.readyCalled = true;
    console.log('[cbTARO miniapp] Ready signal sent successfully ✓');
    return { success: true };
  } catch (error) {
    console.error('[cbTARO miniapp] Ready signal failed:', error);
    return { success: false, reason: 'error', error: error.message };
  }
}

/**
 * Sign in with Farcaster (SIWF)
 * Returns signed message and signature for backend verification
 */
async function signIn(nonce = null) {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    console.log('[FarcasterMiniApp] Sign-in not available outside Mini App');
    return { success: false, error: 'Not in Mini App environment' };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  // Check if action exists
  if (!sdk.actions || typeof sdk.actions.signIn !== 'function') {
    console.warn('[FarcasterMiniApp] sdk.actions.signIn not available');
    return { success: false, error: 'Sign-in action not available' };
  }
  
  try {
    const result = await sdk.actions.signIn({
      nonce: nonce || generateNonce(),
      acceptAuthAddress: true
    });
    
    console.log('[FarcasterMiniApp] Sign-in successful');
    return { success: true, ...result };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Sign-in error:', error);
    return { success: false, error: error.message || 'Sign-in failed' };
  }
}

/**
 * Quick Auth - Get JWT token for simpler authentication
 * Note: For static apps, this is client-side demo only
 */
async function getQuickAuthToken() {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    console.log('[FarcasterMiniApp] Quick Auth not available outside Mini App');
    return { success: false, error: 'Not in Mini App environment' };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  if (!sdk.quickAuth || typeof sdk.quickAuth.getToken !== 'function') {
    console.warn('[FarcasterMiniApp] sdk.quickAuth.getToken not available');
    return { success: false, error: 'Quick Auth not available' };
  }
  
  try {
    const { token } = await sdk.quickAuth.getToken();
    window.FarcasterMiniApp.authToken = token;
    
    // Store in sessionStorage for persistence during session
    try {
      sessionStorage.setItem('fc_auth_token', token);
    } catch (e) {
      // sessionStorage might not be available
    }
    
    console.log('[FarcasterMiniApp] Quick Auth token obtained');
    return { success: true, token };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Quick Auth error:', error);
    return { success: false, error: error.message || 'Quick Auth failed' };
  }
}

/**
 * Connect wallet and get Ethereum provider (EIP-1193)
 */
async function connectWallet() {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    console.log('[FarcasterMiniApp] Wallet connection not available outside Mini App');
    return { success: false, error: 'Not in Mini App environment' };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  if (!sdk.wallet || typeof sdk.wallet.getEthereumProvider !== 'function') {
    console.warn('[FarcasterMiniApp] sdk.wallet.getEthereumProvider not available');
    return { success: false, error: 'Wallet provider not available' };
  }
  
  try {
    const provider = await sdk.wallet.getEthereumProvider();
    window.FarcasterMiniApp.walletProvider = provider;
    
    // Request accounts
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (accounts && accounts.length > 0) {
      window.FarcasterMiniApp.walletAddress = accounts[0];
      console.log('[FarcasterMiniApp] Wallet connected:', accounts[0]);
      return { success: true, address: accounts[0], provider };
    }
    
    return { success: false, error: 'No accounts returned' };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Wallet connection error:', error);
    return { success: false, error: error.message || 'Wallet connection failed' };
  }
}

/**
 * Send token/ETH using Farcaster's native payment UI
 * 
 * Returns object: { success: true, transactionHash } or { success: false, reason, error? }
 * 
 * @param {Object} options
 * @param {string} options.recipientAddress - Recipient wallet address
 * @param {number} options.recipientFid - Recipient Farcaster ID (optional)
 * @param {string} options.amount - Amount in wei (as string)
 * @param {string} options.token - CAIP-19 asset identifier (optional, defaults to native ETH on Base)
 */
async function sendToken({ recipientAddress, recipientFid, amount, token }) {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    console.log('[FarcasterMiniApp] sendToken not available outside Mini App');
    return { success: false, reason: 'not_in_miniapp', error: 'Not in Mini App environment' };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  // Check if action exists
  if (!sdk.actions || typeof sdk.actions.sendToken !== 'function') {
    console.warn('[FarcasterMiniApp] sdk.actions.sendToken not available');
    return { success: false, reason: 'action_unavailable', error: 'sendToken action not available' };
  }
  
  const params = {
    recipientAddress: recipientAddress,
    amount: amount
  };
  
  // Add optional parameters
  if (recipientFid) {
    params.recipientFid = recipientFid;
  }
  
  // For native ETH on Base: leave token undefined or use eip155:8453/slip44:60
  // For ERC20: eip155:8453/erc20:<contract_address>
  if (token) {
    params.token = token;
  }
  
  try {
    const result = await sdk.actions.sendToken(params);
    
    // Official SDK returns { success: true/false, transactionHash?, reason?, error? }
    if (result && result.success === true) {
      console.log('[FarcasterMiniApp] Token sent successfully:', result.transactionHash);
      return { 
        success: true, 
        transactionHash: result.transactionHash,
        transaction: result.transactionHash // alias for compatibility
      };
    } else {
      // User rejected or send failed
      const reason = result?.reason || 'unknown';
      console.log('[FarcasterMiniApp] Token send failed:', reason, result?.error);
      return { 
        success: false, 
        reason: reason,
        error: result?.error || reason
      };
    }
    
  } catch (error) {
    // Unexpected error (network issues, etc.)
    console.error('[FarcasterMiniApp] Token send unexpected error:', error);
    return { 
      success: false, 
      reason: 'unexpected_error',
      error: error.message || 'Unexpected error during sendToken'
    };
  }
}

/**
 * Send ETH via wallet provider (EIP-1193 fallback)
 * Use this if sendToken is not available
 */
async function sendEthViaProvider({ recipientAddress, amountWei }) {
  let provider = window.FarcasterMiniApp.walletProvider;
  let fromAddress = window.FarcasterMiniApp.walletAddress;
  
  if (!provider || !fromAddress) {
    // Try to connect wallet first
    const walletResult = await connectWallet();
    if (!walletResult.success) {
      return walletResult;
    }
    provider = window.FarcasterMiniApp.walletProvider;
    fromAddress = window.FarcasterMiniApp.walletAddress;
  }
  
  try {
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: fromAddress,
        to: recipientAddress,
        value: '0x' + BigInt(amountWei).toString(16)
      }]
    });
    
    console.log('[FarcasterMiniApp] Transaction sent:', txHash);
    return { success: true, transactionHash: txHash, transaction: txHash };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Transaction error:', error);
    return { 
      success: false, 
      reason: error.code === 4001 ? 'rejected_by_user' : 'send_failed',
      error: error.message || 'Transaction failed'
    };
  }
}

/**
 * Compose and share a cast to Farcaster
 * 
 * @param {Object} options
 * @param {string} options.text - Cast text content
 * @param {Array<string>} options.embeds - URLs to embed (optional, must be absolute URLs)
 */
async function composeCast({ text, embeds }) {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    // Fallback for non-Mini App environment: copy to clipboard
    console.log('[FarcasterMiniApp] composeCast not available, using clipboard fallback');
    return copyToClipboardFallback(text, embeds);
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  // Check if action exists
  if (!sdk.actions || typeof sdk.actions.composeCast !== 'function') {
    console.warn('[FarcasterMiniApp] sdk.actions.composeCast not available');
    return copyToClipboardFallback(text, embeds);
  }
  
  try {
    const params = { text: text || '' };
    
    // Embeds must be an array of absolute URL strings
    if (embeds && Array.isArray(embeds) && embeds.length > 0) {
      // Ensure all embeds are absolute URLs
      params.embeds = embeds.filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          console.warn('[FarcasterMiniApp] Invalid embed URL filtered out:', url);
          return false;
        }
      });
    }
    
    await sdk.actions.composeCast(params);
    console.log('[FarcasterMiniApp] Cast composer opened');
    return { success: true };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] composeCast error:', error);
    // Fall back to clipboard on error
    return copyToClipboardFallback(text, embeds);
  }
}

/**
 * Robust clipboard copy with fallback for iOS WebViews
 */
async function copyToClipboardFallback(text, embeds) {
  let shareText = text || '';
  if (embeds && Array.isArray(embeds) && embeds.length > 0) {
    shareText += '\n\n' + embeds.join('\n');
  }
  
  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(shareText);
      console.log('[FarcasterMiniApp] Copied to clipboard via Clipboard API');
      return { success: true, fallback: 'clipboard' };
    } catch (e) {
      console.warn('[FarcasterMiniApp] Clipboard API failed, trying fallback:', e);
    }
  }
  
  // Fallback: hidden textarea + execCommand (works in iOS WebViews)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = shareText;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', ''); // Prevent keyboard on mobile
    document.body.appendChild(textarea);
    
    // iOS-specific: need to focus and select differently
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textarea.setSelectionRange(0, shareText.length); // For iOS
    
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (success) {
      console.log('[FarcasterMiniApp] Copied to clipboard via execCommand fallback');
      return { success: true, fallback: 'clipboard' };
    } else {
      throw new Error('execCommand copy returned false');
    }
  } catch (error) {
    console.error('[FarcasterMiniApp] All clipboard methods failed:', error);
    return { success: false, error: 'Clipboard copy failed' };
  }
}

/**
 * Open external URL
 */
async function openUrl(url) {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    window.open(url, '_blank');
    return { success: true };
  }
  
  const sdk = window.FarcasterMiniApp.sdk;
  
  if (!sdk.actions || typeof sdk.actions.openUrl !== 'function') {
    window.open(url, '_blank');
    return { success: true };
  }
  
  try {
    await sdk.actions.openUrl({ url });
    return { success: true };
  } catch (error) {
    // Fallback to window.open
    window.open(url, '_blank');
    return { success: true };
  }
}

/**
 * Generate a random nonce for authentication
 */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Format ETH amount from wei
 */
function formatEthFromWei(weiString) {
  const wei = BigInt(weiString);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

/**
 * Convert ETH to wei
 */
function ethToWei(ethAmount) {
  return (BigInt(Math.floor(ethAmount * 1e18))).toString();
}

// Preset tip amounts in ETH
const TIP_AMOUNTS = {
  small: { eth: 0.0001, label: '0.0001 ETH' },
  medium: { eth: 0.001, label: '0.001 ETH' },
  large: { eth: 0.01, label: '0.01 ETH' }
};

// Tip recipient address
const TIP_RECIPIENT = '0xD4bF185c846F6CAbDaa34122d0ddA43765E754A6';

/**
 * Send a tip to the app creator
 * Uses result-based handling per official sendToken spec
 * 
 * @param {string} size - 'small', 'medium', or 'large'
 */
async function sendTip(size = 'small') {
  const tipAmount = TIP_AMOUNTS[size];
  if (!tipAmount) {
    return { success: false, reason: 'invalid_size', error: 'Invalid tip size' };
  }
  
  const amountWei = ethToWei(tipAmount.eth);
  
  // Try sendToken first (native Farcaster payment)
  if (window.FarcasterMiniApp.isInMiniApp && window.FarcasterMiniApp.sdk) {
    const result = await sendToken({
      recipientAddress: TIP_RECIPIENT,
      amount: amountWei
      // No token specified = native ETH on Base
    });
    
    // If sendToken worked or user rejected, return that result
    if (result.success || result.reason === 'rejected_by_user') {
      return result;
    }
    
    // If sendToken is not available or failed for other reasons, try EIP-1193 fallback
    console.log('[FarcasterMiniApp] sendToken failed, trying EIP-1193 fallback');
    return await sendEthViaProvider({
      recipientAddress: TIP_RECIPIENT,
      amountWei: amountWei
    });
  }
  
  // Outside Mini App: try wallet provider fallback
  return await sendEthViaProvider({
    recipientAddress: TIP_RECIPIENT,
    amountWei: amountWei
  });
}

/**
 * FAILSAFE READY FLOW
 * Calls sdk.actions.ready() IMMEDIATELY when inside Mini App
 * Per Farcaster docs: must call ready() as soon as app loads
 * https://miniapps.farcaster.xyz/docs/getting-started#making-your-app-display
 * 
 * NOTE: This may be redundant with the bootstrap script in index.html,
 * but provides additional safety for other SDK features.
 */
async function failsafeReadyFlow() {
  try {
    // Check if bootstrap script in HEAD already called ready()
    if (window.__cbTARO_ready_called) {
      console.log('[cbTARO miniapp] Ready already called by HEAD bootstrap - skipping');
      // Still initialize for other features
      await initFarcasterMiniApp();
      return;
    }
    
    // Step 1: Detect environment IMMEDIATELY (SDK already imported)
    const inMiniApp = await isInMiniApp();
    window.FarcasterMiniApp.isInMiniApp = inMiniApp;
    
    if (!inMiniApp) {
      console.log('[cbTARO miniapp] Not in Mini App - skipping ready()');
      // Still initialize for other features
      await initFarcasterMiniApp();
      return;
    }
    
    console.log('[cbTARO miniapp] ⚡ Mini App detected - calling ready() IMMEDIATELY');
    
    // Step 2: Call ready() IMMEDIATELY without delay
    if (window.FarcasterMiniApp.readyCalled) {
      console.log('[cbTARO miniapp] Ready already called');
      return;
    }
    
    if (!sdk || !sdk.actions || typeof sdk.actions.ready !== 'function') {
      console.error('[cbTARO miniapp] ❌ sdk.actions.ready not available!');
      return;
    }
    
    // CALL READY IMMEDIATELY - no RAF wait, no delays
    await sdk.actions.ready();
    window.FarcasterMiniApp.readyCalled = true;
    console.log('[cbTARO miniapp] ✅ ready() called successfully');
    
    // Step 3: Now initialize other features (context, user, etc.)
    await initFarcasterMiniApp();
    
  } catch (error) {
    console.error('[cbTARO miniapp] ❌ Failsafe ready flow error:', error);
    
    // EMERGENCY FALLBACK: Try ready() one more time
    try {
      if (!window.FarcasterMiniApp.readyCalled && sdk?.actions?.ready) {
        console.log('[cbTARO miniapp] 🚨 Emergency fallback: calling ready()');
        await sdk.actions.ready();
        window.FarcasterMiniApp.readyCalled = true;
        console.log('[cbTARO miniapp] ✅ Emergency ready() succeeded');
      }
    } catch (fallbackError) {
      console.error('[cbTARO miniapp] ❌ Emergency fallback failed:', fallbackError);
    }
  }
}

// Export functions to global scope for use in HTML/React
window.initFarcasterMiniApp = initFarcasterMiniApp;
window.signalReady = signalReady;
window.fcSignIn = signIn;
window.fcGetQuickAuthToken = getQuickAuthToken;
window.fcConnectWallet = connectWallet;
window.fcSendToken = sendToken;
window.fcSendTip = sendTip;
window.fcComposeCast = composeCast;
window.fcOpenUrl = openUrl;
window.fcCopyToClipboard = copyToClipboardFallback;
window.TIP_AMOUNTS = TIP_AMOUNTS;
window.TIP_RECIPIENT = TIP_RECIPIENT;

// DEFERRED AUTO-INITIALIZATION
// Bootstrap script in index.html handles ready() call
// This provides additional SDK features (context, wallet, etc.)
console.log('[cbTARO miniapp] Module loaded - will initialize after DOM ready');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[cbTARO miniapp] DOM ready - initializing SDK features');
    failsafeReadyFlow().catch(err => {
      console.error('[cbTARO miniapp] Fatal error in failsafe flow:', err);
    });
  });
} else {
  // DOM already ready
  console.log('[cbTARO miniapp] DOM already ready - initializing SDK features');
  failsafeReadyFlow().catch(err => {
    console.error('[cbTARO miniapp] Fatal error in failsafe flow:', err);
  });
}
