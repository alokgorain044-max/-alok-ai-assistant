import React, { useState, useEffect, useRef } from 'react';
import {
  AssistantState,
  ChatMessage,
  ToolAction,
  ActiveTimer,
  SavedNote,
  UserPreferences,
  LanguageCode,
} from './types';
import { AIOrb } from './components/AIOrb';
import { ChatFeed } from './components/ChatFeed';
import { VoiceController } from './components/VoiceController';
import { ToolsDashboard } from './components/ToolsDashboard';
import { DesktopCompanion } from './components/DesktopCompanion';
import { MemoryPanel } from './components/MemoryPanel';
import { OSGuideModal } from './components/OSGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthorizationModal } from './components/AuthorizationModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { speechEngine } from './utils/speechEngine';
import { sfx } from './utils/soundEffects';
import {
  Bot,
  Sliders,
  Bell,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Terminal,
  VolumeX,
  Keyboard,
} from 'lucide-react';

const DEFAULT_PREFERENCES: UserPreferences = {
  callsign: 'Commander',
  language: 'hinglish',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVoiceURI: '',
  soundEffects: true,
  sfxVolume: 0.5,
  continuousListening: false,
  themeAccent: 'arc-blue',
  autoOpenWebsites: false,
  enableDesktopBridge: true,
  enableKeyboardShortcuts: true,
  notes: [
    'User prefers natural Hindi/Hinglish responses when queried in Hindi',
    'Primary focus: Programming, general intelligence, system guidance',
  ],
};

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<'assistant' | 'tools' | 'desktop' | 'memory'>('assistant');

  // Core Assistant States
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // User Preferences & Stored Data
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('alok_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          notes: Array.isArray(parsed?.notes) ? parsed.notes : DEFAULT_PREFERENCES.notes,
        };
      }
      return DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [notes, setNotes] = useState<SavedNote[]>(() => {
    try {
      const saved = localStorage.getItem('alok_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [
        {
          id: 'note_1',
          title: 'ALOK AI ROBOT Subsystem Protocol',
          content: 'Futuristic personal assistant active with voice recognition, Hindi/English reasoning, and desktop companion integration.',
          updatedAt: new Date().toLocaleDateString(),
        },
      ];
    } catch {
      return [];
    }
  });

  // Health check & API Key presence
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);

  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  // Messages History
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      role: 'model',
      text: 'Greetings Commander. ALOK AI ROBOT online and ready for your command.\n\nMain aapki Hindi, English, aur Hinglish me madad karne ke liye ready hoon. You can talk to me via microphone or text. Ask me anything, open approved websites, create notes, or manage timers!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Modals & Banners
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOSGuideOpen, setIsOSGuideOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'alarm' } | null>(null);

  // Consequential Authorization Modal
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    description: string;
    target: string;
    actionId: string;
  }>({
    isOpen: false,
    title: '',
    actionType: '',
    description: '',
    target: '',
    actionId: '',
  });

  // Save preferences & notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alok_preferences', JSON.stringify(preferences));
      sfx.setConfig(preferences.soundEffects, preferences.sfxVolume);
    } catch {}
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem('alok_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  // Timer Countdown Engine (1-second tick)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        let timerFired = false;
        const updated = prevTimers.map((timer) => {
          if (!timer.isRunning || timer.remainingSeconds <= 0) return timer;
          const nextSec = timer.remainingSeconds - 1;
          if (nextSec === 0) {
            timerFired = true;
            // Play alarm sound and notify
            sfx.playAlarm();
            setNotification({
              message: `ALARM: Timer "${timer.label}" has elapsed!`,
              type: 'alarm',
            });
            // Try browser notification if permitted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('ALOK AI ROBOT Timer Alert', {
                body: `Your timer "${timer.label}" has completed.`,
              });
            }
          }
          return { ...timer, remainingSeconds: nextSec, isRunning: nextSec > 0 };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Safe Notification permission and API health probe on first load
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {
      // Ignore iframe restrictions
    }

    // Health probe to verify backend & Gemini API key configuration
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setApiKeyConfigured(data.hasApiKey);
          if (!data.hasApiKey) {
            setMessages((prev) => [
              ...prev,
              {
                id: 'msg_api_notice',
                role: 'model',
                text: 'System Notice: Gemini API Key is currently unconfigured. Running in Autonomous Local Offline Mode. All browser tools, Hindi/English speech, timers, notes, and local actions are active and ready.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Parse Action Directives from Gemini Text
  const parseActionDirectives = (rawText: string): ToolAction[] => {
    const actionRegex = /\[ACTION:([a-zA-Z0-9_]+):(\{[\s\S]*?\})\]/g;
    const actions: ToolAction[] = [];
    let match;

    while ((match = actionRegex.exec(rawText)) !== null) {
      try {
        const type = match[1] as any;
        const payload = JSON.parse(match[2]);
        actions.push({
          id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type,
          payload,
          status: 'pending',
          requiresConfirmation: payload.requiresConfirmation ?? false,
        });
      } catch (err) {
        console.warn('Failed to parse action directive payload:', err);
      }
    }
    return actions;
  };

  // Dispatch message to Gemini Server
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    // Interrupt any ongoing speech
    speechEngine.stopSpeaking();
    setIsSpeaking(false);

    // Stop listening if active
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setInterimTranscript('');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAssistantState('thinking');

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          userPreferences: {
            callsign: preferences.callsign,
            language: preferences.language,
            notes: preferences.notes,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      const rawReply: string = data.reply || 'Request acknowledged.';
      const actions = parseActionDirectives(rawReply);

      const modelMsg: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        text: rawReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions,
      };

      setMessages((prev) => [...prev, modelMsg]);

      // Execute auto-open if permitted
      if (preferences.autoOpenWebsites) {
        const openAct = actions.find((a) => a.type === 'open_website');
        if (openAct && openAct.payload?.url) {
          window.open(openAct.payload.url, '_blank', 'noopener,noreferrer');
        }
      }

      // Read model response aloud via Text-to-Speech
      setAssistantState('speaking');
      setIsSpeaking(true);
      sfx.playListeningStart();

      speechEngine.speak(rawReply, {
        lang: preferences.language,
        rate: preferences.speechRate,
        pitch: preferences.speechPitch,
        voiceURI: preferences.speechVoiceURI,
        onStart: () => {
          setIsSpeaking(true);
          setAssistantState('speaking');
        },
        onEnd: () => {
          setIsSpeaking(false);
          setAssistantState('idle');
          // If continuous listening is active, re-arm microphone
          if (preferences.continuousListening) {
            handleToggleListening();
          }
        },
        onError: () => {
          setIsSpeaking(false);
          setAssistantState('idle');
        },
      });
    } catch (err: any) {
      console.error('Failed to communicate with ALOK core:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        text: 'Communication uplink error. I was unable to connect to the intelligence server. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setAssistantState('idle');
      sfx.playWarning();
    }
  };

  // Toggle Voice Listening via Web Speech API
  const handleToggleListening = async () => {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      setAssistantState('idle');
      setInterimTranscript('');
      sfx.playListeningStop();
      return;
    }

    // Stop speaking if speaking
    if (isSpeaking) {
      speechEngine.stopSpeaking();
      setIsSpeaking(false);
    }

    sfx.playListeningStart();
    setAssistantState('listening');

    const success = await speechEngine.startListening(preferences.language, {
      onStart: () => {
        setIsListening(true);
        setAssistantState('listening');
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceVolume(0);
        // Only return to idle if not thinking
        setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev));
      },
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          setInterimTranscript('');
          handleSendMessage(transcript);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setAssistantState('idle');
        setNotification({ message: err, type: 'info' });
        sfx.playWarning();
      },
      onVolumeChange: (vol) => {
        setVoiceVolume(vol);
      },
    });

    if (!success) {
      setIsListening(false);
      setAssistantState('idle');
    }
  };

  // Stop Assistant Speech
  const handleStopSpeaking = () => {
    speechEngine.stopSpeaking();
    setIsSpeaking(false);
    setAssistantState('idle');
    sfx.playListeningStop();
  };

  // Keyboard Shortcut System (Ctrl+Space: Toggle Listening, Esc: Stop Speaking/Interrupt, etc.)
  const listeningRef = useRef(isListening);
  const speakingRef = useRef(isSpeaking);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    listeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (preferencesRef.current.enableKeyboardShortcuts === false) return;

      const hasMod = e.ctrlKey || e.metaKey;

      // 1. Ctrl + Space / Cmd + Space: Toggle Voice Listening (Mic)
      if (hasMod && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        handleToggleListening();
        setNotification({
          message: listeningRef.current
            ? 'Hotkey: [Ctrl+Space] Microphone Deactivated'
            : 'Hotkey: [Ctrl+Space] Microphone Activated — Speak Now',
          type: 'info',
        });
        return;
      }

      // 2. Escape: Interrupt / Stop Speaking, Stop Listening, or Close Overlays
      if (e.key === 'Escape') {
        let handled = false;
        if (speakingRef.current) {
          handleStopSpeaking();
          setNotification({
            message: 'Hotkey: [Esc] Vocal Synthesis Interrupted',
            type: 'info',
          });
          handled = true;
        }
        if (listeningRef.current) {
          handleToggleListening();
          handled = true;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          handled = true;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          handled = true;
        }
        if (isOSGuideOpen) {
          setIsOSGuideOpen(false);
          handled = true;
        }
        if (authModal.isOpen) {
          setAuthModal((prev) => ({ ...prev, isOpen: false }));
          handled = true;
        }
        if (handled) {
          e.preventDefault();
        }
        return;
      }

      // 3. Ctrl + K / Cmd + K: Focus command input
      if (hasMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('alok-command-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
          setNotification({
            message: 'Hotkey: [Ctrl+K] Command Input Focused',
            type: 'info',
          });
        }
        return;
      }

      // 4. Ctrl + / or Cmd + /: Toggle Keyboard Shortcuts HUD Cheatsheet
      if (hasMod && (e.key === '/' || e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 5. Ctrl + M / Cmd + M: Toggle Audio SFX (Mute / Unmute)
      if (hasMod && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setPreferences((prev) => {
          const nextVal = !prev.soundEffects;
          sfx.setConfig(nextVal, prev.sfxVolume);
          setNotification({
            message: nextVal ? 'Hotkey: [Ctrl+M] Audio SFX Enabled' : 'Hotkey: [Ctrl+M] Audio SFX Muted',
            type: 'info',
          });
          return { ...prev, soundEffects: nextVal };
        });
        return;
      }

      // 6. Ctrl + 1..4: View navigation
      if (hasMod && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const viewMap: Record<string, 'assistant' | 'tools' | 'desktop' | 'memory'> = {
          '1': 'assistant',
          '2': 'tools',
          '3': 'desktop',
          '4': 'memory',
        };
        const nextView = viewMap[e.key];
        if (nextView) {
          setActiveView(nextView);
          sfx.playListeningStart();
        }
        return;
      }

      // 7. Ctrl + ,: Open Settings
      if (hasMod && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleListening, isShortcutsOpen, isSettingsOpen, isOSGuideOpen, authModal.isOpen]);

  // Tool Handlers
  const handleAddTimer = (minutes: number, label: string) => {
    const newTimer: ActiveTimer = {
      id: `timer_${Date.now()}`,
      label,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      isRunning: true,
      createdAt: new Date().toLocaleTimeString(),
    };
    setTimers((prev) => [newTimer, ...prev]);
    setNotification({ message: `Started timer: ${label} (${minutes}m)`, type: 'success' });
    sfx.playActivation();
  };

  const handleToggleTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const handleResetTimer = (id: string) => {
    setTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false } : t))
    );
  };

  const handleDeleteTimer = (id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveNote = (title: string, content: string) => {
    const newNote: SavedNote = {
      id: `note_${Date.now()}`,
      title,
      content,
      updatedAt: new Date().toLocaleDateString(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setNotification({ message: `Saved note: "${title}" to memory vault`, type: 'success' });
    sfx.playSuccess();
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Execute Action from Message Card
  const handleExecuteAction = (actionId: string, authorized: boolean) => {
    setMessages((prev) =>
      prev.map((msg) => ({
        ...msg,
        actions: msg.actions?.map((act) =>
          act.id === actionId
            ? { ...act, status: authorized ? 'completed' : 'rejected' }
            : act
        ),
      }))
    );
    if (authorized) {
      sfx.playSuccess();
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    sfx.playListeningStop();
  };

  const handleExportChat = () => {
    const chatText = messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'YOU' : 'ALOK AI'}:\n${m.text}\n`)
      .join('\n---\n\n');
    const blob = new Blob([chatText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alok_ai_conversation_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    sfx.playSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Universal Top Bar Contract: Exactly 3 Zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark (one line) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <Bot className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-white font-mono">
            ALOK AI ROBOT
          </span>
        </div>

        {/* Zone 2: 4-5 Navigation Links (single-line, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-slate-400">
          <button
            onClick={() => setActiveView('assistant')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'assistant' ? 'text-cyan-400 underline underline-offset-8 decoration-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Core Assistant
          </button>
          <button
            onClick={() => setActiveView('tools')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'tools' ? 'text-cyan-400 underline underline-offset-8 decoration-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Tools & Files
          </button>
          <button
            onClick={() => setActiveView('desktop')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'desktop' ? 'text-cyan-400 underline underline-offset-8 decoration-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Desktop Robot
          </button>
          <button
            onClick={() => setActiveView('memory')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'memory' ? 'text-cyan-400 underline underline-offset-8 decoration-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Memory Bank
          </button>
          <button
            onClick={() => setIsOSGuideOpen(true)}
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 text-slate-400"
          >
            OS Guide
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Settings Modal Trigger) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Timers Badge Pill-free */}
          {timers.some((t) => t.isRunning) && (
            <button
              onClick={() => setActiveView('tools')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300"
            >
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{timers.filter((t) => t.isRunning).length} Timer Active</span>
            </button>
          )}

          <button
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts [Ctrl+/]"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className="hidden lg:inline text-[10px] px-1 bg-black/60 rounded border border-slate-700 text-slate-400">Ctrl+/</kbd>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Offline / Missing API Key Notice Banner */}
      {!apiKeyConfigured && (
        <div className="bg-amber-950/60 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>GEMINI API KEY STANDBY: Operating in Autonomous Offline AI mode. Add GEMINI_API_KEY to secrets to enable full cloud neural reasoning.</span>
          </div>
          <button
            onClick={() => setApiKeyConfigured(true)}
            className="text-amber-400 hover:text-amber-200 text-xs underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Notification Toast HUD Banner */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 max-w-sm p-3 rounded-xl border bg-slate-900/95 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-slate-200 leading-relaxed">
            {notification.message}
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile Tab Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950 p-2 text-xs font-mono">
        <button
          onClick={() => setActiveView('assistant')}
          className={`py-1 px-2 rounded ${activeView === 'assistant' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
        >
          Assistant
        </button>
        <button
          onClick={() => setActiveView('tools')}
          className={`py-1 px-2 rounded ${activeView === 'tools' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
        >
          Tools
        </button>
        <button
          onClick={() => setActiveView('desktop')}
          className={`py-1 px-2 rounded ${activeView === 'desktop' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
        >
          Desktop
        </button>
        <button
          onClick={() => setActiveView('memory')}
          className={`py-1 px-2 rounded ${activeView === 'memory' ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-400'}`}
        >
          Memory
        </button>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* VIEW 1: Core AI Assistant (Orb + Feed + Controls) */}
        {activeView === 'assistant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
            {/* Left Column: Animated AI Orb & State HUD */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-sm relative overflow-hidden">
              {/* Subtle background grid pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.06),transparent_70%)] pointer-events-none" />

              {/* Subsystem Telemetry Header */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  <span className="text-cyan-300 font-semibold">NEURAL CORE</span>
                </div>
                <div className="text-slate-500">
                  LANG: <span className="text-slate-300 uppercase">{preferences.language}</span>
                </div>
              </div>

              {/* Central Orb */}
              <div className="my-auto py-4">
                <AIOrb
                  state={assistantState}
                  volumeLevel={voiceVolume}
                  accent={preferences.themeAccent}
                  onOrbClick={handleToggleListening}
                />
              </div>

              {/* Quick Actions Strip */}
              <div className="w-full pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                <button
                  onClick={() => setIsOSGuideOpen(true)}
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>OS Guide</span>
                </button>
                <button
                  onClick={() => setActiveView('tools')}
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>File & Tools</span>
                </button>
                <button
                  onClick={() => setActiveView('desktop')}
                  className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Companion Mode</span>
                </button>
              </div>
            </div>

            {/* Right Column: Communication Feed */}
            <div className="lg:col-span-7 flex flex-col min-h-[500px] lg:min-h-[580px]">
              <ChatFeed
                messages={messages}
                interimTranscript={interimTranscript}
                isListening={isListening}
                isThinking={assistantState === 'thinking'}
                onSpeakMessage={(text) => {
                  speechEngine.speak(text, {
                    lang: preferences.language,
                    rate: preferences.speechRate,
                    pitch: preferences.speechPitch,
                    voiceURI: preferences.speechVoiceURI,
                  });
                }}
                onRegenerate={handleRegenerate}
                onClearChat={handleClearChat}
                onExportChat={handleExportChat}
                onSendPrompt={handleSendMessage}
                onExecuteAction={handleExecuteAction}
                onAddTimer={handleAddTimer}
                onSaveNote={handleSaveNote}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Tools & Files Dashboard */}
        {activeView === 'tools' && (
          <div className="flex-1">
            <ToolsDashboard
              timers={timers}
              notes={notes}
              onAddTimer={handleAddTimer}
              onToggleTimer={handleToggleTimer}
              onResetTimer={handleResetTimer}
              onDeleteTimer={handleDeleteTimer}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onSendChatMessage={handleSendMessage}
            />
          </div>
        )}

        {/* VIEW 3: Desktop Robot Mode Companion */}
        {activeView === 'desktop' && (
          <div className="flex-1">
            <DesktopCompanion
              onNotify={(msg) => setNotification({ message: msg, type: 'success' })}
            />
          </div>
        )}

        {/* VIEW 4: Memory & Personalization Bank */}
        {activeView === 'memory' && (
          <div className="flex-1">
            <MemoryPanel
              preferences={preferences}
              onUpdatePreferences={(updated) => setPreferences((prev) => ({ ...prev, ...updated }))}
            />
          </div>
        )}

        {/* Bottom Floating Voice & Text Controller (Always accessible) */}
        <div className="sticky bottom-4 z-30">
          <VoiceController
            state={assistantState}
            isListening={isListening}
            isSpeaking={isSpeaking}
            language={preferences.language}
            onToggleListening={handleToggleListening}
            onSendMessage={handleSendMessage}
            onStopSpeaking={handleStopSpeaking}
            onLanguageChange={(lang: LanguageCode) => setPreferences((p) => ({ ...p, language: lang }))}
            voiceVolume={voiceVolume}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        preferences={preferences}
        onClose={() => setIsSettingsOpen(false)}
        onUpdatePreferences={(updated) => setPreferences((prev) => ({ ...prev, ...updated }))}
        onResetPreferences={() => {
          setPreferences(DEFAULT_PREFERENCES);
          sfx.playListeningStop();
        }}
      />

      {/* OS Task Guide Modal */}
      <OSGuideModal
        isOpen={isOSGuideOpen}
        onClose={() => setIsOSGuideOpen(false)}
        onAskAlok={(q) => {
          setActiveView('assistant');
          handleSendMessage(q);
        }}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
