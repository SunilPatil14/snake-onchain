import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0x20774e567dC27039bb95aa4289A1636cA008Edad";

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

interface SnakeGameProps {
  setOnChainScore: React.Dispatch<React.SetStateAction<number | null>>;
  setTxHash: React.Dispatch<React.SetStateAction<string | null>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

const SnakeGame: React.FC<SnakeGameProps> = ({ setOnChainScore, setTxHash, setStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [moveDelay, setMoveDelay] = useState(300);
  const [snake, setSnake] = useState<Point[]>([]);
  const [dir, setDir] = useState<Direction>({ x: 1, y: 0 });
  const [tablet, setTablet] = useState<Point | null>(null);
  const [cellSize] = useState(20);
  const [cols, setCols] = useState(20);
  const [rows, setRows] = useState(20);

  // ✅ Dynamically adjust grid size
  useEffect(() => {
    const resize = () => {
      const cw = Math.floor(window.innerWidth * 0.6);
      const ch = Math.floor(window.innerHeight * 0.6);
      setCols(Math.floor(cw / cellSize));
      setRows(Math.floor(ch / cellSize));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [cellSize]);

  const spawnTablet = (snakeArr: Point[]): Point => {
    const positions = new Set(snakeArr.map((p) => `${p.x},${p.y}`));
    for (let i = 0; i < 1000; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!positions.has(`${x},${y}`)) return { x, y };
    }
    return { x: 0, y: 0 };
  };

  const resetGame = () => {
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    const startSnake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
    ];
    setSnake(startSnake);
    setDir({ x: 1, y: 0 });
    setScore(0);
    setMoveDelay(300);
    setTablet(spawnTablet(startSnake));
    setRunning(true);
    setGameOver(false);
    setTxHash(null);
    setStatus("");
  };

  const updateSnake = () => {
    if (snake.length === 0) return;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    head.x = (head.x + cols) % cols;
    head.y = (head.y + rows) % rows;

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      setRunning(false);
      setGameOver(true);
      setStatus("💀 Game Over!");
      return;
    }

    let newSnake = [head, ...snake.slice(0, snake.length - 1)];

    if (tablet && head.x === tablet.x && head.y === tablet.y) {
      newSnake = [{ ...head }, ...snake];
      setSnake(newSnake);
      setScore((s) => s + 1);
      setTablet(spawnTablet(newSnake));
      setMoveDelay((d) => Math.max(d - 20, 150));
    } else {
      setSnake(newSnake);
    }
  };

  // ✅ Snake movement interval
  useEffect(() => {
    if (!running) return;
    const timeout = setTimeout(updateSnake, moveDelay);
    return () => clearTimeout(timeout);
  }, [snake, dir, running, tablet, moveDelay]);

  // ✅ Draw snake and tablet
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = cols * cellSize;
    const height = rows * cellSize;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    if (tablet) {
      ctx.fillStyle = "#10b981";
      ctx.fillRect(tablet.x * cellSize + 2, tablet.y * cellSize + 2, cellSize - 4, cellSize - 4);
    }

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#60a5fa" : "#3b82f6";
      ctx.fillRect(s.x * cellSize + 1, s.y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
  }, [snake, tablet, cols, rows, cellSize]);

  // ✅ Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      const allowedKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"];
      if (!allowedKeys.includes(e.key)) return;
      e.preventDefault();

      setDir((d) => {
        if ((e.key === "ArrowUp" || e.key === "w") && d.y !== 1) return { x: 0, y: -1 };
        if ((e.key === "ArrowDown" || e.key === "s") && d.y !== -1) return { x: 0, y: 1 };
        if ((e.key === "ArrowLeft" || e.key === "a") && d.x !== 1) return { x: -1, y: 0 };
        if ((e.key === "ArrowRight" || e.key === "d") && d.x !== -1) return { x: 1, y: 0 };
        return d;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  // ✅ Touch (mobile swipe) controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        setDir((d) => (dx > 0 && d.x !== -1 ? { x: 1, y: 0 } : { x: -1, y: 0 }));
      } else {
        setDir((d) => (dy > 0 && d.y !== -1 ? { x: 0, y: 1 } : { x: 0, y: -1 }));
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

 // ✅ Submit score to Base chain
const submitOnChain = async () => {
  try {
    if (!(window as any).ethereum) {
      setStatus("⚠️ No wallet found.");
      return;
    }
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    setStatus("⏳ Sending transaction...");

    // ✅ FIXED: Send required fee of 0.0001 ETH
    const tx = await contract.submitScore(score, {
      value: ethers.parseEther("0.00001"),
      gasLimit: 100000,
    });

    await tx.wait();

    setTxHash(tx.hash);
    setStatus("✅ Score submitted successfully!");

    const [highScore] = await contract.getMyScore();
    setOnChainScore(Number(highScore));
  } catch (err: any) {
    if (err?.code === 4001) setStatus("❌ User rejected");
    else setStatus("❌ Transaction failed");
    console.error(err);
  }
};


  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-[90vw] max-w-[600px] aspect-square rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-2xl bg-slate-900 shadow-inner touch-none"
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-center items-center mt-6">
        <button
          onClick={resetGame}
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md"
        >
          {gameOver ? "Restart Game" : "Start / Restart"}
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-4 py-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 transition-transform transform hover:scale-105 shadow-md"
          disabled={gameOver}
        >
          {running ? "Pause" : "Resume"}
        </button>
      </div>

      <div className="text-lg font-semibold text-white mt-3 animate-pulse">
        🧮 Score: {score}
      </div>

      <div className="flex flex-col items-center w-full">
  <button
    onClick={submitOnChain}
    className="w-[90vw] max-w-[600px] mt-4 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow-md transition-transform transform hover:scale-105"
  >
    Submit On-chain
  </button>

  {/* ✅ Status Message */}
  {/** Only show when status is not empty */}
  {status && (
    <p
      className={`mt-2 text-sm font-semibold ${
        status.includes("✅")
          ? "text-green-400"
          : status.includes("❌")
          ? "text-red-400"
          : "text-yellow-400"
      }`}
    >
      Status: {status}
    </p>
  )}
</div>

    </div>
  );
};

export default SnakeGame;
