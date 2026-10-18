import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AdminUser,
  AdminSession,
  AdminAuditLog,
  DbCategory,
  DbChannel,
  DbStreamSource,
  DbSubscriber,
  DbSubscriptionPlan,
  DbPaymentConfigs,
  DbAppearanceConfigs,
  DbAdSlot,
  DbAccessModes,
  DbPlaybackSession,
  DbManualOrder,
  PasswordResetToken
} from './schema.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_CHANNELS,
  INITIAL_PLANS,
  INITIAL_AD_SLOTS,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_DEMO_SUBSCRIBERS
} from '../../data/mockChannels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../../.data');
const DATA_FILE = path.join(DATA_DIR, 'gatonet_db.json');

export interface DatabaseState {
  admins: AdminUser[];
  admin_sessions: AdminSession[];
  admin_audit_logs: AdminAuditLog[];
  password_reset_tokens: PasswordResetToken[];
  categories: DbCategory[];
  channels: DbChannel[];
  stream_sources: DbStreamSource[];
  subscribers: DbSubscriber[];
  subscription_plans: DbSubscriptionPlan[];
  payment_configs: DbPaymentConfigs;
  appearance_configs: DbAppearanceConfigs;
  ad_slots: DbAdSlot[];
  access_modes: DbAccessModes;
  playback_sessions: DbPlaybackSession[];
  manual_orders: DbManualOrder[];
}

let memoryState: DatabaseState | null = null;

