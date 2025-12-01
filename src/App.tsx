import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SnakeGame from "./Components/SnakeGame";
import Leaderboard from "./Components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk";

const App: React.FC = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false);

  // ✅ Properly initialize Farcaster MiniApp SDK
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Call ready() to signal the app is loaded and hide splash screen
        await sdk.actions.ready();
        setIsReady(true);
        console.log("✅ MiniApp SDK ready() called successfully");
      } catch (error) {
        console.error("❌ MiniApp SDK initialization failed:", error);
        // Still set ready to true so app works in browser mode
        setIsReady(true);
      }
    };

    initMiniApp();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text drop-shadow-lg">
            🐍 Snake On-Chain
          </h1>

          <ConnectButton
            chainStatus="icon"
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>

        {/* Game + Leaderboard */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
          <SnakeGame
            setOnChainScore={setOnChainScore}
            setTxHash={setTxHash}
            setStatus={setStatus}
          />
          <Leaderboard txHash={txHash} />
        </div>

        {/* Status + Score */}
        {status && <div className="text-sm text-gray-300 mt-2">Status: {status}</div>}
        {onChainScore !== null && (
          <div className="text-sm text-green-400 mt-1">
            On-chain High Score: {onChainScore}
          </div>
        )}

        {/* MiniApp Debug Status (optional - remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-400">
            {isReady ? "✅ MiniApp Ready" : "⚙️ Initializing MiniApp..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;