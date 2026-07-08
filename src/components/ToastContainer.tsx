import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../utils/toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none no-print">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Info className="w-5 h-5 text-blue-500" />;
          let borderStyle = 'border-blue-500/20';
          let bgStyle = 'bg-slate-900/95 backdrop-blur-md text-white';
          let accentBar = 'bg-blue-500';

          if (toast.type === 'success') {
            icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
            borderStyle = 'border-emerald-500/20';
            accentBar = 'bg-emerald-500';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-400" />;
            borderStyle = 'border-rose-500/20';
            accentBar = 'bg-rose-500';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
            borderStyle = 'border-amber-500/20';
            accentBar = 'bg-amber-500';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`pointer-events-auto relative flex items-start gap-3.5 p-4 rounded-2xl border shadow-xl ${bgStyle} ${borderStyle} overflow-hidden`}
              style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)' }}
            >
              {/* Left Accent Bar */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${accentBar}`} />
              
              {/* Icon */}
              <div className="shrink-0 pt-0.5 ml-1">
                {icon}
              </div>

              {/* Message */}
              <div className="flex-1 pr-6">
                <p className="text-xs font-semibold leading-relaxed">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onClose(toast.id)}
                className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
