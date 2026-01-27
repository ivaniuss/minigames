import React from 'react';
import { COLORS } from '../constants';

interface StartOverlayProps {
  onStart: () => void;
  title: string;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart, title }) => {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-500">
      <div className="max-w-2xl w-full p-12 rounded-[40px] border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 w-full flex flex-col items-center">
          <h2 className="text-[10px] font-black text-emerald-500 tracking-[0.5em] uppercase mb-4">Simulation Ready</h2>
          <h1 className="text-6xl font-black text-white italic tracking-tighter mb-12 text-center drop-shadow-2xl">
            {title.toUpperCase()}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 w-full">
            {COLORS.map((duck) => (
              <div key={duck.name} className="flex flex-col items-center group">
                <div className="relative mb-4">
                    <div 
                        className="absolute inset-0 blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
                        style={{ backgroundColor: duck.hex }}
                    />
                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 p-4 transition-transform group-hover:scale-110 group-hover:-rotate-3 flex items-center justify-center overflow-hidden">
                        <img src={duck.image} alt={duck.name} className="w-full h-full object-contain" />
                    </div>
                </div>
                <span className="text-xs font-black text-white/40 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                  {duck.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">
                  Competitor
                </span>
              </div>
            ))}
          </div>

          <button 
            onClick={onStart}
            className="group relative px-16 py-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(16,185,129,0.3)] rounded-2xl overflow-hidden"
          >
            <span className="relative z-10">Start Race</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          <div className="mt-12 flex gap-4">
            <a 
              href="/" 
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              🏠 Main Menu
            </a>
            <a 
              href="/race-game/editor" 
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              🛠️ Level Editor
            </a>
          </div>

          <p className="mt-8 text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">
            Press <span className="text-emerald-500/60">SPACE</span> or <span className="text-emerald-500/60">CLICK</span> to begin
          </p>
        </div>
      </div>
    </div>
  );
};
