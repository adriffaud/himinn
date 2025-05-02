/**
 * Creates a debounced version of a function that delays its execution
 * until after a specified time has elapsed since the last time it was invoked.
 *
 * @param {Function} funcToDebounce - The function to debounce.
 * @param {number} delayMs - The delay in milliseconds.
 * @returns {Function} A debounced function that will invoke the original function after the delay.
 */
export function debounce(funcToDebounce, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      funcToDebounce.apply(this, args);
    }, delayMs);
  };
}

/**
 * Formats a date object to display only the time in a locale-appropriate format.
 *
 * @param {Date} dateTime - The date object to format.
 * @returns {string} A string representation of the time in hours and minutes.
 */
export function formatTime(dateTime) {
  return dateTime.toLocaleTimeString(navigator.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A simple template literal tag for creating HTML strings.
 * Combines string literals with interpolated values.
 *
 * @param {string[]} strings - Array of string literals.
 * @param {...*} values - Interpolated values.
 * @returns {string} The resulting HTML string.
 */
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
}
