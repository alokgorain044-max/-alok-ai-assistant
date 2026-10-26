import React from 'react';
import { Mic, MicOff, Send, Square, Volume2, Globe, Sparkles } from 'lucide-react';
import { AssistantState, LanguageCode } from '../types';
import { sfx } from '../utils/soundEffects';

interface VoiceControllerProps {
  state: AssistantState;
  isListening: boolean;
  isSpeaking: boolean;
  language: LanguageCode;
  onToggleListening: () => void;
  onSendMessage: (text: string) => void;
  onStopSpeaking: () => void;
  onLanguageChange: (lang: LanguageCode) => void;
  voiceVolume: number;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  state,
  isListening,
  isSpeaking,
  language,
  onToggleListening,
  onSendMessage,
  onStopSpeaking,
  onLanguageChange,
  voiceVolume,
}) => {
  const [inputText, setInputText] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || state === 'thinking') return;
    sfx.playListeningStart();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const languageLabels: Record<LanguageCode, string> = {
    'hinglish': 'Hinglish (Auto)',
    'hi-IN': 'हिन्दी (Hindi)',
    'en-US': 'English (US)',
    'en-IN': 'English (India)',
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3">
      <div className="flex flex-col gap-2">
        {/* Active Speaking Interruption Banner */}
        {isSpeaking && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
              <span>ALOK IS SPEAKING — Click stop or speak to interrupt</span>
            </div>
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-300 rounded font-semibold text-[11px] transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Interrupt / Stop</span>
            </button>
          </div>
        )}

        {/* Input Bar & Controls */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 bg-slate-900/95 border border-cyan-500/40 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.25)] rounded-2xl p-1.5 backdrop-blur-md transition-all shadow-lg"
        >
          {/* Microphone Activation Button */}
          <button
            type="button"
            onClick={onToggleListening}
            aria-label={isListening ? 'Stop listening (Ctrl+Space)' : 'Start voice input (Ctrl+Space)'}
            title={isListening ? 'Stop listening [Ctrl+Space]' : 'Start voice input [Ctrl+Space]'}
            className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}

            {/* Audio meter mini bar if listening */}
            {isListening && voiceVolume > 5 && (
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-300 rounded-full border-2 border-slate-950"
                style={{
                  transform: `scale(${1 + voiceVolume / 50})`,
                }}
              />
            )}
          </button>

          {/* Text Input */}
          <input
            id="alok-command-input"
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to voice... (Ctrl+Space to stop)'
                : 'Ask ALOK anything, give a command, or switch to Hindi/Hinglish... [Ctrl+K]'
            }
            disabled={state === 'thinking'}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />

          {/* Quick Language Selector */}
          <div className="relative group shrink-0 hidden sm:block">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className="appearance-none bg-slate-950/80 hover:bg-slate-950 text-xs font-mono text-slate-300 py-2 pl-2.5 pr-6 rounded-lg border border-slate-700 hover:border-cyan-500/40 focus:outline-none cursor-pointer"
            >
              <option value="hinglish">Hinglish</option>
              <option value="hi-IN">हिन्दी</option>
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (IN)</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || state === 'thinking'}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 disabled:opacity-40 disabled:hover:bg-slate-800 disabled:hover:text-slate-300 transition-colors shrink-0"
            title="Send directive"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Small Assistant Helper Metadata */}
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400">VOICE ENGINE:</span>
            <span>Web Speech API + Synthesis</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">{languageLabels[language]}</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span>Press Enter to dispatch</span>
            <span aria-hidden="true">·</span>
            <span>Microphone toggle: Click Orb or Mic</span>
          </div>
        </div>
      </div>
    </div>
  );
};
