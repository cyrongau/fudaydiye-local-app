
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    return (
        <ToastContext.Provider value={{
            toast: addToast,
            success: (msg) => addToast(msg, 'success'),
            error: (msg) => addToast(msg, 'error')
        }}>
            {children}
            <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto min-w-[320px] bg-white dark:bg-surface-dark border ${t.type === 'success' ? 'border-primary/20 bg-primary/5' : t.type === 'error' ? 'border-red-500/20 bg-red-500/5' : 'border-gray-100 dark:border-white/10'} shadow-xl rounded-2xl p-5 flex items-start gap-4 animate-in slide-in-from-right-10 fade-in duration-500`}>
                        <div className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${t.type === 'success' ? 'bg-primary text-secondary' : t.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                            <span className="material-symbols-outlined">{t.type === 'success' ? 'check' : t.type === 'error' ? 'error' : 'info'}</span>
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${t.type === 'success' ? 'text-primary' : t.type === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                                {t.type === 'success' ? 'Success' : t.type === 'error' ? 'System Error' : 'Notification'}
                            </p>
                            <p className="text-xs font-bold text-secondary dark:text-white leading-relaxed">{t.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
