import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

interface PlasmaBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const PlasmaBackground: React.FC<PlasmaBackgroundProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
      {/* Multiple animated layers */}
      <motion.div 
        className="absolute inset-0 opacity-70"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(167, 139, 250, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.5) 0%, transparent 50%)
          `,
          filter: 'blur(30px)',
        }}
      />

      {/* Second rotating layer */}
      <motion.div 
        className="absolute inset-0 opacity-70"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [0, -90, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 100% 0%, rgba(168, 85, 247, 0.6) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(147, 51, 234, 0.6) 0%, transparent 50%)
          `,
          filter: 'blur(30px)',
        }}
      />

      {/* Floating particles */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, black 100%)',
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </motion.div>

      {/* Animated grain overlay */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%\' height=\'100%\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Content */}
      {children && (
        <div className="relative z-10 min-h-[80vh] flex justify-center items-center">
          {children}
        </div>
      )}
    </div>
  );
}; 