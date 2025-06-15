
import md5 from 'js-md5';

/**
 * Calculates the MD5 hash of a string.
 * This is required for authenticating with the GP51 API.
 * The hash should be a 32-digit lowercase hexadecimal string.
 * For example, the MD5 hash of "Octopus360%" is "9e023908f51272714a275466b033d526".
 * @param input The string to hash.
 * @returns A 32-digit lowercase hexadecimal string.
 */
export function calculateMd5(input: string): string {
  // The 'js-md5' package is a CommonJS module. TypeScript's static analysis
  // sometimes struggles with the module's type when `esModuleInterop` is not set.
  // We cast `md5` to `any` to bypass the compile-time check, as Vite will
  // ensure it's a callable function at runtime.
  return (md5 as any)(input);
}
