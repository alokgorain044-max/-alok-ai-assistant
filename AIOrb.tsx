import React from 'react';
import { AssistantState, ThemeAccent } from '../types';
import { Mic, Volume2, Sparkles, Cpu, Radio } from 'lucide-react';

interface AIOrbProps {
  state: AssistantState;
  volumeLevel: number; // 0 - 100 from mic input
  accent: ThemeAccent;
  onOrbClick: () => void;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  state,
  volumeLevel,
  accent,
  onOrbClick,
}) => {
  // Theme color mappings
  const themeStyles = {
    'arc-blue': {
      glow: 'rgba(0, 240, 255, 0.45)',
      primary: '#00f0ff',
      secondary: '#0284c7',
      ringBorder: 'border-cyan-500/30',
      coreGrad: 'from-cyan-400 via-sky-500 to-blue-700',
    },
    'quantum-cyan': {
      glow: 'rgba(6, 182, 212, 0.5)',
      primary: '#06b6d4',
      secondary: '#0891b2',
      ringBorder: 'border-teal-500/30',
      coreGrad: 'from-teal-300 via-cyan-500 to-sky-700',
    },
    'crimson-protocol': {
      glow: 'rgba(239, 68, 68, 0.5)',
      primary: '#ef4444',
      secondary: '#b91c1c',
      ringBorder: 'border-red-500/30',
      coreGrad: 'from-amber-400 via-rose-500 to-red-700',
    },
    'emerald-core': {
      glow: 'rgba(16, 185, 129, 0.5)',
      primary: '#10b981',
      secondary: '#059669',
      ringBorder: 'border-emerald-500/30',
      coreGrad: 'from-emerald-300 via-teal-500 to-green-700',
    },
    'cyber-gold': {
      glow: 'rgba(245, 158, 11, 0.5)',
      primary: '#f59e0b',
      secondary: '#d97706',
      ringBorder: 'border-amber-500/30',
      coreGrad: 'from-amber-300 via-yellow-500 to-amber-700',
    },
  }[accent];

  // Dynamic scale from voice volume
  const dynamicScale = state === 'listening' ? 1 + (volumeLevel / 100) * 0.22 : 1;

  // Status text and badge
  const statusInfo = {
    idle: {
      label: 'SYSTEM STANDBY',
      subtext: 'Click orb or mic to activate voice input',
      icon: Radio,
      badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    },
    listening: {
      label: 'LISTENING FOR AUDIO',
      subtext: volumeLevel > 15 ? 'Receiving voice stream...' : 'Speak naturally in Hindi, English, or Hinglish',
      icon: Mic,
      badgeColor: 'text-sky-300 border-sky-400/60 bg-sky-950/60 animate-pulse',
    },
    thinking: {
      label: 'PROCESSING DIRECTIVE',
      subtext: 'Consulting Gemini intelligence core...',
      icon: Cpu,
      badgeColor: 'text-indigo-300 border-indigo-400/60 bg-indigo-950/60',
    },
    speaking: {
      label: 'AUDIO SYNTHESIS ACTIVE',
      subtext: 'Broadcasting response...',
      icon: Volume2,
      badgeColor: 'text-emerald-300 border-emerald-400/60 bg-emerald-950/60',
    },
    executing: {
      label: 'EXECUTING ACTION',
      subtext: 'Performing requested tool operation...',
      icon: Sparkles,
      badgeColor: 'text-amber-300 border-amber-400/60 bg-amber-950/60 animate-pulse',
    },
  }[state];

  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      {/* Central Interactive Orb Container */}
      <div
        onClick={onOrbClick}
        role="button"
        tabIndex={0}
        aria-label="Toggle ALOK AI ROBOT voice listening"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOrbClick()}
        className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 cursor-pointer group focus:outline-none"
      >
        {/* Outer Telemetry Ring with HUD Ticks */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed ${themeStyles.ringBorder} transition-transform duration-700 ${
            state === 'thinking' ? 'animate-spin-fast' : 'animate-spin-slow'
          }`}
          style={{
            boxShadow: `0 0 25px ${themeStyles.glow}`,
          }}
        >
          {/* HUD Degree Marks */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400/60 tabular-nums">
            000°
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400/60 tabular-nums">
            180°
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-400/60 tabular-nums">
            270°
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-400/60 tabular-nums">
            090°
          </div>
        </div>

        {/* Middle Counter-Rotating Gyro Ring */}
        <div
          className={`absolute inset-5 rounded-full border border-cyan-400/20 ${
            state === 'thinking' ? 'animate-spin-fast' : 'animate-spin-reverse-slow'
          }`}
        >
          {/* Orbital nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        </div>

        {/* Waveform Acoustic Ring (expands when listening / speaking) */}
        {state === 'listening' && (
          <div
            className="absolute inset-0 rounded-full border border-cyan-300/40 pointer-events-none transition-transform duration-75 ease-out"
            style={{
              transform: `scale(${1 + (volumeLevel / 100) * 0.35})`,
              opacity: 0.3 + (volumeLevel / 100) * 0.7,
              boxShadow: `0 0 ${15 + volumeLevel * 0.4}px ${themeStyles.glow}`,
            }}
          />
        )}

        {/* Core Glowing Arc Orb */}
        <div
          className={`relative z-10 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr ${themeStyles.coreGrad} shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105`}
          style={{
            transform: `scale(${dynamicScale})`,
            boxShadow: `0 0 ${state === 'idle' ? '35px' : '55px'} ${themeStyles.glow}`,
          }}
        >
          {/* Inner core metallic bevel */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/85 border border-cyan-300/30 flex items-center justify-center backdrop-blur-md relative overflow-hidden">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full animate-[scanline_2.5s_infinite]" />

            {/* Central Holographic Icon or Frequency visualizer */}
            {state === 'speaking' ? (
              <div className="flex items-center gap-1.5 h-8">
                {[0.4, 0.9, 0.6, 1, 0.7, 0.3, 0.8].map((mult, idx) => (
                  <span
                    key={idx}
                    className="w-1 bg-cyan-300 rounded-full animate-pulse"
                    style={{
                      height: `${12 + mult * 20}px`,
                      animationDelay: `${idx * 120}ms`,
                    }}
                  />
                ))}
              </div>
            ) : state === 'listening' ? (
              <div className="flex flex-col items-center text-cyan-300">
                <Mic className="w-8 h-8 animate-pulse text-cyan-300" />
                <span className="text-[10px] font-mono tracking-widest mt-1 text-cyan-400">REC</span>
              </div>
            ) : state === 'thinking' ? (
              <Cpu className="w-8 h-8 text-cyan-300 animate-spin" />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full border-2 border-cyan-400/80 bg-cyan-400/20 shadow-[0_0_12px_#00f0ff] animate-pulse" />
                <span className="text-[9px] font-mono tracking-widest text-cyan-400/80 mt-1">ALOK</span>
              </div>
            )}
          </div>
        </div>

        {/* Hover Hint */}
        <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/30 backdrop-blur-sm">
            {state === 'listening' ? 'Click to Stop' : 'Click to Speak'}
          </span>
        </div>
      </div>

      {/* Futuristic Status Badge & Subtext */}
      <div className="mt-4 flex flex-col items-center text-center">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-medium tracking-wider uppercase backdrop-blur-md ${statusInfo.badgeColor}`}
        >
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{statusInfo.label}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 font-sans max-w-xs transition-all">
          {statusInfo.subtext}
        </p>
      </div>
    </div>
  );
};
