import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, Info, X, 
  Wrench, LogIn, Check, Trash2, Calendar
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { getNotifications, saveNotifications, syncNotifications } from '../utils/notificationService';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface NotificationCenterProps {
  currentUser: UserProfile | null;
}

export default function NotificationCenter({ currentUser }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    if (!currentUser) {
      setNotifications([]);
      setActiveCount(0);
      return;
    }

    const all = getNotifications();
    
    // Filter to notifications targeting this user or 'all'
    const targetNotifs = all.filter(n => n.targetUserId === 'all' || n.targetUserId === currentUser.id);
    
    setNotifications(targetNotifs);

    // Active (unread) count is notifications not dismissed yet
    const unreadCount = targetNotifs.filter(n => !n.dismissedBy.includes(currentUser.id)).length;
    setActiveCount(unreadCount);
  };

  useEffect(() => {
    syncNotifications().then(() => loadNotifications());

    const handleUpdate = () => {
      loadNotifications();
    };
    
    const interval = setInterval(() => {
      syncNotifications().then(() => loadNotifications());
    }, 2000);

    window.addEventListener('fid_notifications_updated', handleUpdate);
    
    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('fid_notifications_updated', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser]);

  if (!currentUser) return null;

  const handleDismiss = (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const all = getNotifications();
    const updated = all.map(n => {
      if (n.id === notifId) {
        if (!n.dismissedBy.includes(currentUser.id)) {
          return {
            ...n,
            dismissedBy: [...n.dismissedBy, currentUser.id]
          };
        }
      }
      return n;
    });

    saveNotifications(updated);
    // Notify application
    window.dispatchEvent(new Event('fid_notifications_updated'));
  };

  const handleDismissAll = () => {
    const all = getNotifications();
    const updated = all.map(n => {
      const matchesTarget = n.targetUserId === 'all' || n.targetUserId === currentUser.id;
      if (matchesTarget && !n.dismissedBy.includes(currentUser.id)) {
        return {
          ...n,
          dismissedBy: [...n.dismissedBy, currentUser.id]
        };
      }
      return n;
    });

    saveNotifications(updated);
    window.dispatchEvent(new Event('fid_notifications_updated'));
  };

  const handleDeleteAllHistory = () => {
    const all = getNotifications();
    // For this specific user, we want to completely hide dismissed notifications from their own view list.
    // Since we save in a global localStorage list, we can just filter out notifications that target this user and are dismissed, 
    // or keep targetUserId='all' but marked with a special ignore list.
    // A simpler approach is to delete notifications entirely from localStorage if they target ONLY this user and are dismissed, 
    // or if they target 'all' we can add the user to a 'deletedBy' array (let's just clear our local list for safety).
    // Let's keep it safe: remove any private notification for this user that is already dismissed.
    const updated = all.filter(n => {
      const isPrivate = n.targetUserId === currentUser.id;
      const isDismissed = n.dismissedBy.includes(currentUser.id);
      return !(isPrivate && isDismissed);
    });

    saveNotifications(updated);
    window.dispatchEvent(new Event('fid_notifications_updated'));
  };

  // Helper to choose style and icon based on notification type/content
  const getNotifDetails = (notif: AppNotification) => {
    const titleLower = notif.title.toLowerCase();
    const msgLower = notif.message.toLowerCase();
    
    let icon = <Bell className="w-4 h-4 text-indigo-500" />;
    let iconBg = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400';
    let label = 'Info';

    if (notif.type === 'success' || titleLower.includes('berhasil') || msgLower.includes('selamat')) {
      icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      iconBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400';
      label = 'Sukses';
    } else if (notif.type === 'maintenance' || titleLower.includes('maintenance') || msgLower.includes('pemeliharaan')) {
      icon = <Wrench className="w-4 h-4 text-amber-500" />;
      iconBg = 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400';
      label = 'Maintenance';
    } else if (notif.type === 'warning' || titleLower.includes('perhatian') || msgLower.includes('expired')) {
      icon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
      iconBg = 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400';
      label = 'Penting';
    } else if (titleLower.includes('masuk') || titleLower.includes('login') || msgLower.includes('welcome')) {
      icon = <LogIn className="w-4 h-4 text-blue-500" />;
      iconBg = 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400';
      label = 'Sistem';
    }

    return { icon, iconBg, label };
  };

  const unreadNotifs = notifications.filter(n => !n.dismissedBy.includes(currentUser.id));
  const readNotifs = notifications.filter(n => n.dismissedBy.includes(currentUser.id));

  return (
    <div className="relative no-print" ref={dropdownRef} id="notification-center-trigger">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center relative ${
          isOpen 
            ? 'bg-brand-primary-light/50 border-brand-primary text-brand-primary shadow-sm' 
            : 'bg-white border-gray-100 text-gray-500 hover:text-brand-primary hover:bg-gray-50'
        }`}
        title="Pusat Notifikasi"
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread indicator badge */}
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white animate-fade-in shadow-sm font-mono">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div 
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 text-left transform origin-top-right transition-all animate-fade-in"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-2">
                📢 Pusat Notifikasi
              </h3>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">SINKRONISASI REAL-TIME</p>
            </div>
            
            <div className="flex gap-2">
              {unreadNotifs.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="px-2.5 py-1 text-[10px] font-black text-brand-primary bg-brand-primary-light/40 hover:bg-brand-primary-light rounded-lg transition-colors cursor-pointer"
                  title="Tandai semua sudah dibaca"
                >
                  Selesai Semua
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 font-sans">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-300 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500">Belum ada notifikasi</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Notifikasi penagihan, status paket, dan info sistem akan muncul di sini.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Active (Unread) Notifications */}
                {unreadNotifs.length > 0 && (
                  <div className="bg-amber-50/20">
                    <div className="px-4 py-2 bg-amber-50/40 text-[9px] font-black tracking-wider text-amber-800 uppercase font-mono border-b border-gray-50">
                      BELUM DIBACA ({unreadNotifs.length})
                    </div>
                    {unreadNotifs.map(notif => {
                      const details = getNotifDetails(notif);
                      return (
                        <div 
                          key={notif.id} 
                          className="p-4 flex gap-3 hover:bg-gray-50/60 transition-colors group relative"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${details.iconBg}`}>
                            {details.icon}
                          </div>
                          <div className="space-y-1 pr-6 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-extrabold text-gray-900 leading-tight">
                                {notif.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              <span>•</span>
                              <span className="uppercase text-[8px] font-black text-brand-primary">{details.label}</span>
                            </div>
                          </div>

                          {/* Quick dismiss button */}
                          <button
                            onClick={(e) => handleDismiss(notif.id, e)}
                            className="absolute right-4 top-4 p-1 rounded-md bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-100 shadow-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                            title="Tandai Sudah Dibaca"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Read/Dismissed Notifications (History) */}
                {readNotifs.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-[9px] font-black tracking-wider text-gray-400 uppercase font-mono border-b border-gray-50 flex justify-between items-center">
                      <span>HISTORI NOTIFIKASI ({readNotifs.length})</span>
                      <button 
                        onClick={handleDeleteAllHistory}
                        className="text-[8px] hover:text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                        title="Bersihkan histori"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        Bersihkan
                      </button>
                    </div>
                    {readNotifs.map(notif => {
                      const details = getNotifDetails(notif);
                      return (
                        <div 
                          key={notif.id} 
                          className="p-4 flex gap-3 hover:bg-gray-50/30 transition-colors opacity-60"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                            {details.icon}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h4 className="text-xs font-bold text-gray-500 leading-tight line-through">
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400 pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(notif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              <span>•</span>
                              <span className="uppercase text-[8px] font-bold">SUDAH DIBACA</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-3 border-t border-gray-50 text-center bg-gray-50/30">
            <span className="text-[9px] text-gray-400 font-mono">
              Fid Invoice Smart Notification Center © 2026
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
