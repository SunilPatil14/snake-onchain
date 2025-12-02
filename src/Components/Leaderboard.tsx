import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xcC8E9a9CeBF3b3a6dd21BD79A7756E3d5f4C9061";

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
  const [totalPlayers, setTotalPlayers] = useState<number>(0);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
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

      // Try the new getLeaderboard(topN) function first (if you redeployed)
      let addresses, scores;
      try {
        // Get top 100 players
        [addresses, scores] = await contract.getLeaderboard(100);
      } catch {
        // Fallback to old getLeaderboard() if new contract not deployed
        [addresses, scores] = await contract.getLeaderboard();
      }

      // Try to get total players count (new function)
      try {
        const total = await contract.getTotalPlayers();
        setTotalPlayers(Number(total));
      } catch {
        setTotalPlayers(addresses.length);
      }

      // Format and sort on frontend (in case contract doesn't sort)
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
          provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
        }
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        const handleScoreSubmitted = (player: string, score: bigint, timestamp: bigint) => {
          console.log(`🎯 New score from ${player}: ${score.toString()} at ${timestamp.toString()}`);
          // Reload leaderboard immediately
          setTimeout(() => {
            console.log("🔄 Refreshing leaderboard...");
            loadLeaderboard();
          }, 1500);
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
      console.log("✅ Transaction confirmed:", txHash);
      console.log("🔄 Refreshing leaderboard in 2 seconds...");
      // Wait a bit for blockchain to update
      setTimeout(() => {
        loadLeaderboard();
      }, 2000);
    }
  }, [txHash]);

  return (
    <div className="bg-gradient-to-tr from-green-900 to-green-700 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xl">🏆 Leaderboard</h2>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-all disabled:opacity-50"
          title="Refresh leaderboard"
        >
          🔄
        </button>
      </div>

      {totalPlayers > 0 && (
        <p className="text-xs text-green-200 mb-3 text-center">
          Total Players: {totalPlayers} • Showing Top {Math.min(leaderboard.length, 100)}
        </p>
      )}

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
                className={`flex justify-between items-center rounded-xl px-4 py-2 shadow-sm transition-all ${
                  i === 0
                    ? "bg-yellow-600/40 hover:bg-yellow-600/60"
                    : i === 1
                    ? "bg-gray-400/40 hover:bg-gray-400/60"
                    : i === 2
                    ? "bg-orange-600/40 hover:bg-orange-600/60"
                    : "bg-green-800/40 hover:bg-green-800/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`font-semibold min-w-[30px] ${
                      i === 0
                        ? "text-yellow-300"
                        : i === 1
                        ? "text-gray-300"
                        : i === 2
                        ? "text-orange-300"
                        : "text-green-300"
                    }`}
                  >
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
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