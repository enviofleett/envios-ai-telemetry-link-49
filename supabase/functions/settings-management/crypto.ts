
// Proper MD5 implementation using Web Crypto API
export async function md5(input: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback for environments where Web Crypto MD5 isn't available
    const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
    const hash = createHash('md5');
    hash.update(input);
    return hash.digest('hex');
  }
}
