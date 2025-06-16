
/**
 * Cross-browser compatible MD5 hash implementation
 * Required for GP51 API authentication
 */

/**
 * Convert a 32-bit number to a hex string with zero-padding
 */
function toHex(n: number): string {
  let s = (n >>> 0).toString(16);
  return '00000000'.substring(0, 8 - s.length) + s;
}

/**
 * Convert a string to an array of little-endian 32-bit words
 */
function stringToWords(str: string): number[] {
  const words: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    words[i >> 2] |= code << ((i % 4) * 8);
  }
  return words;
}

/**
 * Left rotate a 32-bit number by n bits
 */
function rotateLeft(n: number, s: number): number {
  return (n << s) | (n >>> (32 - s));
}

/**
 * MD5 auxiliary functions
 */
function md5F(x: number, y: number, z: number): number {
  return (x & y) | (~x & z);
}

function md5G(x: number, y: number, z: number): number {
  return (x & z) | (y & ~z);
}

function md5H(x: number, y: number, z: number): number {
  return x ^ y ^ z;
}

function md5I(x: number, y: number, z: number): number {
  return y ^ (x | ~z);
}

/**
 * MD5 main transformation
 */
function md5Transform(a: number, b: number, c: number, d: number, x: number, s: number, t: number, func: (x: number, y: number, z: number) => number): number {
  return rotateLeft((a + func(b, c, d) + x + t) >>> 0, s) + b;
}

/**
 * Calculate MD5 hash of a string
 * Returns 32-character lowercase hexadecimal string
 * 
 * Test case: md5('Octopus360%') should return '9e023908f51272714a275466b033d526'
 */
