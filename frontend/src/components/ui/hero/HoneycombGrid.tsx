import React from 'react';
import { cn } from '../../../lib/utils';

interface HoneycombGridProps {
  className?: string;
  children?: React.ReactNode;
  glowColor?: string;
}

export const HoneycombGrid: React.FC<HoneycombGridProps> = ({
  className,
  children,
  glowColor = "rgba(79, 70, 229, 0.3)"
}) => {
  return (
    <div 
      className={cn("relative w-full h-full overflow-hidden", className)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
      }}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      } as React.CSSProperties}
    >
      {/* Base honeycomb grid with dots */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, ${glowColor} 1px, transparent 1.5px),
            linear-gradient(to right, ${glowColor} 1px, transparent 1px),
            linear-gradient(60deg, ${glowColor} 1px, transparent 1px),
            linear-gradient(-60deg, ${glowColor} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 50px 50px, 50px 50px',
          backgroundPosition: '0 0, 0 0, 0 0, 0 0',
          opacity: 0.3,
          transform: 'rotate(30deg) scale(2)',
        }}
      />
      
      {/* Offset grid for honeycomb effect */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, ${glowColor} 1px, transparent 1.5px),
            linear-gradient(to right, ${glowColor} 1px, transparent 1px),
            linear-gradient(60deg, ${glowColor} 1px, transparent 1px),
            linear-gradient(-60deg, ${glowColor} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 50px 50px, 50px 50px, 50px 50px',
          backgroundPosition: '25px 25px, 25px 25px, 25px 25px, 25px 25px',
          opacity: 0.3,
          transform: 'rotate(30deg) scale(2)',
        }}
      />

      {/* Mouse glow effect */}
      <div 
        className="absolute inset-0 bg-transparent z-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${glowColor} 0%,
            transparent 50%
          )`,
        }}
      />

      {/* Content layer */}
      {children && (
        <div className="relative z-30">
          {children}
        </div>
      )}
    </div>
  );
};