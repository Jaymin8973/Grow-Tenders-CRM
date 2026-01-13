import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'flat';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-xl border transition-all duration-200',
                    // Variants
                    variant === 'default' && 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md',
                    variant === 'elevated' && 'bg-white dark:bg-gray-900 border-transparent shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
                    variant === 'flat' && 'bg-gray-50 dark:bg-gray-800/50 border-transparent',
                    className
                )}
                {...props}
            />
        );
    }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('flex flex-col space-y-1.5 p-6', className)}
                {...props}
            />
        );
    }
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> { }

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, ...props }, ref) => {
        return (
            <h3
                ref={ref}
                className={cn('font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100', className)}
                {...props}
            />
        );
    }
);

CardTitle.displayName = 'CardTitle';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, ...props }, ref) => {
        return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
    }
);

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
