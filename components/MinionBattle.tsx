import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/engine';
import { SoundManager } from '../game/sound';
import { GameState } from '../types';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const MinionBattle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const soundRef = useRef<SoundManager | null>(null);
  const playerBarRef = useRef<HTMLDivElement>(null);
  const bossBarRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>('intro');
  const [hintChar, setHintChar] = useState<string>('');

  // Initialize Game Engine & Sound
  useEffect(() => {
    if (!canvasRef.current) return;

    // Init Sound
    const sound = new SoundManager();
    soundRef.current = sound;

    // Start Intro Music
    sound.playBgm('intro');

    const engine = new GameEngine(canvasRef.current, {
      onStateChange: (newState) => {
        setGameState(newState);
        
        // Handle BGM changes
        switch (newState) {
            case 'intro': sound.playBgm('intro'); break;
            case 'playing': sound.playBgm('battle'); break;
            case 'cleared': 
                sound.playBgm('victory'); 
                const chars = ['L', 'M', 'N', 'O', 'P'];
                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                setHintChar(randomChar);
                break;
            case 'gameover': sound.playBgm('gameover'); break;
        }
      },
      onHpUpdate: (playerPct, bossPct) => {
        if (playerBarRef.current) {
          playerBarRef.current.style.width = `${Math.max(0, playerPct)}%`;
        }
        if (bossBarRef.current) {
          bossBarRef.current.style.width = `${Math.max(0, bossPct)}%`;
        }
      },
      playSfx: (type) => {
          sound.playSfx(type);
      }
    });

    engineRef.current = engine;
    engine.init();

    return () => {
      engine.destroy();
      sound.stopBgm();
    };
  }, []);

  const handleStart = async () => {
    // Resume audio context on user gesture
    if (soundRef.current) {
        await soundRef.current.resume();
    }
    engineRef.current?.startGame();
  };

  const isUiVisible = gameState === 'playing';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020617]">
      {/* HUD - Only visible during gameplay */}
      <div 
        className={`absolute top-5 left-5 right-5 z-20 flex justify-between transition-opacity duration-500 pointer-events-none ${isUiVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Player HP */}
        <div className="relative pointer-events-auto">
          <div className="absolute -top-7 left-0 text-xl font-black text-cyan-400 text-stroke-purple drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-wider">
            HERO
          </div>
          <div className="relative w-[150px] sm:w-[300px] h-8 bg-black/50 rounded-full border-4 border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.3)] overflow-hidden backdrop-blur-sm">
            <div 
              ref={playerBarRef}
              className="h-full bg-gradient-to-r from-green-400 to-cyan-500 transition-all duration-200 ease-out w-full"
            />
          </div>
        </div>

        {/* Boss HP */}
        <div className="relative pointer-events-auto">
          <div className="absolute -top-7 right-0 text-xl font-black text-fuchsia-500 text-stroke-white drop-shadow-[0_0_10px_rgba(255,0,255,0.8)] tracking-wider">
            MASTER
          </div>
          <div className="relative w-[150px] sm:w-[300px] h-8 bg-black/50 rounded-full border-4 border-fuchsia-500 shadow-[0_0_15px_rgba(255,0,255,0.3)] overflow-hidden backdrop-blur-sm">
            <div 
              ref={bossBarRef}
              className="h-full bg-gradient-to-l from-red-600 to-fuchsia-600 transition-all duration-200 ease-out w-full"
            />
          </div>
        </div>
      </div>

      {/* Screens */}
      
      {/* Intro Screen */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020617]/90 backdrop-blur-md transition-all duration-300
        ${gameState === 'intro' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="relative">
          <div className="absolute -inset-4 bg-cyan-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
          <h1 className="relative text-5xl md:text-7xl font-black text-white drop-shadow-[4px_4px_0_#4B0082] mb-6 text-center leading-tight -rotate-2 text-stroke-cyan">
            異空間<br />バトル
          </h1>
        </div>
        <p className="text-lg md:text-xl text-cyan-100 font-bold tracking-widest mb-10 bg-black/40 border border-white/20 px-8 py-3 rounded-full backdrop-blur-sm">
          マウスかタッチで動かしてね
        </p>
        <button 
          onClick={handleStart}
          className="group relative px-12 py-6 bg-gradient-to-b from-cyan-400 to-blue-600 text-white font-black text-2xl md:text-3xl rounded-full border-[4px] border-white shadow-[0_0_20px_rgba(0,255,255,0.5)] active:scale-95 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] transition-all outline-none"
        >
          <span className="flex items-center gap-3 drop-shadow-md">
             ゲームスタート <Play fill="currentColor" size={28} />
          </span>
        </button>
      </div>

      {/* Game Over Screen */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#000000]/80 backdrop-blur-md transition-all duration-300
        ${gameState === 'gameover' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <h1 className="text-6xl md:text-8xl font-black text-[#FF0055] drop-shadow-[0_0_20px_#FF0055] mb-4 text-center -rotate-3 text-stroke-white">
          GAME OVER
        </h1>
        <p className="text-xl md:text-2xl text-white font-bold tracking-widest mb-10 drop-shadow-lg">
          再挑戦しますか？
        </p>
        <button 
          onClick={handleStart}
          className="group relative px-10 py-5 bg-gradient-to-b from-purple-500 to-indigo-600 text-white font-black text-2xl md:text-3xl rounded-full border-[4px] border-white shadow-[0_8px_0_rgba(0,0,0,0.4)] active:shadow-none active:translate-y-[8px] active:translate-x-0 hover:-translate-y-1 hover:brightness-110 transition-all outline-none"
        >
          <span className="flex items-center gap-3">
             コンティニュー <RotateCcw size={28} />
          </span>
        </button>
      </div>

      {/* Victory Screen */}
      <div 
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300
        ${gameState === 'cleared' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="relative">
             <div className="absolute -inset-10 bg-yellow-400 blur-3xl opacity-30 animate-pulse rounded-full"></div>
            <h1 className="relative text-6xl md:text-9xl font-black text-[#FFD700] drop-shadow-[4px_4px_0_#FFF] mb-4 text-center -rotate-3 animate-bounce text-stroke-purple">
            WINNER!!
            </h1>
        </div>
        <p className="text-xl md:text-3xl text-white font-bold tracking-widest mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          大勝利！ おめでとう！
        </p>
        
        <div className="mb-10 p-4 bg-purple-900/50 border-2 border-cyan-400 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.4)] animate-pulse">
            <p className="text-2xl md:text-5xl text-cyan-200 font-black tracking-widest text-stroke-purple drop-shadow-[0_0_10px_#00FFFF]">
              三桁目は<span className="text-yellow-400 text-4xl md:text-6xl mx-2">{hintChar}</span>だよ
            </p>
        </div>

        <button 
          onClick={handleStart}
          className="group relative px-10 py-5 bg-gradient-to-b from-yellow-400 to-orange-500 text-white font-black text-2xl md:text-3xl rounded-full border-[4px] border-white shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[8px] active:translate-x-0 hover:-translate-y-1 hover:brightness-110 transition-all outline-none"
        >
           <span className="flex items-center gap-3">
             もう一度遊ぶ <Trophy fill="currentColor" size={28} />
          </span>
        </button>
      </div>

      {/* Vignette Overlay & Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle,transparent_40%,rgba(10,0,30,0.6)_100%)]"></div>
      <div className="absolute inset-0 pointer-events-none z-10 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

      {/* Game Canvas */}
      <canvas 
        ref={canvasRef}
        className="block w-full h-full cursor-none touch-none"
      />
    </div>
  );
};

export default MinionBattle;