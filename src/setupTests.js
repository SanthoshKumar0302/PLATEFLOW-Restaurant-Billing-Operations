import '@testing-library/jest-dom';

// Polyfill window.print if not implemented in jsdom
if (typeof window !== 'undefined' && !window.print) {
  window.print = () => {};
}
