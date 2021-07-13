import { Wallet } from "ethers";
import Chain, { getChains } from "./chain";
import provider from "./provider";

const walletAddress = process.env.WALLET_ADDRESS;
const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;

if (!walletAddress || !walletPrivateKey) {
  console.log("wallet not set");
  process.exit(1);
}

const signer: {
  [chain in Chain]: Wallet;
} = {} as any;

for (const chain of getChains()) {
  signer[chain] = new Wallet(walletPrivateKey, provider[chain]);
}

export default signer;
