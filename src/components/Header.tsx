import React, { useState } from 'react';
import { GatoNetLogo } from './GatoNetLogo';
import {
  Search,
  User,
  Shield,
  Tv,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  customLogoUrl?: string;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenPlans?: () => void;
  onOpenSessions?: () => void;
  onOpenRemoteGuide: () => void;
  userEmail?: string | null;
  isAdminMode: boolean;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const Header: React.FC<HeaderProps> = ({
  customLogoUrl,
  onOpenAuth,
  onOpenAdmin,
  onOpenPlans,
  onOpenSessions,
  onOpenRemoteGuide,
  userEmail,
  isAdminMode,
  onSearchChange,
  searchQuery
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#060911]/95 backdrop-blur-md border-b border-blue-950/60 shadow-lg">
      {/* 3-Zone Top Bar Contract: Brand | Navigation | Primary Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand Wordmark & Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <a href="#" className="flex items-center focus:outline-none tv-focus-target rounded-lg">
            <GatoNetLogo customLogoUrl={customLogoUrl} size="md" />
          </a>
        </div>

        {/* Zone 2: Navigation Links & Search (Desktop) */}
        <div className="hidden lg:flex items-center gap-6 min-w-0">
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <a
              href="#canais"
              className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
            >
              Canais Demonstrativos
            </a>
            <a
              href="#canais"
              className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
            >
              Categorias
            </a>
            <button
              onClick={onOpenRemoteGuide}
              className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-300 hover:text-white"
              title="Instruções para Controle Remoto e Smart TV"
            >
              <Tv className="w-4 h-4 text-blue-400" />
              <span>Smart TV</span>
            </button>
          </nav>

          {/* Header Quick Search */}
          <div className="relative w-48 xl:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar canal..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#0b1329] border border-blue-900/50 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Zone 3: Primary Action & Admin Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Admin Toggle Button */}
          <button
            onClick={onOpenAdmin}
            className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 tv-focus-target ${
              isAdminMode
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#0b1329] text-blue-400 hover:bg-[#0f1b3d] border border-blue-800/40'
            }`}
            title="Acessar o Painel Administrativo da Gato Net"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isAdminMode ? 'Voltar para a TV' : 'Painel Admin'}
            </span>
            <span className="sm:hidden">Admin</span>
          </button>

          {/* Subscriber Simultaneous Screens Control */}
          {userEmail && onOpenSessions && (
            <button
              onClick={onOpenSessions}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/30 text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 tv-focus-target"
              title="Gerenciar Telas Simultâneas da sua Assinatura"
            >
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Minhas Telas</span>
            </button>
          )}

          {/* Reserved Login / Cadastro Area */}
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm tv-focus-target"
          >
            <User className="w-3.5 h-3.5" />
            <span>{userEmail ? 'Minha Conta' : 'Entrar / Cadastrar'}</span>
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white bg-[#0b1329] border border-slate-800"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-3 pb-5 bg-[#080d1a] border-b border-blue-900/50 space-y-3">
          <div className="relative w-full mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar canal ou programa..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#0b1329] border border-blue-900/50 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            {userEmail && onOpenSessions && (
              <button
                onClick={() => {
                  onOpenSessions();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center gap-2 text-xs font-semibold"
              >
                <Tv className="w-4 h-4 text-blue-400" />
                <span>Gerenciar Minhas Telas Simultâneas</span>
              </button>
            )}
            <a
              href="#canais"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-blue-950/60 text-slate-200"
            >
              Canais Demonstrativos
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRemoteGuide();
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-blue-950/60 text-slate-300 flex items-center justify-between"
            >
              <span>Atalhos para Smart TV & Teclado</span>
              <Tv className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-blue-950/60 text-blue-400 flex items-center justify-between font-semibold"
            >
              <span>{isAdminMode ? 'Voltar para Modo TV' : 'Painel Administrativo'}</span>
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
