import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Mask WhatsApp helper: (XX) 9XXXX-XXXX
  const handleWhatsappChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setWhatsapp(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (isRegisterMode) {
      if (!fullName) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (!whatsapp || whatsapp.length < 14) {
        setErrorMsg('Por favor, insira um WhatsApp válido com DDD.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas digitadas não coincidem.');
        return;
      }

      setSuccessMsg('Conta cadastrada com sucesso! Bem-vindo à Gato Net.');
      setTimeout(() => {
        onSuccessLogin(email);
        onClose();
      }, 1000);
    } else {
      setSuccessMsg('Login efetuado com sucesso!');
      setTimeout(() => {
        onSuccessLogin(email);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#0b1329] to-[#070b16] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-[0_0_20px_rgba(37,99,235,0.25)]">
            {isRegisterMode ? <User className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {isRegisterMode ? 'Criar Conta na Gato Net' : 'Acessar Conta Gato Net'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isRegisterMode
              ? 'Cadastre-se para acompanhar sua assinatura e sincronizar favoritos'
              : 'Entre com seus dados para continuar assistindo'}
          </p>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva de Souza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#091024] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Número do WhatsApp */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp com DDD *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="(11) 98765-4321"
                    value={whatsapp}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#091024] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">
                  Utilizado para liberação rápida de planos via Pix e suporte
                </span>
              </div>
            </>
          )}

          {/* E-mail */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#091024] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Senha *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#091024] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#091024] border border-blue-900/60 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Mandatory compliance notice: NO CPF REQUIRED */}
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/40 flex items-start gap-2 text-[11px] text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Privacidade Garantida:</span> Não é exigido CPF para cadastro na Gato Net. Seus dados são protegidos.
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg mt-2"
          >
            {isRegisterMode ? 'Concluir Cadastro Gratuito' : 'Entrar na Plataforma'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400">
          {isRegisterMode ? (
            <span>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
              >
                Fazer login
              </button>
            </span>
          ) : (
            <span>
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1"
              >
                Cadastre-se gratuitamente
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
