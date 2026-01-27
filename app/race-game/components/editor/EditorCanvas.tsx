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
  const [rotationGuide, setRotationGuide] = useState<number | null>(null);

  const dragRef = useRef<{ 
      type: 'move' | 'resize' | 'rotate', 
      handle?: { x: number, y: number },
      startX: number, 
      startY: number, 
      initialObj: LevelObject 
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, obj: LevelObject, type: 'move' | 'resize' | 'rotate', handle?: { x: number, y: number }) => {
    e.stopPropagation();
    onSelectObject(obj.id);
    dragRef.current = {
      type: type,
      handle: handle,
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
        // Snap to grid (1px for precision)
        newX = Math.round(newX);
        newY = Math.round(newY);
        
        onObjectChange({ ...obj, x: newX, y: newY });

    } else if (dragRef.current.type === 'resize') {
        const h = dragRef.current.handle || { x: 1, y: 1 };
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
            // Apply to width/height
            const oldW = obj.width || 40;
            const oldH = obj.height || 40;
            
            // Calculate change in local dimensions
            const dw_local = localDx * h.x;
            const dh_local = localDy * h.y;
            
            const newW = Math.max(10, oldW + dw_local);
            const newH = Math.max(10, oldH + dh_local);
            
            // Effective changes (might be constrained by min size)
            const actualDW = newW - oldW;
            const actualDH = newH - oldH;

            // Center displacement in local space
            const localOffsetX = (actualDW / 2) * h.x;
            const localOffsetY = (actualDH / 2) * h.y;
            
            // Rotate displacement back to global space
            const globalOffsetX = localOffsetX * cos - localOffsetY * sin;
            const globalOffsetY = localOffsetX * sin + localOffsetY * cos;

            onObjectChange({ 
                ...obj, 
                width: Math.round(newW), 
                height: Math.round(newH),
                x: Math.round(obj.x + globalOffsetX),
                y: Math.round(obj.y + globalOffsetY)
            });
        }
    } else if (dragRef.current.type === 'rotate') {
        const rect = canvasRef.current!.getBoundingClientRect();
        const objScreenX = rect.left + obj.x;
        const objScreenY = rect.top + obj.y;

        const angle = Math.atan2(e.clientY - objScreenY, e.clientX - objScreenX);
        let angleDeg = (angle * (180 / Math.PI)) + 90; 
        
        // Normalize 0-360
        angleDeg = (angleDeg + 360) % 360;

        // Magnetic snap to 45 degree increments
        const snapStep = 45;
        const snapThreshold = 6;
        let finalAngle = angleDeg;
        let guide = null;

        const targetSnap = Math.round(angleDeg / snapStep) * snapStep;
        if (Math.abs(angleDeg - targetSnap) < snapThreshold) {
            finalAngle = targetSnap % 360;
            guide = finalAngle;
        }
        
        if (guide !== rotationGuide) setRotationGuide(guide);
        onObjectChange({ ...obj, rotation: Math.round(finalAngle) });
    }
  };

  const handleMouseUp = () => {
    dragRef.current = null;
    setRotationGuide(null);
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

        {/* Rotation Guide Lines */}
        {rotationGuide !== null && (
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
                <div 
                    className="absolute w-[300%] h-[1px] border-t border-emerald-500/40 border-dashed shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                    style={{ 
                        transform: `rotate(${rotationGuide - 90}deg)`,
                        left: '-100%',
                        right: '-100%'
                    }}
                />
            </div>
        )}

        {level.objects.map(obj => {
            const isSelected = selectedObjectId === obj.id;
            const w = obj.width || (obj.radius ? obj.radius * 2 : 40);
            const h = obj.height || (obj.radius ? obj.radius * 2 : 40);

            const isTriangle = obj.type === 'triangle';

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
                        clipPath: isTriangle ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 
                                  obj.type === 'triangle-right' ? 'polygon(0% 0%, 100% 100%, 0% 100%)' : 'none',
                        boxShadow: isSelected && !isTriangle && obj.type !== 'triangle-right' ? '0 0 15px rgba(52,211,153,0.3)' : 'none'
                    }}
                >
                    {(obj.properties?.showIcon ?? true) && (
                        <span 
                            className={`select-none text-xl opacity-80 filter drop-shadow-md pointer-events-none
                                ${isTriangle ? 'mt-4' : ''}
                            `}
                        >
                           {OBJECT_DEFINITIONS[obj.type]?.icon || ''}
                        </span>
                    )}
                    
                    {/* Handles - Only visible when selected */}
                    {isSelected && (
                        <>
                            {/* Resize Handles (8 Points) */}
                            {[
                                { x: -1, y: -1, cur: 'nwse-resize', cls: '-top-1.5 -left-1.5' },
                                { x: 1, y: -1, cur: 'nesw-resize', cls: '-top-1.5 -right-1.5' },
                                { x: -1, y: 1, cur: 'nesw-resize', cls: '-bottom-1.5 -left-1.5' },
                                { x: 1, y: 1, cur: 'nwse-resize', cls: '-bottom-1.5 -right-1.5' },
                                { x: 0, y: -1, cur: 'ns-resize', cls: '-top-1.5 left-1/2 -translate-x-1/2' },
                                { x: 0, y: 1, cur: 'ns-resize', cls: '-bottom-1.5 left-1/2 -translate-x-1/2' },
                                { x: -1, y: 0, cur: 'ew-resize', cls: '-left-1.5 top-1/2 -translate-y-1/2' },
                                { x: 1, y: 0, cur: 'ew-resize', cls: '-right-1.5 top-1/2 -translate-y-1/2' }
                            ].map((h, i) => {
                                // Skip side handles for circles/radius-based objects
                                if (obj.radius && (h.x === 0 || h.y === 0)) return null;
                                return (
                                    <div 
                                        key={i}
                                        className={`absolute w-3 h-3 bg-emerald-400 border border-white rounded-sm shadow-md hover:scale-150 transition-transform ${h.cls}`}
                                        style={{ cursor: h.cur }}
                                        onMouseDown={(e) => handleMouseDown(e, obj, 'resize', { x: h.x, y: h.y })}
                                    />
                                );
                            })}
                            
                            {/* Rotate Handle (Top Center, sticking out) */}
                            <div 
                                className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
                            >
                                <div className="w-[1px] h-6 bg-emerald-400" />
                                <div 
                                    className="w-5 h-5 bg-white border-2 border-emerald-400 rounded-full cursor-grab active:cursor-grabbing hover:bg-emerald-100 shadow-lg flex items-center justify-center"
                                    onMouseDown={(e) => handleMouseDown(e, obj, 'rotate')}
                                >
                                    <span className="text-[10px] text-emerald-600 font-bold">↻</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        })}
    </div>
  );
};
