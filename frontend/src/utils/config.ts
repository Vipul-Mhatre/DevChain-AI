import { http, createConfig } from "@wagmi/core";
import {
  mainnet,
  sepolia,
  baseSepolia,
  optimismSepolia,
} from "@wagmi/core/chains";

// Define Flare Testnet (Coston)
const flareTestnet = {
  id: 114,
  name: 'Flare Testnet (Coston)',
  network: 'coston',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    public: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
    default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Flare Explorer', url: 'https://coston2.testnet.flarescan.com' },
  },
};

// use NODE_ENV to not have to change config based on where it's deployed
export const NEXT_PUBLIC_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://onchain-app-template.vercel.app";
// Add your API KEY from the Coinbase Developer Portal
export const NEXT_PUBLIC_ONCHAINKIT_API_KEY =
  process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
export const NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
export const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;

export const config = createConfig({
  chains: [baseSepolia, optimismSepolia, flareTestnet],
  transports: {
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [flareTestnet.id]: http(),
  },
});