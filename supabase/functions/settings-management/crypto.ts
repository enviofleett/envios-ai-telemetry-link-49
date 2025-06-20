
import { md5_for_gp51_only } from "../_shared/crypto_utils.ts";

export async function createHash(text: string): Promise<string> {
  console.log(`🔐 [CRYPTO] Hashing input of length: ${text.length} using proper MD5 implementation`);
  
  try {
    // Use the improved MD5 implementation for GP51 compatibility
    const hash = await md5_for_gp51_only(text);
    console.log(`✅ [CRYPTO] MD5 hash generated successfully: ${hash.substring(0, 8)}...`);
    return hash;
  } catch (error) {
    console.error('❌ [CRYPTO] Hashing failed via md5_for_gp51_only:', error);
    throw new Error('Input hashing failed using shared utility.');
  }
}
