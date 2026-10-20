# Gato Net — Plataforma de Televisão Ao Vivo e Streaming

Plataforma profissional de transmissão de televisão desenvolvida para computadores, celulares, tablets e Smart TVs.

---

## 1. Identidade e Diretrizes Visuais

- **Nome Oficial:** Gato Net
- **Cores Principais:** Preto (`#060911`), Azul-Marinho Escuro (`#0b1329`) e Azul Elétrico (`#2563eb` / `#38bdf8`).
- **Logotipo Provisório:** Emblema geométrico combinando a silhueta felina com ondas de streaming.
- **Tipografia:** Plus Jakarta Sans (Interface moderna e títulos) e JetBrains Mono (EPG, timecodes e dados tabulares).
- **Sem dependências externas obrigatórias:** Zero dependência de Firebase, Supabase ou serviços proprietários externos.

---

## 2. Infraestrutura e Publicação na VPS Virtarix

- **Sistema Operacional:** Ubuntu 24.04 LTS (Noble Numbat)
- **Recursos da Máquina:** 3 vCPU | 6 GB RAM DDR4 ECC | 50 GB NVMe SSD | 200 Mbps Dedicados
- **Containers Docker:**
  - `gatonet_app`: Aplicação Node.js 22 LTS (Backend Express + Frontend React 19 / Vite)
  - `gatonet_postgres`: PostgreSQL 16 Alpine com configuração customizada para NVMe e 6GB RAM
- **Volumes Persistentes (Não apagados ao atualizar):**
  - `gatonet_pgdata`: Base de dados e transações do PostgreSQL 16
  - `gatonet_uploads`: Armazenamento de logotipos, favicons e arquivos enviados
  - `gatonet_data`: Metadados e estado do sistema
- **Scripts de Operação (`/scripts`):**
  - `scripts/deploy.sh`: Inicialização completa e build com Docker Compose
  - `scripts/create-admin.sh`: Criação interativa de Superadministrador via CLI
  - `scripts/backup.sh`: Backup com dump comprimido e rotação de 7 dias
  - `scripts/restore.sh`: Restauração segura de banco de dados e arquivos
- **Documentação Completa de Implantação:** Consulte [DEPLOY.md](./DEPLOY.md) para o passo a passo de Nginx, SSL, Crontab e troubleshooting.

---

## 3. Funcionalidades da Etapa 1 (Com Ajustes Solicitados)

1. **Lançamento Inicial Gratuito:**
   - Remoção temporária da área pública de preços, anúncios de planos VIP e promessas de Pix imediato.
   - A plataforma opera em modo aberto e gratuito, permitindo navegação e reprodução de canais de teste sem barreiras de pagamento.
   - Estrutura completa de planos preservada no painel administrativo para ativação futura.

2. **Canais Claramente Identificados como DEMO:**
   - Todos os canais contam com o selo e identificação clara de **DEMO** e **Sinal de Teste**.
   - Remoção de falsas alegações de "AO VIVO", "ONLINE" ou resolução garantida enquanto não houver transmissão em produção.

3. **Reprodutor de Vídeo sem Promessas Não Validadas:**
   - Remoção de claims de "transmissão sem travamentos", "4K garantido" ou "servidores dedicados".
   - Estado inicial com solicitação para seleção de canal (não inicia automaticamente).
   - Controles de reprodução: Play/Pause, Volume com slider e Mute, Modo Tela Cheia e proporções de tela.

4. **Publicidade com Mensagens Neutras de Espaço Reservado:**
   - 5 espaços publicitários mantidos (Topo, Lateral Player 300x250, Abaixo do Player, Inter-categorias e Rodapé), exibindo apenas avisos neutros de área reservada para anunciantes parceiros, sem anúncios comerciais fictícios.

5. **Rodapé Público Limpo:**
   - Remoção de dados técnicos da VPS Virtarix (CPU, RAM, 50GB NVMe, 200 Mbps) do rodapé público, mantendo-os devidamente organizados dentro do Painel Administrativo.

6. **Painel Administrativo Completo (13 Módulos):**
   - `1. Dashboard`
   - `2. Gerenciamento de Canais`
   - `3. Categorias`
   - `4. Fontes de Transmissão`
   - `5. Publicidade e Banners`
   - `6. Aparência do Site`
   - `7. Assinantes`
   - `8. Planos de Assinatura`
   - `9. Pagamentos Manuais (Pix & PayPal)`
   - `10. Estatísticas e Audiência`
   - `11. Configurações Gerais (Modos 1, 2 e 3)`
   - `12. Segurança e Backups da VPS Virtarix`
   - `13. Destaques da Programação (Carrossel no Player Vazio e Faixa Superior)`

7. **Sistema de Destaques da Programação:**
   - Carrossel cinematográfico no player vazio com auto-rotação configurável, controles manuais, suporte a Smart TV e redução de movimento.
   - Faixa superior (ticker) durante a reprodução com troca imediata de canal sem interromper o stream de fundo durante a rotação.
   - Respeito integral às regras de autenticação, autorização, assinaturas VIP e limites de telas simultâneas do canal vinculado.

---

## 4. Estrutura de Arquivos

```
├── server.ts                   # Servidor Express de produção e health check para VPS
├── index.html                  # Ponto de entrada com favicon SVG e fontes Plus Jakarta Sans
├── metadata.json               # Metadados oficiais da aplicação Gato Net
├── package.json                # Dependências limpas (React, Vite, Express, Lucide)
├── tsconfig.json               # Configurações de tipagem estrita TypeScript
├── vite.config.ts              # Configuração Vite
└── src/
    ├── main.tsx                # Bootstrap React 19
    ├── App.tsx                 # Controlador principal da aplicação Gato Net
    ├── index.css               # Tailwind CSS v4, variáveis e estilos de foco Smart TV
    ├── types/
    │   └── index.ts            # Tipagens TypeScript (Channel, Category, AdSlot, etc.)
    ├── data/
    │   └── mockChannels.ts     # Canais demonstrativos e configurações iniciais
    ├── components/
    │   ├── GatoNetLogo.tsx     # Emblema felino provisório com ondas elétricas de streaming
    │   ├── Header.tsx          # Cabeçalho cinematográfico limpo (sem anúncios de planos VIP)
    │   ├── Player.tsx          # Reprodutor com identificação DEMO e controles
    │   ├── ChannelGrid.tsx     # Grade de canais com identificadores DEMO e foco Smart TV
    │   ├── AdBanner.tsx        # Banners neutros de espaço reservado
    │   ├── AuthModal.tsx       # Cadastro sem CPF (Nome, WhatsApp, E-mail, Senha)
    │   ├── PlansModal.tsx      # Modal de planos preservado para ativação futura
    │   ├── TVRemoteGuide.tsx   # Manual de atalhos para controle remoto e teclado
    │   └── Footer.tsx          # Rodapé institucional sem dados técnicos da VPS
    └── admin/
        └── AdminPanel.tsx      # Painel Administrativo profissional com 12 módulos
```
