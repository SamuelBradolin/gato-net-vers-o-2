import React, { useState, useEffect } from 'react';
import {
  Channel,
  Category,
  SubscriptionPlan,
  AdSlot,
  SystemSettings,
  PaymentSettings,
  UserSubscriber,
  AccessMode
} from '../types';
import {
  LayoutDashboard,
  Tv,
  FolderTree,
  Radio,
  Megaphone,
  Palette,
  Users,
  CreditCard,
  QrCode,
  BarChart3,
  Sliders,
  ShieldAlert,
  Server,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Database,
  ArrowLeft,
  Save,
  Info,
  Check,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  History,
  Lock,
  Edit2,
  Eye,
  EyeOff,
  Layers,
  X,
  RefreshCw,
  Monitor,
  Smartphone,
  Activity,
  Wifi,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  Image,
  Clock,
  RotateCcw,
  Sparkles,
  Globe,
  ArrowUp,
  ArrowDown,
  Play,
  Calendar,
  Video,
  Film,
  FastForward,
  MousePointerClick,
  Percent,
  PlaySquare
} from 'lucide-react';
import { AdminLogin } from './AdminLogin';

interface AdminPanelProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  plans: SubscriptionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<SubscriptionPlan[]>>;
  adSlots: AdSlot[];
  setAdSlots: React.Dispatch<React.SetStateAction<AdSlot[]>>;
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  paymentSettings: PaymentSettings;
  setPaymentSettings: React.Dispatch<React.SetStateAction<PaymentSettings>>;
  subscribers: UserSubscriber[];
  setSubscribers: React.Dispatch<React.SetStateAction<UserSubscriber[]>>;
  onCloseAdmin: () => void;
}

type AdminSection =
  | 'dashboard'
  | 'channels'
  | 'categories'
  | 'sources'
  | 'ads'
  | 'appearance'
  | 'subscribers'
  | 'plans'
  | 'payments'
  | 'analytics'
  | 'settings'
  | 'security'
  | 'featured';

interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLogItem {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  channels,
  setChannels,
  categories,
  setCategories,
  plans,
  setPlans,
  adSlots,
  setAdSlots,
  systemSettings,
  setSystemSettings,
  paymentSettings,
  setPaymentSettings,
  subscribers,
  setSubscribers,
  onCloseAdmin
}) => {
  // Authentication states
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  // Active section
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [saveToast, setSaveToast] = useState('');

  // Section 2: Real Channels CRUD State
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [channelFormNumber, setChannelFormNumber] = useState<number>(1);
  const [channelFormName, setChannelFormName] = useState('');
  const [channelFormCategory, setChannelFormCategory] = useState(categories[1]?.id || 'cat_aberta');
  const [channelFormLogo, setChannelFormLogo] = useState('');
  const [channelFormStreamUrl, setChannelFormStreamUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [channelFormAltStreams, setChannelFormAltStreams] = useState<Array<{ url: string; priority: number; label: string }>>([]);
  const [channelFormResolution, setChannelFormResolution] = useState<'1080p' | '4K' | '720p'>('1080p');
  const [channelFormAspectRatio, setChannelFormAspectRatio] = useState<'16:9' | '4:3'>('16:9');
  const [channelFormStatus, setChannelFormStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [channelFormPermission, setChannelFormPermission] = useState<'free' | 'restricted'>('free');
  const [channelFormDescription, setChannelFormDescription] = useState('');
  const [channelFormProgram, setChannelFormProgram] = useState('');
  const [channelFormError, setChannelFormError] = useState<string | null>(null);
  const [isSavingChannel, setIsSavingChannel] = useState(false);

  // Section 9: Manual Payment Orders & Financial History State
  const [paymentSubTab, setPaymentSubTab] = useState<'orders' | 'configs' | 'financial'>('orders');
  const [manualOrders, setManualOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Appearance Form State (Seção 6: Aparência e Identidade Visual)
  const [tempLogoUrl, setTempLogoUrl] = useState(systemSettings.logoUrl);
  const [tempFaviconUrl, setTempFaviconUrl] = useState(systemSettings.faviconUrl || '');
  const [tempSiteName, setTempSiteName] = useState(systemSettings.siteName);
  const [tempTagline, setTempTagline] = useState(systemSettings.tagline);
  const [tempPrimaryColor, setTempPrimaryColor] = useState(systemSettings.primaryColor || '#060911');
  const [tempDarkNavyColor, setTempDarkNavyColor] = useState(systemSettings.darkNavyColor || '#0b1329');
  const [tempElectricBlueColor, setTempElectricBlueColor] = useState(systemSettings.electricBlueColor || '#2563eb');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  // General Settings Form State (Seção 11: Configurações Gerais e Modos de Acesso)
  const [tempAccessMode, setTempAccessMode] = useState<AccessMode>(systemSettings.accessMode);
  const [tempAllowPublicBrowse, setTempAllowPublicBrowse] = useState<boolean>(systemSettings.allowPublicChannelBrowse ?? true);
  const [tempMaxSimultaneousStreams, setTempMaxSimultaneousStreams] = useState<number>(systemSettings.maxSimultaneousStreams || 2);
  const [tempStreamRelayEnabled, setTempStreamRelayEnabled] = useState<boolean>(systemSettings.streamRelayEnabled ?? false);
  const [isSavingGeneralSettings, setIsSavingGeneralSettings] = useState(false);

  // Payments Form State
  const [pixKey, setPixKey] = useState(paymentSettings.pix.key);
  const [pixRecipient, setPixRecipient] = useState(paymentSettings.pix.recipientName);
  const [pixCity, setPixCity] = useState(paymentSettings.pix.city);
  const [paypalLink, setPaypalLink] = useState(paymentSettings.paypal.paymentLink);

  // Section 8: Subscription Plans Manager State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormName, setPlanFormName] = useState('');
  const [planFormBadge, setPlanFormBadge] = useState('');
  const [planFormPrice, setPlanFormPrice] = useState('29.90');
  const [planFormPeriodLabel, setPlanFormPeriodLabel] = useState('por 30 dias');
  const [planFormDurationDays, setPlanFormDurationDays] = useState(30);
  const [planFormDescription, setPlanFormDescription] = useState('');
  const [planFormMaxScreens, setPlanFormMaxScreens] = useState(1);
  const [planFormAllowedScope, setPlanFormAllowedScope] = useState<'all' | 'custom'>('all');
  const [planFormAllowedCategories, setPlanFormAllowedCategories] = useState<string[]>([]);
  const [planFormAllowedChannels, setPlanFormAllowedChannels] = useState<string[]>([]);
  const [planFormIsPopular, setPlanFormIsPopular] = useState(false);
  const [planFormIsActive, setPlanFormIsActive] = useState(true);
  const [planFormDisplayOrder, setPlanFormDisplayOrder] = useState(1);
  const [planFormFeatures, setPlanFormFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Audit logs & Diagnostics state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);

  // Section 10: Real-time Analytics & Audience state
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);

  // Section 13: Featured Programming Highlights State
  const [featuredList, setFeaturedList] = useState<any[]>([]);
  const [featuredAdminSettings, setFeaturedAdminSettings] = useState<{
    autoplay_interval_seconds: number;
    max_active_highlights: number;
    playback_banner_enabled: boolean;
  }>({
    autoplay_interval_seconds: 6,
    max_active_highlights: 6,
    playback_banner_enabled: true
  });
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);
  const [editingFeaturedId, setEditingFeaturedId] = useState<string | null>(null);

  // Featured Item Form fields
  const [featTitle, setFeatTitle] = useState('');
  const [featDescription, setFeatDescription] = useState('');
  const [featImageUrl, setFeatImageUrl] = useState('');
  const [featTargetChannelId, setFeatTargetChannelId] = useState(channels[0]?.id || 'ch_globo');
  const [featButtonText, setFeatButtonText] = useState('Assistir agora');
  const [featTimeLabel, setFeatTimeLabel] = useState('');
  const [featStartDate, setFeatStartDate] = useState('');
  const [featEndDate, setFeatEndDate] = useState('');
  const [featPlacement, setFeatPlacement] = useState<'empty_player' | 'player_banner' | 'both'>('both');
  const [featDisplayOrder, setFeatDisplayOrder] = useState(1);
  const [featIsActive, setFeatIsActive] = useState(true);
  const [featIsDemo, setFeatIsDemo] = useState(false);
  const [isUploadingFeatImage, setIsUploadingFeatImage] = useState(false);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);
  const [isSavingFeaturedSettings, setIsSavingFeaturedSettings] = useState(false);
  const [previewTab, setPreviewTab] = useState<'carousel' | 'banner'>('carousel');

  // Section 5: Pre-roll Video Advertising Management State
  const [adTab, setAdTab] = useState<'preroll' | 'banners'>('preroll');
  const [prerollCampaigns, setPrerollCampaigns] = useState<any[]>([]);
  const [prerollSummary, setPrerollSummary] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalImpressions: 0,
    totalCompletions: 0,
    totalSkips: 0,
    totalClicks: 0,
    completionRate: '0.0',
    ctr: '0.00'
  });
  const [isLoadingPreroll, setIsLoadingPreroll] = useState(false);
  const [isPrerollModalOpen, setIsPrerollModalOpen] = useState(false);
  const [editingPrerollId, setEditingPrerollId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState<string>('');
  const [previewVideoSponsor, setPreviewVideoSponsor] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Pre-roll Form Fields
  const [prerollSponsor, setPrerollSponsor] = useState('');
  const [prerollTitle, setPrerollTitle] = useState('');
  const [prerollVideoUrl, setPrerollVideoUrl] = useState('');
  const [prerollTargetUrl, setPrerollTargetUrl] = useState('');
  const [prerollTargetType, setPrerollTargetType] = useState<'all' | 'channels' | 'categories'>('all');
  const [prerollChannelIds, setPrerollChannelIds] = useState<string[]>([]);
  const [prerollCategoryIds, setPrerollCategoryIds] = useState<string[]>([]);
  const [prerollStartDate, setPrerollStartDate] = useState('');
  const [prerollEndDate, setPrerollEndDate] = useState('');
  const [prerollIsContinuous, setPrerollIsContinuous] = useState(true);
  const [prerollPriority, setPrerollPriority] = useState(5);
  const [prerollFrequencyCap, setPrerollFrequencyCap] = useState(15);
  const [prerollSkipEnabled, setPrerollSkipEnabled] = useState(true);
  const [prerollSkipOffset, setPrerollSkipOffset] = useState(5);
  const [prerollExemptPlans, setPrerollExemptPlans] = useState<string[]>([]);
  const [prerollIsActive, setPrerollIsActive] = useState(true);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSavingPreroll, setIsSavingPreroll] = useState(false);
  const [prerollError, setPrerollError] = useState<string | null>(null);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');

  // Safely navigate between admin modules, ensuring all open modals are closed
  const handleSelectSection = (section: AdminSection) => {
    setIsPrerollModalOpen(false);
    setIsPreviewModalOpen(false);
    setIsFeaturedModalOpen(false);
    setIsChannelModalOpen(false);
    setIsPlanModalOpen(false);
    setEditingPrerollId(null);
    setPrerollError(null);
    setActiveSection(section);
  };

  // Helper for auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem('gatonet_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Check auth and setup status on mount
  useEffect(() => {
    async function checkAuth() {
      setIsCheckingAuth(true);
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: getAuthHeaders()
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.admin) {
            setCurrentAdmin(data.admin);
            setIsBackendUnavailable(false);
            return;
          }
        }

        // Check if setup is needed
        const setupRes = await fetch('/api/admin/setup/status').catch(() => null);
        if (setupRes && setupRes.ok) {
          const setupData = await setupRes.json().catch(() => null);
          setIsSetupRequired(setupData ? setupData.isSetupRequired : true);
          setIsBackendUnavailable(false);
        } else if (!setupRes) {
          setIsBackendUnavailable(true);
          setIsSetupRequired(true);
        } else {
          setIsSetupRequired(true);
        }
      } catch (err) {
        console.error('[Admin] Erro ao verificar credenciais:', err);
        setIsBackendUnavailable(true);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  // Fetch audit logs and diagnostics when security section is selected
  useEffect(() => {
    if (!currentAdmin) return;

    if (activeSection === 'security' || activeSection === 'dashboard') {
      fetch('/api/admin/audit-logs', { headers: getAuthHeaders(), credentials: 'include' })
        .then(r => r.ok ? r.json() : [])
        .then(data => setAuditLogs(data))
        .catch(() => {});

      fetch('/api/admin/security/diagnostics', { headers: getAuthHeaders(), credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => setDiagnostics(data))
        .catch(() => {});
    }

    if (activeSection === 'plans') {
      fetchPlans();
    }

    if (activeSection === 'channels' || activeSection === 'dashboard') {
      fetchChannels();
    }

    if (activeSection === 'payments' || activeSection === 'dashboard') {
      fetchManualOrders();
    }

    if (activeSection === 'analytics' || activeSection === 'dashboard') {
      fetchAnalytics();
    }

    if (activeSection === 'appearance' || activeSection === 'dashboard') {
      fetchAppearance();
    }

    if (activeSection === 'settings' || activeSection === 'dashboard') {
      fetchSettings();
    }

    if (activeSection === 'featured' || activeSection === 'dashboard') {
      fetchFeaturedHighlights();
    }

    if (activeSection === 'ads' || activeSection === 'dashboard') {
      fetchPrerollCampaigns();
    }
  }, [activeSection, currentAdmin]);

  // Fetch Appearance settings from backend / PostgreSQL
  const fetchAppearance = async () => {
    try {
      const res = await fetch('/api/admin/appearance', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.site_name) setTempSiteName(data.site_name);
          if (data.tagline !== undefined) setTempTagline(data.tagline || '');
          if (data.logo_url !== undefined) setTempLogoUrl(data.logo_url || '');
          if (data.favicon_url !== undefined) setTempFaviconUrl(data.favicon_url || '');
          if (data.primary_color) setTempPrimaryColor(data.primary_color);
          if (data.dark_navy_color) setTempDarkNavyColor(data.dark_navy_color);
          if (data.electric_blue_color) setTempElectricBlueColor(data.electric_blue_color);
        }
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar configurações de aparência:', err);
    }
  };

  // Fetch General Settings & Access Modes from backend / PostgreSQL
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.current_mode) setTempAccessMode(data.current_mode);
          if (data.allow_public_browse !== undefined) setTempAllowPublicBrowse(Boolean(data.allow_public_browse));
          if (data.max_simultaneous_streams !== undefined) setTempMaxSimultaneousStreams(data.max_simultaneous_streams);
          if (data.stream_relay_enabled !== undefined) setTempStreamRelayEnabled(Boolean(data.stream_relay_enabled));
        }
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar configurações gerais:', err);
    }
  };

  // Fetch Featured Highlights & Settings from backend / PostgreSQL
  const fetchFeaturedHighlights = async () => {
    setIsLoadingFeatured(true);
    try {
      const res = await fetch('/api/admin/featured', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.highlights)) {
          setFeaturedList(data.highlights);
        }
        if (data.settings) {
          setFeaturedAdminSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar destaques:', err);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  const handleOpenNewFeaturedModal = () => {
    setEditingFeaturedId(null);
    setFeatTitle('');
    setFeatDescription('');
    setFeatImageUrl('/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg');
    setFeatTargetChannelId(channels[0]?.id || 'ch_globo');
    setFeatButtonText('Assistir agora');
    setFeatTimeLabel('');
    setFeatStartDate('');
    setFeatEndDate('');
    setFeatPlacement('both');
    setFeatDisplayOrder(featuredList.length + 1);
    setFeatIsActive(true);
    setFeatIsDemo(false);
    setIsFeaturedModalOpen(true);
  };

  const handleEditFeaturedItem = (item: any) => {
    setEditingFeaturedId(item.id);
    setFeatTitle(item.title || '');
    setFeatDescription(item.description || '');
    setFeatImageUrl(item.image_url || '');
    setFeatTargetChannelId(item.target_channel_id || channels[0]?.id || 'ch_globo');
    setFeatButtonText(item.button_text || 'Assistir agora');
    setFeatTimeLabel(item.time_label || '');
    setFeatStartDate(item.start_date ? item.start_date.slice(0, 16) : '');
    setFeatEndDate(item.end_date ? item.end_date.slice(0, 16) : '');
    setFeatPlacement(item.placement || 'both');
    setFeatDisplayOrder(item.display_order || 1);
    setFeatIsActive(item.is_active !== false);
    setFeatIsDemo(Boolean(item.is_demo));
    setIsFeaturedModalOpen(true);
  };

  const handleSaveFeaturedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featTitle.trim()) {
      triggerToast('Informe o título da atração em destaque.');
      return;
    }
    if (!featImageUrl.trim()) {
      triggerToast('Informe a imagem de fundo ou realize o upload.');
      return;
    }
    if (!featTargetChannelId) {
      triggerToast('Selecione o canal de destino vinculado.');
      return;
    }

    setIsSavingFeatured(true);
    try {
      const payload = {
        title: featTitle.trim(),
        description: featDescription.trim() || null,
        image_url: featImageUrl.trim(),
        target_channel_id: featTargetChannelId,
        button_text: featButtonText.trim() || 'Assistir agora',
        time_label: featTimeLabel.trim() || null,
        start_date: featStartDate ? new Date(featStartDate).toISOString() : null,
        end_date: featEndDate ? new Date(featEndDate).toISOString() : null,
        placement: featPlacement,
        display_order: Number(featDisplayOrder) || 1,
        is_active: featIsActive,
        is_demo: featIsDemo
      };

      const url = editingFeaturedId
        ? `/api/admin/featured/${editingFeaturedId}`
        : '/api/admin/featured';
      const method = editingFeaturedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast(
          editingFeaturedId
            ? 'Destaque atualizado com sucesso!'
            : 'Novo destaque cadastrado com sucesso!'
        );
        setIsFeaturedModalOpen(false);
        await fetchFeaturedHighlights();
      } else {
        const data = await res.json().catch(() => ({}));
        triggerToast(data.message || data.error || 'Erro ao salvar destaque.');
      }
    } catch (err) {
      triggerToast('Erro de rede ao salvar destaque.');
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const handleDeleteFeatured = async (id: string) => {
    if (!confirm('Deseja realmente remover este destaque da programação?')) return;
    try {
      const res = await fetch(`/api/admin/featured/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        triggerToast('Destaque excluído com sucesso!');
        await fetchFeaturedHighlights();
      } else {
        triggerToast('Erro ao excluir destaque.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao excluir destaque.');
    }
  };

  const handleToggleFeaturedActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/featured/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ is_active: !currentState })
      });
      if (res.ok) {
        setFeaturedList(prev =>
          prev.map(item => (item.id === id ? { ...item, is_active: !currentState } : item))
        );
        triggerToast(`Destaque ${!currentState ? 'ativado' : 'desativado'} com sucesso!`);
      }
    } catch (err) {
      triggerToast('Erro ao alterar status do destaque.');
    }
  };

  const handleMoveFeaturedOrder = async (id: string, direction: 'up' | 'down') => {
    const idx = featuredList.findIndex(f => f.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === featuredList.length - 1) return;

    const newList = [...featuredList];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newList[idx];
    newList[idx] = newList[targetIdx];
    newList[targetIdx] = temp;

    setFeaturedList(newList);
    const orderedIds = newList.map(f => f.id);
    try {
      await fetch('/api/admin/featured/reorder', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ids: orderedIds })
      });
      triggerToast('Ordem dos destaques atualizada!');
    } catch (err) {
      console.warn('Erro ao salvar nova ordem:', err);
    }
  };

  const handleSaveFeaturedSettings = async () => {
    setIsSavingFeaturedSettings(true);
    try {
      const res = await fetch('/api/admin/featured-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(featuredAdminSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setFeaturedAdminSettings(data);
        triggerToast('Configurações globais de destaques salvas com sucesso!');
      } else {
        triggerToast('Erro ao salvar configurações de destaques.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao salvar configurações.');
    } finally {
      setIsSavingFeaturedSettings(false);
    }
  };

  // Fetch Pre-roll campaigns & real statistics
  const fetchPrerollCampaigns = async () => {
    setIsLoadingPreroll(true);
    try {
      const res = await fetch('/api/admin/preroll', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.campaigns)) {
          setPrerollCampaigns(data.campaigns);
        }
        if (data.summary) {
          setPrerollSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar campanhas de pré-roll:', err);
    } finally {
      setIsLoadingPreroll(false);
    }
  };

  const handleOpenNewPrerollModal = () => {
    setEditingPrerollId(null);
    setPrerollSponsor('');
    setPrerollTitle('');
    setPrerollVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setPrerollTargetUrl('');
    setPrerollTargetType('all');
    setPrerollChannelIds([]);
    setPrerollCategoryIds([]);
    setPrerollStartDate('');
    setPrerollEndDate('');
    setPrerollIsContinuous(true);
    setPrerollPriority(5);
    setPrerollFrequencyCap(15);
    setPrerollSkipEnabled(true);
    setPrerollSkipOffset(5);
    setPrerollExemptPlans(['plan_anual', 'plan_semestral']);
    setPrerollIsActive(true);
    setPrerollError(null);
    setIsPrerollModalOpen(true);
  };

  const handleEditPrerollItem = (camp: any) => {
    setEditingPrerollId(camp.id);
    setPrerollSponsor(camp.sponsor_name || '');
    setPrerollTitle(camp.title || '');
    setPrerollVideoUrl(camp.video_url || '');
    setPrerollTargetUrl(camp.target_url || '');
    setPrerollTargetType(camp.target_type || 'all');
    setPrerollChannelIds(Array.isArray(camp.target_channel_ids) ? camp.target_channel_ids : []);
    setPrerollCategoryIds(Array.isArray(camp.target_category_ids) ? camp.target_category_ids : []);
    setPrerollStartDate(camp.start_date ? camp.start_date.slice(0, 16) : '');
    setPrerollEndDate(camp.end_date ? camp.end_date.slice(0, 16) : '');
    setPrerollIsContinuous(Boolean(camp.is_continuous));
    setPrerollPriority(camp.priority || 5);
    setPrerollFrequencyCap(camp.frequency_cap_minutes ?? 15);
    setPrerollSkipEnabled(camp.skip_enabled !== false);
    setPrerollSkipOffset(camp.skip_offset_seconds || 5);
    setPrerollExemptPlans(Array.isArray(camp.exempt_plan_ids) ? camp.exempt_plan_ids : []);
    setPrerollIsActive(camp.is_active !== false);
    setPrerollError(null);
    setIsPrerollModalOpen(true);
  };

  const handleSavePreroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrerollError(null);

    if (!prerollSponsor.trim()) {
      setPrerollError('Informe o nome do patrocinador.');
      return;
    }
    if (!prerollTitle.trim()) {
      setPrerollError('Informe o título descritivo da campanha.');
      return;
    }
    if (!prerollVideoUrl.trim()) {
      setPrerollError('Informe a URL do vídeo publicitário ou faça upload de um arquivo MP4/WebM.');
      return;
    }

    setIsSavingPreroll(true);
    try {
      const payload = {
        sponsor_name: prerollSponsor.trim(),
        title: prerollTitle.trim(),
        video_url: prerollVideoUrl.trim(),
        target_url: prerollTargetUrl.trim() || null,
        target_type: prerollTargetType,
        target_channel_ids: prerollChannelIds,
        target_category_ids: prerollCategoryIds,
        start_date: !prerollIsContinuous && prerollStartDate ? new Date(prerollStartDate).toISOString() : null,
        end_date: !prerollIsContinuous && prerollEndDate ? new Date(prerollEndDate).toISOString() : null,
        is_continuous: prerollIsContinuous,
        priority: prerollPriority,
        frequency_cap_minutes: prerollFrequencyCap,
        skip_enabled: prerollSkipEnabled,
        skip_offset_seconds: prerollSkipOffset,
        exempt_plan_ids: prerollExemptPlans,
        is_active: prerollIsActive
      };

      const url = editingPrerollId
        ? `/api/admin/preroll/${editingPrerollId}`
        : '/api/admin/preroll';
      const method = editingPrerollId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setPrerollError(data.error || 'Erro ao salvar campanha de pré-roll.');
        return;
      }

      triggerToast(
        editingPrerollId
          ? 'Campanha de pré-roll atualizada com sucesso!'
          : 'Campanha de pré-roll cadastrada com sucesso!'
      );
      setIsPrerollModalOpen(false);
      await fetchPrerollCampaigns();
    } catch (err: any) {
      setPrerollError('Falha de conexão com o servidor ao salvar campanha.');
    } finally {
      setIsSavingPreroll(false);
    }
  };

  const handleTogglePrerollStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/preroll/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const updated = await res.json();
        setPrerollCampaigns(prev =>
          prev.map(c => (c.id === id ? { ...c, is_active: updated?.is_active } : c))
        );
        triggerToast(`Campanha ${updated?.is_active ? 'ativada' : 'pausada'} com sucesso!`);
        fetchPrerollCampaigns();
      } else {
        triggerToast('Erro ao alternar status da campanha.');
      }
    } catch (err) {
      triggerToast('Falha na conexão ao alternar status.');
    }
  };

  const handleResetPrerollCounters = async (id: string) => {
    if (!window.confirm('Deseja zerar todas as estatísticas reais acumuladas desta campanha? Esta operação é irreversível.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/preroll/${id}/reset-stats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        triggerToast('Estatísticas da campanha zeradas com sucesso!');
        await fetchPrerollCampaigns();
      } else {
        triggerToast('Erro ao zerar estatísticas da campanha.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao zerar estatísticas.');
    }
  };

  const handleDeletePrerollItem = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja remover esta campanha de pré-roll? O histórico de eventos associado também será excluído.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/preroll/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        triggerToast('Campanha de pré-roll excluída com sucesso!');
        await fetchPrerollCampaigns();
      } else {
        triggerToast('Erro ao excluir campanha.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao excluir campanha.');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setPrerollError(`O arquivo de vídeo selecionado possui ${(file.size / (1024 * 1024)).toFixed(1)} MB e excede o limite máximo permitido de 50 MB.`);
      return;
    }

    setIsUploadingVideo(true);
    setPrerollError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/admin/upload-video', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || 'video/mp4',
              base64Data
            })
          });

          const data = await res.json();
          if (res.ok && data.url) {
            setPrerollVideoUrl(data.url);
            triggerToast('Upload do vídeo promocional concluído com sucesso!');
          } else {
            setPrerollError(data.error || 'Falha ao processar o upload do vídeo.');
          }
        } catch (err: any) {
          setPrerollError('Erro na conexão com o servidor ao enviar vídeo.');
        } finally {
          setIsUploadingVideo(false);
        }
      };
      reader.onerror = () => {
        setPrerollError('Erro ao ler arquivo de vídeo no dispositivo.');
        setIsUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPrerollError('Erro ao processar arquivo selecionado.');
      setIsUploadingVideo(false);
    }
  };

  const handleOpenPreview = (videoUrl: string, title: string, sponsor: string) => {
    setPreviewVideoUrl(videoUrl);
    setPreviewVideoTitle(title);
    setPreviewVideoSponsor(sponsor);
    setIsPreviewModalOpen(true);
  };

  // Image Upload with validation and server-side disk storage
  const handleUploadImage = async (
    file: File,
    target: 'logo' | 'favicon' | 'channel' | 'featured'
  ): Promise<string | null> => {
    setUploadError(null);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/gif'];
    const isIco = file.name.toLowerCase().endsWith('.ico');
    if (!allowedTypes.includes(file.type.toLowerCase()) && !isIco) {
      const err = `Tipo de arquivo "${file.type || file.name}" não aceito. Utilize imagens PNG, JPG, WEBP, SVG, ICO ou GIF.`;
      setUploadError(err);
      triggerToast(err);
      return null;
    }

    const maxSizeBytes = target === 'favicon' ? 1 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeText = target === 'favicon' ? '1 MB' : '10 MB';
    if (file.size > maxSizeBytes) {
      const err = `Arquivo excede o tamanho máximo de ${maxSizeText} (tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
      setUploadError(err);
      triggerToast(err);
      return null;
    }

    if (target === 'logo') setIsUploadingLogo(true);
    if (target === 'favicon') setIsUploadingFavicon(true);
    if (target === 'featured') setIsUploadingFeatImage(true);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro na leitura do arquivo local.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || (isIco ? 'image/x-icon' : 'image/png'),
          base64Data,
          target
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        if (target === 'logo') setTempLogoUrl(data.url);
        if (target === 'favicon') setTempFaviconUrl(data.url);
        if (target === 'featured') setFeatImageUrl(data.url);
        triggerToast(`Upload concluído e armazenado com sucesso!`);
        return data.url;
      } else {
        const err = data.error || 'Erro ao processar upload.';
        setUploadError(err);
        triggerToast(err);
        return null;
      }
    } catch (err: any) {
      const msg = err.message || 'Falha de rede durante o upload.';
      setUploadError(msg);
      triggerToast(msg);
      return null;
    } finally {
      if (target === 'logo') setIsUploadingLogo(false);
      if (target === 'favicon') setIsUploadingFavicon(false);
      if (target === 'featured') setIsUploadingFeatImage(false);
    }
  };

  // Fetch Subscription Plans from backend / PostgreSQL
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlans(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            badge: p.badge || '',
            price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
            periodLabel: p.period_label || `por ${p.duration_days || 30} dias`,
            durationDays: p.duration_days || 30,
            durationMonths: p.duration_months || 1,
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
            maxScreens: p.max_screens || 1,
            allowedScope: p.allowed_scope || 'all',
            allowedCategoryIds: p.allowed_category_ids || [],
            allowedChannelIds: p.allowed_channel_ids || [],
            isPopular: Boolean(p.is_popular),
            isActive: p.is_active !== undefined ? Boolean(p.is_active) : true,
            displayOrder: p.display_order || 99,
            createdAt: p.created_at,
            updatedAt: p.updated_at
          })));
        }
      }
    } catch (e) {
      // Keep existing memory plans
    }
  };

  // Plan Management Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanFormName('');
    setPlanFormBadge('Novo');
    setPlanFormPrice('29.90');
    setPlanFormPeriodLabel('por 30 dias');
    setPlanFormDurationDays(30);
    setPlanFormDescription('');
    setPlanFormMaxScreens(1);
    setPlanFormAllowedScope('all');
    setPlanFormAllowedCategories([]);
    setPlanFormAllowedChannels([]);
    setPlanFormIsPopular(false);
    setPlanFormIsActive(true);
    setPlanFormDisplayOrder(plans.length + 1);
    setPlanFormFeatures([
      'Acesso completo aos canais do plano',
      'Transmissão Full HD / 4K sem travamento',
      'Compatível com Smart TV, Celular e PC'
    ]);
    setNewFeatureInput('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanFormName(plan.name);
    setPlanFormBadge(plan.badge || '');
    setPlanFormPrice(plan.price.toString());
    setPlanFormPeriodLabel(plan.periodLabel || `por ${plan.durationDays || 30} dias`);
    setPlanFormDurationDays(plan.durationDays || 30);
    setPlanFormDescription(plan.description || '');
    setPlanFormMaxScreens(plan.maxScreens || 1);
    setPlanFormAllowedScope(plan.allowedScope || 'all');
    setPlanFormAllowedCategories(plan.allowedCategoryIds || []);
    setPlanFormAllowedChannels(plan.allowedChannelIds || []);
    setPlanFormIsPopular(Boolean(plan.isPopular));
    setPlanFormIsActive(plan.isActive !== undefined ? plan.isActive : true);
    setPlanFormDisplayOrder(plan.displayOrder || 1);
    setPlanFormFeatures(plan.features || []);
    setNewFeatureInput('');
    setIsPlanModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setPlanFormFeatures(prev => [...prev, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setPlanFormFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) {
      triggerToast('Informe o nome do plano.');
      return;
    }
    const parsedPrice = parseFloat(planFormPrice.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      triggerToast('Informe um valor de preço válido em Reais.');
      return;
    }

    setIsSavingPlan(true);
    try {
      const payload = {
        name: planFormName.trim(),
        badge: planFormBadge.trim(),
        price: parsedPrice,
        period_label: planFormPeriodLabel.trim() || `por ${planFormDurationDays} dias`,
        duration_days: Number(planFormDurationDays) || 30,
        description: planFormDescription.trim(),
        features: planFormFeatures,
        max_screens: Number(planFormMaxScreens) || 1,
        allowed_scope: planFormAllowedScope,
        allowed_category_ids: planFormAllowedScope === 'custom' ? planFormAllowedCategories : [],
        allowed_channel_ids: planFormAllowedScope === 'custom' ? planFormAllowedChannels : [],
        is_popular: planFormIsPopular,
        is_active: planFormIsActive,
        display_order: Number(planFormDisplayOrder) || 1
      };

      const url = editingPlanId ? `/api/admin/plans/${editingPlanId}` : '/api/admin/plans';
      const method = editingPlanId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedPlan = await res.json();
        const mappedPlan: SubscriptionPlan = {
          id: savedPlan.id,
          name: savedPlan.name,
          badge: savedPlan.badge,
          price: typeof savedPlan.price === 'number' ? savedPlan.price : parseFloat(savedPlan.price),
          periodLabel: savedPlan.period_label,
          durationDays: savedPlan.duration_days,
          durationMonths: savedPlan.duration_months,
          description: savedPlan.description,
          features: savedPlan.features,
          maxScreens: savedPlan.max_screens,
          allowedScope: savedPlan.allowed_scope,
          allowedCategoryIds: savedPlan.allowed_category_ids,
          allowedChannelIds: savedPlan.allowed_channel_ids,
          isPopular: savedPlan.is_popular,
          isActive: savedPlan.is_active,
          displayOrder: savedPlan.display_order
        };

        if (editingPlanId) {
          setPlans(prev => prev.map(p => p.id === editingPlanId ? mappedPlan : p));
          triggerToast(`Plano "${mappedPlan.name}" atualizado com sucesso no banco!`);
        } else {
          setPlans(prev => [...prev, mappedPlan]);
          triggerToast(`Novo plano "${mappedPlan.name}" criado com sucesso!`);
        }
        setIsPlanModalOpen(false);
      } else {
        const errData = await res.json().catch(() => null);
        triggerToast(errData?.error || 'Erro ao salvar plano de assinatura.');
      }
    } catch (err) {
      triggerToast('Erro de conexão ao salvar o plano.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        const updated = await res.json();
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: updated.is_active } : p));
        triggerToast(`Plano "${plan.name}" ${updated.is_active ? 'ativado' : 'desativado'} no banco!`);
      } else {
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
        triggerToast(`Plano "${plan.name}" alternado.`);
      }
    } catch (err) {
      triggerToast('Erro ao alternar status do plano.');
    }
  };

  const handleDeleteOrArchivePlan = async (plan: SubscriptionPlan) => {
    const confirmed = window.confirm(
      `Deseja excluir o plano "${plan.name}"?\n\nNota: Caso o plano já possua assinaturas ou vínculos históricos, ele será automaticamente arquivado/desativado para manter a integridade contábil sem remover os registros existentes.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.archived) {
          setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: false } : p));
          triggerToast(data.message || `Plano "${plan.name}" arquivado com sucesso.`);
        } else {
          setPlans(prev => prev.filter(p => p.id !== plan.id));
          triggerToast(`Plano "${plan.name}" excluído definitivamente.`);
        }
      } else {
        setPlans(prev => prev.filter(p => p.id !== plan.id));
        triggerToast(`Plano removido localmente.`);
      }
    } catch (err) {
      triggerToast('Erro ao processar exclusão do plano.');
    }
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      sessionStorage.removeItem('gatonet_admin_token');
      setCurrentAdmin(null);
      triggerToast('Sessão administrativa encerrada.');
    }
  };

  // Section 10: Fetch Real Analytics & Audiences
  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics/stats', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsStats(data);
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar métricas:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Section 10: Terminate Playback Session by Admin
  const handleTerminateSession = async (sessionId: string) => {
    if (!window.confirm('Deseja realmente derrubar/encerrar esta sessão de reprodução? O aparelho do assinante será desconectado imediatamente.')) {
      return;
    }
    setTerminatingSessionId(sessionId);
    try {
      const res = await fetch('/api/admin/playback/terminate', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        triggerToast('Sessão de reprodução encerrada pelo administrador.');
        await fetchAnalytics();
      } else {
        triggerToast('Erro ao encerrar sessão de reprodução.');
      }
    } catch (err) {
      triggerToast('Erro de comunicação ao encerrar sessão.');
    } finally {
      setTerminatingSessionId(null);
    }
  };

  // ==========================================
  // Section 2: Channels Full CRUD (PostgreSQL)
  // ==========================================
  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/admin/channels', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setChannels(data.map((c: any) => ({
            id: c.id,
            number: c.number,
            name: c.name,
            categoryId: c.category_id,
            categoryName: c.category_name || categories.find(cat => cat.id === c.category_id)?.name || 'Variedades',
            logo: c.logo_url,
            backupImage: c.backup_image_url || '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg',
            streamUrl: c.stream_url,
            alternativeStreams: c.alternative_streams || [],
            resolution: c.resolution || '1080p',
            aspectRatio: c.aspect_ratio || '16:9',
            currentProgram: c.current_program || 'Transmissão Ao Vivo',
            currentProgramTime: c.current_program_time || '20:00 - 22:00',
            nextProgram: c.next_program || 'Programação Noturna',
            isLive: c.is_live,
            isLocked: c.is_locked,
            status: c.status || (c.is_active ? 'active' : 'inactive'),
            accessPermission: c.access_permission || (c.is_locked ? 'restricted' : 'free'),
            description: c.description || ''
          })));
        }
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar canais:', err);
    }
  };

  const handleOpenAddChannel = () => {
    setEditingChannelId(null);
    const maxNum = channels.reduce((max, c) => Math.max(max, c.number || 0), 0);
    setChannelFormNumber(maxNum + 1);
    setChannelFormName('');
    setChannelFormCategory(categories.find(c => c.id !== 'cat_all')?.id || categories[0]?.id || 'cat_aberta');
    setChannelFormLogo('');
    setChannelFormStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setChannelFormAltStreams([]);
    setChannelFormResolution('1080p');
    setChannelFormAspectRatio('16:9');
    setChannelFormStatus('active');
    setChannelFormPermission('free');
    setChannelFormDescription('');
    setChannelFormProgram('Transmissão Ao Vivo');
    setChannelFormError(null);
    setIsChannelModalOpen(true);
  };

  const handleOpenEditChannel = (ch: Channel) => {
    setEditingChannelId(ch.id);
    setChannelFormNumber(ch.number);
    setChannelFormName(ch.name);
    setChannelFormCategory(ch.categoryId);
    setChannelFormLogo(ch.logo || '');
    setChannelFormStreamUrl(ch.streamUrl);
    setChannelFormAltStreams(
      (ch.alternativeStreams || []).map((alt: any, idx: number) => {
        if (typeof alt === 'string') {
          return { url: alt, priority: idx + 1, label: `Fonte Reserva ${idx + 1}` };
        }
        return {
          url: alt?.url || '',
          priority: alt?.priority || idx + 1,
          label: alt?.label || `Fonte Reserva ${idx + 1}`
        };
      })
    );
    setChannelFormResolution(ch.resolution);
    setChannelFormAspectRatio(ch.aspectRatio || '16:9');
    setChannelFormStatus(ch.status || 'active');
    setChannelFormPermission(ch.accessPermission || (ch.isLocked ? 'restricted' : 'free'));
    setChannelFormDescription(ch.description || '');
    setChannelFormProgram(ch.currentProgram || 'Transmissão Ao Vivo');
    setChannelFormError(null);
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelFormName.trim() || !channelFormStreamUrl.trim()) {
      setChannelFormError('Nome e URL Principal da transmissão são obrigatórios.');
      return;
    }

    setIsSavingChannel(true);
    setChannelFormError(null);

    const payload = {
      number: channelFormNumber,
      name: channelFormName.trim(),
      category_id: channelFormCategory,
      logo_url: channelFormLogo.trim() || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=160&q=80',
      stream_url: channelFormStreamUrl.trim(),
      alternative_streams: channelFormAltStreams.filter(a => a.url.trim().length > 0),
      resolution: channelFormResolution,
      aspect_ratio: channelFormAspectRatio,
      status: channelFormStatus,
      access_permission: channelFormPermission,
      is_locked: channelFormPermission === 'restricted',
      description: channelFormDescription.trim(),
      current_program: channelFormProgram.trim() || 'Transmissão Ao Vivo'
    };

    try {
      const url = editingChannelId ? `/api/admin/channels/${editingChannelId}` : '/api/admin/channels';
      const method = editingChannelId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChannelFormError(data.error || 'Erro ao salvar canal no PostgreSQL.');
        return;
      }

      await fetchChannels();
      setIsChannelModalOpen(false);
      triggerToast(editingChannelId ? 'Canal atualizado com sucesso!' : 'Canal cadastrado com sucesso!');
    } catch (err: any) {
      setChannelFormError(err.message || 'Falha de comunicação com o servidor.');
    } finally {
      setIsSavingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este canal da grade oficial? Esta ação removerá o canal do PostgreSQL.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/channels/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        setChannels(prev => prev.filter(c => c.id !== id));
        triggerToast('Canal removido com sucesso no banco de dados.');
      } else {
        triggerToast('Falha ao remover canal.');
      }
    } catch (err) {
      triggerToast('Erro de conexão ao remover canal.');
    }
  };

  // ==========================================
  // Section 9: Manual Payment Orders & Financial History
  // ==========================================
  const fetchManualOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const [ordersRes, finRes] = await Promise.all([
        fetch('/api/admin/orders', { headers: getAuthHeaders(), credentials: 'include' }),
        fetch('/api/admin/financial/history', { headers: getAuthHeaders(), credentials: 'include' })
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setManualOrders(Array.isArray(data) ? data : []);
      }
      if (finRes.ok) {
        const finData = await finRes.json();
        setFinancialSummary(finData);
      }
    } catch (err) {
      console.warn('[Admin] Erro ao carregar pedidos manuais:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm('Confirma a aprovação deste pagamento? A assinatura do cliente será ativada e o vencimento recalculado de acordo com a duração do plano contratado.')) {
      return;
    }
    setProcessingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerToast(data.message || 'Pagamento aprovado e assinatura ativada!');
        await fetchManualOrders();
        // Also refresh subscribers
        const subRes = await fetch('/api/admin/subscribers', { headers: getAuthHeaders(), credentials: 'include' });
        if (subRes.ok) {
          const subs = await subRes.json();
          setSubscribers(subs);
        }
      } else {
        triggerToast(data.error || 'Erro ao aprovar pedido.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao aprovar pagamento.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectingOrder) return;
    if (!rejectionReasonInput.trim()) {
      alert('Informe o motivo da rejeição do pedido.');
      return;
    }
    setProcessingOrderId(rejectingOrder.id);
    try {
      const res = await fetch(`/api/admin/orders/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReasonInput.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        triggerToast(data.message || 'Pedido rejeitado.');
        setRejectingOrder(null);
        setRejectionReasonInput('');
        await fetchManualOrders();
      } else {
        triggerToast(data.error || 'Erro ao rejeitar pedido.');
      }
    } catch (err) {
      triggerToast('Falha na comunicação ao rejeitar pedido.');
    } finally {
      setProcessingOrderId(null);
    }
  };


  // Toggle Ad Slot
  const handleToggleAdSlot = async (slotId: string) => {
    const targetSlot = adSlots.find(a => a.id === slotId);
    if (!targetSlot) return;

    try {
      const res = await fetch(`/api/admin/ads/${slotId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ is_enabled: !targetSlot.isEnabled })
      });

      if (res.ok) {
        setAdSlots(prev =>
          prev.map(slot => slot.id === slotId ? { ...slot, isEnabled: !slot.isEnabled } : slot)
        );
        triggerToast('Configuração de anúncio salva no servidor.');
      }
    } catch (err) {
      triggerToast('Erro ao salvar alteração de anúncio.');
    }
  };

  // Save Appearance (Nome, Slogan, Logo, Favicon, Cores)
  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAppearance(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          site_name: tempSiteName.trim() || 'Gato Net',
          tagline: tempTagline.trim(),
          logo_url: tempLogoUrl ? tempLogoUrl.trim() : null,
          favicon_url: tempFaviconUrl ? tempFaviconUrl.trim() : null,
          primary_color: tempPrimaryColor,
          dark_navy_color: tempDarkNavyColor,
          electric_blue_color: tempElectricBlueColor
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSystemSettings(prev => ({
          ...prev,
          siteName: data.site_name || tempSiteName,
          tagline: data.tagline || tempTagline,
          logoUrl: data.logo_url || tempLogoUrl,
          faviconUrl: data.favicon_url || tempFaviconUrl,
          primaryColor: data.primary_color || tempPrimaryColor,
          darkNavyColor: data.dark_navy_color || tempDarkNavyColor,
          electricBlueColor: data.electric_blue_color || tempElectricBlueColor
        }));
        triggerToast('Identidade visual, logotipo, favicon e cores salvos com sucesso!');
      } else {
        triggerToast(data.error || 'Erro ao salvar aparência.');
      }
    } catch (err) {
      triggerToast('Erro ao salvar aparência.');
    } finally {
      setIsSavingAppearance(false);
    }
  };

  // Save General Settings & Access Modes (Modos 1, 2, 3, navegação pública, telas simultâneas, relay)
  const handleSaveGeneralSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingGeneralSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          current_mode: tempAccessMode,
          allow_public_browse: tempAllowPublicBrowse,
          max_simultaneous_streams: tempMaxSimultaneousStreams,
          stream_relay_enabled: tempStreamRelayEnabled
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSystemSettings(prev => ({
          ...prev,
          accessMode: data.current_mode || tempAccessMode,
          allowPublicChannelBrowse: data.allow_public_browse !== undefined ? data.allow_public_browse : tempAllowPublicBrowse,
          maxSimultaneousStreams: data.max_simultaneous_streams || tempMaxSimultaneousStreams,
          streamRelayEnabled: data.stream_relay_enabled !== undefined ? data.stream_relay_enabled : tempStreamRelayEnabled
        }));
        triggerToast(`Configurações gerais e modo de acesso salvos! Modo ativo: ${tempAccessMode === 'free' ? 'Modo 1 - Gratuito' : tempAccessMode === 'free_registered' ? 'Modo 2 - Cadastro' : 'Modo 3 - Assinatura'}`);
      } else {
        triggerToast(data.error || 'Erro ao salvar configurações gerais.');
      }
    } catch (err) {
      triggerToast('Erro ao salvar configurações gerais.');
    } finally {
      setIsSavingGeneralSettings(false);
    }
  };

  // Change Access Mode direct toggle
  const handleChangeAccessMode = async (mode: AccessMode) => {
    setTempAccessMode(mode);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          current_mode: mode,
          allow_public_browse: tempAllowPublicBrowse,
          max_simultaneous_streams: tempMaxSimultaneousStreams,
          stream_relay_enabled: tempStreamRelayEnabled
        })
      });

      if (res.ok) {
        setSystemSettings(prev => ({ ...prev, accessMode: mode }));
        triggerToast(`Modo de acesso alterado no servidor para: ${mode === 'free' ? 'Modo 1 - Gratuito sem cadastro' : mode === 'free_registered' ? 'Modo 2 - Gratuito com cadastro' : 'Modo 3 - Assinatura paga'}`);
      }
    } catch (err) {
      triggerToast('Erro ao alterar modo de acesso.');
    }
  };

  // Save Payments Form
  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          pix_key: pixKey,
          pix_recipient_name: pixRecipient,
          pix_city: pixCity,
          paypal_payment_link: paypalLink
        })
      });

      if (res.ok) {
        setPaymentSettings(prev => ({
          pix: {
            ...prev.pix,
            key: pixKey,
            recipientName: pixRecipient,
            city: pixCity
          },
          paypal: {
            ...prev.paypal,
            paymentLink: paypalLink
          }
        }));
        triggerToast('Configurações Pix e PayPal salvas no servidor!');
      }
    } catch (err) {
      triggerToast('Erro ao salvar dados de pagamento.');
    }
  };

  // Approve Subscriber Payment
  const handleApproveSubscriber = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/subscribers/${subId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (res.ok) {
        setSubscribers(prev =>
          prev.map(sub => sub.id === subId ? { ...sub, status: 'active', notes: 'Aprovado manualmente via painel administrativo' } : sub)
        );
        triggerToast('Assinatura ativada no banco de dados!');
      }
    } catch (err) {
      triggerToast('Erro ao aprovar assinante.');
    }
  };

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#060911] flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="w-12 h-12 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin mb-4" />
        <span className="text-xs font-mono">Verificando sessão administrativa com o servidor...</span>
      </div>
    );
  }

  // Not authenticated: Show Login / Setup
  if (!currentAdmin) {
    return (
      <AdminLogin
        isSetupRequired={isSetupRequired}
        isBackendUnavailable={isBackendUnavailable}
        onLoginSuccess={(admin, token) => {
          setCurrentAdmin(admin);
          if (token) sessionStorage.setItem('gatonet_admin_token', token);
          triggerToast(`Bem-vindo, ${admin.name}!`);
        }}
        onClose={onCloseAdmin}
      />
    );
  }

  const menuItems: { id: AdminSection; label: string; icon: any }[] = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'channels', label: '2. Gerenciamento de Canais', icon: Tv },
    { id: 'categories', label: '3. Categorias', icon: FolderTree },
    { id: 'sources', label: '4. Fontes de Transmissão', icon: Radio },
    { id: 'ads', label: '5. Publicidade e Banners', icon: Megaphone },
    { id: 'appearance', label: '6. Aparência do Site', icon: Palette },
    { id: 'subscribers', label: '7. Assinantes', icon: Users },
    { id: 'plans', label: '8. Planos de Assinatura', icon: CreditCard },
    { id: 'payments', label: '9. Pagamentos Manuais', icon: QrCode },
    { id: 'analytics', label: '10. Estatísticas e Audiência', icon: BarChart3 },
    { id: 'settings', label: '11. Configurações Gerais', icon: Sliders },
    { id: 'security', label: '12. Segurança e Backups', icon: ShieldAlert },
    { id: 'featured', label: '13. Destaques da Programação', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col">
      {/* Toast alert */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="h-16 px-6 bg-[#090f20] border-b border-blue-900/60 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onCloseAdmin}
            className="p-2 rounded-lg bg-[#060911] hover:bg-blue-950 text-slate-300 hover:text-white border border-blue-900/50 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para a TV</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              GATO<span className="text-blue-400">NET</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ Painel Administrativo</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin User Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#060911] border border-blue-900/40 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-medium">{currentAdmin.name}</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/20">
              {currentAdmin.role}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-[#060911] hover:bg-red-950/50 border border-slate-800 text-slate-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Encerrar Sessão com Segurança"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Admin Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar (260px) */}
        <aside className="w-full md:w-68 bg-[#070c18] border-r border-blue-950/60 p-4 shrink-0 overflow-y-auto">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Módulos do Sistema
            </span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#0b1329]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-3.5 rounded-xl bg-[#091024] border border-blue-900/40 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL & Backend</span>
            </div>
            <p className="leading-relaxed">
              Persistência ativa no servidor. Totalmente compatível com PostgreSQL 16 na VPS Virtarix.
            </p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 bg-[#060911] overflow-y-auto max-w-6xl">
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  1. Dashboard Geral da Plataforma
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Visão executiva dos serviços, estado da VPS Virtarix e controle de acesso dos canais.
                </p>
              </div>

              {/* Status Notice about Step 2 Backend & Argon2id */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Etapa 2 Ativa: Backend Operacional com Argon2id & PostgreSQL</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Sessão administrativa autenticada como <strong>{currentAdmin.name}</strong> ({currentAdmin.email}) com perfil <strong>{currentAdmin.role}</strong>. As alterações realizadas nos canais, publicidade, categorias, assinantes e configurações são salvas diretamente no servidor e persistidas.
                  </p>
                </div>
              </div>

              {/* PostgreSQL & VPS Virtarix Notice */}
              <div className="p-4 rounded-xl bg-[#091024] border border-amber-500/40 text-xs text-amber-200/90 flex items-start gap-3">
                <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">PostgreSQL 16 — Modo de Pré-visualização (VPS Virtarix)</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    As variáveis <code className="text-amber-300 font-mono">DATABASE_URL</code>, <code className="text-amber-300 font-mono">POSTGRES_USER</code>, <code className="text-amber-300 font-mono">POSTGRES_PASSWORD</code> e <code className="text-amber-300 font-mono">POSTGRES_DB</code> serão configuradas na VPS Virtarix com Ubuntu 24.04. Nesta etapa de pré-visualização, o backend opera com persistência segura no servidor sem depender de credenciais externas fictícias.
                  </p>
                </div>
              </div>

              {/* 4 Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Canais Cadastrados</span>
                    <Tv className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {channels.length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {channels.filter(c => c.isLive).length} no ar · {categories.length - 1} categorias
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Modo de Acesso</span>
                    <Sliders className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400 truncate">
                    {systemSettings.accessMode === 'free'
                      ? 'Modo 1 - Gratuito sem cadastro'
                      : systemSettings.accessMode === 'free_registered'
                      ? 'Modo 2 - Gratuito com cadastro'
                      : 'Modo 3 - Assinatura paga'}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Configurável no módulo 11
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Slots de Publicidade</span>
                    <Megaphone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {adSlots.filter((a) => a.isEnabled).length} / {adSlots.length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Espaços de monetização ativos
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Banco de Dados</span>
                    <Database className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    PostgreSQL 16 Ready
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    VPS Virtarix Ubuntu 24.04
                  </span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="p-5 rounded-xl bg-[#090f20] border border-blue-900/40 space-y-3">
                <h3 className="font-bold text-sm text-white">Atalhos Rápidos de Gestão</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => handleSelectSection('channels')}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Novo Canal</span>
                  </button>
                  <button
                    onClick={() => handleSelectSection('payments')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Configurar Chave Pix</span>
                  </button>
                  <button
                    onClick={() => handleSelectSection('appearance')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    <span>Personalizar Logotipo & Cores</span>
                  </button>
                  <button
                    onClick={() => handleSelectSection('security')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ver Logs de Auditoria</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GERENCIAMENTO DE CANAIS (CRUD REAL NO POSTGRESQL) */}
          {activeSection === 'channels' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Tv className="w-6 h-6 text-blue-400" />
                    <span>2. Gerenciamento de Canais e Categorias</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    CRUD completo no PostgreSQL: logotipo, transmissão principal, fontes reservas com prioridade, status e permissão de acesso.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchChannels}
                    className="p-2.5 rounded-xl bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Recarregar canais do banco"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddChannel}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md shadow-blue-900/30 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Novo Canal</span>
                  </button>
                </div>
              </div>

              {/* Status summary badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1 rounded-lg bg-[#090f20] border border-blue-900/50 text-slate-300">
                  Total: <strong className="text-white">{channels.length}</strong> canais
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                  Ativos: <strong className="text-white">{channels.filter(c => c.status === 'active' || (!c.status && c.isLive)).length}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
                  Manutenção: <strong className="text-white">{channels.filter(c => c.status === 'maintenance').length}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">
                  Inativos: <strong className="text-white">{channels.filter(c => c.status === 'inactive').length}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300">
                  Restritos (VIP): <strong className="text-white">{channels.filter(c => c.accessPermission === 'restricted' || c.isLocked).length}</strong>
                </span>
              </div>

              {/* Channels Table */}
              <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Canal & Logotipo</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Fontes (Principal / Reservas)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Permissão</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {channels.map((ch) => {
                        const altsCount = (ch.alternativeStreams || []).length;
                        const statusVal = ch.status || (ch.isLive ? 'active' : 'inactive');
                        const isRestricted = ch.accessPermission === 'restricted' || ch.isLocked;

                        return (
                          <tr key={ch.id} className="hover:bg-[#0c1630] transition-colors">
                            {/* Canal & Logotipo */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-400 font-bold w-7 text-right">
                                  #{ch.number}
                                </span>
                                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                                  {ch.logo ? (
                                    <img
                                      src={ch.logo}
                                      alt={ch.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : null}
                                  <Tv className="w-4 h-4 text-blue-400 fallback-icon" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate">{ch.name}</span>
                                  <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                    {ch.description || ch.currentProgram || 'Sem descrição'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Categoria */}
                            <td className="py-3 px-4 text-slate-300 font-medium">
                              {ch.categoryName || 'Geral'}
                            </td>

                            {/* Fontes */}
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <div className="max-w-[220px] truncate text-blue-300" title={ch.streamUrl}>
                                {ch.streamUrl}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {altsCount > 0 ? (
                                  <span className="text-emerald-400 font-bold">
                                    +{altsCount} fonte(s) reserva
                                  </span>
                                ) : (
                                  'Sem fonte reserva'
                                )}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {statusVal === 'active' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Ativo
                                </span>
                              )}
                              {statusVal === 'maintenance' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  Manutenção
                                </span>
                              )}
                              {statusVal === 'inactive' && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
                                  Inativo
                                </span>
                              )}
                            </td>

                            {/* Permissão */}
                            <td className="py-3 px-4">
                              {isRestricted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                                  <Lock className="w-3 h-3" />
                                  Restrito VIP
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
                                  Gratuito
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditChannel(ch)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600/20 border border-transparent hover:border-blue-500/30 transition-colors cursor-pointer"
                                  title="Editar canal"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChannel(ch.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                                  title="Excluir canal do banco de dados"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit Channel Modal */}
              {isChannelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                  <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-[#090f20] border border-blue-500/40 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                          <Tv className="w-5 h-5 text-blue-400" />
                          <span>{editingChannelId ? `Editar Canal #${channelFormNumber}` : 'Cadastrar Novo Canal na Grade'}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Grave e atualize informações completas diretamente no PostgreSQL.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChannelModalOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {channelFormError && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{channelFormError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveChannel} className="space-y-4">
                      {/* Linha 1: Número, Nome e Categoria */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Ordem / Nº *
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={channelFormNumber}
                            onChange={(e) => setChannelFormNumber(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Nome do Canal *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Gato Esportes 4K"
                            value={channelFormName}
                            onChange={(e) => setChannelFormName(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Categoria *
                          </label>
                          <select
                            value={channelFormCategory}
                            onChange={(e) => setChannelFormCategory(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          >
                            {categories.filter((c) => c.id !== 'cat_all').map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Linha 2: Upload de Logotipo ou URL com Preview */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Logotipo do Canal (Upload de Imagem ou URL)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-black border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {channelFormLogo ? (
                              <img
                                src={channelFormLogo}
                                alt="Preview Logo"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Image className="w-5 h-5 text-slate-500" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              placeholder="https://... ou faça upload pelo botão ao lado"
                              value={channelFormLogo}
                              onChange={(e) => setChannelFormLogo(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                                <Upload className="w-3 h-3 text-blue-400" />
                                <span>Upload Imagem</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => setChannelFormLogo(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-slate-400">
                                PNG, JPG ou SVG (Dimensões ideais: 160x160)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Linha 3: URL Principal da Transmissão */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-slate-300">
                            URL Principal da Transmissão *
                          </label>
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Proteção Anti-SSRF Ativa
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="https://servidor.stream.com/live/canal.m3u8"
                          value={channelFormStreamUrl}
                          onChange={(e) => setChannelFormStreamUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Protocolos aceitos: http, https, rtmp, rtmps, hls, udp. Hosts locais e redes privadas são bloqueados contra SSRF.
                        </p>
                      </div>

                      {/* Linha 4: URLs Reservas com Prioridade */}
                      <div className="p-3.5 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">URLs Reservas (Failover de Fontes)</span>
                            <span className="text-[10px] text-slate-400">Adicione rotas alternativas com prioridade de fallback</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextPrio = channelFormAltStreams.length + 1;
                              setChannelFormAltStreams(prev => [
                                ...prev,
                                { url: '', priority: nextPrio, label: `Fonte Reserva ${nextPrio}` }
                              ]);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-700/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar Reserva</span>
                          </button>
                        </div>

                        {channelFormAltStreams.length > 0 ? (
                          <div className="space-y-2">
                            {channelFormAltStreams.map((alt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-20">
                                  <input
                                    type="number"
                                    min={1}
                                    value={alt.priority}
                                    title="Prioridade"
                                    placeholder="Prioridade"
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10) || 1;
                                      setChannelFormAltStreams(prev => {
                                        const clone = [...prev];
                                        clone[idx] = { ...clone[idx], priority: val };
                                        return clone;
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white text-center"
                                  />
                                </div>
                                <div className="w-32">
                                  <input
                                    type="text"
                                    placeholder="Rótulo"
                                    value={alt.label}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setChannelFormAltStreams(prev => {
                                        const clone = [...prev];
                                        clone[idx] = { ...clone[idx], label: val };
                                        return clone;
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="https://... URL reserva"
                                    value={alt.url}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setChannelFormAltStreams(prev => {
                                        const clone = [...prev];
                                        clone[idx] = { ...clone[idx], url: val };
                                        return clone;
                                      });
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChannelFormAltStreams(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 cursor-pointer"
                                  title="Remover fonte reserva"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 block italic">
                            Nenhuma URL reserva cadastrada. Clique no botão acima para adicionar caso queira contingência.
                          </span>
                        )}
                      </div>

                      {/* Linha 5: Status, Permissão de Acesso e Resolução */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Status do Canal
                          </label>
                          <select
                            value={channelFormStatus}
                            onChange={(e) => setChannelFormStatus(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="active">Ativo (No Ar)</option>
                            <option value="maintenance">Em Manutenção</option>
                            <option value="inactive">Inativo (Oculto)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Permissão de Acesso
                          </label>
                          <select
                            value={channelFormPermission}
                            onChange={(e) => setChannelFormPermission(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="free">Gratuito (Livre)</option>
                            <option value="restricted">Restrito (Apenas Assinantes VIP)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Qualidade / Resolução
                          </label>
                          <select
                            value={channelFormResolution}
                            onChange={(e) => setChannelFormResolution(e.target.value as any)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="1080p">1080p Full HD</option>
                            <option value="4K">4K Ultra HD</option>
                            <option value="720p">720p HD</option>
                          </select>
                        </div>
                      </div>

                      {/* Linha 6: Descrição e Programa EPG */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Programa Atual (EPG)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Transmissão Ao Vivo (Demonstração)"
                            value={channelFormProgram}
                            onChange={(e) => setChannelFormProgram(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Descrição do Canal
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Grade esportiva com partidas exclusivas em alta definição."
                            value={channelFormDescription}
                            onChange={(e) => setChannelFormDescription(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsChannelModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingChannel}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingChannel ? 'Gravando no Banco...' : 'Salvar no PostgreSQL'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: CATEGORIAS */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  3. Gerenciamento de Categorias
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Organize as seções temáticas e ordene os canais exibidos na página inicial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-blue-950 font-mono text-xs font-bold text-blue-400 flex items-center justify-center">
                        {idx}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">Slug: /{cat.slug}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-1 rounded border border-blue-900/60">
                      {channels.filter((c) => cat.id === 'cat_all' || c.categoryId === cat.id).length} canais
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: FONTES DE TRANSMISSÃO */}
          {activeSection === 'sources' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  4. Fontes de Transmissão (Streaming Sources)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure as rotas de streaming HLS, servidores de contingência e monitoramento de latência.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Servidor Primário HLS Virtarix</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pronto para HLS na VPS</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Protocolo Padrão:</span>
                    <span className="text-white font-bold">HLS (HTTP Live Streaming)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Failover Automático:</span>
                    <span className="text-emerald-400 font-bold">Habilitado</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Porta Virtarix:</span>
                    <span className="text-blue-400 font-bold">200 Mbps</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  As fontes cadastradas contam com verificação de integridade e contingência preparadas para Nginx na VPS Virtarix.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 5: PUBLICIDADE E BANNERS (Com Sub-módulo Vídeos Pré-roll) */}
          {activeSection === 'ads' && (
            <div className="space-y-6">
              {/* Header with Title and Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Megaphone className="w-6 h-6 text-blue-400" />
                    <span>5. Publicidade e Banners</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Gerencie campanhas de vídeo pré-roll exibidas antes da transmissão dos canais e os slots de banners estáticos da plataforma.
                  </p>
                </div>

                {/* Sub-tabs Switcher */}
                <div className="flex items-center gap-2 bg-[#090f20] p-1.5 rounded-xl border border-blue-900/40 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAdTab('preroll')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      adTab === 'preroll'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Vídeos Pré-roll</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-blue-200">
                      {prerollCampaigns.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdTab('banners')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      adTab === 'banners'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Banners e Slots Estáticos</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-blue-200">
                      5
                    </span>
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: VÍDEOS PRÉ-ROLL */}
              {adTab === 'preroll' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Database persistence status banner */}
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
                    <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-white">Mecanismo de Publicidade Pré-roll e Métricas Reais: </span>
                      As campanhas são avaliadas pelo backend antes de iniciar qualquer transmissão. Todas as impressões, conclusões, pulos e cliques registram eventos reais na tabela <code>preroll_events</code> do PostgreSQL, sem dados inventados.
                    </div>
                  </div>

                  {/* Top Real KPI Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* 1. Ativas */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Campanhas</span>
                        <Video className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.activeCampaigns} <span className="text-xs font-normal text-slate-400">/ {prerollSummary.totalCampaigns}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Ativas no sistema</span>
                    </div>

                    {/* 2. Impressões Reais */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Impressões</span>
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.totalImpressions.toLocaleString('pt-BR')}
                      </div>
                      <span className="text-[10px] text-slate-400">Exibições reais</span>
                    </div>

                    {/* 3. Conclusões Reais */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Conclusões</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.totalCompletions.toLocaleString('pt-BR')}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">{prerollSummary.completionRate}% até o fim</span>
                    </div>

                    {/* 4. Taxa de Conclusão */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Taxa de Fim</span>
                        <Percent className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.completionRate}%
                      </div>
                      <span className="text-[10px] text-slate-400">Conclusão média</span>
                    </div>

                    {/* 5. Pulos de Anúncio */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Pulos</span>
                        <FastForward className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.totalSkips.toLocaleString('pt-BR')}
                      </div>
                      <span className="text-[10px] text-slate-400">Pular anúncio</span>
                    </div>

                    {/* 6. Cliques no Patrocinador */}
                    <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                        <span>Cliques (CTR)</span>
                        <MousePointerClick className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div className="text-xl font-bold font-mono text-white">
                        {prerollSummary.totalClicks.toLocaleString('pt-BR')}
                      </div>
                      <span className="text-[10px] text-purple-400 font-medium">CTR: {prerollSummary.ctr}%</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      Total de <span className="font-bold text-white">{prerollCampaigns.length}</span> campanhas cadastradas. A veiculação é priorizada e intercalada respeitando regras de acesso e planos isentos.
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={fetchPrerollCampaigns}
                        disabled={isLoadingPreroll}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Atualizar métricas"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPreroll ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenNewPrerollModal}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Campanha de Pré-roll</span>
                      </button>
                    </div>
                  </div>

                  {/* Campaign List Table */}
                  <div className="overflow-x-auto rounded-xl border border-blue-900/40 bg-[#090f20]">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead className="bg-[#0b1329] text-[11px] uppercase tracking-wider text-slate-400 font-mono border-b border-blue-900/40">
                        <tr>
                          <th className="p-3.5">Patrocinador / Campanha</th>
                          <th className="p-3.5">Segmentação & Regras</th>
                          <th className="p-3.5 text-center">Prioridade</th>
                          <th className="p-3.5 text-center">Métricas Reais (Imp / Fim / Pulos / Cliques)</th>
                          <th className="p-3.5 text-center">Status</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {prerollCampaigns.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              Nenhuma campanha de pré-roll cadastrada até o momento.
                            </td>
                          </tr>
                        ) : (
                          prerollCampaigns.map((camp) => (
                            <tr key={camp.id} className="hover:bg-blue-950/20 transition-colors">
                              {/* Sponsor & Title */}
                              <td className="p-3.5 max-w-[280px]">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-white text-xs">
                                      {camp.sponsor_name}
                                    </span>
                                    {camp.is_demo && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                                        Demonstração
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-300 font-medium truncate" title={camp.title}>
                                    {camp.title}
                                  </div>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPreview(camp.video_url, camp.title, camp.sponsor_name)}
                                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
                                    >
                                      <PlaySquare className="w-3 h-3" />
                                      <span>Ver Vídeo</span>
                                    </button>
                                    {camp.target_url && (
                                      <a
                                        href={camp.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 truncate max-w-[130px]"
                                        title={camp.target_url}
                                      >
                                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{camp.target_url.replace(/^https?:\/\//, '')}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Segmentation & Rules */}
                              <td className="p-3.5">
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 font-mono">Alvo:</span>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-medium border border-blue-900/40">
                                      {camp.target_type === 'all'
                                        ? 'Todos os Canais'
                                        : camp.target_type === 'channels'
                                        ? `${camp.target_channel_ids?.length || 0} canais selecionados`
                                        : `${camp.target_category_ids?.length || 0} categorias`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                    <span>Pular:</span>
                                    <span className={camp.skip_enabled ? 'text-amber-300 font-medium' : 'text-slate-400'}>
                                      {camp.skip_enabled ? `Após ${camp.skip_offset_seconds}s` : 'Obrigatório'}
                                    </span>
                                    <span>·</span>
                                    <span>Freq:</span>
                                    <span className="text-slate-300 font-mono">
                                      {camp.frequency_cap_minutes === 0 ? 'Sempre' : `${camp.frequency_cap_minutes}m`}
                                    </span>
                                  </div>
                                  {camp.exempt_plan_ids && camp.exempt_plan_ids.length > 0 && (
                                    <div className="text-[10px] text-slate-400">
                                      Isentos: <span className="text-emerald-400 font-mono">{camp.exempt_plan_ids.length} plano(s)</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Priority */}
                              <td className="p-3.5 text-center">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 font-mono font-bold border border-blue-800/40 text-xs">
                                  {camp.priority}/10
                                </span>
                              </td>

                              {/* Real Stats */}
                              <td className="p-3.5 text-center">
                                <div className="inline-grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                                  <div className="p-1 rounded bg-[#060a14] border border-slate-800" title="Impressões reais">
                                    <div className="text-[10px] text-slate-400">IMP</div>
                                    <div className="font-bold text-white">{camp.impressions_count || 0}</div>
                                  </div>
                                  <div className="p-1 rounded bg-[#060a14] border border-slate-800" title="Conclusões completas">
                                    <div className="text-[10px] text-emerald-400">FIM</div>
                                    <div className="font-bold text-emerald-400">{camp.completions_count || 0}</div>
                                  </div>
                                  <div className="p-1 rounded bg-[#060a14] border border-slate-800" title="Pulos do anúncio">
                                    <div className="text-[10px] text-amber-400">PUL</div>
                                    <div className="font-bold text-amber-400">{camp.skips_count || 0}</div>
                                  </div>
                                  <div className="p-1 rounded bg-[#060a14] border border-slate-800" title="Cliques no patrocinador">
                                    <div className="text-[10px] text-purple-400">CLI</div>
                                    <div className="font-bold text-purple-400">{camp.clicks_count || 0}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Status Toggle */}
                              <td className="p-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePrerollStatus(camp.id)}
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    camp.is_active
                                      ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                  }`}
                                >
                                  {camp.is_active ? 'Ativa' : 'Pausada'}
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(camp.video_url, camp.title, camp.sponsor_name)}
                                    title="Prévia do vídeo publicitário"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition-colors cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleEditPrerollItem(camp)}
                                    title="Editar campanha"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleResetPrerollCounters(camp.id)}
                                    title="Zerar métricas reais da campanha"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-600/30 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeletePrerollItem(camp.id)}
                                    title="Excluir campanha"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-600/30 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: BANNERS E SLOTS ESTÁTICOS (PRESERVADO) */}
              {adTab === 'banners' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 rounded-xl bg-[#090f20] border border-blue-900/40 text-xs text-slate-400">
                    Estes 5 espaços publicitários estáticos são posicionados no cabeçalho, topo da grade, lateral do player, rodapé e modal de planos.
                  </div>

                  {adSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-5 rounded-xl bg-[#090f20] border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{slot.title}</span>
                          <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/40">
                            {slot.dimensions}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{slot.subtitle}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAdSlot(slot.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            slot.isEnabled
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                          }`}
                        >
                          {slot.isEnabled ? 'Slot Ativado' : 'Slot Desativado'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create / Edit Pre-roll Campaign Modal */}
              {isPrerollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-3xl bg-[#090f20] border border-blue-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                    {/* Modal Header */}
                    <div className="p-5 bg-[#0b1329] border-b border-blue-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-400" />
                        <h3 className="font-extrabold text-white text-base">
                          {editingPrerollId ? 'Editar Campanha de Vídeo Pré-roll' : 'Nova Campanha de Vídeo Pré-roll'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPrerollModalOpen(false);
                          setEditingPrerollId(null);
                          setPrerollError(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Fechar formulário"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {prerollError && (
                      <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{prerollError}</span>
                      </div>
                    )}

                    {/* Modal Form Body */}
                    <form onSubmit={handleSavePreroll} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                      {/* 1. Sponsor & Title */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Nome do Patrocinador / Marca: <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={prerollSponsor}
                            onChange={(e) => setPrerollSponsor(e.target.value)}
                            placeholder="Ex: Virtarix Cloud, Gato Net Fibra"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Título da Campanha: <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={prerollTitle}
                            onChange={(e) => setPrerollTitle(e.target.value)}
                            placeholder="Ex: Oferta Especial VPS Virtarix Dedicados"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 2. Video Source (Upload vs URL) */}
                      <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                        <label className="block text-slate-200 font-bold flex items-center justify-between">
                          <span>Vídeo Publicitário (MP4 / WebM — Até 50 MB)</span>
                          {isUploadingVideo && <span className="text-blue-400 animate-pulse text-[11px]">Enviando arquivo de vídeo...</span>}
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Upload Box */}
                          <div className="border border-dashed border-slate-700 hover:border-blue-500/80 rounded-xl p-4 text-center transition-colors bg-[#080d1a]/50">
                            <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <label className="block text-xs font-semibold text-white mb-1 cursor-pointer">
                              Escolher Vídeo no Dispositivo
                              <input
                                type="file"
                                accept="video/mp4,video/webm"
                                onChange={handleVideoUpload}
                                className="hidden"
                                disabled={isUploadingVideo}
                              />
                            </label>
                            <span className="block text-[11px] text-slate-400">
                              Formatos suportados: MP4 (H.264), WebM
                            </span>
                          </div>

                          {/* Direct URL Box */}
                          <div>
                            <label className="block text-slate-400 text-[11px] mb-1">
                              Ou informe URL direta do vídeo (HLS / MP4 CDN):
                            </label>
                            <input
                              type="url"
                              value={prerollVideoUrl}
                              onChange={(e) => setPrerollVideoUrl(e.target.value)}
                              placeholder="https://exemplo.com/video.mp4"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090f20] border border-slate-700 text-white font-mono text-[11px] focus:border-blue-500 focus:outline-none"
                            />
                            {prerollVideoUrl && (
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(prerollVideoUrl, prerollTitle || 'Prévia', prerollSponsor || 'Patrocinador')}
                                className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
                              >
                                <PlaySquare className="w-3.5 h-3.5" />
                                <span>Testar Prévia do Vídeo</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. Destination URL (Optional Clickable CTA) */}
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                          <span>URL de Destino para Cliques (Opcional):</span>
                          <span className="text-[10px] text-slate-400 font-mono">Exibirá o botão "Visitar Patrocinador"</span>
                        </label>
                        <input
                          type="url"
                          value={prerollTargetUrl}
                          onChange={(e) => setPrerollTargetUrl(e.target.value)}
                          placeholder="https://virtarix.com.br/planos"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* 4. Segmentation Target (All, Channels, Categories) */}
                      <div className="space-y-2">
                        <label className="block text-slate-300 font-semibold">
                          Segmentação da Exibição:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'all', label: 'Todos os Canais' },
                            { id: 'channels', label: 'Canais Específicos' },
                            { id: 'categories', label: 'Categorias Específicas' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setPrerollTargetType(t.id as any)}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                                prerollTargetType === t.id
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                  : 'bg-[#060911] border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* If Channels Target */}
                        {prerollTargetType === 'channels' && (
                          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 space-y-2 mt-2">
                            <div className="flex items-center justify-between text-slate-300 font-medium text-[11px]">
                              <span>Selecione os canais ({prerollChannelIds.length} selecionados):</span>
                              <input
                                type="text"
                                placeholder="Filtrar canais..."
                                value={channelSearchQuery}
                                onChange={(e) => setChannelSearchQuery(e.target.value)}
                                className="px-2 py-1 rounded bg-[#090f20] border border-slate-700 text-white text-[11px]"
                              />
                            </div>
                            <div className="max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                              {channels
                                .filter(c => !channelSearchQuery || c.name.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                                .map((c) => {
                                  const isSel = prerollChannelIds.includes(c.id);
                                  return (
                                    <label
                                      key={c.id}
                                      className={`p-2 rounded-lg border text-[11px] flex items-center gap-2 cursor-pointer transition-colors ${
                                        isSel
                                          ? 'bg-blue-950/70 border-blue-500/60 text-white'
                                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSel}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setPrerollChannelIds([...prerollChannelIds, c.id]);
                                          } else {
                                            setPrerollChannelIds(prerollChannelIds.filter(id => id !== c.id));
                                          }
                                        }}
                                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="truncate">{c.number} · {c.name}</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* If Categories Target */}
                        {prerollTargetType === 'categories' && (
                          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 space-y-2 mt-2">
                            <span className="block text-slate-300 font-medium text-[11px]">
                              Selecione as categorias onde o pré-roll será exibido:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {categories.filter(cat => cat.id !== 'all').map((cat) => {
                                const isSel = prerollCategoryIds.includes(cat.id);
                                return (
                                  <label
                                    key={cat.id}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center gap-2 cursor-pointer transition-colors ${
                                      isSel
                                        ? 'bg-blue-950/70 border-blue-500/60 text-white'
                                        : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSel}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setPrerollCategoryIds([...prerollCategoryIds, cat.id]);
                                        } else {
                                          setPrerollCategoryIds(prerollCategoryIds.filter(id => id !== cat.id));
                                        }
                                      }}
                                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="truncate">{cat.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 5. Priority & Frequency Cap */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                            <span>Prioridade / Alternância:</span>
                            <span className="font-mono text-blue-400 font-bold">{prerollPriority} / 10</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={prerollPriority}
                            onChange={(e) => setPrerollPriority(parseInt(e.target.value, 10))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                          <span className="block text-[11px] text-slate-400 mt-1">
                            Campanhas com maior prioridade são exibidas preferencialmente.
                          </span>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Limite de Frequência por Visitante:
                          </label>
                          <select
                            value={prerollFrequencyCap}
                            onChange={(e) => setPrerollFrequencyCap(parseInt(e.target.value, 10))}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                          >
                            <option value={0}>A cada troca de canal (Sem limite)</option>
                            <option value={5}>No máximo 1 vez a cada 5 minutos</option>
                            <option value={15}>No máximo 1 vez a cada 15 minutos</option>
                            <option value={30}>No máximo 1 vez a cada 30 minutos</option>
                            <option value={60}>No máximo 1 vez a cada 1 hora</option>
                            <option value={120}>No máximo 1 vez a cada 2 horas</option>
                          </select>
                        </div>
                      </div>

                      {/* 6. Skip Settings */}
                      <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prerollSkipEnabled}
                            onChange={(e) => setPrerollSkipEnabled(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-white font-bold">Permitir "Pular Anúncio"</span>
                        </label>

                        {prerollSkipEnabled && (
                          <div className="pl-6 pt-1 flex items-center gap-3">
                            <span className="text-slate-300">Liberar botão após:</span>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={prerollSkipOffset}
                              onChange={(e) => setPrerollSkipOffset(parseInt(e.target.value, 10) || 0)}
                              className="w-20 px-2.5 py-1.5 rounded-lg bg-[#090f20] border border-slate-700 text-white font-mono text-center font-bold"
                            />
                            <span className="text-slate-400">segundos (ex: 5s)</span>
                          </div>
                        )}
                      </div>

                      {/* 7. Plan Exemptions */}
                      <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-2">
                        <span className="block text-slate-200 font-bold">
                          Planos de Assinatura Isentos de Publicidade:
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Assinantes ativos dos planos selecionados abaixo não serão impactados por este pré-roll:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {plans.map((p) => {
                            const isExempt = prerollExemptPlans.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                                  isExempt
                                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                                    : 'bg-black/30 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isExempt}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPrerollExemptPlans([...prerollExemptPlans, p.id]);
                                    } else {
                                      setPrerollExemptPlans(prerollExemptPlans.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono ml-auto">R$ {p.price}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* 8. Period & Continuous */}
                      <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prerollIsContinuous}
                            onChange={(e) => setPrerollIsContinuous(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-white font-bold">Veiculação contínua (Sem data de término programada)</span>
                        </label>

                        {!prerollIsContinuous && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 pt-1">
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Início da Veiculação:</label>
                              <input
                                type="datetime-local"
                                value={prerollStartDate}
                                onChange={(e) => setPrerollStartDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#090f20] border border-slate-700 text-white font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 font-semibold mb-1">Término da Veiculação:</label>
                              <input
                                type="datetime-local"
                                value={prerollEndDate}
                                onChange={(e) => setPrerollEndDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#090f20] border border-slate-700 text-white font-mono text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 9. Active status */}
                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prerollIsActive}
                            onChange={(e) => setPrerollIsActive(e.target.checked)}
                            className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-emerald-300 font-bold">Ativar campanha imediatamente após salvar</span>
                        </label>
                      </div>

                      {/* Modal Footer */}
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPrerollModalOpen(false);
                            setEditingPrerollId(null);
                            setPrerollError(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingPreroll || isUploadingVideo}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-colors cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingPreroll ? 'Salvando Campanha...' : 'Salvar Campanha de Pré-roll'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Floating Video Preview Modal */}
              {isPreviewModalOpen && previewVideoUrl && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl bg-[#090f20] border border-blue-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-4 bg-[#0b1329] border-b border-blue-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlaySquare className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="font-bold text-white text-sm">{previewVideoTitle || 'Prévia do Vídeo'}</h4>
                          <span className="text-[11px] text-slate-400">Patrocinador: <strong className="text-amber-300">{previewVideoSponsor}</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Fechar prévia"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative aspect-video bg-black flex items-center justify-center">
                      <video
                        src={previewVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-3 bg-[#070b18] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="font-mono truncate max-w-md">{previewVideoUrl}</span>
                      <button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(false)}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                      >
                        Fechar Prévia
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: APARÊNCIA DO SITE E IDENTIDADE VISUAL */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Palette className="w-6 h-6 text-blue-400" />
                    <span>6. Configurações de Aparência e Identidade Visual</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Edite o nome da plataforma, slogan, logotipo, favicon e paleta de cores. As alterações persistem no banco de dados após atualizar a página ou reiniciar o servidor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTempSiteName('Gato Net');
                    setTempTagline('Plataforma Profissional de Televisão Ao Vivo');
                    setTempLogoUrl('');
                    setTempFaviconUrl('');
                    setTempPrimaryColor('#060911');
                    setTempDarkNavyColor('#0b1329');
                    setTempElectricBlueColor('#2563eb');
                    triggerToast('Configurações redefinidas para os padrões. Clique em Salvar para persistir.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
                  title="Restaurar valores de fábrica"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Padrões de Fábrica</span>
                </button>
              </div>

              {/* Status Note about Database Persistence */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">Persistência Server-Side e Banco de Dados: </span>
                  As imagens são validadas quanto a tipo MIME seguro (PNG, JPG, WEBP, SVG, ICO) e tamanho, armazenadas no diretório permanente <code>/uploads</code> e as referências são persistidas na tabela <code>appearance_configs</code> do PostgreSQL.
                </div>
              </div>

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAppearance} className="space-y-6">
                {/* 1. Nome & Slogan */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Nome da Plataforma e Slogan Oficial</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Nome da Plataforma</span>
                        <span className="text-[10px] font-mono text-slate-400">{tempSiteName.length}/40 caracteres</span>
                      </label>
                      <input
                        type="text"
                        maxLength={40}
                        value={tempSiteName}
                        onChange={(e) => setTempSiteName(e.target.value)}
                        placeholder="Ex: Gato Net TV"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <span className="block text-[11px] text-slate-400 mt-1">
                        Utilizado na barra superior, tags de SEO, títulos das abas e rodapé.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Slogan / Descrição Curta</span>
                        <span className="text-[10px] font-mono text-slate-400">{tempTagline.length}/100 caracteres</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={tempTagline}
                        onChange={(e) => setTempTagline(e.target.value)}
                        placeholder="Ex: Plataforma Profissional de Televisão Ao Vivo"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <span className="block text-[11px] text-slate-400 mt-1">
                        Exibido abaixo do logotipo e na descrição compartilhada do site.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Logotipo (Upload com validação + URL direta + Prévia) */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Image className="w-4 h-4 text-blue-400" />
                        <span>Logotipo Oficial da Plataforma</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Faça upload de arquivo (PNG, JPG, WEBP, SVG - Máx 5 MB) ou informe uma URL externa.
                      </p>
                    </div>
                    {tempLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setTempLogoUrl('')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Emblema Padrão</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Upload Box */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Upload de Arquivo de Imagem
                        </label>
                        <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-5 text-center transition-colors bg-[#060a14]">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadImage(file, 'logo');
                              }
                            }}
                            disabled={isUploadingLogo}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
                              {isUploadingLogo ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-white">
                              {isUploadingLogo ? 'Processando e salvando imagem...' : 'Clique ou arraste a imagem do logotipo'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Formatos: PNG, JPG, WEBP, SVG, GIF (Tamanho máximo: 5 MB)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Ou informe a URL direta do Logotipo
                        </label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/logo-gatonet.png ou /uploads/..."
                          value={tempLogoUrl}
                          onChange={(e) => setTempLogoUrl(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Logo Live Preview */}
                    <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">
                        Prévia em Tempo Real do Logotipo
                      </span>

                      <div className="p-6 rounded-xl bg-[#090f20] border border-blue-900/30 flex items-center justify-center min-h-[90px]">
                        {tempLogoUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={tempLogoUrl}
                              alt="Prévia do Logotipo"
                              className="max-h-14 max-w-[240px] object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <span className="text-[10px] font-mono text-emerald-400">Logotipo Personalizado Ativo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0e172f] via-[#0b1329] to-[#060911] border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.25)]">
                              <span className="font-extrabold text-blue-400 text-xs font-mono">GN</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-white text-base tracking-tight">
                                {tempSiteName || 'GATO NET'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {tempTagline || 'Televisão Ao Vivo'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 block leading-relaxed">
                        Quando nenhuma imagem é enviada, o sistema exibe o emblema moderno oficial com felino e ondas azuis neon.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Favicon (Upload com validação + Prévia) */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <span>Favicon (Ícone da Aba do Navegador)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ícone de 16x16 ou 32x32 pixels exibido nas abas dos navegadores e favoritos (Máx 1 MB).
                      </p>
                    </div>
                    {tempFaviconUrl && (
                      <button
                        type="button"
                        onClick={() => setTempFaviconUrl('')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Favicon Padrão</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Favicon Upload */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">
                          Upload do Arquivo Favicon
                        </label>
                        <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center transition-colors bg-[#060a14]">
                          <input
                            type="file"
                            accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUploadImage(file, 'favicon');
                              }
                            }}
                            disabled={isUploadingFavicon}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
                              {isUploadingFavicon ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </div>
                            <span className="text-xs font-semibold text-white">
                              {isUploadingFavicon ? 'Salvando favicon...' : 'Selecionar arquivo de Favicon'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Formatos: .ICO, .PNG, .SVG (Tamanho máx: 1 MB)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Ou URL do Favicon
                        </label>
                        <input
                          type="url"
                          placeholder="https://exemplo.com/favicon.ico"
                          value={tempFaviconUrl}
                          onChange={(e) => setTempFaviconUrl(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Favicon Browser Simulation Preview */}
                    <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-3">
                      <span className="text-xs font-bold text-slate-300 block">
                        Simulação da Aba do Navegador
                      </span>

                      <div className="rounded-xl bg-[#090e1f] border border-slate-800 p-2.5 flex items-center gap-2 max-w-xs shadow-inner">
                        {tempFaviconUrl ? (
                          <img
                            src={tempFaviconUrl}
                            alt="Favicon"
                            className="w-4 h-4 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">
                            G
                          </div>
                        )}
                        <span className="text-xs text-slate-200 font-medium truncate flex-1">
                          {tempSiteName || 'Gato Net'} — {tempTagline || 'TV Ao Vivo'}
                        </span>
                        <X className="w-3 h-3 text-slate-500" />
                      </div>

                      <span className="text-[11px] text-slate-400 block leading-relaxed">
                        Ao salvar, o link <code>rel="icon"</code> do documento HTML é atualizado dinamicamente.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Paleta de Cores & Customização Visual */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-blue-400" />
                        <span>Paleta de Cores e Tematização</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Personalize os tons de fundo, superfícies de cards e a cor de destaque elétrico.
                      </p>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">Paletas rápidas:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPrimaryColor('#060911');
                          setTempDarkNavyColor('#0b1329');
                          setTempElectricBlueColor('#2563eb');
                        }}
                        className="px-2 py-1 rounded bg-[#060911] border border-blue-500/40 text-[10px] font-semibold text-blue-300 hover:bg-blue-950 cursor-pointer"
                      >
                        Gato Net Neon
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPrimaryColor('#020617');
                          setTempDarkNavyColor('#0f172a');
                          setTempElectricBlueColor('#38bdf8');
                        }}
                        className="px-2 py-1 rounded bg-[#020617] border border-sky-500/40 text-[10px] font-semibold text-sky-300 hover:bg-slate-900 cursor-pointer"
                      >
                        Midnight Sky
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPrimaryColor('#05110d');
                          setTempDarkNavyColor('#0b201a');
                          setTempElectricBlueColor('#10b981');
                        }}
                        className="px-2 py-1 rounded bg-[#05110d] border border-emerald-500/40 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-950 cursor-pointer"
                      >
                        Esmeralda
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempPrimaryColor('#09090b');
                          setTempDarkNavyColor('#18181b');
                          setTempElectricBlueColor('#6366f1');
                        }}
                        className="px-2 py-1 rounded bg-[#09090b] border border-indigo-500/40 text-[10px] font-semibold text-indigo-300 hover:bg-zinc-900 cursor-pointer"
                      >
                        Cyber Indigo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Cor 1: Fundo Principal */}
                    <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-2">
                      <label className="block text-xs font-medium text-slate-300">
                        Cor de Fundo Principal
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={tempPrimaryColor}
                          onChange={(e) => setTempPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={tempPrimaryColor}
                          onChange={(e) => setTempPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono uppercase rounded-lg bg-[#0a1022] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Fundo principal da página e do player.
                      </span>
                    </div>

                    {/* Cor 2: Superfície / Cards */}
                    <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-2">
                      <label className="block text-xs font-medium text-slate-300">
                        Superfície e Cards (Azul-Marinho)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={tempDarkNavyColor}
                          onChange={(e) => setTempDarkNavyColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={tempDarkNavyColor}
                          onChange={(e) => setTempDarkNavyColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono uppercase rounded-lg bg-[#0a1022] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Fundo dos cards de canais e barra de navegação.
                      </span>
                    </div>

                    {/* Cor 3: Azul Elétrico / Destaque */}
                    <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-2">
                      <label className="block text-xs font-medium text-slate-300">
                        Acento e Botões (Azul Elétrico)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={tempElectricBlueColor}
                          onChange={(e) => setTempElectricBlueColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={tempElectricBlueColor}
                          onChange={(e) => setTempElectricBlueColor(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono uppercase rounded-lg bg-[#0a1022] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Botões principais, badges ativos e seleções.
                      </span>
                    </div>
                  </div>

                  {/* Live Theme Preview Box */}
                  <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">
                      Prévia dos Componentes com as Cores Escolhidas
                    </span>

                    <div
                      className="p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors"
                      style={{
                        backgroundColor: tempDarkNavyColor,
                        borderColor: tempElectricBlueColor + '50'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                          style={{ backgroundColor: tempElectricBlueColor }}
                        >
                          AO VIVO
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Canal Demonstrativo Premium</h4>
                          <span className="text-xs text-slate-300">Transmissão em Full HD 1080p</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: tempElectricBlueColor }}
                        >
                          VIP ATIVO
                        </span>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow transition-opacity hover:opacity-90"
                          style={{ backgroundColor: tempElectricBlueColor }}
                        >
                          Assistir Agora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-400">
                    Todas as configurações são persistidas e mantidas após atualizar ou reiniciar.
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingAppearance}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
                  >
                    {isSavingAppearance ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingAppearance ? 'Salvando no banco...' : 'Salvar Alterações de Aparência'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 7: ASSINANTES */}
          {activeSection === 'subscribers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  7. Gestão de Assinantes
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe os cadastros de assinantes com Nome, WhatsApp e E-mail (sem exigência de CPF).
                </p>
              </div>

              <div className="rounded-xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Nome Completo</th>
                        <th className="py-3 px-4">WhatsApp</th>
                        <th className="py-3 px-4">E-mail</th>
                        <th className="py-3 px-4">Plano</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#0c1630]">
                          <td className="py-3 px-4 font-semibold text-white">{sub.fullName}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            <a
                              href={`https://wa.me/55${sub.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{sub.whatsapp}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{sub.email}</td>
                          <td className="py-3 px-4">{sub.planName}</td>
                          <td className="py-3 px-4">
                            {sub.status === 'active' ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                Ativo
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                Pendente Pix
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{sub.expiresAt}</td>
                          <td className="py-3 px-4 text-right">
                            {sub.status === 'pending' && (
                              <button
                                onClick={() => handleApproveSubscriber(sub.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Aprovar Pagamento
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Estrutura com suporte total à tabela <code>subscribers</code> do PostgreSQL 16.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 8: PLANOS DE ASSINATURA (GERENCIADOR COMPLETO) */}
          {activeSection === 'plans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                    <span>8. Gerenciador de Planos de Assinatura</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Cadastre, edite e personalize livremente planos, valores em Reais, telas simultâneas, benefícios e canais autorizados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreatePlan}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Plano</span>
                </button>
              </div>

              {/* Status Note about PostgreSQL persistence */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">Persistência em PostgreSQL 16: </span>
                  Planos cadastrados ou editados são salvos na tabela <code>subscription_plans</code>. Ao excluir um plano com histórico de assinantes, o sistema o arquiva automaticamente para manter o registro contábil íntegro.
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-2xl bg-[#090f20] border transition-all flex flex-col justify-between ${
                      plan.isActive
                        ? plan.isPopular
                          ? 'border-blue-500/60 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/40'
                          : 'border-blue-900/40'
                        : 'border-slate-800 opacity-60 bg-[#080d1a]'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                            #{plan.displayOrder || 1}
                          </span>
                          {plan.badge && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-bold">
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        {plan.isActive ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            Arquivado / Inativo
                          </span>
                        )}
                      </div>

                      {/* Plan Title & Price */}
                      <div>
                        <h4 className="font-bold text-white text-base leading-snug">{plan.name}</h4>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                            R$ {plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {plan.periodLabel || `por ${plan.durationDays || 30} dias`}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-[#060a14] p-2.5 rounded-lg border border-slate-800/80">
                          {plan.description}
                        </p>
                      )}

                      {/* Specifications Summary */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                        <div className="p-2 rounded bg-[#060a14] border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">Duração:</span>
                          <span className="font-bold text-white">{plan.durationDays || 30} dias</span>
                        </div>
                        <div className="p-2 rounded bg-[#060a14] border border-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">Telas Simultâneas:</span>
                          <span className="font-bold text-blue-400">{plan.maxScreens || 1} tela(s)</span>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>
                          {plan.allowedScope === 'custom'
                            ? `Escopo restrito (${plan.allowedCategoryIds?.length || 0} cats, ${plan.allowedChannelIds?.length || 0} canais)`
                            : 'Acesso a todos os canais da grade'}
                        </span>
                      </div>

                      {/* Features / Benefits */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                          Benefícios inclusos:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlan(plan)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePlanActive(plan)}
                          title={plan.isActive ? 'Desativar Plano' : 'Ativar Plano'}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            plan.isActive
                              ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40'
                              : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOrArchivePlan(plan)}
                          title="Excluir ou Arquivar Plano"
                          className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit / Create Plan Modal */}
              {isPlanModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div className="relative w-full max-w-2xl bg-[#090f20] border border-blue-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl my-8 text-slate-100 max-h-[90vh] overflow-y-auto">
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6 border-b border-slate-800 pb-4">
                      <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800/40">
                        {editingPlanId ? 'Edição de Plano' : 'Novo Plano de Assinatura'}
                      </span>
                      <h3 className="text-xl font-extrabold text-white mt-2">
                        {editingPlanId ? `Editar Plano: ${planFormName}` : 'Cadastrar Novo Plano'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Todos os parâmetros são gravados no banco PostgreSQL e imediatamente aplicados aos assinantes.
                      </p>
                    </div>

                    <form onSubmit={handleSavePlan} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Nome do Plano *
                          </label>
                          <input
                            type="text"
                            required
                            value={planFormName}
                            onChange={(e) => setPlanFormName(e.target.value)}
                            placeholder="Ex: Plano Mensal VIP, Plano Família 4K..."
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Badge / Destaque
                          </label>
                          <input
                            type="text"
                            value={planFormBadge}
                            onChange={(e) => setPlanFormBadge(e.target.value)}
                            placeholder="Ex: Mais Popular, Econômico, Especial..."
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Preço em Reais (R$) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={planFormPrice}
                            onChange={(e) => setPlanFormPrice(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Duração em Dias *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={planFormDurationDays}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 30;
                              setPlanFormDurationDays(val);
                              setPlanFormPeriodLabel(`por ${val} dias`);
                            }}
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Rótulo de Período
                          </label>
                          <input
                            type="text"
                            value={planFormPeriodLabel}
                            onChange={(e) => setPlanFormPeriodLabel(e.target.value)}
                            placeholder="Ex: por 30 dias, por mês"
                            className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Máximo de Telas Simultâneas *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            required
                            value={planFormMaxScreens}
                            onChange={(e) => setPlanFormMaxScreens(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Ordem de Apresentação *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={planFormDisplayOrder}
                            onChange={(e) => setPlanFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Checkboxes: Active & Popular */}
                      <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={planFormIsActive}
                            onChange={(e) => setPlanFormIsActive(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Plano Ativo (visível para contratação)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={planFormIsPopular}
                            onChange={(e) => setPlanFormIsPopular(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Destacar como Mais Popular</span>
                        </label>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Descrição do Plano
                        </label>
                        <textarea
                          rows={2}
                          value={planFormDescription}
                          onChange={(e) => setPlanFormDescription(e.target.value)}
                          placeholder="Descrição detalhada das vantagens e finalidade do plano..."
                          className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Scope of Access: all vs custom */}
                      <div className="p-3.5 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                        <label className="block text-xs font-bold text-white">
                          Escopo de Canais Autorizados
                        </label>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                            <input
                              type="radio"
                              name="planScope"
                              value="all"
                              checked={planFormAllowedScope === 'all'}
                              onChange={() => setPlanFormAllowedScope('all')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Todos os Canais (Acesso Completo)</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                            <input
                              type="radio"
                              name="planScope"
                              value="custom"
                              checked={planFormAllowedScope === 'custom'}
                              onChange={() => setPlanFormAllowedScope('custom')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Categorias / Canais Específicos</span>
                          </label>
                        </div>

                        {planFormAllowedScope === 'custom' && (
                          <div className="pt-2 border-t border-slate-800 space-y-3">
                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                                Categorias Permitidas:
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.filter(c => c.id !== 'cat_all').map((cat) => {
                                  const isChecked = planFormAllowedCategories.includes(cat.id);
                                  return (
                                    <label
                                      key={cat.id}
                                      className="flex items-center gap-2 p-2 rounded-lg bg-[#090f20] border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setPlanFormAllowedCategories(prev =>
                                            isChecked ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                                          );
                                        }}
                                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="truncate">{cat.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                                Canais Individuais Permitidos:
                              </span>
                              <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-lg bg-[#090f20] border border-slate-800">
                                {channels.map((chan) => {
                                  const isChecked = planFormAllowedChannels.includes(chan.id);
                                  return (
                                    <label
                                      key={chan.id}
                                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-850 text-[11px] text-slate-300 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setPlanFormAllowedChannels(prev =>
                                            isChecked ? prev.filter(id => id !== chan.id) : [...prev, chan.id]
                                          );
                                        }}
                                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="truncate">{chan.number} - {chan.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Features / Benefits list */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Benefícios e Vantagens Exibidos
                        </label>
                        <div className="space-y-2 mb-2">
                          {planFormFeatures.map((feat, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#060911] border border-slate-800 text-xs">
                              <span className="text-slate-200">{feat}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(idx)}
                                className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newFeatureInput}
                            onChange={(e) => setNewFeatureInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddFeature();
                              }
                            }}
                            placeholder="Ex: Qualidade 4K UHD sem travamentos..."
                            className="flex-1 px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Modal Footer buttons */}
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsPlanModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingPlan}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingPlan ? 'Salvando...' : 'Salvar Plano no Banco'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 9: PAGAMENTOS MANUAIS (PIX & PAYPAL), CONFERÊNCIA E HISTÓRICO FINANCEIRO */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <QrCode className="w-6 h-6 text-blue-400" />
                    <span>9. Gestão de Pagamentos Manuais (Pix & PayPal)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Conferência administrativa de comprovantes, aprovação manual com ativação de assinatura e histórico financeiro.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchManualOrders}
                    disabled={isLoadingOrders}
                    className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin text-blue-400' : ''}`} />
                    <span>{isLoadingOrders ? 'Atualizando...' : 'Atualizar Pedidos'}</span>
                  </button>
                </div>
              </div>

              {/* Subtabs Switcher */}
              <div className="flex border-b border-slate-800 space-x-1">
                <button
                  type="button"
                  onClick={() => setPaymentSubTab('orders')}
                  className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                    paymentSubTab === 'orders'
                      ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Conferência de Pedidos & Comprovantes</span>
                  {manualOrders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold font-mono">
                      {manualOrders.filter(o => o.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentSubTab('financial')}
                  className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                    paymentSubTab === 'financial'
                      ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Histórico Financeiro & Relatórios</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentSubTab('configs')}
                  className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
                    paymentSubTab === 'configs'
                      ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <span>Configuração de Chaves (Pix & PayPal)</span>
                </button>
              </div>

              {/* SUBTAB 1: CONFERÊNCIA DE PEDIDOS & COMPROVANTES */}
              {paymentSubTab === 'orders' && (
                <div className="space-y-4">
                  {/* Filters row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#060a14] border border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-medium">Filtrar por Status:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          ordersFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todos ({manualOrders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          ordersFilter === 'pending'
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-slate-900 text-amber-300 hover:bg-slate-800'
                        }`}
                      >
                        Pendentes ({manualOrders.filter(o => o.status === 'pending').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('approved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          ordersFilter === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-emerald-300 hover:bg-slate-800'
                        }`}
                      >
                        Aprovados ({manualOrders.filter(o => o.status === 'approved').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrdersFilter('rejected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          ordersFilter === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-900 text-red-300 hover:bg-slate-800'
                        }`}
                      >
                        Rejeitados ({manualOrders.filter(o => o.status === 'rejected').length})
                      </button>
                    </div>
                  </div>

                  {/* Orders List Table */}
                  <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">Pedido / Data</th>
                            <th className="py-3 px-4">Cliente</th>
                            <th className="py-3 px-4">Método & Plano</th>
                            <th className="py-3 px-4">Valor</th>
                            <th className="py-3 px-4">Comprovante</th>
                            <th className="py-3 px-4">Status / Auditoria</th>
                            <th className="py-3 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {manualOrders
                            .filter(o => ordersFilter === 'all' || o.status === ordersFilter)
                            .map((order) => {
                              const isPending = order.status === 'pending';
                              const isApproved = order.status === 'approved';
                              const isRejected = order.status === 'rejected';
                              const hasReceipt = Boolean(order.receipt_url || order.receipt_code);

                              return (
                                <tr key={order.id} className="hover:bg-[#0c1630] transition-colors">
                                  {/* Pedido / Data */}
                                  <td className="py-3 px-4">
                                    <span className="block font-mono font-bold text-white text-xs">
                                      {order.order_code}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      {new Date(order.created_at).toLocaleString('pt-BR')}
                                    </span>
                                  </td>

                                  {/* Cliente */}
                                  <td className="py-3 px-4">
                                    <span className="block font-semibold text-white">
                                      {order.subscriber_name || 'Cliente Gato Net'}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-400 block">
                                      {order.subscriber_email}
                                    </span>
                                    {order.subscriber_whatsapp && (
                                      <span className="text-[10px] text-slate-500 font-mono block">
                                        WhatsApp: {order.subscriber_whatsapp}
                                      </span>
                                    )}
                                  </td>

                                  {/* Método & Plano */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      {order.payment_method === 'pix' ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-600/40 flex items-center gap-1">
                                          <QrCode className="w-3 h-3" />
                                          Pix
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-600/40 flex items-center gap-1">
                                          <CreditCard className="w-3 h-3" />
                                          PayPal
                                        </span>
                                      )}
                                      <span className="font-semibold text-white text-xs">
                                        {order.plan_name || 'Plano VIP'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono block">
                                      Válido por {order.plan_duration_days || 30} dias
                                    </span>
                                  </td>

                                  {/* Valor */}
                                  <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                                    R$ {Number(order.amount).toFixed(2).replace('.', ',')}
                                  </td>

                                  {/* Comprovante */}
                                  <td className="py-3 px-4">
                                    {hasReceipt ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReceiptOrder(order)}
                                        className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Ver Comprovante</span>
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 italic">
                                        Sem comprovante
                                      </span>
                                    )}
                                  </td>

                                  {/* Status / Auditoria */}
                                  <td className="py-3 px-4">
                                    {isPending && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                        <Clock className="w-3 h-3 animate-pulse" />
                                        Pendente
                                      </span>
                                    )}
                                    {isApproved && (
                                      <div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                          <CheckCircle className="w-3 h-3" />
                                          Aprovado
                                        </span>
                                        {order.reviewed_by_admin_email && (
                                          <span className="text-[10px] text-slate-400 font-mono block mt-1">
                                            Por: {order.reviewed_by_admin_email}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {isRejected && (
                                      <div>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/40">
                                          <XCircle className="w-3 h-3" />
                                          Rejeitado
                                        </span>
                                        {order.rejection_reason && (
                                          <span className="text-[10px] text-red-300 block mt-0.5 max-w-xs truncate" title={order.rejection_reason}>
                                            Motivo: {order.rejection_reason}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>

                                  {/* Ação */}
                                  <td className="py-3 px-4 text-right">
                                    {isPending ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          disabled={processingOrderId === order.id}
                                          onClick={() => handleApproveOrder(order.id)}
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow"
                                          title="Aprovar pagamento e ativar assinatura"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Aprovar</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={processingOrderId === order.id}
                                          onClick={() => {
                                            setRejectingOrder(order);
                                            setRejectionReasonInput('Não identificado no extrato bancário');
                                          }}
                                          className="px-2 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Rejeitar pagamento com justificativa"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>Rejeitar</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Processado
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    {manualOrders.filter(o => ordersFilter === 'all' || o.status === ordersFilter).length === 0 && (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Nenhum pedido encontrado para o filtro selecionado.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: HISTÓRICO FINANCEIRO & AUDITORIA */}
              {paymentSubTab === 'financial' && (
                <div className="space-y-5">
                  {/* Financial summary metric cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Receita Total Confirmada</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                        R$ {financialSummary ? Number(financialSummary.totalRevenue).toFixed(2).replace('.', ',') : '0,00'}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Somente pagamentos aprovados
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Pedidos Pendentes</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                        {financialSummary ? financialSummary.pendingCount : manualOrders.filter(o => o.status === 'pending').length}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Aguardando conferência no extrato
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Assinaturas Ativadas</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                        {financialSummary ? financialSummary.approvedCount : manualOrders.filter(o => o.status === 'approved').length}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Pedidos validados por administradores
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">Pedidos Rejeitados</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">
                        {financialSummary ? financialSummary.rejectedCount : manualOrders.filter(o => o.status === 'rejected').length}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Recusados por divergência ou fraude
                      </span>
                    </div>
                  </div>

                  {/* Financial Audit Trail */}
                  <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          <History className="w-4 h-4 text-blue-400" />
                          <span>Extrato Consolidado de Transações</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Registro contínuo e imutável das movimentações financeiras no PostgreSQL.
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {manualOrders.length} registros
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Data</th>
                            <th className="py-2.5 px-3">Cliente</th>
                            <th className="py-2.5 px-3">Método</th>
                            <th className="py-2.5 px-3">Plano</th>
                            <th className="py-2.5 px-3">Valor</th>
                            <th className="py-2.5 px-3">Conferido Por</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {manualOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-[#0c1630]">
                              <td className="py-2.5 px-3 font-mono font-bold text-white">{order.order_code}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">
                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-2.5 px-3">{order.subscriber_email}</td>
                              <td className="py-2.5 px-3 font-mono uppercase">{order.payment_method}</td>
                              <td className="py-2.5 px-3">{order.plan_name}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                                R$ {Number(order.amount).toFixed(2).replace('.', ',')}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400">
                                {order.reviewed_by_admin_email || '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                {order.status === 'approved' && (
                                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                    Aprovado
                                  </span>
                                )}
                                {order.status === 'pending' && (
                                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                    Pendente
                                  </span>
                                )}
                                {order.status === 'rejected' && (
                                  <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                                    Rejeitado
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: CONFIGURAÇÃO DE CHAVES (PIX & PAYPAL) */}
              {paymentSubTab === 'configs' && (
                <form onSubmit={handleSavePayments} className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-6">
                  <div className="border-b border-slate-800 pb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <QrCode className="w-4 h-4 text-blue-400" />
                      <span>Configuração do Pix (Brasil)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Chave Pix *
                        </label>
                        <input
                          type="text"
                          required
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Nome do Recebedor *
                        </label>
                        <input
                          type="text"
                          required
                          value={pixRecipient}
                          onChange={(e) => setPixRecipient(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Cidade do Recebedor *
                        </label>
                        <input
                          type="text"
                          required
                          value={pixCity}
                          onChange={(e) => setPixCity(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <span>Configuração do PayPal (Internacional)</span>
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Link de Pagamento PayPal *
                      </label>
                      <input
                        type="url"
                        required
                        value={paypalLink}
                        onChange={(e) => setPaypalLink(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados de Pagamento Manual</span>
                  </button>
                </form>
              )}

              {/* Modal de Visualização de Comprovante */}
              {selectedReceiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                  <div className="relative w-full max-w-xl rounded-2xl bg-[#090f20] border border-blue-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-base text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span>Comprovante do Pedido {selectedReceiptOrder.order_code}</span>
                        </h4>
                        <span className="text-xs text-slate-400">
                          {selectedReceiptOrder.subscriber_name} ({selectedReceiptOrder.subscriber_email}) · R$ {Number(selectedReceiptOrder.amount).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {selectedReceiptOrder.receipt_url ? (
                      <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-800 bg-black p-2 flex items-center justify-center">
                        <img
                          src={selectedReceiptOrder.receipt_url}
                          alt="Comprovante de Pagamento"
                          className="max-w-full max-h-[55vh] object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 bg-[#060a14] rounded-xl border border-slate-800">
                        Nenhum anexo de imagem enviado para este pedido.
                      </div>
                    )}

                    {selectedReceiptOrder.receipt_code && (
                      <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 text-xs">
                        <span className="text-slate-400 block mb-0.5 font-medium">Código de Autenticação / NSU:</span>
                        <span className="font-mono text-white font-bold text-sm select-all">
                          {selectedReceiptOrder.receipt_code}
                        </span>
                      </div>
                    )}

                    {selectedReceiptOrder.notes && (
                      <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 text-xs">
                        <span className="text-slate-400 block mb-0.5 font-medium">Observações do Cliente:</span>
                        <p className="text-slate-200">{selectedReceiptOrder.notes}</p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Criado em: {new Date(selectedReceiptOrder.created_at).toLocaleString('pt-BR')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Rejeição com Motivo */}
              {rejectingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                  <div className="relative w-full max-w-md rounded-2xl bg-[#090f20] border border-red-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-base text-white flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span>Rejeitar Pagamento #{rejectingOrder.order_code}</span>
                        </h4>
                        <span className="text-xs text-slate-400">
                          Cliente: {rejectingOrder.subscriber_email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRejectingOrder(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Motivo da Rejeição *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="Ex: Não identificado no extrato bancário, valor divergente ou comprovante ilegível..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRejectingOrder(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={processingOrderId === rejectingOrder.id}
                        onClick={handleRejectOrder}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                      >
                        <X className="w-4 h-4" />
                        <span>Confirmar Rejeição</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 10: ESTATÍSTICAS E AUDIÊNCIA (DADOS REAIS & CONTROLE DE TELAS) */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <span>10. Estatísticas e Audiência em Tempo Real</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Métricas reais de audiência, sessões simultâneas ativas por assinante, limites por plano e histórico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAnalytics}
                  disabled={isLoadingAnalytics}
                  className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalytics ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{isLoadingAnalytics ? 'Atualizando...' : 'Atualizar Métricas'}</span>
                </button>
              </div>

              {/* Informative Header Banner */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">Auditoria Real de Sessões: </span>
                  O sistema gerencia sessões de reprodução ativas via <code>playback_sessions</code> no PostgreSQL com identificador exclusivo e heartbeats periódicos a cada 15 segundos. Sessões abandonadas são expiradas automaticamente.
                </div>
              </div>

              {/* Real Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Assinantes Cadastrados */}
                <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 relative overflow-hidden">
                  <span className="text-xs text-slate-400 block mb-1">Assinantes Cadastrados</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                      {analyticsStats ? analyticsStats.totalSubscribers : subscribers.length}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">contas</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                    Registrados no PostgreSQL
                  </span>
                </div>

                {/* 2. Assinantes Ativos */}
                <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 relative overflow-hidden">
                  <span className="text-xs text-slate-400 block mb-1">Assinantes Ativos</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400">
                      {analyticsStats ? analyticsStats.activeSubscribers : subscribers.filter(s => s.status === 'active').length}
                    </span>
                    <span className="text-[11px] text-emerald-400/80 font-mono">em dia</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                    Com plano contratado e liberado
                  </span>
                </div>

                {/* 3. Sessões Ativas em Reprodução */}
                <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 relative overflow-hidden">
                  <span className="text-xs text-slate-400 block mb-1">Sessões Ativas em Reprodução</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-400">
                      {analyticsStats ? analyticsStats.activeSessionsCount : 0}
                    </span>
                    <span className="text-[11px] text-blue-300 font-mono">telas conectadas</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-mono">Heartbeat ativo (&lt; 45s)</span>
                  </div>
                </div>

                {/* 4. Pico de Espectadores Simultâneos */}
                <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 relative overflow-hidden">
                  <span className="text-xs text-slate-400 block mb-1">Pico de Espectadores</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                      {analyticsStats ? analyticsStats.peakConcurrentViewers : 0}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">máx registrado</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                    Histórico consolidado
                  </span>
                </div>
              </div>

              {/* SECTION A: SESSÕES SIMULTÂNEAS POR ASSINANTE & LIMITE POR PLANO */}
              <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Tv className="w-4 h-4 text-blue-400" />
                      <span>Sessões Simultâneas por Assinante e Limites de Telas</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Controle individual de telas ativas em tempo real e encerramento administrativo forçado.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/60 self-start sm:self-auto">
                    {analyticsStats?.subscribersWithSessions?.length || 0} assinante(s) assistindo
                  </span>
                </div>

                {analyticsStats?.subscribersWithSessions && analyticsStats.subscribersWithSessions.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsStats.subscribersWithSessions.map((subItem: any) => {
                      const limitReached = subItem.activeSessionsCount >= subItem.maxScreens;
                      return (
                        <div
                          key={subItem.subscriberId}
                          className="p-4 rounded-xl bg-[#060a14] border border-slate-800/80 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm">{subItem.subscriberName}</h4>
                                <span className="text-xs font-mono text-slate-400">({subItem.subscriberEmail})</span>
                              </div>
                              <span className="text-[11px] text-blue-400 font-semibold">
                                Plano: {subItem.planName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                                  limitReached
                                    ? 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {subItem.activeSessionsCount} de {subItem.maxScreens} tela(s) em uso
                              </span>
                              {limitReached && (
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
                                  Limite Atingido
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sessions list */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-slate-850">
                            {subItem.activeSessions.map((sess: any) => (
                              <div
                                key={sess.sessionId}
                                className="p-3 rounded-lg bg-[#0b1226] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                    <Monitor className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span>{sess.deviceInfo || 'Aparelho Web'}</span>
                                  </div>
                                  <div className="text-slate-300 text-[11px] truncate">
                                    Canal: <span className="text-blue-300 font-medium">{sess.channelName}</span>
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    Início: {new Date(sess.startedAt).toLocaleTimeString('pt-BR')} {sess.ipAddress ? `· IP: ${sess.ipAddress}` : ''}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleTerminateSession(sess.sessionId)}
                                  disabled={terminatingSessionId === sess.sessionId}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Encerrar esta sessão remotamente"
                                >
                                  <LogOut className="w-3 h-3" />
                                  <span>{terminatingSessionId === sess.sessionId ? 'Encerrando...' : 'Derrubar'}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-xl bg-[#060a14] border border-slate-800/80 space-y-2">
                    <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-300">Nenhum assinante assistindo no momento</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Assim que um usuário ou visitante abrir um canal e iniciar a reprodução, a sessão aparecerá aqui em tempo real com controle de telas simultâneas.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION B: AUDIÊNCIA REAL POR CANAL */}
              <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-400" />
                    <span>Audiência Real por Canal</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contagem exata de reproduções ativas por canal demonstrativo.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Canal</th>
                        <th className="py-2.5 px-4">Categoria</th>
                        <th className="py-2.5 px-4 text-right">Espectadores Ativos</th>
                        <th className="py-2.5 px-4">Status de Transmissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {(analyticsStats?.audienceByChannel || channels.map(c => ({
                        channelId: c.id,
                        channelName: c.name,
                        categoryName: c.categoryName,
                        viewersCount: 0
                      }))).map((item: any) => (
                        <tr key={item.channelId} className="hover:bg-[#0c1630]">
                          <td className="py-3 px-4 font-semibold text-white">{item.channelName}</td>
                          <td className="py-3 px-4 text-slate-400">{item.categoryName || 'Geral'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={item.viewersCount > 0 ? 'text-blue-400 text-sm' : 'text-slate-500'}>
                              {item.viewersCount}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.viewersCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                Transmitindo
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500">
                                Em espera
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION C: MÉTRICAS QUE DEPENDEM DA FUTURA ETAPA DE STREAMING */}
              <div className="rounded-2xl border border-slate-800 bg-[#090f20] p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-base">Infraestrutura Avançada de Vídeo & CDN</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Métricas de taxa de transferência, buffer e transcodificação física que serão acopladas no servidor de streaming.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Bitrate Efetivo de Saída CDN</span>
                    <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      Aguardando integração
                    </span>
                    <span className="text-[10px] text-slate-400 block">Dependente do servidor HLS/DASH</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Taxa de Quadros (FPS) Real</span>
                    <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      Aguardando integração
                    </span>
                    <span className="text-[10px] text-slate-400 block">Alimentado via transcodificador</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Saúde do Buffer & Latência</span>
                    <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      Aguardando integração
                    </span>
                    <span className="text-[10px] text-slate-400 block">Telemetry dos nós de borda</span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-1.5">
                    <span className="text-[11px] text-slate-400 block">Consumo Mensal de Tráfego</span>
                    <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      Aguardando integração
                    </span>
                    <span className="text-[10px] text-slate-400 block">Relatórios de egress da VPS</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-[#060a14] p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Conforme os requisitos da plataforma, dados que dependem da futura instalação dos serviços de streaming permanecem indicados claramente como <strong>"Aguardando integração"</strong> para não apresentar valores artificiais.
                  </span>
                </div>
              </div>

              {/* SECTION D: HISTÓRICO DE SESSÕES */}
              <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-400" />
                      <span>Histórico Recente de Sessões</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Registro contínuo de conexões iniciadas, duração e motivos de encerramento.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Últimos registros
                  </span>
                </div>

                {analyticsStats?.recentSessionsHistory && analyticsStats.recentSessionsHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-4">Usuário</th>
                          <th className="py-2.5 px-4">Canal</th>
                          <th className="py-2.5 px-4">Aparelho</th>
                          <th className="py-2.5 px-4">Início</th>
                          <th className="py-2.5 px-4">Duração</th>
                          <th className="py-2.5 px-4">Status / Motivo</th>
                          <th className="py-2.5 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {analyticsStats.recentSessionsHistory.map((sess: any) => (
                          <tr key={sess.id} className="hover:bg-[#0c1630]">
                            <td className="py-3 px-4 font-mono text-slate-300">
                              <span className="block font-semibold text-white">{sess.subscriberName || 'Visitante'}</span>
                              <span className="text-[11px] text-slate-400">{sess.subscriberEmail}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-blue-300">{sess.channelName}</td>
                            <td className="py-3 px-4 text-slate-400">{sess.deviceInfo || 'Web'}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {new Date(sess.startedAt).toLocaleTimeString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {sess.durationSeconds ? `${Math.floor(sess.durationSeconds / 60)}m ${sess.durationSeconds % 60}s` : 'Em andamento'}
                            </td>
                            <td className="py-3 px-4">
                              {sess.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  Ativa
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                  {sess.endedReason === 'heartbeat_timeout'
                                    ? 'Timeout Heartbeat'
                                    : sess.endedReason === 'user_closed'
                                    ? 'Fechada pelo usuário'
                                    : sess.endedReason || 'Encerrada'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {sess.status === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => handleTerminateSession(sess.id)}
                                  className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-300 text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  Derrubar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-[#060a14] rounded-xl border border-slate-800">
                    Histórico inicial pronto. As sessões finalizadas serão listadas automaticamente conforme os testes de reprodução ocorrerem.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 11: CONFIGURAÇÕES GERAIS E MODOS DE ACESSO */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Sliders className="w-6 h-6 text-blue-400" />
                    <span>11. Configurações Gerais e Modos de Acesso</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Defina o modelo de negócio da plataforma, permissões de navegação para visitantes e regras globais de streaming.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveGeneralSettings()}
                  disabled={isSavingGeneralSettings}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50 self-start sm:self-auto"
                >
                  {isSavingGeneralSettings ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingGeneralSettings ? 'Salvando...' : 'Salvar Configurações Gerais'}</span>
                </button>
              </div>

              {/* Status Note about Database Persistence */}
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-300 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">Persistência em PostgreSQL 16: </span>
                  O modo de acesso e os parâmetros gerais são gravados na tabela <code>access_modes</code> e validados pelo backend a cada requisição de reprodução de vídeo.
                </div>
              </div>

              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                {/* 3 Access Modes Selection */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      <span>Modo de Acesso da Plataforma (Modelo Operacional)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Clique no modo desejado para selecioná-lo e configure suas permissões complementares abaixo.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Modo 1 */}
                    <div
                      onClick={() => setTempAccessMode('free')}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        tempAccessMode === 'free'
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                          : 'border-slate-800 bg-[#060a14] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            tempAccessMode === 'free' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            1
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">
                              Modo 1 — Gratuito sem cadastro
                            </h4>
                            <span className="text-[11px] text-blue-400 font-medium">Fase de Lançamento & Demonstração</span>
                          </div>
                        </div>
                        {tempAccessMode === 'free' ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>SELECIONADO</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Clique para selecionar</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-10">
                        Qualquer visitante da internet pode abrir a plataforma e assistir imediatamente a qualquer canal sem exigir criação de conta nem login prévio.
                      </p>
                    </div>

                    {/* Modo 2 */}
                    <div
                      onClick={() => setTempAccessMode('free_registered')}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        tempAccessMode === 'free_registered'
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                          : 'border-slate-800 bg-[#060a14] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            tempAccessMode === 'free_registered' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            2
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">
                              Modo 2 — Gratuito com cadastro obrigatório
                            </h4>
                            <span className="text-[11px] text-blue-400 font-medium">Captação de Leads & Audiência Registrada</span>
                          </div>
                        </div>
                        {tempAccessMode === 'free_registered' ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>SELECIONADO</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Clique para selecionar</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-10">
                        O visitante pode navegar pela vitrine, mas ao clicar no player para assistir a uma transmissão, é solicitado o cadastro rápido com Nome, WhatsApp e E-mail (sem exigência de CPF).
                      </p>
                    </div>

                    {/* Modo 3 */}
                    <div
                      onClick={() => setTempAccessMode('subscription')}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        tempAccessMode === 'subscription'
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                          : 'border-slate-800 bg-[#060a14] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                            tempAccessMode === 'subscription' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            3
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm sm:text-base">
                              Modo 3 — Assinatura paga (Monetização VIP)
                            </h4>
                            <span className="text-[11px] text-blue-400 font-medium">Assinatura Mensal, Semestral ou Anual via Pix/PayPal</span>
                          </div>
                        </div>
                        {tempAccessMode === 'subscription' ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>SELECIONADO</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">Clique para selecionar</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-10">
                        Canais premium e restritos exigem uma assinatura VIP ativa contratada pelos planos cadastrados e aprovada manualmente no módulo financeiro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* General Settings: Browsing, Screen Limits & Stream Relay */}
                <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span>Configurações Gerais de Operação</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ajuste o comportamento do catálogo e limites globais de streaming.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Toggle: Public Channel Browsing */}
                    <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-sm text-white">Navegação Pública do Catálogo</span>
                          {tempAllowPublicBrowse ? (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              Habilitado
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              Bloqueio Total
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Quando ativado, visitantes não autenticados podem ver a lista de canais, categorias e programação na página inicial antes de solicitar o login/assinatura no player.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTempAllowPublicBrowse(!tempAllowPublicBrowse)}
                        className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          tempAllowPublicBrowse ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            tempAllowPublicBrowse ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Number Input: Max Simultaneous Streams default */}
                    <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-sm text-white">Telas Simultâneas Padrão Global</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Limite máximo padrão de telas em reprodução ativa para contas no Modo 2 (usuários sem plano VIP específico). Nos planos VIP do Modo 3, o limite configurado individualmente em cada plano tem prioridade.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={tempMaxSimultaneousStreams}
                          onChange={(e) => setTempMaxSimultaneousStreams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-20 px-3 py-2 text-center text-sm font-mono font-bold rounded-xl bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-xs font-mono text-slate-400">tela(s)</span>
                      </div>
                    </div>

                    {/* Toggle: Stream Relay / Reverse Proxy */}
                    <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-sm text-white">Proxy / Relay de Transmissão no Servidor</span>
                          {tempStreamRelayEnabled ? (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              Ativo
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                              Direto (Desativado)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Habilita retransmissão interna pelo backend para ocultar a URL de origem física de fontes de transmissão externas e resolver problemas de CORS.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTempStreamRelayEnabled(!tempStreamRelayEnabled)}
                        className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          tempStreamRelayEnabled ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            tempStreamRelayEnabled ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-400">
                    Ao salvar, o modo de acesso e os limites entrarão em vigor para todos os usuários imediatamente.
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingGeneralSettings}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
                  >
                    {isSavingGeneralSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingGeneralSettings ? 'Salvando...' : 'Salvar Configurações Gerais'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION 12: SEGURANÇA E BACKUPS */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  12. Segurança, Auditoria e Backups
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Registro imutável de operações administrativas, proteção de acesso e status da VPS Virtarix.
                </p>
              </div>

              {/* Security Diagnostics Card */}
              <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Segurança Implementada (Etapa 2)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px]">Algoritmo de Senha:</span>
                    <div className="text-emerald-400 font-bold">Argon2id RFC 9106</div>
                    <span className="text-[10px] text-slate-500 block">Salt aleatório 16 bytes</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px]">Proteção de Sessão:</span>
                    <div className="text-blue-400 font-bold">HttpOnly + SameSite</div>
                    <span className="text-[10px] text-slate-500 block">Hash SHA-256 no banco</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px]">Proteção Força Bruta:</span>
                    <div className="text-emerald-400 font-bold">Rate Limiting Ativo</div>
                    <span className="text-[10px] text-slate-500 block">Bloqueio após 5 falhas</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400 block text-[10px]">Banco de Dados:</span>
                    <div className="text-slate-200 font-bold">
                      {diagnostics?.database?.isPostgresActive ? 'PostgreSQL 16 Ativo' : 'PostgreSQL 16 Ready'}
                    </div>
                    <span className="text-[10px] text-blue-400 block">VPS Virtarix Ubuntu 24.04</span>
                  </div>
                </div>
              </div>

              {/* Real Audit Logs Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span>Registro de Operações Administrativas (Audit Logs)</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {auditLogs.length} eventos registrados
                  </span>
                </div>

                <div className="rounded-xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Nenhum evento registrado até o momento.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Data / Hora</th>
                            <th className="py-2.5 px-3">Administrador</th>
                            <th className="py-2.5 px-3">Ação</th>
                            <th className="py-2.5 px-3">Entidade</th>
                            <th className="py-2.5 px-3">IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[#0c1630]">
                              <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2.5 px-3 text-white font-medium">
                                {log.admin_email}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/20 text-[10px]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">
                                {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(-6)})` : ''}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">
                                {log.ip_address || '127.0.0.1'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 13. DESTAQUES DA PROGRAMAÇÃO (FEATURED CAROUSEL & PLAYBACK BANNER) */}
          {/* ================================================================ */}
          {activeSection === 'featured' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-900/40">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                    <span>13. Destaques da Programação</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Administre o carrossel exibido no player vazio e a faixa superior durante a reprodução. Os canais são vinculados pelo cadastro interno oficial.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchFeaturedHighlights}
                    disabled={isLoadingFeatured}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Atualizar lista de destaques"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFeatured ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Recarregar</span>
                  </button>
                  <button
                    onClick={handleOpenNewFeaturedModal}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Destaque</span>
                  </button>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-[11px] text-slate-400 font-medium block">Total de Destaques</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-white mt-1 block">
                    {featuredList.length}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Cadastrados no sistema</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-[11px] text-slate-400 font-medium block">Destaques Ativos</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 block">
                    {featuredList.filter(f => f.is_active).length}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Em rotação pública</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-[11px] text-slate-400 font-medium block">Intervalo de Rotação</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-1 block">
                    {featuredAdminSettings.autoplay_interval_seconds}s
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Por slide de atração</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-[11px] text-slate-400 font-medium block">Faixa Superior</span>
                  <span className={`text-xl sm:text-2xl font-extrabold mt-1 block ${
                    featuredAdminSettings.playback_banner_enabled ? 'text-blue-400' : 'text-slate-500'
                  }`}>
                    {featuredAdminSettings.playback_banner_enabled ? 'Ativada' : 'Desativada'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Durante a reprodução</span>
                </div>
              </div>

              {/* Global Settings for Featured Carousel */}
              <div className="p-5 rounded-2xl bg-[#080d1c] border border-blue-900/50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white">Configurações Gerais de Exibição</h3>
                  </div>
                  <button
                    onClick={handleSaveFeaturedSettings}
                    disabled={isSavingFeaturedSettings}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingFeaturedSettings ? 'Salvando...' : 'Salvar Configurações'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Tempo de Exibição dos Slides (segundos):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={featuredAdminSettings.autoplay_interval_seconds}
                        onChange={(e) => setFeaturedAdminSettings({
                          ...featuredAdminSettings,
                          autoplay_interval_seconds: parseInt(e.target.value, 10) || 6
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#060911] border border-slate-700 text-white font-mono focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-400 font-mono text-xs">segundos</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Tempo antes de alternar automaticamente para o próximo destaque.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Limite de Destaques Ativos:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={featuredAdminSettings.max_active_highlights}
                      onChange={(e) => setFeaturedAdminSettings({
                        ...featuredAdminSettings,
                        max_active_highlights: parseInt(e.target.value, 10) || 6
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#060911] border border-slate-700 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Número máximo de slides carregados simultaneamente para os visitantes.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Faixa Superior Durante a Reprodução:
                    </label>
                    <div className="pt-1 flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featuredAdminSettings.playback_banner_enabled}
                          onChange={(e) => setFeaturedAdminSettings({
                            ...featuredAdminSettings,
                            playback_banner_enabled: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-slate-300 text-xs font-medium">
                        {featuredAdminSettings.playback_banner_enabled ? 'Exibir Faixa' : 'Ocultar Faixa'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Permite desativar globalmente o ticker superior acima do player.
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Live Preview Box */}
              <div className="p-5 rounded-2xl bg-[#080d1c] border border-blue-900/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-900/30">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Prévia em Tempo Real</h3>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-black/60 border border-slate-800 text-xs">
                    <button
                      onClick={() => setPreviewTab('carousel')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        previewTab === 'carousel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Player Vazio (Carrossel)
                    </button>
                    <button
                      onClick={() => setPreviewTab('banner')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        previewTab === 'banner' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Faixa Superior (Durante Play)
                    </button>
                  </div>
                </div>

                {/* Live Preview Display */}
                {featuredList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhum destaque cadastrado para visualização. Clique em "Novo Destaque" acima.
                  </div>
                ) : (
                  <div>
                    {previewTab === 'carousel' ? (
                      <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden bg-black border border-slate-800 flex flex-col justify-end p-6">
                        <img
                          src={featuredList[0]?.image_url || '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg'}
                          alt={featuredList[0]?.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/70 to-transparent" />
                        <div className="relative z-10 space-y-2 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase">
                              Destaque da Programação
                            </span>
                            {featuredList[0]?.time_label && (
                              <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 text-[10px] font-semibold">
                                {featuredList[0].time_label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl sm:text-2xl font-extrabold text-white">
                            {featuredList[0]?.title}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            {featuredList[0]?.description || 'Sem descrição informada.'}
                          </p>
                          <div className="pt-1 flex items-center gap-3">
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>{featuredList[0]?.button_text || 'Assistir agora'}</span>
                            </button>
                            <span className="text-[11px] font-mono text-slate-400">
                              Canal: {channels.find(c => c.id === featuredList[0]?.target_channel_id)?.name || 'Canal Gato Net'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950 via-[#0a1530] to-blue-950 border border-blue-500/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-9 rounded-md overflow-hidden bg-black shrink-0 border border-blue-500/30">
                            <img
                              src={featuredList[0]?.image_url || '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white truncate">
                                {featuredList[0]?.title}
                              </span>
                              {featuredList[0]?.time_label && (
                                <span className="text-[10px] text-cyan-300 font-medium">
                                  · {featuredList[0].time_label}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              Vinculado a: {channels.find(c => c.id === featuredList[0]?.target_channel_id)?.name || 'Canal Vinculado'}
                            </span>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shrink-0">
                          <Play className="w-3 h-3 fill-white" />
                          <span>{featuredList[0]?.button_text || 'Assistir'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Destaques Cadastrados ({featuredList.length})</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    Arraste ou ordene usando os botões de posição
                  </span>
                </div>

                <div className="rounded-xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
                  {featuredList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum destaque cadastrado. Clique no botão "+ Novo Destaque" para criar o primeiro.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-3 w-16 text-center">Ordem</th>
                            <th className="py-3 px-3">Imagem</th>
                            <th className="py-3 px-3">Atração / Título</th>
                            <th className="py-3 px-3">Canal Vinculado</th>
                            <th className="py-3 px-3">Exibição</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {featuredList.map((item, idx) => {
                            const targetChannel = channels.find(c => c.id === item.target_channel_id);
                            return (
                              <tr key={item.id} className="hover:bg-[#0c1630] transition-colors">
                                {/* Order Controls */}
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleMoveFeaturedOrder(item.id, 'up')}
                                      disabled={idx === 0}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="Subir posição"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="font-mono font-bold text-xs text-blue-400 w-5">
                                      {item.display_order || idx + 1}
                                    </span>
                                    <button
                                      onClick={() => handleMoveFeaturedOrder(item.id, 'down')}
                                      disabled={idx === featuredList.length - 1}
                                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="Descer posição"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                                {/* Thumbnail */}
                                <td className="py-3 px-3">
                                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-black border border-slate-800 shrink-0">
                                    <img
                                      src={item.image_url}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </td>

                                {/* Title & Info */}
                                <td className="py-3 px-3 min-w-[200px]">
                                  <div className="font-bold text-white text-sm">
                                    {item.title}
                                  </div>
                                  {item.description && (
                                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {item.time_label && (
                                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                        {item.time_label}
                                      </span>
                                    )}
                                    {item.is_demo && (
                                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                                        Demonstração
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Linked Channel */}
                                <td className="py-3 px-3">
                                  {targetChannel ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-black overflow-hidden border border-slate-800 shrink-0">
                                        <img
                                          src={targetChannel.logo}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <span className="font-semibold text-white block">
                                          {String(targetChannel.number).padStart(2, '0')} - {targetChannel.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          ID: {targetChannel.id}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-amber-400 font-mono text-xs">
                                      ID {item.target_channel_id} (Não encontrado)
                                    </span>
                                  )}
                                </td>

                                {/* Placement Badge */}
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                    item.placement === 'both'
                                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                                      : item.placement === 'empty_player'
                                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                  }`}>
                                    {item.placement === 'both'
                                      ? 'Ambos (Carrossel + Faixa)'
                                      : item.placement === 'empty_player'
                                      ? 'Apenas Player Vazio'
                                      : 'Apenas Faixa Superior'}
                                  </span>
                                </td>

                                {/* Active Toggle */}
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleToggleFeaturedActive(item.id, item.is_active)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                      item.is_active
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
                                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                    <span>{item.is_active ? 'Ativo' : 'Inativo'}</span>
                                  </button>
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleEditFeaturedItem(item)}
                                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-blue-950 text-slate-300 hover:text-blue-300 border border-slate-800 transition-colors cursor-pointer"
                                      title="Editar atração em destaque"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFeatured(item.id)}
                                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors cursor-pointer"
                                      title="Remover destaque"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Create / Edit Featured Modal */}
              {isFeaturedModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-2xl bg-[#090f20] border border-blue-900/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Modal Header */}
                    <div className="p-5 bg-[#0b1329] border-b border-blue-900/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-extrabold text-white text-base">
                          {editingFeaturedId ? 'Editar Destaque da Programação' : 'Novo Destaque da Programação'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsFeaturedModalOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Form Body */}
                    <form onSubmit={handleSaveFeaturedItem} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                      {/* Title */}
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Título da Atração / Evento: <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={featTitle}
                          onChange={(e) => setFeatTitle(e.target.value)}
                          placeholder="Ex: Grande Clássico de Domingo (Final do Campeonato)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Descrição / Sinopse Opcional:
                        </label>
                        <textarea
                          rows={2}
                          value={featDescription}
                          onChange={(e) => setFeatDescription(e.target.value)}
                          placeholder="Breve resumo da transmissão ou da programação em destaque..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none resize-none"
                        />
                      </div>

                      {/* Target Channel (Mandatory dropdown linked to existing channels) */}
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Canal de Destino Vinculado: <span className="text-red-400">*</span>
                        </label>
                        <select
                          required
                          value={featTargetChannelId}
                          onChange={(e) => setFeatTargetChannelId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          {channels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              Canal {String(ch.number).padStart(2, '0')} - {ch.name} ({ch.categoryName}) {ch.isLocked ? '[Exclusivo VIP]' : '[Aberto]'}
                            </option>
                          ))}
                        </select>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          O visitante sintonizará este canal oficial ao clicar em "Assistir agora". Todas as permissões de acesso e planos continuam sendo validadas.
                        </span>
                      </div>

                      {/* Image Upload & URL */}
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Imagem de Fundo / Backdrop: <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={featImageUrl}
                            onChange={(e) => setFeatImageUrl(e.target.value)}
                            placeholder="URL da imagem (ex: /uploads/... ou /src/assets/images/...)"
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none font-mono text-[11px]"
                          />
                          <label className="px-3.5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploadingFeatImage ? 'Enviando...' : 'Fazer Upload'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadImage(file, 'featured');
                              }}
                            />
                          </label>
                        </div>

                        {/* Image Preview */}
                        {featImageUrl && (
                          <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden bg-black border border-slate-800">
                            <img
                              src={featImageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2.5">
                              <span className="text-[11px] text-slate-200 font-medium">Prévia da imagem de fundo</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2-Columns: Button text & Time Label */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Texto do Botão:
                          </label>
                          <input
                            type="text"
                            value={featButtonText}
                            onChange={(e) => setFeatButtonText(e.target.value)}
                            placeholder="Assistir agora"
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Rótulo de Data e Horário:
                          </label>
                          <input
                            type="text"
                            value={featTimeLabel}
                            onChange={(e) => setFeatTimeLabel(e.target.value)}
                            placeholder="Ex: Domingo às 16:00, Ao Vivo, etc."
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 2-Columns: Placement & Order */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Local de Exibição:
                          </label>
                          <select
                            value={featPlacement}
                            onChange={(e: any) => setFeatPlacement(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="both">Ambos (Player Vazio e Faixa Superior)</option>
                            <option value="empty_player">Apenas no Player Vazio (Carrossel)</option>
                            <option value="player_banner">Apenas na Faixa Superior (Playback)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Ordem de Exibição:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={featDisplayOrder}
                            onChange={(e) => setFeatDisplayOrder(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Scheduled Dates (Optional) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Início da Publicação (Opcional):
                          </label>
                          <input
                            type="datetime-local"
                            value={featStartDate}
                            onChange={(e) => setFeatStartDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Fim da Publicação (Opcional):
                          </label>
                          <input
                            type="datetime-local"
                            value={featEndDate}
                            onChange={(e) => setFeatEndDate(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#060911] border border-slate-700 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="pt-2 flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={featIsActive}
                            onChange={(e) => setFeatIsActive(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-200 font-semibold">Destaque Ativo na Grade Pública</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={featIsDemo}
                            onChange={(e) => setFeatIsDemo(e.target.checked)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="text-amber-300 font-semibold">Identificar como Demonstração</span>
                        </label>
                      </div>

                      {/* Modal Footer */}
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsFeaturedModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingFeatured}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-colors cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingFeatured ? 'Salvando...' : 'Salvar Destaque'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
