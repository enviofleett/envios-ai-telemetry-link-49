
import { md5_for_gp51_only } from "../_shared/crypto_utils.ts";

export function createHash(text: string): string {
  console.log(`Hashing input of length: ${text.length} using GP51 compatible hash.`);
  
  try {
    // Use GP51-only hash for legacy compatibility
    const hash = md5_for_gp51_only(text);
    console.log('Hash generated successfully via md5_for_gp51_only.');
    return hash;
  } catch (error) {
    console.error('Hashing failed via md5_for_gp51_only:', error);
    throw new Error('Input hashing failed using shared utility.');
  }
}
