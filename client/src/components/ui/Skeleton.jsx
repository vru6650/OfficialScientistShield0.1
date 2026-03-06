import React from 'react';

export default function Skeleton({
  className = '',
  variant = 'text', // 'text' | 'rect' | 'circle'
  width,
  height,
  rounded,
  lines = 1,
}) {
  const base = 'relative overflow-hidden bg-ink-200/60 dark:bg-slate-700/50';
  const shimmer = 'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/10 before:to-transparent';

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${base} ${shimmer} h-4 w-full rounded radius-md`}
          />
        ))}
      </div>
    );
  }

  const style = {
    width,
    height,
  };

  const shape = variant === 'circle' ? 'rounded-full' : rounded ? rounded : 'rounded-md';

  return <div className={`${base} ${shimmer} ${shape} ${className}`} style={style} />;
}
