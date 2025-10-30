// minikit.config.ts
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  miniapp: {
    version: "1",
    name: "Snake Game OnChain",
    subtitle: "Classic Snake meets Web3",
    description:
      "Play Snake and submit your score onchain by sending 0.00001 ETH to contract 0x20774e567dC27039bb95aa4289A1636cA008Edad on Base. Simple, fun, and decentralized!",
    screenshotUrls: ["https://snake-game-xyz.vercel.app"],
    iconUrl: "https://snake-game-xyz.vercel.app",
    splashImageUrl: "https://snake-game-xyz.vercel.app",
    splashBackgroundColor: "#000000",
    homeUrl: "https://snake-game-xyz.vercel.app",
    webhookUrl: "https://snake-game-xyz.vercel.app/api/webhook",
    primaryCategory: "gaming",
    tags: ["game", "arcade", "snake", "base", "onchain"],
    heroImageUrl: "https://snake-game-xyz.vercel.app",
    tagline: "Eat. Grow. Win — now OnChain 🕹️",
    ogTitle: "Snake Game on Base",
    ogDescription:
      "An onchain twist to the retro Snake game — play, score, and earn bragging rights on Base.",
    ogImageUrl: "https://snake-game-xyz.vercel.app",
  },
} as const;
