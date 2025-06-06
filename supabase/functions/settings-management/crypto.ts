
export async function createHash(input: string): Promise<string> {
  try {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Use SHA-256 instead of MD5 (Web Crypto API doesn't support MD5)
    // If GP51 specifically requires MD5, we might need to implement a custom MD5 function
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Password hashed successfully using SHA-256');
    return hashHex;
  } catch (error) {
    console.error('Error creating hash:', error);
    throw new Error('Failed to hash password');
  }
}
