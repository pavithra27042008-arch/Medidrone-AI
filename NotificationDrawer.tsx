import React from 'react';
import { SmartNotification } from '../../types';
import { soundFx } from '../../utils/audio';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SmartNotification[];
  onMarkAllAsRead: () => void;
  onSelectNotification: (notif: SmartNotification) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm font-tech uppercase tracking-wider text-slate-100">
              Smart Airspace Notifications
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playClick();
                onMarkAllAsRead();
              }}
              className="text-[11px] font-mono text-teal-300 hover:text-teal-200"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              No active alerts. All flight operations nominal.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  soundFx.playClick();
                  onSelectNotification(n);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  n.read
                    ? 'bg-slate-950/40 border-slate-850 text-slate-400'
                    : n.severity === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/40 text-red-200'
                    : n.severity === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-teal-500/10 border-teal-500/40 text-teal-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {n.severity === 'CRITICAL' && <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />}
                    {n.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                    {n.severity === 'INFO' && <Info className="w-4 h-4 text-teal-400 shrink-0" />}
                    <span className="font-semibold text-xs text-slate-100">{n.title}</span>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
                </div>

                <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                  {n.message}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {n.timestamp}
                  </span>
                  {n.targetTab && (
                    <span className="text-teal-400 flex items-center gap-1 font-semibold">
                      Open Module <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
