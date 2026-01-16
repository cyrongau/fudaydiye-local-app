import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDestructive = false
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`size-16 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined text-3xl font-black">
                            {isDestructive ? 'warning' : 'help'}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight mb-2">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-secondary dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95 text-white ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-secondary hover:bg-black'}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};


export default ConfirmationModal;
