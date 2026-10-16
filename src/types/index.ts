/**
 * Gato Net - Core TypeScript Definitions
 * Architectural data model prepared for future PostgreSQL integration on Virtarix VPS
 */

export type AccessMode = 'free' | 'free_registered' | 'subscription';

export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  iconName: string;
  channelCount?: number;
}

export interface StreamSource {
  id: string;
  channelId: string;
  name: string;
  protocol: 'HLS' | 'RTMP' | 'MP4' | 'DASH';
  url: string;
  isPrimary: boolean;
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  bitrateKbps: number;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  categoryId: string;
  categoryName: string;
  logo: string;
  streamUrl: string;
  alternativeStreams: string[];
  resolution: '4K' | '1080p' | '720p';
  aspectRatio: '16:9' | '4:3';
  currentProgram: string;
  currentProgramTime: string;
  nextProgram?: string;
  isLive: boolean;
  isLocked: boolean; // Accessible only in paid subscription mode
  featured?: boolean;
  description: string;
  backupImage: string;
}

export interface UserSubscriber {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  createdAt: string;
  status: 'active' | 'pending' | 'expired' | 'blocked';
  planId: string;
  planName: string;
  expiresAt: string;
  notes?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  badge: string;
  price: number;
  periodLabel: string;
  durationMonths: number;
  features: string[];
  isPopular?: boolean;
}

export type AdSlotType = 'header' | 'player_side' | 'player_bottom' | 'inter_categories' | 'footer';

export interface AdSlot {
  id: string;
  slotType: AdSlotType;
  title: string;
  subtitle: string;
  imageUrl?: string;
  targetUrl: string;
  isEnabled: boolean;
  dimensions: string;
  codeSnippet?: string;
}

export interface PixConfig {
  key: string;
  keyType: 'CNPJ' | 'Email' | 'Telefone' | 'Aleatória';
  recipientName: string;
  city: string;
  enabled: boolean;
}

export interface PayPalConfig {
  paymentLink: string;
  businessEmail: string;
  enabled: boolean;
}

export interface PaymentSettings {
  pix: PixConfig;
  paypal: PayPalConfig;
}

export interface VpsSpecs {
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  bandwidth: string;
  database: string;
}

export interface SystemSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  darkNavyColor: string;
  electricBlueColor: string;
  accessMode: AccessMode;
  allowPublicChannelBrowse: boolean;
  maxSimultaneousStreams: number;
  vpsSpecs: VpsSpecs;
  streamRelayEnabled: boolean;
}
