import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

interface ConfirmContextType {
    showConfirm: (options: ConfirmDialogOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const showConfirm = useCallback((options: ConfirmDialogOptions) => {
        setDialog(options);
        // Small delay to trigger animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    const handleConfirm = () => {
        setIsVisible(false);
        setTimeout(() => {
            dialog?.onConfirm();
            setDialog(null);
        }, 200);
    };

    const handleCancel = () => {
        setIsVisible(false);
        setTimeout(() => {
            dialog?.onCancel?.();
            setDialog(null);
        }, 200);
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && dialog) {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [dialog]);

    return (
        <ConfirmContext.Provider value={{ showConfirm }}>
            {children}
            {dialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
                            isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={handleCancel}
                    />

                    {/* Dialog */}
                    <div
                        className={`relative bg-slate-900 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl transition-all duration-200 ${
                            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                        }`}
                    >
                        <div className="p-6">
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                    dialog.type === 'danger'
                                        ? 'bg-red-500/20'
                                        : dialog.type === 'warning'
                                        ? 'bg-orange-500/20'
                                        : 'bg-primary/20'
                                }`}>
                                    <span className={`material-symbols-outlined text-3xl ${
                                        dialog.type === 'danger'
                                            ? 'text-red-500'
                                            : dialog.type === 'warning'
                                            ? 'text-orange-500'
                                            : 'text-primary'
                                    }`}>
                                        {dialog.type === 'danger' ? 'warning' : 'help'}
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-white text-center mb-2">
                                {dialog.title}
                            </h3>

                            {/* Message */}
                            <p className="text-slate-400 text-center text-sm mb-6 whitespace-pre-line">
                                {dialog.message}
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 active:scale-[0.98] transition-all"
                                >
                                    {dialog.cancelText || '取消'}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium active:scale-[0.98] transition-all ${
                                        dialog.type === 'danger'
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                                >
                                    {dialog.confirmText || '确定'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
