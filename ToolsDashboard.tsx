import React from 'react';
import { ActiveTimer, SavedNote } from '../types';
import {
  Upload,
  FileText,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Calculator,
} from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface ToolsDashboardProps {
  timers: ActiveTimer[];
  notes: SavedNote[];
  onAddTimer: (minutes: number, label: string) => void;
  onToggleTimer: (id: string) => void;
  onResetTimer: (id: string) => void;
  onDeleteTimer: (id: string) => void;
  onSaveNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onSendChatMessage: (message: string) => void;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({
  timers,
  notes,
  onAddTimer,
  onToggleTimer,
  onResetTimer,
  onDeleteTimer,
  onSaveNote,
  onDeleteNote,
  onSendChatMessage,
}) => {
  const [activeTab, setActiveTab] = React.useState<'files' | 'timers' | 'notes' | 'launcher' | 'calculator'>('files');

  // File analysis state
  const [fileContent, setFileContent] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string>('');
  const [fileInstruction, setFileInstruction] = React.useState<string>('Summarize the key points and highlight action items');
  const [analyzing, setAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string>('');

  // New Note state
  const [newNoteTitle, setNewNoteTitle] = React.useState('');
  const [newNoteContent, setNewNoteContent] = React.useState('');

  // New Timer state
  const [timerMinutes, setTimerMinutes] = React.useState(10);
  const [timerLabel, setTimerLabel] = React.useState('Task Focus');

  // Calculator state
  const [calcInput, setCalcInput] = React.useState('125 * 8.5');
  const [calcResult, setCalcResult] = React.useState<string>('1062.5');

  // File drop/upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    if (!fileContent.trim()) return;
    setAnalyzing(true);
    sfx.playListeningStart();

    try {
      const res = await fetch('/api/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileName,
          content: fileContent,
          instruction: fileInstruction,
        }),
      });
      const data = await res.json();
      setAnalysisResult(data.analysis || 'Analysis finished.');
      sfx.playSuccess();
    } catch (err) {
      setAnalysisResult('Failed to analyze document.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    onSaveNote(newNoteTitle.trim(), newNoteContent.trim());
    setNewNoteTitle('');
    setNewNoteContent('');
    sfx.playSuccess();
  };

  const handleCreateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (timerMinutes <= 0) return;
    onAddTimer(timerMinutes, timerLabel || 'Focus Session');
    sfx.playActivation();
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Safe math evaluation with sanitized characters only
      const sanitized = calcInput.replace(/[^0-9+\-*/().%^ ]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${sanitized})`)();
      setCalcResult(String(result));
      sfx.playSuccess();
    } catch (e) {
      setCalcResult('Invalid Expression');
    }
  };

  const approvedWebsites = [
    { name: 'Google Search', url: 'https://www.google.com', desc: 'Global Web Index' },
    { name: 'YouTube', url: 'https://www.youtube.com', desc: 'Video & Learning' },
    { name: 'GitHub', url: 'https://github.com', desc: 'Code Repositories' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'Free Knowledge' },
    { name: 'Google Maps', url: 'https://maps.google.com', desc: 'Geographic Navigation' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: 'Developer Community' },
    { name: 'ChatGPT', url: 'https://chat.openai.com', desc: 'AI Platform' },
    { name: 'Gmail', url: 'https://mail.google.com', desc: 'Personal Mailbox' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-xl border border-slate-800/80 backdrop-blur-md overflow-hidden">
      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1 p-2 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'files'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>File Summarizer</span>
        </button>

        <button
          onClick={() => setActiveTab('timers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'timers'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timers & Alarms ({timers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'notes'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Notes Vault ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('launcher')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'launcher'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Web Launcher</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'calculator'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Quick Math</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Tab 1: File Summarizer */}
        {activeTab === 'files' && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Document & Code Analyzer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload or paste text documents, code files (.js, .py, .ts, .json, .md), or meeting logs for instant AI breakdown.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 bg-slate-900/40 cursor-pointer transition-colors group">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-slate-200">
                  {fileName ? fileName : 'Choose text/code file'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports .txt, .md, .json, .js, .py, .csv
                </span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.js,.py,.ts,.csv,.html,.css"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-300 mb-1">
                  Analysis Instruction
                </label>
                <input
                  type="text"
                  value={fileInstruction}
                  onChange={(e) => setFileInstruction(e.target.value)}
                  placeholder="e.g. Summarize key ideas in bullet points"
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 mb-2"
                />

                <button
                  onClick={handleRunAnalysis}
                  disabled={!fileContent || analyzing}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{analyzing ? 'Analyzing with Gemini...' : 'Analyze Document'}</span>
                </button>
              </div>
            </div>

            {/* Content Preview */}
            {fileContent && (
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">
                  Document Preview ({fileContent.length} characters)
                </label>
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
                />
              </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-slate-800 pb-2">
                  <span>ANALYSIS SYNTHESIS</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(analysisResult);
                      sfx.playSuccess();
                    }}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Analysis</span>
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-xs text-slate-200 leading-relaxed font-sans">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Timers & Alarms */}
        {activeTab === 'timers' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Active Timers & Countdown Alarms</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Voice-activated or manual timers. ALOK AI ROBOT notifies you with sound and on-screen HUD alerts when time elapses.
              </p>
            </div>

            {/* Create Timer Form */}
            <form onSubmit={handleCreateTimer} className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
              <input
                type="text"
                value={timerLabel}
                onChange={(e) => setTimerLabel(e.target.value)}
                placeholder="Timer label (e.g. Tea Break, Code Sprint)"
                className="flex-1 min-w-[180px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 1)}
                  className="w-20 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-100 font-mono text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400">min</span>
              </div>
              <button
                type="submit"
                className="flex items-center gap-1 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-semibold shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Set Timer</span>
              </button>
            </form>

            {/* Active Timers List */}
            <div className="space-y-2">
              {timers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No active timers. Ask ALOK "Set a timer for 5 minutes" or create one above.
                </div>
              ) : (
                timers.map((timer) => {
                  const mins = Math.floor(timer.remainingSeconds / 60);
                  const secs = timer.remainingSeconds % 60;
                  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                  const progress = ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100;

                  return (
                    <div
                      key={timer.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden"
                    >
                      <div
                        className="absolute bottom-0 left-0 top-0 bg-sky-500/10 pointer-events-none transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />

                      <div className="relative flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {timer.label}
                          </div>
                          <div className="text-xl font-mono font-bold text-sky-400 tabular-nums mt-0.5">
                            {formattedTime}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleTimer(timer.id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                            title={timer.isRunning ? 'Pause' : 'Resume'}
                          >
                            {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onResetTimer(timer.id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                            title="Reset Timer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTimer(timer.id)}
                            className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-colors"
                            title="Delete Timer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Notes Vault */}
        {activeTab === 'notes' && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Notes & Snippets Vault</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create and save quick scratchpads, meeting takeaways, or code blocks generated by ALOK.
              </p>
            </div>

            {/* Create Note */}
            <form onSubmit={handleCreateNote} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
              />
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write or paste note content..."
                rows={3}
                className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notes.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs text-slate-500">
                  No notes saved yet. Tell ALOK "Save a note" or compose one above.
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-100 truncate">
                          {note.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(note.content);
                              sfx.playSuccess();
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Copy Content"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([note.content], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${note.title.toLowerCase().replace(/\s+/g, '_')}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                              sfx.playSuccess();
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="Download .txt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap line-clamp-4 font-mono">
                        {note.content}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-3">
                      Updated: {note.updatedAt}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Approved Web Launcher */}
        {activeTab === 'launcher' && (
          <div className="space-y-4 max-w-3xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Approved Web Launcher Directory</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Directly open vetted websites safely. You can also ask ALOK verbally (e.g. "YouTube kholo" or "Open GitHub").
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {approvedWebsites.map((site, idx) => (
                <a
                  key={idx}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sfx.playActivation()}
                  className="p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-slate-100 group-hover:text-cyan-300 font-medium text-xs">
                      <span>{site.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{site.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-500/70 mt-3 block truncate">
                    {site.url.replace('https://', '')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Quick Math & Conversions */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Quick Math & Conversion Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate math expressions, calculate percentages, or ask ALOK for currency and timezone math.
              </p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div>
                <label className="text-xs font-mono text-slate-400 mb-1 block">EXPRESSION</label>
                <input
                  type="text"
                  value={calcInput}
                  onChange={(e) => setCalcInput(e.target.value)}
                  placeholder="e.g. (450 * 1.18) + 25"
                  className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-colors"
                >
                  Calculate Result
                </button>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">RESULT:</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                    {calcResult}
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
