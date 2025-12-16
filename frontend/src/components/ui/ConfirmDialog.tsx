import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!open) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    const iconColors = {
        danger: 'text-destructive',
        warning: 'text-yellow-600',
        info: 'text-primary'
    };

    const buttonColors = {
        danger: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        info: 'bg-primary hover:bg-primary/90 text-primary-foreground'
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

            {/* Dialog */}
            <div className="relative bg-background border border-border rounded-lg shadow-lg p-6 max-w-md w-full mx-4 z-50">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Icon and content */}
                <div className="flex items-start gap-4">
                    <div className={`shrink-0 ${iconColors[type]}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-2">{title}</h2>
                        <p className="text-sm text-muted-foreground">{message}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${buttonColors[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;