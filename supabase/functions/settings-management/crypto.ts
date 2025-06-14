import { md5_sync } from "../../_shared/crypto_utils.ts"; // Import shared utility

export function createHash(text: string): string {
  console.log(`Hashing input of length: ${text.length} using shared md5_sync.`);
  
  try {
    const hash = md5_sync(text);
    console.log('Hash generated successfully via md5_sync.');
    return hash;
  } catch (error) {
    console.error('Hashing failed via md5_sync:', error);
    // This path should ideally not be reached if md5_sync is robust.
    // If md5_sync can throw, this error handling is relevant.
    // Otherwise, if md5_sync is guaranteed not to throw for valid string inputs,
    // this try-catch might be simplified or removed.
    // For now, keeping it for safety.
    throw new Error('Input hashing failed using shared utility.');
  }
}
