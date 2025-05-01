export function debounce(funcToDebounce, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      funcToDebounce.apply(this, args);
    }, delayMs);
  };
}

export function formatTime(dateTime) {
  return dateTime.toLocaleTimeString(navigator.language, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
}
