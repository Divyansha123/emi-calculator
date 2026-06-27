/**
 * script.js — EMI Calculator Logic
 * Author  : Divyansha Sharma
 * Email   : sharmagun685@gmail.com
 *
 * Formula : EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
 *   Where  :
 *     P = Principal (Loan Amount)
 *     R = Monthly Interest Rate = (Annual Rate / 12 / 100)
 *     N = Total Number of Months = (Years × 12)
 */

/* ============================================================
   1.  DOM ELEMENT REFERENCES
   ============================================================ */
const form              = document.getElementById('emiForm');
const loanAmountInput   = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanDurationInput = document.getElementById('loanDuration');
const calculateBtn      = document.getElementById('calculateBtn');
const resetBtn          = document.getElementById('resetBtn');

const errorBox          = document.getElementById('errorBox');
const errorMessage      = document.getElementById('errorMessage');

const resultsSection    = document.getElementById('resultsSection');
const emiResult         = document.getElementById('emiResult');
const totalPaymentResult= document.getElementById('totalPaymentResult');
const totalInterestResult= document.getElementById('totalInterestResult');

const barPrincipal      = document.getElementById('barPrincipal');
const barInterest       = document.getElementById('barInterest');


/* ============================================================
   2.  UTILITY: FORMAT NUMBER AS INDIAN CURRENCY (₹X,XX,XXX.XX)
   ============================================================ */

/**
 * Formats a number into Indian currency notation.
 *  e.g. 123456.78  →  "₹1,23,456.78"
 *
 * @param {number} amount  The numeric value to format
 * @returns {string}       Formatted string with ₹ prefix
 */
function formatIndianCurrency(amount) {
  // Split into integer and decimal parts
  const [intPart, decPart] = amount.toFixed(2).split('.');

  // Apply Indian grouping: last 3 digits, then groups of 2
  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);

  const formatted = remaining
    ? remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;

  return `₹${formatted}.${decPart}`;
}


/* ============================================================
   3.  UTILITY: SHOW / HIDE ERROR BOX
   ============================================================ */

/**
 * Shows the error box with a custom message.
 * @param {string} msg  Error message text
 */
function showError(msg) {
  errorMessage.textContent = msg;
  errorBox.classList.add('visible');

  // Auto-dismiss after 4 seconds
  clearTimeout(showError._timer);
  showError._timer = setTimeout(hideError, 4000);
}

/** Hides the error box. */
function hideError() {
  errorBox.classList.remove('visible');
}


/* ============================================================
   4.  UTILITY: SHOW / HIDE RESULTS SECTION
   ============================================================ */

/** Reveals the results section with animation. */
function showResults() {
  resultsSection.classList.add('visible');
}

/** Hides the results section. */
function hideResults() {
  resultsSection.classList.remove('visible');
}


/* ============================================================
   5.  INPUT VALIDATION
   ============================================================ */

/**
 * Reads and validates all three inputs.
 * Returns an object with { isValid, P, annualRate, years, N, R }.
 */
function validateInputs() {
  const P         = parseFloat(loanAmountInput.value);
  const annualRate= parseFloat(interestRateInput.value);
  const years     = parseFloat(loanDurationInput.value);

  // Check for empty / non-numeric
  if (
    loanAmountInput.value.trim() === '' ||
    interestRateInput.value.trim() === '' ||
    loanDurationInput.value.trim() === ''
  ) {
    return { isValid: false, msg: 'All fields are required. Please fill in every field.' };
  }

  // Check for NaN (should not occur after above, but safety net)
  if (isNaN(P) || isNaN(annualRate) || isNaN(years)) {
    return { isValid: false, msg: 'Invalid input detected. Please enter numeric values only.' };
  }

  // Check for zero or negative
  if (P <= 0) {
    return { isValid: false, msg: 'Loan Amount must be greater than ₹0.' };
  }
  if (annualRate <= 0) {
    return { isValid: false, msg: 'Interest Rate must be greater than 0%.' };
  }
  if (years <= 0 || !Number.isInteger(years)) {
    return { isValid: false, msg: 'Loan Duration must be a positive whole number (e.g. 1, 5, 20).' };
  }

  // Cap at reasonable limits
  if (P > 1_000_000_000) {
    return { isValid: false, msg: 'Loan Amount seems unrealistically large. Please enter a valid amount.' };
  }
  if (annualRate > 100) {
    return { isValid: false, msg: 'Interest Rate cannot exceed 100%. Please enter a valid rate.' };
  }
  if (years > 50) {
    return { isValid: false, msg: 'Loan Duration cannot exceed 50 years.' };
  }

  // Derived values
  const R = annualRate / 12 / 100; // Monthly interest rate
  const N = years * 12;            // Total months

  return { isValid: true, P, annualRate, years, N, R };
}


