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

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use public RPC if no wallet is connected
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Use Base mainnet public RPC
        provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      // Call getLeaderboard() WITHOUT parameters (your contract returns top 5)
      const [addresses, scores] = await contract.getLeaderboard();

      console.log("📊 Raw leaderboard data:", { addresses, scores });

      // Format leaderboard entries - contract already sorts them
      const formatted: LeaderboardEntry[] = addresses
        .map((addr: string, i: number) => ({
          address: addr,
          score: Number(scores[i]),
        }))
        .filter((entry: LeaderboardEntry) => entry.score > 0); // Only show players with scores

      setLeaderboard(formatted);
      
      console.log("✅ Leaderboard loaded:", formatted.length, "players");
    } catch (err: any) {
      console.error("❌ Error loading leaderboard:", err);
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
          console.log(`🎯 New score event: ${player} scored ${score.toString()}`);
          // Reload leaderboard after score submission
          setTimeout(() => {
            console.log("🔄 Refreshing leaderboard...");
            loadLeaderboard();
          }, 2000);
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
      console.log("✅ New transaction detected:", txHash);
      console.log("🔄 Refreshing leaderboard in 3 seconds...");
      // Wait for blockchain to update
      setTimeout(() => {
        loadLeaderboard();
      }, 3000);
    }
  }, [txHash]);

  return (
    <div className="bg-gradient-to-tr from-green-900 to-green-700 rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-xl">🏆 Top 5 Players</h2>
        <button
          onClick={loadLeaderboard}
          disabled={loading}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-all disabled:opacity-50"
          title="Refresh leaderboard"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

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
        <p className="text-sm text-gray-300 text-center">No players yet. Be the first! 🎮</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((item, i) => (
            <div
              key={`${item.address}-${i}`}
              className={`flex justify-between items-center rounded-xl px-4 py-3 shadow-sm transition-all ${
                i === 0
                  ? "bg-yellow-600/50 hover:bg-yellow-600/70 border-2 border-yellow-400"
                  : i === 1
                  ? "bg-gray-400/50 hover:bg-gray-400/70 border-2 border-gray-300"
                  : i === 2
                  ? "bg-orange-600/50 hover:bg-orange-600/70 border-2 border-orange-400"
                  : "bg-green-800/40 hover:bg-green-800/60"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`text-2xl ${i < 3 ? 'animate-bounce' : ''}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-mono text-sm">
                  {item.address.slice(0, 6)}...{item.address.slice(-4)}
                </span>
              </span>
              <span className={`font-bold text-lg ${
                i === 0 ? 'text-yellow-200' : i === 1 ? 'text-gray-200' : i === 2 ? 'text-orange-200' : 'text-green-200'
              }`}>
                {item.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;