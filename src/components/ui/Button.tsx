import React from 'react';
import { soundManager } from '../../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'tactical';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  sound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  sound = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (sound) soundManager.playClick();
    onClick?.(e);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer select-none';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-bold tracking-wide',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 border border-blue-400/30',
    secondary:
      'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/60 shadow-sm hover:border-slate-600',
    tactical:
      'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-50 font-bold uppercase tracking-wider border border-amber-400/40 shadow-lg shadow-amber-900/30',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-red-500/20 border border-rose-400/30',
  }[variant];

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      {children}
    </button>
  );
};
