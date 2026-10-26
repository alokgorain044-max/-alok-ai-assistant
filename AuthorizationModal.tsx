import React from 'react';
import { ShieldAlert, CheckCircle, XCircle, Terminal, AlertTriangle } from 'lucide-react';

interface AuthorizationModalProps {
  isOpen: boolean;
  title: string;
  actionType: string;
  description: string;
  target: string;
  isConsequential?: boolean;
  onAuthorize: () => void;
  onAbort: () => void;
}

export const AuthorizationModal: React.FC<AuthorizationModalProps> = ({
  isOpen,
  title,
  actionType,
  description,
  target,
  isConsequential = false,
  onAuthorize,
  onAbort,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] p-6 overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg border ${
            isConsequential
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
              : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400'
          }`}>
            {isConsequential ? <AlertTriangle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
                {isConsequential ? 'SECURITY GUARDRAIL ACTIVE' : 'USER AUTHORIZATION PROTOCOL'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-0.5">
              {title}
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Parameter Details */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>ACTION TYPE:</span>
            <span className="text-cyan-400 font-semibold">{actionType}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>TARGET ENTITY:</span>
            <span className="text-slate-100 truncate max-w-[260px]">{target}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>VERIFICATION:</span>
            <span className="text-emerald-400">ALLOWLISTED / SANDBOXED</span>
          </div>
        </div>

        {/* Decision Controls */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onAbort}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Abort Directive</span>
          </button>
          <button
            onClick={onAuthorize}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg font-semibold shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
          >
            <CheckCircle className="w-4 h-4 text-slate-950" />
            <span>Authorize Action</span>
          </button>
        </div>
      </div>
    </div>
  );
};
