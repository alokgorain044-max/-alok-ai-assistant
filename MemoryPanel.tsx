import React from 'react';
import { UserPreferences } from '../types';
import { Brain, Plus, Trash2, Edit3, Check, Save, Download, ShieldCheck, AlertCircle } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface MemoryPanelProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [newFact, setNewFact] = React.useState('');
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [callsignInput, setCallsignInput] = React.useState(preferences.callsign || '');
  const [showPurgeConfirm, setShowPurgeConfirm] = React.useState(false);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    const updatedNotes = [...preferences.notes, newFact.trim()];
    onUpdatePreferences({ notes: updatedNotes });
    setNewFact('');
    sfx.playSuccess();
  };

  const handleDeleteFact = (idx: number) => {
    const updatedNotes = preferences.notes.filter((_, i) => i !== idx);
    onUpdatePreferences({ notes: updatedNotes });
    sfx.playListeningStop();
  };

  const handleStartEdit = (idx: number, text: string) => {
    setEditingIdx(idx);
    setEditingText(text);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editingText.trim()) return;
    const updatedNotes = [...preferences.notes];
    updatedNotes[idx] = editingText.trim();
    onUpdatePreferences({ notes: updatedNotes });
    setEditingIdx(null);
    setEditingText('');
    sfx.playSuccess();
  };

  const handleSaveCallsign = () => {
    onUpdatePreferences({ callsign: callsignInput.trim() });
    sfx.playSuccess();
  };

  const handleExportMemory = () => {
    const payload = JSON.stringify(preferences, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alok_ai_memory_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sfx.playSuccess();
  };

  const handlePurgeAll = () => {
    onUpdatePreferences({ notes: [] });
    setShowPurgeConfirm(false);
    sfx.playWarning();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-xl border border-slate-800/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Personal Memory & Context Core
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent, user-controlled memory bank. ALOK AI ROBOT only remembers what you explicitly allow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMemory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-5 max-w-3xl">
        {/* Privacy Transparency Notice */}
        <div className="p-3.5 bg-slate-900/80 border border-cyan-500/30 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-100">Privacy Safeguard: </span>
            Memory items are stored locally in your browser and injected into current session prompts. We never harvest sensitive passwords or financial credentials. You have total autonomy to view, modify, or erase memories at any time.
          </div>
        </div>

        {/* Identity & Callsign */}
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
            User Identity & Callsign
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={callsignInput}
              onChange={(e) => setCallsignInput(e.target.value)}
              placeholder="e.g. Commander, Alok, Sir"
              className="flex-1 bg-slate-950 px-3 py-2 rounded-lg border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
            />
            <button
              onClick={handleSaveCallsign}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            >
              Save Callsign
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            How ALOK AI ROBOT should address you during verbal and written interactions.
          </p>
        </div>

        {/* Remembered Facts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              Remembered Facts & Preferences ({preferences.notes.length})
            </h4>

            {preferences.notes.length > 0 && (
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Purge All</span>
              </button>
            )}
          </div>

          {/* Purge Confirmation Banner */}
          {showPurgeConfirm && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center justify-between text-xs">
              <span className="text-rose-200">
                Are you sure you want to delete all remembered context?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePurgeAll}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold text-[11px]"
                >
                  Confirm Purge
                </button>
                <button
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Fact Form */}
          <form onSubmit={handleAddFact} className="flex items-center gap-2">
            <input
              type="text"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="Add a new fact (e.g., 'I am studying Computer Science', 'Prefers code in TypeScript')..."
              className="flex-1 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs font-medium transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fact</span>
            </button>
          </form>

          {/* Facts list */}
          <div className="space-y-2">
            {preferences.notes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No personalized facts stored. You can add facts above or ask ALOK "Remember that..." in conversation.
              </div>
            ) : (
              preferences.notes.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-200"
                >
                  {editingIdx === idx ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 bg-slate-950 px-2 py-1 rounded border border-cyan-400 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 leading-relaxed">
                      <span className="text-cyan-400 font-mono mr-2">{String(idx + 1).padStart(2, '0')}.</span>
                      <span>{fact}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    {editingIdx !== idx && (
                      <button
                        onClick={() => handleStartEdit(idx, fact)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Edit Fact"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFact(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                      title="Delete Fact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
