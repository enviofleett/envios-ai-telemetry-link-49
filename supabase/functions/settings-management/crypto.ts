
export async function createHash(input: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${input.length}`);
    
    // Use MD5 hashing like the working passwordless import function
    const md5Hash = await hashMD5(input);
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('Error creating hash:', error);
    throw new Error('Failed to hash password');
  }
}

export async function hashMD5(text: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${text.length}`);
    
    // Try Web Crypto API MD5 first
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const md5Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed, using fallback:', error);
    
    // Fallback MD5 implementation for environments where Web Crypto MD5 isn't available
    return await fallbackMD5Hash(text);
  }
}

async function fallbackMD5Hash(text: string): Promise<string> {
  // Import MD5 from a reliable source for Deno environment
  const { createHash } = await import('https://deno.land/std@0.168.0/node/crypto.ts');
  const hash = createHash('md5');
  hash.update(text);
  const md5Hash = hash.digest('hex');
  
  console.log('Fallback MD5 hash generated successfully');
  return md5Hash;
}
