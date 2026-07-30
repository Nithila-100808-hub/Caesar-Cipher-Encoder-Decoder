/* ==========================================================================
   CAESAR CIPHER — SCRIPT.JS
   Handles: cipher logic, mode switching, validation, UI updates
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. GRAB REFERENCES TO ALL THE DOM ELEMENTS WE NEED
// ---------------------------------------------------------------------------
const inputText      = document.getElementById('inputText');
const outputText      = document.getElementById('outputText');
const shiftInput      = document.getElementById('shiftInput');
const shiftSlider     = document.getElementById('shiftSlider');
const processBtn      = document.getElementById('processBtn');
const processBtnLabel = document.getElementById('processBtnLabel');
const clearBtn        = document.getElementById('clearBtn');
const copyBtn         = document.getElementById('copyBtn');
const copyBtnLabel    = document.getElementById('copyBtnLabel');
const errorMessage    = document.getElementById('errorMessage');
const inputCounter    = document.getElementById('inputCounter');
const outputCounter   = document.getElementById('outputCounter');
const encodeModeBtn   = document.getElementById('encodeModeBtn');
const decodeModeBtn   = document.getElementById('decodeModeBtn');
const toast           = document.getElementById('toast');

// ---------------------------------------------------------------------------
// 2. APP STATE
// ---------------------------------------------------------------------------
// currentMode is either 'encode' or 'decode'. It decides which direction
// the letters get shifted in when the user clicks the process button.
let currentMode = 'encode';

// ---------------------------------------------------------------------------
// 3. CORE CIPHER LOGIC
// ---------------------------------------------------------------------------

/**
 * Shifts a single character by `shiftAmount` positions in the alphabet.
 * - Uppercase letters wrap within A-Z.
 * - Lowercase letters wrap within a-z.
 * - Anything else (numbers, spaces, punctuation) is returned unchanged.
 *
 * @param {string} character   - a single character to transform
 * @param {number} shiftAmount - how many positions to shift (already
 *                                normalised to a positive 0-25 value)
 * @returns {string} the shifted character
 */
function shiftCharacter(character, shiftAmount) {
  const charCode = character.charCodeAt(0);

  const UPPER_A = 65; // 'A'
  const UPPER_Z = 90; // 'Z'
  const LOWER_A = 97; // 'a'
  const LOWER_Z = 122; // 'z'
  const ALPHABET_LENGTH = 26;

  // Uppercase letters (A-Z)
  if (charCode >= UPPER_A && charCode <= UPPER_Z) {
    const shifted = ((charCode - UPPER_A + shiftAmount) % ALPHABET_LENGTH) + UPPER_A;
    return String.fromCharCode(shifted);
  }

  // Lowercase letters (a-z)
  if (charCode >= LOWER_A && charCode <= LOWER_Z) {
    const shifted = ((charCode - LOWER_A + shiftAmount) % ALPHABET_LENGTH) + LOWER_A;
    return String.fromCharCode(shifted);
  }

  // Numbers, spaces, punctuation, emoji, etc. — leave untouched
  return character;
}

/**
 * Runs the Caesar Cipher across an entire string.
 *
 * @param {string} text   - the full message to transform
 * @param {number} shift  - shift value from 1-25
 * @param {'encode'|'decode'} mode - direction of the shift
 * @returns {string} the transformed message
 */
function caesarCipher(text, shift, mode) {
  // Decoding is just encoding with the opposite shift.
  // We add ALPHABET_LENGTH before the modulo in shiftCharacter to avoid
  // ever working with a negative number.
  const ALPHABET_LENGTH = 26;
  const effectiveShift = mode === 'encode'
    ? shift
    : (ALPHABET_LENGTH - shift) % ALPHABET_LENGTH;

  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += shiftCharacter(text[i], effectiveShift);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 4. VALIDATION
// ---------------------------------------------------------------------------

/**
 * Validates the current input text and shift value.
 * Displays an inline error message if something is wrong.
 *
 * @returns {boolean} true if everything is valid, false otherwise
 */
function validateInputs() {
  const text = inputText.value;
  const shiftValue = shiftInput.value.trim();

  // Rule 1: message can't be empty
  if (text.length === 0) {
    showError('Please enter some text before processing.');
    return false;
  }

  // Rule 2: shift must be a number
  if (shiftValue === '' || isNaN(shiftValue)) {
    showError('Shift value must be a number.');
    return false;
  }

  const shiftNumber = Number(shiftValue);

  // Rule 3: shift must be a whole number
  if (!Number.isInteger(shiftNumber)) {
    showError('Shift value must be a whole number.');
    return false;
  }

  // Rule 4: shift must be within the 1-25 range
  if (shiftNumber < 1 || shiftNumber > 25) {
    showError('Shift value must be between 1 and 25.');
    return false;
  }

  // Everything checks out
  hideError();
  return true;
}

/** Displays an error message in the UI. */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
}

