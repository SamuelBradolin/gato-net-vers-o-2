import React, { useState, useRef, useEffect } from 'react';
import { Channel, AdSlot } from '../types';
import { AdBanner } from './AdBanner';
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
  ShieldAlert
} from 'lucide-react';

interface PlayerProps {
  selectedChannel: Channel | null;
  adSideSlot?: AdSlot;
  isAccessAllowed: boolean;
  accessModeNotice?: string;
  onOpenPlans: () => void;
  onOpenAuth: () => void;
  onSelectQuickChannel: (channelId: string) => void;
}

export const Player: React.FC<PlayerProps> = ({
  selectedChannel,
  adSideSlot,
  isAccessAllowed,
  accessModeNotice,
  onOpenPlans,
  onOpenAuth,
  onSelectQuickChannel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // When selectedChannel changes, prepare the stream
  useEffect(() => {
    if (!selectedChannel) {
      setIsPlaying(false);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    setHasError(false);
    setIsLoading(true);
    setCurrentStreamIndex(0);

    // Load new channel video
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

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    if (!videoRef.current || !selectedChannel) return;

    if (selectedChannel.alternativeStreams && selectedChannel.alternativeStreams.length > 0) {
      const nextIndex = (currentStreamIndex + 1) % (selectedChannel.alternativeStreams.length + 1);
      setCurrentStreamIndex(nextIndex);
      const targetUrl = nextIndex === 0
        ? selectedChannel.streamUrl
        : selectedChannel.alternativeStreams[nextIndex - 1];
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
                  <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-full h-full object-cover"
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Clear DEMO badge without claiming live TV */}
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-blue-600/90 text-white">
                          DEMO
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                          Sinal de Teste
                        </span>
                      </div>
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
                  <span className="text-xs text-slate-400">· Selecione um canal demonstrativo abaixo</span>
                </div>
              )}
            </div>

            {/* Quick Status Indicator */}
            <div className="flex items-center gap-3 shrink-0">
              {selectedChannel && (
                <button
                  onClick={() => setHasError(!hasError)}
                  title="Testar resposta visual de falha de transmissão"
                  className="hidden sm:flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>{hasError ? 'Restaurar Sinal' : 'Testar Erro'}</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {hasError ? (
                  <span className="text-red-400 font-semibold">SINAL INDISPONÍVEL</span>
                ) : (
                  <span className="text-blue-400 font-semibold">HOMOLOGAÇÃO</span>
                )}
              </div>
            </div>
          </div>

          {/* Video Container Aspect Ratio 16:9 */}
          <div
            className={`relative w-full bg-[#03060c] flex items-center justify-center overflow-hidden ${
              aspectRatio169 ? 'aspect-video' : 'aspect-[4/3]'
            }`}
          >
            {/* HTML5 Video Element */}
            {selectedChannel && (
              <video
                ref={videoRef}
                playsInline
                loop
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoading || hasError || !isAccessAllowed ? 'opacity-20 pointer-events-none' : 'opacity-100'
                }`}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            )}

            {/* STATE 1: INITIAL UNSELECTED STATE (Visitor has not selected a channel yet) */}
            {!selectedChannel && (
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
                      Selecione qualquer canal demonstrativo na grade abaixo para iniciar a reprodução.
                    </p>
                  </div>

                  {/* Quick Canal Starters */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">
                      Canais Demonstrativos Disponíveis:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectQuickChannel('ch_globo')}
                        className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Rede Globo (Demo)
                      </button>
                      <button
                        onClick={() => onSelectQuickChannel('ch_gato_esportes_1')}
                        className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Gato Esporte 1 (Demo)
                      </button>
                      <button
                        onClick={() => onSelectQuickChannel('ch_cine_prime')}
                        className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Cine Prime (Demo)
                      </button>
                      <button
                        onClick={() => onSelectQuickChannel('ch_gato_news_24h')}
                        className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        Gato Notícias (Demo)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

            {/* STATE 3: LOADING / BUFFERING OVERLAY */}
            {selectedChannel && isLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
                <div className="w-12 h-12 rounded-full border-3 border-blue-500/30 border-t-blue-400 animate-spin" />
                <span className="mt-3 text-xs font-mono font-medium text-slate-200 tracking-wide">
                  Carregando sinal demonstrativo...
                </span>
              </div>
            )}

            {/* STATE 4: STREAM ERROR / UNAVAILABLE OVERLAY */}
            {selectedChannel && hasError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#090e1c]/95">
                <div className="max-w-md space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Sinal Demonstrativo Indisponível
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    A fonte demonstrativa está temporariamente indisponível. A interface está preparada para reconexão ou alternância para fonte de contingência.
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

            {/* STREAM CONTROLS OVERLAY (Visible when playing) */}
            {selectedChannel && isAccessAllowed && !hasError && (
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
                            Resolução de Teste
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
                <span>Canal Demonstrativo</span>
                <span aria-hidden="true">·</span>
                <span className="text-blue-400">Etapa 1 (Homologação)</span>
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
