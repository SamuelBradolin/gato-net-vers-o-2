import React, { useState, useEffect } from 'react';
import { X, Tv, Monitor, Smartphone, Globe, AlertCircle, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ActiveSession {
  id: string;
  channel_id: string;
  channel_name?: string;
  device_info?: string;
  started_at: string;
  ip_address?: string | null;
}

interface SubscriberSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onSessionTerminated?: () => void;
}

export const SubscriberSessionsModal: React.FC<SubscriberSessionsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onSessionTerminated
}) => {
  const [sessionsData, setSessionsData] = useState<{
    subscriber: any;
    maxScreens: number;
    activeSessions: ActiveSession[];
    recentSessions: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!userEmail) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/public/subscriber/sessions?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setSessionsData(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar sessões do assinante:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchSessions();
    }
  }, [isOpen, userEmail]);

  if (!isOpen || !userEmail) return null;

  const handleEndSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      const res = await fetch('/api/public/playback/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userEmail,
          reason: 'Encerrada pelo assinante no gerenciador de telas'
        })
      });

      if (res.ok) {
        setActionMessage('Sessão encerrada com sucesso! A tela foi liberada.');
        setTimeout(() => setActionMessage(''), 3500);
        await fetchSessions();
        if (onSessionTerminated) {
          onSessionTerminated();
        }
      }
    } catch (err) {
      setActionMessage('Erro ao encerrar sessão.');
    } finally {
      setTerminatingId(null);
    }
  };

  const getDeviceIcon = (deviceInfo?: string) => {
    const lower = (deviceInfo || '').toLowerCase();
    if (lower.includes('tv')) return <Tv className="w-4 h-4 text-blue-400 shrink-0" />;
    if (lower.includes('celular') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (lower.includes('pc') || lower.includes('windows') || lower.includes('mac') || lower.includes('linux')) {
      return <Monitor className="w-4 h-4 text-purple-400 shrink-0" />;
    }
    return <Globe className="w-4 h-4 text-cyan-400 shrink-0" />;
  };

  const maxScreens = sessionsData?.maxScreens || 1;
  const activeSessions = sessionsData?.activeSessions || [];
  const screensInUse = activeSessions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-[#090f20] border border-blue-500/30 p-6 sm:p-7 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">Controle de Telas Simultâneas</h3>
            <p className="text-xs text-slate-400">Gerencie seus aparelhos em reprodução ativa</p>
          </div>
        </div>

        {/* Account Info & Screens Bar */}
        <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Conta:</span>
            <span className="font-mono text-white font-semibold">{userEmail}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Plano Contratado:</span>
            <span className="font-bold text-blue-400">
              {sessionsData?.subscriber?.plan_name || 'Plano de Acesso Gato Net'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-850">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">Telas em uso simultâneo:</span>
              <span className={`font-mono font-bold ${screensInUse >= maxScreens ? 'text-amber-400' : 'text-emerald-400'}`}>
                {screensInUse} de {maxScreens} tela(s) permitida(s)
              </span>
            </div>

            {/* Visual progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  screensInUse >= maxScreens ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, (screensInUse / maxScreens) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Active Sessions List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Aparelhos Conectados Agora ({activeSessions.length})
            </h4>
            <button
              onClick={fetchSessions}
              disabled={isLoading}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {activeSessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#060a14] border border-slate-850 text-center text-xs text-slate-400">
              Nenhuma tela em reprodução no momento. Você está livre para assistir em qualquer aparelho!
            </div>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-xl bg-[#060a14] border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getDeviceIcon(session.device_info)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {session.device_info || 'Dispositivo Web'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono font-bold flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Ao Vivo
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      Assistindo: <span className="text-slate-200 font-medium">{session.channel_name || 'Canal de TV'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={terminatingId === session.id}
                  onClick={() => handleEndSession(session.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{terminatingId === session.id ? 'Encerrando...' : 'Desconectar'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            O sistema monitora a reprodução em tempo real por meio de batimentos de conexão (heartbeats). Ao fechar a aba ou aplicativo, a tela é liberada automaticamente em até 45 segundos.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
