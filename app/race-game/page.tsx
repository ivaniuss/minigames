'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PhysicsEngine } from './logic/PhysicsEngine';
import { Leaderboard } from './components/Leaderboard';
import { WinOverlay } from './components/WinOverlay';
import { COLORS } from './constants';
import { soundManager } from './logic/SoundManager';
import { SettingsPanel } from './components/SettingsPanel';

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
    raceTitle: 'FOOD BATTLE',
    activeLevel: 'high_flow',
  });




  useEffect(() => {
    if (sceneRef.current && !engineRef.current) {
      engineRef.current = new PhysicsEngine(sceneRef.current, handleWin);
    }

    if (engineRef.current) {
      engineRef.current.updateConfig(config);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [config]);

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
    await soundManager.unlock(); // Desbloquear audio en mobile
    setScores({});
    setWinner(null);
    if (engineRef.current) {
      engineRef.current.spawnPlayers(COLORS);
    }
  };




  const startRace = async () => {
    await soundManager.unlock(); // Desbloquear audio en mobile
    if (engineRef.current) {
      setWinner(null);
      setIsRaceActive(true);
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

            {/* Nueva Capa de Inicio sobre el juego */}
            {!isRaceActive && !winner && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all animate-in fade-in duration-500">
                <button
                  onClick={startRace}
                  className="group relative flex flex-col items-center gap-4 transition-transform active:scale-95"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_70px_rgba(16,185,129,0.6)] transition-all">
                    {/* Icono de Play estilizado */}
                    <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-black border-b-[15px] border-b-transparent ml-2" />
                  </div>
                  <span className="text-white font-black tracking-[0.3em] uppercase text-sm animate-pulse">
                    Tap to Start
                  </span>
                </button>
              </div>
            )}
          </div>


          {/* Decorative frame elements */}
          <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-emerald-500/20 font-black text-6xl tracking-[1em] select-none uppercase">
            Circuit
          </div>
        </div>

        {/* Right Side: Info/Controls */}
        <div className="w-full lg:w-64 space-y-6">
          <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream Mode
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Perpetual Race Mode. Players bounce off obstacles at constant speed until someone hits the finish line.
            </p>
            <SettingsPanel 
              config={config} 
              onChange={(newVal) => setConfig(prev => ({ ...prev, ...newVal }))} 
            />
          </div>

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
    </div>
  );
};

export default RaceGamePage;
