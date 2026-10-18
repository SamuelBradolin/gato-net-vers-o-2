import React, { useState } from 'react';
import { Shield, Lock, Mail, User, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert, RotateCcw } from 'lucide-react';
import { GatoNetLogo } from '../components/GatoNetLogo';

interface AdminLoginProps {
  isSetupRequired: boolean;
  isBackendUnavailable?: boolean;
  onLoginSuccess: (admin: { id: string; name: string; email: string; role: string }, token?: string) => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  isSetupRequired,
  isBackendUnavailable = false,
  onLoginSuccess,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Recovery Mode States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'reset'>('request');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [generatedCodeNotice, setGeneratedCodeNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || 'Falha na autenticação');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Autenticação concedida com sucesso.');
      if (data.token) {
        sessionStorage.setItem('gatonet_admin_token', data.token);
      }
      setTimeout(() => {
        onLoginSuccess(data.admin, data.token);
      }, 600);
    } catch (err: any) {
      setErrorMessage('Erro de conexão com o servidor da Gato Net.');
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A senha precisa ter no mínimo 8 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error || 'Falha ao registrar administrador inicial');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Super Administrador configurado com sucesso via Argon2id!');
      if (data.token) {
        sessionStorage.setItem('gatonet_admin_token', data.token);
      }
      setTimeout(() => {
        onLoginSuccess(data.admin, data.token);
      }, 800);
    } catch (err: any) {
      setErrorMessage('Erro ao comunicar com o servidor.');
      setIsLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setGeneratedCodeNotice(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Erro ao processar solicitação.');
        setIsLoading(false);
        return;
      }

      if (data.recoveryCode) {
        setRecoveryToken(data.recoveryCode);
        setGeneratedCodeNotice(data.recoveryCode);
      }
      setSuccessMessage('Código criptográfico de recuperação gerado (válido por 15 minutos).');
      setRecoveryStep('reset');
      setIsLoading(false);
    } catch (err) {
      setErrorMessage('Erro ao solicitar código de recuperação.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('A nova senha precisa ter no mínimo 8 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/recovery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recoveryToken, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || data.error || 'Falha ao redefinir senha.');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Senha redefinida com sucesso com Argon2id! Você já pode efetuar login.');
      setIsLoading(false);
      setIsRecovering(false);
      setRecoveryStep('request');
      setGeneratedCodeNotice(null);
      setPassword('');
    } catch (err) {
      setErrorMessage('Erro ao comunicar com o servidor para redefinição.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background rays */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-[#0b1329] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para a TV</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400">
          Gato Net VPS Virtarix
        </span>
      </div>

      {/* Main Login / Setup / Recovery Container */}
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#0b1329] via-[#091024] to-[#060a17] border border-blue-500/30 p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <GatoNetLogo size="md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {isSetupRequired
                ? 'Instalação do Administrador Inicial'
                : isRecovering
                ? 'Recuperação Segura de Acesso'
                : 'Área Restrita Administrativa'}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-white">
            {isSetupRequired
              ? 'Configuração Segura de Acesso'
              : isRecovering
              ? 'Redefinir Credencial de Acesso'
              : 'Autenticação do Painel'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSetupRequired
              ? 'Defina o primeiro SuperAdmin para gerenciar canais e configurações. A senha será protegida com Argon2id.'
              : isRecovering
              ? 'Gere um token seguro de redefinição para restaurar seu acesso administrativo.'
              : 'Entre com suas credenciais de administrador para acessar os módulos de gerenciamento.'}
          </p>
        </div>

        {/* Feedback message boxes */}
        {isBackendUnavailable && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-300">Modo de Pré-visualização Frontend</div>
              <div className="text-[11px] text-amber-200/90 leading-relaxed">
                O backend Node.js não está conectado no momento. A navegação pública da Gato Net continua totalmente funcional. O login e modificações administrativas requerem o backend ativo.
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>{errorMessage}</div>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div className="text-[11px] font-mono text-red-300">
                  Tentativas restantes antes do bloqueio temporário: {remainingAttempts}
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SETUP FORM */}
        {isSetupRequired ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Completo do Super Administrador *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Administrador Gato Net"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-mail do Administrador *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@gatonet.tv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Senha de Acesso (Mínimo 8 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-slate-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Criptografia com algoritmo <strong>Argon2id</strong> (RFC 9106) e salt aleatório de 16 bytes. Não utilize senhas comuns.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
            >
              {isLoading ? 'Processando Hash Argon2id...' : 'Criar Super Administrador'}
            </button>
          </form>
        ) : isRecovering ? (
          /* 2. RECOVERY FLOW */
          <div className="space-y-4">
            {recoveryStep === 'request' ? (
              <form onSubmit={handleRequestRecovery} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mail do Administrador *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="admin@gatonet.tv"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Um token de recuperação seguro com validade de 15 minutos será gerado.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(false);
                      setErrorMessage('');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Gerando Token...' : 'Solicitar Código'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {generatedCodeNotice && (
                  <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                    <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Código de Recuperação Ativo:
                    </div>
                    <div className="font-mono text-[10px] bg-black/40 p-1.5 rounded break-all select-all text-blue-100">
                      {generatedCodeNotice}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Token de Recuperação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cole o código de 64 caracteres"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nova Senha (Mínimo 8 caracteres) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep('request');
                      setErrorMessage('');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* 3. LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-mail Administrativo *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@gatonet.tv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Senha *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecovering(true);
                    setRecoveryEmail(email);
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#060911] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#060911] border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Sessão segura com cookies <strong>HttpOnly</strong> e proteção automática contra ataques de força bruta.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
            >
              {isLoading ? 'Autenticando...' : 'Entrar no Painel Administrativo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
