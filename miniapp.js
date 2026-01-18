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

// Global state for Farcaster Mini App
window.FarcasterMiniApp = {
  isInitialized: false,
  isInMiniApp: false,
  sdk: null,
  context: null,
  user: null,
  authToken: null,
  walletProvider: null,
  walletAddress: null
};

/**
 * Initialize the Farcaster Mini App SDK
 * Must be called after page load, before any SDK operations
 */
async function initFarcasterMiniApp() {
  if (window.FarcasterMiniApp.isInitialized) {
    console.log('[FarcasterMiniApp] Already initialized');
    return window.FarcasterMiniApp;
  }

  try {
    // Dynamically import the SDK from ESM CDN
    const { sdk, isInMiniApp } = await import('https://esm.sh/@farcaster/miniapp-sdk');
    
    window.FarcasterMiniApp.sdk = sdk;
    
    // Check if we're running inside a Farcaster Mini App environment
    const inMiniApp = await isInMiniApp();
    window.FarcasterMiniApp.isInMiniApp = inMiniApp;
    
    console.log('[FarcasterMiniApp] Environment detected:', inMiniApp ? 'Mini App' : 'Standalone Browser');
    
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
          console.log('[FarcasterMiniApp] User context:', window.FarcasterMiniApp.user);
        }
      } catch (contextErr) {
        console.warn('[FarcasterMiniApp] Could not get context:', contextErr);
      }
      
      // Signal that the app is ready (hides splash screen)
      // IMPORTANT: Call this AFTER your UI is fully rendered
      // We'll call this from the main app after React mounts
    }
    
    window.FarcasterMiniApp.isInitialized = true;
    console.log('[FarcasterMiniApp] SDK initialized successfully');
    
    // Dispatch custom event for React components to listen to
    window.dispatchEvent(new CustomEvent('farcaster-miniapp-ready', {
      detail: window.FarcasterMiniApp
    }));
    
    return window.FarcasterMiniApp;
    
  } catch (error) {
    console.warn('[FarcasterMiniApp] SDK initialization failed (this is normal in standalone browser):', error);
    window.FarcasterMiniApp.isInitialized = true;
    window.FarcasterMiniApp.isInMiniApp = false;
    return window.FarcasterMiniApp;
  }
}

/**
 * Signal to Farcaster client that the app is ready
 * Call this AFTER your UI is fully rendered
 */
async function signalReady() {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    console.log('[FarcasterMiniApp] Not in Mini App, skipping ready signal');
    return;
  }
  
  try {
    await window.FarcasterMiniApp.sdk.actions.ready();
    console.log('[FarcasterMiniApp] Ready signal sent');
  } catch (error) {
    console.warn('[FarcasterMiniApp] Ready signal failed:', error);
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
  
  try {
    const result = await window.FarcasterMiniApp.sdk.actions.signIn({
      nonce: nonce || generateNonce(),
      acceptAuthAddress: true
    });
    
    console.log('[FarcasterMiniApp] Sign-in successful');
    return { success: true, ...result };
    
  } catch (error) {
    if (error.name === 'RejectedByUser') {
      console.log('[FarcasterMiniApp] Sign-in rejected by user');
      return { success: false, error: 'User rejected sign-in' };
    }
    console.error('[FarcasterMiniApp] Sign-in error:', error);
    return { success: false, error: error.message };
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
  
  try {
    const { token } = await window.FarcasterMiniApp.sdk.quickAuth.getToken();
    window.FarcasterMiniApp.authToken = token;
    
    // Store in sessionStorage for persistence during session
    sessionStorage.setItem('fc_auth_token', token);
    
    console.log('[FarcasterMiniApp] Quick Auth token obtained');
    return { success: true, token };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Quick Auth error:', error);
    return { success: false, error: error.message };
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
  
  try {
    const provider = await window.FarcasterMiniApp.sdk.wallet.getEthereumProvider();
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
    return { success: false, error: error.message };
  }
}

/**
 * Send token/ETH using Farcaster's native payment UI
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
    return { success: false, error: 'Not in Mini App environment' };
  }
  
  try {
    const params = {
      recipientAddress: recipientAddress,
      amount: amount
    };
    
    // Add optional parameters
    if (recipientFid) {
      params.recipientFid = recipientFid;
    }
    
    // For native ETH on Base: eip155:8453/slip44:60
    // For ERC20: eip155:8453/erc20:<contract_address>
    if (token) {
      params.token = token;
    }
    
    const result = await window.FarcasterMiniApp.sdk.actions.sendToken(params);
    
    if (result.success) {
      console.log('[FarcasterMiniApp] Token sent successfully:', result.send?.transaction);
      return { success: true, transaction: result.send?.transaction };
    } else {
      console.log('[FarcasterMiniApp] Token send failed:', result.reason, result.error);
      return { success: false, error: result.reason || result.error };
    }
    
  } catch (error) {
    if (error.name === 'RejectedByUser' || error.message?.includes('rejected')) {
      console.log('[FarcasterMiniApp] Token send rejected by user');
      return { success: false, error: 'User rejected transaction' };
    }
    console.error('[FarcasterMiniApp] Token send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send ETH via wallet provider (EIP-1193 fallback)
 * Use this if sendToken is not available
 */
async function sendEthViaProvider({ recipientAddress, amountWei }) {
  const provider = window.FarcasterMiniApp.walletProvider;
  const fromAddress = window.FarcasterMiniApp.walletAddress;
  
  if (!provider || !fromAddress) {
    // Try to connect wallet first
    const walletResult = await connectWallet();
    if (!walletResult.success) {
      return walletResult;
    }
  }
  
  try {
    const txHash = await window.FarcasterMiniApp.walletProvider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: window.FarcasterMiniApp.walletAddress,
        to: recipientAddress,
        value: '0x' + BigInt(amountWei).toString(16)
      }]
    });
    
    console.log('[FarcasterMiniApp] Transaction sent:', txHash);
    return { success: true, transaction: txHash };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Transaction error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compose and share a cast to Farcaster
 * 
 * @param {Object} options
 * @param {string} options.text - Cast text content
 * @param {Array<string>} options.embeds - URLs to embed (optional)
 */
