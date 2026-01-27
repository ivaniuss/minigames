import React, { useRef, useState, useEffect } from 'react';
import { LevelData, LevelObject, OBJECT_DEFINITIONS } from '../../logic/LevelTypes';

interface EditorCanvasProps {
  level: LevelData;
  onObjectChange: (updatedObject: LevelObject) => void;
  onObjectDelete: (objectId: string) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onAddObject: (type: any, x: number, y: number) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ 
  level, 
  onObjectChange, 
  onObjectDelete,
  selectedObjectId, 
  onSelectObject,
  onAddObject 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ 
      type: 'move' | 'resize' | 'rotate', 
      startX: number, 
      startY: number, 
      initialObj: LevelObject 
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, obj: LevelObject, type: 'move' | 'resize' | 'rotate') => {
    e.stopPropagation();
    onSelectObject(obj.id);
    dragRef.current = {
      type: type,
      startX: e.clientX,
      startY: e.clientY,
      initialObj: { ...obj }
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'grid-bg') {
        onSelectObject(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    // Calculate global delta
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const obj = dragRef.current.initialObj;

    if (dragRef.current.type === 'move') {
        let newX = obj.x + dx;
        let newY = obj.y + dy;
        // Snap to grid (10px)
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
        
        onObjectChange({ ...obj, x: newX, y: newY });

    } else if (dragRef.current.type === 'resize') {
        const rad = (obj.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Rotate delta back to local space
        const localDx = dx * cos + dy * sin;
        const localDy = -dx * sin + dy * cos;

        if (obj.radius) {
            // Circle resizing: grow radius based on diagonal mouse movement
            const delta = (localDx + localDy) / 2;
            const newRadius = Math.max(10, obj.radius + delta);
            onObjectChange({ ...obj, radius: Math.round(newRadius) });
        } else {
            // Apply to width/height (ensure min size)
            const newW = Math.max(20, (obj.width || 0) + localDx); 
            const newH = Math.max(20, (obj.height || 0) + localDy);
            onObjectChange({ ...obj, width: Math.round(newW), height: Math.round(newH) });
        }
    } else if (dragRef.current.type === 'rotate') {
        // Calculate angle from object center to mouse
        // We need canvas bounding rect to get strict relative coordinates if using clientX/Y
        // object x/y are relative to canvas-container.
        const rect = canvasRef.current!.getBoundingClientRect();
        const objScreenX = rect.left + obj.x;
        const objScreenY = rect.top + obj.y;

        const angle = Math.atan2(e.clientY - objScreenY, e.clientX - objScreenX);
        const angleDeg = (angle * (180 / Math.PI)) + 90; // +90 because 0 is right, but usually we want Up as 0? depends. MatterJS 0 is right?
        // MatterJS: 0 is Right. 
        // Let's stick to standard atan2 + correction.
        
        // Snap to 15 degrees
        const snapped = Math.round(angleDeg / 15) * 15;
        onObjectChange({ ...obj, rotation: snapped });
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <div 
        ref={canvasRef}
        className="relative w-full h-full bg-transparent overflow-hidden mx-auto select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('application/race-editor-object');
            if (!type) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if(!rect) return;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            onAddObject(type, x, y);
        }}
    >
        {/* Grid Background */}
        <div 
            id="grid-bg"
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ 
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
        />

        {level.objects.map(obj => {
            const isSelected = selectedObjectId === obj.id;
            const w = obj.width || (obj.radius ? obj.radius * 2 : 40);
            const h = obj.height || (obj.radius ? obj.radius * 2 : 40);

            return (
                <div
                    key={obj.id}
                    onMouseDown={(e) => handleMouseDown(e, obj, 'move')}
                    className={`absolute group cursor-move flex items-center justify-center
                        ${isSelected ? 'ring-2 ring-emerald-400 z-50' : 'hover:ring-1 hover:ring-white/30 z-10'}
                    `}
                    style={{
                        left: obj.x,
                        top: obj.y,
                        width: w,
                        height: h,
                        transform: `translate(-50%, -50%) rotate(${obj.rotation || 0}deg)`,
                        backgroundColor: obj.properties?.color || '#555',
                        borderRadius: obj.radius ? '50%' : '4px',
                        boxShadow: isSelected ? '0 0 15px rgba(52,211,153,0.3)' : 'none'
                    }}
                >
                    {(obj.properties?.showIcon ?? true) && (
                        <span className="select-none text-xl opacity-80 filter drop-shadow-md pointer-events-none">
                           {OBJECT_DEFINITIONS[obj.type]?.icon || ''}
                        </span>
                    )}
                    
                    {/* Handles - Only visible when selected */}
                    {isSelected && (
                        <>
                            {/* Resize Handle (Bottom Right) */}
                            <div 
                                className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-400 border border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleMouseDown(e, obj, 'resize')}
                            />
                            
                            {/* Rotate Handle (Top Center, sticking out) */}
                            <div 
                                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
                            >
                                <div className="w-[1px] h-4 bg-emerald-400" />
                                <div 
                                    className="w-4 h-4 bg-white border border-emerald-400 rounded-full cursor-grab active:cursor-grabbing hover:bg-emerald-100 shadow-md"
                                    onMouseDown={(e) => handleMouseDown(e, obj, 'rotate')}
                                />
                            </div>
                        </>
                    )}
                </div>
            );
        })}
    </div>
  );
};
