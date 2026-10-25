import React from 'react';
import { AdSlot } from '../types';
import { Megaphone, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  slot: AdSlot;
  onPlanClick?: () => void;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot, className = '' }) => {
  // If slot is deactivated by admin, do not load or render anything
  if (!slot || !slot.isEnabled) return null;

  const hasImage =
    (slot.adType === 'image_upload' || slot.adType === 'image_url' || (!slot.adType && !!slot.imageUrl)) &&
    !!slot.imageUrl &&
    slot.imageUrl.trim() !== '' &&
    slot.imageUrl !== '#';

  const hasScript =
    slot.adType === 'code_script' &&
    !!slot.codeSnippet &&
    slot.codeSnippet.trim() !== '' &&
    !slot.codeSnippet.trim().startsWith('<!-- Espaço reservado');

  const hasValidAd = hasImage || hasScript;

  // If slot is active but has no ad configured:
  // only render placeholder if configured by the administrator (showPlaceholderWhenEmpty)
  if (!hasValidAd) {
    if (!slot.showPlaceholderWhenEmpty) {
      return null;
    }

    // Render reserved placeholder
    if (slot.slotType === 'player_side') {
      return (
        <div
          className={`w-full h-full min-h-[250px] max-h-[360px] rounded-xl border border-blue-900/40 bg-gradient-to-b from-[#0b1329] via-[#091024] to-[#060a17] p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg ${className}`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="uppercase tracking-wider">Espaço Reservado</span>
            <span className="text-[11px] text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-500/20">
              {slot.dimensions}
            </span>
          </div>

          <div className="my-auto py-4 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
              <Megaphone className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white leading-snug">
              {slot.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {slot.subtitle || 'Área disponível para veiculação de campanhas institucionais e anunciantes parceiros da plataforma.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="w-full py-2 px-3 rounded-lg bg-[#060911] border border-slate-800 text-center text-xs text-slate-400 font-medium">
              Formato Padrão 300x250
            </div>
          </div>
        </div>
      );
    }

    if (slot.slotType === 'header') {
      return (
        <div className={`w-full max-w-4xl mx-auto py-2 px-4 ${className}`}>
          <div className="h-[70px] sm:h-[80px] rounded-lg border border-dashed border-blue-900/50 bg-[#091024]/60 flex items-center justify-between px-6 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/20">
                Publicidade
              </span>
              <span className="text-slate-200 font-medium">{slot.title}</span>
              <span className="hidden md:inline text-slate-400 text-xs">· {slot.subtitle}</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {slot.dimensions || '728x90 px'}
            </span>
          </div>
        </div>
      );
    }

    if (slot.slotType === 'player_bottom') {
      return (
        <div className={`w-full my-4 ${className}`}>
          <div className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-[#0b1329] via-[#0e1a38] to-[#0b1329] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/20">
                    Espaço Publicitário
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {slot.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {slot.subtitle || 'Área disponível para exibição de anúncios de patrocinadores e campanhas parceiras da Gato Net.'}
                </p>
              </div>
            </div>
            <div className="shrink-0 px-3 py-1.5 rounded-lg bg-[#060911] border border-slate-800 text-xs text-slate-400 font-mono">
              {slot.dimensions}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full my-4 text-center ${className}`}>
        <div className="p-3.5 rounded-xl border border-dashed border-blue-950 bg-[#091024]/40 text-xs text-slate-400 flex items-center justify-center gap-3">
          <span className="font-mono text-[11px] text-blue-400 uppercase">Espaço Publicitário</span>
          <span className="text-slate-300">{slot.title}</span>
          <span className="text-slate-400 font-mono">({slot.dimensions})</span>
        </div>
      </div>
    );
  }

  // Helper for sizing based on slot type
  const getSlotContainerClasses = () => {
    switch (slot.slotType) {
      case 'header':
        return 'w-full max-w-4xl mx-auto my-2 px-2';
      case 'player_side':
        return 'w-full h-full min-h-[250px] flex items-center justify-center';
      case 'player_bottom':
        return 'w-full max-w-5xl mx-auto my-3 px-2';
      case 'inter_categories':
        return 'w-full my-4 px-2';
      case 'footer':
      default:
        return 'w-full max-w-4xl mx-auto my-4 px-2';
    }
  };

  const getIframeDimensions = () => {
    if (slot.slotType === 'player_side') {
      return { width: '300px', height: '250px' };
    }
    if (slot.slotType === 'header' || slot.slotType === 'player_bottom' || slot.slotType === 'footer') {
      return { width: '100%', maxWidth: '728px', height: '90px' };
    }
    return { width: '100%', height: '120px' };
  };

  // Case 1: Image Ad (Uploaded or HTTPS URL)
  if (hasImage) {
    const targetUrl = slot.targetUrl && slot.targetUrl !== '#' ? slot.targetUrl : '';
    const openInNewTab = slot.openInNewTab !== false;

    const ImageElement = (
      <div className="relative group overflow-hidden rounded-xl border border-blue-900/40 bg-[#080d1a] shadow-lg flex flex-col items-center justify-center">
        {/* Subtle Sponsor Label */}
        <div className="absolute top-1.5 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-slate-300 uppercase tracking-wider border border-white/10 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <span>Publicidade</span>
          {slot.advertiserName && (
            <span className="text-blue-300 font-bold truncate max-w-[120px]">· {slot.advertiserName}</span>
          )}
        </div>

        {targetUrl && (
          <div className="absolute top-1.5 right-2 z-10 px-1.5 py-0.5 rounded bg-blue-600/80 backdrop-blur-sm text-[9px] font-mono text-white flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Visitar</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </div>
        )}

        <img
          src={slot.imageUrl}
          alt={slot.altText || slot.title || 'Anúncio Publicitário'}
          loading="lazy"
          className="w-full h-auto max-h-[140px] sm:max-h-[180px] md:max-h-[250px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </div>
    );

    return (
      <div className={`${getSlotContainerClasses()} ${className}`}>
        {targetUrl ? (
          <a
            href={targetUrl}
            target={openInNewTab ? '_blank' : '_self'}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className="block w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl"
            title={slot.altText || slot.advertiserName || slot.title}
          >
            {ImageElement}
          </a>
        ) : (
          ImageElement
        )}
      </div>
    );
  }

  // Case 2: Ad Script / Network Integration (Adsterra, Google AdSense, etc.)
  // Strictly isolated in a sandboxed iframe without dangerouslySetInnerHTML on the main React DOM
  if (hasScript) {
    const iframeDims = getIframeDimensions();
    const safeSrcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    ${slot.codeSnippet}
  </body>
</html>`;

    return (
      <div className={`${getSlotContainerClasses()} ${className}`}>
        <div className="relative overflow-hidden rounded-xl border border-blue-900/40 bg-[#080d1a] shadow-lg flex flex-col items-center justify-center p-1">
          <div className="w-full flex items-center justify-between px-2 py-0.5 text-[9px] font-mono text-slate-500 uppercase">
            <span>Anúncio Parceiro</span>
            {slot.advertiserName && <span>{slot.advertiserName}</span>}
          </div>
          <iframe
            title={`ad-${slot.id}`}
            srcDoc={safeSrcDoc}
            sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
            style={{
              width: iframeDims.width,
              maxWidth: (iframeDims as any).maxWidth || '100%',
              height: iframeDims.height,
              border: 'none',
              overflow: 'hidden'
            }}
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return null;
};
