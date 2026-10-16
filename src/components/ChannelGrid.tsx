import React, { useState } from 'react';
import { Channel, Category } from '../types';
import {
  Search,
  Star,
  Play,
  Tv,
  Layers,
  Sparkles,
  Trophy,
  Film,
  Newspaper,
  Smile,
  Compass,
  X
} from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  categories: Category[];
  selectedChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  favorites: string[];
  onToggleFavorite: (channelId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  isAccessModeSubscription: boolean;
  userHasSubscription: boolean;
  focusedIndex?: number;
}

// Icon helper for categories
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'Tv': return <Tv className="w-4 h-4" />;
    case 'Trophy': return <Trophy className="w-4 h-4" />;
    case 'Film': return <Film className="w-4 h-4" />;
    case 'Newspaper': return <Newspaper className="w-4 h-4" />;
    case 'Smile': return <Smile className="w-4 h-4" />;
    case 'Compass': return <Compass className="w-4 h-4" />;
    case 'Sparkles': return <Sparkles className="w-4 h-4" />;
    default: return <Layers className="w-4 h-4" />;
  }
};

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels,
  categories,
  selectedChannelId,
  onSelectChannel,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  activeCategoryId,
  onSelectCategory
}) => {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filter channels based on Category, Search Query, and Favorites
  const filteredChannels = channels.filter((ch) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ch.name.toLowerCase().includes(q);
      const matchCat = ch.categoryName.toLowerCase().includes(q);
      const matchProg = ch.currentProgram.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchProg) return false;
    }

    // Category match
    if (activeCategoryId !== 'cat_all' && ch.categoryId !== activeCategoryId) {
      return false;
    }

    // Favorites match
    if (showOnlyFavorites && !favorites.includes(ch.id)) {
      return false;
    }

    return true;
  });

  return (
    <section id="canais" className="w-full mt-8">
      {/* Category Navigation Bar & Search Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Grade de Canais Demonstrativos</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-500/20">
              {filteredChannels.length} canais
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Navegue pelas categorias para testar os canais demonstrativos na plataforma.
          </p>
        </div>

        {/* Filter controls: Search + Favorites Filter */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar canal ou programa..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#0b1329] border border-blue-900/40 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Favorites toggle button */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              showOnlyFavorites
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#0b1329] border-blue-900/40 text-slate-400 hover:text-white'
            }`}
            title="Filtrar por Favoritos"
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Favoritos</span>
            {favorites.length > 0 && (
              <span className="font-mono text-[10px] bg-amber-950 px-1.5 py-0.2 rounded text-amber-300">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scrolling Filter Bar (Tabs / Segmented Control) */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer tv-focus-target ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-[#0a0f1d] text-slate-400 hover:text-white hover:bg-[#0e162d] border border-slate-800'
              }`}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Channel Cards Grid */}
      {filteredChannels.length === 0 ? (
        <div className="w-full py-16 text-center rounded-2xl bg-[#090e1c] border border-slate-800 p-8 my-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum canal encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Não encontramos canais com o termo "{searchQuery}". Tente buscar por outro nome ou limpar os filtros.
          </p>
          <button
            onClick={() => {
              onSearchChange('');
              onSelectCategory('cat_all');
              setShowOnlyFavorites(false);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
          {filteredChannels.map((channel) => {
            const isSelected = selectedChannelId === channel.id;
            const isFav = favorites.includes(channel.id);

            return (
              <div
                key={channel.id}
                tabIndex={0}
                role="button"
                aria-label={`Sintonizar canal ${channel.name}`}
                onClick={() => onSelectChannel(channel)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectChannel(channel);
                  }
                }}
                className={`group relative rounded-xl bg-gradient-to-b from-[#0a0f1d] to-[#070b16] border transition-all duration-200 p-3.5 flex flex-col justify-between cursor-pointer select-none tv-focus-target ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_25px_rgba(37,99,235,0.35)] -translate-y-1'
                    : 'border-slate-800/80 hover:border-blue-500/50 hover:bg-[#0c1429] hover:-translate-y-0.5'
                }`}
              >
                {/* Top Strip: Channel Number, DEMO Badge, Favorite Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{channel.number < 10 ? `0${channel.number}` : channel.number}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-900/50">
                      DEMO
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Favorite Star Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                        isFav ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Center: Channel Logo and Artwork */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#03060c] border border-slate-800 flex items-center justify-center mb-3">
                  <img
                    src={channel.backupImage}
                    alt={channel.name}
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <div className="w-12 h-12 rounded-xl bg-[#091024]/90 border border-blue-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <Tv className="w-5 h-5 text-blue-400 fallback-icon" />
                    </div>
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold font-mono tracking-wider shadow">
                      <span>SELECIONADO</span>
                    </div>
                  )}
                </div>

                {/* Bottom: Channel Title & Unboxed Metadata */}
                <div>
                  <h4 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
                    {channel.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <span className="truncate">{channel.categoryName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px] font-mono text-blue-400 shrink-0">DEMO</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-1">
                    {channel.currentProgram}
                  </p>
                </div>

                {/* Selected Status Bar */}
                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-blue-500/30 flex items-center justify-between text-[11px] text-blue-400 font-semibold font-mono">
                    <span>Sintonizado no Player</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
