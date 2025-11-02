// src/base-minikit/index.tsx
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, type ReactNode } from "react";

export default function BaseMiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    sdk.actions.ready(); // tells Farcaster your app is ready
  }, []);

  return <>{children}</>;
}
