import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SnakeGame from "./Components/SnakeGame";
import Leaderboard from "./Components/Leaderboard";

const App: React.FC = () => {
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainScore, setOnChainScore] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, msg]);
  };

  useEffect(() => {
    // Add retry logic
const initSDK = async () => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      await sdk.actions.ready();
      console.log("✅ Ready called successfully!");
      break;
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error);
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
};
    // Call immediately
    initSDK();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
      {/* Debug Panel - Remove this after fixing */}
      <div className="fixed top-0 left-0 right-0 bg-black/90 text-xs text-green-400 p-2 max-h-32 overflow-y-auto z-50 font-mono">
        <div className="font-bold mb-1">🐛 DEBUG LOG:</div>
        {debugInfo.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      <div className="w-full max-w-6xl space-y-6 mt-36">
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