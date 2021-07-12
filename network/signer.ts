import { Wallet } from "ethers";
import { kovanProvider, rinkebyProvider } from "./provider";

const walletAddress = process.env.WALLET_ADDRESS;
const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;

if (!walletAddress || !walletPrivateKey) {
  console.log("wallet not set");
  process.exit(1);
}

export const kovanSigner = new Wallet(walletPrivateKey, kovanProvider);
export const rinkebySigner = new Wallet(walletPrivateKey, rinkebyProvider);