/* ============================================================
   6.  EMI CALCULATION
   ============================================================ */

/**
 * Computes EMI, Total Payment, and Total Interest.
 *
 * Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
 *
 * @param {number} P  Principal amount
 * @param {number} R  Monthly interest rate (decimal)
 * @param {number} N  Number of months
 * @returns {{ emi: number, totalPayment: number, totalInterest: number }}
 */
function calculateEMI(P, R, N) {
  const onePlusR_toN = Math.pow(1 + R, N);       // (1+R)^N
  const emi = (P * R * onePlusR_toN) / (onePlusR_toN - 1);
  const totalPayment  = emi * N;
  const totalInterest = totalPayment - P;

  return { emi, totalPayment, totalInterest };
}


/* ============================================================
   7.  UPDATE UI WITH RESULTS
   ============================================================ */

/**
 * Populates the result cards and breakdown bar.
 *
 * @param {number} P             Loan principal
 * @param {number} emi           Monthly EMI
 * @param {number} totalPayment  Total amount to be paid
 * @param {number} totalInterest Total interest charged
 */
function displayResults(P, emi, totalPayment, totalInterest) {
  // Format and inject values
  emiResult.textContent          = formatIndianCurrency(emi);
  totalPaymentResult.textContent = formatIndianCurrency(totalPayment);
  totalInterestResult.textContent= formatIndianCurrency(totalInterest);

  // Compute bar widths as percentages
  const principalPct = (P / totalPayment) * 100;
  const interestPct  = (totalInterest / totalPayment) * 100;

  barPrincipal.style.width = principalPct.toFixed(2) + '%';
  barInterest.style.width  = interestPct.toFixed(2) + '%';

  showResults();
}


/* ============================================================
   8.  FORM SUBMIT HANDLER
   ============================================================ */
form.addEventListener('submit', function (event) {
  event.preventDefault(); // Stop native form submission
  hideError();

  const validation = validateInputs();

  if (!validation.isValid) {
    showError(validation.msg);
    return;
  }

  const { P, N, R } = validation;
  const { emi, totalPayment, totalInterest } = calculateEMI(P, R, N);

  displayResults(P, emi, totalPayment, totalInterest);
});


/* ============================================================
   9.  RESET BUTTON HANDLER
   ============================================================ */
resetBtn.addEventListener('click', function () {
  // Clear all input fields
  loanAmountInput.value    = '';
  interestRateInput.value  = '';
  loanDurationInput.value  = '';

  // Reset result values
  emiResult.textContent           = '₹0';
  totalPaymentResult.textContent  = '₹0';
  totalInterestResult.textContent = '₹0';

  // Reset breakdown bar
  barPrincipal.style.width = '0%';
  barInterest.style.width  = '0%';

  // Hide results and error
  hideResults();
  hideError();

  // Focus back on first input for convenience
  loanAmountInput.focus();
});


/* ============================================================
   10. LIVE VALIDATION FEEDBACK (optional UX enhancement)
      Highlights input border red if user types a negative/zero value
   ============================================================ */
[loanAmountInput, interestRateInput, loanDurationInput].forEach(function (input) {
  input.addEventListener('input', function () {
    const val = parseFloat(this.value);
    if (this.value !== '' && (isNaN(val) || val <= 0)) {
      this.style.borderColor = 'rgba(239, 68, 68, 0.6)';
    } else {
      this.style.borderColor = '';  // Revert to CSS default
    }
  });
});
