import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',

                    // Variants
                    variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:bg-indigo-800',
                    variant === 'secondary' && 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm',
                    variant === 'outline' && 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
                    variant === 'ghost' && 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                    variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700 shadow-sm',

                    // Sizes
                    size === 'sm' && 'h-8 px-3 text-xs',
                    size === 'md' && 'h-10 px-4 py-2 text-sm',
                    size === 'lg' && 'h-12 px-6 text-base',
                    size === 'icon' && 'h-10 w-10 p-2',

                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
