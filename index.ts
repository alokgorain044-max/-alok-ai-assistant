export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';

export type LanguageCode = 'hi-IN' | 'en-US' | 'en-IN' | 'hinglish';

export type ThemeAccent = 'arc-blue' | 'quantum-cyan' | 'crimson-protocol' | 'emerald-core' | 'cyber-gold';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  actions?: ToolAction[];
  isError?: boolean;
}

export interface ToolAction {
  id: string;
  type: 'open_website' | 'set_timer' | 'create_note' | 'web_search' | 'desktop_task' | 'os_guide';
  payload: any;
  status: 'pending' | 'authorized' | 'completed' | 'rejected' | 'failed';
  resultMessage?: string;
  requiresConfirmation?: boolean;
}

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  createdAt: string;
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface UserPreferences {
  callsign: string;
  language: LanguageCode;
  speechRate: number;
  speechPitch: number;
  speechVoiceURI: string;
  soundEffects: boolean;
  sfxVolume: number;
  continuousListening: boolean;
  themeAccent: ThemeAccent;
  autoOpenWebsites: boolean;
  enableDesktopBridge: boolean;
  enableKeyboardShortcuts: boolean;
  notes: string[]; // Remembered personal facts
}

export interface DesktopStatus {
  connected: boolean;
  mode: 'local_daemon' | 'simulation';
  agentVersion?: string;
  platform?: string;
  lastPing?: string;
}
