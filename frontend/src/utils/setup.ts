import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";

export const sdk = new CoinbaseWalletSDK({
  appName: "DevChain AI",
  appChainIds: [84532],
});
