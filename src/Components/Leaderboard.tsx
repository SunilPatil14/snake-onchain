import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xC309A58ffEc3A1060788318a2930296531c7f0F5";

interface LeaderboardEntry {
  address: string;
  score: number;
}

interface LeaderboardProps {
  txHash: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ txHash }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      setError(null);
      
      // Use public RPC if no wallet is connected
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Use Base Sepolia public RPC
        provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      const [addresses, scores] = await contract.getLeaderboard();

      const formatted: LeaderboardEntry[] = addresses
        .map((addr: string, i: number) => ({
          address: addr,
          score: Number(scores[i]),
        }))
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);

      setLeaderboard(formatted);
    } catch (err: any) {
      console.error("Error loading leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    // Set up event listener for score submissions
    const setupEventListener = async () => {
      try {
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
        }
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        const handleScoreSubmitted = (player: string, score: number, timestamp: number) => {
          console.log(`New score from ${player}: ${score} at ${timestamp}`);
          // Reload leaderboard after a small delay to ensure blockchain has updated
          setTimeout(() => loadLeaderboard(), 2000);
        };

        contract.on("ScoreSubmitted", handleScoreSubmitted);
        
        return () => {
          contract.off("ScoreSubmitted", handleScoreSubmitted);
        };
      } catch (err) {
        console.error("Error setting up event listener:", err);
      }
    };

    setupEventListener();
  }, []);

  // Reload when new transaction is confirmed
  useEffect(() => {
    if (txHash) {
      // Wait a bit for blockchain to update
      setTimeout(() => loadLeaderboard(), 3000);
    }
  }, [txHash]);

  return (
    <div className="bg-gradient-to-tr from-green-900 to-green-700 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto text-white">
      <h2 className="font-bold text-xl mb-4 text-center">🏆 Leaderboard</h2>

      {loading ? (
        <p className="text-sm text-gray-300 text-center animate-pulse">Loading...</p>
      ) : error ? (
        <div className="text-center">
          <p className="text-sm text-red-300 mb-2">{error}</p>
          <button
            onClick={loadLeaderboard}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            Retry
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-gray-300 text-center">No players yet. Be the first!</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-800 rounded-lg">
          <ul className="space-y-2">
            {leaderboard.map((item, i) => (
              <li
                key={`${item.address}-${i}`}
                className="flex justify-between items-center bg-green-800/40 rounded-xl px-4 py-2 shadow-sm hover:bg-green-800/60 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="text-yellow-400 font-semibold min-w-[30px]">
                    #{i + 1}
                  </span>
                  <span className="truncate max-w-[120px] sm:max-w-[160px] font-mono text-sm">
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