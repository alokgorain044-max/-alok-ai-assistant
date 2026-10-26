import React from 'react';
import { Terminal, Copy, Check, Search, Laptop, Smartphone, HelpCircle } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

interface OSGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAlok: (question: string) => void;
}

export const OSGuideModal: React.FC<OSGuideModalProps> = ({
  isOpen,
  onClose,
  onAskAlok,
}) => {
  const [selectedOS, setSelectedOS] = React.useState<'win' | 'mac' | 'linux' | 'android'>('win');
  const [copiedCmd, setCopiedCmd] = React.useState<string | null>(null);
  const [searchFilter, setSearchFilter] = React.useState('');

  if (!isOpen) return null;

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    sfx.playSuccess();
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const tasks = [
    {
      title: 'Flush DNS Cache',
      category: 'Networking',
      desc: 'Clears stale domain lookup records to resolve connection hiccups.',
      commands: {
        win: 'ipconfig /flushdns',
        mac: 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder',
        linux: 'sudo systemd-resolve --flush-caches',
        android: 'Toggle Airplane Mode ON for 10 seconds, then OFF (or clear Chrome cache in Settings > Apps).',
      },
    },
    {
      title: 'Check Local IP Address',
      category: 'Networking',
      desc: 'Discovers local assigned IPv4/IPv6 addresses.',
      commands: {
        win: 'ipconfig',
        mac: 'ipconfig getifaddr en0',
        linux: 'ip addr show or hostname -I',
        android: 'Settings > Network & internet > Wi-Fi > Tap connected network > Advanced.',
      },
    },
    {
      title: 'Find Process by Port',
      category: 'Developer',
      desc: 'Finds which service is occupying a specific port (e.g. 3000).',
      commands: {
        win: 'netstat -ano | findstr :3000',
        mac: 'lsof -i :3000',
        linux: 'sudo lsof -i :3000 or sudo ss -tulpn | grep 3000',
        android: 'Requires termux: netstat -tlpn',
      },
    },
    {
      title: 'Check Disk Space Usage',
      category: 'Storage',
      desc: 'Displays available storage capacity and partition utilization.',
      commands: {
        win: 'wmic logicaldisk get caption, freespace, size',
        mac: 'df -h',
        linux: 'df -h',
        android: 'Settings > Storage > Free up space.',
      },
    },
    {
      title: 'Generate SSH Key Pair',
      category: 'Security',
      desc: 'Creates a modern Ed25519 cryptographic key for GitHub or remote servers.',
      commands: {
        win: 'ssh-keygen -t ed25519 -C "your_email@example.com"',
        mac: 'ssh-keygen -t ed25519 -C "your_email@example.com"',
        linux: 'ssh-keygen -t ed25519 -C "your_email@example.com"',
        android: 'In Termux: pkg install openssh && ssh-keygen -t ed25519',
      },
    },
    {
      title: 'Kill Frozen Process by Name',
      category: 'Performance',
      desc: 'Forcefully terminates an unresponsive application.',
      commands: {
        win: 'taskkill /F /IM chrome.exe',
        mac: 'killall -9 Google\\ Chrome',
        linux: 'killall -9 chrome or pkill -f chrome',
        android: 'Settings > Apps > Select app > Force Stop.',
      },
    },
  ];

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col max-h-[85vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Operating System Task Navigator
              </h3>
              <p className="text-xs text-slate-400">
                Step-by-step verified procedures for Windows, macOS, Linux, and Android.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded transition-colors"
          >
            Close [ESC]
          </button>
        </div>

        {/* Filter & OS Segmented Bar */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* OS Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            {[
              { id: 'win', label: 'Windows', icon: Laptop },
              { id: 'mac', label: 'macOS', icon: Laptop },
              { id: 'linux', label: 'Linux', icon: Terminal },
              { id: 'android', label: 'Android', icon: Smartphone },
            ].map((os) => {
              const Icon = os.icon;
              return (
                <button
                  key={os.id}
                  onClick={() => {
                    setSelectedOS(os.id as any);
                    sfx.playListeningStart();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    selectedOS === os.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{os.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Filter */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search OS tasks..."
              className="w-full bg-slate-950 px-3 py-1.5 pl-8 rounded-lg border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {filteredTasks.map((task, idx) => {
            const cmd = task.commands[selectedOS];
            return (
              <div
                key={idx}
                className="p-3.5 bg-slate-900/70 border border-slate-800/90 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                      {task.category}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100">
                      {task.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      onAskAlok(`How do I ${task.title.toLowerCase()} on ${selectedOS === 'win' ? 'Windows' : selectedOS === 'mac' ? 'macOS' : selectedOS === 'linux' ? 'Linux' : 'Android'}?`);
                      onClose();
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Ask ALOK</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400">{task.desc}</p>

                {/* Command box */}
                <div className="flex items-center justify-between bg-black/80 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300">
                  <span className="truncate mr-2">{cmd}</span>
                  <button
                    onClick={() => handleCopy(cmd)}
                    className="p-1 hover:text-white text-slate-400 shrink-0"
                    title="Copy command"
                  >
                    {copiedCmd === cmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
