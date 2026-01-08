
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'INFO') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-right duration-300 ${toast.type === 'SUCCESS' ? 'bg-secondary text-primary border border-secondary' :
                                toast.type === 'ERROR' ? 'bg-red-500 text-white border border-red-600' :
                                    toast.type === 'WARNING' ? 'bg-amber-500 text-white border border-amber-600' :
                                        'bg-white dark:bg-surface-dark text-secondary dark:text-white border border-gray-100 dark:border-white/10'
                            }`}
                    >
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'SUCCESS' ? 'bg-primary text-secondary' :
                                toast.type === 'ERROR' ? 'bg-white/20 text-white' :
                                    toast.type === 'WARNING' ? 'bg-white/20 text-white' :
                                        'bg-gray-100 dark:bg-white/5 text-gray-500'
                            }`}>
                            <span className="material-symbols-outlined font-black">
                                {toast.type === 'SUCCESS' ? 'check' :
                                    toast.type === 'ERROR' ? 'error' :
                                        toast.type === 'WARNING' ? 'warning' : 'info'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${toast.type === 'SUCCESS' ? 'text-primary' :
                                    toast.type === 'ERROR' || toast.type === 'WARNING' ? 'text-white' : 'text-gray-400'
                                }`}>
                                {toast.type} Node Info
                            </h4>
                            <p className={`text-xs font-bold leading-tight ${toast.type === 'SUCCESS' ? 'text-white' :
                                    toast.type === 'ERROR' || toast.type === 'WARNING' ? 'text-white/90' : 'text-secondary dark:text-gray-300'
                                }`}>{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className={`size-8 rounded-full flex items-center justify-center transition-colors ${toast.type === 'SUCCESS' ? 'hover:bg-primary/20 text-primary' :
                                toast.type === 'ERROR' || toast.type === 'WARNING' ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-gray-400'
                            }`}>
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
