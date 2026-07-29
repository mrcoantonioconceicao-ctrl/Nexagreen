import React from "react";

interface NexavorLogoProps {
  variant?: "full" | "icon" | "badge";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
}

export default function NexavorLogo({
  variant = "full",
  size = "md",
  className = "",
  showTagline = false,
}: NexavorLogoProps) {
  // Size dimensions mapping
  const dimensions = {
    sm: { icon: 20, text: "text-xs", badge: "text-[9px] px-2 py-0.5" },
    md: { icon: 28, text: "text-base", badge: "text-[10px] px-2.5 py-1" },
    lg: { icon: 38, text: "text-xl", badge: "text-xs px-3 py-1.5" },
    xl: { icon: 56, text: "text-3xl", badge: "text-sm px-4 py-2" },
  }[size];

  // SVG Icon Mark representing NEXAVOR's angular 3D 'N' emblem
  const NexavorIconMark = ({ sz }: { sz: number }) => (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_12px_rgba(0,229,255,0.4)] shrink-0 transition-transform hover:scale-105"
    >
      <defs>
        {/* Left Wing Gradient */}
        <linearGradient id="nexavorLeftGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A2BE2" />
          <stop offset="50%" stopColor="#00A3FF" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>

        {/* Right Wing Gradient */}
        <linearGradient id="nexavorRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="60%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#5B00FF" />
        </linearGradient>

        {/* Center Glow Overlay */}
        <linearGradient id="nexavorCoreGlow" x1="30%" y1="30%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Futuristic Geometric 'N' Structure */}
      {/* Left Vertical Pillar */}
      <polygon points="30,175 30,25 70,25 70,120" fill="url(#nexavorLeftGrad)" />
      
      {/* Diagonal Connecting Beam */}
      <polygon points="30,25 170,175 130,175 30,70" fill="url(#nexavorRightGrad)" />

      {/* Right Vertical Pillar with Upward Arrow Flare */}
      <polygon points="130,25 170,25 170,175 130,100" fill="url(#nexavorLeftGrad)" />

      {/* Shading Highlights */}
      <polygon points="30,25 70,25 130,115 110,115" fill="url(#nexavorCoreGlow)" />
      <polygon points="130,25 170,25 150,60" fill="rgba(255, 255, 255, 0.4)" />
    </svg>
  );

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-cyan-500/30 text-slate-100 shadow-lg shadow-cyan-500/10 ${dimensions.badge} ${className}`}
      >
        <NexavorIconMark sz={dimensions.icon} />
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] uppercase tracking-widest text-cyan-400 font-extrabold">Criado por</span>
          <span className="font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            NEXAVOR
          </span>
        </div>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <NexavorIconMark sz={dimensions.icon} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 ${className}`}>
      <NexavorIconMark sz={dimensions.icon} />
      <div className="flex flex-col">
        <span
          className={`font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 ${dimensions.text} font-sans uppercase drop-shadow-sm`}
        >
          NEXAVOR
        </span>
        {showTagline && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 -mt-0.5">
            Technology & Innovation
          </span>
        )}
      </div>
    </div>
  );
}