export function md5(input: string): string {
  // Convert string to UTF-8 bytes
  const utf8Input = unescape(encodeURIComponent(input));
  
  // Initialize MD5 state
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  
  // Pre-processing: adding padding bits
  const msg = utf8Input + '\x80';
  const msgLen = msg.length;
  const paddedLen = msgLen + ((448 - (msgLen * 8) % 512 + 512) % 512) / 8;
  const padded = msg + '\x00'.repeat(paddedLen - msgLen);
  
  // Append original length in bits as 64-bit little-endian integer
  const bitLen = utf8Input.length * 8;
  const lengthBytes = [];
  for (let i = 0; i < 8; i++) {
    lengthBytes.push(String.fromCharCode((bitLen >>> (i * 8)) & 0xFF));
  }
  const finalMsg = padded + lengthBytes.join('');
  
  // Convert to 32-bit words
  const words = stringToWords(finalMsg);
  
  // Process message in 512-bit chunks
  for (let offset = 0; offset < words.length; offset += 16) {
    const chunk = words.slice(offset, offset + 16);
    
    let a = h0, b = h1, c = h2, d = h3;
    
    // Round 1
    const round1 = [
      [0, 7, 0xD76AA478], [1, 12, 0xE8C7B756], [2, 17, 0x242070DB], [3, 22, 0xC1BDCEEE],
      [4, 7, 0xF57C0FAF], [5, 12, 0x4787C62A], [6, 17, 0xA8304613], [7, 22, 0xFD469501],
      [8, 7, 0x698098D8], [9, 12, 0x8B44F7AF], [10, 17, 0xFFFF5BB1], [11, 22, 0x895CD7BE],
      [12, 7, 0x6B901122], [13, 12, 0xFD987193], [14, 17, 0xA679438E], [15, 22, 0x49B40821]
    ];
    
    for (const [i, s, t] of round1) {
      const temp = md5Transform(a, b, c, d, chunk[i] || 0, s, t, md5F);
      [a, b, c, d] = [d, temp, b, c];
    }
    
    // Round 2
    const round2 = [
      [1, 5, 0xF61E2562], [6, 9, 0xC040B340], [11, 14, 0x265E5A51], [0, 20, 0xE9B6C7AA],
      [5, 5, 0xD62F105D], [10, 9, 0x02441453], [15, 14, 0xD8A1E681], [4, 20, 0xE7D3FBC8],
      [9, 5, 0x21E1CDE6], [14, 9, 0xC33707D6], [3, 14, 0xF4D50D87], [8, 20, 0x455A14ED],
      [13, 5, 0xA9E3E905], [2, 9, 0xFCEFA3F8], [7, 14, 0x676F02D9], [12, 20, 0x8D2A4C8A]
    ];
    
    for (const [i, s, t] of round2) {
      const temp = md5Transform(a, b, c, d, chunk[i] || 0, s, t, md5G);
      [a, b, c, d] = [d, temp, b, c];
    }
    
    // Round 3
    const round3 = [
      [5, 4, 0xFFFA3942], [8, 11, 0x8771F681], [11, 16, 0x6D9D6122], [14, 23, 0xFDE5380C],
      [1, 4, 0xA4BEEA44], [4, 11, 0x4BDECFA9], [7, 16, 0xF6BB4B60], [10, 23, 0xBEBFBC70],
      [13, 4, 0x289B7EC6], [0, 11, 0xEAA127FA], [3, 16, 0xD4EF3085], [6, 23, 0x04881D05],
      [9, 4, 0xD9D4D039], [12, 11, 0xE6DB99E5], [15, 16, 0x1FA27CF8], [2, 23, 0xC4AC5665]
    ];
    
    for (const [i, s, t] of round3) {
      const temp = md5Transform(a, b, c, d, chunk[i] || 0, s, t, md5H);
      [a, b, c, d] = [d, temp, b, c];
    }
    
    // Round 4
    const round4 = [
      [0, 6, 0xF4292244], [7, 10, 0x432AFF97], [14, 15, 0xAB9423A7], [5, 21, 0xFC93A039],
      [12, 6, 0x655B59C3], [3, 10, 0x8F0CCC92], [10, 15, 0xFFEFF47D], [1, 21, 0x85845DD1],
      [8, 6, 0x6FA87E4F], [15, 10, 0xFE2CE6E0], [6, 15, 0xA3014314], [13, 21, 0x4E0811A1],
      [4, 6, 0xF7537E82], [11, 10, 0xBD3AF235], [2, 15, 0x2AD7D2BB], [9, 21, 0xEB86D391]
    ];
    
    for (const [i, s, t] of round4) {
      const temp = md5Transform(a, b, c, d, chunk[i] || 0, s, t, md5I);
      [a, b, c, d] = [d, temp, b, c];
    }
    
    // Add this chunk's hash to result
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
  }
  
  // Produce the final hash value as a 128-bit number (little-endian)
  return toHex(h0).substring(6, 8) + toHex(h0).substring(4, 6) + toHex(h0).substring(2, 4) + toHex(h0).substring(0, 2) +
         toHex(h1).substring(6, 8) + toHex(h1).substring(4, 6) + toHex(h1).substring(2, 4) + toHex(h1).substring(0, 2) +
         toHex(h2).substring(6, 8) + toHex(h2).substring(4, 6) + toHex(h2).substring(2, 4) + toHex(h2).substring(0, 2) +
         toHex(h3).substring(6, 8) + toHex(h3).substring(4, 6) + toHex(h3).substring(2, 4) + toHex(h3).substring(0, 2);
}

/**
 * Test the MD5 implementation
 * Should return true if working correctly
 */
export function testMD5(): boolean {
  const testPassword = 'Octopus360%';
  const expectedHash = '9e023908f51272714a275466b033d526';
  const actualHash = md5(testPassword);
  
  console.log(`MD5 Test: "${testPassword}" -> "${actualHash}"`);
  console.log(`Expected: "${expectedHash}"`);
  console.log(`Test ${actualHash === expectedHash ? 'PASSED' : 'FAILED'}`);
  
  return actualHash === expectedHash;
}
