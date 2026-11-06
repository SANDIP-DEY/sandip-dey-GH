import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, RefreshCw, Clock, Terminal } from 'lucide-react';
import { AuditLogItem } from '../types/shipping';

interface AuditLogDrawerProps {
  onClose: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/shipping/audit-log');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security Audit Ledger</h3>
              <p className="text-xs text-slate-500 font-mono">Immutable Compliance Log</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No audit events recorded.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-slate-900 uppercase">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {log.details || 'System audit checkpoint.'}
                </p>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Actor: {log.actor}</span>
                  {log.recordId && <span>Ref: {log.recordId}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            SOC 2 / GDPR Compliant Logging
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
