import React from 'react';
import { LevelObject } from '../../logic/LevelTypes';

interface PropertiesPanelProps {
  object: LevelObject | null;
  onChange: (updatedObject: LevelObject) => void;
  onDelete: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ object, onChange, onDelete }) => {
  if (!object) {
    return (
      <div className="bg-[#111] p-6 rounded-xl border border-white/10 w-full lg:w-64 h-full flex items-center justify-center text-center">
        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
          Select an object to<br/>edit properties
        </p>
      </div>
    );
  }

  const handleChange = (field: keyof LevelObject, value: any) => {
    onChange({ ...object, [field]: value });
  };

  const handlePropChange = (key: string, value: any) => {
    onChange({
      ...object,
      properties: {
        ...object.properties,
        [key]: value
      }
    });
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10 w-full lg:w-64 flex flex-col gap-4 h-full overflow-y-auto">
      <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
        <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest">Properties</h3>
        <span className="text-[10px] font-mono text-gray-500">{object.type.toUpperCase()}</span>
      </div>

      <div className="space-y-4">
        {/* Geometry */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Position (X, Y)</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={Math.round(object.x)} 
              onChange={(e) => handleChange('x', parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
            />
            <input 
              type="number" 
              value={Math.round(object.y)} 
              onChange={(e) => handleChange('y', parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Size (W, H)</label>
            <div className="flex gap-2">
                <input 
                type="number" 
                value={object.width || 0} 
                onChange={(e) => handleChange('width', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                placeholder="W"
                disabled={!!object.radius} // Disable if circle
                />
                <input 
                type="number" 
                value={object.height || 0} 
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                placeholder="H"
                disabled={!!object.radius}
                />
            </div>
        </div>

        {object.radius !== undefined && (
             <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase">Radius</label>
             <input 
               type="number" 
               value={object.radius} 
               onChange={(e) => handleChange('radius', parseInt(e.target.value))}
               className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
             />
           </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Rotation (deg)</label>
          <input 
            type="range" 
            min="0" max="360" 
            value={object.rotation || 0} 
            onChange={(e) => handleChange('rotation', parseInt(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
            <div className="flex gap-2 items-center">
                <input 
                    type="color" 
                    value={object.properties?.color || '#ffffff'} 
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                />
                <input 
                    type="text"
                    value={object.properties?.color || '#ffffff'}
                    onChange={(e) => handlePropChange('color', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white uppercase"
                />
            </div>
        </div>

        {/* Toggle Icons */}
        <div className="flex items-center justify-between p-2 bg-white/5 rounded">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Show Icon (Emoji)</label>
            <input 
                type="checkbox"
                checked={object.properties?.showIcon ?? true}
                onChange={(e) => handlePropChange('showIcon', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
        </div>

        {/* Specific Properties based on Type */}
        {object.type === 'breakable' && (
             <div className="space-y-2 p-2 bg-white/5 rounded">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Durability (Hits)</label>
                <input 
                    type="number" 
                    min="1" max="20"
                    value={object.properties?.health || 1} 
                    onChange={(e) => handlePropChange('health', parseInt(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                />
             </div>
        )}

        {object.type.startsWith('speed-') && (
             <div className="space-y-2 p-2 bg-white/5 rounded">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">
                    {object.type === 'speed-booster' ? 'Boost Strength' : 'Slowdown Strength'}
                </label>
                <input 
                    type="number" 
                    step="0.05" min="0.1" max="3"
                    value={object.properties?.speedMult || (object.type === 'speed-booster' ? 1.5 : 0.6)} 
                    onChange={(e) => handlePropChange('speedMult', parseFloat(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                />
                <p className="text-[9px] text-gray-500 italic">
                    {object.type === 'speed-booster' ? '> 1.0 to speed up' : '< 1.0 to slow down'}
                </p>
             </div>
        )}

         {object.type === 'spinner' && (
             <div className="space-y-2 p-2 bg-white/5 rounded">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Rotation Speed</label>
                <input 
                    type="number" 
                    step="0.01"
                    value={object.properties?.speed || 0.1} 
                    onChange={(e) => handlePropChange('speed', parseFloat(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                />
             </div>
        )}

         {object.type === 'moving-hazard' && (
              <div className="space-y-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🔥</span>
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Hazard Movement</label>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Movement Mode</label>
                        </div>
                        <div className="flex bg-black/40 p-1 rounded border border-white/5 border-emerald-500/20">
                            {(['move', 'grow'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => handlePropChange('hazardMode', m)}
                                    className={`flex-1 py-1 text-[9px] font-black uppercase rounded transition-all ${object.properties?.hazardMode === m ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Distance Limit (Pixels)</label>
                            <span className="text-[9px] font-mono text-emerald-400">{object.properties?.moveLimit || 0}</span>
                        </div>
                        <input 
                            type="number" 
                            step="50" min="0"
                            value={object.properties?.moveLimit ?? 1000} 
                            onChange={(e) => handlePropChange('moveLimit', parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                    </div>

                    <div className="p-2 bg-blue-500/5 rounded border border-blue-500/10 mb-2">
                        <p className="text-[8px] text-blue-300 flex items-start gap-1">
                            <span className="mt-0.5">ℹ️</span>
                            <span>Drag the <b>WHITE ARROW</b> on the hazard to set direction and speed.</span>
                        </p>
                    </div>

                    <div className="space-y-1 opacity-60">
                        <div className="flex justify-between text-[8px] text-gray-500 uppercase font-bold">
                            <span>Vector: {object.properties?.moveSpeedX || 0}, {object.properties?.moveSpeedY || 0}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">Start Delay (ms)</label>
                            <span className="text-[9px] font-mono text-red-400">{object.properties?.moveDelay || 0}ms</span>
                        </div>
                        <input 
                            type="number" 
                            step="100" min="0"
                            value={object.properties?.moveDelay ?? 5000} 
                            onChange={(e) => handlePropChange('moveDelay', parseInt(e.target.value))}
                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                        />
                    </div>
                    
                    <p className="text-[8px] text-gray-500 italic leading-tight mt-2">
                        Positive Y moves down. Negative Y moves up (Rising).
                    </p>
                 </div>
              </div>
         )}
 
         <div className="pt-4 mt-4 border-t border-white/10">
            <button 
                onClick={() => onDelete(object.id)}
                className="w-full py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
            >
                Delete Object
            </button>
        </div>
      </div>
    </div>
  );
};
