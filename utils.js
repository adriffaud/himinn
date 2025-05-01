export function debounce(funcToDebounce, delayMs) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      funcToDebounce.apply(this, args);
    }, delayMs);
  };
}

export function formatTimeHHMM(dateTime) {
  return `${dateTime.getHours()}h${dateTime.getMinutes().toString().padStart(2, "0")}`;
}

export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || "");
  }, "");
}
