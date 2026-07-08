import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with a subtle blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden text-left"
          >
            {/* Close Icon Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex gap-4 items-start mt-2">
              <div className={`p-3 rounded-xl shrink-0 ${
                type === 'danger' ? 'bg-red-50 text-red-600' :
                type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-display font-bold text-lg text-brand-dark leading-tight">
                  {title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-55 border border-gray-200 rounded-xl transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer ${
                  type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' :
                  type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-100' :
                  'bg-brand-primary hover:bg-brand-primary-dark shadow-brand-primary-light'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
