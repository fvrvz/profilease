export async function hashPassword(plain: string): Promise<string> {
  const saltBytes = new Uint8Array(12);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${plain}`));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256$${salt}$${hex}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (!stored.startsWith('sha256$')) {
    return stored === plain;
  }
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${plain}`));
  const actualHex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return actualHex === expectedHex;
}
