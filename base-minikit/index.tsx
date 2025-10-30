import React from "react";
import type { MiniAppConfig } from "./types";

/**
 * Temporary mock MiniKitProvider
 * This acts as a placeholder until the official @base-org/minikit package is published.
 * You can safely use it for Base Mini App compatibility and swap later.
 */
export function MiniKitProvider({
  config,
  children,
}: {
  config: MiniAppConfig;
  children: React.ReactNode;
}) {
  // You can add custom logic or debug logging here if needed.
  console.log("MiniKit mock initialized with config:", config);

  // Just render children for now
  return <>{children}</>;
}
