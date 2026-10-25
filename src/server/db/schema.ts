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
  player_type?: 'internal' | 'external_iframe';
  iframe_code?: string | null;
  iframe_url?: string | null;
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
  ad_type?: 'none' | 'image_upload' | 'image_url' | 'code_script';
  advertiser_name?: string | null;
  alt_text?: string | null;
  open_in_new_tab?: boolean;
  show_placeholder_when_empty?: boolean;
  created_at?: string;
  updated_at: string;
}

export interface DbAccessModes {
  id: string;
  current_mode: 'free' | 'free_registered' | 'subscription';
  allow_public_browse: boolean;
  max_simultaneous_streams: number;
  stream_relay_enabled: boolean;
  allowed_iframe_domains?: string[];
  default_home_tab?: string;
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

export interface DbFeaturedHighlight {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  target_channel_id: string;
  button_text: string;
  time_label: string | null;
  start_date: string | null;
  end_date: string | null;
  placement: 'empty_player' | 'player_banner' | 'both';
  display_order: number;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbFeaturedSettings {
  id: string;
  autoplay_interval_seconds: number;
  max_active_highlights: number;
  playback_banner_enabled: boolean;
  updated_at: string;
}

export interface DbPrerollCampaign {
  id: string;
  sponsor_name: string;
  title: string;
  video_url: string;
  target_url: string | null;
  target_type: 'all' | 'channels' | 'categories';
  target_channel_ids: string[];
  target_category_ids: string[];
  start_date: string | null;
  end_date: string | null;
  is_continuous: boolean;
  priority: number;
  frequency_cap_minutes: number;
  skip_enabled: boolean;
  skip_offset_seconds: number;
  exempt_plan_ids: string[];
  is_active: boolean;
  is_demo: boolean;
  impressions_count: number;
  completions_count: number;
  skips_count: number;
  clicks_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbPrerollEvent {
  id: string;
  campaign_id: string;
  event_type: 'impression' | 'completion' | 'skip' | 'click';
  channel_id: string | null;
  subscriber_id: string | null;
  visitor_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DbInPlaySettings {
  id: string; // 'primary'
  is_enabled: boolean;
  ad_format: 'script' | 'custom_banner';
  ad_script_code: string;
  banner_image_url: string | null;
  banner_target_url: string | null;
  banner_title: string | null;
  position: 'bottom_center' | 'bottom_left' | 'bottom_right';
  delay_seconds: number;
  interval_minutes: number;
  duration_seconds: number;
  fade_out_seconds: number;
  close_button_enabled: boolean;
  target_type: 'all' | 'channels' | 'categories';
  target_channel_ids: string[];
  target_category_ids: string[];
  exempt_plan_ids: string[];
  updated_at: string;
}

export interface DbAuthorizedIframeDomain {
  id: string;
  domain: string;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFootballTeam {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFootballMatchChannel {
  channel_id: string;
  channel_name: string;
  channel_number?: number;
  is_primary?: boolean;
}

export interface DbFootballMatch {
  id: string;
  competition: string;
  competition_country: string | null;
  round: string | null;
  home_team_id: string | null;
  home_team_name: string;
  home_team_logo: string;
  away_team_id: string | null;
  away_team_name: string;
  away_team_logo: string;
  match_date: string; // YYYY-MM-DD
  match_time: string; // HH:MM
  timezone: string;
  description: string | null;
  channels: DbFootballMatchChannel[];
  primary_channel_id: string | null;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  score_home: number | null;
  score_away: number | null;
  minute: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbFootballAgendaSettings {
  id: string;
  is_enabled: boolean;
  days_to_display: number;
  hide_finished_after_hours: number;
  default_view_mode: 'live_first' | 'chronological';
  updated_at: string;
}