/** Hides the error message box. */
function hideError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('visible');
}

// ---------------------------------------------------------------------------
// 5. UI HELPERS
// ---------------------------------------------------------------------------

/** Updates the "X characters" counters under each textarea. */
function updateCounters() {
  inputCounter.textContent = `${inputText.value.length} character${inputText.value.length === 1 ? '' : 's'}`;
  outputCounter.textContent = `${outputText.value.length} character${outputText.value.length === 1 ? '' : 's'}`;
}

/** Keeps the number field and the range slider in sync with each other. */
function syncShiftControls(source) {
  if (source === 'input') {
    shiftSlider.value = shiftInput.value;
  } else {
    shiftInput.value = shiftSlider.value;
  }

  // Update the slider's filled-track custom property for the gradient
  const percent = ((shiftSlider.value - shiftSlider.min) / (shiftSlider.max - shiftSlider.min)) * 100;
  shiftSlider.style.setProperty('--fill', `${percent}%`);
}

/** Switches the active mode (encode/decode) and updates button styling + labels. */
function setMode(mode) {
  currentMode = mode;

  const isEncode = mode === 'encode';

  encodeModeBtn.classList.toggle('active', isEncode);
  decodeModeBtn.classList.toggle('active', !isEncode);
  encodeModeBtn.setAttribute('aria-selected', String(isEncode));
  decodeModeBtn.setAttribute('aria-selected', String(!isEncode));

  processBtnLabel.textContent = isEncode ? 'Encode' : 'Decode';
  inputText.placeholder = isEncode
    ? 'Type or paste your message here...'
    : 'Paste the ciphered text to decode...';

  hideError();
}

/** Shows a brief toast notification (used for the copy confirmation). */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

// ---------------------------------------------------------------------------
// 6. EVENT HANDLERS
// ---------------------------------------------------------------------------

/** Runs the cipher and writes the result into the output box. */
function handleProcessClick() {
  if (!validateInputs()) {
    outputText.value = '';
    updateCounters();
    return;
  }

  const shift = Number(shiftInput.value);
  const result = caesarCipher(inputText.value, shift, currentMode);

  outputText.value = result;
  updateCounters();
}

/** Clears both text areas, the error message, and resets the counters. */
function handleClearClick() {
  inputText.value = '';
  outputText.value = '';
  hideError();
  updateCounters();
  inputText.focus();
}

/** Copies the output text to the clipboard and gives visual confirmation. */
async function handleCopyClick() {
  if (!outputText.value) {
    showError('There is nothing to copy yet — process some text first.');
    return;
  }

  try {
    await navigator.clipboard.writeText(outputText.value);
  } catch (err) {
    // Fallback for browsers without Clipboard API support
    outputText.select();
    document.execCommand('copy');
  }

  copyBtnLabel.textContent = 'Copied!';
  copyBtn.classList.add('copied');
  showToast('Output copied to clipboard');

  setTimeout(() => {
    copyBtnLabel.textContent = 'Copy Output';
    copyBtn.classList.remove('copied');
  }, 1500);
}

// ---------------------------------------------------------------------------
// 7. WIRE UP EVENT LISTENERS
// ---------------------------------------------------------------------------
encodeModeBtn.addEventListener('click', () => setMode('encode'));
decodeModeBtn.addEventListener('click', () => setMode('decode'));

processBtn.addEventListener('click', handleProcessClick);
clearBtn.addEventListener('click', handleClearClick);
copyBtn.addEventListener('click', handleCopyClick);

inputText.addEventListener('input', updateCounters);
shiftInput.addEventListener('input', () => syncShiftControls('input'));
shiftSlider.addEventListener('input', () => syncShiftControls('slider'));

// Allow pressing "Enter" (without Shift) inside the input box to trigger processing
inputText.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleProcessClick();
  }
});

// ---------------------------------------------------------------------------
// 8. INITIALISE THE APP ON LOAD
// ---------------------------------------------------------------------------
syncShiftControls('input');
updateCounters();
setMode('encode');
