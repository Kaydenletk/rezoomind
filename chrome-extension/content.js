/**
 * Rezoomind Autofill - Content Script
 * Detects form fields on ATS pages and injects CandidateProfile data
 */

// Field mapping: maps common form field identifiers to CandidateProfile keys
const FIELD_MAP = {
     // Name fields
     firstName: ['first_name', 'firstname', 'first-name', 'fname', 'given_name', 'givenname', 'legalname_first'],
     lastName: ['last_name', 'lastname', 'last-name', 'lname', 'family_name', 'familyname', 'surname', 'legalname_last'],

     // Contact
     phone: ['phone', 'phonenumber', 'phone_number', 'mobile', 'telephone', 'cell', 'phone-number'],
     email: ['email', 'emailaddress', 'email_address', 'e-mail'],

     // Address
     addressLine1: ['address', 'street', 'addressline1', 'address_line_1', 'street_address', 'address1'],
     city: ['city', 'town'],
     state: ['state', 'province', 'region'],
     zipCode: ['zip', 'zipcode', 'zip_code', 'postal', 'postalcode', 'postal_code'],
     country: ['country', 'country_name'],

     // Links
     linkedinUrl: ['linkedin', 'linkedin_url', 'linkedinurl', 'linkedin_profile'],
     githubUrl: ['github', 'github_url', 'githuburl', 'github_profile'],
     portfolioUrl: ['portfolio', 'website', 'personal_website', 'portfolio_url', 'portfoliourl'],

     // Work authorization
     usWorkAuth: ['work_auth', 'authorized', 'work_authorization', 'legally_authorized', 'authorized_to_work'],
     requiresSponsorship: ['sponsorship', 'visa_sponsorship', 'require_sponsorship', 'sponsor'],

     // Demographics (optional)
     veteranStatus: ['veteran', 'veteran_status', 'protected_veteran'],
     disabilityStatus: ['disability', 'disability_status'],
     gender: ['gender', 'sex'],
     race: ['race', 'ethnicity', 'race_ethnicity'],
};

let profileData = null;
let autofillButton = null;

// Initialize: request profile data from background
async function init() {
     try {
          profileData = await sendMessage({ type: 'GET_PROFILE' });
          if (profileData && !profileData.error) {
               createAutofillButton();
          }
     } catch (err) {
          console.log('[Rezoomind] Not authenticated or profile unavailable');
     }
}

function sendMessage(message) {
     return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
               if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
               } else if (response?.error) {
                    reject(new Error(response.error));
               } else {
                    resolve(response);
               }
          });
     });
}

// Create floating autofill button
function createAutofillButton() {
     if (autofillButton) return;

     autofillButton = document.createElement('div');
     autofillButton.id = 'rezoomind-autofill-btn';
     autofillButton.innerHTML = `
    <div class="rezoomind-fab">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <span>Rezoomind Autofill</span>
    </div>
  `;

     autofillButton.addEventListener('click', performAutofill);
     document.body.appendChild(autofillButton);
}

// Find the best matching field identifier
function normalizeIdentifier(str) {
     return (str || '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();
}

function getFieldIdentifiers(element) {
     const identifiers = [];

     // Collect all possible identifiers
     const attrs = ['name', 'id', 'data-automation-id', 'data-testid', 'aria-label', 'placeholder', 'autocomplete'];
     for (const attr of attrs) {
          const val = element.getAttribute(attr);
          if (val) identifiers.push(normalizeIdentifier(val));
     }

     // Check associated label
     const id = element.id;
     if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) {
               identifiers.push(normalizeIdentifier(label.textContent));
          }
     }

     // Check parent label
     const parentLabel = element.closest('label');
     if (parentLabel) {
          identifiers.push(normalizeIdentifier(parentLabel.textContent));
     }

     // Check nearby label (previous sibling or wrapper)
     const wrapper = element.closest('[class*="field"], [class*="form-group"], [class*="input"]');
     if (wrapper) {
          const label = wrapper.querySelector('label, .label, [class*="label"]');
          if (label) {
               identifiers.push(normalizeIdentifier(label.textContent));
          }
     }

     return identifiers.filter(Boolean);
}

