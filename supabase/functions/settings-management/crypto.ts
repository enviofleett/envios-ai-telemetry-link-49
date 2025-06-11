
export async function createHash(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Use Node.js compatible crypto for Deno environment
    const { createHash } = await import('https://deno.land/std@0.208.0/node/crypto.ts');
    const hash = createHash('md5');
    hash.update(text);
    const md5Hash = hash.digest('hex');
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}
