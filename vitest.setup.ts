/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import { server } from './src/test/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
