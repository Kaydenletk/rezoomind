/**
 * Rezoomind Autofill - Background Service Worker
 * Handles API communication and profile data caching
 */

const API_BASE = 'http://localhost:3000'; // Will be updated for production

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
     if (message.type === 'GET_PROFILE') {
          fetchProfile().then(sendResponse).catch((err) => {
               sendResponse({ error: err.message });
          });
          return true; // Keep channel open for async response
     }

     if (message.type === 'LOGIN') {
          login(message.email, message.password).then(sendResponse).catch((err) => {
               sendResponse({ error: err.message });
          });
          return true;
     }

     if (message.type === 'LOGOUT') {
          chrome.storage.local.remove(['authToken', 'profileCache'], () => {
               sendResponse({ ok: true });
          });
          return true;
     }

     if (message.type === 'CHECK_AUTH') {
          chrome.storage.local.get(['authToken'], (result) => {
               sendResponse({ authenticated: !!result.authToken });
          });
          return true;
     }
});

async function login(email, password) {
     const response = await fetch(`${API_BASE}/api/auth/extension-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
     });

     if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Login failed');
     }

     const { token } = await response.json();

     // Store the token
     await chrome.storage.local.set({ authToken: token });

     // Pre-fetch profile
     const profile = await fetchProfileFromAPI(token);
     await chrome.storage.local.set({ profileCache: profile });

     return { ok: true, profile };
}

async function fetchProfile() {
     // Check cache first
     const stored = await chrome.storage.local.get(['profileCache', 'authToken']);

     if (stored.profileCache) {
          return stored.profileCache;
     }

     if (!stored.authToken) {
          throw new Error('Not authenticated. Please log in via the extension popup.');
     }

     const profile = await fetchProfileFromAPI(stored.authToken);
     await chrome.storage.local.set({ profileCache: profile });
     return profile;
}

async function fetchProfileFromAPI(token) {
     const response = await fetch(`${API_BASE}/api/profile/autofill`, {
          headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
          },
     });

     if (!response.ok) {
          if (response.status === 401) {
               // Token expired, clear it
               await chrome.storage.local.remove(['authToken', 'profileCache']);
               throw new Error('Session expired. Please log in again.');
          }
          throw new Error('Failed to fetch profile data');
     }

     return response.json();
}
