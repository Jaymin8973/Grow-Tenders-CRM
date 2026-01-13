import { HTMLAttributes, forwardRef } from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ className, src, alt, name, size = 'md', ...props }, ref) => {
        const sizeClass = size !== 'md' ? `avatar-${size}` : '';

        return (
            <div ref={ref} className={cn('avatar', sizeClass, className)} {...props}>
                {src ? (
                    <img src={src} alt={alt || name || 'Avatar'} />
                ) : name ? (
                    getInitials(name)
                ) : (
                    '?'
                )}
            </div>
        );
    }
);

Avatar.displayName = 'Avatar';

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
    max?: number;
}

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
    ({ className, children, max = 4, ...props }, ref) => {
        const childArray = Array.isArray(children) ? children : [children];
        const visible = childArray.slice(0, max);
        const remaining = childArray.length - max;

        return (
            <div
                ref={ref}
                className={cn('flex -space-x-2', className)}
                {...props}
            >
                {visible}
                {remaining > 0 && (
                    <div className="avatar avatar-sm" style={{ background: 'var(--gray-200)', color: 'var(--gray-600)' }}>
                        +{remaining}
                    </div>
                )}
            </div>
        );
    }
);

AvatarGroup.displayName = 'AvatarGroup';

export { Avatar, AvatarGroup };
