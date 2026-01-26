import React from 'react';
import { LEVELS } from '../logic/levels';

interface SettingsPanelProps {
  config: {
    floorEnabled: boolean;
    floorSpeed: number;
    floorDelay: number;
    targetSpeed: number;
    raceTitle: string;
    activeLevel: string;
  };


  onChange: (newConfig: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  return (
    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)] w-full flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-blue-400 tracking-[0.2em] uppercase mb-1">Config</h2>
        <div className="text-[10px] text-blue-300/60 font-mono mb-2">SETTINGS</div>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-50 to-transparent opacity-50" />
      </div>

      <div className="space-y-6">
        {/* Map Selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Map</span>
          <select 
            value={config.activeLevel}
            onChange={(e) => onChange({ activeLevel: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-blue-400 focus:outline-none focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer"
          >
            {Object.entries(LEVELS).map(([id, level]) => (
              <option key={id} value={id} className="bg-[#0a0a0a] text-white">{level.name}</option>
            ))}
          </select>
        </div>

        {/* Race Title Input */}

        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Race Hook / Title</span>
          <input 
            type="text" 
            value={config.raceTitle}
            onChange={(e) => onChange({ raceTitle: e.target.value })}
            placeholder="Ej: BURGER VS SALAD"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-blue-400 focus:outline-none focus:border-blue-500 transition-all font-bold"
          />
        </div>

        {/* Floor Toggle */}

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-tighter">Rising Floor</span>
          <button 
            onClick={() => onChange({ floorEnabled: !config.floorEnabled })}
            className={`w-12 h-6 rounded-full transition-all relative ${config.floorEnabled ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.floorEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Floor Speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Floor Speed</span>
            <span className="text-blue-400">{config.floorSpeed.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="2.0" 
            step="0.1"
            value={config.floorSpeed}
            onChange={(e) => onChange({ floorSpeed: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Floor Delay */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Floor Start Delay</span>
            <span className="text-blue-400">{(config.floorDelay / 1000).toFixed(1)}s</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="15000" 
            step="500"
            value={config.floorDelay}
            onChange={(e) => onChange({ floorDelay: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Player Speed */}

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Ball Speed</span>
            <span className="text-blue-400">{config.targetSpeed}</span>
          </div>
          <input 
            type="range" 
            min="3" 
            max="15" 
            step="1"
            value={config.targetSpeed}
            onChange={(e) => onChange({ targetSpeed: parseInt(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-blue-500/20">
        <p className="text-[9px] text-blue-500/60 leading-tight italic uppercase text-center font-bold">
          Dynamic Control <br/> Interface
        </p>
      </div>
    </div>
  );
};
