import React, { useEffect, useState } from 'react';

interface SystemAlertProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'CONFIRM';
    onConfirm?: () => void;
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
    customSlot?: React.ReactNode;
}

const SystemAlert: React.FC<SystemAlertProps> = ({
    isOpen,
    title,
    message,
    type = 'INFO',
    onConfirm,
    onClose,
    confirmText = 'Proceeed',
    cancelText = 'Cancel',
    customSlot
}) => {
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        setShow(isOpen);
    }, [isOpen]);

    if (!show) return null;

    const getIcon = () => {
        switch (type) {
            case 'SUCCESS': return 'check_circle';
            case 'DANGER': return 'error';
            case 'WARNING': return 'warning';
            case 'CONFIRM': return 'help';
            default: return 'info';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'SUCCESS': return 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400';
            case 'DANGER': return 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400';
            case 'WARNING': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
            case 'CONFIRM': return 'bg-primary/10 text-primary dark:bg-primary/20';
            default: return 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content - Slide up on mobile, Center on desktop */}
            <div className="relative z-10 w-full md:max-w-sm bg-white dark:bg-surface-dark rounded-t-[32px] md:rounded-[32px] p-6 pb-10 md:pb-6 shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300 border-t md:border border-gray-100 dark:border-white/10">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`size-14 rounded-[20px] flex items-center justify-center ${getColors()} mb-2`}>
                        <span className="material-symbols-outlined text-[32px] font-black">
                            {getIcon()}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none mb-2">{title}</h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px] mx-auto">{message}</p>
                    </div>

                    <div className="flex gap-3 w-full mt-4">
                        {customSlot ? (
                            <div className="w-full flex flex-col gap-3">{customSlot}</div>
                        ) : (
                            <>
                                {(type === 'CONFIRM' || type === 'DANGER' || type === 'WARNING') && (
                                    <button
                                        onClick={onClose}
                                        className="flex-1 h-12 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        else onClose();
                                    }}
                                    className={`flex-1 h-12 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-surface-dark ${type === 'DANGER' ? 'bg-red-500 focus:ring-red-500' :
                                            type === 'SUCCESS' ? 'bg-green-500 focus:ring-green-500' :
                                                'bg-secondary dark:bg-white dark:text-secondary focus:ring-secondary'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile Handle Indicator */}
                <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-200 dark:bg-white/10 rounded-full"></div>
            </div>
        </div>
    );
};

export default SystemAlert;
