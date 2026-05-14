/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Github, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 25; // Adjusted for better visual on larger board
const GAME_SPEED = 150; 

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [snake, setSnake] = useState<Position[]>([]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const nextDirectionRef = useRef<Direction>('RIGHT');

  const BOARD_WIDTH = 600;
  const BOARD_HEIGHT = 500;

  const getRandomPosition = useCallback((currentSnake: Position[]): Position => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (BOARD_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (BOARD_HEIGHT / GRID_SIZE)),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    const initialSnake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    nextDirectionRef.current = 'RIGHT';
    setIsGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newDirection = nextDirectionRef.current;
      setDirection(newDirection);

      const newHead = { ...head };
      if (newDirection === 'UP') newHead.y -= 1;
      if (newDirection === 'DOWN') newHead.y += 1;
      if (newDirection === 'LEFT') newHead.x -= 1;
      if (newDirection === 'RIGHT') newHead.x += 1;

      if (
        newHead.x < 0 ||
        newHead.x >= BOARD_WIDTH / GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= BOARD_HEIGHT / GRID_SIZE
      ) {
        setIsGameOver(true);
        return prevSnake;
      }

      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 50);
        setFood(getRandomPosition(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, isGameOver, isPaused, getRandomPosition]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake-high-score');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    resetGame();
    setIsPaused(true);
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    const currentSpeed = Math.max(60, GAME_SPEED - Math.floor(score / 250) * 15);
    const intervalId = setInterval(moveSnake, currentSpeed);
    return () => clearInterval(intervalId);
  }, [moveSnake, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') nextDirectionRef.current = 'UP'; break;
        case 'ArrowDown': if (direction !== 'UP') nextDirectionRef.current = 'DOWN'; break;
        case 'ArrowLeft': if (direction !== 'RIGHT') nextDirectionRef.current = 'LEFT'; break;
        case 'ArrowRight': if (direction !== 'LEFT') nextDirectionRef.current = 'RIGHT'; break;
        case ' ': setIsPaused(prev => !prev); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver, isPaused]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Food
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Snake
    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = '#4ade80';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4ade80';
      } else {
        const opacity = Math.max(0.3, 1 - (index / snake.length));
        ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
        ctx.shadowBlur = 0;
      }
      
      const padding = 2;
      ctx.fillRect(
        segment.x * GRID_SIZE + padding,
        segment.y * GRID_SIZE + padding,
        GRID_SIZE - padding * 2,
        GRID_SIZE - padding * 2
      );
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  const handleMobileControl = (dir: Direction) => {
    if (isGameOver || isPaused) return;
    if (dir === 'UP' && direction !== 'DOWN') nextDirectionRef.current = 'UP';
    if (dir === 'DOWN' && direction !== 'UP') nextDirectionRef.current = 'DOWN';
    if (dir === 'LEFT' && direction !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (dir === 'RIGHT' && direction !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  };

  // Swipe Support
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isGameOver || isPaused) return;

    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    // Minimum swipe distance
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        if (direction !== 'LEFT') nextDirectionRef.current = 'RIGHT';
      } else {
        if (direction !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        if (direction !== 'UP') nextDirectionRef.current = 'DOWN';
      } else {
        if (direction !== 'DOWN') nextDirectionRef.current = 'UP';
      }
    }

    // Reset touch start to prevent multiple direction changes in one swipe
    touchStartRef.current = null;
  };

  const levelProgress = (score % 250) / 250 * 100;
  const currentLevel = Math.floor(score / 250) + 1;

  return (
    <div className="min-h-screen font-sans flex flex-col overflow-x-hidden relative select-none text-slate-100">
      
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-10 bg-black/40 backdrop-blur-xl shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded shadow-[0_8px_24px_-4px_rgba(16,185,129,0.5)] flex items-center justify-center">
            <Zap size={16} className="text-white md:block hidden" />
            <Zap size={14} className="text-white md:hidden" />
          </div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white uppercase italic">
            NEON<span className="text-emerald-500 font-black">SERPENT</span>
          </h1>
        </div>
        <div className="flex gap-4 md:gap-12">
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-500 font-bold">Score</span>
            <span className="text-xl md:text-3xl font-mono font-bold text-white tabular-nums">
              {score.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex flex-col items-end hidden sm:flex border-l border-white/10 pl-6 md:pl-12">
            <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-slate-500 font-bold">Best</span>
            <span className="text-xl md:text-3xl font-mono font-bold text-slate-400 tabular-nums font-medium">
              {highScore.toString().padStart(6, '0')}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-6 gap-6 lg:gap-10 overflow-hidden relative">
        
        {/* Left Sidebar */}
        <aside className="w-56 space-y-6 hidden lg:block text-slate-100">
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
            <h3 className="text-xs uppercase tracking-tighter text-slate-500 mb-4 font-bold">Mechanics</h3>
            <ul className="text-xs space-y-4 text-slate-400">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>Swipe to pivot</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>Absorb bits</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>Avoid impact</li>
            </ul>
          </div>
          <div className="p-6 rounded-3xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs uppercase tracking-tighter text-emerald-400 font-black">L-ID {currentLevel.toString().padStart(2, '0')}</h3>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3 p-[2px]">
              <motion.div 
                className="bg-emerald-500 h-full rounded-full shadow-[0_0_12px_#10b981]" 
                animate={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-[9px] text-emerald-400/60 mt-4 uppercase tracking-[0.2em] font-bold italic text-center">
              Target sync: {250 - (score % 250)} bits
            </p>
          </div>
        </aside>

        {/* Game Board Container */}
        <div 
          className="relative shrink-0 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 bg-black/40 backdrop-blur-sm touch-none"
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}></div>
          
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
          />

          {/* Overlays */}
          <AnimatePresence>
            {(isGameOver || isPaused) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-6 md:p-10"
              >
                <div className="text-center w-full">
                  {isGameOver ? (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                      <h2 className="text-5xl md:text-7xl font-black text-rose-500 mb-2 uppercase italic tracking-tighter shadow-rose-500/20 drop-shadow-2xl">Impact detected</h2>
                      <p className="text-slate-400 mb-8 uppercase tracking-[0.4em] text-[10px] md:text-xs font-black opacity-80">Sequence terminated at {score} units</p>
                      <button
                        onClick={resetGame}
                        className="px-10 py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/10 text-sm"
                      >
                        Initiate reboot
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                      <h2 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase italic tracking-tighter">Pause buffer</h2>
                      <p className="text-slate-400 mb-10 text-[10px] md:text-sm font-black uppercase tracking-[0.3em]">Swipe or use controls to pivot</p>
                      <button
                        onClick={() => setIsPaused(false)}
                        className="px-12 py-5 bg-emerald-500 text-white font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-500/40 text-sm"
                      >
                        Resume link
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar */}
        <aside className="w-56 space-y-4 hidden lg:block">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6 px-1">Top pilots</h3>
          <div className="space-y-3">
            <LeaderboardItem name="AlphaNex" score="128,400" rank={1} />
            <LeaderboardItem name="Z-Corp" score="95,150" rank={2} />
            <LeaderboardItem name="You" score={highScore.toString()} rank={3} isUser />
          </div>
        </aside>
      </main>

      {/* Footer Controls */}
      <footer className="h-auto py-8 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-col md:flex-row items-center justify-center px-6 md:px-10 gap-8 md:gap-24 shrink-0">
        <div className="flex flex-row items-center justify-center gap-10 md:gap-20 w-full md:w-auto">
          {/* D-Pad */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div />
            <ControlPadBtn icon={<ArrowUp size={22} />} onClick={() => handleMobileControl('UP')} active={direction === 'UP'} />
            <div />
            <ControlPadBtn icon={<ArrowLeft size={22} />} onClick={() => handleMobileControl('LEFT')} active={direction === 'LEFT'} />
            <ControlPadBtn icon={<ArrowDown size={22} />} onClick={() => handleMobileControl('DOWN')} active={direction === 'DOWN'} activeColor="bg-emerald-500" />
            <ControlPadBtn icon={<ArrowRight size={22} />} onClick={() => handleMobileControl('RIGHT')} active={direction === 'RIGHT'} />
          </div>

          <div className="h-20 w-[1px] bg-white/10 hidden md:block"></div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setIsPaused(p => !p)}
              className="px-8 md:px-10 py-4 md:py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-2xl transition-all active:scale-95 shadow-2xl shadow-emerald-500/20 text-xs tracking-widest"
            >
              {isPaused ? 'Resume' : 'Stop'}
            </button>
            <button 
               onClick={resetGame}
               className="px-8 md:px-10 py-4 md:py-5 bg-white/5 hover:bg-white/10 text-white font-bold uppercase rounded-2xl border border-white/10 transition-all active:scale-95 text-xs tracking-widest"
            >
              Reset
            </button>
          </div>
        </div>
      </footer>

      {/* Background Decorative Elements */}
      <div className="absolute -bottom-40 -left-40 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
}

function ControlPadBtn({ icon, onClick, active, activeColor = "bg-white" }: { icon: React.ReactNode, onClick: () => void, active: boolean, activeColor?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
        active 
          ? `${activeColor} border-transparent ${activeColor === 'bg-white' ?'text-black' : 'text-white'} shadow-emerald-500/20` 
          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {icon}
    </button>
  );
}

function LeaderboardItem({ name, score, rank, isUser = false }: { name: string, score: string, rank: number, isUser?: boolean }) {
  const colors = [ 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]', 'border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.2)]', 'border-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.2)]' ];
  return (
    <div className={`flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 shadow-sm border-l-2 transition-all hover:bg-white/10 ${isUser ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : colors[rank-1] || 'border-white/10'}`}>
      <span className={`text-sm ${isUser ? 'text-emerald-400 font-bold italic' : 'text-slate-300'}`}>{rank}. {name}</span>
      <span className="text-xs font-mono font-bold text-slate-500">{score}</span>
    </div>
  );
}

