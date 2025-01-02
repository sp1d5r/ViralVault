import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatSecondsToTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h:${m}m:${s}s`;
};

export const parseTimeToSeconds = (timeStr: string): number => {
  // Handle empty or invalid input
  if (!timeStr) return 0;

  const parts = timeStr.toLowerCase().split(':');
  if (parts.length !== 3) return 0;

  try {
      const hours = parseInt(parts[0].replace('h', '')) || 0;
      const minutes = parseInt(parts[1].replace('m', '')) || 0;
      const seconds = parseInt(parts[2].replace('s', '')) || 0;

      return (hours * 3600) + (minutes * 60) + seconds;
  } catch {
      return 0;
  }
};