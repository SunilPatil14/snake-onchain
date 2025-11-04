import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SnakeGame from "./Components/SnakeGame";
import Leaderboard from "./Components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk"; // ✅ Base MiniApp SDK

const App: React.FC = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false); // for debug indicator

  // ✅ Initialize Base MiniApp SDK
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Detect whether running in Base MiniApp / Farcaster frame
        const baseSdk = (window as any).base || sdk;

        if (baseSdk?.actions?.ready) {
          await baseSdk.actions.ready(); // Signal app is ready
          setIsReady(true);
          console.log("✅ MiniApp Ready called successfully");
        } else {
          console.log("⚠️ Base MiniApp SDK not detected — running in browser mode");
        }
      } catch (error) {
        console.error("❌ MiniApp SDK initialization failed:", error);
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

        {/* MiniApp Debug Status */}
        <div className="mt-4 text-xs text-gray-400">
          {isReady ? "✅ MiniApp Ready" : "⚙️ Initializing MiniApp..."}
        </div>
      </div>
    </div>
  );
};

export default App;
