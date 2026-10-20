import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FeaturedHighlight } from '../types';
import {
  Sparkles,
  ChevronRight,
  Clock,
  Tv,
  X,
  Play
} from 'lucide-react';

interface FeaturedBannerProps {
  highlights: FeaturedHighlight[];
  autoplayIntervalSeconds?: number;
  isEnabled?: boolean;
  isFullscreen?: boolean;
  onSelectChannel: (channelId: string) => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  highlights,
  autoplayIntervalSeconds = 6,
  isEnabled = true,
  isFullscreen = false,
  onSelectChannel
}) => {
  // If disabled by admin or currently in fullscreen, do not render
  if (!isEnabled || isFullscreen) {
    return null;
  }

  // Filter for highlights that should appear in player_banner or both
  const bannerSlides = highlights.filter(
    (h) => h.isActive && (h.placement === 'player_banner' || h.placement === 'both')
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<any>(null);

  const totalSlides = bannerSlides.length;

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // Autoplay rotation (does NOT affect the video player underneath)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (totalSlides > 1 && !isHovered && !prefersReducedMotion && !isDismissed) {
      const intervalMs = Math.max(4, autoplayIntervalSeconds) * 1000;
      timerRef.current = setInterval(() => {
        goToNext();
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [totalSlides, isHovered, isDismissed, autoplayIntervalSeconds, goToNext]);

  if (totalSlides === 0 || isDismissed) {
    return null;
  }

  const current = bannerSlides[currentIndex] || bannerSlides[0];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mb-3 w-full rounded-xl overflow-hidden bg-gradient-to-r from-blue-950/90 via-[#0a1530]/90 to-blue-950/90 border border-blue-500/30 p-2 sm:p-2.5 shadow-lg shadow-blue-950/40 backdrop-blur-md transition-all duration-300"
      aria-label="Faixa de Destaque da Programação"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Left Side: Badge + Thumbnail + Title + Schedule */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mini Badge */}
          <div className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-bold tracking-wider uppercase shrink-0 border border-blue-400/30 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-cyan-200 animate-pulse" />
            <span className="hidden sm:inline">Destaque</span>
          </div>

          {/* Thumbnail preview if available */}
          {current.imageUrl && (
            <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-md overflow-hidden bg-black shrink-0 border border-blue-500/30">
              <img
                src={current.imageUrl}
                alt={current.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title & Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                {current.title}
              </h2>
              {current.isDemo && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Demo
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 mt-0.5">
              {current.timeLabel && (
                <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
                  <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{current.timeLabel}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-slate-400 truncate">
                <Tv className="w-3 h-3 text-blue-400 shrink-0" />
                <span>
                  {current.targetChannelNumber ? `${String(current.targetChannelNumber).padStart(2, '0')} - ` : ''}
                  {current.targetChannelName || 'Canal Vinculado'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Button + Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
          {totalSlides > 1 && (
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              {currentIndex + 1}/{totalSlides}
            </span>
          )}

          {/* Explicit Switch Channel Button */}
          <button
            onClick={() => onSelectChannel(current.targetChannelId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title={`Sintonizar canal ${current.targetChannelName || ''}`}
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{current.buttonText || 'Assistir'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Ocultar faixa temporariamente"
            aria-label="Fechar faixa de destaques"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
