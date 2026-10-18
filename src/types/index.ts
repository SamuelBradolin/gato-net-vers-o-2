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

export interface BackupStreamItem {
  url: string;
  priority: number;
  label?: string;
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  categoryId: string;
  categoryName: string;
  logo: string;
  streamUrl: string;
  alternativeStreams: (string | BackupStreamItem)[];
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
  status?: 'active' | 'inactive' | 'maintenance';
  accessPermission?: 'free' | 'restricted';
}

export interface ManualPaymentOrder {
  id: string;
  orderCode: string;
  subscriberId: string;
  subscriberName?: string;
  subscriberEmail?: string;
  subscriberWhatsapp?: string;
  planId: string;
  planName: string;
  planDurationDays: number;
  paymentMethod: 'pix' | 'paypal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  receiptUrl?: string | null;
  receiptCode?: string | null;
  pixCopyPaste?: string | null;
  reviewedByAdminId?: string | null;
  reviewedByAdminEmail?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
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
  badge?: string;
  price: number;
  periodLabel: string;
  durationMonths?: number;
  durationDays: number;
  description?: string;
  features: string[];
  maxScreens: number;
  allowedScope?: 'all' | 'custom';
  allowedCategoryIds?: string[];
  allowedChannelIds?: string[];
  isPopular?: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
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

export interface PlaybackSessionItem {
  id: string;
  subscriberId: string | null;
  subscriberEmail?: string;
  subscriberName?: string;
  channelId: string;
  channelName?: string;
  deviceInfo?: string;
  playbackToken?: string;
  ipAddress: string | null;
  startedAt: string;
  lastHeartbeat: string;
  endedAt?: string | null;
  endedReason?: string | null;
  isActive: boolean;
}

export interface PlaybackStatistics {
  totalSubscribers: number;
  activeSubscribers: number;
  activeSessionsCount: number;
  peakConcurrentViewers: number;
  subscribersWithSessions: {
    subscriberId: string;
    subscriberName: string;
    subscriberEmail: string;
    planName: string;
    maxScreens: number;
    activeSessionsCount: number;
    activeSessions: {
      sessionId: string;
      channelId: string;
      channelName: string;
      deviceInfo: string;
      startedAt: string;
      ipAddress: string | null;
    }[];
  }[];
  audienceByChannel: {
    channelId: string;
    channelName: string;
    categoryName: string;
    viewersCount: number;
  }[];
  recentSessionsHistory: {
    id: string;
    subscriberEmail?: string;
    subscriberName?: string;
    channelName: string;
    deviceInfo: string;
    startedAt: string;
    endedAt?: string | null;
    durationSeconds: number;
    status: 'active' | 'ended';
    endedReason?: string | null;
    ipAddress?: string | null;
  }[];
}

