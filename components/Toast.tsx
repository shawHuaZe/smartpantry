import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

    const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setIsVisible(true);
        return () => setIsVisible(false);
    }, []);

    const getToastStyles = (): string => {
        const baseStyles = 'pointer-events-auto transform transition-all duration-300 ease-out backdrop-blur-xl border shadow-2xl';

        const typeStyles: Record<ToastType, string> = {
            success: 'bg-green-500/90 border-green-400/30 text-white',
            error: 'bg-red-500/90 border-red-400/30 text-white',
            info: 'bg-primary/90 border-primary/30 text-white',
            warning: 'bg-orange-500/90 border-orange-400/30 text-white'
        };

        const animationStyles = isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-4 opacity-0 scale-95';

        return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
    };

    const getIcon = (): string => {
        const icons: Record<ToastType, string> = {
            success: 'check_circle',
            error: 'error',
            info: 'info',
            warning: 'warning'
        };
        return icons[type];
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center gap-3 px-4 py-3 max-w-md mx-auto">
                <span className="material-symbols-outlined text-xl flex-shrink-0">
                    {getIcon()}
                </span>
                <p className="flex-1 text-sm font-medium">{message}</p>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>
        </div>
    );
};
