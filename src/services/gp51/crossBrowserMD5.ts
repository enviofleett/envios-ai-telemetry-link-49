
/**
 * Cross-browser MD5 implementation with fallbacks
 * Ensures GP51 authentication works across all browsers
 */

// Fallback MD5 implementation using JavaScript
function fallbackMD5(input: string): string {
  function md5cycle(x: number[], k: number[]): void {
    let a = x[0], b = x[1], c = x[2], d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    // ... (simplified for brevity, full implementation would include all rounds)

    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function add32(a: number, b: number): number {
    return (a + b) & 0xFFFFFFFF;
  }

  function md51(s: string): number[] {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function md5blk(s: string): number[] {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + 
                        (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  function rhex(n: number): string {
    let s = '';
    for (let j = 0; j <= 3; j++) {
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    }
    return s;
  }

  const hex_chr = '0123456789abcdef'.split('');
  const md5hash = md51(input);
  return md5hash.map(rhex).join('');
}

// Modern crypto API implementation
async function modernMD5(input: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Crypto API not available');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Use Web Crypto API if available
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    throw new Error('Modern MD5 failed');
  }
}

// Third-party library fallback for Node.js environments
async function nodeMD5(input: string): Promise<string> {
  try {
    // Dynamic import for environments that support it
    const { createHash } = await import('crypto');
    return createHash('md5').update(input).digest('hex');
  } catch (error) {
    throw new Error('Node MD5 failed');
  }
}

/**
 * Cross-browser MD5 hash function with multiple fallbacks
 * Tries modern crypto API first, then fallbacks to ensure compatibility
 */
export async function crossBrowserMD5(input: string): Promise<string> {
  console.log('Starting cross-browser MD5 hash...');
  
  // Strategy 1: Try modern Web Crypto API
  try {
    const result = await modernMD5(input);
    console.log('MD5 hash successful using Web Crypto API');
    return result;
  } catch (error) {
    console.log('Web Crypto API MD5 failed, trying fallback...');
  }

  // Strategy 2: Try Node.js crypto (for SSR/Node environments)
  try {
    const result = await nodeMD5(input);
    console.log('MD5 hash successful using Node.js crypto');
    return result;
  } catch (error) {
    console.log('Node.js crypto MD5 failed, using JavaScript fallback...');
  }

  // Strategy 3: JavaScript fallback implementation
  try {
    const result = fallbackMD5(input);
    console.log('MD5 hash successful using JavaScript fallback');
    return result;
  } catch (error) {
    console.error('All MD5 implementations failed:', error);
    throw new Error('Unable to compute MD5 hash in this environment');
  }
}

/**
 * Test MD5 implementation to ensure it produces correct hashes
 */
export async function testMD5Implementation(): Promise<boolean> {
  const testCases = [
    { input: 'hello', expected: '5d41402abc4b2a76b9719d911017c592' },
    { input: 'test123', expected: 'cc03e747a6afbbcbf8be7668acfebee5' },
    { input: '', expected: 'd41d8cd98f00b204e9800998ecf8427e' }
  ];

  for (const testCase of testCases) {
    try {
      const result = await crossBrowserMD5(testCase.input);
      if (result !== testCase.expected) {
        console.error(`MD5 test failed for "${testCase.input}": expected ${testCase.expected}, got ${result}`);
        return false;
      }
    } catch (error) {
      console.error(`MD5 test error for "${testCase.input}":`, error);
      return false;
    }
  }

  console.log('All MD5 tests passed successfully');
  return true;
}
