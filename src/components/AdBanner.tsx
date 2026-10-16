import React from 'react';
import { AdSlot } from '../types';
import { Megaphone } from 'lucide-react';

interface AdBannerProps {
  slot: AdSlot;
  onPlanClick?: () => void;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot, className = '' }) => {
  if (!slot.isEnabled) return null;

  if (slot.slotType === 'player_side') {
    return (
      <div
        className={`w-full h-full min-h-[250px] max-h-[360px] rounded-xl border border-blue-900/40 bg-gradient-to-b from-[#0b1329] via-[#091024] to-[#060a17] p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg ${className}`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="uppercase tracking-wider">Espaço Reservado</span>
          <span className="text-[11px] text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-500/20">
            {slot.dimensions}
          </span>
        </div>

        <div className="my-auto py-4 space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <Megaphone className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-white leading-snug">
            {slot.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {slot.subtitle || 'Área disponível para veiculação de campanhas institucionais e anunciantes parceiros da plataforma.'}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <div className="w-full py-2 px-3 rounded-lg bg-[#060911] border border-slate-800 text-center text-xs text-slate-400 font-medium">
            Formato Padrão 300x250
          </div>
        </div>
      </div>
    );
  }

  if (slot.slotType === 'header') {
    return (
      <div className={`w-full max-w-4xl mx-auto py-2 px-4 ${className}`}>
        <div className="h-[70px] sm:h-[80px] rounded-lg border border-dashed border-blue-900/50 bg-[#091024]/60 flex items-center justify-between px-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/20">
              Publicidade
            </span>
            <span className="text-slate-200 font-medium">{slot.title}</span>
            <span className="hidden md:inline text-slate-400 text-xs">· {slot.subtitle}</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            728x90 px
          </span>
        </div>
      </div>
    );
  }

  if (slot.slotType === 'player_bottom') {
    return (
      <div className={`w-full my-4 ${className}`}>
        <div className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-[#0b1329] via-[#0e1a38] to-[#0b1329] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/20">
                  Espaço Publicitário
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {slot.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {slot.subtitle || 'Área disponível para exibição de anúncios de patrocinadores e campanhas parceiras da Gato Net.'}
              </p>
            </div>
          </div>
          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[#060911] border border-slate-800 text-xs text-slate-400 font-mono">
            {slot.dimensions}
          </div>
        </div>
      </div>
    );
  }

  // Generic neutral ad container
  return (
    <div className={`w-full my-6 text-center ${className}`}>
      <div className="p-4 rounded-xl border border-blue-950 bg-[#091024]/40 text-xs text-slate-400 flex items-center justify-center gap-3">
        <span className="font-mono text-[11px] text-blue-400 uppercase">Espaço Publicitário</span>
        <span className="text-slate-300">{slot.title}</span>
        <span className="text-slate-400 font-mono">({slot.dimensions})</span>
      </div>
    </div>
  );
};
