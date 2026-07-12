import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all active:scale-95 disabled:opacity-50
              ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-500 hover:bg-brand-600'}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/30' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500 dark:text-red-400' : 'text-brand-500 dark:text-brand-400'}`} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
