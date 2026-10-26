import React from 'react';
import { UserPreferences, ThemeAccent, LanguageCode } from '../types';
import {
  Sliders,
  Volume2,
  Mic,
  Palette,
  Shield,
  Monitor,
  Check,
  RotateCcw,
  Sparkles,
  Save,
} from 'lucide-react';
import { sfx } from '../utils/soundEffects';
import { speechEngine } from '../utils/speechEngine';

interface SettingsModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onClose: () => void;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  onResetPreferences: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  preferences,
  onClose,
  onUpdatePreferences,
  onResetPreferences,
}) => {
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      speechEngine.getVoices().then((v) => setVoices(v));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testVoice = () => {
    speechEngine.speak('Audio subsystem check. ALOK AI ROBOT voice output is functioning within optimal parameters.', {
      lang: preferences.language,
      rate: preferences.speechRate,
      pitch: preferences.speechPitch,
      voiceURI: preferences.speechVoiceURI,
    });
  };

  const testSFX = () => {
    sfx.playActivation();
  };

  const themeOptions: Array<{ id: ThemeAccent; label: string; previewColor: string }> = [
    { id: 'arc-blue', label: 'Arc Electric Blue', previewColor: '#00f0ff' },
    { id: 'quantum-cyan', label: 'Quantum Cyan', previewColor: '#06b6d4' },
    { id: 'crimson-protocol', label: 'Crimson Protocol', previewColor: '#ef4444' },
    { id: 'emerald-core', label: 'Emerald Core', previewColor: '#10b981' },
    { id: 'cyber-gold', label: 'Cyber Gold', previewColor: '#f59e0b' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                System Configuration & Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Voice activation, speech synthesis, theme accents, and security permissions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded transition-colors"
          >
            Close [ESC]
          </button>
        </div>

        {/* Scrollable Settings Form */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs">
          {/* Section 1: Voice & Speech Engine */}
          <div className="space-y-3">
            <h4 className="font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Voice & Speech Parameters</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              {/* Primary Language */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Speech Recognition & Primary Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => onUpdatePreferences({ language: e.target.value as LanguageCode })}
                  className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="hinglish">Hinglish (Auto English + Hindi)</option>
                  <option value="hi-IN">हिन्दी (Hindi - hi-IN)</option>
                  <option value="en-US">English (United States - en-US)</option>
                  <option value="en-IN">English (India - en-IN)</option>
                </select>
              </div>

              {/* Speech Voice Selection */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Synthesis Voice
                </label>
                <select
                  value={preferences.speechVoiceURI}
                  onChange={(e) => onUpdatePreferences({ speechVoiceURI: e.target.value })}
                  className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400 truncate"
                >
                  <option value="">Default System Natural Voice</option>
                  {voices.map((v, i) => (
                    <option key={i} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speaking Speed */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Speaking Speed</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {preferences.speechRate}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={preferences.speechRate}
                  onChange={(e) => onUpdatePreferences({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Pitch */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Pitch Modulation</span>
                  <span className="font-mono text-cyan-400 tabular-nums">
                    {preferences.speechPitch}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={preferences.speechPitch}
                  onChange={(e) => onUpdatePreferences({ speechPitch: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Test Voice Button */}
              <div className="col-span-full pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={testVoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-medium transition-colors border border-slate-700"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Voice Synthesis</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.continuousListening}
                    onChange={(e) => onUpdatePreferences({ continuousListening: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-300">Continuous Listening Mode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Audio Sound Effects */}
          <div className="space-y-3">
            <h4 className="font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>Synthesized Sci-Fi SFX</span>
            </h4>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.soundEffects}
                    onChange={(e) => {
                      onUpdatePreferences({ soundEffects: e.target.checked });
                      sfx.setConfig(e.target.checked, preferences.sfxVolume);
                    }}
                    className="accent-cyan-400 rounded"
                  />
                  <span className="text-slate-200 font-medium">Enable Cyber Audio SFX</span>
                </label>
              </div>

              {preferences.soundEffects && (
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">SFX Volume:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={preferences.sfxVolume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      onUpdatePreferences({ sfxVolume: vol });
                      sfx.setConfig(preferences.soundEffects, vol);
                    }}
                    className="w-24 accent-cyan-400 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={testSFX}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[11px]"
                  >
                    Play Chime
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Visual Theme Accent */}
          <div className="space-y-3">
            <h4 className="font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>Holographic Theme Accent</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themeOptions.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    onUpdatePreferences({ themeAccent: th.id });
                    sfx.playListeningStart();
                  }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    preferences.themeAccent === th.id
                      ? 'bg-slate-900 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-black/40 shrink-0"
                    style={{ backgroundColor: th.previewColor }}
                  />
                  <span className="truncate font-medium">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Security & Permissions */}
          <div className="space-y-3">
            <h4 className="font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Tool Permissions & Automation Guardrails</span>
            </h4>

            <div className="space-y-2 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <label className="flex items-center justify-between cursor-pointer py-1 border-b border-slate-850">
                <div>
                  <div className="text-slate-200 font-medium">Automatic Web Launcher</div>
                  <div className="text-slate-400 text-[11px]">Directly launch approved website URLs without secondary prompt</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoOpenWebsites}
                  onChange={(e) => onUpdatePreferences({ autoOpenWebsites: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 border-b border-slate-850">
                <div>
                  <div className="text-slate-200 font-medium">Enable Desktop Companion Bridge</div>
                  <div className="text-slate-400 text-[11px]">Allow communication with local Python companion daemon on port 54321</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableDesktopBridge}
                  onChange={(e) => onUpdatePreferences({ enableDesktopBridge: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1">
                <div>
                  <div className="text-slate-200 font-medium">Global Keyboard Shortcuts</div>
                  <div className="text-slate-400 text-[11px]">Enable Ctrl+Space (Mic toggle), Esc (Stop speech), Ctrl+K (Focus input), Ctrl+/ (Cheatsheet)</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableKeyboardShortcuts}
                  onChange={(e) => onUpdatePreferences({ enableKeyboardShortcuts: e.target.checked })}
                  className="accent-cyan-400 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onResetPreferences}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
