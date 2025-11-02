import React from "react";

export interface MiniAppConfig {
  name: string;
  description: string;
  url: string;
  iconUrl?: string;
}

export function MiniKitProvider({
  config,
  children,
}: {
  config: MiniAppConfig;
  children: React.ReactNode;
}) {
  // This is a placeholder wrapper for the Base MiniKit SDK
  // Once the SDK is published, you can replace this with the actual provider
  return <>{children}</>;
}
