/**
 * Gato Net - Security & Anti-SSRF Stream URL Validation
 * Proteção contra Server-Side Request Forgery e verificação de protocolos permitidos.
 */

const ALLOWED_PROTOCOLS = new Set([
  'http:',
  'https:',
  'rtmp:',
  'rtmps:',
  'hls:',
  'udp:'
]);

// Blocked private, loopback, and cloud metadata hostnames & IPs
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  '169.254.169.254', // AWS / GCP / Cloud metadata
  '169.254.169.253',
  'metadata.google.internal',
  'metadata',
  'kubernetes.default',
  'kubernetes.default.svc'
]);

/**
 * Checks if an IPv4 address is within private / reserved IP ranges (RFC 1918, RFC 3927, RFC 5735)
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16 - 172.31)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & Cloud Metadata)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  return false;
}

/**
 * Checks if an IPv6 is loopback or link-local/site-local
 */
function isPrivateIPv6(host: string): boolean {
  const clean = host.replace(/[\[\]]/g, '').toLowerCase();
  if (clean === '::1' || clean === '::') return true;
  if (clean.startsWith('fe80:')) return true; // link-local
  if (clean.startsWith('fc00:') || clean.startsWith('fd00:')) return true; // unique local
  return false;
}

export interface StreamUrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates a stream URL for safe storage and future playback/transcoding requests
 */
export function validateStreamUrl(urlStr: string): StreamUrlValidationResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isValid: false, error: 'URL da transmissão não informada' };
  }

  const trimmed = urlStr.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'A URL informada excede o limite máximo de 2048 caracteres' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    return { isValid: false, error: 'Formato de URL inválido. Certifique-se de incluir http://, https:// ou rtmp://' };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    return {
      isValid: false,
      error: `Protocolo "${protocol}" não permitido. Utilize apenas http, https, rtmp, rtmps, hls ou udp`
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check explicit blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      isValid: false,
      error: 'Segurança Anti-SSRF: Não é permitido cadastrar transmissões apontando para localhost, loopback ou metadados de nuvem'
    };
  }

  // Check internal domain extensions
  if (
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.corp') ||
    hostname.endsWith('.lan')
  ) {
    return {
      isValid: false,
      error: 'Segurança Anti-SSRF: Não é permitido cadastrar domínios internos ou de rede local'
    };
  }

  // Check private IP ranges
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    return {
      isValid: false,
      error: 'Segurança Anti-SSRF: Endereços IP privados (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16) são bloqueados'
    };
  }

  return {
    isValid: true,
    normalizedUrl: trimmed
  };
}
