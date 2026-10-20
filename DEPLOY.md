# Guia de Implantação e Operação na VPS Virtarix — Gato Net

Este documento fornece as instruções passo a passo para a publicação manual, operação contínua, atualização e rotinas de backup da plataforma **Gato Net** na **VPS Virtarix** rodando **Ubuntu 24.04 LTS**.

---

## 1. Especificações de Referência da VPS

- **Sistema Operacional:** Ubuntu 24.04 LTS (Noble Numbat)
- **Recursos:** 3 vCPU | 6 GB RAM DDR4 ECC | 50 GB NVMe SSD | 200 Mbps Dedicados
- **Arquitetura de Software:**
  - **Runtime da Aplicação:** Node.js 22 LTS em container Docker (`gatonet_app`)
  - **Banco de Dados:** PostgreSQL 16 Alpine otimizado em container Docker (`gatonet_postgres`)
  - **Orquestrador:** Docker Compose v2
  - **Proxy Reverso e SSL:** Nginx com Certbot (Let's Encrypt)
  - **Portas Internas:**
    - `127.0.0.1:3000` (Aplicação Node.js / Express)
    - `127.0.0.1:5432` (PostgreSQL restrito a localhost)
  - **Portas Externas:** `80/TCP` (HTTP) e `443/TCP` (HTTPS)

---

## 2. Preparação do Servidor Ubuntu 24.04 LTS

Conecte-se à sua VPS via SSH:

```bash
ssh root@SEU_IP_VIRTARIX
```

### 2.1. Atualizar Pacotes do Sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw nano nginx certbot python3-certbot-nginx
```

### 2.2. Configurar Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP Nginx
sudo ufw allow 443/tcp   # HTTPS Nginx
sudo ufw --force enable
```

### 2.3. Instalar o Docker Engine e Docker Compose Plugin
```bash
# Instalação oficial do Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable --now docker

# Validar instalação
docker --version
docker compose version
```

---

## 3. Clonar o Projeto e Configurar o Ambiente

### 3.1. Clonar o Repositório do GitHub
```bash
cd /var/www
git clone https://github.com/SEU_USUARIO/gato-net.git
cd gato-net
```

### 3.2. Configurar o Arquivo de Variáveis de Ambiente (.env)
O repositório **NÃO contém senhas ou credenciais reais**. Crie seu `.env` a partir do modelo:

```bash
cp .env.example .env
nano .env
```

Gere senhas criptograficamente seguras para o PostgreSQL e para o segredo de sessão:
```bash
# Gerar senha forte para o PostgreSQL
openssl rand -hex 16

# Gerar segredo de sessão
openssl rand -hex 32
```

Preencha no arquivo `.env`:
```env
PORT=3000
NODE_ENV=production

POSTGRES_USER=gatonet_user
POSTGRES_PASSWORD=SUA_SENHA_FORTE_GERADA_AQUI
POSTGRES_DB=gatonet_db
DATABASE_URL=postgres://gatonet_user:SUA_SENHA_FORTE_GERADA_AQUI@postgres:5432/gatonet_db

APP_URL=https://seusite.com.br
SESSION_SECRET=SEU_SEGREDO_DE_SESSAO_GERADO_AQUI
DISABLE_HMR=true
```

> **Atenção:** O arquivo `.env` está no `.gitignore` e **nunca** deve ser incluído no GitHub.

---

## 4. Inicialização da Aplicação via Docker Compose

### 4.1. Garantir Permissões dos Scripts
```bash
chmod +x scripts/*.sh
```

### 4.2. Executar o Script de Deploy
O script automatizado compila os assets, inicia o PostgreSQL 16, aguarda o banco estar pronto e aplica todas as migrações:

```bash
bash scripts/deploy.sh
```

*(Ou manualmente via Docker Compose:)*
```bash
docker compose up -d --build
```

### 4.3. Criar o Primeiro Superadministrador
Execute o script interativo para cadastrar o primeiro administrador com senha protegida via Argon2id:

```bash
bash scripts/create-admin.sh
```
Informe nome, e-mail e senha segura (mínimo 8 caracteres).

---

## 5. Configuração do Proxy Reverso Nginx com SSL

Crie a configuração do site no Nginx:

```bash
sudo nano /etc/nginx/sites-available/gatonet
```

Cole o conteúdo abaixo (substituindo `seusite.com.br` pelo seu domínio ou subdomínio configurado na DNS da VPS):

```nginx
server {
    listen 80;
    server_name seusite.com.br www.seusite.com.br;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }

    # Cache estático para uploads de logotipos e favicons
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Ative o site e emita o certificado SSL gratuito:

```bash
sudo ln -s /etc/nginx/sites-available/gatonet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Emitir certificado SSL Let's Encrypt
sudo certbot --nginx -d seusite.com.br -d www.seusite.com.br
```

---

## 6. Procedimento Seguro de Atualização do Código

Para atualizar o projeto após novos commits no GitHub **sem perder dados**:

```bash
cd /var/www/gato-net

# 1. Puxar alterações do repositório
git pull origin main

# 2. Reconstruir containers sem derrubar volumes persistentes
docker compose up -d --build

# 3. Executar novas migrações se houver
docker compose exec -T app npm run migrate
```

> **IMPORTANTE — PRESERVAÇÃO DE VOLUMES:**
> O comando `docker compose up -d --build` atualiza os binários e código da aplicação preservando integralmente os volumes `gatonet_pgdata` (dados do PostgreSQL) e `gatonet_uploads` (imagens de logo/favicon). **Nunca** utilize o comando `docker compose down -v` em produção, pois a flag `-v` remove os volumes persistentes!

---

## 7. Política e Orientações de Backup

### 7.1. Backup Manual
O script `scripts/backup.sh` gera um dump comprimido do PostgreSQL e um arquivo tarball da pasta de uploads:

```bash
bash scripts/backup.sh
```

Os arquivos serão armazenados na pasta `./backups/` com timestamp:
- `gatonet_db_YYYYMMDD_HHMMSS.sql.gz`
- `gatonet_uploads_YYYYMMDD_HHMMSS.tar.gz`

### 7.2. Automação de Backup via Crontab (Diário às 03:00 da manhã)
Abra a edição do crontab do root:

```bash
sudo crontab -e
```

Adicione a linha:
```cron
0 3 * * * cd /var/www/gato-net && bash scripts/backup.sh >> /var/log/gatonet_backup.log 2>&1
```

O script mantém automaticamente uma retenção de **7 dias**, excluindo arquivos mais antigos para economizar o espaço de 50 GB NVMe da VPS.

### 7.3. Restauração de Desastre (Disaster Recovery)
Para restaurar o banco de dados e os uploads a partir de um backup:

```bash
bash scripts/restore.sh backups/gatonet_db_20261019_030000.sql.gz backups/gatonet_uploads_20261019_030000.tar.gz
```
O script solicitará confirmação digitando `SIM` para evitar sobrescritas acidentais.

---

## 8. Monitoramento, Logs e Diagnóstico

- **Ver status dos containers:**
  ```bash
  docker compose ps
  ```
- **Acompanhar logs da aplicação em tempo real:**
  ```bash
  docker compose logs -f app
  ```
- **Acompanhar logs do PostgreSQL 16:**
  ```bash
  docker compose logs -f postgres
  ```
- **Verificar uso de recursos (CPU e Memória):**
  ```bash
  docker stats
  ```
- **Verificar saúde da API:**
  ```bash
  curl -I http://127.0.0.1:3000/api/health
  ```
