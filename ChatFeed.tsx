import React from 'react';
import { ChatMessage, ToolAction } from '../types';
import { Copy, Check, Volume2, RotateCcw, Bot, User, Trash2, Download, Sparkles } from 'lucide-react';
import { ToolExecutor } from './ToolExecutor';
import { sfx } from '../utils/soundEffects';

interface ChatFeedProps {
  messages: ChatMessage[];
  interimTranscript: string;
  isListening: boolean;
  isThinking: boolean;
  onSpeakMessage: (text: string) => void;
  onRegenerate: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onSendPrompt: (prompt: string) => void;
  onExecuteAction: (actionId: string, authorized: boolean) => void;
  onAddTimer: (minutes: number, label: string) => void;
  onSaveNote: (title: string, content: string) => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  interimTranscript,
  isListening,
  isThinking,
  onSpeakMessage,
  onRegenerate,
  onClearChat,
  onExportChat,
  onSendPrompt,
  onExecuteAction,
  onAddTimer,
  onSaveNote,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript, isThinking]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    sfx.playSuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    { label: 'तुम क्या कर सकते हो?', text: 'नमस्ते ALOK! तुम क्या कर सकते हो और कौन-कौन से टूल्स चला सकते हो?' },
    { label: 'Hinglish Study Timer', text: '5 minute ka study timer laga do please' },
    { label: 'Open YouTube', text: 'YouTube open karo' },
    { label: 'Explain Quantum Computing', text: 'Explain quantum computing in simple terms with a real-world analogy' },
    { label: 'Create a Project Note', text: 'Save a note titled "AI Project Goals" with 3 key milestones' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-xl border border-slate-800/80 backdrop-blur-md overflow-hidden">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-slate-200 tracking-wider">
            COMMUNICATION LOG
          </span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs font-mono text-cyan-400/80 tabular-nums">
            {messages.length} ENTRIES
          </span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={onExportChat}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded transition-colors"
                title="Export Conversation Log"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={onClearChat}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 rounded transition-colors"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-100">
              ALOK AI ROBOT Online
            </h4>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              I am your intelligent assistant. Speak naturally or type in Hindi, English, or Hinglish. I can answer questions, open websites, manage timers, and guide desktop operations.
            </p>

            {/* Quick Prompts */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sfx.playListeningStart();
                    onSendPrompt(p.text);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-lg transition-colors text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              {msg.role === 'user' ? (
                <>
                  <span className="text-[11px] font-mono text-slate-400">YOU</span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {msg.timestamp}
                  </span>
                  <User className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">ALOK AI</span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                    {msg.timestamp}
                  </span>
                </>
              )}
            </div>

            <div
              className={`relative max-w-[90%] sm:max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-950/40 text-slate-100 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 shadow-sm'
              }`}
            >
              {/* Formatted Message Text */}
              <div className="whitespace-pre-wrap font-sans text-[13.5px] text-slate-200">
                {msg.text.replace(/\[ACTION:[^\]]+\]/g, '').trim()}
              </div>

              {/* Tool Execution Cards (if any) */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.actions.map((act) => (
                    <ToolExecutor
                      key={act.id}
                      action={act}
                      onExecuteAction={onExecuteAction}
                      onAddTimer={onAddTimer}
                      onSaveNote={onSaveNote}
                    />
                  ))}
                </div>
              )}

              {/* Message Controls for Model Responses */}
              {msg.role === 'model' && (
                <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-slate-800/60 text-slate-400">
                  <button
                    onClick={() => onSpeakMessage(msg.text)}
                    className="flex items-center gap-1 text-[11px] hover:text-cyan-400 px-1.5 py-0.5 rounded transition-colors"
                    title="Read aloud with text-to-speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>

                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="flex items-center gap-1 text-[11px] hover:text-cyan-400 px-1.5 py-0.5 rounded transition-colors"
                    title="Copy message to clipboard"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 text-[11px] hover:text-cyan-400 px-1.5 py-0.5 rounded transition-colors"
                    title="Regenerate this response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Interim Live Speech Transcript Bubble */}
        {isListening && interimTranscript && (
          <div className="flex flex-col items-end animate-pulse">
            <span className="text-[10px] font-mono text-cyan-400 mb-1">LIVE VOICE STREAM...</span>
            <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm bg-cyan-950/60 border border-cyan-400/60 text-cyan-200">
              {interimTranscript}
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono py-2">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>ALOK IS REASONING...</span>
          </div>
        )}
      </div>
    </div>
  );
};
