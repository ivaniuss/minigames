import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-4xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-24 h-24 mb-6 relative animate-bounce [animation-duration:3s]">
             <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full" />
             <span className="text-7xl relative z-10">🦆</span>
          </div>
          <h2 className="text-[10px] font-black text-emerald-500 tracking-[0.5em] uppercase mb-4 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
            Premium Simulation
          </h2>
          <h1 className="text-7xl md:text-8xl font-black text-white italic tracking-tighter mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] opacity-0 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200 fill-mode-forwards">
            DUCK <span className="text-emerald-500">RACE!</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-xl leading-relaxed mb-12 opacity-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-forwards">
            The ultimate physics-based duck racing experience. Watch your ducks navigate complex circuits or build your own masterworks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 opacity-0 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700 fill-mode-forwards">
          <Link
            href="/race-game"
            className="group relative px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(16,185,129,0.2)] rounded-2xl overflow-hidden flex items-center gap-3"
          >
            <span className="relative z-10">Play Game</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform relative z-10">🏁</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Link>

          <Link
            href="/race-game/editor"
            className="group relative px-12 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-sm transition-all hover:scale-105 active:scale-95 border border-white/10 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-2xl"
          >
            <span className="relative z-10">Level Editor</span>
            <span className="text-xl group-hover:rotate-12 transition-transform relative z-10">🛠️</span>
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left opacity-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-1000 fill-mode-forwards">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform w-fit">🌀</div>
                <h3 className="text-white font-bold mb-2">Physics-First</h3>
                <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-wider font-semibold">Real-time MatterJS simulation for unpredictable racing action.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform w-fit">🏗️</div>
                <h3 className="text-white font-bold mb-2">Custom Maker</h3>
                <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-wider font-semibold">Powerful level editor with portals, speed pads, and hazards.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform w-fit">🥇</div>
                <h3 className="text-white font-bold mb-2">Live Rankings</h3>
                <p className="text-xs text-gray-500 leading-relaxed uppercase tracking-wider font-semibold">Track scores and winners in real-time as the race unfolds.</p>
            </div>
        </div>
      </main>

      {/* Decorative footer text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/10 font-black tracking-[1em] uppercase select-none pointer-events-none">
        Antigravity Simulation Engine v2
      </div>
    </div>
  );
}
