import React from 'react';
import { Keyboard, Command, Mic, Square, Search, Volume2, Layers, Sliders, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMac =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.platform) &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      title: 'Voice & Speech Controls',
      shortcuts: [
        {
          keys: [modKey, 'Space'],
          label: 'Toggle Voice Listening',
          desc: 'Instantly arm or disarm microphone for hands-free speech input',
          icon: Mic,
          highlight: true,
        },
        {
          keys: ['Esc'],
          label: 'Interrupt / Stop Speaking',
          desc: 'Immediately halts vocal synthesis and dismisses active overlays',
          icon: Square,
          highlight: true,
        },
        {
          keys: [modKey, 'M'],
          label: 'Toggle Audio SFX',
          desc: 'Quickly mute or unmute synthesized futuristic sound effects',
          icon: Volume2,
        },
      ],
    },
    {
      title: 'Navigation & Focus',
      shortcuts: [
        {
          keys: [modKey, 'K'],
          label: 'Focus Command Input',
          desc: 'Puts cursor directly in the text input box for typing',
          icon: Search,
        },
        {
          keys: [modKey, '1'],
          label: 'Core Assistant View',
          desc: 'Switch to central AI Orb and chat feed',
          icon: Layers,
        },
        {
          keys: [modKey, '2'],
          label: 'Tools & Files View',
          desc: 'Switch to Document Analyzer, Timers, Notes & Web Launcher',
          icon: Layers,
        },
        {
          keys: [modKey, '3'],
          label: 'Desktop Robot Mode',
          desc: 'Switch to companion agent manager & safe application launcher',
          icon: Layers,
        },
        {
          keys: [modKey, '4'],
          label: 'Memory & Context Bank',
          desc: 'Switch to user facts and saved personal preferences',
          icon: Layers,
        },
      ],
    },
    {
      title: 'System & Overlays',
      shortcuts: [
        {
          keys: [modKey, ','],
          label: 'System Settings',
          desc: 'Open configuration for voice speed, pitch, language, and themes',
          icon: Sliders,
        },
        {
          keys: [modKey, '/'],
          label: 'Toggle Shortcuts HUD',
          desc: 'Open or close this keyboard reference overlay',
          icon: Keyboard,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_60px_rgba(0,240,255,0.25)] flex flex-col max-h-[88vh] overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Hands-Free Keyboard Shortcuts</span>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Command ALOK AI ROBOT rapidly using global hotkeys without lifting your hands.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Close [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <h4 className="font-mono text-cyan-400 uppercase tracking-wider text-[11px] font-semibold">
                {group.title}
              </h4>

              <div className="space-y-2">
                {group.shortcuts.map((sc, sIdx) => {
                  const Icon = sc.icon;
                  return (
                    <div
                      key={sIdx}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        sc.highlight
                          ? 'bg-slate-900/90 border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg border ${
                            sc.highlight
                              ? 'bg-cyan-950 border-cyan-500/40 text-cyan-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-slate-100 font-semibold">{sc.label}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{sc.desc}</div>
                        </div>
                      </div>

                      {/* Key Badges */}
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                        {sc.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2.5 py-1 bg-black/80 text-cyan-300 border border-slate-700 rounded-md shadow-inner font-semibold">
                              {k}
                            </kbd>
                            {kIdx < sc.keys.length - 1 && (
                              <span className="text-slate-500 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Shortcuts can be toggled on/off in System Settings</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded-lg transition-colors text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
