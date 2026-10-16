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
  const [isRemoteGuideOpen, setIsRemoteGuideOpen] = useState(false);

  // User Authentication state
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [userHasSubscription, setUserHasSubscription] = useState(false);

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

  // Access Permission evaluation based on current AccessMode
  const isAccessAllowed = useCallback(() => {
    if (!selectedChannel) return true;

    // Modo 1: Gratuito sem cadastro
    if (systemSettings.accessMode === 'free') {
      return true;
    }

    // Modo 2: Gratuito com cadastro
    if (systemSettings.accessMode === 'free_registered') {
      return currentUserEmail !== null;
    }

    // Modo 3: Assinatura paga
    if (systemSettings.accessMode === 'subscription') {
      if (!selectedChannel.isLocked) return true;
      return userHasSubscription;
    }

    return true;
  }, [selectedChannel, systemSettings.accessMode, currentUserEmail, userHasSubscription]);

  const getAccessNotice = () => {
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
        onCloseAdmin={() => setIsAdminMode(false)}
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
          onOpenPlans={() => setIsPlansModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* VIP Subscription Plans Modal (kept for admin preview and future paid mode activation) */}
      <PlansModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        plans={plans}
        paymentSettings={paymentSettings}
      />

      {/* Smart TV Remote & Keyboard Shortcuts Guide */}
      <TVRemoteGuide
        isOpen={isRemoteGuideOpen}
        onClose={() => setIsRemoteGuideOpen(false)}
      />
    </div>
  );
}
