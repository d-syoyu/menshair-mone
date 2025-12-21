// vitest.setup.ts
// Global test setup for Vitest

import { vi } from 'vitest';

// Mock environment variables
process.env.RESEND_API_KEY = 'test_resend_api_key';
process.env.NEXT_PUBLIC_SITE_URL = 'https://mone0601.com';

// Mock Resend - using a class mock
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
      };
    },
  };
});
