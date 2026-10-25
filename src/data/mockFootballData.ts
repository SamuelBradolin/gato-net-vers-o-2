import { FootballTeam, FootballMatch, FootballAgendaSettings } from '../types';

export const INITIAL_FOOTBALL_TEAMS: FootballTeam[] = [
  {
    id: 'team_flamengo',
    name: 'Flamengo',
    shortName: 'FLA',
    logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  },
  {
    id: 'team_palmeiras',
    name: 'Palmeiras',
    shortName: 'PAL',
    logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  },
  {
    id: 'team_corinthians',
    name: 'Corinthians',
    shortName: 'COR',
    logoUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  },
  {
    id: 'team_sao_paulo',
    name: 'São Paulo',
    shortName: 'SAO',
    logoUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  },
  {
    id: 'team_real_madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    logoUrl: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Espanha'
  },
  {
    id: 'team_barcelona',
    name: 'Barcelona',
    shortName: 'BAR',
    logoUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Espanha'
  },
  {
    id: 'team_man_city',
    name: 'Manchester City',
    shortName: 'MCI',
    logoUrl: 'https://images.unsplash.com/photo-1568194157720-8bbe7114ebe8?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Inglaterra'
  },
  {
    id: 'team_liverpool',
    name: 'Liverpool',
    shortName: 'LIV',
    logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Inglaterra'
  },
  {
    id: 'team_botafogo',
    name: 'Botafogo',
    shortName: 'BOT',
    logoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  },
  {
    id: 'team_gremio',
    name: 'Grêmio',
    shortName: 'GRE',
    logoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=120&h=120&q=80',
    country: 'Brasil'
  }
];

export function getInitialDemoMatches(): FootballMatch[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const inTwoDays = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const inTwoDaysStr = inTwoDays.toISOString().split('T')[0];

  return [
    {
      id: 'match_fla_pal',
      competition: 'Brasileirão Série A',
      competitionCountry: 'Brasil',
      round: 'Rodada 18',
      homeTeamId: 'team_flamengo',
      homeTeamName: 'Flamengo',
      homeTeamLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_palmeiras',
      awayTeamName: 'Palmeiras',
      awayTeamLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: todayStr,
      matchTime: '16:00',
      timezone: 'America/Sao_Paulo',
      description: 'Clássico interestadual direto pela liderança da tabela com narração exclusiva.',
      channels: [
        { channelId: 'ch_gato_esportes_1', channelName: 'Gato Esporte 1', channelNumber: 10, isPrimary: true },
        { channelId: 'ch_globo', channelName: 'Rede Globo', channelNumber: 1, isPrimary: false }
      ],
      primaryChannelId: 'ch_gato_esportes_1',
      status: 'live',
      scoreHome: 2,
      scoreAway: 1,
      minute: "68'",
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'match_rma_bar',
      competition: 'La Liga EA Sports',
      competitionCountry: 'Espanha',
      round: 'El Clásico - Rodada 26',
      homeTeamId: 'team_real_madrid',
      homeTeamName: 'Real Madrid',
      homeTeamLogo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_barcelona',
      awayTeamName: 'Barcelona',
      awayTeamLogo: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: todayStr,
      matchTime: '17:00',
      timezone: 'America/Sao_Paulo',
      description: 'O maior clássico do futebol europeu ao vivo no Santiago Bernabéu.',
      channels: [
        { channelId: 'ch_arena_play', channelName: 'Arena Play Esportes', channelNumber: 11, isPrimary: true }
      ],
      primaryChannelId: 'ch_arena_play',
      status: 'live',
      scoreHome: 1,
      scoreAway: 1,
      minute: "34'",
      isActive: true,
      isFeatured: true,
      displayOrder: 2,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'match_cor_sao',
      competition: 'Copa do Brasil',
      competitionCountry: 'Brasil',
      round: 'Quartas de Final - Ida',
      homeTeamId: 'team_corinthians',
      homeTeamName: 'Corinthians',
      homeTeamLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_sao_paulo',
      awayTeamName: 'São Paulo',
      awayTeamLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: todayStr,
      matchTime: '21:30',
      timezone: 'America/Sao_Paulo',
      description: 'Majestoso decisivo direto da Neo Química Arena.',
      channels: [
        { channelId: 'ch_turbo_esportes', channelName: 'Turbo Esportes', channelNumber: 12, isPrimary: true },
        { channelId: 'ch_band', channelName: 'Band TV', channelNumber: 4, isPrimary: false }
      ],
      primaryChannelId: 'ch_turbo_esportes',
      status: 'scheduled',
      scoreHome: null,
      scoreAway: null,
      minute: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 3,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'match_mci_liv',
      competition: 'Premier League',
      competitionCountry: 'Inglaterra',
      round: 'Rodada 28',
      homeTeamId: 'team_man_city',
      homeTeamName: 'Manchester City',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568194157720-8bbe7114ebe8?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_liverpool',
      awayTeamName: 'Liverpool',
      awayTeamLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: tomorrowStr,
      matchTime: '13:30',
      timezone: 'America/Sao_Paulo',
      description: 'Duelo inglês no Etihad Stadium em alta definição.',
      channels: [
        { channelId: 'ch_arena_play', channelName: 'Arena Play Esportes', channelNumber: 11, isPrimary: true }
      ],
      primaryChannelId: 'ch_arena_play',
      status: 'scheduled',
      scoreHome: null,
      scoreAway: null,
      minute: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 4,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'match_bot_gre',
      competition: 'Brasileirão Série A',
      competitionCountry: 'Brasil',
      round: 'Rodada 18',
      homeTeamId: 'team_botafogo',
      homeTeamName: 'Botafogo',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_gremio',
      awayTeamName: 'Grêmio',
      awayTeamLogo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: tomorrowStr,
      matchTime: '18:30',
      timezone: 'America/Sao_Paulo',
      description: 'Partida disputada no Estádio Nilton Santos.',
      channels: [
        { channelId: 'ch_gato_esportes_1', channelName: 'Gato Esporte 1', channelNumber: 10, isPrimary: true }
      ],
      primaryChannelId: 'ch_gato_esportes_1',
      status: 'scheduled',
      scoreHome: null,
      scoreAway: null,
      minute: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 5,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: 'match_next_days',
      competition: 'UEFA Champions League',
      competitionCountry: 'Europa',
      round: 'Oitavas de Final - Volta',
      homeTeamId: 'team_real_madrid',
      homeTeamName: 'Real Madrid',
      homeTeamLogo: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=120&h=120&q=80',
      awayTeamId: 'team_man_city',
      awayTeamName: 'Manchester City',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568194157720-8bbe7114ebe8?auto=format&fit=crop&w=120&h=120&q=80',
      matchDate: inTwoDaysStr,
      matchTime: '17:00',
      timezone: 'America/Sao_Paulo',
      description: 'Grande noite européia com transmissão completa.',
      channels: [
        { channelId: 'ch_turbo_esportes', channelName: 'Turbo Esportes', channelNumber: 12, isPrimary: true }
      ],
      primaryChannelId: 'ch_turbo_esportes',
      status: 'scheduled',
      scoreHome: null,
      scoreAway: null,
      minute: null,
      isActive: true,
      isFeatured: false,
      displayOrder: 6,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];
}

export const INITIAL_FOOTBALL_SETTINGS: FootballAgendaSettings = {
  id: 'primary',
  isEnabled: true,
  daysToDisplay: 7,
  hideFinishedAfterHours: 3,
  defaultViewMode: 'live_first'
};
