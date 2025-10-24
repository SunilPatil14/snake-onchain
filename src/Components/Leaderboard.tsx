import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../SnakeOnChainABI.json";

const CONTRACT_ADDRESS = "0xB62A494B9488ec26a41b85Ae1E3b390443846862";

interface LeaderboardProps {
  txHash: string | null;
}

interface Player {
  address: string;
  score: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ txHash }) => {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
  try {
    if (!(window as any).ethereum) return;

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

    const [addresses, scores] = await contract.getLeaderboard();

    // Ensure arrays exist and have the same length
    if (!addresses || !scores || addresses.length !== scores.length) {
      setLeaderboard([]);
      return;
    }

    const list = addresses.map((addr: string, i: number) => ({
      address: addr,
      score: Number(scores[i] || 0), // fallback to 0 if score missing
    }));

    setLeaderboard(list);
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
    setLeaderboard([]);
  }
};


    fetchLeaderboard();
  }, [txHash]);

  return (
 <div className="bg-gradient-to-tr from-green-900 to-green-700 rounded-2xl shadow-xl p-5 w-full max-w-sm mx-auto text-white">
  <h2 className="font-bold text-xl mb-4 text-center">🏆 Leaderboard (Top 5)</h2>

  {leaderboard.length === 0 ? (
    <p className="text-sm text-gray-300 text-center">No players yet.</p>
  ) : (
    <ul className="text-sm space-y-3">
      {leaderboard.slice(0, 5).map((item, i) => (
        <li
          key={i}
          className="flex justify-between items-center bg-green-800/40 rounded-lg px-4 py-2 shadow-sm hover:bg-green-800/60 transition-all"
        >
          <span className="flex items-center gap-2">
            <span className="text-yellow-400 font-semibold">#{i + 1}</span>
            <span className="truncate max-w-[100px] sm:max-w-[140px]">
              {item.address.slice(0, 6)}...{item.address.slice(-4)}
            </span>
          </span>
          <span className="font-bold text-green-300">{item.score}</span>
        </li>
      ))}
    </ul>
  )}
</div>


  );
};

export default Leaderboard;
