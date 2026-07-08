import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, CheckCircle2, AlertTriangle, Info, X, 
  Sparkles, Wrench, ShieldAlert, LogIn, Award
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { getNotifications, saveNotifications } from '../utils/notificationService';

interface NotificationPopupProps {
  currentUser: UserProfile | null;
}

export default function NotificationPopup({ currentUser }: NotificationPopupProps) {
  const [activeNotifications, setActiveNotifications] = useState<AppNotification[]>([]);
  const [currentNotif, setCurrentNotif] = useState<AppNotification | null>(null);

  const checkNotifications = () => {
    if (!currentUser) {
      setActiveNotifications([]);
      setCurrentNotif(null);
      return;
    }

    const allNotifs = getNotifications();
    const userNotifs = allNotifs.filter(notif => {
      // Must target "all" or this user
      const isTarget = notif.targetUserId === 'all' || notif.targetUserId === currentUser.id;
      // Must NOT be dismissed by this user
      const isNotDismissed = !notif.dismissedBy.includes(currentUser.id);
      return isTarget && isNotDismissed;
    });

    setActiveNotifications(userNotifs);
    // Show the most recent one first
    if (userNotifs.length > 0) {
      setCurrentNotif(userNotifs[0]);
    } else {
      setCurrentNotif(null);
    }
  };

  useEffect(() => {
    checkNotifications();

    // Listen for changes
    window.addEventListener('fid_notifications_updated', checkNotifications);
    return () => {
      window.removeEventListener('fid_notifications_updated', checkNotifications);
    };
  }, [currentUser]);

  const handleDismiss = () => {
    if (!currentUser || !currentNotif) return;

    const allNotifs = getNotifications();
    const updated = allNotifs.map(n => {
      if (n.id === currentNotif.id) {
        return {
          ...n,
          dismissedBy: [...n.dismissedBy, currentUser.id]
        };
      }
      return n;
    });

    saveNotifications(updated);
    
    // Play subtle audio/feedback or just state transition
    checkNotifications();
  };

  if (!currentUser || !currentNotif) return null;

  // Choose style and icon based on notification type/content
  let icon = <Bell className="w-6 h-6 text-indigo-500" />;
  let headerBg = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40';
  let iconContainerBg = 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400';
  let badgeLabel = 'INFORMASI';
  let buttonStyle = 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500';

  const titleLower = currentNotif.title.toLowerCase();
  const msgLower = currentNotif.message.toLowerCase();

  if (currentNotif.type === 'success' || titleLower.includes('berhasil') || msgLower.includes('selamat')) {
    icon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    headerBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40';
    iconContainerBg = 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400';
    badgeLabel = 'SUKSES';
    buttonStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500';
  } else if (currentNotif.type === 'maintenance' || titleLower.includes('maintenance') || msgLower.includes('pemeliharaan')) {
    icon = <Wrench className="w-6 h-6 text-amber-500" />;
    headerBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40';
    iconContainerBg = 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400';
    badgeLabel = 'MAINTENANCE';
    buttonStyle = 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
  } else if (currentNotif.type === 'warning' || titleLower.includes('perhatian') || msgLower.includes('expired')) {
    icon = <AlertTriangle className="w-6 h-6 text-rose-500" />;
    headerBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40';
    iconContainerBg = 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400';
    badgeLabel = 'PERINGATAN';
    buttonStyle = 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500';
  }

  // Double check if login-themed
  if (titleLower.includes('masuk') || titleLower.includes('login') || msgLower.includes('login') || msgLower.includes('welcome')) {
    icon = <LogIn className="w-6 h-6 text-blue-500" />;
    headerBg = 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40';
    iconContainerBg = 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400';
    badgeLabel = 'AKSES MASUK';
    buttonStyle = 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        id="notification-popup-modal"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all duration-300 text-left"
      >
        {/* Decorative Top Accent Line */}
        <div className={`h-1.5 w-full ${
          badgeLabel === 'SUKSES' ? 'bg-emerald-500' :
          badgeLabel === 'MAINTENANCE' ? 'bg-amber-500' :
          badgeLabel === 'PERINGATAN' ? 'bg-rose-500' : 'bg-indigo-500'
        }`} />

        {/* Header/Banner Section with Icons */}
        <div className={`p-6 border-b flex gap-4 ${headerBg}`}>
          <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${iconContainerBg}`}>
            {icon}
          </div>
          <div className="space-y-1">
            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase font-mono ${
              badgeLabel === 'SUKSES' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              badgeLabel === 'MAINTENANCE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              badgeLabel === 'PERINGATAN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
              'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
            }`}>
              {badgeLabel}
            </span>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight tracking-tight mt-1">
              {currentNotif.title}
            </h3>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
            {currentNotif.message}
          </p>

          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 dark:text-slate-500 pt-3 border-t border-gray-50 dark:border-slate-800">
            <span>DIKIRIM: {new Date(currentNotif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>SYSTEM GATEWAY</span>
          </div>

          <div className="flex gap-3 pt-1 justify-end">
            <button
              onClick={handleDismiss}
              className={`w-full py-2.5 px-4 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonStyle}`}
            >
              Baik, Saya Paham
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
