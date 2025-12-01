import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xC309A58ffEc3A1060788318a2930296531c7f0F5";

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

interface SnakeGameProps {
  setOnChainScore: React.Dispatch<React.SetStateAction<number | null>>;
  setTxHash: React.Dispatch<React.SetStateAction<string | null>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SnakeGame: React.FC<SnakeGameProps> = ({
  setOnChainScore,
  setTxHash,
  setStatus,
}) => {
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
    const occupied = new Set(snakeArr.map((p) => `${p.x},${p.y}`));
    for (let i = 0; i < 500; i++) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!occupied.has(`${x},${y}`)) return { x, y };
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
    if (!running || snake.length === 0) return;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    head.x = (head.x + cols) % cols;
    head.y = (head.y + rows) % rows;

    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      setRunning(false);
      setGameOver(true);
      setStatus("💀 Game Over!");
      return;
    }

    let newSnake = [head, ...snake.slice(0, -1)];
    if (tablet && head.x === tablet.x && head.y === tablet.y) {
      newSnake = [head, ...snake];
      setScore((s) => s + 1);
      setTablet(spawnTablet(newSnake));
      setMoveDelay((d) => Math.max(d - 15, 120));
    }
    setSnake(newSnake);
  };

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(updateSnake, moveDelay);
    return () => clearTimeout(id);
  }, [snake, dir, running, moveDelay, tablet]);

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
      ctx.fillRect(
        tablet.x * cellSize + 2,
        tablet.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );
    }

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#60a5fa" : "#3b82f6";
      ctx.fillRect(
        s.x * cellSize + 1,
        s.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
  }, [snake, tablet, cols, rows, cellSize]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running) return;
      const map: Record<string, Direction> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      setDir((d) => {
        if (newDir.x + d.x === 0 && newDir.y + d.y === 0) return d;
        return newDir;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0, startY = 0;

    const handleStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    };
    const handleEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      setDir((d) => {
        if (Math.abs(dx) > Math.abs(dy))
          return dx > 0 && d.x !== -1 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        return dy > 0 && d.y !== -1 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      });
    };

    canvas.addEventListener("touchstart", handleStart);
    canvas.addEventListener("touchend", handleEnd);
    return () => {
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, []);

  const submitOnChain = async () => {
    let txHash = "";
    
    try {
      if (!window.ethereum) {
        setStatus("⚠️ No wallet found. Please install MetaMask.");
        return;
      }
      
      if (score <= 0) {
        setStatus("⚠️ Play first before submitting!");
        return;
      }

      setStatus("⏳ Preparing transaction...");
      
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      // Check cooldown
      try {
        const [, lastPlayed] = await contract.getMyScore();
        const cooldownTime = await contract.COOLDOWN_TIME();
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (lastPlayed > 0 && currentTime < Number(lastPlayed) + Number(cooldownTime)) {
          const remainingTime = Number(lastPlayed) + Number(cooldownTime) - currentTime;
          const minutes = Math.floor(remainingTime / 60);
          setStatus(`⏰ Cooldown active. Wait ${minutes} minutes.`);
          return;
        }
      } catch (cooldownErr) {
        console.log("Cooldown check skipped:", cooldownErr);
      }

      setStatus("⏳ Sending transaction...");

      const tx = await contract.submitScore(score);
      txHash = tx.hash;
      
      console.log("Transaction sent:", txHash);
      setStatus("⏳ Waiting for confirmation...");

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Check if transaction was successful
      if (receipt && receipt.status === 1) {
        console.log("Transaction confirmed:", receipt);
        setTxHash(txHash);
        setStatus("✅ Score submitted successfully!");

        // Fetch updated score - wrap in try/catch to avoid breaking on error
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          const [highScore] = await contract.getMyScore();
          setOnChainScore(Number(highScore));
        } catch (scoreErr) {
          console.log("Could not fetch updated score:", scoreErr);
          // Transaction still succeeded, just couldn't fetch score
        }
      } else {
        setStatus("❌ Transaction failed on blockchain");
      }
      
    } catch (err: any) {
      console.error("Full error object:", err);
      
      // If we have a transaction hash, the transaction might have succeeded
      if (txHash) {
        setTxHash(txHash);
        setStatus("⚠️ Transaction sent. Check explorer for status.");
        return;
      }
      
      // Handle specific error types
      const errorMessage = err?.message || err?.reason || String(err);
      
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || errorMessage.includes("user rejected")) {
        setStatus("❌ Transaction rejected by user");
      } else if (errorMessage.includes("Cooldown active")) {
        setStatus("⏰ Cooldown active. Please wait 1 hour.");
      } else if (errorMessage.includes("insufficient funds")) {
        setStatus("❌ Insufficient funds for gas");
      } else if (errorMessage.includes("execution reverted")) {
        setStatus("❌ Transaction reverted. Check score/cooldown.");
      } else {
        // Show a clean error message
        const cleanError = errorMessage.substring(0, 100);
        setStatus(`❌ Error: ${cleanError}`);
      }
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
          disabled={gameOver}
          className="px-4 py-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400 transition-transform transform hover:scale-105 shadow-md disabled:opacity-50"
        >
          {running ? "Pause" : "Resume"}
        </button>
      </div>

      <div className="text-lg font-semibold text-white mt-3">
        🧮 Score: {score}
      </div>

      <div className="flex flex-col items-center w-full">
        <button
          onClick={submitOnChain}
          disabled={score === 0}
          className="w-[90vw] max-w-[600px] mt-4 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow-md transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit On-chain (FREE - Gas Only)
        </button>

        {status && (
          <p
            className={`mt-2 text-sm font-semibold text-center max-w-[600px] px-4 ${
              status.includes("✅")
                ? "text-green-400"
                : status.includes("❌")
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;