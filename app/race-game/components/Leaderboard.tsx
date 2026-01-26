import React from 'react';

interface LeaderboardProps {
  scores: Record<string, number>;
  colors: readonly { name: string; hex: string; symbol: string; glow: string }[];
  onStart: () => void;
  onReset: () => void;
  isRaceActive: boolean;
}


export const Leaderboard: React.FC<LeaderboardProps> = ({ scores, colors, onStart, onReset, isRaceActive }) => {
  return (
    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] w-full max-w-[220px] flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-emerald-400 tracking-[0.2em] uppercase mb-1">Food Race</h2>
        <div className="text-[10px] text-emerald-300/60 font-mono mb-2">SCOREBOARD</div>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
      </div>


      <div className="space-y-4">
        {colors.map((color) => (
          <div key={color.name} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="text-xl transition-transform group-hover:scale-125">
                {color.symbol}
              </div>
              <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                {color.name}
              </span>
            </div>
            <span className="font-mono text-lg font-black text-emerald-400">
              {scores[color.name] || 0}
            </span>
          </div>

        ))}
      </div>

      <div className="grid gap-2">
        <button 
          onClick={onStart}
          disabled={isRaceActive}
          className={`w-full py-4 px-6 rounded-xl font-black text-black uppercase tracking-widest transition-all
            ${isRaceActive 
              ? 'bg-gray-700 cursor-not-allowed opacity-50' 
              : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
        >
          {isRaceActive ? 'Racing...' : 'Start'}
        </button>

        <button 
          onClick={onReset}
          className="w-full py-2 px-4 rounded-xl font-bold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all text-xs uppercase tracking-tighter"
        >
          Reset Game
        </button>
      </div>

      
      <div className="mt-auto pt-4 border-t border-emerald-500/20">
        <p className="text-[10px] text-emerald-500/60 leading-tight italic">
          PERPETUAL RACE <br/> CIRCUIT SIMULATION
        </p>
      </div>
    </div>
  );
};
