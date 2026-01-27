import React from 'react';
import { OBJECT_DEFINITIONS, ObjectType } from '../../logic/LevelTypes';

export const ObjectPalette: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, type: ObjectType) => {
    e.dataTransfer.setData('application/race-editor-object', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-white/10 w-full lg:w-48 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2 border-b border-emerald-500/20 pb-2">
        Object Palette
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(OBJECT_DEFINITIONS) as [ObjectType, typeof OBJECT_DEFINITIONS[ObjectType]][]).map(([type, def]) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-emerald-500/30 transition-all group"
          >
            <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{def.icon}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase text-center leading-tight">{def.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 bg-blue-500/10 rounded text-[10px] text-blue-300 leading-tight">
        <strong>Tip:</strong> Drag objects onto the canvas to place them.
      </div>
    </div>
  );
};
