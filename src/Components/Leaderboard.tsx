import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0x20774e567dC27039bb95aa4289A1636cA008Edad";

interface LeaderboardEntry {
  address: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      if (!(window as any).ethereum) return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      // Fetch data from contract
      const [addresses, scores] = await contract.getLeaderboard();

      const formatted: LeaderboardEntry[] = addresses
        .map((addr: string, i: number) => ({
          address: addr,
          score: Number(scores[i]),
        }))
        .sort((a, b) => b.score - a.score);

      setLeaderboard(formatted);
    } catch (err) {
      console.error("Error loading leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    // Listen for on-chain event
    const handleScoreSubmitted = (player: string, score: number) => {
      console.log(`New score from ${player}: ${score}`);
      loadLeaderboard();
    };

    contract.on("ScoreSubmitted", handleScoreSubmitted);

    return () => {
      contract.off("ScoreSubmitted", handleScoreSubmitted);
    };
  }, []);

  return (
    <div className="bg-gradient-to-tr from-green-900 to-green-700 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto text-white">
      <h2 className="font-bold text-xl mb-4 text-center">🏆 Leaderboard (Top 100)</h2>

      {loading ? (
        <p className="text-sm text-gray-300 text-center animate-pulse">
          Loading...
        </p>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-gray-300 text-center">No players yet.</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-800 rounded-lg">
          <ul className="space-y-2">
            {leaderboard.slice(0, 100).map((item, i) => (
              <li
                key={i}
                className="flex justify-between items-center bg-green-800/40 rounded-xl px-4 py-2 shadow-sm hover:bg-green-800/60 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="text-yellow-400 font-semibold">#{i + 1}</span>
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </span>
                </span>
                <span className="font-bold text-green-300">{item.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
