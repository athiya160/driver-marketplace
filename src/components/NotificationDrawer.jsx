import React from 'react';
import { Bell, X, Check, ShieldCheck, Clock, CheckCircle2, Car, CreditCard, Sparkles } from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onClearAll,
  onSelectNotification
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">In-App Notifications</h3>
                <p className="text-[10px] text-slate-400">Live Indian Chauffeur Dispatches & Alerts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between items-center mb-3 text-xs">
            <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
              Recent Alerts ({notifications.length})
            </span>
            <button
              onClick={onClearAll}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
            >
              Mark all read
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5 max-h-[75vh] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectNotification(item)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                    item.read
                      ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      : 'bg-slate-950 border-brand-500/30 text-slate-200 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-brand-400">
                      {item.type === 'booking' ? <Clock className="w-3.5 h-3.5 text-brand-400" /> :
                       item.type === 'driver' ? <Car className="w-3.5 h-3.5 text-amber-400" /> :
                       item.type === 'payment' ? <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> :
                       <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-[11px] text-white truncate">{item.title}</h4>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
          🔔 Push notifications powered by Salman Driver Dispatch Engine • 24x7 Active
        </div>

      </div>
    </div>
  );
}
