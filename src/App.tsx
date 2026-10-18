import React, { useState, useEffect, useCallback } from 'react';
import {
  Channel,
  Category,
  SubscriptionPlan,
  AdSlot,
  SystemSettings,
  PaymentSettings,
  UserSubscriber
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CHANNELS,
  INITIAL_PLANS,
  INITIAL_AD_SLOTS,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_DEMO_SUBSCRIBERS
} from './data/mockChannels';
import { Header } from './components/Header';
import { Player } from './components/Player';
import { ChannelGrid } from './components/ChannelGrid';
import { AdBanner } from './components/AdBanner';
import { AuthModal } from './components/AuthModal';
import { PlansModal } from './components/PlansModal';
import { SubscriberSessionsModal } from './components/SubscriberSessionsModal';
import { TVRemoteGuide } from './components/TVRemoteGuide';
import { Footer } from './components/Footer';
import { AdminPanel } from './admin/AdminPanel';

export default function App() {
  // State for Gato Net Platform
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(INITIAL_AD_SLOTS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(INITIAL_PAYMENT_SETTINGS);
  const [subscribers, setSubscribers] = useState<UserSubscriber[]>(INITIAL_DEMO_SUBSCRIBERS);

  // Selected Channel state: Starts as null so stream does not start automatically
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('cat_all');
  const [favorites, setFavorites] = useState<string[]>(['ch_globo', 'ch_gato_esportes_1']);

  // Modals & Navigation Views
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isRemoteGuideOpen, setIsRemoteGuideOpen] = useState(false);

  // User Authentication state
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userHasSubscription, setUserHasSubscription] = useState(false);
  const [playbackAuthStatus, setPlaybackAuthStatus] = useState<{
    authorized: boolean;
    reason?: string;
  }>({ authorized: true });

  // Ad Slot Lookups
  const headerAd = adSlots.find((a) => a.slotType === 'header');
  const playerSideAd = adSlots.find((a) => a.slotType === 'player_side');
  const playerBottomAd = adSlots.find((a) => a.slotType === 'player_bottom');
  const footerAd = adSlots.find((a) => a.slotType === 'footer');

  // Favorites handler
  const handleToggleFavorite = (channelId: string) => {
    setFavorites((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    );
  };

  // Channel Selection with access verification
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    // Smooth scroll to player on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectQuickChannel = (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (ch) {
      handleSelectChannel(ch);
    }
  };

  // Backend Playback Access Authorization Verification
  useEffect(() => {
    if (!selectedChannel) {
      setPlaybackAuthStatus({ authorized: true });
      return;
    }

    // Modo 1: Gratuito sem cadastro
    if (systemSettings.accessMode === 'free') {
      setPlaybackAuthStatus({ authorized: true });
      return;
    }

    // Modo 2: Gratuito com cadastro
    if (systemSettings.accessMode === 'free_registered' && !currentUserEmail) {
      setPlaybackAuthStatus({
        authorized: false,
        reason: 'O Modo 2 está ativo: é necessário criar uma conta gratuita para assistir.'
      });
      return;
    }

    let isMounted = true;
    fetch('/api/public/playback/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: selectedChannel.id,
        userEmail: currentUserEmail
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted || !data) return;
        setPlaybackAuthStatus({
          authorized: Boolean(data.authorized),
          reason: data.reason
        });
        if (data.authorized && data.subscriber?.status === 'active') {
          setUserHasSubscription(true);
        } else if (!data.authorized && data.mode === 'subscription') {
          setUserHasSubscription(false);
        }
      })
      .catch(() => {
        // Fallback local
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChannel, currentUserEmail, systemSettings.accessMode]);

  // Access Permission evaluation based on current AccessMode & backend authorization
  const isAccessAllowed = useCallback(() => {
    if (!selectedChannel) return true;

    // Modo 1: Gratuito sem cadastro
    if (systemSettings.accessMode === 'free') {
      return true;
    }

    // Modo 2: Gratuito com cadastro
    if (systemSettings.accessMode === 'free_registered') {
      return currentUserEmail !== null && playbackAuthStatus.authorized;
    }

    // Modo 3: Assinatura paga
    if (systemSettings.accessMode === 'subscription') {
      if (!selectedChannel.isLocked) return true;
      return userHasSubscription && playbackAuthStatus.authorized;
    }

    return playbackAuthStatus.authorized;
  }, [selectedChannel, systemSettings.accessMode, currentUserEmail, userHasSubscription, playbackAuthStatus]);

  const getAccessNotice = () => {
    if (playbackAuthStatus.reason) {
      return playbackAuthStatus.reason;
    }
    if (systemSettings.accessMode === 'free_registered' && !currentUserEmail) {
      return 'O Modo 2 está ativo: é necessário criar uma conta gratuita para assistir às transmissões.';
    }
    if (systemSettings.accessMode === 'subscription' && !userHasSubscription) {
      return 'O Modo 3 está ativo: este canal é exclusivo para membros com assinatura ativa.';
    }
    return '';
  };

  const handleSuccessLogin = (email: string) => {
    setCurrentUserEmail(email);
    const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (existing && existing.status === 'active') {
      setUserHasSubscription(true);
    }
  };

  // Synchronize dynamic channels and settings from server/PostgreSQL
  const refreshPublicData = useCallback(async () => {
    try {
      const [channelsRes, categoriesRes, settingsRes, plansRes] = await Promise.all([
        fetch('/api/public/channels').catch(() => null),
        fetch('/api/public/categories').catch(() => null),
        fetch('/api/public/settings').catch(() => null),
        fetch('/api/public/plans').catch(() => null)
      ]);

      if (channelsRes && channelsRes.ok) {
        const dbChannels = await channelsRes.json();
        if (Array.isArray(dbChannels) && dbChannels.length > 0) {
          setChannels(
            dbChannels.map((c: any) => ({
              id: c.id,
              number: c.number,
              name: c.name,
              categoryId: c.category_id,
              categoryName: c.category_name,
              logo: c.logo_url,
              backupImage: c.backup_image_url,
              streamUrl: c.stream_url,
              alternativeStreams: c.alternative_streams || [],
              resolution: c.resolution || '1080p',
              aspectRatio: c.aspect_ratio || '16:9',
              currentProgram: c.current_program,
              currentProgramTime: c.current_program_time,
              nextProgram: c.next_program,
              isLive: c.is_live,
              isLocked: c.is_locked,
              featured: c.is_featured,
              description: c.description
            }))
          );
        }
      }

      if (categoriesRes && categoriesRes.ok) {
        const dbCats = await categoriesRes.json();
        if (Array.isArray(dbCats) && dbCats.length > 0) {
          const allCat: Category = { id: 'cat_all', name: 'Todos os Canais', slug: 'todos', order: 0, iconName: 'Layers' };
          const mappedCats: Category[] = dbCats.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            order: cat.display_order,
            iconName: cat.icon_name
          }));
          setCategories([allCat, ...mappedCats]);
        }
      }

      if (plansRes && plansRes.ok) {
        const dbPlans = await plansRes.json();
        if (Array.isArray(dbPlans) && dbPlans.length > 0) {
          setPlans(
            dbPlans.map((p: any) => ({
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
              displayOrder: p.display_order || 99
            }))
          );
        }
      }

      if (settingsRes && settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.appearance) {
          setSystemSettings((prev) => ({
            ...prev,
            siteName: s.appearance.site_name || prev.siteName,
            tagline: s.appearance.tagline || prev.tagline,
            logoUrl: s.appearance.logo_url || prev.logoUrl,
            accessMode: s.accessMode || prev.accessMode
          }));
        }
        if (s.adSlots && Array.isArray(s.adSlots)) {
          setAdSlots(
            s.adSlots.map((ad: any) => ({
              id: ad.id,
              slotType: ad.slot_type,
              title: ad.title,
              subtitle: ad.subtitle,
              imageUrl: ad.image_url,
              targetUrl: ad.target_url,
              dimensions: ad.dimensions,
              codeSnippet: ad.code_snippet,
              isEnabled: ad.is_enabled
            }))
          );
        }
      }
    } catch (err) {
      console.warn('[Gato Net] Usando dados locais como fallback inicial');
    }
  }, []);

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  // Keyboard navigation for Smart TV / PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        const videoElement = document.querySelector('video');
        if (videoElement && !document.fullscreenElement) {
          videoElement.requestFullscreen().catch(() => {});
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }

      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        setIsRemoteGuideOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If Admin Mode is active, render full-screen Admin Dashboard
  if (isAdminMode) {
    return (
      <AdminPanel
        channels={channels}
        setChannels={setChannels}
        categories={categories}
        setCategories={setCategories}
        plans={plans}
        setPlans={setPlans}
        adSlots={adSlots}
        setAdSlots={setAdSlots}
        systemSettings={systemSettings}
        setSystemSettings={setSystemSettings}
        paymentSettings={paymentSettings}
        setPaymentSettings={setPaymentSettings}
        subscribers={subscribers}
        setSubscribers={setSubscribers}
        onCloseAdmin={() => {
          setIsAdminMode(false);
          refreshPublicData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Platform Header */}
      <Header
        customLogoUrl={systemSettings.logoUrl}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminMode(true)}
        onOpenPlans={() => setIsPlansModalOpen(true)}
        onOpenSessions={() => setIsSessionsModalOpen(true)}
        onOpenRemoteGuide={() => setIsRemoteGuideOpen(true)}
        userEmail={currentUserEmail}
        isAdminMode={isAdminMode}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Header Ad Slot (Leaderboard 728x90) */}
      {headerAd && headerAd.isEnabled && (
        <AdBanner slot={headerAd} />
      )}

      {/* Main Streaming Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Large Prominent Video Player with Side Ad Banner */}
        <Player
          selectedChannel={selectedChannel}
          adSideSlot={playerSideAd}
          isAccessAllowed={isAccessAllowed()}
          accessModeNotice={getAccessNotice()}
          userEmail={currentUserEmail}
          onOpenPlans={() => setIsPlansModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSessions={() => setIsSessionsModalOpen(true)}
          onSelectQuickChannel={handleSelectQuickChannel}
        />

        {/* Player Bottom Ad Banner */}
        {playerBottomAd && playerBottomAd.isEnabled && (
          <AdBanner slot={playerBottomAd} />
        )}

        {/* Channels Grid organized by categories with Smart TV focus support */}
        <ChannelGrid
          channels={channels}
          categories={categories}
          selectedChannelId={selectedChannel?.id || null}
          onSelectChannel={handleSelectChannel}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          isAccessModeSubscription={systemSettings.accessMode === 'subscription'}
          userHasSubscription={userHasSubscription}
        />
      </main>

      {/* Footer */}
      <Footer
        systemSettings={systemSettings}
        footerAdSlot={footerAd}
        onOpenAdmin={() => setIsAdminMode(true)}
        onOpenRemoteGuide={() => setIsRemoteGuideOpen(true)}
      />

      {/* Auth Modal (Login / Cadastro requesting Nome, WhatsApp, Email, Senha - no CPF) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessLogin={handleSuccessLogin}
      />

      {/* VIP Subscription Plans Modal */}
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        plans={plans}
        paymentSettings={paymentSettings}
        userEmail={currentUserEmail}
      />

      {/* Subscriber Simultaneous Screens Control Modal */}
      <SubscriberSessionsModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        userEmail={currentUserEmail}
      />

      {/* Smart TV Remote & Keyboard Shortcuts Guide */}
      <TVRemoteGuide
        isOpen={isRemoteGuideOpen}
        onClose={() => setIsRemoteGuideOpen(false)}
      />
    </div>
  );
}
