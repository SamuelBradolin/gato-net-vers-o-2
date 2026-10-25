import React, { useState, useMemo } from 'react';
import { FootballMatch } from '../types';
import { FootballMatchCard } from './FootballMatchCard';
import { Trophy, Calendar, Radio, Search, Filter, RefreshCw, X, AlertCircle } from 'lucide-react';

interface FootballAgendaSectionProps {
  matches: FootballMatch[];
  onWatchChannel: (channelId: string) => void;
  onNavigateToChannels: () => void;
  searchQuery?: string;
}

type DateFilterType = 'all' | 'today' | 'tomorrow' | 'upcoming';

export const FootballAgendaSection: React.FC<FootballAgendaSectionProps> = ({
  matches,
  onWatchChannel,
  onNavigateToChannels,
  searchQuery = ''
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState('');

  // Extract unique competitions for filter
  const competitions = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.competition) set.add(m.competition);
    });
    return Array.from(set).sort();
  }, [matches]);

  // Compute date strings for comparison
  const { todayStr, tomorrowStr } = useMemo(() => {
    const today = new Date();
    const tStr = today.toISOString().split('T')[0];
    const tom = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const tomStr = tom.toISOString().split('T')[0];
    return { todayStr: tStr, tomorrowStr: tomStr };
  }, []);

  // Filter matches
  const filteredMatches = useMemo(() => {
    const query = (localSearch || searchQuery).toLowerCase().trim();

    return matches.filter((m) => {
      // Search query filter (teams, competition, round)
      if (query) {
        const homeMatch = m.homeTeamName.toLowerCase().includes(query);
        const awayMatch = m.awayTeamName.toLowerCase().includes(query);
        const compMatch = m.competition.toLowerCase().includes(query);
        const roundMatch = (m.round || '').toLowerCase().includes(query);
        if (!homeMatch && !awayMatch && !compMatch && !roundMatch) {
          return false;
        }
      }

      // Competition filter
      if (selectedCompetition !== 'all' && m.competition !== selectedCompetition) {
        return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        return m.matchDate === todayStr;
      } else if (dateFilter === 'tomorrow') {
        return m.matchDate === tomorrowStr;
      } else if (dateFilter === 'upcoming') {
        return m.matchDate > tomorrowStr;
      }

      return true;
    });
  }, [matches, localSearch, searchQuery, selectedCompetition, dateFilter, todayStr, tomorrowStr]);

  const liveMatchesCount = useMemo(() => {
    return matches.filter((m) => m.status === 'live').length;
  }, [matches]);

  return (
    <div className="w-full">
      {/* Sub-header Controls: Date tabs & Competition filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 p-3.5 rounded-2xl bg-[#090e1c]/80 border border-blue-900/40">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              dateFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#060a14] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({matches.length})
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              dateFilter === 'today'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#060a14] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Hoje</span>
            {liveMatchesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            )}
          </button>
          <button
            onClick={() => setDateFilter('tomorrow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              dateFilter === 'tomorrow'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#060a14] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Amanhã
          </button>
          <button
            onClick={() => setDateFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              dateFilter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'bg-[#060a14] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Próximos Dias
          </button>
        </div>

        {/* Right side: Competition Dropdown & Local quick search */}
        <div className="flex items-center gap-2">
          {competitions.length > 1 && (
            <div className="relative">
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                aria-label="Filtrar por Campeonato"
                className="pl-3 pr-8 py-1.5 text-xs rounded-xl bg-[#060a14] border border-blue-900/50 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
              >
                <option value="all">Todos os Campeonatos</option>
                {competitions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Matches Counter Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-mono font-medium shrink-0">
            {liveMatchesCount > 0 && (
              <span className="flex items-center gap-1 text-red-400 font-bold mr-1">
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                {liveMatchesCount} Ao Vivo
              </span>
            )}
            <span>{filteredMatches.length} jogos</span>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="w-full py-16 text-center rounded-2xl bg-[#090e1c] border border-slate-800 p-8 my-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 mb-3">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma partida na agenda esportiva</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Não encontramos partidas com os filtros selecionados no momento. Você pode ajustar a data ou sintonizar a grade de canais ao vivo normalmente.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {(dateFilter !== 'all' || selectedCompetition !== 'all' || localSearch) && (
              <button
                onClick={() => {
                  setDateFilter('all');
                  setSelectedCompetition('all');
                  setLocalSearch('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={onNavigateToChannels}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 transition-colors cursor-pointer"
            >
              Explorar Todos os Canais
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => (
            <FootballMatchCard
              key={match.id}
              match={match}
              onWatchChannel={onWatchChannel}
            />
          ))}
        </div>
      )}
    </div>
  );
};
