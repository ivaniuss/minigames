'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PhysicsEngine } from './logic/PhysicsEngine';
import { Leaderboard } from './components/Leaderboard';
import { WinOverlay } from './components/WinOverlay';
import { COLORS } from './constants';
import { soundManager } from './logic/SoundManager';
import { SettingsPanel } from './components/SettingsPanel';
import { StartOverlay } from './components/StartOverlay';

const RaceGamePage = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [config, setConfig] = useState({
    floorEnabled: true,
    floorSpeed: 0.5,
    floorDelay: 5000,
    targetSpeed: 7,
    playerSize: 40,
    raceTitle: 'DUCK RACE!',
    activeLevel: 'high_flow',
    volume: 0.1,
  });

  const [showStartOverlay, setShowStartOverlay] = useState(true);




  useEffect(() => {
    const handleCustomLevel = (e: any) => {
        if (engineRef.current && e.detail) {
            engineRef.current.loadLevel(e.detail);
        }
    };
    window.addEventListener('load-custom-level', handleCustomLevel);
    return () => window.removeEventListener('load-custom-level', handleCustomLevel);
  }, []);

  /* State for pending level load */
  const [pendingLevel, setPendingLevel] = useState<any | null>(null);

  useEffect(() => {
    // Check for autoplay/test mode on mount
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoplay') === 'true') {
        const testData = localStorage.getItem('race-game-test-level');
        if (testData) {
            try {
                const level = JSON.parse(testData);
                setPendingLevel(level);
                // Also set config active level to avoid flash
                setConfig(prev => ({ ...prev, activeLevel: 'test_level_active' }));
            } catch(e) { console.error('Failed to load test level'); }
        }
    }
  }, []);

  // 1. Initialization and Keyboard Shortcuts
  useEffect(() => {
    if (sceneRef.current && !engineRef.current) {
        engineRef.current = new PhysicsEngine(sceneRef.current, handleWin);
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 's' || e.key === ' ') {
        e.preventDefault();
        startRace();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetScores();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // 2. Level Loading and Config Updates
  useEffect(() => {
    if (!engineRef.current) return;

    // Always update visual/physics config
    const { volume, ...engineConfig } = config;
    engineRef.current.updateConfig(engineConfig);
    soundManager.setVolume(config.volume);

    // Load level if pending, then clear it 
    if (pendingLevel) {
        engineRef.current.loadLevel(pendingLevel);
        setPendingLevel(null); // Clear after loading so it doesn't block updates
    } else if (config.activeLevel === 'custom') {
        const data = localStorage.getItem('race-game-custom-level');
        if (data) {
            try { engineRef.current.loadLevel(JSON.parse(data)); } catch(e) {}
        }
    }
  }, [config, pendingLevel]);

  // 3. Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, []);


  const handleWin = (colorName: string) => {
    setWinner(colorName);
    setScores(prev => ({
      ...prev,
      [colorName]: (prev[colorName] || 0) + 1
    }));
    setIsRaceActive(false);
    soundManager.playWin();
  };

  const resetScores = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await soundManager.unlock();
    setScores({});
    setWinner(null);
    setShowStartOverlay(true);
    if (engineRef.current) {
      engineRef.current.spawnPlayers(COLORS);
      setIsRaceActive(false);
    }
  };

  const startRace = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await soundManager.unlock();
    if (engineRef.current) {
      setWinner(null);
      setIsRaceActive(true);
      setShowStartOverlay(false);
      engineRef.current.spawnPlayers(COLORS);
    }
  };


  return (
    <div className="relative min-h-screen bg-[#050505] flex items-center justify-center p-4 lg:p-8 overflow-x-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start max-w-7xl w-full justify-center">
        
        {/* Left Side: Leaderboard */}
        <div className="lg:sticky lg:top-8 w-full max-w-[220px]">
          <Leaderboard 
            scores={scores} 
            colors={COLORS} 
            onStart={startRace} 
            onReset={resetScores}
            isRaceActive={isRaceActive}
          />


          
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 hidden lg:block">
            <h3 className="text-emerald-500 font-bold mb-3 text-xs uppercase tracking-widest">Race Stats</h3>
            <div className="space-y-2 font-mono text-[10px] text-gray-500">
              <p>{'>'} PERPETUAL ENGINE: ACTIVE</p>
              <p>{'>'} GRAVITY: ZERO</p>
              <p>{'>'} VELOCITY: CONSTANT</p>
              <p>{'>'} COLLISION: ELASTIC</p>
            </div>
            
            <a href="/race-game/editor" className="block mt-6 text-center py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-black text-emerald-400 uppercase tracking-widest transition-all">
               🛠️ Open Level Editor
            </a>
          </div>
        </div>

        {/* Center: Game Scene (Responsive Scale) */}
        <div className="relative transform scale-[0.80] sm:scale-90 md:scale-100 origin-top lg:origin-center">
          <div className="absolute -inset-1 bg-gradient-to-b from-emerald-500/20 to-transparent blur-2xl rounded-[40px]" />
          <div className="relative bg-[#0a0a0a] border-[8px] lg:border-[12px] border-[#1a1a1a] rounded-[40px] shadow-2xl overflow-hidden ring-1 ring-emerald-500/20">
            {/* Inner glow effect */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10" />
            
            <div ref={sceneRef} className="relative z-0" />
            
            <WinOverlay winner={winner} onNext={startRace} />

            {/* Nueva Pantalla de Inicio */}
            {showStartOverlay && (
              <StartOverlay onStart={startRace} title={config.raceTitle} />
            )}
          </div>


          {/* Decorative frame elements */}
          <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-emerald-500/20 font-black text-6xl tracking-[1em] select-none uppercase">
            Circuit
          </div>
        </div>

        {/* Right Side: Info/Controls */}
        {/* Right Side: Config Panel */}
        <div className="w-full lg:w-72 space-y-6">
          <SettingsPanel 
            config={config} 
            onChange={(newVal) => setConfig(prev => ({ ...prev, ...newVal }))} 
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-emerald-500 font-black text-xl mb-1">{Object.values(scores).reduce((a, b) => a + b, 0)}</div>
              <div className="text-[10px] text-gray-500 uppercase font-black">Total Races</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-emerald-500 font-black text-xl mb-1">{COLORS.length}</div>
              <div className="text-[10px] text-gray-500 uppercase font-black">Competitors</div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Navigation Overlay */}
      <div className="fixed bottom-6 left-6 z-[100] flex gap-3 opacity-20 hover:opacity-100 transition-opacity duration-500">
         <a 
            href="/" 
            className="w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-lg hover:bg-white/10 hover:border-emerald-500/50 transition-all active:scale-90"
            title="Main Menu"
         >
            🏠
         </a>
         <a 
            href="/race-game/editor" 
            className="w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-lg hover:bg-white/10 hover:border-emerald-500/50 transition-all active:scale-90"
            title="Level Editor"
         >
            🛠️
         </a>
      </div>
    </div>
  );
};

export default RaceGamePage;
