import React from 'react';
import { X, Tv, Keyboard, Navigation, Maximize2, Volume2, Play } from 'lucide-react';

interface TVRemoteGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TVRemoteGuide: React.FC<TVRemoteGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1329] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <Tv className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            Navegação por Smart TV & Teclado
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            A Gato Net foi projetada com foco de alto contraste para controles remotos e navegadores de Smart TVs.
          </p>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Navigation className="w-4 h-4 text-blue-400" />
              <span>Navegar entre canais e categorias</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Setas ↑ ↓ ← →</kbd>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Play className="w-4 h-4 text-blue-400" />
              <span>Sintonizar canal selecionado</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Enter / OK</kbd>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-blue-400" />
              <span>Pausar ou Reproduzir transmissão</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Espaço</kbd>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Maximize2 className="w-4 h-4 text-blue-400" />
              <span>Tela cheia (Modo Cinema)</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">F</kbd>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span>Silenciar / Ativar áudio</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">M</kbd>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Entendido, voltar à TV
        </button>
      </div>
    </div>
  );
};
