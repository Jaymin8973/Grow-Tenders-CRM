'use client';

import { HTMLAttributes, forwardRef, useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    width?: string;
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
    ({ className, isOpen, onClose, title, width = '480px', children, ...props }, ref) => {
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

        return (
            <>
                <div className="drawer-overlay" onClick={onClose} />
                <div
                    ref={ref}
                    className={cn('drawer', className)}
                    style={{ width }}
                    {...props}
                >
                    {title && (
                        <div className="drawer-header">
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X size={20} />
                            </Button>
                        </div>
                    )}
                    <div className="drawer-body">{children}</div>
                </div>
            </>
        );
    }
);

Drawer.displayName = 'Drawer';

export { Drawer };
export type { DrawerProps };
