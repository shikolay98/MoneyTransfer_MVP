import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:bg-brand-dark hover:shadow-[0_12px_28px_rgba(37,99,235,0.3)] active:scale-[0.97]',
  secondary:
    'border border-line bg-white text-ink shadow-panel hover:border-brand/50 hover:text-brand active:scale-[0.97]',
  ghost:
    'text-ink hover:bg-ink/5 active:scale-[0.97]',
  outline:
    'border-2 border-brand text-brand hover:bg-brand hover:text-white active:scale-[0.97]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

export const Button = ({
  children,
  className = '',
  fullWidth = false,
  icon,
  iconPosition = 'right',
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-spring disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
      {...props}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
};