async function composeCast({ text, embeds }) {
  if (!window.FarcasterMiniApp.isInMiniApp || !window.FarcasterMiniApp.sdk) {
    // Fallback for non-Mini App environment: copy to clipboard
    console.log('[FarcasterMiniApp] composeCast not available, using clipboard fallback');
    return copyToClipboardFallback(text, embeds);
  }
  
  try {
    const params = { text };
    
    if (embeds && embeds.length > 0) {
      params.embeds = embeds;
    }
    
    await window.FarcasterMiniApp.sdk.actions.composeCast(params);
    console.log('[FarcasterMiniApp] Cast composer opened');
    return { success: true };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] composeCast error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fallback: Copy share content to clipboard
 */
async function copyToClipboardFallback(text, embeds) {
  try {
    let shareText = text;
    if (embeds && embeds.length > 0) {
      shareText += '\n\n' + embeds.join('\n');
    }
    
    await navigator.clipboard.writeText(shareText);
    console.log('[FarcasterMiniApp] Share content copied to clipboard');
    return { success: true, fallback: 'clipboard' };
    
  } catch (error) {
    console.error('[FarcasterMiniApp] Clipboard fallback failed:', error);
    return { success: false, error: error.message };
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
  
  try {
    await window.FarcasterMiniApp.sdk.actions.openUrl({ url });
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
 * 
 * @param {string} size - 'small', 'medium', or 'large'
 */
async function sendTip(size = 'small') {
  const tipAmount = TIP_AMOUNTS[size];
  if (!tipAmount) {
    return { success: false, error: 'Invalid tip size' };
  }
  
  const amountWei = ethToWei(tipAmount.eth);
  
  // Try sendToken first (native Farcaster payment)
  if (window.FarcasterMiniApp.isInMiniApp && window.FarcasterMiniApp.sdk) {
    const result = await sendToken({
      recipientAddress: TIP_RECIPIENT,
      amount: amountWei
      // No token specified = native ETH on Base
    });
    
    if (result.success) {
      return result;
    }
    
    // If sendToken failed (but not rejected by user), try EIP-1193 fallback
    if (result.error !== 'User rejected transaction') {
      console.log('[FarcasterMiniApp] sendToken failed, trying EIP-1193 fallback');
      return await sendEthViaProvider({
        recipientAddress: TIP_RECIPIENT,
        amountWei: amountWei
      });
    }
    
    return result;
  }
  
  // Outside Mini App: try wallet provider fallback
  return await sendEthViaProvider({
    recipientAddress: TIP_RECIPIENT,
    amountWei: amountWei
  });
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFarcasterMiniApp);
} else {
  initFarcasterMiniApp();
}
