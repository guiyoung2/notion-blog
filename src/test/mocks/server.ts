import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSW Node 서버 (테스트 환경용)
export const server = setupServer(...handlers);
