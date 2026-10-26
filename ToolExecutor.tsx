import React from 'react';
import { ToolAction, ActiveTimer, SavedNote } from '../types';
import { ExternalLink, Clock, FileText, Search, Play, Check, Copy, Download, Monitor } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface ToolExecutorProps {
  action: ToolAction;
  onExecuteAction: (actionId: string, authorized: boolean) => void;
  onAddTimer: (minutes: number, label: string) => void;
  onSaveNote: (title: string, content: string) => void;
}

export const ToolExecutor: React.FC<ToolExecutorProps> = ({
  action,
  onExecuteAction,
  onAddTimer,
  onSaveNote,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    sfx.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sfx.playSuccess();
  };

  // Render Open Website Tool Card
  if (action.type === 'open_website') {
    const { url, name } = action.payload || {};
    return (
      <div className="mt-3 p-3.5 bg-slate-900/90 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded text-cyan-400">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Approved Web Destination
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {name || 'Website'}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[260px]">
                {url}
              </div>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              sfx.playActivation();
              onExecuteAction(action.id, true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded text-xs font-semibold shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Launch Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Render Set Timer Tool Card
  if (action.type === 'set_timer') {
    const { minutes = 5, label = 'Countdown Timer' } = action.payload || {};
    return (
      <div className="mt-3 p-3.5 bg-slate-900/90 border border-sky-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-950/60 border border-sky-500/40 rounded text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-sky-400 uppercase tracking-wider">
                Timer Directive
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {label} ({minutes} {minutes === 1 ? 'minute' : 'minutes'})
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onAddTimer(minutes, label);
              onExecuteAction(action.id, true);
              sfx.playActivation();
            }}
            disabled={action.status === 'completed'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              action.status === 'completed'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                : 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            }`}
          >
            {action.status === 'completed' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Timer Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Timer</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render Create Note Tool Card
  if (action.type === 'create_note') {
    const { title = 'Note', content = '' } = action.payload || {};
    return (
      <div className="mt-3 p-3.5 bg-slate-900/90 border border-indigo-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-100">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(content)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
              title="Copy Note Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleDownload(`${title.toLowerCase().replace(/\s+/g, '_')}.txt`, content)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
              title="Download Note File (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                onSaveNote(title, content);
                onExecuteAction(action.id, true);
                sfx.playSuccess();
              }}
              disabled={action.status === 'completed'}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded transition-colors"
            >
              {action.status === 'completed' ? 'Saved' : 'Save to Memory'}
            </button>
          </div>
        </div>
        <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
          {content}
        </pre>
      </div>
    );
  }

  // Render Web Search Tool Card
  if (action.type === 'web_search') {
    const { query } = action.payload || {};
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query || '')}`;
    return (
      <div className="mt-3 p-3.5 bg-slate-900/90 border border-cyan-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded text-cyan-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Web Intelligence Query
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5 truncate max-w-[280px]">
                "{query}"
              </div>
            </div>
          </div>

          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              sfx.playActivation();
              onExecuteAction(action.id, true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded text-xs font-semibold shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Search Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Render Desktop Companion Task Card
  if (action.type === 'desktop_task') {
    const { action: taskAction, appName, requiresConfirmation } = action.payload || {};
    return (
      <div className="mt-3 p-3.5 bg-slate-900/90 border border-amber-500/40 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded text-amber-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                Desktop Robot Directive
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                Launch Application: {appName || 'System Tool'}
              </div>
              <div className="text-xs text-slate-400">
                Requires user confirmation before execution
              </div>
            </div>
          </div>

          <button
            onClick={() => onExecuteAction(action.id, true)}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-xs font-semibold shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-colors whitespace-nowrap shrink-0"
          >
            Authorize Action
          </button>
        </div>
      </div>
    );
  }

  return null;
};
