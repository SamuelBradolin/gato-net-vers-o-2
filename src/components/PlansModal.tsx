import React, { useState } from 'react';
import { SubscriptionPlan, PaymentSettings } from '../types';
import {
  X,
  Check,
  QrCode,
  Copy,
  CheckCheck,
  Send,
  Sparkles,
  CreditCard,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  paymentSettings: PaymentSettings;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose,
  plans,
  paymentSettings
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(plans[1] || plans[0]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'paypal'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isOpen) return null;

  // Pix string simulation
  const pixCopyPasteCode = `00020126580014br.gov.bcb.pix0136${paymentSettings.pix.key}520400005303986540${selectedPlan.price.toFixed(2)}5802BR5925${paymentSettings.pix.recipientName.slice(0, 25)}6009${paymentSettings.pix.city.slice(0, 9)}62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCopyPasteCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleOpenWhatsAppConfirmation = () => {
    const text = encodeURIComponent(
      `Olá! Acabei de realizar o pagamento do ${selectedPlan.name} (R$ ${selectedPlan.price.toFixed(2)}) da Gato Net via ${paymentMethod === 'pix' ? 'Pix' : 'PayPal'}. Segue meu comprovante para ativação da conta.`
    );
    window.open(`https://wa.me/5511987654321?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-2xl bg-gradient-to-b from-[#0b1329] via-[#080e20] to-[#050914] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-500/20">
            Assinatura VIP Gato Net
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Escolha seu Plano de Acesso Completo
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            Libere transmissões ao vivo em 4K e Full HD, esportes exclusivos, filmes e séries sem travamentos em todos os seus aparelhos.
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative rounded-xl p-5 border flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-b from-blue-950/40 to-[#0b1329] ring-2 ring-blue-500/50 shadow-[0_0_25px_rgba(37,99,235,0.25)] -translate-y-1'
                    : 'border-slate-800 bg-[#091024]/70 hover:border-slate-700 hover:bg-[#0c142e]'
                }`}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider shadow">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-white">{plan.name}</h3>
                    {!plan.isPopular && (
                      <span className="text-[10px] text-slate-400 font-mono">{plan.badge}</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">{plan.periodLabel}</span>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 text-xs text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-6 w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isSelected ? 'Plano Selecionado' : 'Selecionar'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Checkout Box: Manual Pix & PayPal */}
        <div className="rounded-xl border border-blue-900/50 bg-[#091024]/80 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-medium">Plano Escolhido:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">{selectedPlan.name}</span>
                <span className="font-mono text-sm font-bold text-blue-400">
                  R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="flex items-center gap-2 p-1 bg-[#060911] rounded-lg border border-slate-800">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  paymentMethod === 'pix'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Pix (Brasil)</span>
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  paymentMethod === 'paypal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>PayPal (Mundial)</span>
              </button>
            </div>
          </div>

          {/* Pix Payment Content */}
          {paymentMethod === 'pix' && (
            <div className="pt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR Code Simulation */}
              <div className="md:col-span-4 flex flex-col items-center text-center p-4 rounded-xl bg-white text-slate-900 shadow">
                <div className="w-40 h-40 bg-slate-100 border border-slate-300 rounded-lg p-2 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <rect x="10" y="10" width="25" height="25" fill="#0b1329" />
                    <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                    <rect x="18" y="18" width="9" height="9" fill="#0b1329" />
                    <rect x="65" y="10" width="25" height="25" fill="#0b1329" />
                    <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                    <rect x="73" y="18" width="9" height="9" fill="#0b1329" />
                    <rect x="10" y="65" width="25" height="25" fill="#0b1329" />
                    <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                    <rect x="18" y="73" width="9" height="9" fill="#0b1329" />
                    <rect x="42" y="12" width="15" height="8" fill="#0b1329" />
                    <rect x="42" y="25" width="8" height="12" fill="#0b1329" />
                    <rect x="42" y="42" width="16" height="16" fill="#2563eb" />
                    <rect x="65" y="42" width="20" height="8" fill="#0b1329" />
                    <rect x="12" y="42" width="22" height="10" fill="#0b1329" />
                    <rect x="42" y="65" width="14" height="20" fill="#0b1329" />
                    <rect x="62" y="65" width="26" height="24" fill="#0b1329" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2">
                  QR Code Pix Dinâmico
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Valor: R$ {selectedPlan.price.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Pix Details & Copia e Cola */}
              <div className="md:col-span-8 space-y-3">
                <div className="p-3 rounded-lg bg-[#060911] border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chave Pix ({paymentSettings.pix.keyType}):</span>
                    <span className="text-white font-semibold">{paymentSettings.pix.key}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Beneficiário:</span>
                    <span className="text-slate-200">{paymentSettings.pix.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cidade:</span>
                    <span className="text-slate-200">{paymentSettings.pix.city}</span>
                  </div>
                </div>

                {/* Copia e Cola */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Código Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCopyPasteCode}
                      className="w-full px-3 py-2 text-[11px] font-mono rounded-lg bg-[#060911] border border-blue-900/50 text-slate-300 truncate focus:outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedPix ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Send Receipt WhatsApp */}
                <div className="pt-2">
                  <button
                    onClick={handleOpenWhatsAppConfirmation}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Comprovante no WhatsApp para Ativação</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    O administrador confere o pagamento no extrato e libera sua conta em até 5 minutos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PayPal Payment Content */}
          {paymentMethod === 'paypal' && (
            <div className="pt-5 space-y-4">
              <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Plataforma Internacional:</span>
                  <span className="text-white font-bold">PayPal Pagamentos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">E-mail Comercial:</span>
                  <span className="text-blue-400 font-mono">{paymentSettings.paypal.businessEmail}</span>
                </div>
                <p className="text-slate-300 text-[11px] pt-1">
                  Ideal para assinantes que residem no exterior ou utilizam cartões de crédito internacionais.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={paymentSettings.paypal.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Acessar Link de Pagamento PayPal</span>
                </a>
                <button
                  onClick={handleOpenWhatsAppConfirmation}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Notificar Pagamento no WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
