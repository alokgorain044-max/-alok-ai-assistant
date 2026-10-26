import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Bot, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ALOK AI ROBOT caught unhandled runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('alok_preferences');
      localStorage.removeItem('alok_notes');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full p-6 bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
              <Bot className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                SYSTEM RECOVERY PROTOCOL
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                ALOK AI ROBOT Core Reboot
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                A localized runtime exception was intercepted. The self-healing neural watchdog is standing by to reset local state.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/80 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reboot ALOK Neural Core</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
