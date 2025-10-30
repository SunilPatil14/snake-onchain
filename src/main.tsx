import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { MiniKitProvider } from "../base-minikit";



// RainbowKit + Wagmi
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { base, mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { minikitConfig } from "./minikit.config";

const config = getDefaultConfig({
  appName: "Snake Onchain",
  projectId: "c37202074717747dcc0c72eb5d9e52a5",
  chains: [base, mainnet, sepolia],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
            <MiniKitProvider config={minikitConfig}>
          <App />
          </MiniKitProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
