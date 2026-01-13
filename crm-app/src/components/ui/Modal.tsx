'use client';

import { HTMLAttributes, forwardRef, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: ReactNode;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
    ({ className, isOpen, onClose, title, size = 'md', footer, children, ...props }, ref) => {
        useEffect(() => {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };

            if (isOpen) {
                document.addEventListener('keydown', handleEsc);
                document.body.style.overflow = 'hidden';
            }

            return () => {
                document.removeEventListener('keydown', handleEsc);
                document.body.style.overflow = '';
            };
        }, [isOpen, onClose]);

        if (!isOpen) return null;

        const sizeStyles = {
            sm: { maxWidth: '400px' },
            md: { maxWidth: '560px' },
            lg: { maxWidth: '720px' },
            xl: { maxWidth: '960px' },
        };

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={onClose}
            >
                <div
                    ref={ref}
                    className={cn(
                        'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200',
                        className
                    )}
                    style={sizeStyles[size]}
                    onClick={(e) => e.stopPropagation()}
                    {...props}
                >
                    {title && (
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <X size={18} />
                            </Button>
                        </div>
                    )}
                    <div className="p-4 overflow-y-auto flex-1">{children}</div>
                    {footer && <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2 rounded-b-xl">{footer}</div>}
                </div>
            </div>
        );
    }
);

Modal.displayName = 'Modal';

export { Modal };
export type { ModalProps };
