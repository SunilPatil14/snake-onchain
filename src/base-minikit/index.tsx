// src/base-minikit/index.tsx
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, type ReactNode } from "react";

export default function BaseMiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
  const init = async () => {
    try {
      await sdk.actions.ready(); // ✅ Now awaited
      console.log("✅ MiniApp ready() called");
    } catch (error) {
      console.error("❌ MiniApp ready() failed:", error);
    }
  };
  
  init();
}, []);

  return <>{children}</>;
}
