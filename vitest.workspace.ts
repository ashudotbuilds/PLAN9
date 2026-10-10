import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*',
  'apps/*',
  {
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts']
    }
  }
]);
