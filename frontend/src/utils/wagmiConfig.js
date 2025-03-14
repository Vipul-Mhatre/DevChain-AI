"use client";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { useMemo } from "react";
import { http, createConfig } from "wagmi";
import { base, baseSepolia, optimismSepolia, optimism, flareTestnet, flare } from "wagmi/chains";
import { NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID } from "./config";

export function useWagmiConfig() {
  const projectId = NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
  if (!projectId) {
    const providerErrMessage =
      "To connect to all Wallets you need to provide a NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID env variable";
    throw new Error(providerErrMessage);
  }

  return useMemo(() => {
    // Define wallet connectors with MetaMask in "Recommended Wallets"
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Recommended Wallets",
          wallets: [metaMaskWallet],
        },
        {
          groupName: "Other Wallets",
          wallets: [coinbaseWallet ],
        },
      ],
      {
        appName: "onchainkit",
        projectId,
      }
    );

    // Create Wagmi config with reordered chains (Base moved down)
    const wagmiConfig = createConfig({
      chains: [optimism, optimismSepolia, flare, flareTestnet, base, baseSepolia],
      multiInjectedProviderDiscovery: false, // Turn off injected provider discovery
      connectors,
      ssr: true,
      transports: {
        [optimism.id]: http(),
        [optimismSepolia.id]: http(),
        [flare.id]: http(),
        [flareTestnet.id]: http(),
        [base.id]: http(),
        [baseSepolia.id]: http(),
      },
    });

    return wagmiConfig;
  }, [projectId]);
}