function findProfileKey(identifiers) {
     for (const [profileKey, patterns] of Object.entries(FIELD_MAP)) {
          for (const identifier of identifiers) {
               for (const pattern of patterns) {
                    if (identifier.includes(pattern)) {
                         return profileKey;
                    }
               }
          }
     }
     return null;
}

// Set value with proper event dispatching for React/Angular forms
function setFieldValue(element, value) {
     if (!value && value !== false) return false;

     const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
     )?.set;

     const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, 'value'
     )?.set;

     const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
     )?.set;

     const tagName = element.tagName.toLowerCase();
     const strValue = String(value);

     if (tagName === 'select') {
          // For select elements, try to find matching option
          const options = Array.from(element.options);
          const match = options.find((opt) => {
               const optText = opt.textContent.toLowerCase().trim();
               const optVal = opt.value.toLowerCase().trim();
               const target = strValue.toLowerCase().trim();
               return optText.includes(target) || optVal.includes(target) || target.includes(optText);
          });

          if (match) {
               if (nativeSelectValueSetter) {
                    nativeSelectValueSetter.call(element, match.value);
               } else {
                    element.value = match.value;
               }
          } else {
               return false;
          }
     } else if (element.type === 'checkbox' || element.type === 'radio') {
          const shouldCheck = value === true || value === 'Yes' || value === 'yes' || value === true;
          element.checked = shouldCheck;
     } else {
          // Text inputs and textareas
          const setter = tagName === 'textarea' ? nativeTextareaValueSetter : nativeInputValueSetter;
          if (setter) {
               setter.call(element, strValue);
          } else {
               element.value = strValue;
          }
     }

     // Dispatch events to trigger React/Angular/Vue change handlers
     element.dispatchEvent(new Event('input', { bubbles: true }));
     element.dispatchEvent(new Event('change', { bubbles: true }));
     element.dispatchEvent(new Event('blur', { bubbles: true }));

     return true;
}

// Perform autofill on all detected form fields
function performAutofill() {
     if (!profileData) {
          alert('Rezoomind: Please log in first via the extension popup.');
          return;
     }

     const inputs = document.querySelectorAll(
          'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'
     );

     let filledCount = 0;
     const filledFields = [];

     for (const input of inputs) {
          // Skip already filled fields
          if (input.value && input.value.trim().length > 0) continue;
          // Skip invisible fields
          if (input.offsetParent === null && input.type !== 'hidden') continue;

          const identifiers = getFieldIdentifiers(input);
          const profileKey = findProfileKey(identifiers);

          if (profileKey && profileData[profileKey] !== undefined && profileData[profileKey] !== null) {
               const success = setFieldValue(input, profileData[profileKey]);
               if (success) {
                    filledCount++;
                    filledFields.push(profileKey);

                    // Visual feedback: briefly highlight the field
                    input.style.transition = 'box-shadow 0.3s ease';
                    input.style.boxShadow = '0 0 0 2px #10b981';
                    setTimeout(() => {
                         input.style.boxShadow = '';
                    }, 2000);
               }
          }
     }

     // Show result notification
     showNotification(filledCount, filledFields);
}

function showNotification(count, fields) {
     const notification = document.createElement('div');
     notification.id = 'rezoomind-notification';
     notification.innerHTML = `
    <div class="rezoomind-toast">
      <strong>Rezoomind Autofill</strong>
      <p>${count > 0 ? `✅ Filled ${count} field${count > 1 ? 's' : ''}: ${fields.slice(0, 5).join(', ')}` : '⚠️ No matching fields found on this page'}</p>
    </div>
  `;
     document.body.appendChild(notification);

     setTimeout(() => {
          notification.remove();
     }, 4000);
}

// Run when page is ready
if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', init);
} else {
     init();
}

// Also re-check when page content changes (SPAs)
const observer = new MutationObserver(() => {
     if (!autofillButton && profileData) {
          createAutofillButton();
     }
});
observer.observe(document.body, { childList: true, subtree: true });
