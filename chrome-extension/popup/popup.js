/**
 * Rezoomind Autofill - Popup Script
 * Handles login/logout and displays connection status
 */

const loginSection = document.getElementById('loginSection');
const profileSection = document.getElementById('profileSection');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const errorEl = document.getElementById('error');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Check auth status on popup open
chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
     if (response?.authenticated) {
          showConnected();
     } else {
          showDisconnected();
     }
});

// Login handler
loginBtn.addEventListener('click', async () => {
     const email = emailInput.value.trim();
     const password = passwordInput.value;

     if (!email || !password) {
          showError('Please enter your email and password.');
          return;
     }

     loginBtn.textContent = 'Connecting...';
     loginBtn.disabled = true;
     hideError();

     chrome.runtime.sendMessage(
          { type: 'LOGIN', email, password },
          (response) => {
               loginBtn.textContent = 'Connect Account';
               loginBtn.disabled = false;

               if (response?.error) {
                    showError(response.error);
               } else if (response?.ok) {
                    showConnected();
               } else {
                    showError('Connection failed. Please try again.');
               }
          }
     );
});

// Logout handler
logoutBtn.addEventListener('click', () => {
     chrome.runtime.sendMessage({ type: 'LOGOUT' }, () => {
          showDisconnected();
     });
});

// Enter key to submit
passwordInput.addEventListener('keydown', (e) => {
     if (e.key === 'Enter') loginBtn.click();
});

function showConnected() {
     loginSection.classList.add('hidden');
     profileSection.classList.remove('hidden');
     statusDot.className = 'status-dot connected';
     statusText.textContent = 'Connected to Rezoomind';
}

function showDisconnected() {
     loginSection.classList.remove('hidden');
     profileSection.classList.add('hidden');
     statusDot.className = 'status-dot disconnected';
     statusText.textContent = 'Not connected';
     emailInput.value = '';
     passwordInput.value = '';
}

function showError(message) {
     errorEl.textContent = message;
     errorEl.style.display = 'block';
}

function hideError() {
     errorEl.style.display = 'none';
}
