interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

// In-memory tracking with automatic cleanup
const attemptsByIp = new Map<string, AttemptRecord>();
const attemptsByEmail = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block

export function checkLoginRateLimit(ip: string, email: string): { isAllowed: boolean; retryAfterSeconds?: number; remainingAttempts: number } {
  const now = Date.now();
  const cleanIp = ip || 'unknown_ip';
  const cleanEmail = email.toLowerCase().trim();

  // Check IP block
  const ipRec = attemptsByIp.get(cleanIp);
  if (ipRec && ipRec.blockedUntil && ipRec.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((ipRec.blockedUntil - now) / 1000);
    return { isAllowed: false, retryAfterSeconds, remainingAttempts: 0 };
  }

  // Check Email block
  const emailRec = attemptsByEmail.get(cleanEmail);
  if (emailRec && emailRec.blockedUntil && emailRec.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((emailRec.blockedUntil - now) / 1000);
    return { isAllowed: false, retryAfterSeconds, remainingAttempts: 0 };
  }

  // Calculate remaining attempts
  const currentAttempts = Math.max(
    ipRec && (now - ipRec.firstAttemptAt < WINDOW_MS) ? ipRec.count : 0,
    emailRec && (now - emailRec.firstAttemptAt < WINDOW_MS) ? emailRec.count : 0
  );

  return {
    isAllowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - currentAttempts)
  };
}

export function recordFailedLogin(ip: string, email: string): { remainingAttempts: number; isBlocked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const cleanIp = ip || 'unknown_ip';
  const cleanEmail = email.toLowerCase().trim();

  // Update IP record
  let ipRec = attemptsByIp.get(cleanIp);
  if (!ipRec || (now - ipRec.firstAttemptAt > WINDOW_MS)) {
    ipRec = { count: 1, firstAttemptAt: now, blockedUntil: null };
  } else {
    ipRec.count += 1;
  }

  if (ipRec.count >= MAX_ATTEMPTS) {
    ipRec.blockedUntil = now + BLOCK_DURATION_MS;
  }
  attemptsByIp.set(cleanIp, ipRec);

  // Update Email record
  let emailRec = attemptsByEmail.get(cleanEmail);
  if (!emailRec || (now - emailRec.firstAttemptAt > WINDOW_MS)) {
    emailRec = { count: 1, firstAttemptAt: now, blockedUntil: null };
  } else {
    emailRec.count += 1;
  }

  if (emailRec.count >= MAX_ATTEMPTS) {
    emailRec.blockedUntil = now + BLOCK_DURATION_MS;
  }
  attemptsByEmail.set(cleanEmail, emailRec);

  const highestCount = Math.max(ipRec.count, emailRec.count);
  const isBlocked = highestCount >= MAX_ATTEMPTS;

  return {
    isBlocked,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - highestCount),
    retryAfterSeconds: isBlocked ? Math.ceil(BLOCK_DURATION_MS / 1000) : undefined
  };
}

export function resetLoginAttempts(ip: string, email: string): void {
  const cleanIp = ip || 'unknown_ip';
  const cleanEmail = email.toLowerCase().trim();
  attemptsByIp.delete(cleanIp);
  attemptsByEmail.delete(cleanEmail);
}
