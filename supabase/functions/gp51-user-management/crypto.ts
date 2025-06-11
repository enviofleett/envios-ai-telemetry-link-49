
import { createHash } from "https://deno.land/std@0.208.0/hash/mod.ts";

export function createHash(text: string): string {
  console.log(`Hashing password of length: ${text.length}`);
  
  try {
    const hash = createHash('md5');
    hash.update(text);
    const md5Hash = hash.toString();
    
    console.log('MD5 hash generated successfully');
    return md5Hash;
    
  } catch (error) {
    console.error('MD5 hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}
