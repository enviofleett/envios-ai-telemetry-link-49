
export async function createHash(input: string): Promise<string> {
  try {
    console.log(`Hashing password of length: ${input.length}`);
    
    // Use MD5 hashing like the working passwordless import function for GP51 compatibility
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

// GP51-compatible password hashing function
export async function createGP51CompatibleHash(password: string): Promise<string> {
  console.log('Creating GP51-compatible password hash');
  return await hashMD5(password);
}

// For internal use, we can still use secure hashing when not interfacing with GP51
export async function createSecureHash(input: string): Promise<string> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(input + saltHex);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${saltHex}:${hashHex}`;
  } catch (error) {
    console.error('Secure hashing failed:', error);
    throw new Error('Failed to create secure hash');
  }
}
