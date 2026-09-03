import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'tactical' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }[size];

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    tactical: 'bg-amber-600/20 text-amber-300 border border-amber-500/40 font-bold',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
