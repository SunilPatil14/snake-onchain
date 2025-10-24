import React, { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import contractABI from "./SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xe6270380fd9A3940637548ff343C228F35771a0D";

type Point = { x: number; y: number };
type Direction = { x: number; y: number };

const SnakeOnchainGame: React.FC = () => {
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
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ address: string; score: number }[]>([]);


  // Initialize grid
  useEffect(() => {
    const cw = Math.floor(window.innerWidth * 0.6);
    const ch = Math.floor(window.innerHeight * 0.6);
    setCols(Math.floor(cw / cellSize));
    setRows(Math.floor(ch / cellSize));
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

  // Movement loop
  useEffect(() => {
    if (!running) return;
    const timeout = setTimeout(updateSnake, moveDelay);
    return () => clearTimeout(timeout);
  }, [snake, dir, running, tablet, moveDelay]);

  // Draw snake and tablet
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

  // Keyboard controls
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

  // ✅ Touch controls
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

  // ✅ Fetch on-chain score
  const fetchOnChainScore = async () => {
    try {
      if (!(window as any).ethereum) return;

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const [highScore] = await contract.getMyScore();
      setOnChainScore(Number(highScore));
    } catch (err) {
      console.error("Failed to fetch on-chain score:", err);
    }
  };

  useEffect(() => {
    if ((window as any).ethereum) {
      fetchOnChainScore();
      (window as any).ethereum.on("accountsChanged", fetchOnChainScore);
    }
    return () => {
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener("accountsChanged", fetchOnChainScore);
      }
    };
  }, []);

  // ✅ On-chain submission
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
      const tx = await contract.submitScore(score, { gasLimit: 100000 });
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("✅ Score submitted successfully!");
      fetchOnChainScore(); // ✅ Refresh score after submit
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Failed: " + (err?.message || "Transaction failed"));
    }
  };

  useEffect(() => {
  const fetchLeaderboard = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      const [addresses, scores] = await contract.getLeaderboard();

      const list = addresses.map((addr: string, i: number) => ({
        address: addr,
        score: Number(scores[i])
      }));

      setLeaderboard(list);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    }
  };

  fetchLeaderboard();
}, [txHash]); // refresh when you submit a score


  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col items-center justify-center p-4">
  <div className="w-full max-w-6xl space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
        🐍 Snake On-Chain
      </h1>
      <ConnectButton chainStatus="icon" accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
    </div>

    {/* Game & Info */}
    <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
      {/* Game Canvas */}
      <div className="flex flex-col items-center space-y-4">
        <canvas ref={canvasRef} className="rounded-xl border border-slate-700 shadow-lg touch-none" />
        <div className="flex flex-wrap gap-3 justify-center items-center text-sm">
          <button onClick={resetGame} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition">
            {gameOver ? "Restart Game" : "Start / Restart"}
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="px-4 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-400 transition"
            disabled={gameOver}
          >
            {running ? "Pause" : "Resume"}
          </button>
          <div className="ml-2 text-center">
            <div className="text-lg">Score: <strong>{score}</strong></div>
            {onChainScore !== null && (
              <div className="text-xs text-green-400">On-chain High: <strong>{onChainScore}</strong></div>
            )}
          </div>
        </div>
      </div>

      {/* Info & Leaderboard */}
      <div className="flex flex-col w-full md:w-80 space-y-4">
        {/* Controls */}
        <div className="p-4 bg-slate-800 rounded shadow">
          <h2 className="font-semibold mb-2 text-lg">🎮 Controls</h2>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>Arrow keys / WASD / Swipe to move</li>
            <li>Eat green tablets to grow</li>
            <li>Avoid hitting yourself!</li>
          </ul>
        </div>

        {/* Submit */}
        <div className="p-4 bg-slate-800 rounded shadow">
          <h2 className="font-semibold mb-2 text-lg">🧾 Submit Result</h2>
          <p className="text-sm mb-2">Send your score to Base chain.</p>
          <button
            onClick={submitOnChain}
            className="w-full px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition disabled:opacity-50"
          >
            Submit On-chain
          </button>
          {txHash && (
            <div className="mt-2 text-xs">
              Tx:{" "}
              <a
                href={`https://basescan.org/tx/${txHash}`}
                className="underline text-blue-400"
                target="_blank"
                rel="noreferrer"
              >
                {txHash.slice(0, 10)}...
              </a>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-300">Status: {status}</div>
        </div>

        {/* Leaderboard */}
        <div className="p-4 bg-slate-800 rounded shadow">
          <h2 className="font-semibold mb-2 text-lg">🏆 Leaderboard (Top 5)</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400">No players yet.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {leaderboard.slice(0, 5).map((item, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>
                    <span className="text-yellow-400 font-semibold">#{i + 1}</span> {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </span>
                  <span className="font-bold text-green-400">{item.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default SnakeOnchainGame;
