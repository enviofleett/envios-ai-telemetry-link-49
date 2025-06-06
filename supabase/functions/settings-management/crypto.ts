
export async function createHash(input: string): Promise<string> {
  try {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Create MD5 hash
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error creating hash:', error);
    throw new Error('Failed to hash password');
  }
}
