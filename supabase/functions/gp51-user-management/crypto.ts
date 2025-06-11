
export async function createHash(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Use Web Crypto API for MD5 hashing in Deno environment
    const { createHash } = await import('https://deno.land/std@0.208.0/node/crypto.ts');
    const hash = createHash('md5');
    hash.update(text);
    const md5Hash = hash.digest('hex');
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    
    // Fallback to manual MD5 implementation
    try {
      const md5 = await import("https://deno.land/x/md5@v1.0.3/mod.ts");
      const hash = md5.createHash("md5");
      hash.update(text);
      const md5Hash = hash.toString();
      
      console.log('MD5 hash generated using fallback method');
      return md5Hash;
    } catch (fallbackError) {
      console.error('MD5 fallback also failed:', fallbackError);
      throw new Error('Password hashing failed with both primary and fallback methods');
    }
  }
}
