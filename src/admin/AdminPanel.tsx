import React, { useState } from 'react';
import {
  Channel,
  Category,
  SubscriptionPlan,
  AdSlot,
  SystemSettings,
  PaymentSettings,
  UserSubscriber,
  AccessMode
} from '../types';
import {
  LayoutDashboard,
  Tv,
  FolderTree,
  Radio,
  Megaphone,
  Palette,
  Users,
  CreditCard,
  QrCode,
  BarChart3,
  Sliders,
  ShieldAlert,
  Server,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertTriangle
} from 'lucide-react';

interface AdminPanelProps {
  channels: Channel[];
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  plans: SubscriptionPlan[];
  setPlans: React.Dispatch<React.SetStateAction<SubscriptionPlan[]>>;
  adSlots: AdSlot[];
  setAdSlots: React.Dispatch<React.SetStateAction<AdSlot[]>>;
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  paymentSettings: PaymentSettings;
  setPaymentSettings: React.Dispatch<React.SetStateAction<PaymentSettings>>;
  subscribers: UserSubscriber[];
  setSubscribers: React.Dispatch<React.SetStateAction<UserSubscriber[]>>;
  onCloseAdmin: () => void;
}

type AdminSection =
  | 'dashboard'
  | 'channels'
  | 'categories'
  | 'sources'
  | 'ads'
  | 'appearance'
  | 'subscribers'
  | 'plans'
  | 'payments'
  | 'analytics'
  | 'settings'
  | 'security';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  channels,
  setChannels,
  categories,
  setCategories,
  plans,
  setPlans,
  adSlots,
  setAdSlots,
  systemSettings,
  setSystemSettings,
  paymentSettings,
  setPaymentSettings,
  subscribers,
  setSubscribers,
  onCloseAdmin
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [saveToast, setSaveToast] = useState('');

  // Channel Creation State
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState(categories[1]?.id || 'cat_aberta');
  const [newChannelResolution, setNewChannelResolution] = useState<'1080p' | '4K' | '720p'>('1080p');
  const [newChannelStreamUrl, setNewChannelStreamUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [newChannelProgram, setNewChannelProgram] = useState('');
  const [newChannelIsLocked, setNewChannelIsLocked] = useState(false);

  // Appearance Form State
  const [tempLogoUrl, setTempLogoUrl] = useState(systemSettings.logoUrl);
  const [tempSiteName, setTempSiteName] = useState(systemSettings.siteName);
  const [tempTagline, setTempTagline] = useState(systemSettings.tagline);

  // Payments Form State
  const [pixKey, setPixKey] = useState(paymentSettings.pix.key);
  const [pixRecipient, setPixRecipient] = useState(paymentSettings.pix.recipientName);
  const [pixCity, setPixCity] = useState(paymentSettings.pix.city);
  const [paypalLink, setPaypalLink] = useState(paymentSettings.paypal.paymentLink);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const catObj = categories.find((c) => c.id === newChannelCategory);
    const newChan: Channel = {
      id: `ch_custom_${Date.now()}`,
      number: channels.length + 1,
      name: newChannelName.trim(),
      categoryId: newChannelCategory,
      categoryName: catObj ? catObj.name : 'Variedades',
      logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=160&q=80',
      backupImage: '/src/assets/images/gato_net_hero_backdrop_1792172574872.jpg',
      streamUrl: newChannelStreamUrl,
      alternativeStreams: [],
      resolution: newChannelResolution,
      aspectRatio: '16:9',
      currentProgram: newChannelProgram || 'Transmissão Ao Vivo',
      currentProgramTime: '20:00 - 22:00',
      isLive: true,
      isLocked: newChannelIsLocked,
      description: 'Canal adicionado manualmente pelo painel administrativo da Gato Net.'
    };

    setChannels([...channels, newChan]);
    setIsAddingChannel(false);
    setNewChannelName('');
    setNewChannelProgram('');
    triggerToast('Novo canal cadastrado com sucesso!');
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(channels.filter((c) => c.id !== id));
    triggerToast('Canal removido do catálogo.');
  };

  const handleToggleAdSlot = (slotId: string) => {
    setAdSlots(
      adSlots.map((slot) =>
        slot.id === slotId ? { ...slot, isEnabled: !slot.isEnabled } : slot
      )
    );
    triggerToast('Configuração de anúncio atualizada.');
  };

  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    setSystemSettings({
      ...systemSettings,
      siteName: tempSiteName,
      tagline: tempTagline,
      logoUrl: tempLogoUrl
    });
    triggerToast('Identidade visual e logotipo atualizados!');
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSettings({
      pix: {
        ...paymentSettings.pix,
        key: pixKey,
        recipientName: pixRecipient,
        city: pixCity
      },
      paypal: {
        ...paymentSettings.paypal,
        paymentLink: paypalLink
      }
    });
    triggerToast('Dados bancários para Pix e PayPal salvos com sucesso!');
  };

  const handleChangeAccessMode = (mode: AccessMode) => {
    setSystemSettings({
      ...systemSettings,
      accessMode: mode
    });
    triggerToast(`Modo de acesso alterado para: ${mode === 'free' ? 'Modo 1 - Gratuito sem cadastro' : mode === 'free_registered' ? 'Modo 2 - Gratuito com cadastro' : 'Modo 3 - Assinatura paga'}`);
  };

  const handleApproveSubscriber = (subId: string) => {
    setSubscribers(
      subscribers.map((sub) =>
        sub.id === subId ? { ...sub, status: 'active', notes: 'Aprovado manualmente pelo administrador via WhatsApp' } : sub
      )
    );
    triggerToast('Assinatura ativada com sucesso!');
  };

  const menuItems: { id: AdminSection; label: string; icon: any }[] = [
    { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'channels', label: '2. Gerenciamento de Canais', icon: Tv },
    { id: 'categories', label: '3. Categorias', icon: FolderTree },
    { id: 'sources', label: '4. Fontes de Transmissão', icon: Radio },
    { id: 'ads', label: '5. Publicidade e Banners', icon: Megaphone },
    { id: 'appearance', label: '6. Aparência do Site', icon: Palette },
    { id: 'subscribers', label: '7. Assinantes', icon: Users },
    { id: 'plans', label: '8. Planos de Assinatura', icon: CreditCard },
    { id: 'payments', label: '9. Pagamentos Manuais', icon: QrCode },
    { id: 'analytics', label: '10. Estatísticas e Audiência', icon: BarChart3 },
    { id: 'settings', label: '11. Configurações Gerais', icon: Sliders },
    { id: 'security', label: '12. Segurança e Backups', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col">
      {/* Toast alert */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="h-16 px-6 bg-[#090f20] border-b border-blue-900/60 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onCloseAdmin}
            className="p-2 rounded-lg bg-[#060911] hover:bg-blue-950 text-slate-300 hover:text-white border border-blue-900/50 flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para a TV</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              GATO<span className="text-blue-400">NET</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">/ Painel Administrativo</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-[#060911] px-3 py-1.5 rounded-lg border border-slate-800">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Virtarix Ubuntu 24.04 (3 vCPU / 6GB RAM)</span>
          </div>
          <span className="text-[10px] font-bold font-mono uppercase px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
            Etapa 1: Estrutura
          </span>
        </div>
      </header>

      {/* Main Admin Layout: Sidebar + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar (260px) */}
        <aside className="w-full md:w-68 bg-[#070c18] border-r border-blue-950/60 p-4 shrink-0 overflow-y-auto">
          <div className="mb-4 px-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Módulos do Sistema
            </span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#0b1329]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 p-3.5 rounded-xl bg-[#091024] border border-blue-900/40 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>Arquitetura de Dados</span>
            </div>
            <p className="leading-relaxed">
              Preparado para migração definitiva para PostgreSQL local na VPS da Virtarix na Etapa 2.
            </p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 bg-[#060911] overflow-y-auto max-w-6xl">
          {/* SECTION 1: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  1. Dashboard Geral da Plataforma
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Visão executiva dos serviços, estado da VPS Virtarix e controle de acesso dos canais.
                </p>
              </div>

              {/* Status Notice about Step 1 */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Etapa 1 em Execução: Estrutura Visual e Navegação</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Conforme as diretrizes obrigatórias da Etapa 1, todas as estruturas de interface dos 12 módulos foram criadas. Não foram inventadas estatísticas falsas nem conexões fraudulentas. O banco PostgreSQL, pagamentos automatizados e infraestrutura de streaming serão integrados na VPS nas próximas etapas.
                  </p>
                </div>
              </div>

              {/* 4 Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Canais Ativos</span>
                    <Tv className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {channels.length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Distribuídos em {categories.length - 1} categorias
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Modo de Acesso</span>
                    <Sliders className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400 truncate">
                    {systemSettings.accessMode === 'free'
                      ? 'Gratuito Sem Cadastro'
                      : systemSettings.accessMode === 'free_registered'
                      ? 'Gratuito Com Cadastro'
                      : 'Assinatura Paga'}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Configurável no módulo 11
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Slots de Publicidade</span>
                    <Megaphone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {adSlots.filter((a) => a.isEnabled).length} / {adSlots.length}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Espaços de monetização ativos
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Infraestrutura VPS</span>
                    <Server className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">
                    Virtarix Ubuntu 24
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    3 vCPU · 6GB RAM · 50GB SSD
                  </span>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="p-5 rounded-xl bg-[#090f20] border border-blue-900/40 space-y-3">
                <h3 className="font-bold text-sm text-white">Atalhos Rápidos de Gestão</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveSection('channels')}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Canal</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('payments')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Configurar Chave Pix</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('appearance')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    <span>Personalizar Logotipo & Cores</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('settings')}
                    className="px-3.5 py-2 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Alternar Modo de Acesso</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: GERENCIAMENTO DE CANAIS */}
          {activeSection === 'channels' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    2. Gerenciamento de Canais
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Cadastre, edite fontes de transmissão e controle a exibição dos canais na grade.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingChannel(!isAddingChannel)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingChannel ? 'Cancelar' : 'Adicionar Novo Canal'}</span>
                </button>
              </div>

              {/* Add Channel Form */}
              {isAddingChannel && (
                <form
                  onSubmit={handleAddChannel}
                  className="p-5 rounded-2xl bg-[#091024] border border-blue-500/40 space-y-4 animate-in fade-in duration-200"
                >
                  <h3 className="font-bold text-sm text-white">Cadastrar Novo Canal na Grade</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nome do Canal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Canal Brasil Ao Vivo"
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={newChannelCategory}
                        onChange={(e) => setNewChannelCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      >
                        {categories.filter((c) => c.id !== 'cat_all').map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Resolução
                      </label>
                      <select
                        value={newChannelResolution}
                        onChange={(e) => setNewChannelResolution(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="1080p">1080p Full HD</option>
                        <option value="4K">4K Ultra HD</option>
                        <option value="720p">720p HD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      URL da Fonte de Transmissão (HLS / MP4 Demo) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newChannelStreamUrl}
                      onChange={(e) => setNewChannelStreamUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Programa Atual (EPG)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Futebol Ao Vivo - Rodada Noturna"
                        value={newChannelProgram}
                        onChange={(e) => setNewChannelProgram(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="isLockedCheckbox"
                        checked={newChannelIsLocked}
                        onChange={(e) => setNewChannelIsLocked(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                      />
                      <label htmlFor="isLockedCheckbox" className="text-xs text-slate-300 cursor-pointer">
                        Canal Exclusivo para Assinantes VIP (Bloqueado no Modo 3)
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingChannel(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Salvar Canal
                    </button>
                  </div>
                </form>
              )}

              {/* Channels Table */}
              <div className="rounded-xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Canal</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4">Resolução</th>
                        <th className="py-3 px-4">Programa EPG</th>
                        <th className="py-3 px-4">Acesso VIP</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {channels.map((ch) => (
                        <tr key={ch.id} className="hover:bg-[#0c1630] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-slate-400 font-bold">#{ch.number}</span>
                              <div className="w-7 h-7 rounded bg-black flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                                <img
                                  src={ch.logo}
                                  alt={ch.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <Tv className="w-3.5 h-3.5 text-blue-400 fallback-icon" />
                              </div>
                              <span className="font-semibold text-white">{ch.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{ch.categoryName}</td>
                          <td className="py-3 px-4 font-mono text-blue-400">{ch.resolution}</td>
                          <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{ch.currentProgram}</td>
                          <td className="py-3 px-4">
                            {ch.isLocked ? (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                Exclusivo VIP
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                Aberto
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteChannel(ch.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Remover canal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: CATEGORIAS */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  3. Gerenciamento de Categorias
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Organize as seções temáticas e ordene os canais exibidos na página inicial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-blue-950 font-mono text-xs font-bold text-blue-400 flex items-center justify-center">
                        {idx}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">Slug: /{cat.slug}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-1 rounded border border-blue-900/60">
                      {channels.filter((c) => cat.id === 'cat_all' || c.categoryId === cat.id).length} canais
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: FONTES DE TRANSMISSÃO */}
          {activeSection === 'sources' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  4. Fontes de Transmissão (Streaming Sources)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure as rotas de streaming HLS, servidores de contingência e monitoramento de latência.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Servidor Primário HLS Virtarix</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pronto para HLS na VPS</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Protocolo Padrão:</span>
                    <span className="text-white font-bold">HLS (HTTP Live Streaming)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Failover Automático:</span>
                    <span className="text-emerald-400 font-bold">Habilitado</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#060911] border border-slate-800">
                    <span className="text-slate-400 block mb-1">Porta Virtarix:</span>
                    <span className="text-blue-400 font-bold">200 Mbps</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Na Etapa 1, os streams utilizam fontes públicas de homologação com controle de contingência. Nas próximas etapas, o backend Node.js gerenciará fontes m3u8 autorizadas com verificação automática de status de sinal.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 5: PUBLICIDADE E BANNERS */}
          {activeSection === 'ads' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  5. Publicidade e Banners
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie os 5 espaços publicitários planejados para monetização da Gato Net.
                </p>
              </div>

              <div className="space-y-4">
                {adSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-5 rounded-xl bg-[#090f20] border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{slot.title}</span>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900/40">
                          {slot.dimensions}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{slot.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleAdSlot(slot.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          slot.isEnabled
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {slot.isEnabled ? 'Slot Ativado' : 'Slot Desativado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: APARÊNCIA DO SITE */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  6. Aparência do Site e Logotipo
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Substitua o logotipo provisório, ajuste o nome da marca e personalize a paleta de cores.
                </p>
              </div>

              <form onSubmit={handleSaveAppearance} className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nome Oficial da Plataforma
                    </label>
                    <input
                      type="text"
                      value={tempSiteName}
                      onChange={(e) => setTempSiteName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Slogan / Descrição Curta
                    </label>
                    <input
                      type="text"
                      value={tempTagline}
                      onChange={(e) => setTempTagline(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    URL do Logotipo Personalizado (opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://seusite.com/logo-gatonet.png (deixe vazio para usar o logotipo moderno em vetor padrão)"
                    value={tempLogoUrl}
                    onChange={(e) => setTempLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    O sistema utiliza por padrão o emblema provisório moderno com o felino e ondas azuis elétricas.
                  </span>
                </div>

                {/* Palette specs */}
                <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white">Paleta Oficial Gato Net</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[#060911] border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Preto Principal</span>
                      <span className="font-bold text-slate-200">#060911</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0b1329] border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Azul-Marinho Escuro</span>
                      <span className="font-bold text-blue-300">#0b1329</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#2563eb] text-white">
                      <span className="text-[10px] opacity-80 block">Azul Elétrico</span>
                      <span className="font-bold">#2563eb</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações de Aparência</span>
                </button>
              </form>
            </div>
          )}

          {/* SECTION 7: ASSINANTES */}
          {activeSection === 'subscribers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  7. Gestão de Assinantes
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhe os cadastros de assinantes com Nome, WhatsApp e E-mail (sem exigência de CPF).
                </p>
              </div>

              <div className="rounded-xl border border-blue-900/40 bg-[#090f20] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0b1329] text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Nome Completo</th>
                        <th className="py-3 px-4">WhatsApp</th>
                        <th className="py-3 px-4">E-mail</th>
                        <th className="py-3 px-4">Plano</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#0c1630]">
                          <td className="py-3 px-4 font-semibold text-white">{sub.fullName}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400">
                            <a
                              href={`https://wa.me/55${sub.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{sub.whatsapp}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{sub.email}</td>
                          <td className="py-3 px-4">{sub.planName}</td>
                          <td className="py-3 px-4">
                            {sub.status === 'active' ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                Ativo
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                Pendente Pix
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{sub.expiresAt}</td>
                          <td className="py-3 px-4 text-right">
                            {sub.status === 'pending' && (
                              <button
                                onClick={() => handleApproveSubscriber(sub.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                Aprovar Pagamento
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#091024] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Estrutura de dados preparada para persistência na tabela <code>subscribers</code> do PostgreSQL na VPS Virtarix.
                </span>
              </div>
            </div>
          )}

          {/* SECTION 8: PLANOS DE ASSINATURA */}
          {activeSection === 'plans' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  8. Planos de Assinatura
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Valores configuráveis para a modalidade paga (Mensal, Trimestral e Anual).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base">{plan.name}</h4>
                      <span className="text-xs font-mono text-blue-400">{plan.badge}</span>
                    </div>

                    <div className="text-2xl font-mono font-extrabold text-white">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 9: PAGAMENTOS MANUAIS */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  9. Pagamentos Manuais (Pix & PayPal)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre a chave Pix para clientes do Brasil e link do PayPal para clientes no exterior.
                </p>
              </div>

              <form onSubmit={handleSavePayments} className="p-6 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-blue-400" />
                    <span>Configuração do Pix (Brasil)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Chave Pix *
                      </label>
                      <input
                        type="text"
                        required
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nome do Recebedor *
                      </label>
                      <input
                        type="text"
                        required
                        value={pixRecipient}
                        onChange={(e) => setPixRecipient(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Cidade do Recebedor *
                      </label>
                      <input
                        type="text"
                        required
                        value={pixCity}
                        onChange={(e) => setPixCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Configuração do PayPal (Internacional)</span>
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Link de Pagamento PayPal *
                    </label>
                    <input
                      type="url"
                      required
                      value={paypalLink}
                      onChange={(e) => setPaypalLink(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Dados de Pagamento Manual</span>
                </button>
              </form>
            </div>
          )}

          {/* SECTION 10: ESTATÍSTICAS E AUDIÊNCIA */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  10. Estatísticas e Audiência
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Estrutura de monitoramento de audiência e consumo de banda de rede.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Conformidade Obrigatória da Etapa 1</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Não são exibidas estatísticas simuladas como se fossem dados reais. A telemetria real de conexões simultâneas, bitrate e audiência por canal será conectada diretamente aos logs do Nginx na VPS Virtarix na Etapa 2.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-xs text-slate-400 block mb-1">Capacidade de Rede VPS</span>
                  <span className="text-xl font-mono font-bold text-white">200 Mbps</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Porta de uplink Virtarix</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-xs text-slate-400 block mb-1">Limite Conexões por Assinante</span>
                  <span className="text-xl font-mono font-bold text-blue-400">2 a 4 Telas</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Conforme plano contratado</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090f20] border border-blue-900/40">
                  <span className="text-xs text-slate-400 block mb-1">Métricas de Audiência</span>
                  <span className="text-sm font-bold text-amber-400">Aguardando Backend</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Planejado para Etapa 2</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 11: CONFIGURAÇÕES GERAIS (3 MODOS DE ACESSO) */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  11. Configurações Gerais e Modos de Acesso
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione entre as três modalidades de negócio preparadas para a plataforma Gato Net.
                </p>
              </div>

              {/* 3 Access Modes */}
              <div className="space-y-4">
                {/* Modo 1 */}
                <div
                  onClick={() => handleChangeAccessMode('free')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    systemSettings.accessMode === 'free'
                      ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50'
                      : 'border-slate-800 bg-[#090f20] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        Modo 1 — Gratuito sem cadastro (Padrão Atual)
                      </h4>
                    </div>
                    {systemSettings.accessMode === 'free' && (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    Qualquer visitante pode abrir o site e assistir aos canais imediatamente sem necessidade de login. Ideal para a fase de lançamento da Gato Net.
                  </p>
                </div>

                {/* Modo 2 */}
                <div
                  onClick={() => handleChangeAccessMode('free_registered')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    systemSettings.accessMode === 'free_registered'
                      ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50'
                      : 'border-slate-800 bg-[#090f20] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        Modo 2 — Gratuito com cadastro
                      </h4>
                    </div>
                    {systemSettings.accessMode === 'free_registered' && (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    O visitante pode navegar pelo catálogo publicamente, mas para reproduzir o streaming precisará criar uma conta gratuita com Nome, WhatsApp e E-mail.
                  </p>
                </div>

                {/* Modo 3 */}
                <div
                  onClick={() => handleChangeAccessMode('subscription')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    systemSettings.accessMode === 'subscription'
                      ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50'
                      : 'border-slate-800 bg-[#090f20] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                        3
                      </span>
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        Modo 3 — Assinatura paga (VIP)
                      </h4>
                    </div>
                    {systemSettings.accessMode === 'subscription' && (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>ATIVO</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-8">
                    O catálogo de canais permanece visível ao público para conversão, mas os canais protegidos exigem uma assinatura ativa liberada manualmente via Pix ou PayPal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 12: SEGURANÇA E BACKUPS */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  12. Segurança e Backups da VPS Virtarix
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Parâmetros de proteção do servidor Ubuntu 24.04, PostgreSQL e Nginx.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#090f20] border border-blue-900/40 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>Plano de Segurança para VPS Virtarix</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400">Firewall UFW:</span>
                    <div className="text-emerald-400">Portas 80, 443 (HTTP/S) e 22 (SSH)</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400">Banco de Dados PostgreSQL:</span>
                    <div className="text-slate-200">Porta 5432 restrita a localhost (127.0.0.1)</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400">Backup Diário PostgreSQL:</span>
                    <div className="text-blue-400">Cronjob com pg_dump rotativo</div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800 space-y-1">
                    <span className="text-slate-400">SSL / TLS:</span>
                    <div className="text-emerald-400">Let's Encrypt Certbot via Nginx</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 text-[11px] text-slate-400">
                  Nota: Não há credenciais sensíveis expostas no código cliente. A implementação do backend Node.js na VPS Virtarix utilizará variáveis de ambiente no arquivo <code>.env</code>.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
