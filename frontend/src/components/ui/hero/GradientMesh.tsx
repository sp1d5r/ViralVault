import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface GradientMeshProps {
  className?: string;
  children?: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({
  className,
  children,
  primaryColor = "rgba(99, 102, 241, 0.15)", // Indigo
  secondaryColor = "rgba(167, 139, 250, 0.15)", // Purple
  accentColor = "rgba(79, 70, 229, 0.3)" // Deeper Indigo
}) => {
  return (
    <div 
      className={cn("relative w-full h-full overflow-hidden bg-black/90", className)}
    >
      {/* Base animated gradient mesh */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, ${primaryColor}, transparent 60%),
            radial-gradient(circle at 0% 0%, ${secondaryColor}, transparent 50%),
            radial-gradient(circle at 100% 100%, ${accentColor}, transparent 40%)
          `,
          backgroundSize: '120% 120%',
          filter: 'blur(60px)',
        }}
      />

      {/* Interactive glow effect */}
      <div 
        className="absolute inset-0 z-10"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
        }}
        style={{
          backgroundImage: `radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            ${accentColor} 0%,
            transparent 35%
          )`,
          '--mouse-x': '50%',
          '--mouse-y': '50%',
        } as React.CSSProperties}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 z-20 opacity-20"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)" opacity="0.4"/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
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