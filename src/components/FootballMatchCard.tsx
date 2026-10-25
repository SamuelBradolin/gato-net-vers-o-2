import React, { useState } from 'react';
import { FootballMatch, FootballMatchChannel } from '../types';
import { Play, Clock, Tv, CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';

interface FootballMatchCardProps {
  match: FootballMatch;
  onWatchChannel: (channelId: string) => void;
}

export const FootballMatchCard: React.FC<FootballMatchCardProps> = ({
  match,
  onWatchChannel
}) => {
  const [showChannelModal, setShowChannelModal] = useState(false);

  const isLive = match.status === 'live';
  const isScheduled = match.status === 'scheduled';
  const isFinished = match.status === 'finished';
  const isPostponed = match.status === 'postponed';
  const isCancelled = match.status === 'cancelled';

  // Format date display
  const formatMatchDate = (dateStr: string) => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (dateStr === todayStr) return 'Hoje';
      if (dateStr === tomorrowStr) return 'Amanhã';

      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleActionClick = () => {
    if (match.channels.length === 0) {
      alert('Nenhum canal vinculado a esta partida no momento.');
      return;
    }

    if (match.channels.length === 1) {
      onWatchChannel(match.channels[0].channelId);
      return;
    }

    // If multiple channels, open modal to let user choose
    setShowChannelModal(true);
  };

  const handleSelectChannel = (channel: FootballMatchChannel) => {
    setShowChannelModal(false);
    onWatchChannel(channel.channelId);
  };

  return (
    <>
      <div className={`relative flex flex-col justify-between rounded-2xl bg-[#090f20]/90 border transition-all duration-300 hover:shadow-[0_0_25px_rgba(37,99,235,0.25)] hover:border-blue-500/50 ${
        isLive
          ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-gradient-to-b from-[#0e1630] to-[#080d1a]'
          : 'border-blue-900/30'
      }`}>
        {/* Top Header: Championship, Date & Time, Status */}
        <div className="p-3.5 pb-2 border-b border-blue-950/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-[11px] font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/40">
              {match.competition}
            </span>
            {match.round && (
              <span className="hidden sm:inline-block text-[10px] text-slate-400 truncate max-w-[100px]">
                • {match.round}
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                AO VIVO
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold">
                ENCERRADO
              </span>
            ) : isPostponed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-600/40 text-amber-300 text-[10px] font-semibold">
                ADIADO
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/50 border border-red-800/40 text-red-400 text-[10px] font-semibold">
                CANCELADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/50 border border-blue-800/40 text-blue-300 text-[10px] font-medium font-mono">
                <Clock className="w-2.5 h-2.5 text-blue-400" />
                {formatMatchDate(match.matchDate)} • {match.matchTime}
              </span>
            )}
          </div>
        </div>

        {/* Teams Matchup Row */}
        <div className="p-4 py-5 flex items-center justify-between gap-3">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#060a14] border border-blue-900/40 p-2 flex items-center justify-center shadow-inner overflow-hidden mb-2">
              <img
                src={match.homeTeamLogo}
                alt={match.homeTeamName}
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80';
                }}
              />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1 w-full" title={match.homeTeamName}>
              {match.homeTeamName}
            </h4>
          </div>

          {/* Match VS Indicator (Placar oculto conforme solicitado) */}
          <div className="shrink-0 flex flex-col items-center px-2">
            <span className="text-xs font-black tracking-widest text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              VS
            </span>
            {match.matchTime && (
              <span className="text-[11px] font-mono text-blue-400 mt-1 font-semibold">
                {match.matchTime}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#060a14] border border-blue-900/40 p-2 flex items-center justify-center shadow-inner overflow-hidden mb-2">
              <img
                src={match.awayTeamLogo}
                alt={match.awayTeamName}
                className="w-full h-full object-contain filter drop-shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&h=120&q=80';
                }}
              />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1 w-full" title={match.awayTeamName}>
              {match.awayTeamName}
            </h4>
          </div>
        </div>

        {/* Footer: Channels badges & Action Button */}
        <div className="p-3.5 pt-2 bg-[#060a14]/60 border-t border-blue-950/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-b-2xl">
          {/* Available channels badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-0.5">
            <Tv className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {match.channels && match.channels.length > 0 ? (
              match.channels.map((ch, idx) => (
                <span
                  key={ch.channelId || idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0b1329] border border-blue-900/40 text-[10px] text-slate-300 font-medium whitespace-nowrap"
                >
                  <span className="text-blue-400 font-bold">#{ch.channelNumber ?? idx + 1}</span>
                  <span className="truncate max-w-[120px]">{ch.channelName}</span>
                </span>
              ))
            ) : (
              <span className="text-[10px] text-slate-500 italic">Sem canal vinculado</span>
            )}
          </div>

          {/* Action Button */}
          <div className="w-full sm:w-auto shrink-0">
            {isLive ? (
              <button
                onClick={handleActionClick}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ASSISTIR AGORA</span>
              </button>
            ) : isFinished ? (
              <button
                onClick={handleActionClick}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Tv className="w-3 h-3 text-slate-400" />
                <span>VER CANAL</span>
              </button>
            ) : isPostponed || isCancelled ? (
              <button
                disabled
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-800"
              >
                <span>INDISPONÍVEL</span>
              </button>
            ) : (
              <button
                onClick={handleActionClick}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ASSISTIR AGORA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Channel Selector Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#090f20] border border-blue-900/60 p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowChannelModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Tv className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Escolha o Canal de Transmissão</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Esta partida está sendo transmitida em múltiplos canais da Gato Net. Selecione qual opção deseja sintonizar:
            </p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {match.channels.map((ch, idx) => (
                <button
                  key={ch.channelId || idx}
                  onClick={() => handleSelectChannel(ch)}
                  className="w-full p-3 rounded-xl bg-[#060a14] hover:bg-blue-950/60 border border-blue-900/40 hover:border-blue-500/60 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-900/40 text-blue-300 font-mono font-bold text-xs flex items-center justify-center border border-blue-700/30">
                      #{ch.channelNumber ?? idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        {ch.channelName}
                      </h4>
                      {ch.isPrimary && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Canal Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowChannelModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
