import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './crypto';

describe('worker crypto helpers', () => {
  it('hashes passwords with salted sha256 and verifies correctly', async () => {
    const hash = await hashPassword('MySecretPass123!');
    expect(hash.startsWith('sha256$')).toBe(true);
    expect(await verifyPassword('MySecretPass123!', hash)).toBe(true);
    expect(await verifyPassword('WrongPass', hash)).toBe(false);
  });

  it('supports legacy plaintext verification', async () => {
    expect(await verifyPassword('legacyKey', 'legacyKey')).toBe(true);
    expect(await verifyPassword('otherKey', 'legacyKey')).toBe(false);
  });
});
