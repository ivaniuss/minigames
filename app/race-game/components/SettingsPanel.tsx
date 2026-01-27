import React, { useState, useEffect } from 'react';
import { LEVELS } from '../logic/levels';

interface SettingsPanelProps {
  config: {
    floorEnabled: boolean;
    floorSpeed: number;
    floorDelay: number;
    targetSpeed: number;
    playerSize: number;
    raceTitle: string;
    activeLevel: string;
    volume: number;
  };


  onChange: (newConfig: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onChange }) => {
  const [customLevels, setCustomLevels] = useState<Record<string, any>>({});
  
  // Load custom custom levels on mount
  useEffect(() => {
      try {
          const savedStr = localStorage.getItem('race-game-levels');
          if (savedStr) {
              setCustomLevels(JSON.parse(savedStr));
          }
      } catch(e) { console.error('Error loading levels', e); }
  }, []);

  const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      onChange({ activeLevel: val });
      
      // If it's a custom ID (not in LEVELS constant)
      if (!LEVELS[val] && val !== 'custom') {
          if (val === 'test_level_active') {
             const testData = localStorage.getItem('race-game-test-level');
             if(testData) {
                 setTimeout(() => {
                     const event = new CustomEvent('load-custom-level', { detail: JSON.parse(testData) });
                     window.dispatchEvent(event);
                 }, 100);
             }
          } else if (customLevels[val]) {
              setTimeout(() => {
                  const event = new CustomEvent('load-custom-level', { detail: customLevels[val] });
                  window.dispatchEvent(event);
              }, 100);
          }
      }
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] w-full flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-black text-emerald-400 tracking-[0.2em] uppercase mb-1">Config</h2>
        <div className="text-[10px] text-emerald-300/60 font-mono mb-2">SETTINGS</div>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-50 to-transparent opacity-50" />
      </div>

      <div className="space-y-6">
        {/* Map Selector */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Map</span>
          <select 
            value={config.activeLevel}
            onChange={handleLevelSelect}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-bold appearance-none cursor-pointer"
          >
            <optgroup label="Official Maps">
                {Object.entries(LEVELS).map(([id, level]) => (
                <option key={id} value={id} className="bg-[#0a0a0a] text-white">{level.name}</option>
                ))}
            </optgroup>
            
            <optgroup label="My Custom Levels">
                 <option value="test_level_active" className="bg-[#0a0a0a] text-yellow-400">⚡ Latest Test</option>
                 {Object.values(customLevels).map((l: any) => (
                     <option key={l.id} value={l.id} className="bg-[#0a0a0a] text-emerald-300">{l.name}</option>
                 ))}
            </optgroup>
          </select>
        </div>

        {/* Race Title Input */}

        <div className="space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Race Hook / Title</span>
          <input 
            type="text" 
            value={config.raceTitle}
            onChange={(e) => onChange({ raceTitle: e.target.value })}
            placeholder="Ej: DUCK RACE! 🦆"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all font-bold"
          />
        </div>

        {/* Floor Toggle */}

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-tighter">Rising Floor</span>
          <button 
            onClick={() => onChange({ floorEnabled: !config.floorEnabled })}
            className={`w-12 h-6 rounded-full transition-all relative ${config.floorEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.floorEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Floor Speed */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Floor Speed</span>
            <span className="text-emerald-400">{config.floorSpeed.toFixed(1)}</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="2.0" 
            step="0.1"
            value={config.floorSpeed}
            onChange={(e) => onChange({ floorSpeed: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Floor Delay */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Floor Start Delay</span>
            <span className="text-emerald-400">{(config.floorDelay / 1000).toFixed(1)}s</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="15000" 
            step="500"
            value={config.floorDelay}
            onChange={(e) => onChange({ floorDelay: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Player Speed */}

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Ball Speed</span>
            <span className="text-emerald-400">{config.targetSpeed}</span>
          </div>
          <input 
            type="range" 
            min="3" 
            max="15" 
            step="1"
            value={config.targetSpeed}
            onChange={(e) => onChange({ targetSpeed: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Duck Size */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Duck Size</span>
            <span className="text-emerald-400">{config.playerSize}px</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="100" 
            step="5"
            value={config.playerSize}
            onChange={(e) => onChange({ playerSize: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span>Volume</span>
            <span className="text-emerald-400">{Math.round(config.volume * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01"
            value={config.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-emerald-500/20 space-y-3">

        <p className="text-[9px] text-emerald-500/60 leading-tight italic uppercase text-center font-bold">
          Dynamic Control <br/> Interface
        </p>
      </div>

    </div>
  );
};
