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

export const DEFAULT_ALLOWED_IFRAME_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'dailymotion.com',
  'www.dailymotion.com',
  'twitch.tv',
  'player.twitch.tv',
  'facebook.com',
  'www.facebook.com',
  'stream.cloudflare.com',
  'cloudflarestream.com',
  'mediadelivery.net',
  'iframe.mediadelivery.net',
  'rumble.com',
  'kick.com',
  'player.kick.com',
  'wistia.com',
  'fast.wistia.net',
  'streamyard.com'
];

export interface IframeCodeValidationResult {
  isValid: boolean;
  error?: string;
  iframeUrl?: string;
  sanitizedCode?: string;
  hostname?: string;
}

/**
 * Validates external iframe embed code or URL, ensuring strict HTTPS, no scripts/HTML injection,
 * and checking against authorized streaming domains.
 */
export function validateIframeCode(
  rawInput: string,
  customAllowedDomains: string[] = []
): IframeCodeValidationResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Código HTML do iframe não informado.' };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, error: 'O código do iframe não pode estar vazio.' };
  }

  if (trimmed.length > 4096) {
    return { isValid: false, error: 'O código do iframe excede o limite máximo permitido de 4096 caracteres.' };
  }

  // 1. Strict Security Filter: Block script tags, object, embed, event handlers, javascript:, data: URIs
  const dangerousPatterns = [
    /<script\b/i,
    /<\/script>/i,
    /<object\b/i,
    /<embed\b/i,
    /<applet\b/i,
    /<meta\b/i,
    /<link\b/i,
    /<svg\b/i,
    /<img\b/i,
    /<form\b/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /\son\w+\s*=/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: 'Segurança Estrita: Scripts arbitrários, manipuladores de eventos (onload/onerror) e tags ativas não são permitidos. Insira exclusivamente uma tag <iframe> segura ou a URL HTTPS.'
      };
    }
  }

  // 2. Extract URL: Either from src="..." in an iframe tag OR directly if user pasted an HTTPS URL
  let extractedUrl: string | null = null;

  if (trimmed.startsWith('https://')) {
    extractedUrl = trimmed.split(/\s+/)[0];
  } else {
    if (!/<iframe\b/i.test(trimmed)) {
      return {
        isValid: false,
        error: 'O código informado não contém um elemento <iframe> válido nem uma URL direta HTTPS.'
      };
    }

    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) {
      return {
        isValid: false,
        error: 'Atributo "src" obrigatório não encontrado dentro da tag <iframe>.'
      };
    }
    extractedUrl = srcMatch[1].trim();
  }

  // 3. Validate HTTPS protocol
  if (!extractedUrl.startsWith('https://')) {
    return {
      isValid: false,
      error: 'O endereço do player externo deve utilizar estritamente o protocolo seguro HTTPS (https://).'
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(extractedUrl);
  } catch {
    return {
      isValid: false,
      error: 'O endereço informado no atributo src do iframe não é uma URL válida.'
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 4. Anti-SSRF check for internal/loopback IPs
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    return {
      isValid: false,
      error: 'Segurança Anti-SSRF: Não é permitido incorporar iframes de endereços locais, loopback ou metadados de nuvem.'
    };
  }

  // 5. Allowed Domains validation (Exact hostname matching - subdomains not implicitly granted)
  const allAllowedDomains = Array.from(
    new Set([
      ...DEFAULT_ALLOWED_IFRAME_DOMAINS.map(d => d.toLowerCase().trim()),
      ...customAllowedDomains.map(d => d.toLowerCase().trim())
    ])
  ).filter(Boolean);

  const isDomainAllowed = allAllowedDomains.some(allowed => {
    return hostname === allowed;
  });

  if (!isDomainAllowed) {
    return {
      isValid: false,
      error: `O domínio "${hostname}" não consta na lista de provedores de iframe autorizados pela administração. Adicione o domínio nas configurações ou utilize um provedor suportado.`,
      hostname
    };
  }

  // 6. Build canonical sanitized iframe code
  const sanitizedCode = `<iframe src="${extractedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen="true" frameborder="0" width="100%" height="100%"></iframe>`;

  return {
    isValid: true,
    iframeUrl: extractedUrl,
    sanitizedCode,
    hostname
  };
}

export interface DomainValidationResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validates a domain for authorization in the external iframe whitelist.
 * Enforces strict RFC 1123 hostname syntax, blocks wildcards, protocols, scripts, and private IPs.
 */
export function validateDomainInput(rawDomain: string): DomainValidationResult {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return { isValid: false, error: 'O domínio deve ser informado.' };
  }

  let clean = rawDomain.trim().toLowerCase();

  // Strip leading protocols if inadvertently pasted
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    clean = clean.replace(/^https?:\/\//, '');
  }

  // Strip trailing slashes, paths, query parameters or fragments
  clean = clean.split(/[/?#]/)[0].trim();

  // Strip port if present
  if (clean.includes(':')) {
    clean = clean.split(':')[0].trim();
  }

  if (!clean) {
    return { isValid: false, error: 'Domínio inválido ou em branco.' };
  }

  if (clean.length > 253) {
    return { isValid: false, error: 'O domínio excede o limite máximo de 253 caracteres.' };
  }

  // Prohibit wildcards and dangerous characters
  if (clean.includes('*') || clean.includes('%') || clean.includes('?') || clean.includes('<') || clean.includes('>')) {
    return { isValid: false, error: 'Curingas (*) ou caracteres especiais não são permitidos. Digite o hostname exato.' };
  }

  // Prohibit dangerous protocols
  if (clean.includes('javascript') || clean.includes('data:') || clean.includes('vbscript')) {
    return { isValid: false, error: 'Protocolos de script ou dados não são domínios válidos.' };
  }

  // Validate hostname format: must contain at least one dot, valid labels
  // Each label 1-63 chars, alphanumeric with hyphens, not starting or ending with hyphen
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  if (!domainRegex.test(clean)) {
    return { isValid: false, error: 'Formato de domínio inválido. Exemplo válido: sinalpublicoetv.vercel.app ou player.meuservidor.com' };
  }

  // Prohibit local / internal extensions
  if (
    clean.endsWith('.internal') ||
    clean.endsWith('.local') ||
    clean.endsWith('.localhost') ||
    clean.endsWith('.corp') ||
    clean.endsWith('.lan') ||
    clean.endsWith('.onion')
  ) {
    return { isValid: false, error: 'Domínios locais ou internos não são autorizados por razões de segurança.' };
  }

  // Prohibit blocked / private hostnames and IPs
  if (BLOCKED_HOSTNAMES.has(clean) || isPrivateIPv4(clean) || isPrivateIPv6(clean)) {
    return { isValid: false, error: 'Endereços de rede privada, loopback ou metadados de nuvem são estritamente bloqueados.' };
  }

  return {
    isValid: true,
    normalized: clean
  };
}
