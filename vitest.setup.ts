/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import { server } from './src/test/mocks/server';

// Radix UI 테스트용 브라우저 API 목
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

Element.prototype.scrollIntoView = () => {};
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {};
Element.prototype.releasePointerCapture = () => {};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
