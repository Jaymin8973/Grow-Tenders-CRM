import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'neutral', ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn('badge', `badge-${variant}`, className)}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
