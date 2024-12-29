import React, { useEffect, useRef } from 'react';

interface DataWaveBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  waveIdx: number;
}

export const DataWaveBackground: React.FC<DataWaveBackgroundProps> = ({ 
  className,
  children 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match display size
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particles: Particle[] = [];
    const particleCount = 50; // Adjust for more/fewer particles

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: 0, // Will be set in animation
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
        waveIdx: Math.floor(Math.random() * 3) // Assign to one of three waves
      });
    }

    let time = 0;
    let animationFrameId: number;

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      
      // Clear canvas with slight fade effect
      ctx.fillStyle = 'rgba(3, 7, 17, 0.1)'; // Dark background with alpha
      ctx.fillRect(0, 0, width, height);

      // Wave parameters
      const waves = [
        { amplitude: 20, frequency: 0.02, speed: 2, color: '#4C1D95' },
        { amplitude: 15, frequency: 0.03, speed: 3, color: '#2563EB' },
        { amplitude: 10, frequency: 0.04, speed: 6, color: '#7C3AED' }
      ];

      // Draw waves
      waves.forEach(({ amplitude, frequency, speed, color }, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const points: [number, number][] = [];

        for (let x = 0; x < width; x++) {
          const y = height / 2 + 
            amplitude * Math.sin(x * frequency + time * speed) +
            amplitude * Math.cos((x * frequency + time * speed) * 0.5);
          
          points.push([x, y]);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Update and draw particles for this wave
        particles.forEach(particle => {
          if (particle.waveIdx === idx) {
            // Move particles
            particle.x += particle.speed;
            if (particle.x > width) {
              particle.x = 0;
            }

            // Find y position on wave
            const pointIndex = Math.floor((particle.x / width) * points.length);
            const waveY = points[pointIndex]?.[1] || height / 2;
            particle.y = waveY;

            // Draw particle with glow effect
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(
              particle.x, particle.y, 0,
              particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      time += 0.05;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.9 }}
      />
      <div className="relative z-10 flex justify-center items-center min-h-[80vh] h-full w-full">
        {children}
      </div>
    </div>
  );
};