import React, { useEffect, createContext, useContext, useState, type ReactNode } from "react";
import sdk from "@farcaster/miniapp-sdk";

interface MiniAppContextType {
  sdk: typeof sdk;
  isReady: boolean;
}

const MiniAppContext = createContext<MiniAppContextType | null>(null);

export const useMiniApp = () => {
  const context = useContext(MiniAppContext);
  if (!context) throw new Error("useMiniApp must be used within BaseMiniKitProvider");
  return context;
};

interface BaseMiniKitProviderProps {
  children: ReactNode;
}

export const BaseMiniKitProvider: React.FC<BaseMiniKitProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await sdk.actions.ready();
        console.log("✅ MiniApp SDK ready");
        setIsReady(true);
      } catch (err) {
        console.error("MiniApp SDK init failed:", err);
      }
    }
    init();
  }, []);

  return (
    <MiniAppContext.Provider value={{ sdk, isReady }}>
      {children}
    </MiniAppContext.Provider>
  );
};
