import React, { useState } from 'react';
import { Layers, Wifi, WifiOff, Copy, Check, UserCheck, RefreshCw, Cpu } from 'lucide-react';
import { formatClientId } from '../utils/clientId';

export function Header({ clientId, onResetClientId, isConnected, stats }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">CSV Queue Engine</h1>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  All-Reduce
                </span>
              </div>
              <p className="text-xs text-slate-400">Multi-User Priority Scheduling & Worker Threads</p>
            </div>
          </div>

          {/* Connection status (mobile) */}
          <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-800/80 border border-slate-700">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 text-xs font-medium">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Client Identity & Stats Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Worker threads metric */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Workers:</span>
            <span className="font-mono font-semibold text-white">
              {stats.activeWorkers} / {stats.totalWorkers} busy
            </span>
          </div>

          {/* Connection Status Badge (Desktop) */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Socket Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Disconnected</span>
              </>
            )}
          </div>

          {/* Persistent Client ID Session Tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-700/50 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Your ID:</span>
              <span className="font-mono font-semibold text-indigo-200">
                {formatClientId(clientId)}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              title="Copy Full Client UUID"
              className="p-1 text-indigo-300 hover:text-white rounded hover:bg-indigo-900/60 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onResetClientId}
              title="Simulate New Client (Generates new session UUID)"
              className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800/80 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
