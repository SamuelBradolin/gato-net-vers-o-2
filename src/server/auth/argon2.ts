import { argon2id } from 'hash-wasm';
import crypto from 'crypto';

export interface Argon2Params {
  iterations: number;  // time cost
  memorySize: number;  // memory cost in KB (64MB = 65536)
  parallelism: number; // threads
  hashLength: number;  // output bytes
}

const DEFAULT_PARAMS: Argon2Params = {
  iterations: 3,
  memorySize: 65536, // 64 MB
  parallelism: 1,
  hashLength: 32
};

/**
 * Hashes a password using Argon2id with cryptographic salt.
 * Formats output as: $argon2id$v=19$m=<mem>,t=<iter>,p=<par>$<salt_hex>$<hash_hex>
 */
export async function hashPassword(password: string, customParams?: Partial<Argon2Params>): Promise<string> {
  const params: Argon2Params = { ...DEFAULT_PARAMS, ...customParams };
  const salt = crypto.randomBytes(16);

  const hashHex = await argon2id({
    password,
    salt,
    iterations: params.iterations,
    memorySize: params.memorySize,
    parallelism: params.parallelism,
    hashLength: params.hashLength,
    outputType: 'hex'
  });

  const saltHex = salt.toString('hex');
  return `$argon2id$v=19$m=${params.memorySize},t=${params.iterations},p=${params.parallelism}$${saltHex}$${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored Argon2id hash using constant-time comparison.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!storedHash || !storedHash.startsWith('$argon2id$')) {
      return false;
    }

    const parts = storedHash.split('$');
    // Format: ["", "argon2id", "v=19", "m=65536,t=3,p=1", "<saltHex>", "<hashHex>"]
    if (parts.length < 6) {
      return false;
    }

    const paramStr = parts[3]; // e.g. "m=65536,t=3,p=1"
    const saltHex = parts[4];
    const originalHashHex = parts[5];

    let memorySize = DEFAULT_PARAMS.memorySize;
    let iterations = DEFAULT_PARAMS.iterations;
    let parallelism = DEFAULT_PARAMS.parallelism;

    paramStr.split(',').forEach((param) => {
      const [key, val] = param.split('=');
      const numVal = parseInt(val, 10);
      if (key === 'm' && !isNaN(numVal)) memorySize = numVal;
      if (key === 't' && !isNaN(numVal)) iterations = numVal;
      if (key === 'p' && !isNaN(numVal)) parallelism = numVal;
    });

    const salt = Buffer.from(saltHex, 'hex');
    const hashLength = originalHashHex.length / 2;

    const computedHashHex = await argon2id({
      password,
      salt,
      iterations,
      memorySize,
      parallelism,
      hashLength,
      outputType: 'hex'
    });

    const originalBuf = Buffer.from(originalHashHex, 'hex');
    const computedBuf = Buffer.from(computedHashHex, 'hex');

    if (originalBuf.length !== computedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(originalBuf, computedBuf);
  } catch (err) {
    console.error('[Auth/Argon2id] Error verifying password hash:', err);
    return false;
  }
}
