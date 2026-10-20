import React from 'react';

interface GatoNetLogoProps {
  customLogoUrl?: string;
  siteName?: string;
  tagline?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GatoNetLogo: React.FC<GatoNetLogoProps> = ({
  customLogoUrl,
  siteName = 'Gato Net',
  tagline = 'Televisão Ao Vivo',
  size = 'md',
  className = ''
}) => {
  if (customLogoUrl) {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <img
          src={customLogoUrl}
          alt={siteName}
          className={`object-contain max-w-[180px] ${
            size === 'sm' ? 'h-7' : size === 'lg' ? 'h-12' : 'h-9'
          }`}
          onError={(e) => {
            // If custom logo fails to load, gracefully fallback to default SVG
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        {/* If user provided a compact logo icon, optionally show the name next to it */}
        <span className="hidden sm:inline font-bold text-white text-sm tracking-tight truncate max-w-[140px]">
          {siteName}
        </span>
      </div>
    );
  }

  // Dimensions based on size
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textClass = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Feline + Streaming Emblem */}
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0e172f] via-[#0b1329] to-[#060911] border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.25)]`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for neon gradient */}
          <defs>
            <linearGradient id="logoCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="signalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Cat ears & head silhouette */}
          <path
            d="M20 74 L20 38 L36 50 L64 50 L80 38 L80 74 Z"
            fill="url(#logoCatGrad)"
          />
          {/* Inner ears */}
          <polygon points="23,43 33,51 24,56" fill="#93c5fd" opacity="0.8" />
          <polygon points="77,43 67,51 76,56" fill="#93c5fd" opacity="0.8" />

          {/* Eyes - glowing electric cyan */}
          <ellipse cx="38" cy="61" rx="4" ry="4.5" fill="#ffffff" />
          <ellipse cx="62" cy="61" rx="4" ry="4.5" fill="#ffffff" />
          <ellipse cx="38" cy="61" rx="2" ry="3" fill="#0b1329" />
          <ellipse cx="62" cy="61" rx="2" ry="3" fill="#0b1329" />

          {/* Nose */}
          <polygon points="46,68 54,68 50,72" fill="#60a5fa" />

          {/* Broadcast / Streaming wave arcs radiating */}
          <path
            d="M75 26 A 14 14 0 0 1 84 42"
            stroke="url(#signalGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M82 19 A 22 22 0 0 1 93 43"
            stroke="url(#signalGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          {siteName.toLowerCase().includes('gato net') ? (
            <span className={`font-extrabold tracking-tight text-white uppercase ${textClass}`}>
              GATO<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">NET</span>
            </span>
          ) : (
            <span className={`font-extrabold tracking-tight text-white uppercase ${textClass} truncate max-w-[200px]`}>
              {siteName}
            </span>
          )}
          <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-blue-300">
            TV
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium tracking-wide truncate max-w-[220px]">
          {tagline}
        </span>
      </div>
    </div>
  );
};
