
import { MD5 } from "https://deno.land/x/checksum@1.4.0/mod.ts";

export function createHash(text: string): string {
  console.log(`Hashing password of length: ${text.length}`);
  
  try {
    const md5Hash = new MD5().update(text).toString();
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}
