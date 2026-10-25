import React from 'react';
import { GatoNetLogo } from './GatoNetLogo';
import { AdBanner } from './AdBanner';
import { AdSlot, SystemSettings } from '../types';
import { Shield, Tv } from 'lucide-react';

interface FooterProps {
  systemSettings: SystemSettings;
  footerAdSlot?: AdSlot;
  onOpenAdmin: () => void;
  onOpenPlans?: () => void;
  onOpenRemoteGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  systemSettings,
  footerAdSlot,
  onOpenAdmin,
  onOpenRemoteGuide
}) => {
  return (
    <footer className="w-full bg-[#050811] border-t border-blue-950/60 pt-10 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Footer Ad Banner Slot if enabled */}
        {footerAdSlot && footerAdSlot.isEnabled && (
          <AdBanner slot={footerAdSlot} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <GatoNetLogo customLogoUrl={systemSettings.logoUrl} size="sm" />
            <p className="text-slate-400 text-xs leading-relaxed">
              Plataforma de televisão e streaming desenvolvida para computadores, dispositivos móveis e navegadores de Smart TVs.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#canais" className="hover:text-blue-400 transition-colors">
                  Grade de Canais
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenRemoteGuide}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left"
                >
                  Controle Remoto Smart TV
                </button>
              </li>
            </ul>
          </div>

          {/* Categorias Populares */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Categorias em Destaque
            </h4>
            <ul className="space-y-2">
              <li><span className="text-slate-300">TV Aberta</span> · 5 canais</li>
              <li><span className="text-slate-300">Esportes & Futebol</span> · 3 canais</li>
              <li><span className="text-slate-300">Filmes e Séries</span> · 3 canais</li>
              <li><span className="text-slate-300">Notícias 24 Horas</span> · 2 canais</li>
              <li><span className="text-slate-300">Infantil & Desenhos</span> · 2 canais</li>
            </ul>
          </div>

          {/* Sobre a Gato Net */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Sobre a Gato Net
            </h4>
            <div className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <p>A Gato Net não hospeda, transmite ou armazena qualquer conteúdo.</p>
              <p>Todos os links e players são públicos, encontrados livremente na internet.</p>
              <p>Reproduzimos apenas fragmentos temporários (.m3u8/.ts), sem armazenar nada.</p>
              <p>Se está online, já estava. Se cair, não fomos nós.</p>
              <p className="pt-1">A Gato Net apenas organiza. A origem, o conteúdo e a responsabilidade são de terceiros.</p>
              <p className="pt-1 text-[11px] text-blue-400 font-medium">
                Para contatos legais: <a href="mailto:projetomeouve@gmail.com" className="hover:underline">projetomeouve@gmail.com</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright & disclaimers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © <button onClick={onOpenAdmin} className="hover:text-blue-400 transition-colors cursor-pointer select-none font-inherit" title="Admin">2026</button> Gato Net TV. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacidade & Termos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
