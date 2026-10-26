import React from 'react';
import {
  Monitor,
  Terminal,
  ShieldCheck,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { DesktopStatus } from '../types';
import { AuthorizationModal } from './AuthorizationModal';
import { sfx } from '../utils/soundEffects';

interface DesktopCompanionProps {
  onNotify: (message: string) => void;
}

export const DesktopCompanion: React.FC<DesktopCompanionProps> = ({ onNotify }) => {
  const [status, setStatus] = React.useState<DesktopStatus>({
    connected: false,
    mode: 'simulation',
  });
  const [checking, setChecking] = React.useState(false);
  const [logs, setLogs] = React.useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    {
      time: new Date().toLocaleTimeString(),
      text: 'Desktop Robot Companion initialized in Sandboxed Simulation Mode.',
      type: 'info',
    },
    {
      time: new Date().toLocaleTimeString(),
      text: 'Allowlist security filter active. Arbitrary shell command execution disabled.',
      type: 'success',
    },
  ]);

  // Authorization Modal state
  const [authModal, setAuthModal] = React.useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    description: string;
    target: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    actionType: '',
    description: '',
    target: '',
    onConfirm: () => {},
  });

  // Check connection to local companion daemon
  const checkLocalDaemon = async () => {
    setChecking(true);
    try {
      const res = await fetch('http://127.0.0.1:54321/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus({
          connected: true,
          mode: 'local_daemon',
          agentVersion: data.version || '1.2.0',
          platform: data.platform || 'Desktop Host',
          lastPing: new Date().toLocaleTimeString(),
        });
        addLog(`Successfully paired with Local Desktop Agent (v${data.version}). Platform: ${data.platform}`, 'success');
        sfx.playSuccess();
      } else {
        throw new Error('Non-200 response');
      }
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        mode: 'simulation',
      }));
      addLog('Local daemon unreachable on 127.0.0.1:54321. Switched to Sandboxed Simulation Mode.', 'warn');
      sfx.playWarning();
    } finally {
      setChecking(false);
    }
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        time: new Date().toLocaleTimeString(),
        text,
        type,
      },
    ]);
  };

  // Safe action trigger with Iron Man authorization guardrail
  const requestAppLaunch = (appName: string, executable: string) => {
    sfx.playWarning();
    setAuthModal({
      isOpen: true,
      title: `Authorize Application Launch: ${appName}`,
      actionType: 'PROCESS_SPAWN',
      description: `ALOK AI ROBOT requests permission to launch the local application [${appName}]. Do you authorize this action?`,
      target: executable,
      onConfirm: async () => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }));
        addLog(`User granted authorization to launch ${appName}.`, 'info');

        if (status.mode === 'local_daemon' && status.connected) {
          try {
            const res = await fetch('http://127.0.0.1:54321/launch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ app: appName.toLowerCase() }),
            });
            const data = await res.json();
            if (data.success) {
              addLog(`[Local Daemon] ${data.message}`, 'success');
              sfx.playSuccess();
              onNotify(`Launched ${appName} on your desktop.`);
            } else {
              addLog(`[Local Daemon Error] ${data.error}`, 'error');
            }
          } catch (e: any) {
            addLog(`Failed to communicate with local companion daemon: ${e.message}`, 'error');
          }
        } else {
          // Simulation execution
          setTimeout(() => {
            addLog(`[Simulation] Validated in safe allowlist: Spawned ${appName} (${executable}) in isolated sandbox container.`, 'success');
            sfx.playSuccess();
            onNotify(`Simulated launch of ${appName}.`);
          }, 400);
        }
      },
    });
  };

  const permittedApps = [
    { name: 'Calculator', exe: 'calc.exe / gnome-calculator / Calculator.app', category: 'Productivity' },
    { name: 'Notepad', exe: 'notepad.exe / gedit / TextEdit.app', category: 'Text Editor' },
    { name: 'Code', exe: 'code (VS Code)', category: 'Developer' },
    { name: 'Terminal', exe: 'cmd.exe / bash / Terminal.app', category: 'CLI Shell' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/80 rounded-xl border border-slate-800/80 backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Desktop Robot Mode & Companion Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Safe computer automation with strict allowlist and user confirmation guardrails.
          </p>
        </div>

        {/* Status / Connect Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium">
            <div
              className={`w-2 h-2 rounded-full ${
                status.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-300">
              {status.connected ? `DAEMON ONLINE (${status.platform})` : 'SANDBOX SIMULATION'}
            </span>
          </div>

          <button
            onClick={checkLocalDaemon}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Probing...' : 'Probe Local Host'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Security Constitution Banner */}
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-slate-100">Sandbox & Security Architecture: </span>
            A browser page cannot silently compromise your operating system. For local automation, ALOK AI ROBOT connects to an open-source local Python daemon running strictly on <code className="text-cyan-400">127.0.0.1:54321</code>. All actions require explicit confirmation, use allowlisted executables, and forbid arbitrary command injection.
          </div>
        </div>

        {/* Permitted Actions Grid */}
        <div>
          <h4 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mb-2">
            Allowlisted Desktop Tasks
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {permittedApps.map((app, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-slate-200 text-xs font-semibold">
                    <span>{app.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{app.category}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                    {app.exe}
                  </div>
                </div>

                <button
                  onClick={() => requestAppLaunch(app.name, app.exe)}
                  className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Launch {app.name}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Download Standalone Companion Agent */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Standalone Desktop Agent</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Download the lightweight, auditable Python agent (<code className="text-slate-300">alok_companion.py</code>). Run it on your PC or Mac to enable full desktop computer control.
            </p>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-x-2">
              <span className="text-cyan-400">Quickstart:</span>
              <span className="text-slate-300 bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                pip install flask flask-cors && python alok_companion.py
              </span>
            </div>
          </div>

          <a
            href="/api/desktop/companion-script"
            download="alok_companion.py"
            onClick={() => sfx.playSuccess()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Companion (.py)</span>
          </a>
        </div>

        {/* Security Audit Terminal Log */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMPANION AUDIT LOG</span>
            </span>
            <button
              onClick={() => setLogs([])}
              className="hover:text-slate-200 text-[11px]"
            >
              Clear Log
            </button>
          </div>

          <div className="p-3 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs max-h-56 overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-600 shrink-0 tabular-nums">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'warn'
                      ? 'text-amber-400'
                      : log.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Authorization Guardrail Modal */}
      <AuthorizationModal
        isOpen={authModal.isOpen}
        title={authModal.title}
        actionType={authModal.actionType}
        description={authModal.description}
        target={authModal.target}
        isConsequential={true}
        onAuthorize={authModal.onConfirm}
        onAbort={() => {
          setAuthModal((prev) => ({ ...prev, isOpen: false }));
          addLog(`Action aborted by user.`, 'warn');
          sfx.playListeningStop();
        }}
      />
    </div>
  );
};
