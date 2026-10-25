import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Channel, AdSlot, FeaturedHighlight, FeaturedSettings, EligiblePrerollAd } from '../types';
import { AdBanner } from './AdBanner';
import { FeaturedCarousel } from './FeaturedCarousel';
import { FeaturedBanner } from './FeaturedBanner';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Settings2,
  ShieldAlert,
  Megaphone,
  ExternalLink,
  FastForward,
  Clock,
  X,
  Globe
} from 'lucide-react';

interface PlayerProps {
  selectedChannel: Channel | null;
  adSideSlot?: AdSlot;
  isAccessAllowed: boolean;
  accessModeNotice?: string;
  userEmail?: string | null;
  featuredHighlights?: FeaturedHighlight[];
  featuredSettings?: FeaturedSettings;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onOpenSessions?: () => void;
  onSelectQuickChannel: (channelId: string) => void;
}

export const Player: React.FC<PlayerProps> = ({
  selectedChannel,
  adSideSlot,
  isAccessAllowed,
  accessModeNotice,
  userEmail,
  featuredHighlights = [],
  featuredSettings,
  onOpenPlans,
  onOpenAuth,
  onOpenSessions,
  onSelectQuickChannel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prerollVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeQuality, setActiveQuality] = useState<'Auto' | '1080p' | '720p' | '480p'>('1080p');
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [aspectRatio169, setAspectRatio169] = useState(true);

  // Playback session concurrency & heartbeats state
  const [sessionLimitReached, setSessionLimitReached] = useState(false);
  const [sessionLimitNotice, setSessionLimitNotice] = useState('');
  const [sessionTerminatedNotice, setSessionTerminatedNotice] = useState('');
  const [, setCurrentSessionId] = useState<string | null>(null);

  // Pre-roll Video Advertising State
  const [isPrerollActive, setIsPrerollActive] = useState(false);
  const [currentPrerollAd, setCurrentPrerollAd] = useState<EligiblePrerollAd | null>(null);
  const [skipCountdown, setSkipCountdown] = useState<number>(5);
  const [canSkipPreroll, setCanSkipPreroll] = useState<boolean>(false);
  const [prerollProgress, setPrerollProgress] = useState<{ currentTime: number; duration: number }>({ currentTime: 0, duration: 0 });
  const [prerollImpressionSent, setPrerollImpressionSent] = useState(false);

  // In-Play Banner Advertising State
  const [inPlayConfig, setInPlayConfig] = useState<any | null>(null);
  const [isInPlayVisible, setIsInPlayVisible] = useState(false);
  const [isInPlayFadingOut, setIsInPlayFadingOut] = useState(false);

  // External Iframe Player State
  const isExternalIframe = selectedChannel?.playerType === 'external_iframe' && Boolean(selectedChannel?.iframeUrl);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Persistent visitor ID for accurate frequency capping and events
  const getVisitorId = useCallback(() => {
    try {
      let vid = localStorage.getItem('gatonet_visitor_id');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        localStorage.setItem('gatonet_visitor_id', vid);
      }
      return vid;
    } catch {
      return 'v_temp';
    }
  }, []);

  // Detect human-readable device name
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    if (/SmartTV|Tizen|Web0S|AppleTV|BRAVIA/i.test(ua)) return 'Smart TV Gato Net';
    if (/Android/i.test(ua)) return 'Smartphone Android';
    if (/iPhone|iPad/i.test(ua)) return 'Apple iOS (iPhone/iPad)';
    if (/Windows/i.test(ua)) return 'PC Windows';
    if (/Macintosh/i.test(ua)) return 'Mac OS';
    if (/Linux/i.test(ua)) return 'Dispositivo Linux';
    return 'Navegador Web';
  };

  // Playback session registration and periodic heartbeat
  useEffect(() => {
    if (!selectedChannel || !isAccessAllowed) {
      setSessionLimitReached(false);
      setSessionTerminatedNotice('');
      return;
    }

    let activeId: string | null = null;
    let activeToken: string | null = null;
    let heartbeatInterval: any = null;

    const startSession = async () => {
      try {
        const res = await fetch('/api/public/playback/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: selectedChannel.id,
            userEmail,
            deviceInfo: getDeviceName()
          })
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.authorized) {
          activeId = data.session?.id || null;
          activeToken = data.playbackToken || null;
          setCurrentSessionId(activeId);
          setSessionLimitReached(false);
          setSessionTerminatedNotice('');

          // Start heartbeat every 15s to maintain active screen registration
          heartbeatInterval = setInterval(async () => {
            if (!activeId) return;
            try {
              const hbRes = await fetch('/api/public/playback/heartbeat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: activeId,
                  playbackToken: activeToken
                })
              });
              if (hbRes.ok) {
                const hbData = await hbRes.json();
                if (hbData.terminated) {
                  if (videoRef.current) videoRef.current.pause();
                  setIsPlaying(false);
                  setSessionTerminatedNotice(hbData.reason || 'Sessão encerrada pelo servidor ou em outro aparelho.');
                  clearInterval(heartbeatInterval);
                }
              }
            } catch (e) {
              // Ignore network glitch
            }
          }, 15000);
        } else if (data?.limitReached) {
          if (videoRef.current) videoRef.current.pause();
          setIsPlaying(false);
          setSessionLimitReached(true);
          setSessionLimitNotice(data.reason || 'Limite de telas simultâneas do plano atingido.');
        }
      } catch (err) {
        // Fallback for offline preview mode
      }
    };

    startSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (activeId) {
        fetch('/api/public/playback/end-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeId,
            userEmail,
            reason: 'Canal alterado ou reprodutor fechado'
          })
        }).catch(() => {});
      }
    };
  }, [selectedChannel, isAccessAllowed, userEmail]);

  // Start channel stream playback helper
  const startChannelPlaybackDirectly = useCallback(() => {
    setIsPrerollActive(false);
    setCurrentPrerollAd(null);
    if (!selectedChannel) return;

    if (selectedChannel.playerType === 'external_iframe' && selectedChannel.iframeUrl) {
      setIsLoading(false);
      setIsPlaying(true);
      return;
    }

    if (videoRef.current) {
      videoRef.current.src = selectedChannel.streamUrl;
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  }, [selectedChannel]);

  // Pre-roll completion and skip handler
  const handleEndPreroll = useCallback((reason: 'completion' | 'skip' | 'error') => {
    if (!isPrerollActive) return;

    if (currentPrerollAd && (reason === 'completion' || reason === 'skip')) {
      fetch('/api/public/preroll/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: currentPrerollAd.id,
          eventType: reason,
          channelId: selectedChannel?.id,
          userEmail,
          visitorId: getVisitorId()
        })
      }).catch(() => {});
    }

    startChannelPlaybackDirectly();
  }, [isPrerollActive, currentPrerollAd, selectedChannel, userEmail, getVisitorId, startChannelPlaybackDirectly]);

  // Handle clicking sponsor banner / CTA
  const handlePrerollClickSponsor = () => {
    if (!currentPrerollAd?.targetUrl) return;

    fetch('/api/public/preroll/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: currentPrerollAd.id,
        eventType: 'click',
        channelId: selectedChannel?.id,
        userEmail,
        visitorId: getVisitorId()
      })
    }).catch(() => {});

    try {
      window.open(currentPrerollAd.targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // safe fallback
    }
  };

  // When selectedChannel changes, verify pre-roll eligibility and prepare stream in parallel
  useEffect(() => {
    if (!selectedChannel) {
      setIsPlaying(false);
      setHasError(false);
      setIsLoading(false);
      setIsPrerollActive(false);
      setCurrentPrerollAd(null);
      return;
    }

    if (!isAccessAllowed) {
      setIsPlaying(false);
      setIsLoading(false);
      setIsPrerollActive(false);
      setCurrentPrerollAd(null);
      return;
    }

    let isCancelled = false;
    setHasError(false);
    setIsLoading(true);
    setCurrentStreamIndex(0);
    setPrerollImpressionSent(false);
    setIsIframeLoaded(false);

    // Prepare channel stream in parallel (metadata only, without sound or high bandwidth consumption)
    const isExtIframe = selectedChannel.playerType === 'external_iframe' && Boolean(selectedChannel.iframeUrl);
    if (!isExtIframe && videoRef.current) {
      videoRef.current.preload = 'metadata';
      videoRef.current.src = selectedChannel.streamUrl;
      videoRef.current.load();
    }

    // Check for active eligible pre-roll ad for this channel and visitor/user
    fetch('/api/public/preroll/eligible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: selectedChannel.id,
        userEmail,
        visitorId: getVisitorId()
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isCancelled) return;
        if (data?.eligible && data.ad) {
          const ad: EligiblePrerollAd = data.ad;
          setCurrentPrerollAd(ad);
          setIsPrerollActive(true);
          setSkipCountdown(ad.skipOffsetSeconds || 0);
          setCanSkipPreroll((ad.skipOffsetSeconds || 0) <= 0);
          setIsLoading(false);

          // Timeout failsafe: if ad doesn't start or stalls within 5s, continue to channel automatically
          const timer = setTimeout(() => {
            if (!isCancelled && isPrerollActive && prerollProgress.currentTime === 0) {
              console.warn('[Player] Pre-roll video timeout reached. Advancing directly to channel stream.');
              startChannelPlaybackDirectly();
            }
          }, 5000);

          return () => clearTimeout(timer);
        } else {
          startChannelPlaybackDirectly();
        }
      })
      .catch(() => {
        if (!isCancelled) {
          startChannelPlaybackDirectly();
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedChannel, isAccessAllowed, userEmail, getVisitorId, startChannelPlaybackDirectly]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // In-Play Banner Lifecycle & Timers Effect
  useEffect(() => {
    // For internal player: active when isPlaying is true.
    // For external iframe: active when isIframeLoaded is true (delay timer starts upon iframe onLoad per technical limitations)
    const isStreamActive = isExternalIframe ? isIframeLoaded : isPlaying;

    // Only active when a channel is actively playing/loaded and access is authorized, without active pre-roll
    if (!selectedChannel || !isStreamActive || !isAccessAllowed || isPrerollActive) {
      setIsInPlayVisible(false);
      setIsInPlayFadingOut(false);
      return;
    }

    let isCancelled = false;
    let delayTimer: any = null;
    let durationTimer: any = null;
    let intervalTimer: any = null;

    fetch('/api/public/inplay/eligible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId: selectedChannel.id,
        userEmail
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isCancelled || !data?.eligible || !data.config) return;
        const cfg = data.config;
        setInPlayConfig(cfg);

        const triggerShowBanner = () => {
          if (isCancelled) return;
          setIsInPlayFadingOut(false);
          setIsInPlayVisible(true);

          // Duration on screen
          durationTimer = setTimeout(() => {
            if (isCancelled) return;
            setIsInPlayFadingOut(true);
            setTimeout(() => {
              if (isCancelled) return;
              setIsInPlayVisible(false);
              setIsInPlayFadingOut(false);

              // Periodic re-appearance if interval > 0
              if (cfg.intervalMinutes > 0 && !isCancelled) {
                intervalTimer = setTimeout(triggerShowBanner, cfg.intervalMinutes * 60 * 1000);
              }
            }, Math.round((cfg.fadeOutSeconds || 1) * 1000));
          }, Math.round((cfg.durationSeconds || 25) * 1000));
        };

        // Initial delay before first appearance
        delayTimer = setTimeout(triggerShowBanner, Math.max(3, cfg.delaySeconds || 10) * 1000);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
      if (delayTimer) clearTimeout(delayTimer);
      if (durationTimer) clearTimeout(durationTimer);
      if (intervalTimer) clearTimeout(intervalTimer);
      setIsInPlayVisible(false);
      setIsInPlayFadingOut(false);
    };
  }, [selectedChannel?.id, isExternalIframe, isIframeLoaded, isPlaying, isAccessAllowed, isPrerollActive, userEmail]);

  const handleCloseInPlay = () => {
    setIsInPlayFadingOut(true);
    setTimeout(() => {
      setIsInPlayVisible(false);
      setIsInPlayFadingOut(false);
    }, Math.round((inPlayConfig?.fadeOutSeconds || 1) * 1000));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRetryStream = () => {
    setHasError(false);
    setIsLoading(true);
    if (!selectedChannel) return;

    if (isExternalIframe) {
      setIsIframeLoaded(false);
      setTimeout(() => {
        setIsLoading(false);
        setIsIframeLoaded(true);
      }, 350);
      return;
    }

    if (!videoRef.current) return;

    if (selectedChannel.alternativeStreams && selectedChannel.alternativeStreams.length > 0) {
      const nextIndex = (currentStreamIndex + 1) % (selectedChannel.alternativeStreams.length + 1);
      setCurrentStreamIndex(nextIndex);
      let targetUrl = selectedChannel.streamUrl;
      if (nextIndex > 0) {
        const altItem = selectedChannel.alternativeStreams[nextIndex - 1];
        targetUrl = typeof altItem === 'string' ? altItem : (altItem?.url || selectedChannel.streamUrl);
      }
      videoRef.current.src = targetUrl;
    } else {
      videoRef.current.src = selectedChannel.streamUrl;
    }

    videoRef.current.load();
    videoRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setHasError(true);
      });
  };

  return (
    <div className="w-full">
      {/* 0. FeaturedBanner: Programming highlights ribbon during active playback */}
      {selectedChannel && (
        <FeaturedBanner
          highlights={featuredHighlights}
          autoplayIntervalSeconds={featuredSettings?.autoplayIntervalSeconds || 6}
          isEnabled={featuredSettings?.playbackBannerEnabled !== false}
          isFullscreen={isFullscreen}
          onSelectChannel={onSelectQuickChannel}
        />
      )}

      {/* 2-Column layout on desktop: Player + Side Ad Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Video Viewport (Col 1 to 8/9 on desktop) */}
        <div
          ref={containerRef}
          className={`relative w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl transition-all ${
            adSideSlot && adSideSlot.isEnabled ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
          }`}
        >
          {/* Channel Info Header Bar above video content */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0a0f1d] border-b border-slate-800/80">
            <div className="flex items-center gap-3 min-w-0">
              {selectedChannel ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0 p-1">
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <Tv className="w-4 h-4 text-blue-400 fallback-icon" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate">
                        {selectedChannel.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                      <span>{selectedChannel.categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 truncate">{selectedChannel.currentProgram}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-slate-400">{selectedChannel.currentProgramTime}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Tv className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-white">Gato Net</span>
                  <span className="text-xs text-slate-400">· Selecione um canal ou atração em destaque abaixo</span>
                </div>
              )}
            </div>

            {/* Quick Status Indicator */}
            {hasError && (
              <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                <span className="text-red-400 font-semibold">SINAL INDISPONÍVEL</span>
              </div>
            )}
          </div>

          {/* Video Container Aspect Ratio 16:9 */}
          <div
            className={`relative w-full bg-[#03060c] flex items-center justify-center overflow-hidden ${
              aspectRatio169 ? 'aspect-video' : 'aspect-[4/3]'
            }`}
          >
            {/* Channel Stream: External Iframe or Internal HTML5 Video */}
            {selectedChannel && (
              isExternalIframe ? (
                <iframe
                  key={`ext-iframe-${selectedChannel.id}`}
                  src={selectedChannel.iframeUrl || undefined}
                  title={selectedChannel.name}
                  className={`w-full h-full border-0 transition-opacity duration-300 ${
                    isLoading || hasError || !isAccessAllowed || isPrerollActive
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-100'
                  }`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => {
                    if (!isPrerollActive) {
                      setIsLoading(false);
                      setHasError(false);
                      setIsIframeLoaded(true);
                    }
                  }}
                  onError={() => {
                    if (!isPrerollActive) {
                      setIsLoading(false);
                      setHasError(true);
                    }
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  loop
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isLoading || hasError || !isAccessAllowed || isPrerollActive
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-100'
                  }`}
                  onWaiting={() => {
                    if (!isPrerollActive) setIsLoading(true);
                  }}
                  onPlaying={() => {
                    if (!isPrerollActive) {
                      setIsLoading(false);
                      setHasError(false);
                    }
                  }}
                  onError={() => {
                    if (!isPrerollActive) {
                      setIsLoading(false);
                      setHasError(true);
                    }
                  }}
                />
              )
            )}

            {/* PRE-ROLL VIDEO AD PLAYER OVERLAY */}
            {selectedChannel && isAccessAllowed && isPrerollActive && currentPrerollAd && (
              <div className="absolute inset-0 z-25 bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={prerollVideoRef}
                  playsInline
                  autoPlay
                  src={currentPrerollAd.videoUrl}
                  className="w-full h-full object-cover"
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    const cur = v.currentTime;
                    const dur = v.duration || 1;
                    setPrerollProgress({ currentTime: cur, duration: dur });

                    if (currentPrerollAd.skipEnabled) {
                      const remaining = Math.max(0, Math.ceil((currentPrerollAd.skipOffsetSeconds || 5) - cur));
                      setSkipCountdown(remaining);
                      if (remaining === 0 && !canSkipPreroll) {
                        setCanSkipPreroll(true);
                      }
                    }
                  }}
                  onPlay={() => {
                    if (!prerollImpressionSent && currentPrerollAd) {
                      setPrerollImpressionSent(true);
                      fetch('/api/public/preroll/event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          campaignId: currentPrerollAd.id,
                          eventType: 'impression',
                          channelId: selectedChannel.id,
                          userEmail,
                          visitorId: getVisitorId()
                        })
                      }).catch(() => {});
                    }
                  }}
                  onEnded={() => handleEndPreroll('completion')}
                  onError={() => {
                    console.warn('[Player] Falha na reprodução do vídeo publicitário. Iniciando canal diretamente.');
                    handleEndPreroll('error');
                  }}
                />

                {/* Top Publicidade Bar */}
                <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 pointer-events-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase bg-amber-400 text-black shadow-md flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      <span>Publicidade</span>
                    </span>
                    <div className="text-xs text-white truncate font-medium">
                      Patrocínio: <span className="font-bold text-amber-300">{currentPrerollAd.sponsorName}</span>
                    </div>
                  </div>

                  {currentPrerollAd.targetUrl && (
                    <button
                      type="button"
                      onClick={handlePrerollClickSponsor}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg hover:shadow-blue-600/30 shrink-0"
                    >
                      <span>Visitar Patrocinador</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bottom Progress & Skip Bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 pointer-events-auto">
                  {/* Progress timeline bar */}
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-200"
                      style={{
                        width: `${Math.min(100, (prerollProgress.currentTime / (prerollProgress.duration || 1)) * 100)}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        O canal iniciará em{' '}
                        <strong className="text-white font-mono">
                          {Math.max(0, Math.ceil((prerollProgress.duration || 0) - prerollProgress.currentTime))}s
                        </strong>
                      </span>
                    </div>

                    {currentPrerollAd.skipEnabled ? (
                      canSkipPreroll ? (
                        <button
                          type="button"
                          onClick={() => handleEndPreroll('skip')}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg animate-pulse"
                        >
                          <span>Pular Anúncio</span>
                          <FastForward className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pular anúncio em {skipCountdown}s</span>
                        </div>
                      )
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        Vídeo promocional obrigatório
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 1: INITIAL UNSELECTED STATE — Interactive Featured Highlights Carousel */}
            {!selectedChannel && (
              <FeaturedCarousel
                highlights={featuredHighlights}
                autoplayIntervalSeconds={featuredSettings?.autoplayIntervalSeconds || 6}
                onSelectChannel={onSelectQuickChannel}
                onSelectQuickChannel={onSelectQuickChannel}
              />
            )}

            {/* STATE 2: ACCESS RESTRICTION OVERLAY (When Modo 2 or Modo 3 is enabled in Admin) */}
            {selectedChannel && !isAccessAllowed && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-black/90 backdrop-blur-md">
                <div className="max-w-md space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Canal com Acesso Restrito</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {accessModeNotice || 'Para assistir a esta transmissão, utilize sua conta cadastrada.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={onOpenAuth}
                      className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition-colors cursor-pointer"
                    >
                      Cadastrar Gratuitamente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2B: SIMULTANEOUS SCREENS LIMIT REACHED OVERLAY */}
            {selectedChannel && isAccessAllowed && sessionLimitReached && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-black/95 backdrop-blur-md">
                <div className="max-w-md space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Tv className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Limite de Telas Simultâneas Atingido</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#090f20] p-3 rounded-xl border border-slate-800">
                    {sessionLimitNotice || 'Você atingiu o limite de telas permitidas para reprodução simultânea no seu plano.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    {onOpenSessions && (
                      <button
                        onClick={onOpenSessions}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                      >
                        <Tv className="w-4 h-4" />
                        <span>Gerenciar Minhas Telas</span>
                      </button>
                    )}
                    <button
                      onClick={onOpenPlans}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Ver Outros Planos
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2C: SESSION TERMINATED NOTICE (BY ADMIN OR OTHER DEVICE) */}
            {selectedChannel && isAccessAllowed && !sessionLimitReached && sessionTerminatedNotice && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-black/95 backdrop-blur-md">
                <div className="max-w-md space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Transmissão Interrompida</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#090f20] p-3 rounded-xl border border-slate-800">
                    {sessionTerminatedNotice}
                  </p>
                  <button
                    onClick={() => {
                      setSessionTerminatedNotice('');
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reconectar Sinal
                  </button>
                </div>
              </div>
            )}

            {/* STATE 3: LOADING / BUFFERING OVERLAY */}
            {selectedChannel && isLoading && !isPrerollActive && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-3 border-blue-500/30 border-t-blue-400 animate-spin" />
                <span className="mt-3 text-xs font-mono font-medium text-slate-200 tracking-wide">
                  Carregando sinal...
                </span>
              </div>
            )}

            {/* STATE 4: STREAM ERROR / UNAVAILABLE OVERLAY */}
            {selectedChannel && hasError && !isPrerollActive && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#090e1c]/95">
                <div className="max-w-md space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Sinal Temporariamente Indisponível
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    A transmissão está temporariamente indisponível. Clique abaixo para tentar reconectar.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleRetryStream}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reconectar Sinal</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STREAM CONTROLS OVERLAY */}
            {selectedChannel && isAccessAllowed && !hasError && !isPrerollActive && (
              isExternalIframe ? (
                /* External Iframe Floating Controls (Non-blocking, preserves iframe native player interactivity) */
                <div className="absolute top-3 right-3 z-15 flex items-center gap-2 pointer-events-auto">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-blue-500/30 text-[11px] font-mono text-blue-300 shadow-lg">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Player Externo (iframe)</span>
                  </div>

                  {/* Refresh / Retry Iframe */}
                  <button
                    onClick={handleRetryStream}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-black/75 hover:bg-slate-800 backdrop-blur-md border border-white/20 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                    title="Recarregar player externo"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                    <span className="hidden sm:inline">Recarregar</span>
                  </button>

                  {/* Proporção Aspect Ratio */}
                  <button
                    onClick={() => setAspectRatio169(!aspectRatio169)}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-black/75 hover:bg-slate-800 backdrop-blur-md border border-white/20 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                    title="Alternar proporção do contêiner"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-mono">{aspectRatio169 ? '16:9' : '4:3'}</span>
                  </button>

                  {/* Container Fullscreen (Preserves Gato Net In-Play Banners) */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md border border-blue-400/30 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                    title={isFullscreen ? 'Sair da tela cheia Gato Net (F)' : 'Tela cheia Gato Net (preserva banners In-Play)'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    <span className="hidden md:inline">{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
                  </button>
                </div>
              ) : (
                /* Internal Video Controls (Full Playback Bar) */
                <div className="absolute inset-x-0 bottom-0 z-15 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 sm:p-5 flex flex-col gap-2 opacity-95 hover:opacity-100 transition-opacity">
                  {/* Control bar */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Play/Pause Button */}
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
                        title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      {/* Volume Slider & Mute Toggle */}
                      <div className="flex items-center gap-2 group">
                        <button
                          onClick={toggleMute}
                          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title={isMuted ? 'Ativar Áudio (M)' : 'Silenciar (M)'}
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 sm:w-24 accent-blue-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                          title="Volume"
                        />
                      </div>

                      {/* Program Timecode Badge */}
                      <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300 bg-black/50 px-2.5 py-1 rounded-md border border-white/10">
                        <span>{selectedChannel.currentProgramTime}</span>
                      </div>
                    </div>

                    {/* Right Controls: Quality, Aspect Ratio, Settings, Fullscreen */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Quality Selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSettings(!showSettings)}
                          className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/15 text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Ajustar Qualidade"
                        >
                          <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{activeQuality}</span>
                        </button>

                        {showSettings && (
                          <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl bg-[#0b1329] border border-blue-500/30 shadow-2xl p-2 z-50 text-xs">
                            <span className="block px-2 py-1 text-[10px] font-mono text-slate-400 uppercase">
                              Resolução
                            </span>
                            {(['Auto', '1080p', '720p', '480p'] as const).map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setActiveQuality(q);
                                  setShowSettings(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono flex items-center justify-between cursor-pointer ${
                                  activeQuality === q
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                <span>{q}</span>
                                {activeQuality === q && <span className="text-[10px]">Ativo</span>}
                              </button>
                            ))}
                            <div className="my-1 border-t border-slate-800" />
                            <button
                              onClick={() => {
                                setAspectRatio169(!aspectRatio169);
                                setShowSettings(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-white/10 flex items-center justify-between cursor-pointer"
                            >
                              <span>Proporção</span>
                              <span className="font-mono text-blue-400">{aspectRatio169 ? '16:9' : '4:3'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
                      >
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* BANNER IN-PLAY NO PLAYER DE VÍDEO (OVERLAY SOBRE O VÍDEO / IFRAME) */}
            {selectedChannel && isAccessAllowed && (isExternalIframe ? isIframeLoaded : isPlaying) && !isPrerollActive && isInPlayVisible && inPlayConfig && (
              <div
                className={`absolute z-18 pointer-events-auto ${
                  inPlayConfig.position === 'bottom_left'
                    ? 'bottom-20 sm:bottom-24 left-4 max-w-[92%] sm:max-w-md'
                    : inPlayConfig.position === 'bottom_right'
                    ? 'bottom-20 sm:bottom-24 right-4 max-w-[92%] sm:max-w-md'
                    : 'bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 w-[94%] max-w-[500px] sm:max-w-[620px]'
                }`}
                style={{
                  opacity: isInPlayFadingOut ? 0 : 1,
                  transition: `opacity ${inPlayConfig.fadeOutSeconds || 1}s ease-in-out`
                }}
              >
                <div className="relative rounded-2xl bg-[#080d1e]/95 border border-blue-500/40 shadow-2xl backdrop-blur-md overflow-hidden p-2.5 sm:p-3">
                  {/* Close button (when enabled) */}
                  {inPlayConfig.closeButtonEnabled && (
                    <button
                      type="button"
                      onClick={handleCloseInPlay}
                      className="absolute top-2 right-2 p-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer z-20 shadow-md"
                      title="Fechar publicidade"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Format 1: Script isolated sandbox iframe */}
                  {inPlayConfig.adFormat === 'script' && inPlayConfig.adScriptCode ? (
                    <div className="w-full min-h-[65px] max-h-[90px] flex items-center justify-center overflow-hidden">
                      <iframe
                        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:transparent;display:flex;justify-content:center;align-items:center;overflow:hidden;font-family:sans-serif;}</style></head><body>${inPlayConfig.adScriptCode}</body></html>`}
                        sandbox="allow-scripts allow-popups allow-forms"
                        title="Anúncio In-Play"
                        className="w-full h-[70px] sm:h-[85px] border-0"
                      />
                    </div>
                  ) : (
                    /* Format 2: Custom Banner with Image and Link */
                    <div className="flex items-center gap-3 pr-6">
                      {inPlayConfig.bannerImageUrl && (
                        <img
                          src={inPlayConfig.bannerImageUrl}
                          alt={inPlayConfig.bannerTitle || 'Publicidade'}
                          className="h-12 sm:h-14 w-auto max-w-[130px] rounded-lg object-contain bg-black/40 border border-slate-800 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            Publicidade
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">In-Play</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {inPlayConfig.bannerTitle || 'Anúncio em Destaque'}
                        </p>
                      </div>
                      {inPlayConfig.bannerTargetUrl && (
                        <a
                          href={inPlayConfig.bannerTargetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-colors cursor-pointer"
                        >
                          <span>Acessar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Program Schedule Details Bar beneath video */}
          {selectedChannel && (
            <div className="px-4 sm:px-6 py-3 bg-[#0a0f1d] border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 min-w-0">
                <span className="text-[10px] font-mono uppercase text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">
                  A Seguir
                </span>
                <span className="truncate font-medium">{selectedChannel.nextProgram || 'Programação Noturna'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0 font-mono">
                <span className="text-blue-400">{selectedChannel.resolution || '1080p'}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedChannel.aspectRatio || '16:9'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Side Ad Slot (Col 9 to 12 on large screens) */}
        {adSideSlot && adSideSlot.isEnabled && (
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 h-full">
            <AdBanner slot={adSideSlot} onPlanClick={onOpenPlans} />
          </div>
        )}
      </div>
    </div>
  );
};
