
import md5 = require('js-md5');

/**
 * Calculates the MD5 hash of a string.
 * This is required for authenticating with the GP51 API.
 * The hash should be a 32-digit lowercase hexadecimal string.
 * For example, the MD5 hash of "Octopus360%" is "9e023908f51272714a275466b033d526".
 * @param input The string to hash.
 * @returns A 32-digit lowercase hexadecimal string.
 */
export function calculateMd5(input: string): string {
  return md5(input);
}
