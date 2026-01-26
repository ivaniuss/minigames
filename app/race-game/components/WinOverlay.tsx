import React from 'react';
import { COLORS } from '../constants';

interface WinOverlayProps {
  winner: string | null;
  onNext: () => void;
}

export const WinOverlay: React.FC<WinOverlayProps> = ({ winner, onNext }) => {
  if (!winner) return null;

  const colorData = COLORS.find(c => c.name === winner);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-500">
      <div className="text-center p-12 rounded-3xl border-2 border-white/10 bg-white/5 relative overflow-hidden group">
        {/* Animated background glow */}
        <div 
          className="absolute -inset-20 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"
          style={{ backgroundColor: colorData?.hex }}
        />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white/60 tracking-[0.5em] uppercase mb-2">Winner</h2>
          <div 
            className="text-7xl font-black mb-8 italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            style={{ color: colorData?.hex }}
          >
            {winner.toUpperCase()}
          </div>
          
          <button 
            onClick={onNext}
            className="group relative px-12 py-4 bg-white text-black font-black uppercase tracking-[0.2em] transition-all hover:pr-16 active:scale-95"
          >
            Next Race
            <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
