import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SnakeGame from "./Components/SnakeGame";
import Leaderboard from "./Components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk";

const App: React.FC = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isSDKReady, setIsSDKReady] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      try {
        // Check if SDK is available
        if (!sdk) {
          console.error("SDK not available");
          return;
        }

        // Get context to verify SDK is working
        const context = sdk.context;
        console.log("✅ SDK Context:", context);

        // Call ready ONLY after your app components are loaded
        // This should be called when your app is actually ready to display
        await sdk.actions.ready({ disableNativeGestures: false });
        console.log("✅ SDK ready called successfully");
        setIsSDKReady(true);
      } catch (error) {
        console.error("❌ SDK initialization error:", error);
        // Even if SDK fails, allow app to work for non-miniapp environments
        setIsSDKReady(true);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initSDK();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Don't render content until SDK is ready
  if (!isSDKReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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
      </div>
    </div>
  );
};

export default App;