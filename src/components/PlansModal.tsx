import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Upload,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  paymentSettings: PaymentSettings;
  userEmail?: string | null;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose,
  plans,
  paymentSettings,
  userEmail
}) => {
  const activePlans = plans.filter((p) => p.isActive);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'paypal'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);

  // Client checkout state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState(userEmail || '');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Active created order
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  // Receipt submission state
  const [receiptCode, setReceiptCode] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [receiptSuccessMessage, setReceiptSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userEmail && !clientEmail) {
      setClientEmail(userEmail);
    }
  }, [userEmail, clientEmail]);

  if (!isOpen) return null;

  const currentPlan =
    activePlans.find((p) => p.id === selectedPlanId) ||
    activePlans.find((p) => p.isPopular) ||
    activePlans[0] ||
    plans[0];

  const handleCopyPix = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan) return;
    if (!clientEmail.trim()) {
      setOrderError('Informe seu e-mail para vincular o pedido e a assinatura.');
      return;
    }

    setIsCreatingOrder(true);
    setOrderError(null);

    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: currentPlan.id,
          paymentMethod,
          subscriberName: clientName.trim() || undefined,
          subscriberEmail: clientEmail.trim().toLowerCase(),
          subscriberWhatsapp: clientWhatsapp.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao gerar o pedido.');
      }

      const data = await res.json();
      setCreatedOrder(data.order);
      setReceiptSuccessMessage(null);
    } catch (err: any) {
      setOrderError(err.message || 'Erro de conexão ao gerar pedido.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 5MB.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;
    if (!receiptBase64 && !receiptCode.trim() && !receiptNotes.trim()) {
      alert('Por favor, anexe uma imagem do comprovante, informe o código da transação bancária ou observações.');
      return;
    }

    setIsSubmittingReceipt(true);
    try {
      const res = await fetch(`/api/public/orders/${createdOrder.id}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptUrl: receiptBase64 || undefined,
          receiptCode: receiptCode.trim() || undefined,
          notes: receiptNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao enviar comprovante.');
      }

      const data = await res.json();
      setCreatedOrder(data.order);
      setReceiptSuccessMessage(
        'Comprovante registrado com sucesso! O pedido está pendente de conferência manual pelo administrador. Sua assinatura será ativada assim que o pagamento for validado no extrato.'
      );
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar comprovante.');
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const handleOpenWhatsAppConfirmation = () => {
    if (!currentPlan) return;
    const orderRef = createdOrder ? createdOrder.order_code : 'Novo Pedido';
    const text = encodeURIComponent(
      `Olá! Acabei de realizar o pagamento do ${currentPlan.name} (R$ ${currentPlan.price.toFixed(2)}) da Gato Net via ${
        paymentMethod === 'pix' ? 'Pix' : 'PayPal'
      }.\n\nCódigo do Pedido: ${orderRef}\nE-mail da Conta: ${clientEmail || userEmail || ''}\n\nSegue meu comprovante para conferência do administrador.`
    );
    window.open(`https://wa.me/5511987654321?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-2xl bg-gradient-to-b from-[#0b1329] via-[#080e20] to-[#050914] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
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

        {/* Dynamic Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activePlans.map((plan) => {
            const isSelected = currentPlan?.id === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  if (createdOrder && createdOrder.plan_id !== plan.id) {
                    setCreatedOrder(null);
                    setReceiptSuccessMessage(null);
                  }
                }}
                className={`relative rounded-xl p-5 border flex flex-col justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-gradient-to-b from-blue-950/40 to-[#0b1329] ring-2 ring-blue-500/50 shadow-[0_0_25px_rgba(37,99,235,0.25)] -translate-y-1'
                    : 'border-slate-800 bg-[#091024]/70 hover:border-slate-700 hover:bg-[#0c142e]'
                }`}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider shadow">
                    {plan.badge || 'Mais Popular'}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-white">{plan.name}</h3>
                    {!plan.isPopular && plan.badge && (
                      <span className="text-[10px] text-slate-400 font-mono">{plan.badge}</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {plan.periodLabel || `por ${plan.durationDays || 30} dias`}
                    </span>
                  </div>

                  {/* Screens badge */}
                  <div className="mb-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
                      {plan.maxScreens || 1} tela{(plan.maxScreens || 1) > 1 ? 's' : ''} simultânea{(plan.maxScreens || 1) > 1 ? 's' : ''}
                    </span>
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
        {currentPlan && (
          <div className="rounded-xl border border-blue-900/50 bg-[#091024]/80 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400 font-medium">Plano Escolhido:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">{currentPlan.name}</span>
                  <span className="font-mono text-sm font-bold text-blue-400">
                    R$ {currentPlan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({currentPlan.durationDays || 30} dias de acesso · {currentPlan.maxScreens || 1} tela{currentPlan.maxScreens > 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div className="flex items-center gap-2 p-1 bg-[#060911] rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('pix');
                    if (createdOrder && createdOrder.payment_method !== 'pix') {
                      setCreatedOrder(null);
                    }
                  }}
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
                  type="button"
                  onClick={() => {
                    setPaymentMethod('paypal');
                    if (createdOrder && createdOrder.payment_method !== 'paypal') {
                      setCreatedOrder(null);
                    }
                  }}
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

            {/* Step 1: Subscriber Details to create order if not yet created */}
            {!createdOrder ? (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Identificação do Assinante para Criação do Pedido Único:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      E-mail da Conta *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      WhatsApp (com DDD)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 11987654321"
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {orderError && (
                  <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400">
                    O pedido será gerado com código único no banco e permanecerá pendente até conferência manual do administrador.
                  </span>
                  <button
                    type="submit"
                    disabled={isCreatingOrder}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/30"
                  >
                    {isCreatingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gerando Pedido...</span>
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'pix' ? <QrCode className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        <span>Gerar Pedido e Dados de Pagamento ({paymentMethod === 'pix' ? 'Pix' : 'PayPal'})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Active Created Order Details & Receipt Submission */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Order Status Badge & Identifier */}
                <div className="p-4 rounded-xl bg-[#060911] border border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          Pedido: {createdOrder.order_code}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40">
                          Status: {createdOrder.status === 'pending' ? 'Pendente de Conferência' : createdOrder.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {currentPlan.name} · R$ {Number(createdOrder.amount).toFixed(2).replace('.', ',')} · Cliente: {createdOrder.subscriber_email}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatedOrder(null);
                      setReceiptSuccessMessage(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Alterar dados / Gerar outro pedido</span>
                  </button>
                </div>

                {/* Pix Content */}
                {createdOrder.payment_method === 'pix' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Dynamic QR Code */}
                    <div className="md:col-span-4 flex flex-col items-center text-center p-4 rounded-xl bg-white text-slate-900 shadow">
                      <div className="w-44 h-44 bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            createdOrder.pix_copy_paste || ''
                          )}`}
                          alt="QR Code Pix"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // SVG Fallback
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="hidden qr-fallback w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs">
                          <QrCode className="w-16 h-16 text-slate-800" />
                          <span className="text-[10px] text-slate-600 mt-1">Utilize o Pix Copia e Cola ao lado</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 mt-2">
                        QR Code Oficial Pix
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Valor: R$ {Number(createdOrder.amount).toFixed(2).replace('.', ',')}
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
                          Código Pix Copia e Cola Oficial:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={createdOrder.pix_copy_paste || ''}
                            className="w-full px-3 py-2 text-[11px] font-mono rounded-lg bg-[#060911] border border-blue-900/50 text-slate-300 truncate focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleCopyPix(createdOrder.pix_copy_paste || '')}
                            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                          >
                            {copiedPix ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal Content */}
                {createdOrder.payment_method === 'paypal' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#060911] border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Link Oficial do Recebedor:</span>
                        <span className="text-blue-400 font-mono break-all">{paymentSettings.paypal.paymentLink}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Valor Contratado:</span>
                        <span className="text-white font-bold font-mono">
                          R$ {Number(createdOrder.amount).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <a
                        href={paymentSettings.paypal.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex-1 py-2.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs text-center flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir Link de Pagamento PayPal</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Proof / Receipt Submission Form */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span>Envio de Comprovante pelo Cliente</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Envie o comprovante bancário ou código de transação para o administrador conferir e aprovar.
                      </p>
                    </div>

                    {createdOrder.receipt_url || createdOrder.receipt_code ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Comprovante Anexado
                      </span>
                    ) : null}
                  </div>

                  {receiptSuccessMessage ? (
                    <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Comprovante Enviado com Sucesso!</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        {receiptSuccessMessage}
                      </p>
                    </div>
                  ) : null}

                  <form onSubmit={handleSubmitReceipt} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* File Upload for receipt image */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Anexar Comprovante (Imagem / Print / PDF)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 px-3 py-2 rounded-lg bg-[#060911] border border-dashed border-slate-700 hover:border-blue-500 text-xs text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            <span className="truncate">
                              {receiptFileName || 'Escolher arquivo do dispositivo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Transaction code / NSU */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Código de Autenticação / NSU / ID da Transação (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: E0003816620241018..."
                          value={receiptCode}
                          onChange={(e) => setReceiptCode(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Observações para o Administrador (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pago pelo app do Nubank em nome de Carlos..."
                        value={receiptNotes}
                        onChange={(e) => setReceiptNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-[#060911] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleOpenWhatsAppConfirmation}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700/60 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Avisar no WhatsApp com Pedido #{createdOrder.order_code}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingReceipt}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/30"
                      >
                        {isSubmittingReceipt ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Enviando Comprovante...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Confirmar Envio do Comprovante</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
