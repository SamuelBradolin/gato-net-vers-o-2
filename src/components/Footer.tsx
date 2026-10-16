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
                  Grade de Canais Demonstrativos
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
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="hover:text-blue-400 transition-colors cursor-pointer text-left text-blue-400 font-semibold"
                >
                  Painel Administrativo
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
              <li><span className="text-slate-300">TV Aberta</span> · 5 canais (Demo)</li>
              <li><span className="text-slate-300">Esportes & Futebol</span> · 3 canais (Demo)</li>
              <li><span className="text-slate-300">Filmes e Séries</span> · 3 canais (Demo)</li>
              <li><span className="text-slate-300">Notícias 24 Horas</span> · 2 canais (Demo)</li>
              <li><span className="text-slate-300">Infantil & Desenhos</span> · 2 canais (Demo)</li>
            </ul>
          </div>

          {/* Sobre a Plataforma (Substituindo dados técnicos da VPS no rodapé público) */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Sobre a Gato Net
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Ambiente demonstrativo da Etapa 1. Todos os canais disponibilizados utilizam dados e fontes de teste claramente identificados.
            </p>
            <div className="p-3 rounded-xl bg-[#090e1c] border border-blue-950 text-slate-300 text-[11px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Acesso público e gratuito na fase inicial.</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright & disclaimers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Gato Net TV. Todos os direitos reservados. Etapa 1 — Estrutura e Interface.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacidade & Termos</span>
            <span>·</span>
            <span>Sem dependência de serviços externos obrigatórios</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
