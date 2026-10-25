import React, { useState, useEffect } from 'react';
import { FootballMatch, FootballTeam, FootballAgendaSettings, Channel, MatchStatus } from '../types';
import {
  Trophy,
  Calendar,
  Radio,
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Save,
  Clock,
  Tv,
  Globe,
  Upload,
  Image,
  Sparkles,
  X,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

interface FootballAgendaAdminProps {
  channels: Channel[];
  getAuthHeaders: () => Record<string, string>;
  triggerToast: (msg: string) => void;
  onCreateHighlightFromMatch?: (match: FootballMatch) => void;
}

export const FootballAgendaAdmin: React.FC<FootballAgendaAdminProps> = ({
  channels,
  getAuthHeaders,
  triggerToast,
  onCreateHighlightFromMatch
}) => {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<'matches' | 'teams' | 'settings'>('matches');

  // Matches State
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [compFilter, setCompFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Teams State
  const [teams, setTeams] = useState<FootballTeam[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<FootballAgendaSettings>({
    id: 'primary',
    isEnabled: true,
    daysToDisplay: 7,
    hideFinishedAfterHours: 3,
    defaultViewMode: 'live_first'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Match Form Modal State
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [formCompetition, setFormCompetition] = useState('');
  const [formCompetitionCountry, setFormCompetitionCountry] = useState('Brasil');
  const [formRound, setFormRound] = useState('');
  const [formHomeTeamId, setFormHomeTeamId] = useState('');
  const [formHomeTeamName, setFormHomeTeamName] = useState('');
  const [formHomeTeamLogo, setFormHomeTeamLogo] = useState('');
  const [formAwayTeamId, setFormAwayTeamId] = useState('');
  const [formAwayTeamName, setFormAwayTeamName] = useState('');
  const [formAwayTeamLogo, setFormAwayTeamLogo] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('16:00');
  const [formTimezone, setFormTimezone] = useState('America/Sao_Paulo');
  const [formDescription, setFormDescription] = useState('');
  const [formChannels, setFormChannels] = useState<{
    channelId: string;
    channelName: string;
    channelNumber?: number;
    isPrimary?: boolean;
  }[]>([]);
  const [formPrimaryChannelId, setFormPrimaryChannelId] = useState('');
  const [formStatus, setFormStatus] = useState<MatchStatus>('scheduled');
  const [formScoreHome, setFormScoreHome] = useState('');
  const [formScoreAway, setFormScoreAway] = useState('');
  const [formMinute, setFormMinute] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Quick Team Modal (inside Match form)
  const [isQuickTeamModalOpen, setIsQuickTeamModalOpen] = useState(false);
  const [quickTeamTarget, setQuickTeamTarget] = useState<'home' | 'away'>('home');
  const [quickTeamName, setQuickTeamName] = useState('');
  const [quickTeamShort, setQuickTeamShort] = useState('');
  const [quickTeamLogo, setQuickTeamLogo] = useState('');
  const [quickTeamCountry, setQuickTeamCountry] = useState('Brasil');
  const [isSavingQuickTeam, setIsSavingQuickTeam] = useState(false);

  // Teams Manager Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormShort, setTeamFormShort] = useState('');
  const [teamFormLogo, setTeamFormLogo] = useState('');
  const [teamFormCountry, setTeamFormCountry] = useState('Brasil');
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  // Fetch initial data
  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const res = await fetch('/api/admin/football/matches', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(Array.isArray(data) ? data : []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const res = await fetch('/api/admin/football/teams', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/football/settings', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data) setSettings(data);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    fetchSettings();
  }, []);

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHome = m.homeTeamName.toLowerCase().includes(q);
      const matchAway = m.awayTeamName.toLowerCase().includes(q);
      const matchComp = m.competition.toLowerCase().includes(q);
      if (!matchHome && !matchAway && !matchComp) return false;
    }
    if (statusFilter !== 'all' && m.status !== statusFilter) {
      return false;
    }
    if (compFilter !== 'all' && m.competition !== compFilter) {
      return false;
    }
    if (dateFilter && m.matchDate !== dateFilter) {
      return false;
    }
    return true;
  });

  // Unique competitions for dropdown
  const uniqueComps = Array.from(new Set(matches.map((m) => m.competition))).filter(Boolean);

  // Handle Home Team Selection from teams bank
  const handleSelectHomeTeam = (teamId: string) => {
    setFormHomeTeamId(teamId);
    const found = teams.find((t) => t.id === teamId);
    if (found) {
      setFormHomeTeamName(found.name);
      setFormHomeTeamLogo(found.logoUrl);
    }
  };

  // Handle Away Team Selection from teams bank
  const handleSelectAwayTeam = (teamId: string) => {
    setFormAwayTeamId(teamId);
    const found = teams.find((t) => t.id === teamId);
    if (found) {
      setFormAwayTeamName(found.name);
      setFormAwayTeamLogo(found.logoUrl);
    }
  };

  // Open Match Modal for Create
  const handleOpenCreateMatch = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingMatchId(null);
    setFormCompetition('Brasileirão Série A');
    setFormCompetitionCountry('Brasil');
    setFormRound('');
    setFormHomeTeamId('');
    setFormHomeTeamName('');
    setFormHomeTeamLogo('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80');
    setFormAwayTeamId('');
    setFormAwayTeamName('');
    setFormAwayTeamLogo('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&h=120&q=80');
    setFormDate(today);
    setFormTime('16:00');
    setFormTimezone('America/Sao_Paulo');
    setFormDescription('');
    setFormChannels([]);
    setFormPrimaryChannelId('');
    setFormStatus('scheduled');
    setFormScoreHome('');
    setFormScoreAway('');
    setFormMinute('');
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormDisplayOrder(matches.length + 1);
    setFormError(null);
    setIsMatchModalOpen(true);
  };

  // Open Match Modal for Edit
  const handleOpenEditMatch = (m: FootballMatch) => {
    setEditingMatchId(m.id);
    setFormCompetition(m.competition);
    setFormCompetitionCountry(m.competitionCountry || 'Brasil');
    setFormRound(m.round || '');
    setFormHomeTeamId(m.homeTeamId || '');
    setFormHomeTeamName(m.homeTeamName);
    setFormHomeTeamLogo(m.homeTeamLogo);
    setFormAwayTeamId(m.awayTeamId || '');
    setFormAwayTeamName(m.awayTeamName);
    setFormAwayTeamLogo(m.awayTeamLogo);
    setFormDate(m.matchDate);
    setFormTime(m.matchTime);
    setFormTimezone(m.timezone || 'America/Sao_Paulo');
    setFormDescription(m.description || '');
    setFormChannels(m.channels || []);
    setFormPrimaryChannelId(m.primaryChannelId || (m.channels[0]?.channelId || ''));
    setFormStatus(m.status);
    setFormScoreHome(m.scoreHome !== null && m.scoreHome !== undefined ? String(m.scoreHome) : '');
    setFormScoreAway(m.scoreAway !== null && m.scoreAway !== undefined ? String(m.scoreAway) : '');
    setFormMinute(m.minute || '');
    setFormIsActive(m.isActive);
    setFormIsFeatured(m.isFeatured);
    setFormDisplayOrder(m.displayOrder);
    setFormError(null);
    setIsMatchModalOpen(true);
  };

  // Channel toggling in match form
  const handleToggleChannel = (channel: Channel) => {
    setFormChannels((prev) => {
      const exists = prev.some((c) => c.channelId === channel.id);
      if (exists) {
        const next = prev.filter((c) => c.channelId !== channel.id);
        if (formPrimaryChannelId === channel.id) {
          setFormPrimaryChannelId(next[0]?.channelId || '');
        }
        return next;
      } else {
        const isFirst = prev.length === 0;
        if (isFirst) {
          setFormPrimaryChannelId(channel.id);
        }
        return [
          ...prev,
          {
            channelId: channel.id,
            channelName: channel.name,
            channelNumber: channel.number,
            isPrimary: isFirst
          }
        ];
      }
    });
  };

  const handleSetPrimaryChannel = (channelId: string) => {
    setFormPrimaryChannelId(channelId);
    setFormChannels((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.channelId === channelId
      }))
    );
  };

  // Save Match Handler
  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCompetition.trim()) {
      setFormError('Informe o Nome do Campeonato.');
      return;
    }
    if (!formHomeTeamName.trim() || !formAwayTeamName.trim()) {
      setFormError('Preencha os nomes dos times Mandante e Visitante.');
      return;
    }
    if (!formDate || !formTime) {
      setFormError('Informe a Data e o Horário da partida.');
      return;
    }
    if (formChannels.length === 0) {
      setFormError('Selecione pelo menos um canal cadastrado na Gato Net para transmitir esta partida.');
      return;
    }

    setIsSavingMatch(true);
    try {
      const payload = {
        competition: formCompetition.trim(),
        competition_country: formCompetitionCountry.trim(),
        round: formRound.trim() || null,
        home_team_id: formHomeTeamId || null,
        home_team_name: formHomeTeamName.trim(),
        home_team_logo: formHomeTeamLogo.trim(),
        away_team_id: formAwayTeamId || null,
        away_team_name: formAwayTeamName.trim(),
        away_team_logo: formAwayTeamLogo.trim(),
        match_date: formDate,
        match_time: formTime,
        timezone: formTimezone,
        description: formDescription.trim() || null,
        channels: formChannels.map((c) => ({
          channel_id: c.channelId,
          channel_name: c.channelName,
          channel_number: c.channelNumber,
          is_primary: c.channelId === formPrimaryChannelId
        })),
        primary_channel_id: formPrimaryChannelId || formChannels[0]?.channelId || null,
        status: formStatus,
        score_home: formScoreHome !== '' ? Number(formScoreHome) : null,
        score_away: formScoreAway !== '' ? Number(formScoreAway) : null,
        minute: formMinute.trim() || null,
        is_active: formIsActive,
        is_featured: formIsFeatured,
        display_order: Number(formDisplayOrder)
      };

      const url = editingMatchId
        ? `/api/admin/football/matches/${editingMatchId}`
        : '/api/admin/football/matches';
      const method = editingMatchId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setIsMatchModalOpen(false);
        triggerToast(
          editingMatchId
            ? 'Partida atualizada com sucesso no PostgreSQL!'
            : 'Partida cadastrada com sucesso na Agenda!'
        );
        fetchMatches();
      } else {
        setFormError(data.error || 'Erro ao salvar partida.');
      }
    } catch {
      setFormError('Falha de conexão com o servidor ao salvar partida.');
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Toggle Active
  const handleToggleMatchActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/football/matches/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
        );
        triggerToast('Visibilidade da partida alterada com sucesso!');
      }
    } catch {
      triggerToast('Erro ao alterar status da partida.');
    }
  };

  // Duplicate Match
  const handleDuplicateMatch = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/football/matches/${id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        triggerToast('Partida duplicada com sucesso!');
        fetchMatches();
      } else {
        triggerToast('Erro ao duplicar partida.');
      }
    } catch {
      triggerToast('Erro ao comunicar com o servidor.');
    }
  };

  // Delete Match
  const handleDeleteMatch = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta partida da agenda?')) return;
    try {
      const res = await fetch(`/api/admin/football/matches/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.id !== id));
        triggerToast('Partida removida com sucesso!');
      } else {
        triggerToast('Erro ao excluir partida.');
      }
    } catch {
      triggerToast('Erro ao excluir partida.');
    }
  };

  // Quick Team Creation inside match modal
  const handleOpenQuickTeam = (target: 'home' | 'away') => {
    setQuickTeamTarget(target);
    setQuickTeamName('');
    setQuickTeamShort('');
    setQuickTeamLogo('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80');
    setQuickTeamCountry('Brasil');
    setIsQuickTeamModalOpen(true);
  };

  const handleSaveQuickTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTeamName.trim() || !quickTeamLogo.trim()) {
      alert('Informe o nome e o escudo da equipe.');
      return;
    }

    setIsSavingQuickTeam(true);
    try {
      const res = await fetch('/api/admin/football/teams', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: quickTeamName.trim(),
          short_name: quickTeamShort.trim() || null,
          logo_url: quickTeamLogo.trim(),
          country: quickTeamCountry.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data) {
        setTeams((prev) => [...prev, data]);
        if (quickTeamTarget === 'home') {
          setFormHomeTeamId(data.id);
          setFormHomeTeamName(data.name);
          setFormHomeTeamLogo(data.logo_url);
        } else {
          setFormAwayTeamId(data.id);
          setFormAwayTeamName(data.name);
          setFormAwayTeamLogo(data.logo_url);
        }
        setIsQuickTeamModalOpen(false);
        triggerToast(`Equipe "${data.name}" cadastrada e vinculada à partida!`);
      } else {
        alert(data.error || 'Erro ao cadastrar equipe');
      }
    } catch {
      alert('Erro de conexão ao salvar equipe');
    } finally {
      setIsSavingQuickTeam(false);
    }
  };

  // Team Management in SubTab 2
  const handleOpenCreateTeam = () => {
    setEditingTeamId(null);
    setTeamFormName('');
    setTeamFormShort('');
    setTeamFormLogo('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80');
    setTeamFormCountry('Brasil');
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (t: FootballTeam) => {
    setEditingTeamId(t.id);
    setTeamFormName(t.name);
    setTeamFormShort(t.shortName || '');
    setTeamFormLogo(t.logoUrl);
    setTeamFormCountry(t.country || 'Brasil');
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim() || !teamFormLogo.trim()) {
      alert('Nome e escudo são obrigatórios.');
      return;
    }

    setIsSavingTeam(true);
    try {
      const url = editingTeamId
        ? `/api/admin/football/teams/${editingTeamId}`
        : '/api/admin/football/teams';
      const method = editingTeamId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: teamFormName.trim(),
          short_name: teamFormShort.trim() || null,
          logo_url: teamFormLogo.trim(),
          country: teamFormCountry.trim()
        })
      });

      if (res.ok) {
        setIsTeamModalOpen(false);
        triggerToast(editingTeamId ? 'Equipe atualizada com sucesso!' : 'Equipe cadastrada com sucesso!');
        fetchTeams();
      } else {
        alert('Erro ao salvar equipe.');
      }
    } catch {
      alert('Erro ao salvar equipe.');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Excluir esta equipe do cadastro?')) return;
    try {
      const res = await fetch(`/api/admin/football/teams/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        setTeams((prev) => prev.filter((t) => t.id !== id));
        triggerToast('Equipe removida com sucesso!');
      }
    } catch {
      triggerToast('Erro ao excluir equipe.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/football/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        triggerToast('Configurações da agenda de futebol salvas no PostgreSQL!');
      } else {
        triggerToast('Erro ao salvar configurações.');
      }
    } catch {
      triggerToast('Erro de conexão ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-blue-400" />
            <span>14. Agenda de Futebol e Transmissões Esportivas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre partidas de futebol, vincule a múltiplos canais da plataforma, gerencie escudos e organize a agenda esportiva da página inicial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateMatch}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Partida</span>
          </button>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          type="button"
          onClick={() => setSubTab('matches')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            subTab === 'matches'
              ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-400" />
          <span>Partidas Agendadas & Ao Vivo ({matches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('teams')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            subTab === 'teams'
              ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-blue-400" />
          <span>Banco de Equipes / Times ({teams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            subTab === 'settings'
              ? 'border-blue-500 text-white bg-blue-600/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Configurações da Agenda</span>
        </button>
      </div>

      {/* SUBTAB 1: MATCHES LIST */}
      {subTab === 'matches' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-[#090f20] border border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar time ou campeonato..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#060a14] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrar por Status"
                className="px-3 py-1.5 text-xs rounded-xl bg-[#060a14] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="live">Ao Vivo</option>
                <option value="scheduled">Agendado</option>
                <option value="finished">Encerrado</option>
                <option value="postponed">Adiado</option>
                <option value="cancelled">Cancelado</option>
              </select>

              {/* Competition Filter */}
              {uniqueComps.length > 0 && (
                <select
                  value={compFilter}
                  onChange={(e) => setCompFilter(e.target.value)}
                  aria-label="Filtrar por Competição"
                  className="px-3 py-1.5 text-xs rounded-xl bg-[#060a14] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Todas as Competições</option>
                  {uniqueComps.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#060a14] border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
              />

              {(searchQuery || statusFilter !== 'all' || compFilter !== 'all' || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCompFilter('all');
                    setDateFilter('');
                  }}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={fetchMatches}
              disabled={isLoadingMatches}
              className="px-3 py-1.5 rounded-xl bg-[#060a14] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMatches ? 'animate-spin text-blue-400' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Matches Table */}
          <div className="rounded-2xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Partida / Confronto</th>
                    <th className="py-3 px-4">Competição</th>
                    <th className="py-3 px-4">Data & Horário</th>
                    <th className="py-3 px-4">Status / Placar</th>
                    <th className="py-3 px-4">Canais Vinculados</th>
                    <th className="py-3 px-4 text-center">Visibilidade</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredMatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Nenhuma partida encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMatches.map((m) => (
                      <tr key={m.id} className="hover:bg-[#0c1630] transition-colors">
                        {/* Confronto */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={m.homeTeamLogo}
                                alt={m.homeTeamName}
                                className="w-7 h-7 rounded-md object-contain bg-black/60 p-0.5 border border-slate-800"
                              />
                              <span className="font-bold text-white text-xs">{m.homeTeamName}</span>
                            </div>
                            <span className="font-black text-slate-500 text-[10px]">x</span>
                            <div className="flex items-center gap-1.5">
                              <img
                                src={m.awayTeamLogo}
                                alt={m.awayTeamName}
                                className="w-7 h-7 rounded-md object-contain bg-black/60 p-0.5 border border-slate-800"
                              />
                              <span className="font-bold text-white text-xs">{m.awayTeamName}</span>
                            </div>
                          </div>
                          {m.description && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                              {m.description}
                            </span>
                          )}
                        </td>

                        {/* Competição */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-blue-300 block">{m.competition}</span>
                          {m.round && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {m.round}
                            </span>
                          )}
                        </td>

                        {/* Data e Horário */}
                        <td className="py-3 px-4 font-mono">
                          <span className="text-white block font-semibold">{m.matchDate}</span>
                          <span className="text-slate-400 text-[11px] block">{m.matchTime} BRT</span>
                        </td>

                        {/* Status / Placar */}
                        <td className="py-3 px-4">
                          {m.status === 'live' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 text-[10px] font-bold font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                AO VIVO {m.minute && `(${m.minute})`}
                              </span>
                              <div className="font-mono text-sm font-extrabold text-white">
                                {m.scoreHome ?? 0} x {m.scoreAway ?? 0}
                              </div>
                            </div>
                          ) : m.status === 'finished' ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                                Encerrado
                              </span>
                              <div className="font-mono text-xs font-bold text-slate-300 mt-0.5">
                                {m.scoreHome ?? 0} x {m.scoreAway ?? 0}
                              </div>
                            </div>
                          ) : m.status === 'postponed' ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/30 text-[10px] font-bold">
                              Adiado
                            </span>
                          ) : m.status === 'cancelled' ? (
                            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-600/30 text-[10px] font-bold">
                              Cancelado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-600/30 text-[10px] font-bold">
                              Agendado
                            </span>
                          )}
                        </td>

                        {/* Canais Vinculados */}
                        <td className="py-3 px-4">
                          {m.channels && m.channels.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                              {m.channels.map((ch, idx) => (
                                <span
                                  key={ch.channelId || idx}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                    ch.channelId === m.primaryChannelId
                                      ? 'bg-blue-600/30 border border-blue-500 text-blue-200 font-bold'
                                      : 'bg-[#060a14] border border-slate-800 text-slate-300'
                                  }`}
                                  title={ch.channelName}
                                >
                                  <span>#{ch.channelNumber || idx + 1}</span>
                                  <span className="truncate max-w-[70px]">{ch.channelName}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Nenhum</span>
                          )}
                        </td>

                        {/* Visibilidade */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMatchActive(m.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              m.isActive
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                            title={m.isActive ? 'Partida visível na agenda pública' : 'Partida oculta'}
                          >
                            {m.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Destaque no Carrossel */}
                            {onCreateHighlightFromMatch && (
                              <button
                                type="button"
                                onClick={() => onCreateHighlightFromMatch(m)}
                                className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30 transition-colors cursor-pointer"
                                title="Criar destaque no carrossel da home a partir desta partida"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                            )}

                            {/* Duplicar */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateMatch(m.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                              title="Duplicar cadastro desta partida"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditMatch(m)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-blue-600/20 border border-transparent hover:border-blue-500/30 transition-colors cursor-pointer"
                              title="Editar partida"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMatch(m.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                              title="Excluir partida da agenda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TEAMS MANAGER */}
      {subTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Banco de equipes cadastradas para seleção rápida no formulário de partidas.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateTeam}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Time</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 flex items-center justify-between gap-3 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#060a14] border border-slate-800 p-1 flex items-center justify-center shrink-0">
                    <img src={t.logoUrl} alt={t.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{t.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {t.shortName ? `${t.shortName} • ` : ''}{t.country || 'Brasil'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTeam(t)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTeam(t.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: AGENDA SETTINGS */}
      {subTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Regras de Exibição da Agenda na Página Inicial</span>
            </h3>

            {/* Toggle Is Enabled */}
            <div className="p-4 rounded-xl bg-[#060a14] border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-white block">Módulo de Futebol Ativo</span>
                <span className="text-xs text-slate-400">Exibir a aba Futebol Ao Vivo na grade da página inicial</span>
              </div>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))}
                className={`w-14 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  settings.isEnabled ? 'bg-blue-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.isEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Days to display */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dias de Programação a Exibir na Agenda:
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.daysToDisplay}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, daysToDisplay: parseInt(e.target.value, 10) || 7 }))
                }
                className="w-full sm:w-48 px-3 py-2 text-xs font-mono rounded-xl bg-[#060a14] border border-slate-700 text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Define o alcance em dias das próximas partidas exibidas para os visitantes.
              </p>
            </div>

            {/* Hide finished after hours */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ocultar Partidas Encerradas após:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={settings.hideFinishedAfterHours}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      hideFinishedAfterHours: parseInt(e.target.value, 10) || 0
                    }))
                  }
                  className="w-32 px-3 py-2 text-xs font-mono rounded-xl bg-[#060a14] border border-slate-700 text-white"
                />
                <span className="text-xs text-slate-300 font-mono">horas do término</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                As partidas não são excluídas do banco de dados, apenas saem da grade pública após este período.
              </p>
            </div>

            {/* Default view mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ordem Padrão de Exibição:
              </label>
              <select
                value={settings.defaultViewMode}
                onChange={(e: any) =>
                  setSettings((prev) => ({ ...prev, defaultViewMode: e.target.value }))
                }
                className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl bg-[#060a14] border border-slate-700 text-white"
              >
                <option value="live_first">Jogos Ao Vivo Primeiro, depois cronológico</option>
                <option value="chronological">Estritamente Cronológico (por data e hora)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingSettings ? 'Salvando...' : 'Salvar Regras da Agenda'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MATCH FORM MODAL (Add / Edit) */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-[#090f20] border border-blue-500/40 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-400" />
                  <span>{editingMatchId ? 'Editar Partida de Futebol' : 'Cadastrar Nova Partida'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vincule canais já existentes da Gato Net sem precisar duplicar URLs de stream.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMatch} className="space-y-5">
              {/* Seção 1: Competição */}
              <div className="p-4 rounded-xl bg-[#060911] border border-blue-900/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  1. Informações da Competição
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Campeonato / Torneio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Brasileirão Série A"
                      value={formCompetition}
                      onChange={(e) => setFormCompetition(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      País / Região
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Brasil, Espanha, Europa"
                      value={formCompetitionCountry}
                      onChange={(e) => setFormCompetitionCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Rodada ou Fase (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rodada 18, Final - Ida"
                      value={formRound}
                      onChange={(e) => setFormRound(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Times e Confronto */}
              <div className="p-4 rounded-xl bg-[#060911] border border-blue-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    2. Equipes do Confronto
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Selecione um time do banco ou crie um novo sem sair do formulário
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mandante */}
                  <div className="p-3.5 rounded-xl bg-[#090f20] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Time Mandante *</span>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickTeam('home')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Criar Time</span>
                      </button>
                    </div>

                    {teams.length > 0 && (
                      <select
                        value={formHomeTeamId}
                        onChange={(e) => handleSelectHomeTeam(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#060911] border border-slate-700 text-slate-200"
                      >
                        <option value="">-- Selecionar do Banco de Equipes --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.country || 'Brasil'})
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-[#060911] border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img src={formHomeTeamLogo} alt="Mandante" className="w-full h-full object-contain" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Time Mandante"
                        value={formHomeTeamName}
                        onChange={(e) => setFormHomeTeamName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="URL do Escudo do Mandante (https://...)"
                      value={formHomeTeamLogo}
                      onChange={(e) => setFormHomeTeamLogo(e.target.value)}
                      className="w-full px-3 py-1.5 text-[11px] font-mono rounded-lg bg-[#060911] border border-slate-700 text-slate-300"
                    />
                  </div>

                  {/* Visitante */}
                  <div className="p-3.5 rounded-xl bg-[#090f20] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Time Visitante *</span>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickTeam('away')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Criar Time</span>
                      </button>
                    </div>

                    {teams.length > 0 && (
                      <select
                        value={formAwayTeamId}
                        onChange={(e) => handleSelectAwayTeam(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#060911] border border-slate-700 text-slate-200"
                      >
                        <option value="">-- Selecionar do Banco de Equipes --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.country || 'Brasil'})
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-[#060911] border border-slate-800 p-1 flex items-center justify-center shrink-0">
                        <img src={formAwayTeamLogo} alt="Visitante" className="w-full h-full object-contain" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Time Visitante"
                        value={formAwayTeamName}
                        onChange={(e) => setFormAwayTeamName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="URL do Escudo do Visitante (https://...)"
                      value={formAwayTeamLogo}
                      onChange={(e) => setFormAwayTeamLogo(e.target.value)}
                      className="w-full px-3 py-1.5 text-[11px] font-mono rounded-lg bg-[#060911] border border-slate-700 text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Data, Horário e Status */}
              <div className="p-4 rounded-xl bg-[#060911] border border-blue-900/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  3. Programação e Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Data da Partida *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Horário *
                    </label>
                    <input
                      type="time"
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Status da Partida *
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e: any) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#090f20] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="scheduled">Agendado (Em breve)</option>
                      <option value="live">Ao Vivo (Transmitindo)</option>
                      <option value="finished">Encerrado</option>
                      <option value="postponed">Adiado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#090f20] border border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Score & Minute inputs if live or finished */}
                {(formStatus === 'live' || formStatus === 'finished') && (
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gols Mandante ({formHomeTeamName || 'Mandante'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={formScoreHome}
                        onChange={(e) => setFormScoreHome(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#090f20] border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gols Visitante ({formAwayTeamName || 'Visitante'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={formScoreAway}
                        onChange={(e) => setFormScoreAway(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-[#090f20] border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Minuto / Tempo
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 68', Intervalo, 2T"
                        value={formMinute}
                        onChange={(e) => setFormMinute(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-[#090f20] border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 4: Canais de Transmissão Vinculados */}
              <div className="p-4 rounded-xl bg-[#060911] border border-blue-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    4. Canais de Transmissão Vinculados *
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {formChannels.length} canal(is) selecionado(s)
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Clique para marcar os canais da Gato Net que exibirão o jogo. O canal principal será sintonizado automaticamente caso o usuário clique diretamente em "Assistir Agora".
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-[#090f20]">
                  {channels.map((ch) => {
                    const isSelected = formChannels.some((c) => c.channelId === ch.id);
                    const isPrimary = formPrimaryChannelId === ch.id;

                    return (
                      <div
                        key={ch.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-950/80 border-blue-500 text-white'
                            : 'bg-[#060a14] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                        onClick={() => handleToggleChannel(ch)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                            #{ch.number}
                          </span>
                          <span className="text-xs font-bold truncate">{ch.name}</span>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryChannel(ch.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                isPrimary
                                  ? 'bg-emerald-500 text-black'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title={isPrimary ? 'Canal principal selecionado' : 'Definir como canal principal'}
                            >
                              {isPrimary ? 'Principal' : 'Tornar Principal'}
                            </button>
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 5: Visibilidade */}
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-200 font-semibold">Exibir na Agenda Pública</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-amber-300 font-semibold">Destacar no Topo da Agenda</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMatch}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingMatch ? 'Salvando...' : 'Salvar Partida no PostgreSQL'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK TEAM CREATION MODAL */}
      {isQuickTeamModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#090f20] border border-blue-500/50 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span>Adicionar Equipe ao Banco ({quickTeamTarget === 'home' ? 'Mandante' : 'Visitante'})</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsQuickTeamModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Internacional"
                  value={quickTeamName}
                  onChange={(e) => setQuickTeamName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sigla / Abreviação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INT"
                    value={quickTeamShort}
                    onChange={(e) => setQuickTeamShort(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={quickTeamCountry}
                    onChange={(e) => setQuickTeamCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL do Escudo / Imagem *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={quickTeamLogo}
                  onChange={(e) => setQuickTeamLogo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickTeamModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickTeam}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {isSavingQuickTeam ? 'Salvando...' : 'Cadastrar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAMS MANAGER MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#090f20] border border-blue-500/50 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span>{editingTeamId ? 'Editar Equipe' : 'Cadastrar Nova Equipe'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cruzeiro"
                  value={teamFormName}
                  onChange={(e) => setTeamFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sigla (3 letras)
                  </label>
                  <input
                    type="text"
                    placeholder="CRU"
                    value={teamFormShort}
                    onChange={(e) => setTeamFormShort(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={teamFormCountry}
                    onChange={(e) => setTeamFormCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  URL do Escudo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={teamFormLogo}
                  onChange={(e) => setTeamFormLogo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeam}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {isSavingTeam ? 'Salvando...' : 'Salvar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
