
import { md5 } from "https://deno.land/std@0.208.0/hash/md5.ts";

export function createHash(text: string): string {
  console.log(`Hashing password of length: ${text.length}`);
  
  try {
    const md5Hash = md5(text);
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}