function getInitialState(): DatabaseState {
  const categories: DbCategory[] = INITIAL_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    display_order: c.order,
    icon_name: c.iconName,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const channels: DbChannel[] = INITIAL_CHANNELS.map(ch => ({
    id: ch.id,
    number: ch.number,
    name: ch.name,
    category_id: ch.categoryId,
    category_name: ch.categoryName,
    logo_url: ch.logo,
    backup_image_url: ch.backupImage,
    stream_url: ch.streamUrl,
    alternative_streams: ch.alternativeStreams || [],
    resolution: ch.resolution,
    aspect_ratio: ch.aspectRatio,
    current_program: ch.currentProgram,
    current_program_time: ch.currentProgramTime,
    next_program: ch.nextProgram || 'Programação Noturna',
    is_live: ch.isLive,
    is_locked: ch.isLocked,
    is_featured: ch.featured || false,
    is_active: true,
    description: ch.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const stream_sources: DbStreamSource[] = channels.map(ch => ({
    id: `source_${ch.id}`,
    channel_id: ch.id,
    name: 'Fonte Primária HLS',
    protocol: 'HLS',
    url: ch.stream_url,
    is_primary: true,
    status: 'online',
    latency_ms: 1200,
    bitrate_kbps: 4500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const subscribers: DbSubscriber[] = INITIAL_DEMO_SUBSCRIBERS.map(sub => ({
    id: sub.id,
    full_name: sub.fullName,
    whatsapp: sub.whatsapp,
    email: sub.email,
    status: sub.status,
    notes: sub.notes,
    plan_id: sub.planId,
    plan_name: sub.planName,
    expires_at: sub.expiresAt,
    created_at: sub.createdAt,
    updated_at: new Date().toISOString()
  }));

  const subscription_plans: DbSubscriptionPlan[] = INITIAL_PLANS.map((p, idx) => ({
    id: p.id,
    name: p.name,
    badge: p.badge || 'Personalizado',
    price: p.price,
    period_label: p.periodLabel,
    duration_days: p.durationDays || 30,
    duration_months: p.durationMonths || 1,
    description: p.description || '',
    features: p.features,
    max_screens: p.maxScreens || 1,
    allowed_scope: p.allowedScope || 'all',
    allowed_category_ids: p.allowedCategoryIds || [],
    allowed_channel_ids: p.allowedChannelIds || [],
    is_popular: p.isPopular || false,
    is_active: p.isActive ?? true,
    display_order: p.displayOrder || idx + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const ad_slots: DbAdSlot[] = INITIAL_AD_SLOTS.map(a => ({
    id: a.id,
    slot_type: a.slotType,
    title: a.title,
    subtitle: a.subtitle,
    image_url: a.imageUrl || null,
    target_url: a.targetUrl,
    dimensions: a.dimensions,
    code_snippet: a.codeSnippet || null,
    is_enabled: a.isEnabled,
    updated_at: new Date().toISOString()
  }));

  return {
    admins: [],
    admin_sessions: [],
    admin_audit_logs: [],
    password_reset_tokens: [],
    categories,
    channels,
    stream_sources,
    subscribers,
    subscription_plans,
    payment_configs: {
      id: 'primary',
      pix_key: INITIAL_PAYMENT_SETTINGS.pix.key,
      pix_key_type: INITIAL_PAYMENT_SETTINGS.pix.keyType,
      pix_recipient_name: INITIAL_PAYMENT_SETTINGS.pix.recipientName,
      pix_city: INITIAL_PAYMENT_SETTINGS.pix.city,
      pix_enabled: INITIAL_PAYMENT_SETTINGS.pix.enabled,
      paypal_payment_link: INITIAL_PAYMENT_SETTINGS.paypal.paymentLink,
      paypal_business_email: INITIAL_PAYMENT_SETTINGS.paypal.businessEmail,
      paypal_enabled: INITIAL_PAYMENT_SETTINGS.paypal.enabled,
      updated_at: new Date().toISOString()
    },
    appearance_configs: {
      id: 'primary',
      site_name: INITIAL_SYSTEM_SETTINGS.siteName,
      tagline: INITIAL_SYSTEM_SETTINGS.tagline,
      logo_url: INITIAL_SYSTEM_SETTINGS.logoUrl || null,
      favicon_url: INITIAL_SYSTEM_SETTINGS.faviconUrl || null,
      primary_color: INITIAL_SYSTEM_SETTINGS.primaryColor,
      dark_navy_color: INITIAL_SYSTEM_SETTINGS.darkNavyColor,
      electric_blue_color: INITIAL_SYSTEM_SETTINGS.electricBlueColor,
      updated_at: new Date().toISOString()
    },
    ad_slots,
    access_modes: {
      id: 'primary',
      current_mode: 'free',
      allow_public_browse: true,
      max_simultaneous_streams: 2,
      stream_relay_enabled: false,
      updated_at: new Date().toISOString()
    },
    playback_sessions: [],
    manual_orders: []
  };
}

export function loadDatabase(): DatabaseState {
  if (memoryState) {
    return memoryState;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.ad_slots) parsed.ad_slots = [];
      if (!parsed.password_reset_tokens) parsed.password_reset_tokens = [];
      if (!parsed.playback_sessions) parsed.playback_sessions = [];
      if (!parsed.manual_orders) parsed.manual_orders = [];
      if (Array.isArray(parsed.subscription_plans)) {
        parsed.subscription_plans = parsed.subscription_plans.map((p: any) => ({
          ...p,
          duration_days: p.duration_days || (p.duration_months ? p.duration_months * 30 : 30),
          max_screens: p.max_screens || 1,
          description: p.description || '',
          allowed_scope: p.allowed_scope || 'all',
          allowed_category_ids: p.allowed_category_ids || [],
          allowed_channel_ids: p.allowed_channel_ids || [],
          is_active: p.is_active !== undefined ? p.is_active : true,
          display_order: p.display_order || 1
        }));
      }
      memoryState = parsed;
      return memoryState!;
    }
  } catch (err) {
    console.warn('[Database] Failed to read persistent file, seeding fresh state:', err);
  }

  memoryState = getInitialState();
  saveDatabase(memoryState);
  return memoryState;
}

export function saveDatabase(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
    memoryState = state;
  } catch (err) {
    console.error('[Database] Failed to write database state to disk:', err);
  }
}
