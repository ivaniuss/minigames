'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { ObjectPalette } from '../components/editor/ObjectPalette';
import { PropertiesPanel } from '../components/editor/PropertiesPanel';
import { LevelData, LevelObject, DEFAULT_LEVEL, OBJECT_DEFINITIONS, ObjectType } from '../logic/LevelTypes';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
// Simple ID generator if uuid not available
const generateId = () => Math.random().toString(36).substr(2, 9);

const EditorPage = () => {
  const [level, setLevel] = useState<LevelData>(DEFAULT_LEVEL);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<LevelObject | null>(null);

  // Load the last working level from test storage on mount
  useEffect(() => {
    const testData = localStorage.getItem('race-game-test-level');
    if (testData) {
      try {
        const savedLevel = JSON.parse(testData);
        setLevel(savedLevel);
      } catch(e) {
        console.error('Failed to load last level');
      }
    }
  }, []);

  // Keyboard shortcuts for Delete, Copy, Paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if input is focused
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          handleObjectDelete(selectedObjectId);
        }
      }

      // Copy (Ctrl+C / Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedObjectId) {
          const obj = level.objects.find(o => o.id === selectedObjectId);
          if (obj) {
             setClipboard(obj);
             // Optional: visual feedback
          }
        }
      }

      // Paste (Ctrl+V / Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboard) {
           const newObj = {
               ...clipboard,
               id: generateId(),
               x: clipboard.x + 20,
               y: clipboard.y + 20
           };
           setLevel(prev => ({ ...prev, objects: [...prev.objects, newObj] }));
           setSelectedObjectId(newObj.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [level, selectedObjectId, clipboard]);

  const handleLevelChange = (newLevel: LevelData) => {
    setLevel(newLevel);
  };

  const handleObjectChange = (updatedObject: LevelObject) => {
    const updatedObjects = level.objects.map(obj => 
      obj.id === updatedObject.id ? updatedObject : obj
    );
    setLevel({ ...level, objects: updatedObjects });
  };

  const handleObjectDelete = (id: string) => {
    setLevel({ ...level, objects: level.objects.filter(o => o.id !== id) });
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  const handleAddObject = (type: ObjectType, x: number, y: number) => {
    const def = OBJECT_DEFINITIONS[type];
    const newObj: LevelObject = {
      id: generateId(),
      type: type,
      x: Math.round(x),
      y: Math.round(y),
      ...def.defaultProps
    };
    setLevel({ ...level, objects: [...level.objects, newObj] });
    setSelectedObjectId(newObj.id);
  };

  // Drag and drop handler for the canvas area (dropping from palette)
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/race-editor-object') as ObjectType;
    if (!type || !OBJECT_DEFINITIONS[type]) return;

    // Use a ref to the canvas container to calculate relative coordinates if needed, 
    // but here we just need to ensure the event target is within our workspace.
    // The visual canvas is centered. Let's try to get coordinates relative to the viewport 
    // and adjust based on the canvas position.
    
    // Ideally, EditorCanvas handles the drop event and calls onAddObject.
    // I've updated EditorCanvas to NOT handle adding itself, but we can pass a prop or wrap it.
    // Actually, let's wrap the EditorCanvas in a div here that handles the drop.
    
    // Finding the canvas element rect... 
    // Since we are in the parent, it's safer to rely on the child component to report the drop position.
    // Let's modify EditorCanvas a tiny bit or just pass a handler.
  };

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <a href="/race-game" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all mr-2" title="Back to Game">
            ←
          </a>
          <span className="text-xl">🛠️</span>
          <h1 className="font-black text-emerald-500 uppercase tracking-widest text-sm">Level Editor</h1>
          <span className="text-gray-600">|</span>
          <input 
            value={level.name} 
            onChange={(e) => setLevel({...level, name: e.target.value})}
            className="bg-transparent text-gray-300 font-bold focus:outline-none focus:text-white"
            placeholder="Level Name"
          />
        </div>
        
        <div className="flex gap-3">
             <button 
                onClick={() => {
                    const savedLevelsStr = localStorage.getItem('race-game-levels');
                    const savedLevels = savedLevelsStr ? JSON.parse(savedLevelsStr) : {};
                    savedLevels[level.id] = level;
                    localStorage.setItem('race-game-levels', JSON.stringify(savedLevels));
                    alert(`Level "${level.name}" saved!`);
                }}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded text-xs font-bold uppercase transition-all"
             >
                Save
             </button>
             <button 
                onClick={() => {
                    const data = JSON.stringify(level, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${level.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                    a.click();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold uppercase transition-all"
             >
                Export JSON
             </button>
             <button 
                type="button"
                onClick={() => {
                    localStorage.setItem('race-game-test-level', JSON.stringify(level));
                    window.location.assign('/race-game?autoplay=true');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded text-xs font-black uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
             >
                Play Test
             </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Palette */}
        <div className="w-48 lg:w-56 p-4 border-r border-white/10 bg-[#0a0a0a]">
          <ObjectPalette />
        </div>

        {/* Center Canvas Area */}
        <div 
            className="flex-1 bg-[#111] relative overflow-hidden flex items-center justify-center p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                 e.preventDefault();
            }}
        >
          <div 
            className="relative bg-[#0a0a0a] border-[12px] border-[#1a1a1a] rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-emerald-500/20"
            style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px`, flexShrink: 0, boxSizing: 'content-box' }}
          >
             <EditorCanvas 
               level={level}
               onObjectChange={handleObjectChange}
               onObjectDelete={handleObjectDelete}
               selectedObjectId={selectedObjectId}
               onSelectObject={setSelectedObjectId}
               onAddObject={(type, x, y) => handleAddObject(type, x, y)}
            />
          </div>
          
          {/* Overlay to catch drops if missed? No, specific canvas is better */}
        </div>

        {/* Right Properties */}
        <div className="w-64 lg:w-72 p-4 border-l border-white/10 bg-[#0a0a0a]">
          <PropertiesPanel 
            object={level.objects.find(o => o.id === selectedObjectId) || null}
            onChange={handleObjectChange}
            onDelete={handleObjectDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
