import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmationModal from './ConfirmationModal';
import StatusModal from './StatusModal';

interface ConfirmationOptions {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

interface StatusOptions {
    title: string;
    message: string;
    type?: 'SUCCESS' | 'ERROR';
}

interface ModalContextType {
    confirm: (options: ConfirmationOptions) => void;
    status: (options: StatusOptions) => void;
    closeConfirm: () => void;
    closeStatus: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [confirmProps, setConfirmProps] = useState<ConfirmationOptions | null>(null);
    const [statusProps, setStatusProps] = useState<StatusOptions | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const confirm = (options: ConfirmationOptions) => {
        setConfirmProps(options);
        setIsConfirmOpen(true);
    };

    const status = (options: StatusOptions) => {
        setStatusProps(options);
        setIsStatusOpen(true);
    };

    const closeConfirm = () => {
        setIsConfirmOpen(false);
        // Optional: clear props after timeout for animation, but safe to leave
    };

    const closeStatus = () => {
        setIsStatusOpen(false);
    };

    return (
        <ModalContext.Provider value={{ confirm, status, closeConfirm, closeStatus }}>
            {children}

            {confirmProps && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={closeConfirm}
                    onConfirm={confirmProps.onConfirm}
                    title={confirmProps.title}
                    message={confirmProps.message}
                    confirmLabel={confirmProps.confirmLabel}
                    cancelLabel={confirmProps.cancelLabel}
                    isDestructive={confirmProps.isDestructive}
                />
            )}

            {statusProps && (
                <StatusModal
                    isOpen={isStatusOpen}
                    onClose={closeStatus}
                    title={statusProps.title}
                    message={statusProps.message}
                    type={statusProps.type}
                />
            )}
        </ModalContext.Provider>
    );
};
