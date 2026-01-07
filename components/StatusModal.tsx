import React from 'react';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'SUCCESS' | 'ERROR';
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose, title, message, type = 'SUCCESS' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`size-16 rounded-full flex items-center justify-center ${type === 'SUCCESS' ? 'bg-green-100 dark:bg-green-500/20 text-green-600' : 'bg-red-100 dark:bg-red-500/20 text-red-500'}`}>
                        <span className="material-symbols-outlined text-3xl font-black">
                            {type === 'SUCCESS' ? 'check_circle' : 'error'}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight mb-2">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{message}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95 ${type === 'SUCCESS' ? 'bg-secondary text-white hover:bg-black' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                        {type === 'SUCCESS' ? 'Continue' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusModal;
