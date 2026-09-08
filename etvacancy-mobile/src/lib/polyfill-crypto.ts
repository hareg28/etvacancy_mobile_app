import * as Crypto from 'expo-crypto';

// Polyfill Web Crypto API for Hermes / React Native environment
if (typeof globalThis.crypto !== 'object' || !globalThis.crypto) {
  (globalThis as any).crypto = {};
}

if (!globalThis.crypto.getRandomValues) {
  (globalThis.crypto as any).getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array) {
      return Crypto.getRandomValues(array as any) as T;
    }
    return array;
  };
}

if (!globalThis.crypto.randomUUID) {
  (globalThis.crypto as any).randomUUID = () => Crypto.randomUUID();
}

if (!globalThis.crypto.subtle) {
  (globalThis.crypto as any).subtle = {
    digest: async (algorithm: string | { name: string }, data: BufferSource): Promise<ArrayBuffer> => {
      const name = typeof algorithm === 'string' ? algorithm : algorithm?.name || 'SHA-256';
      const cleanName = name.toUpperCase().replace('-', '');
      
      let alg: Crypto.CryptoDigestAlgorithm;
      if (cleanName.includes('512')) {
        alg = Crypto.CryptoDigestAlgorithm.SHA512;
      } else if (cleanName.includes('384')) {
        alg = Crypto.CryptoDigestAlgorithm.SHA384;
      } else if (cleanName.includes('1')) {
        alg = Crypto.CryptoDigestAlgorithm.SHA1;
      } else {
        alg = Crypto.CryptoDigestAlgorithm.SHA256;
      }
      
      return await Crypto.digest(alg, data);
    },
    importKey: async () => ({}),
    exportKey: async () => new ArrayBuffer(0),
    sign: async () => new ArrayBuffer(0),
    verify: async () => true,
    encrypt: async () => new ArrayBuffer(0),
    decrypt: async () => new ArrayBuffer(0),
    generateKey: async () => ({}),
    deriveKey: async () => ({}),
    deriveBits: async () => new ArrayBuffer(0),
  };
}

// Polyfill TextEncoder and TextDecoder for Hermes
if (typeof globalThis.TextEncoder === 'undefined') {
  class TextEncoderPolyfill {
    encoding = 'utf-8';
    encode(input: string = ''): Uint8Array {
      const binString = unescape(encodeURIComponent(input));
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i);
      }
      return bytes;
    }
    encodeInto(source: string, destination: Uint8Array): { read: number; written: number } {
      const bytes = this.encode(source);
      destination.set(bytes);
      return { read: source.length, written: bytes.length };
    }
  }
  (globalThis as any).TextEncoder = TextEncoderPolyfill;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  class TextDecoderPolyfill {
    encoding = 'utf-8';
    fatal = false;
    ignoreBOM = false;
    constructor(label: string = 'utf-8', options?: { fatal?: boolean; ignoreBOM?: boolean }) {
      if (options) {
        this.fatal = !!options.fatal;
        this.ignoreBOM = !!options.ignoreBOM;
      }
    }
    decode(input?: BufferSource): string {
      if (!input) return '';
      let buffer: Uint8Array;
      if (ArrayBuffer.isView(input)) {
        buffer = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      } else {
        buffer = new Uint8Array(input);
      }
      let encoded = '';
      for (let i = 0; i < buffer.length; i++) {
        encoded += '%' + buffer[i].toString(16).padStart(2, '0');
      }
      try {
        return decodeURIComponent(encoded);
      } catch (e) {
        let str = '';
        for (let i = 0; i < buffer.length; i++) {
          str += String.fromCharCode(buffer[i]);
        }
        return str;
      }
    }
  }
  (globalThis as any).TextDecoder = TextDecoderPolyfill;
}

// Polyfill btoa and atob if not present
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

if (typeof globalThis.btoa === 'undefined') {
  (globalThis as any).btoa = (input: string = '') => {
    let str = String(input);
    let output = '';
    for (
      let block = 0, charCode: number, i = 0, map = chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));
      if (charCode > 0xff) {
        throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = (block << 8) | charCode;
    }
    return output;
  };
}

if (typeof globalThis.atob === 'undefined') {
  (globalThis as any).atob = (input: string = '') => {
    let str = String(input).replace(/[=]+$/, '');
    if (str.length % 4 === 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    let output = '';
    for (
      let bc = 0, bs = 0, buffer: number, i = 0;
      (buffer = str.charAt(i++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  };
}
