export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'superadmin' | 'admin' | 'editor';
  is_active: boolean;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  icon_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackupStreamItem {
  url: string;
  priority: number;
  label?: string;
}

export interface DbChannel {
  id: string;
  number: number;
  name: string;
  category_id: string;
  category_name?: string;
  logo_url: string;
  backup_image_url?: string;
  stream_url: string;
  alternative_streams: (string | BackupStreamItem)[];
  resolution: string;
  aspect_ratio: string;
  current_program: string;
  current_program_time: string;
  next_program?: string;
  is_live: boolean;
  is_locked: boolean;
  is_featured: boolean;
  is_active: boolean;
  status?: 'active' | 'inactive' | 'maintenance';
  access_permission?: 'free' | 'restricted';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DbManualOrder {
  id: string;
  order_code: string;
  subscriber_id: string;
  subscriber_name?: string;
  subscriber_email?: string;
  subscriber_whatsapp?: string;
  plan_id: string;
  plan_name?: string;
  plan_duration_days?: number;
  payment_method: 'pix' | 'paypal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
  receipt_url?: string | null;
  receipt_code?: string | null;
  pix_copy_paste?: string | null;
  reviewed_by_admin_id?: string | null;
  reviewed_by_admin_email?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStreamSource {
  id: string;
  channel_id: string;
  name: string;
  protocol: string;
  url: string;
  is_primary: boolean;
  status: string;
  latency_ms: number;
  bitrate_kbps: number;
  created_at: string;
  updated_at: string;
}

export interface DbSubscriber {
  id: string;
  full_name: string;
  whatsapp: string;
  email: string;
  password_hash?: string;
  status: 'active' | 'pending' | 'expired' | 'blocked';
  notes?: string;
  plan_id?: string;
  plan_name?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DbSubscriptionPlan {
  id: string;
  name: string;
  badge: string;
  price: number;
  period_label: string;
  duration_days: number;
  duration_months: number;
  description: string;
  features: string[];
  max_screens: number;
  allowed_scope: 'all' | 'custom';
  allowed_category_ids: string[];
  allowed_channel_ids: string[];
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentConfigs {
  id: string;
  pix_key: string;
  pix_key_type: string;
  pix_recipient_name: string;
  pix_city: string;
  pix_enabled: boolean;
  paypal_payment_link: string;
  paypal_business_email: string;
  paypal_enabled: boolean;
  updated_at: string;
}

export interface DbAppearanceConfigs {
  id: string;
  site_name: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  dark_navy_color: string;
  electric_blue_color: string;
  updated_at: string;
}

export interface DbAdSlot {
  id: string;
  slot_type: 'header' | 'player_side' | 'player_bottom' | 'inter_categories' | 'footer';
  title: string;
  subtitle: string;
  image_url: string | null;
  target_url: string;
  dimensions: string;
  code_snippet: string | null;
  is_enabled: boolean;
  updated_at: string;
}

export interface DbAccessModes {
  id: string;
  current_mode: 'free' | 'free_registered' | 'subscription';
  allow_public_browse: boolean;
  max_simultaneous_streams: number;
  stream_relay_enabled: boolean;
  updated_at: string;
}

export interface DbPlaybackSession {
  id: string;
  subscriber_id: string | null;
  subscriber_email?: string;
  subscriber_name?: string;
  channel_id: string;
  channel_name?: string;
  device_info?: string;
  playback_token?: string;
  ip_address: string | null;
  user_agent: string | null;
  started_at: string;
  last_heartbeat: string;
  ended_at?: string | null;
  ended_reason?: string | null;
  is_active: boolean;
}

export interface PasswordResetToken {
  id: string;
  admin_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

