import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FeaturedHighlight } from '../types';
import {
  Play,
  Tv,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Sparkles,
  Info
} from 'lucide-react';

interface FeaturedCarouselProps {
  highlights: FeaturedHighlight[];
  autoplayIntervalSeconds?: number;
  onSelectChannel: (channelId: string) => void;
  onSelectQuickChannel: (channelId: string) => void;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  highlights,
  autoplayIntervalSeconds = 6,
  onSelectChannel,
  onSelectQuickChannel
}) => {
  // Filter for empty player space
  const activeSlides = highlights.filter(
    (h) => h.isActive && (h.placement === 'empty_player' || h.placement === 'both')
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUserHovering, setIsUserHovering] = useState(false);
  const timerRef = useRef<any>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const totalSlides = activeSlides.length;

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Autoplay timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (totalSlides > 1 && !isPaused && !isUserHovering && !prefersReducedMotion) {
      const intervalMs = Math.max(3, autoplayIntervalSeconds) * 1000;
      timerRef.current = setInterval(() => {
        goToNext();
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [totalSlides, isPaused, isUserHovering, prefersReducedMotion, autoplayIntervalSeconds, goToNext]);

  // Smart TV keyboard navigation (Left/Right arrow keys on focused carousel)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'Enter') {
      const current = activeSlides[currentIndex];
      if (current) {
        onSelectChannel(current.targetChannelId);
      }
    }
  };

  // If no active highlights, show standard demo starter fallback
  if (totalSlides === 0) {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#0b1329]/90 via-[#060911]/95 to-[#03060c]">
        <img
          src="/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg"
          alt="Gato Net"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
        />
        <div className="relative z-10 max-w-lg space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Pronto para sintonizar a Gato Net
            </h2>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
              Selecione qualquer canal na grade abaixo para iniciar a reprodução.
            </p>
          </div>

          <div className="pt-2">
            <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">
              Canais Disponíveis:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onSelectQuickChannel('ch_globo')}
                className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Rede Globo
              </button>
              <button
                onClick={() => onSelectQuickChannel('ch_gato_esportes_1')}
                className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Gato Esporte 1
              </button>
              <button
                onClick={() => onSelectQuickChannel('ch_cine_prime')}
                className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Cine Prime
              </button>
              <button
                onClick={() => onSelectQuickChannel('ch_gato_news_24h')}
                className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Gato Notícias
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = activeSlides[currentIndex] || activeSlides[0];

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsUserHovering(true)}
      onMouseLeave={() => setIsUserHovering(false)}
      className="absolute inset-0 z-20 overflow-hidden bg-black flex flex-col justify-end focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Carrossel de Destaques da Programação"
    >
      {/* Background Slides with Fade Transition */}
      {activeSlides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
          }`}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover transform scale-105 transition-transform duration-10000"
            onError={(e) => {
              // Fallback to high quality dark backdrop if image fails
              (e.target as HTMLImageElement).src = '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg';
            }}
          />
          {/* Deep Cinematic Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/75 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050811]/90 via-[#050811]/50 to-transparent" />
        </div>
      ))}

      {/* Top Header Information Ribbon */}
      {totalSlides > 1 && (
        <div className="absolute top-4 right-4 z-20 flex items-center justify-end">
          {/* Rotation Controls (Pause/Play) */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? 'Retomar rotação automática' : 'Pausar rotação automática'}
              className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label={isPaused ? 'Retomar' : 'Pausar'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {currentIndex + 1}/{totalSlides}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-20 p-5 sm:p-8 max-w-2xl space-y-3">
        {/* Schedule & Channel Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {current.timeLabel && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>{current.timeLabel}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-200 text-xs font-medium border border-blue-500/30">
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Sintonizar:{' '}
              <strong className="text-white">
                {current.targetChannelNumber ? `${String(current.targetChannelNumber).padStart(2, '0')} - ` : ''}
                {current.targetChannelName || 'Canal Vinculado'}
              </strong>
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
          {current.title}
        </h1>

        {/* Description */}
        {current.description && (
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl leading-relaxed drop-shadow">
            {current.description}
          </p>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onSelectChannel(current.targetChannelId)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(37,99,235,0.5)] border border-blue-400/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer group"
          >
            <Play className="w-4 h-4 fill-white transition-transform group-hover:scale-110" />
            <span>{current.buttonText || 'Assistir agora'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls: Arrows and Indicator Bars */}
      {totalSlides > 1 && (
        <div className="relative z-20 flex items-center justify-between px-5 sm:px-8 pb-4 pt-1">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {activeSlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                title={`Ir para destaque ${idx + 1}: ${s.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                    : 'w-2.5 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={goToPrev}
              className="p-2 rounded-lg bg-black/50 hover:bg-blue-600/80 border border-white/10 hover:border-blue-400 text-white transition-all cursor-pointer backdrop-blur-md"
              aria-label="Destaque anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-lg bg-black/50 hover:bg-blue-600/80 border border-white/10 hover:border-blue-400 text-white transition-all cursor-pointer backdrop-blur-md"
              aria-label="Próximo destaque"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
